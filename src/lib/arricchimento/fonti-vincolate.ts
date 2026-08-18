import { nonDisponibile, type Adapter } from "./tipi";

/**
 * FONTI PREDISPOSTE MA SPENTE — con il vincolo verificato, non presunto.
 *
 * Ognuna di queste fonti è stata cercata prima di scrivere una riga di
 * codice: dove la via legittima non esiste (o non esiste ancora per noi),
 * l'adapter resta spento e dice perché. La scelta è deliberata: un dato
 * preso violando i termini d'uso di chi lo pubblica è un dato che non
 * possiamo difendere davanti a un cliente né a un ente — e noi vendiamo
 * esattamente la difendibilità dei dati.
 *
 * Per accendere una di queste fonti basta cambiare `stato` in "attiva" e
 * scrivere il corpo di `esegui`: il resto dell'orchestrazione è già
 * pronto e le tratterà come tratta VIES.
 */

/**
 * AGENZIA DELLE ENTRATE — verifica partita IVA (art. 35-quater DPR 633/72).
 *
 * VERIFICA SVOLTA: esiste il servizio pubblico di verifica su
 * telematici.agenziaentrate.gov.it, ma è un'interfaccia web pensata per
 * la consultazione umana. L'accesso programmatico esiste come servizio in
 * API Management (provvedimento del 4 aprile 2023) ed è dichiarato
 * disponibile «a un numero ristretto di sperimentatori», con estensione
 * progressiva a partire dai soggetti accreditati al Sistema di
 * Interscambio. Oggi non siamo tra questi.
 *
 * Nel frattempo la validità della partita IVA la otteniamo dal VIES, che
 * ha una API pubblica e ufficiale.
 */
export const adapterAgenziaEntrate: Adapter = {
  chiave: "agenzia-entrate",
  nome: "Agenzia delle Entrate — anagrafe tributaria",
  cosaRecupera: "Stato di attività della partita IVA e denominazione a fini fiscali",
  stato: "spenta",
  vincolo:
    "L'accesso programmatico passa dall'API Management dell'Agenzia, oggi aperto solo a un numero ristretto di sperimentatori e, a seguire, ai soggetti accreditati al Sistema di Interscambio. Serve quell'accreditamento: fino ad allora la validità della partita IVA la prendiamo dal VIES.",
  async esegui() {
    return nonDisponibile(
      "API Management dell'Agenzia delle Entrate riservata a sperimentatori e soggetti accreditati SdI.",
    );
  },
};

/**
 * INI-PEC — Indice Nazionale degli Indirizzi PEC (MIMIT, gestito da InfoCamere).
 *
 * VERIFICA SVOLTA: il portale inipec.gov.it è consultabile liberamente da
 * chiunque, ma per singola ricerca e da persona. L'accesso massivo e
 * applicativo è previsto solo attraverso i servizi di cooperazione
 * applicativa riservati alla pubblica amministrazione e, per gli operatori
 * economici, tramite CONVENZIONE dedicata con InfoCamere.
 *
 * Interrogare il portale con un programma sarebbe aggirare quella
 * convenzione: non lo facciamo. Serve stipularla.
 */
export const adapterIniPec: Adapter = {
  chiave: "ini-pec",
  nome: "INI-PEC — indice nazionale delle PEC",
  cosaRecupera: "L'indirizzo PEC ufficiale registrato dell'impresa",
  stato: "spenta",
  vincolo:
    "Il portale INI-PEC è libero per la consultazione umana, ma l'accesso applicativo o massivo è riservato alla pubblica amministrazione e, per gli operatori economici, a una convenzione dedicata con InfoCamere. Serve stipulare quella convenzione: interrogare il portale via software sarebbe aggirarla.",
  async esegui() {
    return nonDisponibile(
      "Accesso applicativo a INI-PEC subordinato a convenzione con InfoCamere.",
    );
  },
};

/**
 * ACCREDIA — banca dati delle organizzazioni certificate.
 *
 * VERIFICA SVOLTA: la banca dati è consultabile online, ma le note legali
 * di ACCREDIA vietano espressamente l'estrazione e il reimpiego della
 * totalità o di una parte sostanziale del contenuto, e anche l'estrazione
 * ripetuta e sistematica di parti non sostanziali. La banca dati è
 * protetta come opera dell'ingegno.
 *
 * È il caso più netto di tutti: qui non manca una chiave, c'è un DIVIETO.
 * L'adapter resta spento e la strada corretta è un accordo con ACCREDIA.
 * Nel frattempo le certificazioni già possedute le chiediamo al cliente,
 * che è titolare dei propri certificati e può dircelo in un istante.
 */
export const adapterAccredia: Adapter = {
  chiave: "accredia",
  nome: "ACCREDIA — banca dati delle certificazioni",
  cosaRecupera: "Le certificazioni di sistema di gestione già possedute",
  stato: "spenta",
  vincolo:
    "Le note legali di ACCREDIA vietano espressamente l'estrazione e il reimpiego, anche parziale, della banca dati, e in particolare l'estrazione ripetuta e sistematica: la banca dati è protetta come opera dell'ingegno. Non è una chiave che manca, è un divieto. La via corretta è un accordo con ACCREDIA; intanto i certificati li dichiara il cliente, che ne è titolare.",
  async esegui() {
    return nonDisponibile(
      "Note legali ACCREDIA: estrazione e reimpiego della banca dati vietati.",
    );
  },
};

/**
 * PROVIDER CAMERALE A PAGAMENTO (es. OpenAPI.it) — Registro Imprese.
 *
 * È la fonte che sbloccherebbe il grosso della scheda: forma giuridica,
 * codice ATECO, unità locali, dipendenti, capitale sociale, soci e
 * cariche, bilanci depositati. I dati del Registro Imprese sono di
 * InfoCamere e si acquistano — pay-per-use, ideale in avvio.
 *
 * COSA SERVE PER ACCENDERLA (una riga, come richiesto): un account sul
 * provider con credito attivo e la chiave API in `OPENAPI_TOKEN`; poi
 * `stato: "attiva"` qui sotto e il corpo di `esegui`.
 *
 * REGOLA ECONOMICA (SPEC §12.H): le fonti a pagamento si interrogano SOLO
 * dopo l'incasso dell'ordine, mai per simulazioni o prove — per questo
 * l'orchestratore le esegue soltanto sull'innesco «ordine».
 */
export const adapterCamerale: Adapter = {
  chiave: "camerale",
  nome: "Registro Imprese — visura camerale",
  cosaRecupera:
    "Forma giuridica, codice ATECO, unità locali, dipendenti, capitale sociale e bilanci",
  stato: "spenta",
  vincolo:
    "Fonte a pagamento: i dati del Registro Imprese si acquistano da un provider camerale (es. OpenAPI.it) pay-per-use. Serve un account con credito attivo e la chiave in OPENAPI_TOKEN. Da SPEC si interroga solo dopo l'incasso dell'ordine, mai per simulazioni.",
  async esegui() {
    // Presidio esplicito: se un domani qualcuno accendesse lo stato senza
    // configurare la chiave, meglio un «non disponibile» onesto che una
    // chiamata a vuoto contro un endpoint a consumo.
    if (!process.env.OPENAPI_TOKEN) {
      return nonDisponibile(
        "Provider camerale non configurato: manca OPENAPI_TOKEN.",
      );
    }
    return nonDisponibile(
      "Adapter camerale predisposto ma non ancora implementato: si accende con l'account del fondatore.",
    );
  },
};
