/**
 * CONTROLLO DEL LESSICO — le parole che non possiamo usare.
 *
 *   node scripts/controllo-lessico.mjs
 *
 * Gira PRIMA DELLA BUILD (`prebuild` in package.json): se una parola
 * vietata rientra, la build si ferma. Non è pedanteria — è che questa
 * regola è già stata violata due volte, e la seconda l'ho reintrodotta
 * io scrivendo un titolo che suonava bene. Una regola che vive solo in
 * un documento è una regola che rientra alla terza riscrittura.
 *
 * ═══ IL DIVIETO PRINCIPALE (SPEC §12.O) ═══
 * I professionisti VALIDANO, CONVALIDANO, ANALIZZANO — mai «firmano».
 * Non è una preferenza di stile: la firma implica un'assunzione di
 * responsabilità professionale e un'asseverazione che NON fanno parte
 * del servizio. Scriverlo significa promettere una cosa che non
 * vendiamo, su una pagina pubblica.
 *
 * ═══ PERCHÉ NON BASTA CERCARE «FIRMA» ═══
 * Perché la parola ha usi legittimi che non c'entrano niente: la firma
 * in calce a un'email, il FOGLIO FIRMA che è un tipo di documento che
 * i clienti ci portano, la firma DKIM della posta, la «firma visiva»
 * del marchio, un indirizzo firmato dello storage. Un controllo che
 * fallisse su quelli verrebbe disattivato in una settimana, e allora
 * tanto varrebbe non averlo. Qui c'è un elenco chiuso di usi ammessi:
 * tutto il resto è un errore finché qualcuno non lo aggiunge
 * consapevolmente a questa lista.
 *
 * I COMMENTI NON SI CONTROLLANO: lì si può e si deve parlare del
 * divieto, altrimenti non si può spiegarlo.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ */

const REGOLE = [
  {
    nome: "il verbo della verifica umana",
    /* Qualunque forma di «firmare»: firma, firmano, firmata, firmatario. */
    cerca: /\bfirm(a|e|i|o|ano|ato|ata|ati|ate|are|ando|atario|atari)?\b/gi,
    perche:
      "SPEC §12.O — i professionisti VALIDANO / CONVALIDANO / ANALIZZANO, mai «firmano»: la firma implica un'assunzione di responsabilità professionale e un'asseverazione che non fanno parte del servizio.",
    /**
     * Gli usi che non c'entrano col divieto. Vanno scritti per intero e
     * in minuscolo: il confronto è su una finestra di testo attorno
     * all'occorrenza, non sulla parola isolata.
     */
    ammessi: [
      "firma email",
      "firma e-mail",
      "in firma",
      "firma del marchio",
      "firma visiva",
      "firma dkim",
      "foglio firma",
      "fogli firma",
      "foglio firme",
      "fogli firme",
      "firma digitale",
      "indirizzo firmato",
      "url firmato",
      "documento firmato a mano",
      "firma grafica",
      "riga per la firma",
      // Il foglio firma è un TIPO DI DOCUMENTO che i clienti ci portano,
      // e le firme lì sopra si contano: non c'entrano col divieto.
      "foglio-firme",
      "foglio-firma",
      "conta le firme",
      "le firme sono",
      "delle firme",
      "(firm|present)",
      // Un documento che il CLIENTE ci consegna già firmato: parliamo
      // della sua firma, non della nostra.
      "scansione firmata",
      // Un documento firmato a parte, cioè un contratto: è il cliente
      // che firma, e non c'entra con la verifica dei nostri tecnici.
      "documento firmato a",
      // Le firme SUL foglio del cliente, quelle che si contano.
      "numero di firme",
      // La firma della direzione su una politica aziendale: è del
      // cliente, ed è un contenuto che ci aspettiamo di trovare nel suo
      // documento, non qualcosa che facciamo noi.
      "firma della direzione",
      // La sigla di chi ha fatto la manutenzione, sul registro del
      // cliente: è sua, e la leggiamo, non la mettiamo.
      "firma o sigla",
    ],
  },
  {
    nome: "le promesse di tempo",
    /*
     * Ogni numero promesso è un ostaggio (SPEC §12.O). Il divieto vale
     * per il TEMPO DI CONSEGNA — quanto ci mettiamo noi a produrre un
     * documento — ed è la regola che rientra più facilmente di tutte,
     * perché «in pochi giorni» suona come un vantaggio e non come una
     * promessa. Al momento di scrivere questa regola ce n'erano quattro
     * vive in pagina, sopravvissute a due revisioni: «Giorni, non mesi»,
     * «documenti conformi pronti in pochi giorni», «rapida nei tempi» e
     * «tempi che si misurano in giorni», in due pagine diverse.
     *
     * Non cerca le durate in generale: cerca le forme in cui una durata
     * diventa una promessa. Una durata che il cliente LEGGE sul proprio
     * documento (un periodo di fatturazione, la validità di un
     * attestato) non ha nessuna di queste forme.
     */
    cerca:
      /\b(?:in|entro)\s+(?:pochi|poche|poch[ei]ssim[oi])\s+(?:minut|or|giorn|settiman|mes)\w*|\btempi\s+che\s+si\s+misurano\b|\b(?:giorni|settimane|ore|minuti),\s*non\s+(?:mesi|settimane|giorni|ore)\b|\brapid[aoie]\s+nei\s+tempi\b|\bpront[oiae]\s+in\s+(?:pochi|poche|un|una|due|tre|\d)|\b(?:in|entro)\s+(?:\d+|un|una|due|tre)\s+(?:or[ae]|giorn[oi]|settiman[ae]|mes[ei])\b/gi,
    perche:
      "SPEC §12.O — nessuna promessa sul tempo di consegna, in nessuna forma: ogni numero promesso è un ostaggio, e il payoff «A norma in tempo zero» parla del tempo del CLIENTE, non di una data di consegna.",
    /*
     * Il motore non parla al cliente: i suoi `perche` sono note
     * operative che spiegano un tetto di spesa a chi legge il codice, e
     * lì «concentrare in un mese» descrive il consumo del CLIENTE, non
     * un tempo che promettiamo noi. Il divieto riguarda ciò che si
     * legge in pagina.
     */
    escludi: [/^src\/lib\/motore\//],
    ammessi: [
      // Il tempo di RISPOSTA a chi ci scrive non è un tempo di
      // consegna: è un impegno su una cosa che dipende solo da noi
      // (pagina contatti), o un termine di legge (il mese del GDPR per
      // riscontrare una richiesta dell'interessato, pagina privacy).
      "rispond",
      "riscontr",
      "giorno lavorativo",
      "giorni lavorativi",
      // Una durata che sta SUL DOCUMENTO DEL CLIENTE — un periodo di
      // fatturazione, la validità di un attestato — la leggiamo, non la
      // promettiamo.
      "periodo di",
      "validità",
      "valido per",
      "scade fra",
      "ogni tre mesi",
      "ogni due mesi",
    ],
  },
];

/* ------------------------------------------------------------------ */

/** Toglie commenti di blocco e di riga: lì si parla del divieto. */
function senzaCommenti(testo) {
  return testo
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

function sorgenti(radice, out = []) {
  for (const voce of readdirSync(radice)) {
    const p = join(radice, voce);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(ts|tsx)$/.test(voce)) out.push(p);
  }
  return out;
}

/** La riga a cui appartiene un indice, per dirlo a chi deve correggere. */
function rigaDi(testo, indice) {
  return testo.slice(0, indice).split("\n").length;
}

let violazioni = 0;

for (const file of sorgenti("src")) {
  const originale = readFileSync(file, "utf8");
  const testo = senzaCommenti(originale);

  for (const regola of REGOLE) {
    if (regola.escludi?.some((r) => r.test(file))) continue;
    regola.cerca.lastIndex = 0;
    let m;
    while ((m = regola.cerca.exec(testo)) !== null) {
      // Una finestra attorno all'occorrenza: serve a riconoscere gli usi
      // ammessi, che sono locuzioni e non parole singole.
      // La finestra si normalizza: nel sorgente una locuzione può
      // essere spezzata da un a capo e da venti spazi di rientro, e
      // «documento firmato\n          a mano» non combacerebbe con
      // nessuna voce dell'elenco.
      const finestra = testo
        .slice(Math.max(0, m.index - 40), m.index + m[0].length + 40)
        .replace(/\s+/g, " ")
        .toLowerCase();
      if (regola.ammessi.some((a) => finestra.includes(a))) continue;

      const n = rigaDi(testo, m.index);
      const riga = originale.split("\n")[n - 1]?.trim() ?? "";
      console.error(`\n❌ ${file}:${n}  «${m[0]}» — ${regola.nome}`);
      console.error(`   ${riga.slice(0, 110)}`);
      violazioni++;
    }
  }
}

if (violazioni > 0) {
  console.error(
    `\n${violazioni} violazioni del lessico.\n\n${REGOLE.map((r) => `· ${r.perche}`).join("\n")}\n\nSe un uso è legittimo — la firma di un'email, un foglio firma — aggiungilo\nagli \`ammessi\` in scripts/controllo-lessico.mjs, consapevolmente.\n`,
  );
  process.exit(1);
}

console.log("✅ lessico: nessuna parola vietata nel testo del sito.");
