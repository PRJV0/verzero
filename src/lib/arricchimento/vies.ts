import {
  fetchConScadenza,
  type Adapter,
  type CampoArricchito,
  type RisultatoFonte,
} from "./tipi";

/**
 * VIES — VAT Information Exchange System della Commissione Europea.
 *
 * VIA DI ACCESSO VERIFICATA: API REST pubblica e ufficiale, senza chiave
 * né registrazione, su
 *   POST https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number
 * È il servizio che la Commissione mette a disposizione proprio per la
 * verifica delle partite IVA comunitarie. Provata dal vivo su P.IVA reali:
 * risponde con denominazione e indirizzo registrati.
 *
 * COSA NE RICAVIAMO: la validità della partita IVA, la denominazione
 * ufficiale e la sede legale come risultano al fisco italiano. È l'unica
 * fonte gratuita che restituisca dati anagrafici veri, e per questo è il
 * cuore dell'arricchimento di oggi.
 *
 * ATTENZIONE ALLA PRUDENZA: `valid: false` NON significa «P.IVA
 * inesistente» — molte imprese italiane non sono iscritte al VIES perché
 * non fanno operazioni intracomunitarie. In quel caso non scriviamo nulla
 * e lo diciamo: mai trasformare un'assenza in un giudizio.
 */

const ENDPOINT =
  "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

type RispostaVies = {
  valid?: boolean;
  name?: string;
  address?: string;
  userError?: string;
};

/** VIES restituisce «---» quando un campo non è disponibile. */
function pulisci(valore: string | undefined): string | null {
  if (!valore) return null;
  const v = valore.replace(/\s+/g, " ").trim();
  if (v === "" || v === "---" || v === "-") return null;
  return v;
}

/** Confronto tollerante: forma giuridica e punteggiatura non contano. */
function stessaDenominazione(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[.,'’]/g, "")
      .replace(
        /\b(s\s?p\s?a|s\s?r\s?l|s\s?n\s?c|s\s?a\s?s|societa|società|impresa)\b/g,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
  return norm(a) === norm(b);
}

export const adapterVies: Adapter = {
  chiave: "vies",
  nome: "VIES — registro europeo delle partite IVA",
  cosaRecupera: "Verifica la partita IVA e recupera sede legale e denominazione ufficiale",
  stato: "attiva",

  async esegui(contesto): Promise<RisultatoFonte> {
    try {
      const risposta = await fetchConScadenza(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          countryCode: "IT",
          vatNumber: contesto.partitaIva,
        }),
      });

      if (!risposta.ok) {
        return {
          esito: "errore",
          campi: [],
          dettaglio: `VIES ha risposto ${risposta.status}`,
        };
      }

      const dati = (await risposta.json()) as RispostaVies;

      // Il servizio distingue fra «non valida» e «servizio dello Stato
      // membro non raggiungibile»: il secondo caso è un errore nostro da
      // riprovare, non un'informazione sull'impresa.
      if (dati.userError && !["VALID", "INVALID"].includes(dati.userError)) {
        return {
          esito: "errore",
          campi: [],
          dettaglio: `VIES non ha potuto rispondere: ${dati.userError}`,
        };
      }

      if (dati.valid !== true) {
        return {
          esito: "nessun_dato",
          campi: [],
          dettaglio:
            "Partita IVA non presente nel VIES: normale per chi non opera con l'estero.",
        };
      }

      const campi: CampoArricchito[] = [];
      const sede = pulisci(dati.address);
      if (sede) {
        campi.push({ campo: "sede_legale", valore: sede, fonte: "VIES" });
      }

      // La denominazione la proponiamo SOLO se differisce da quella
      // scritta in registrazione: confermare un dato identico a quello
      // appena digitato sarebbe solo rumore.
      const denominazione = pulisci(dati.name);
      if (
        denominazione &&
        !stessaDenominazione(denominazione, contesto.ragioneSociale)
      ) {
        campi.push({
          campo: "ragione_sociale",
          valore: denominazione,
          fonte: "VIES",
        });
      }

      if (campi.length === 0) {
        return {
          esito: "nessun_dato",
          campi: [],
          dettaglio: "Partita IVA valida, nessun dato nuovo da aggiungere.",
        };
      }
      return { esito: "ok", campi };
    } catch (e) {
      const messaggio = e instanceof Error ? e.message : String(e);
      return {
        esito: "errore",
        campi: [],
        dettaglio:
          messaggio.includes("abort") || messaggio.includes("AbortError")
            ? "VIES non ha risposto entro il tempo massimo"
            : `VIES non raggiungibile: ${messaggio}`,
      };
    }
  },
};
