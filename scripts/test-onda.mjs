/*
 * PROVE SULL'ONDA — il fascio che muta.
 *
 * Un'animazione non si collauda guardandola: un difetto che compare al
 * terzo minuto, o solo a 2560px, o su una particella su cento, non si
 * vede in un'occhiata. Qui si simula il campo davvero — con l'inerzia,
 * passo per passo — su quattro larghezze e minuti di tempo simulato.
 *
 * Le due prove che contano di più:
 *   - il MOVIMENTO NON SI RIPETE e non ha un ritmo riconoscibile;
 *   - il CLAIM resta leggibile sopra l'onda IN MOVIMENTO, nel punto
 *     peggiore, non su fondo uniforme.
 *
 * Uso:  node --import ./scripts/risolutore-ts.mjs scripts/test-onda.mjs
 */

import {
  ONDA_CONTENUTA,
  ONDA_DECISA,
  ONDA_SOGLIA,
  PINO,
  PRESET,
  SBORDO,
  accento,
  assesta,
  avanza,
  fattoreMaschera,
  fattoreMaschere,
  formaFascio,
  opacita,
  posizionePerLarghezza,
  quante,
  raggioDi,
  semina,
} from "@/lib/onda";
import { fbm3, rumore3 } from "@/lib/rumore";

let ok = 0;
let ko = 0;
const prova = (nome, condizione, dettaglio = "") => {
  if (condizione) {
    ok++;
    console.log(`  ok   ${nome}${dettaglio ? ` — ${dettaglio}` : ""}`);
  } else {
    ko++;
    console.log(`  KO   ${nome}${dettaglio ? ` — ${dettaglio}` : ""}`);
  }
};

/** Generatore deterministico: due esecuzioni devono dire la stessa cosa. */
function casoFisso(seme = 20260821) {
  let s = seme;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SCHERMI = [
  { nome: "mobile 375", visibile: 375, H: 760 },
  { nome: "desktop 1280", visibile: 1280, H: 720 },
  { nome: "grande 1440", visibile: 1440, H: 720 },
  { nome: "grande 2560", visibile: 2560, H: 800 },
].map((s) => ({ ...s, L: s.visibile + SBORDO * 2 }));

/* LE RIGHE DEL CLAIM, con la geometria dichiarata dall'hero: occhiello,
   due righe di display, sottotitolo, fila dei bottoni. Misure generose —
   una riga più larga del vero protegge di meno, quindi il caso peggiore
   che ne esce è conservativo. */
function righeDi(s, m = ONDA_SOGLIA.maschera) {
  const disp =
    s.visibile < 640 ? 40 : s.visibile < 768 ? 52 : s.visibile < 1280 ? 72 : 80;
  const utile = Math.min(896, s.visibile * 0.92);
  const blocco = [
    { w: Math.min(utile, 340), h: 16, gap: 28 },
    { w: Math.min(utile, disp * 8.9), h: disp * 1.02, gap: 0 },
    { w: Math.min(utile, disp * 5.2), h: disp * 1.02, gap: 28 },
    { w: Math.min(672, utile), h: s.visibile < 640 ? 120 : 82, gap: 40 },
    { w: Math.min(utile, 430), h: 60, gap: 0 },
  ];
  const totale = blocco.reduce((a, r) => a + r.h + r.gap, 0);
  let y = s.H / 2 - totale / 2;
  // Sotto i 640px il componente usa UNA maschera sul blocco intero, non
  // una per riga: qui si rispecchia la stessa regola, altrimenti la
  // prova misurerebbe una cosa che il sito non fa.
  if (s.visibile < 640) {
    const w = Math.max(...blocco.map((r) => r.w));
    const cy = s.H / 2;
    return [
      {
        cx: s.L / 2,
        cy,
        rx: (w / 2) * m.rx,
        ry: (totale / 2) * m.ry,
        minimo: m.minimo,
        testo: {
          x0: s.L / 2 - w / 2,
          x1: s.L / 2 + w / 2,
          y0: cy - totale / 2,
          y1: cy + totale / 2,
        },
      },
    ];
  }
  return blocco.map((r) => {
    const cy = y + r.h / 2;
    y += r.h + r.gap;
    return {
      cx: s.L / 2,
      cy,
      rx: (r.w / 2) * m.rx,
      ry: (r.h / 2) * m.ry,
      minimo: m.minimo,
      testo: {
        x0: s.L / 2 - r.w / 2,
        x1: s.L / 2 + r.w / 2,
        y0: cy - r.h / 2,
        y1: cy + r.h / 2,
      },
    };
  });
}

/* --- Contrasto, secondo WCAG --- */
const canale = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminanza = ([r, g, b]) =>
  0.2126 * canale(r) + 0.7152 * canale(g) + 0.0722 * canale(b);
const contrasto = (c1, c2) => {
  const l1 = luminanza(c1);
  const l2 = luminanza(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const sopraBianco = ([r, g, b], a) => [
  Math.round(255 + (r - 255) * a),
  Math.round(255 + (g - 255) * a),
  Math.round(255 + (b - 255) * a),
];
/* L'HERO E SU FONDO SCURO: il testo è chiaro e le particelle, essendo
   luminose, SCHIARISCONO il fondo — quindi abbassano il contrasto
   esattamente come le scure lo abbassavano sotto un testo scuro. Il
   vincolo si allenta molto (si parte da 15:1), non sparisce. */
const FONDO_SCURO = [10, 46, 31]; // #0A2E1F
const LUCE = [255, 255, 255]; // le particelle in palette invertita
const sopraFondo = ([r, g, b], a) => [
  Math.round(FONDO_SCURO[0] + (r - FONDO_SCURO[0]) * a),
  Math.round(FONDO_SCURO[1] + (g - FONDO_SCURO[1]) * a),
  Math.round(FONDO_SCURO[2] + (b - FONDO_SCURO[2]) * a),
];
const TESTO_TENUE = [231, 240, 234]; // moss, il sottotitolo e la riga 1
const TESTO_CHIAVE = [255, 255, 255]; // bianco pieno, «in cloud.»
/** Fin dove può arrivare la velatura prima di scendere sotto 4,5:1. */
const VELATURA_LIMITE = (() => {
  for (let a = 0; a <= 1; a += 0.005) {
    if (contrasto(TESTO_TENUE, sopraFondo(LUCE, a)) < 4.5) {
      return Math.max(0, a - 0.005);
    }
  }
  return 1;
})();

/** Il profilo del bagliore, gli stessi stop del gradiente dello sprite. */
const profilo = (u) => {
  if (u >= 1) return 0;
  if (u <= 0.35) return 1 + (0.55 - 1) * (u / 0.35);
  if (u <= 0.7) return 0.55 + (0.12 - 0.55) * ((u - 0.35) / 0.35);
  return 0.12 * (1 - (u - 0.7) / 0.3);
};

/* ================================================================== */
/* 1. IL MOVIMENTO: organico, non riconoscibile                        */
/* ================================================================== */
console.log("\nil movimento");

/* Il campo non deve avere periodo: si confronta il profilo della linea a
   t=0 con quello a decine di istanti successivi, fino a cinque minuti. */
const Lp = 1280 + SBORDO * 2;
const Hp = 720;
const profiloLinea = (t) =>
  Array.from({ length: 120 }, (_, i) =>
    formaFascio((i / 119) * Lp, t, Lp, Hp, ONDA_DECISA).centro,
  );
const base0 = profiloLinea(0);
// La dispersione del profilo è il metro: uno scarto pari alla
// dispersione vuol dire «forma completamente diversa», zero vuol dire
// «identica». Senza normalizzare, la soglia dipenderebbe dall'ampiezza.
const mediaBase = base0.reduce((a, b) => a + b, 0) / base0.length;
const dispersione = Math.sqrt(
  base0.reduce((a, v) => a + (v - mediaBase) ** 2, 0) / base0.length,
);
let somiglianzaMax = 0;
let quandoMax = 0;
for (let t = 4; t <= 300; t += 2) {
  const p = profiloLinea(t);
  let scarto = 0;
  for (let i = 0; i < p.length; i++) scarto += Math.abs(p[i] - base0[i]);
  scarto /= p.length;
  const somiglianza = Math.max(0, 1 - scarto / (1.4 * dispersione));
  if (somiglianza > somiglianzaMax) {
    somiglianzaMax = somiglianza;
    quandoMax = t;
  }
}
prova(
  "la forma non torna mai uguale in cinque minuti",
  somiglianzaMax < 0.85,
  `somiglianza massima ${(somiglianzaMax * 100).toFixed(0)}% (a ${quandoMax}s)`,
);

/* Prova molto più discriminante: l'IMPRONTA dello stato completo del
   fascio — linea, larghezza, densità e sdoppiamento in tre punti — non
   deve mai tornare vicina a quella iniziale. Una forma che si ripete
   riporterebbe indietro tutti e dodici i numeri insieme, cosa che il
   caso non fa. */
const impronta = (t) =>
  [0.25, 0.5, 0.75].flatMap((u) => {
    const f = formaFascio(u * Lp, t, Lp, Hp, ONDA_DECISA);
    return [f.centro / Hp, f.semi / Hp, f.densita, f.sdoppiamento];
  });
const imp0 = impronta(0);
const vicinanzaA = (t) => {
  const v = impronta(t);
  let scarto = 0;
  for (let i = 0; i < v.length; i++) scarto += Math.abs(v[i] - imp0[i]);
  return Math.max(0, 1 - scarto / 0.9);
};
/* Nei primi secondi l'impronta somiglia a quella iniziale, ed è giusto
   così: il campo è continuo, non salta. La domanda vera è un'altra —
   una volta che la forma È cambiata, ci TORNA? Si cerca l'istante in cui
   se ne è andata davvero, e da lì in poi si guarda se rientra. */
let quandoDiversa = null;
for (let t = 1; t <= 300; t += 1) {
  if (vicinanzaA(t) < 0.4) {
    quandoDiversa = t;
    break;
  }
}
let vicinanzaMax = 0;
let quandoImp = 0;
if (quandoDiversa !== null) {
  for (let t = quandoDiversa; t <= 300; t += 1) {
    const v = vicinanzaA(t);
    if (v > vicinanzaMax) {
      vicinanzaMax = v;
      quandoImp = t;
    }
  }
}
prova(
  "la forma cambia davvero configurazione",
  quandoDiversa !== null && quandoDiversa < 60,
  quandoDiversa === null ? "non cambia mai" : `diversa dopo ${quandoDiversa}s`,
);
prova(
  "e una volta cambiata non ci ritorna",
  vicinanzaMax < 0.7,
  `rientro massimo ${(vicinanzaMax * 100).toFixed(0)}% (a ${quandoImp}s)`,
);

/* Nessun ritmo prevedibile: le creste della linea non devono essere
   equidistanti. Con una sinusoide la distanza fra i massimi è costante. */
const istanteCampione = 41.7;
const linea = profiloLinea(istanteCampione);
const creste = [];
for (let i = 1; i < linea.length - 1; i++) {
  if (linea[i] > linea[i - 1] && linea[i] > linea[i + 1]) creste.push(i);
}
const distanze = creste.slice(1).map((v, i) => v - creste[i]);
const media = distanze.reduce((a, b) => a + b, 0) / Math.max(1, distanze.length);
const scartoRel =
  distanze.length > 1
    ? Math.sqrt(
        distanze.reduce((a, d) => a + (d - media) ** 2, 0) / distanze.length,
      ) / media
    : 1;
prova(
  "le creste non sono equidistanti (nessun ritmo di sinusoide)",
  distanze.length < 2 || scartoRel > 0.25,
  `${creste.length} creste, dispersione ${(scartoRel * 100).toFixed(0)}%`,
);

/* Il rumore deve essere continuo: nessun salto fra punti vicini. */
let saltoRumore = 0;
for (let i = 0; i < 4000; i++) {
  const x = i * 0.01;
  saltoRumore = Math.max(
    saltoRumore,
    Math.abs(rumore3(x + 0.01, 3.3, 1.1) - rumore3(x, 3.3, 1.1)),
  );
}
prova("il campo di rumore è continuo", saltoRumore < 0.05,
  `salto massimo ${saltoRumore.toFixed(4)} su passo 0,01`);
prova("il rumore resta nell'intervallo atteso",
  Array.from({ length: 500 }, (_, i) => Math.abs(fbm3(i * 0.37, i * 0.11, i * 0.05)))
    .every((v) => v <= 1));

/* Il fascio deve davvero cambiare configurazione: larghezza, densità e
   sdoppiamento devono variare in modo sensibile nel tempo. */
const campioniForma = Array.from({ length: 400 }, (_, i) =>
  formaFascio(Lp * 0.5, i * 0.9, Lp, Hp, ONDA_DECISA),
);
const escursione = (chiave) => {
  const v = campioniForma.map((f) => f[chiave]);
  return Math.max(...v) - Math.min(...v);
};
// 3,5% dell'altezza di semi-larghezza vuol dire che il fascio si allarga
// e si stringe di circa il 7% dell'hero: a occhio è un respiro evidente.
prova("la larghezza del fascio si dilata e si restringe",
  escursione("semi") > Hp * 0.035,
  `escursione ${Math.round(escursione("semi"))}px di semi-larghezza, cioè ${Math.round(escursione("semi") * 2)}px di fascio`);
prova("la densità si sposta lungo il percorso",
  escursione("densita") > 0.3,
  `escursione ${escursione("densita").toFixed(2)}`);
const sdoppiamenti = campioniForma.map((f) => f.sdoppiamento);
prova("il fascio ogni tanto si sdoppia e si riunisce",
  Math.max(...sdoppiamenti) > 0.25 && Math.min(...sdoppiamenti) < 0.05,
  `da ${Math.min(...sdoppiamenti).toFixed(2)} a ${Math.max(...sdoppiamenti).toFixed(2)}`);

/* ================================================================== */
/* 2. PER OGNI LARGHEZZA: presenza, inerzia, contrasto                  */
/* ================================================================== */

for (const s of SCHERMI) {
  const c = {
    ...ONDA_SOGLIA,
    posizione: posizionePerLarghezza(s.visibile, ONDA_SOGLIA),
  };
  const n = quante(s.L, c);
  console.log(`\n${s.nome} — ${n} particelle`);
  const parti = semina(n, s.L, s.H, c, casoFisso());
  const righe = righeDi(s);
  assesta(parti, 0, s.L, s.H, c);

  /* Si simula davvero, con l'inerzia: tre minuti a 60fps campionando
     ogni mezzo secondo. */
  const PASSO_T = 1 / 60;
  const CAMPIONA_OGNI = 30;
  const FOTOGRAMMI = 60 * 180;
  let alta = Infinity;
  let bassa = -Infinity;
  let saltoMax = 0;
  let strappoMax = 0;
  let coperturaPeggiore = 0;
  let raggioMin = Infinity;
  let raggioMax = -Infinity;
  const precedenti = parti.map((p) => p.y);
  const spostamenti = parti.map(() => 0);

  for (let f = 0; f < FOTOGRAMMI; f++) {
    const t = f * PASSO_T;
    avanza(parti, PASSO_T, t, s.L, s.H, c);
    for (let i = 0; i < parti.length; i++) {
      const p = parti[i];
      const sp = p.y - precedenti[i];
      saltoMax = Math.max(saltoMax, Math.abs(sp));
      if (f > 1) strappoMax = Math.max(strappoMax, Math.abs(sp - spostamenti[i]));
      spostamenti[i] = sp;
      precedenti[i] = p.y;
    }
    if (f % CAMPIONA_OGNI !== 0) continue;

    const vicine = [];
    for (const p of parti) {
      const a0 = opacita(p, t, s.L, s.H, c);
      if (a0 <= 0.004) continue;
      alta = Math.min(alta, p.y);
      bassa = Math.max(bassa, p.y);
      const r = raggioDi(p, t, s.L, s.H, c);
      raggioMin = Math.min(raggioMin, r);
      raggioMax = Math.max(raggioMax, r);
      const a = a0 * fattoreMaschere(p.x, p.y, righe);
      if (a > 0.004) vicine.push({ x: p.x, y: p.y, a, raggio: r * 3 });
    }
    // Il caso peggiore si cerca solo ogni tre campioni: è la parte cara,
    // e la forma cambia lentamente.
    if (f % (CAMPIONA_OGNI * 3) !== 0) continue;
    for (const r of righe) {
      for (let x = r.testo.x0; x <= r.testo.x1; x += 24) {
        for (let y = r.testo.y0; y <= r.testo.y1; y += 24) {
          let trasparenza = 1;
          for (const v of vicine) {
            const dx = x - v.x;
            const dy = y - v.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d >= v.raggio) continue;
            trasparenza *= 1 - v.a * profilo(d / v.raggio);
          }
          coperturaPeggiore = Math.max(coperturaPeggiore, 1 - trasparenza);
        }
      }
    }
  }

  const fascia = (bassa - alta) / s.H;
  prova("la fascia occupa una porzione ampia dell'hero",
    fascia >= 0.4 && fascia <= 0.8,
    `${Math.round(fascia * 100)}% dell'altezza fra cresta e ventre`);
  prova("la fascia attraversa la banda centrale (passa dietro il claim)",
    alta < s.H * 0.45 && bassa > s.H * 0.55,
    `da ${Math.round(alta)}px a ${Math.round(bassa)}px su ${s.H}px`);

  /* L'INERZIA: nessuna particella cambia posizione di scatto. */
  // Uno scatto non è un movimento veloce: è un movimento che CAMBIA di
  // colpo. Si misura lo strappo — la variazione dello spostamento fra un
  // fotogramma e il successivo — che con l'inerzia deve restare una
  // frazione di pixel qualunque cosa faccia il campo.
  prova("nessuno scatto: l'inerzia tiene il movimento morbido",
    strappoMax < 0.25,
    `strappo massimo ${strappoMax.toFixed(4)}px, velocità di punta ${saltoMax.toFixed(2)}px/fotogramma`);

  /* I RAGGI variano nel tempo e nello spazio, non solo per particella. */
  prova("i raggi coprono l'intervallo dichiarato",
    raggioMin >= 0.5 && raggioMax >= 4 && raggioMax <= 9,
    `da ${raggioMin.toFixed(2)}px a ${raggioMax.toFixed(2)}px`);

  /* IL CONTRASTO, misurato sopra l'onda in movimento. */
  const fondo = sopraFondo(LUCE, Math.min(1, coperturaPeggiore));
  const cTenue = contrasto(TESTO_TENUE, fondo);
  const cChiave = contrasto(TESTO_CHIAVE, fondo);
  prova("il claim resta leggibile nel punto peggiore dell'onda in movimento",
    cTenue >= 4.5,
    `fondo peggiore rgb(${fondo.join(",")}) — riga 1 e sottotitolo ${cTenue.toFixed(2)}:1`);
  prova("il bianco pieno di «in cloud.» regge più del resto", cChiave > cTenue,
    `«in cloud.» ${cChiave.toFixed(2)}:1 contro ${cTenue.toFixed(2)}:1`);
  prova("la maschera tiene l'onda a velo dietro il testo",
    coperturaPeggiore < VELATURA_LIMITE,
    `velatura massima ${(coperturaPeggiore * 100).toFixed(1)}% sul limite di ${(VELATURA_LIMITE * 100).toFixed(1)}%`);

  /* L'ACCENTO resta una minoranza centrale. */
  const visibili = parti.filter((p) => opacita(p, 90, s.L, s.H, c) > 0.004);
  const accentate = visibili.filter((p) => accento(p, s.L) > 0.5);
  const quota = (accentate.length / visibili.length) * 100;
  prova("l'accento è una minoranza", quota > 2 && quota < 25,
    `${quota.toFixed(1)}% delle particelle visibili`);

  /* Il PRIMO PIANO esiste ed è una piccola quota. */
  const avanti = parti.filter((p) => p.avanti).length;
  const quotaAvanti = (avanti / parti.length) * 100;
  prova("le particelle in primo piano sono il 5-8%",
    quotaAvanti >= 3 && quotaAvanti <= 11,
    `${quotaAvanti.toFixed(1)}%`);

  /* NIENTE TAGLI NETTI ai bordi. */
  const alBordo = parti.map((p) =>
    opacita({ ...p, x: -SBORDO }, 30, s.L, s.H, c),
  );
  prova("al bordo del canvas l'opacità è nulla (esce in dissolvenza)",
    Math.max(...alBordo) < 0.005,
    `massima ${Math.max(...alBordo).toFixed(4)}`);
}

/* ================================================================== */
/* 3. LE DUE CALIBRAZIONI e i preset del riuso                          */
/* ================================================================== */
console.log("\ncalibrazioni e preset");
prova("la contenuta è davvero più discreta della decisa",
  ONDA_CONTENUTA.opacita < ONDA_DECISA.opacita &&
    ONDA_CONTENUTA.raggio < ONDA_DECISA.raggio,
  `opacità ${Math.round(ONDA_CONTENUTA.opacita * 100)}% contro ${Math.round(ONDA_DECISA.opacita * 100)}%`);
prova("le due calibrazioni hanno lo stesso movimento",
  ONDA_CONTENUTA.velocita === ONDA_DECISA.velocita &&
    ONDA_CONTENUTA.posizione === ONDA_DECISA.posizione);
/*
 * La discrezione di un preset non si giudica dall'opacità ma da quanto
 * schiarisce o scurisce il fondo sotto il testo della sua sezione.
 *
 * Sui fondi CHIARI resta la regola del brief: sotto il 25%, perché lì il
 * testo è scuro e sottile e non c'è una maschera a proteggerlo. Sui
 * fondi SCURI si misura: le sezioni non passano un riferimento al testo,
 * quindi si prende il caso peggiore ovunque nella fascia e si calcola il
 * contrasto del bianco sopra quel fondo.
 */
for (const [nome, cfg] of Object.entries(PRESET)) {
  if (cfg.palette === "chiara") {
    prova(`«${nome}» resta discreto`, cfg.opacita <= 0.25,
      `opacità ${Math.round(cfg.opacita * 100)}%`);
    continue;
  }
  const L = 1280 + SBORDO * 2;
  const H = 620;
  const c = { ...cfg, posizione: posizionePerLarghezza(1280, cfg) };
  const parti = semina(quante(L, c), L, H, c, casoFisso());
  assesta(parti, 0, L, H, c);
  let peggiore = 0;
  for (let f = 0; f < 60 * 90; f++) {
    const tt = f / 60;
    avanza(parti, 1 / 60, tt, L, H, c);
    if (f % 150 !== 0) continue;
    const vicine = [];
    for (const p of parti) {
      const a = opacita(p, tt, L, H, c);
      if (a > 0.004) vicine.push({ x: p.x, y: p.y, a, raggio: raggioDi(p, tt, L, H, c) * 3 });
    }
    // Il testo di quelle sezioni sta nella colonna centrale.
    for (let x = L * 0.3; x <= L * 0.7; x += 26) {
      for (let y = H * 0.2; y <= H * 0.8; y += 26) {
        let tr = 1;
        for (const v of vicine) {
          const dx = x - v.x;
          const dy = y - v.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < v.raggio) tr *= 1 - v.a * profilo(d / v.raggio);
        }
        peggiore = Math.max(peggiore, 1 - tr);
      }
    }
  }
  const fondo = sopraFondo(LUCE, Math.min(1, peggiore));
  const cBianco = contrasto(LUCE, fondo);
  prova(
    `«${nome}» non compromette il testo bianco della sua sezione`,
    cBianco >= 4.5,
    `velatura ${(peggiore * 100).toFixed(1)}% → bianco ${cBianco.toFixed(2)}:1`,
  );
}
prova("i preset scuri usano la palette invertita",
  PRESET.tecnica.palette === "scura" && PRESET.tenueScura.palette === "scura");

/* La maschera non ha bordi visibili. */
const m = { cx: 0, cy: 0, rx: 400, ry: 200, minimo: 0.02 };
let gradino = 0;
let prec = fattoreMaschera(-500, 0, m);
for (let x = -500; x <= 500; x += 1) {
  const v = fattoreMaschera(x, 0, m);
  gradino = Math.max(gradino, Math.abs(v - prec));
  prec = v;
}
prova("la maschera sfuma senza gradini", gradino < 0.02,
  `variazione massima ${(gradino * 100).toFixed(2)}% al pixel`);

console.log(`\n${ok} prove superate, ${ko} fallite`);
if (ko > 0) process.exitCode = 1;
