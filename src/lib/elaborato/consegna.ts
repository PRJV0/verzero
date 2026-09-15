import { controllaConformita, type ModelloElaborato } from "@/lib/elaborati";
import { REGISTRO_NORME, statoVersioneDocumento } from "@/lib/norme";

import {
  eValore,
  testoCompleto,
  valoriDi,
  type Elaborato,
  type Fonte,
} from "./contenuto";
import { ordinaMancanze, senzaDoppioni, type Mancanza } from "./mancanze";

/**
 * IL CONTROLLO DI CONSEGNA — bloccante, e scritto da chi non ha composto.
 *
 * ═══ PERCHÉ UN MODULO A PARTE ═══
 * Il costruttore del documento ha tutto l'interesse a considerarsi
 * completo; il controllo no. Rilegge il documento già composto — non gli
 * ingressi — e verifica le proprietà che un documento consegnato deve
 * avere, senza fidarsi di nessuna promessa dei compositori:
 *
 *   1. tutte le sezioni che il modello richiede, presenti e non vuote;
 *   2. nessun dato senza fonte, e nessuna fonte non confermata — un
 *      calcolo è confermato solo se lo sono tutti i suoi ingressi;
 *   3. ogni riferimento normativo in vigore nel registro, e ogni
 *      designazione citata nel TESTO registrata e non ritirata;
 *   4. la versione dello standard applicabile all'esercizio;
 *   5. nessun segnaposto rimasto nel testo;
 *   6. ogni documento di origine con un periodo che tocca l'esercizio.
 *
 * Più le mancanze che i compositori hanno già trovato (una bolletta da
 * confermare, un mese scoperto), che sono le più utili al cliente perché
 * dicono DOVE mettere le mani.
 *
 * ═══ BLOCCANTE SUL SERIO ═══
 * I renderer non accettano un `Elaborato`: accettano un
 * `ElaboratoConsegnabile`, che esiste solo come uscita di questa funzione
 * quando le mancanze sono zero. Non è una convenzione che qualcuno
 * ricorderà: un PDF di un documento incompleto non compila.
 */

declare const consegnabile: unique symbol;
export type ElaboratoConsegnabile = Elaborato & { readonly [consegnabile]: true };

export type EsitoConsegna =
  | { consegnabile: true; elaborato: ElaboratoConsegnabile; mancanze: [] }
  | { consegnabile: false; mancanze: Mancanza[] };

/**
 * La forma di una designazione, identica a quella di
 * `scripts/controllo-norme.mjs` (una prova le confronta): ciò che il
 * controllo delle pagine considera una designazione, lo è anche nei
 * documenti.
 */
export const FORMA_DESIGNAZIONE =
  /UNI(?: CEI)?(?: EN)? ISO(?:\/IEC)? \d{3,5}(?:-\d)?:\d{4}(?:\+?A\d+:\d{4})?|UNI\/(?:PdR|TS) \d+:\d{4}|ISO\/IEC \d+-\d:\d{4}|SA8000:\d{4}/g;

const SEGNAPOSTO = /\{[a-zA-Z]+\}/g;

function annoDi(iso: string): number {
  return Number(iso.slice(0, 4));
}

/**
 * Che cosa, a monte di una fonte, le impedisce di stare nel documento. Un
 * calcolo vale quanto i suoi ingressi, fino in fondo — e la mancanza si
 * dice sulla fonte che va confermata davvero, non sul totale che ne
 * discende: «conferma la bolletta di marzo» si può fare, «conferma i totali»
 * no.
 *
 * Un calcolo che non dichiara ingressi, o ne cita di inesistenti, è un'altra
 * cosa: non c'è niente che il cliente possa confermare, è un difetto della
 * composizione. Chiederglielo come una conferma lo manderebbe a cercare un
 * valore che non esiste.
 */
function esaminaFonte(
  f: Fonte,
  perId: Map<string, Fonte>,
  esito: { visti: Set<string>; nonConfermate: Set<string>; senzaIngressi: Set<string> },
) {
  if (esito.visti.has(f.id)) return;
  esito.visti.add(f.id);
  if (!f.confermata) esito.nonConfermate.add(f.id);
  if (f.tipo !== "calcolato") return;
  const ingressi = f.ingressi ?? [];
  const esistenti = ingressi.map((id) => perId.get(id)).filter((i): i is Fonte => i !== undefined);
  if (ingressi.length === 0 || esistenti.length < ingressi.length) esito.senzaIngressi.add(f.id);
  for (const i of esistenti) esaminaFonte(i, perId, esito);
}

export function verificaConsegna(
  elaborato: Elaborato,
  dati: {
    modello: ModelloElaborato;
    opzioni: string[];
    /** Le mancanze trovate dai compositori. */
    mancanzeComposizione: Mancanza[];
    /** L'esercizio dell'organizzazione, letto dagli ingressi e non dal documento. */
    esercizio: number;
  },
): EsitoConsegna {
  const { modello } = dati;
  const mancanze: Mancanza[] = [...dati.mancanzeComposizione];

  /* 1. Le sezioni. Il controllo generico di `elaborati.ts` gira comunque:
        è quello che le prove di estendibilità esercitano su ogni ambito. */
  const perId = new Map(elaborato.fonti.map((f) => [f.id, f]));
  const senzaFonte: string[] = [];
  const esame = { visti: new Set<string>(), nonConfermate: new Set<string>(), senzaIngressi: new Set<string>() };

  for (const s of elaborato.sezioni) {
    for (const b of s.blocchi) {
      for (const v of valoriDi(b)) {
        if (!v.fonte || !perId.has(v.fonte)) {
          senzaFonte.push(v.testo);
          continue;
        }
        esaminaFonte(perId.get(v.fonte)!, perId, esame);
      }
    }
  }

  const ritirate = elaborato.riferimenti
    .filter((r) => r.stato === "ritirata")
    .map((r) => r.designazione);

  const generico = controllaConformita(modello, {
    sezioni: elaborato.sezioni.map((s) => ({ titolo: s.titolo, piena: s.piena })),
    opzioni: dati.opzioni,
    normeRitirate: ritirate,
    valoriSenzaFonte: senzaFonte,
    esercizio: dati.esercizio,
  });

  for (const s of modello.sezioni) {
    if (!s.obbligatoria) continue;
    if (s.soloSe && !dati.opzioni.includes(s.soloSe)) continue;
    const presente = elaborato.sezioni.find((x) => x.titolo === s.titolo);
    if (!presente) {
      mancanze.push({
        tipo: "sezione-mancante",
        chi: "verzero",
        sezione: s.titolo,
        messaggio: `Manca la sezione «${s.titolo}», che la struttura del documento richiede.`,
        rimedio: "Non serve niente da te: è un difetto della composizione, e lo correggiamo noi.",
      });
    } else if (!presente.piena && !mancanze.some((m) => m.sezione === s.titolo)) {
      // Vuota senza che nessun compositore abbia detto perché: la si
      // dichiara lo stesso, perché una sezione obbligatoria vuota non
      // esce mai in silenzio.
      mancanze.push({
        tipo: "sezione-vuota",
        chi: "verzero",
        sezione: s.titolo,
        messaggio: `La sezione «${s.titolo}» è vuota.`,
        rimedio: "La controlliamo noi: non risulta un dato mancante da parte tua.",
      });
    }
  }

  /* 2. I dati. */
  for (const testo of senzaFonte) {
    mancanze.push({
      tipo: "valore-senza-fonte",
      chi: "verzero",
      messaggio: `Il valore «${testo}» è nel documento senza una fonte tracciata.`,
      rimedio: "Non serve niente da te: un dato senza fonte è un difetto della composizione, e il documento non esce finché non è corretto.",
    });
  }
  for (const id of esame.senzaIngressi) {
    const f = perId.get(id)!;
    mancanze.push({
      tipo: "valore-senza-fonte",
      chi: "verzero",
      messaggio: `Il calcolo ${id} («${f.titolo}») non dichiara da quali dati parte.`,
      rimedio: "Non serve niente da te: un calcolo senza ingressi tracciati è un difetto della composizione, e il documento non esce finché non è corretto.",
    });
  }
  for (const id of esame.nonConfermate) {
    const f = perId.get(id)!;
    mancanze.push({
      tipo: "fonte-non-confermata",
      chi: "impresa",
      messaggio: `La fonte ${id} («${f.titolo}») porta nel documento dati non ancora confermati.`,
      rimedio: "Conferma i valori letti da quel documento: finché non lo fai, non possono entrare in un documento consegnato.",
      azione: { etichetta: "Vai ai documenti", href: "/dashboard/documenti" },
    });
  }

  /* 3. Le norme: i riferimenti dichiarati, e ogni designazione nel testo. */
  for (const r of elaborato.riferimenti) {
    if (r.stato === "in vigore") continue;
    mancanze.push({
      tipo: r.stato === "non registrata" ? "norma-non-registrata" : "norma-ritirata",
      chi: "verzero",
      messaggio:
        r.stato === "non registrata"
          ? `Il documento cita «${r.designazione}», che non è nel registro delle norme verificate.`
          : `Il documento cita ${r.designazione}, che nel registro risulta «${r.stato}».`,
      rimedio: "Non serve niente da te: la designazione va verificata e aggiornata nel modello del documento prima della consegna.",
    });
  }
  const perCodice = new Map(REGISTRO_NORME.map((n) => [n.codice, n]));
  for (const riga of testoCompleto(elaborato)) {
    for (const m of riga.matchAll(FORMA_DESIGNAZIONE)) {
      const voce = perCodice.get(m[0]);
      if (!voce) {
        mancanze.push({
          tipo: "norma-non-registrata",
          chi: "verzero",
          messaggio: `Nel testo compare la designazione ${m[0]}, che non è nel registro delle norme verificate.`,
          rimedio: "Non serve niente da te: va verificata su UNI e registrata prima della consegna.",
        });
      } else if (voce.stato === "ritirata" && !/ritirat/i.test(riga)) {
        mancanze.push({
          tipo: "norma-ritirata",
          chi: "verzero",
          messaggio: `Nel testo compare ${m[0]}, ritirata e sostituita da ${voce.sostituita ?? "un'edizione successiva"}.`,
          rimedio: "Non serve niente da te: il testo va aggiornato all'edizione in vigore prima della consegna.",
        });
      }
    }
  }

  /* 4. La versione dello standard per QUESTO esercizio. */
  if (modello.standard) {
    const esito = statoVersioneDocumento(modello.standard, modello.versione, dati.esercizio);
    if (esito.superata) {
      mancanze.push({
        tipo: "versione-superata",
        chi: "verzero",
        messaggio: esito.messaggio ?? "La versione dello standard non è quella applicabile all'esercizio.",
        rimedio: "Non serve niente da te: il documento va ricomposto sulla versione applicabile, e lo facciamo noi.",
      });
    }
  }
  if (elaborato.frontespizio.esercizio !== dati.esercizio) {
    mancanze.push({
      tipo: "fuori-esercizio",
      chi: "verzero",
      messaggio: `La copertina dichiara l'esercizio ${elaborato.frontespizio.esercizio}, l'organizzazione rendiconta il ${dati.esercizio}.`,
      rimedio: "Non serve niente da te: il documento va ricomposto sull'esercizio giusto.",
    });
  }

  /* 5. I segnaposto. */
  const rimasti = new Set(testoCompleto(elaborato).flatMap((t) => t.match(SEGNAPOSTO) ?? []));
  for (const s of rimasti) {
    mancanze.push({
      tipo: "segnaposto",
      chi: "verzero",
      messaggio: `Nel testo è rimasto il segnaposto ${s}.`,
      rimedio: "Non serve niente da te: è un difetto del modello, e il documento non esce finché non è corretto.",
    });
  }

  /* 6. I periodi dei documenti di origine. */
  for (const f of elaborato.fonti) {
    if (!f.periodo) continue;
    if (annoDi(f.periodo.al) < dati.esercizio || annoDi(f.periodo.dal) > dati.esercizio) {
      mancanze.push({
        tipo: "fuori-esercizio",
        chi: "impresa",
        messaggio: `«${f.titolo}» si riferisce a un periodo fuori dall'esercizio ${dati.esercizio}, e il documento lo usa.`,
        rimedio: "Controlla il periodo letto sul documento: se è giusto, quel documento non appartiene a questo esercizio.",
        azione: { etichetta: "Vai ai documenti", href: "/dashboard/documenti" },
      });
    }
  }

  // Il controllo generico ha detto qualcosa che quello puntuale non ha
  // detto? Allora il puntuale ha un buco, e il documento non esce lo stesso.
  if (!generico.conforme && mancanze.length === 0) {
    for (const testo of generico.mancanze) {
      mancanze.push({
        tipo: "sezione-vuota",
        chi: "verzero",
        messaggio: testo,
        rimedio: "Non serve niente da te: lo controlliamo noi.",
      });
    }
  }

  const finali = ordinaMancanze(senzaDoppioni(mancanze));
  if (finali.length > 0) return { consegnabile: false, mancanze: finali };
  return {
    consegnabile: true,
    elaborato: elaborato as ElaboratoConsegnabile,
    mancanze: [],
  };
}

/** Le celle-dato di tutto il documento: serve alle prove. */
export function tuttiIValori(e: Elaborato) {
  return e.sezioni.flatMap((s) => s.blocchi.flatMap(valoriDi)).filter(eValore);
}
