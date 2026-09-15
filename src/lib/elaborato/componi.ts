import { createHash } from "node:crypto";

import type { ModelloElaborato } from "@/lib/elaborati";
import {
  NORME_VERIFICATE_IL,
  REGISTRO_NORME,
  versioneApplicabile,
  versioneStandard,
} from "@/lib/norme";
import { periodoEsteso } from "@/lib/periodo";

import {
  COMPOSITORI,
  campoScheda,
  sciogliSegnaposto,
  tipiLetti,
  type ContestoComposizione,
} from "./compositori";
import {
  SIGLA_FONTE,
  type Blocco,
  type Elaborato,
  type RiferimentoNormativo,
  type SezioneElaborato,
  type TipoFonte,
  type VoceRevisione,
} from "./contenuto";
import { DATA_LUNGA, RegistroFonti } from "./fonti";
import type { IngressoComposizione } from "./ingresso";
import { senzaDoppioni, type Mancanza } from "./mancanze";

// I compositori di dominio si registrano importandoli: il costruttore non
// li nomina, ma senza questa riga il registro non li conoscerebbe.
import "./compositori-ghg";

/**
 * LA COMPOSIZIONE — dal modello e dai dati confermati, il documento.
 *
 * ═══ UN COSTRUTTORE SOLO, CHE NON CONOSCE I DOMINI ═══
 * Legge le sezioni del modello scelto per l'esercizio, e per ciascuna le
 * parti dichiarate: un paragrafo del modello lo scrive, un blocco di dati
 * lo chiede al compositore registrato. Poi aggiunge la cornice che ogni
 * elaborato ha per costruzione — copertina, indice, riferimenti
 * normativi, registro delle fonti, validazione, registro delle revisioni
 * — e tutto il testo della cornice nasce QUI, una volta, per il PDF e per
 * il DOCX insieme.
 *
 * La composizione non decide se il documento si consegna: raccoglie le
 * mancanze e le passa al controllo di consegna (`consegna.ts`), che è un
 * altro modulo di proposito — chi compone ha tutto l'interesse a
 * considerarsi completo.
 */

export type EsitoComposizione = {
  elaborato: Elaborato;
  /** Le mancanze trovate dai compositori, già in forma per il cliente. */
  mancanze: Mancanza[];
  /** I tipi di documento che la composizione ha letto: servono all'impronta. */
  tipiLetti: string[];
};

/**
 * LA VERSIONE DEL GENERATORE — si cambia a mano, e va cambiata.
 *
 * L'impronta dice «nulla è cambiato» guardando gli ingressi: dati, norme,
 * modello, fattori, veste. Ma se si corregge un calcolo, un compositore o
 * l'impaginazione, lo stesso ingresso produce un documento diverso — e
 * senza questo numero il cliente si vedrebbe riaprire la versione vecchia,
 * con l'errore dentro, come «già generata». Chi tocca `compositori*.ts`,
 * `src/lib/calc/`, `componi.ts`, `pdf.ts` o `docx.ts` in un modo che cambia
 * il documento, aggiorna questa stringa.
 */
export const VERSIONE_GENERATORE = "2026-09-15.1";

/** L'impronta del MODELLO e del generatore: se cambia la struttura, un testo o il codice che compone, cambia il documento. */
export function improntaModello(modello: ModelloElaborato): string {
  return createHash("sha256")
    .update(JSON.stringify({ modello, generatore: VERSIONE_GENERATORE }))
    .digest("hex")
    .slice(0, 16);
}

/** «GHG-2025-4F2A9C-R0»: si cita al telefono e si ritrova in archivio. */
export function codiceDocumento(
  modello: ModelloElaborato,
  organizzazioneId: string,
  esercizio: number,
  revisione: number,
): string {
  const sigla =
    modello.sigla ??
    modello.chiave
      .split("-")
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  const org = organizzazioneId.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase() || "000000";
  return `${sigla}-${esercizio}-${org}-R${revisione}`;
}

const TESTI_LEGENDA: Record<TipoFonte, string> = {
  documento:
    "letto da un documento dell'organizzazione — una bolletta, una visura, una pagina del sito ufficiale — e confermato dall'organizzazione",
  "banca-dati":
    "recuperato da una banca dati pubblica o istituzionale, con la pubblicazione e l'edizione usate",
  calcolato:
    "calcolato da altri valori del documento: il registro indica il procedimento e i valori di partenza",
  inserito: "inserito dall'organizzazione nel portale",
};

/** I riferimenti normativi, copiati dal registro COM'ERANO al momento della composizione. */
export function riferimentiDi(modello: ModelloElaborato, esercizio: number): RiferimentoNormativo[] {
  const out: RiferimentoNormativo[] = [];
  const aggiungi = (designazione: string, ruolo: string) => {
    const esistente = out.find((r) => r.designazione === designazione);
    if (esistente) {
      if (!esistente.ruolo.includes(ruolo)) esistente.ruolo = `${esistente.ruolo}; ${ruolo.charAt(0).toLowerCase()}${ruolo.slice(1)}`;
      return;
    }
    const voce = REGISTRO_NORME.find((n) => n.codice === designazione);
    out.push({
      designazione,
      ruolo,
      stato: voce ? voce.stato : "non registrata",
      ...(voce?.titolo ? { titolo: voce.titolo } : {}),
      ...(voce?.dal ? { dal: voce.dal } : {}),
      ...(voce?.url ? { url: voce.url } : {}),
      ...(voce?.nota ? { nota: voce.nota } : {}),
    });
  };

  if (modello.standard && modello.versione) {
    const v = versioneStandard(modello.standard, modello.versione);
    const applicabile = versioneApplicabile(modello.standard, esercizio);
    if (v) {
      const inRegistro = REGISTRO_NORME.find((n) => n.codice === v.designazione);
      if (inRegistro) {
        aggiungi(v.designazione, `Versione dello standard applicata all'esercizio ${esercizio}`);
      } else {
        out.push({
          designazione: v.designazione,
          ruolo: `Versione dello standard applicata all'esercizio ${esercizio}`,
          // Una versione di standard vale per i SUOI esercizi: si dichiara
          // «in vigore» solo se è quella applicabile a questo.
          stato: applicabile?.versione === v.versione ? "in vigore" : v.stato,
          ...(v.fonte ? { url: v.fonte } : {}),
          ...(v.atto ? { nota: v.atto } : {}),
        });
      }
    }
  }
  for (const n of modello.norme ?? []) aggiungi(n, "Norma di riferimento della struttura del documento");
  for (const r of modello.riferimenti ?? []) aggiungi(r.designazione, r.ruolo);
  return out;
}

export function componiElaborato(ingresso: IngressoComposizione): EsitoComposizione {
  const { modello, organizzazione } = ingresso;
  const esercizio = organizzazione.anno_rendicontazione;
  const opzioni = new Set(ingresso.opzioni);
  const fonti = new RegistroFonti();
  const memoria = new Map<string, unknown>();
  const mancanze: Mancanza[] = [];
  const tipi = new Set<string>();

  const riferimenti = riferimentiDi(modello, esercizio);
  const normaPrincipale = modello.norme?.[0] ?? riferimenti[0]?.designazione;

  const ctx: ContestoComposizione = {
    ingresso,
    esercizio,
    fonti,
    sezione: "",
    memoria,
    testo: (t) =>
      sciogliSegnaposto(t, {
        anno: esercizio,
        organizzazione: organizzazione.ragione_sociale,
        norma: normaPrincipale,
      }),
  };

  const sezioniModello = modello.sezioni.filter((s) => !s.soloSe || opzioni.has(s.soloSe));

  const sezioni: SezioneElaborato[] = sezioniModello.map((s, i) => {
    ctx.sezione = s.titolo;
    const blocchi: Blocco[] = [];
    let piena = true;

    if (!s.componi || s.componi.length === 0) {
      mancanze.push({
        tipo: "composizione-non-disponibile",
        chi: "verzero",
        sezione: s.titolo,
        messaggio: `La sezione «${s.titolo}» non si compone ancora automaticamente dai dati della piattaforma.`,
        rimedio:
          "Non serve niente da te: è una parte del documento che la piattaforma non sa ancora scrivere. Finché è così il documento finale non si genera, e la bozza resta aggiornata.",
      });
      return { numero: i + 1, titolo: s.titolo, ...(s.fonte ? { riferimento: s.fonte } : {}), blocchi, piena: false };
    }

    let datiRichiesti = false;
    for (const parte of s.componi) {
      if ("testo" in parte) {
        blocchi.push({ tipo: "paragrafo", testo: ctx.testo(parte.testo) });
        continue;
      }
      if ("sottotitolo" in parte) {
        blocchi.push({ tipo: "sottotitolo", testo: ctx.testo(parte.sottotitolo) });
        continue;
      }
      datiRichiesti = true;
      const compositore = COMPOSITORI[parte.blocco];
      if (!compositore) {
        piena = false;
        mancanze.push({
          tipo: "composizione-non-disponibile",
          chi: "verzero",
          sezione: s.titolo,
          messaggio: `La sezione «${s.titolo}» chiede un blocco («${parte.blocco}») che la piattaforma non sa comporre.`,
          rimedio: "Non serve niente da te: è un difetto del modello del documento, e lo correggiamo noi.",
        });
        continue;
      }
      const parametri = parte.parametri ?? {};
      for (const t of tipiLetti(compositore, parametri)) tipi.add(t);
      const esito = compositore.componi(ctx, parametri);
      blocchi.push(...esito.blocchi);
      mancanze.push(...esito.mancanze);
      if (!esito.piena) piena = false;
    }

    // Una sezione fatta di soli testi del modello è piena per definizione
    // (una dichiarazione è il suo testo); una che chiede dati è piena solo
    // se i dati sono arrivati.
    if (blocchi.length === 0) piena = false;
    if (!datiRichiesti && blocchi.length > 0) piena = true;

    return {
      numero: i + 1,
      titolo: s.titolo,
      ...(s.fonte ? { riferimento: s.fonte } : {}),
      blocchi,
      piena,
    };
  });

  // L'identità in copertina viene dagli stessi campi dell'anagrafica: il
  // nome in copertina e quello nella sezione 1 non possono divergere.
  ctx.sezione = "Copertina";
  const nome = campoScheda(ctx, "ragione_sociale");
  const piva = campoScheda(ctx, "partita_iva");
  const sede = campoScheda(ctx, "sede_legale");
  const ragioneSociale = nome.stato === "confermato" ? nome.valore : organizzazione.ragione_sociale;

  const timbro =
    modello.standard && modello.versione
      ? versioneStandard(modello.standard, modello.versione)
      : undefined;

  const revisione: VoceRevisione = {
    numero: ingresso.revisione.numero,
    data: ingresso.revisione.data,
    motivo: ingresso.revisione.motivo,
    ...(timbro ? { versioneStandard: timbro.designazione } : {}),
    validazione: ingresso.validazione.stato,
  };

  const elencoFonti = fonti.elenco();
  const tipiUsati = new Set(elencoFonti.map((f) => f.tipo));

  const elaborato: Elaborato = {
    modello: { chiave: modello.chiave, documento: modello.documento, impronta: improntaModello(modello) },
    frontespizio: {
      occhiello: modello.occhiello ?? modello.intestazione,
      titolo: modello.conAnno ? `${modello.intestazione} ${esercizio}` : modello.intestazione,
      organizzazione: ragioneSociale,
      identificativi: [
        { etichetta: "Partita IVA", valore: piva.stato === "confermato" ? piva.valore : organizzazione.partita_iva },
        ...(sede.stato === "confermato" ? [{ etichetta: "Sede legale", valore: sede.valore }] : []),
      ],
      esercizio,
      periodo: periodoEsteso(esercizio),
      ...(timbro ? { costruitoSu: timbro.designazione } : {}),
      codice: codiceDocumento(modello, organizzazione.id, esercizio, ingresso.revisione.numero),
    },
    revisione,
    validazione: ingresso.validazione,
    revisioni: [...ingresso.revisioniPrecedenti, revisione].sort((a, b) => a.numero - b.numero),
    sezioni,
    riferimenti,
    fonti: elencoFonti,
    legenda: (Object.keys(SIGLA_FONTE) as TipoFonte[])
      .filter((t) => tipiUsati.has(t))
      .map((t) => ({ sigla: SIGLA_FONTE[t], testo: TESTI_LEGENDA[t] })),
    testi: {
      composizione: `Documento composto con la piattaforma Verzero dai soli dati confermati dall'organizzazione. Ogni valore porta una sigla che rimanda al Registro delle fonti in appendice: la lettera dice da dove viene, il numero quale fonte.`,
      fontiIntro:
        "Ogni sigla accanto a un valore rimanda a una voce di questo registro. Per i documenti dell'organizzazione sono indicate le pagine da cui sono stati letti i valori usati e la data di conferma; per le banche dati la pubblicazione e l'edizione; per i calcoli il procedimento e le fonti da cui partono.",
      riferimentiIntro: `Le designazioni sono riportate come risultano dal registro delle norme della piattaforma alla data di composizione (registro verificato il ${NORME_VERIFICATE_IL.esteso}). Il documento dichiara l'edizione su cui è costruito: una revisione successiva della norma non lo modifica, e diventa motivo di una nuova revisione.`,
      validazioneInAttesa:
        "Questa revisione non è ancora stata validata da un professionista. Finché la validazione non è registrata, il documento non va presentato come definitivo.",
      validazioneSpiega:
        "La validazione professionale è l'analisi del documento da parte di un professionista del team tecnico: ne controlla metodo, perimetro e coerenza con i documenti di origine, e ne registra l'esito con i rilievi. Non è una verifica di parte terza svolta da un organismo accreditato e non costituisce asseverazione.",
    },
    formati: modello.formati ?? ["pdf"],
    ...(ingresso.esempio ? { esempio: true } : {}),
  };

  return { elaborato, mancanze: senzaDoppioni(mancanze), tipiLetti: [...tipi].sort() };
}

/** La data della revisione, per esteso, per chi la mostra fuori dal documento. */
export function dataRevisione(v: VoceRevisione): string {
  return DATA_LUNGA(v.data);
}
