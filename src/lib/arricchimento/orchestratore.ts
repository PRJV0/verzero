import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { adapterAteco } from "./ateco";
import {
  adapterAccredia,
  adapterAgenziaEntrate,
  adapterCamerale,
  adapterIniPec,
} from "./fonti-vincolate";
import { adapterVies } from "./vies";
import type { Adapter, ContestoImpresa, EsitoFonte } from "./tipi";

/**
 * ORCHESTRATORE DELL'ARRICCHIMENTO (SPEC §12.H, tappa 2.1).
 *
 * Interroga le fonti una dopo l'altra e scrive in company_fields con
 * provenienza 'motore', fonte e stato 'da confermare'. La scrittura passa
 * dalla service_role perché i permessi a colonna della 2.0 vietano
 * espressamente all'utente di dichiarare un dato come «recuperato dal
 * Motore»: quella provenienza resta una firma del back-office, e i test
 * RLS lo verificano.
 *
 * Disciplina di robustezza:
 *  - ogni fonte è isolata: se cade, si continua con le altre;
 *  - se una fonte non risponde con certezza, non si scrive NULLA;
 *  - ogni tentativo lascia una riga nel registro tecnico, anche quando
 *    non produce dati: è lì che si vede quali fonti reggono davvero;
 *  - un campo già CONFERMATO dall'utente non viene mai sovrascritto: la
 *    parola del cliente vale più di quella di una banca dati.
 */

/** L'ordine conta: prima le fonti che producono dati altrui usabili. */
const ADAPTER: Adapter[] = [
  adapterVies,
  adapterAgenziaEntrate,
  adapterIniPec,
  adapterCamerale,
  adapterAteco, // per ultimo: decodifica ciò che le altre hanno portato
  adapterAccredia,
];

/** Le fonti come le vede il cliente, per il pannello di avanzamento. */
export const FONTI_DICHIARATE = ADAPTER.map((a) => ({
  chiave: a.chiave,
  nome: a.nome,
  cosaRecupera: a.cosaRecupera,
  stato: a.stato,
  vincolo: a.vincolo ?? null,
}));

export type EsitoArricchimentoFonte = {
  chiave: string;
  nome: string;
  esito: EsitoFonte;
  campiScritti: number;
  /** Le etichette dei campi toccati, per dirlo al cliente. */
  campi: string[];
  durataMs: number;
  /** Solo per le fonti spente: il vincolo, in chiaro. */
  vincolo?: string;
};

export type Innesco = "ordine" | "manuale";

/**
 * Esegue l'arricchimento per un'organizzazione, emettendo l'esito di ogni
 * fonte appena è pronto: così l'interfaccia mostra una progressione vera
 * e non una barra che finge.
 */
export async function* arricchisci(
  organizationId: string,
  innesco: Innesco = "manuale",
): AsyncGenerator<EsitoArricchimentoFonte> {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("ragione_sociale, partita_iva")
    .eq("id", organizationId)
    .maybeSingle();
  if (!org) return;

  const { data: righe } = await admin
    .from("company_fields")
    .select("campo, valore, stato")
    .eq("organization_id", organizationId);

  const esistenti = new Map(
    (righe ?? []).map((r) => [r.campo, { valore: r.valore, stato: r.stato }]),
  );
  const contesto: ContestoImpresa = {
    organizationId,
    ragioneSociale: org.ragione_sociale,
    partitaIva: org.partita_iva,
    campiEsistenti: Object.fromEntries(
      (righe ?? [])
        .filter((r) => r.valore !== null)
        .map((r) => [r.campo, r.valore as string]),
    ),
  };

  for (const adapter of ADAPTER) {
    const inizio = Date.now();

    // Le fonti a pagamento si interrogano solo dopo l'incasso (§12.H):
    // sull'innesco manuale non si toccano nemmeno.
    const saltaPerCosto =
      adapter.chiave === "camerale" && innesco !== "ordine";

    const risultato =
      adapter.stato !== "attiva" || saltaPerCosto
        ? {
            esito: "non_disponibile" as const,
            campi: [],
            dettaglio: saltaPerCosto
              ? "Fonte a pagamento: si interroga solo all'attivazione di un ordine."
              : (adapter.vincolo ?? "Fonte non attiva."),
          }
        : await adapter
            .esegui(contesto)
            // Cintura di sicurezza: un adapter non dovrebbe mai lanciare,
            // ma se lo facesse non deve portarsi via l'intero giro.
            .catch((e: unknown) => ({
              esito: "errore" as const,
              campi: [],
              dettaglio: `Eccezione non gestita: ${e instanceof Error ? e.message : String(e)}`,
            }));

    // Scrittura: solo campi nuovi o cambiati, e mai sopra una conferma
    // dell'utente. Nessun dato scritto se la fonte non ha risposto bene.
    const scritti: string[] = [];
    if (risultato.esito === "ok") {
      for (const campo of risultato.campi) {
        const attuale = esistenti.get(campo.campo);
        if (attuale?.stato === "confermato" && attuale.valore) continue;
        if (attuale?.valore === campo.valore) continue;

        const { error } = await admin.from("company_fields").upsert(
          {
            organization_id: organizationId,
            campo: campo.campo,
            valore: campo.valore,
            provenienza: "motore",
            fonte: campo.fonte,
            stato: "da_confermare",
            confirmed_at: null,
          },
          { onConflict: "organization_id,campo" },
        );
        if (!error) {
          scritti.push(campo.campo);
          esistenti.set(campo.campo, {
            valore: campo.valore,
            stato: "da_confermare",
          });
          contesto.campiEsistenti[campo.campo] = campo.valore;
        }
      }
    }

    const durataMs = Date.now() - inizio;

    // Il registro tecnico raccoglie TUTTO, anche i tentativi a vuoto:
    // serve a capire quali fonti reggono. Se la scrittura del log
    // fallisce, l'arricchimento prosegue lo stesso.
    await admin.from("enrichment_runs").insert({
      organization_id: organizationId,
      innesco,
      fonte: adapter.chiave,
      esito: risultato.esito,
      dettaglio: risultato.dettaglio ?? null,
      campi_scritti: scritti.length,
      durata_ms: durataMs,
    });

    yield {
      chiave: adapter.chiave,
      nome: adapter.nome,
      esito: risultato.esito,
      campiScritti: scritti.length,
      campi: scritti,
      durataMs,
      ...(adapter.stato !== "attiva" ? { vincolo: adapter.vincolo } : {}),
    };
  }
}

/** Variante non incrementale, per gli inneschi che non mostrano nulla. */
export async function arricchiciEBasta(
  organizationId: string,
  innesco: Innesco = "ordine",
): Promise<EsitoArricchimentoFonte[]> {
  const esiti: EsitoArricchimentoFonte[] = [];
  for await (const esito of arricchisci(organizationId, innesco)) {
    esiti.push(esito);
  }
  return esiti;
}
