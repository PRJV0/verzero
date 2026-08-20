import type { Metadata } from "next";
import Link from "next/link";

import {
  DaValidare,
  IntestazioneLegale,
  SezioneLegale,
  TabellaLegale,
  TitolareSegnaposto,
} from "@/components/legale";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Informativa privacy",
  description:
    "Quali dati tratta Ver0, perché, con quale base giuridica, per quanto tempo e con chi. Compresi i dati recuperati dalle banche dati e dal sito del cliente su mandato.",
  path: "/privacy",
});

const AGGIORNATO = "19 agosto 2026";

/**
 * INFORMATIVA PRIVACY (GDPR artt. 13-14).
 *
 * Scritta per essere letta. Il punto più delicato — e il più originale
 * di questa piattaforma — è che Ver0 raccoglie dati anche da fonti
 * diverse dall'interessato: banche dati pubbliche e il sito del cliente,
 * su mandato. L'art. 14 impone di dirlo, e qui è detto per esteso.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <IntestazioneLegale
        titolo="Informativa privacy"
        sotto="Questa pagina spiega quali dati trattiamo, perché, per quanto tempo e con chi li condividiamo. È scritta per essere capita: dove un punto attende la validazione del nostro legale lo diciamo, invece di riempirlo di formule."
        aggiornato={AGGIORNATO}
        altra={{ href: "/cookie-policy", label: "Vai alla cookie policy" }}
      />

      <SezioneLegale id="titolare" titolo="Chi tratta i tuoi dati">
        <TitolareSegnaposto />
      </SezioneLegale>

      <SezioneLegale id="doppio-ruolo" titolo="Due ruoli diversi, da non confondere">
        <p>
          Rispetto ai dati della tua impresa e ai tuoi dati di contatto siamo{" "}
          <strong className="font-medium text-ink">titolari</strong>: decidiamo
          noi come funziona il servizio.
        </p>
        <p>
          Rispetto ai dati contenuti nei documenti che ci affidi — per esempio
          gli aggregati sul personale che servono a un bilancio di
          sostenibilità o alla parità di genere — agiamo come{" "}
          <strong className="font-medium text-ink">responsabili</strong> per
          conto della tua impresa, che di quei dati resta titolare. In quel caso
          seguiamo le tue istruzioni e serve un accordo dedicato.
        </p>
        <DaValidare>
          l&apos;accordo di nomina a responsabile (art. 28 GDPR) va predisposto
          e allegato alle condizioni di servizio prima dei piloti. Va deciso se
          renderlo parte integrante del contratto o un documento firmato a
          parte.
        </DaValidare>
      </SezioneLegale>

      <SezioneLegale id="dati" titolo="Quali dati trattiamo, e da dove arrivano">
        <p>
          Alcuni dati ce li dai tu. Altri li recuperiamo noi, ed è il cuore del
          servizio: l&apos;AI Ver0 compila la scheda della tua impresa al posto tuo.
          Quando un dato non viene da te, l&apos;articolo 14 del GDPR ci obbliga
          a dirti da dove viene — e nel portale lo trovi scritto accanto a ogni
          singolo campo, con la fonte e, per i contenuti presi dal web, il link
          alla pagina esatta.
        </p>
        <TabellaLegale
          colonne={["Categoria", "Esempi", "Provenienza"]}
          righe={[
            [
              "Dati di account",
              "Email, password (conservata solo come impronta cifrata), data di accesso",
              "Da te, alla registrazione",
            ],
            [
              "Dati dell'impresa",
              "Ragione sociale, partita IVA, dimensione, indirizzo di fatturazione",
              "Da te, e confermati o completati dalle fonti sotto",
            ],
            [
              "Dati da banche dati pubbliche",
              "Validità della partita IVA, denominazione e sede legale registrate, classificazione ATECO",
              "VIES (Commissione Europea), ISTAT; in futuro Registro Imprese e INI-PEC",
            ],
            [
              "Contenuti dal sito della tua impresa",
              "Descrizione dell'attività, prodotti, sedi, mercati, certificazioni esposte, policy pubblicate",
              "Il tuo sito ufficiale, letto su tuo mandato e solo quello",
            ],
            [
              "Documenti che carichi",
              "Bollette, visure, registri, organigrammi, dati di organico aggregati",
              "Da te, per produrre i documenti che hai richiesto",
            ],
            [
              "Dati d'uso tecnici",
              "Registro degli accessi alle fonti (esito e durata), messaggi inviati dal modulo contatti",
              "Generati dal servizio durante il funzionamento",
            ],
          ]}
        />
        <p className="mt-4">
          <strong className="font-medium text-ink">
            Sul mandato per le banche dati e per il sito.
          </strong>{" "}
          Al momento dell&apos;acquisto ti chiediamo un&apos;autorizzazione
          esplicita e separata dalle condizioni di servizio. È revocabile in
          ogni momento dalle impostazioni del tuo ecosistema: alla revoca la
          piattaforma continua a funzionare, con inserimento manuale dei dati.
          Ogni dato recuperato arriva in stato «da confermare» e puoi
          confermarlo o rifiutarlo uno per uno.
        </p>
        <p>
          Leggiamo esclusivamente il sito che hai dichiarato come tuo, ne
          rispettiamo le regole per i programmi automatici (robots.txt) e non
          prendiamo nulla da aggregatori commerciali terzi.
        </p>
        <DaValidare>
          il trattamento di dati relativi a dipendenti dei clienti, anche in
          forma aggregata, e la lettura automatizzata di documenti aziendali
          richiedono una valutazione d&apos;impatto (DPIA) o almeno una
          motivazione scritta della sua non necessità. Va anche verificata la
          formulazione del mandato rispetto all&apos;art. 14 e ai termini d&apos;uso
          delle fonti.
        </DaValidare>
      </SezioneLegale>

      <SezioneLegale id="finalita" titolo="Perché li trattiamo, e con quale base giuridica">
        <TabellaLegale
          colonne={["Finalità", "Base giuridica", "Nota"]}
          righe={[
            [
              "Creare e gestire il tuo accesso",
              "Esecuzione del contratto (art. 6.1.b)",
              "Senza questi dati non possiamo darti un account",
            ],
            [
              "Produrre i documenti e le qualifiche che hai richiesto",
              "Esecuzione del contratto (art. 6.1.b)",
              "Comprende la lettura dei documenti che carichi",
            ],
            [
              "Recuperare dati da banche dati pubbliche e dal tuo sito",
              "Esecuzione del contratto, sulla base del mandato che ci dai (art. 6.1.b)",
              "Revocabile in ogni momento, senza perdere il servizio",
            ],
            [
              "Rispondere ai messaggi dal modulo contatti",
              "Misure precontrattuali su tua richiesta (art. 6.1.b)",
              "L'indirizzo IP è conservato solo come impronta cifrata, contro gli abusi",
            ],
            [
              "Proteggere il servizio da abusi e usi impropri",
              "Legittimo interesse (art. 6.1.f)",
              "Limitazioni di frequenza, registri tecnici",
            ],
            [
              "Adempiere a obblighi fiscali e contabili",
              "Obbligo di legge (art. 6.1.c)",
              "Vale dall'attivazione dei pagamenti",
            ],
            [
              "Inviarti comunicazioni commerciali non richieste",
              "Non lo facciamo",
              "Se un giorno lo faremo, servirà il tuo consenso separato e revocabile",
            ],
          ]}
        />
      </SezioneLegale>

      <SezioneLegale id="responsabili" titolo="Chi altro tratta i dati per noi">
        <p>
          Per far funzionare la piattaforma ci appoggiamo a fornitori
          specializzati, nominati responsabili del trattamento. Nessuno di loro
          può usare i tuoi dati per finalità proprie.
        </p>
        <TabellaLegale
          colonne={["Fornitore", "A cosa serve", "Dove sono i dati"]}
          righe={[
            [
              "Supabase",
              "Banca dati, autenticazione e archivio documenti",
              "Unione Europea (Francoforte)",
            ],
            [
              "Vercel",
              "Pubblicazione e distribuzione dell'applicazione",
              "Rete distribuita, con elaborazione in UE",
            ],
            [
              "Resend",
              "Invio delle email di servizio (conferma indirizzo, recupero password, notifiche)",
              "Unione Europea (Irlanda)",
            ],
            [
              "Anthropic",
              "Lettura e strutturazione dei documenti che carichi, tramite modelli linguistici",
              "Stati Uniti — vedi la nota sui trasferimenti",
            ],
            [
              "Fornitori di dati camerali",
              "Recupero di visure e dati del Registro Imprese, quando attivato",
              "Italia",
            ],
          ]}
        />
        <p className="mt-4">
          <strong className="font-medium text-ink">
            Trasferimenti fuori dall&apos;Unione Europea.
          </strong>{" "}
          Il trattamento tramite Anthropic comporta un trasferimento verso gli
          Stati Uniti, coperto dalle clausole contrattuali standard della
          Commissione Europea e dalle garanzie supplementari del fornitore. Puoi
          chiederci copia delle garanzie in essere.
        </p>
        <DaValidare>
          vanno verificati e conservati gli accordi sul trattamento dei dati di
          ciascun fornitore, le clausole contrattuali standard per Anthropic e
          l&apos;effettiva regione di elaborazione di Vercel. L&apos;elenco va
          tenuto aggiornato: è parte del registro dei trattamenti, che
          l&apos;art. 30 richiede di predisporre.
        </DaValidare>
      </SezioneLegale>

      <SezioneLegale id="conservazione" titolo="Per quanto tempo li conserviamo">
        <TabellaLegale
          colonne={["Dato", "Conservazione"]}
          righe={[
            [
              "Account e scheda dell'impresa",
              "Per tutta la durata del rapporto, e per 30 giorni dopo la chiusura per permetterti un ripensamento",
            ],
            [
              "Documenti caricati e documenti prodotti",
              "Per la durata del rapporto; restano scaricabili fino alla chiusura dell'account",
            ],
            [
              "Consensi e mandati",
              "10 anni dalla revoca: sono la prova che il trattamento era lecito",
            ],
            [
              "Documenti contabili e fiscali",
              "10 anni, come impone la legge",
            ],
            [
              "Registri tecnici dell'arricchimento",
              "12 mesi",
            ],
            [
              "Messaggi dal modulo contatti",
              "24 mesi dall'ultimo scambio",
            ],
          ]}
        />
        <DaValidare>
          i termini di conservazione qui indicati sono una proposta ragionata,
          non un dato normativo: vanno confermati insieme al legale, in
          particolare i 10 anni sui consensi e i 30 giorni di ripensamento dopo
          la chiusura.
        </DaValidare>
      </SezioneLegale>

      <SezioneLegale id="diritti" titolo="I tuoi diritti">
        <p>
          Puoi chiederci in ogni momento di{" "}
          <strong className="font-medium text-ink">accedere</strong> ai tuoi
          dati, di <strong className="font-medium text-ink">correggerli</strong>{" "}
          se sono sbagliati, di{" "}
          <strong className="font-medium text-ink">cancellarli</strong>, di{" "}
          <strong className="font-medium text-ink">limitarne</strong> il
          trattamento, di{" "}
          <strong className="font-medium text-ink">riceverli</strong> in un
          formato leggibile da un altro sistema, e di{" "}
          <strong className="font-medium text-ink">opporti</strong> ai
          trattamenti fondati sul legittimo interesse.
        </p>
        <p>
          Alcuni di questi diritti li eserciti da solo, senza chiedere permesso:
          nella scheda della tua impresa puoi correggere o rifiutare ogni
          singolo dato che l&apos;AI Ver0 ti propone, e dalle impostazioni puoi
          revocare i mandati.
        </p>
        <p>
          Per tutto il resto scrivi a{" "}
          <a
            href="mailto:privacy@verzero.it"
            className="font-medium text-pine underline"
          >
            privacy@verzero.it
          </a>
          : rispondiamo entro un mese. Se ritieni che il trattamento violi il
          GDPR puoi rivolgerti al Garante per la protezione dei dati personali
          (www.garanteprivacy.it) o all&apos;autorità del tuo Paese.
        </p>
      </SezioneLegale>

      <SezioneLegale id="decisioni" titolo="Automatismi e decisioni">
        <p>
          L&apos;AI Ver0 legge documenti e fonti pubbliche e produce bozze. Non prende
          decisioni automatizzate che producano effetti giuridici su di te: ogni
          documento passa dalla tua conferma e dalla validazione di un
          professionista prima di essere emesso. I punteggi e i rating che
          calcoliamo sono strumenti di lavoro, non giudizi sulla tua impresa.
        </p>
      </SezioneLegale>

      <SezioneLegale id="cookie" titolo="Cookie">
        <p>
          Oggi usiamo solo cookie tecnici necessari a tenerti dentro dopo
          l&apos;accesso. Il dettaglio, e il modo per cambiare idea, sono nella{" "}
          <Link href="/cookie-policy" className="font-medium text-pine underline">
            cookie policy
          </Link>
          .
        </p>
      </SezioneLegale>

      <p className="mt-12 rounded-xl border border-line bg-paper px-5 py-4 text-xs leading-relaxed text-gray-warm">
        <strong className="font-semibold text-ink">
          Stato di questo documento.
        </strong>{" "}
        È una versione di lavoro, completa nella sostanza e scritta sui
        trattamenti che facciamo davvero. I riquadri in ambra segnano i punti
        che devono passare da un legale prima dei primi clienti paganti, insieme
        ai dati della società quando sarà costituita. Preferiamo dirtelo: un
        documento che finge di essere definitivo sarebbe la prima cosa poco
        trasparente di questa piattaforma.
      </p>
    </main>
  );
}
