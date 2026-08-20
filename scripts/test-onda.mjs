/*
 * PROVE SULL'ONDA DI PARTICELLE.
 *
 * Un'animazione non si collauda guardandola: un difetto che compare ogni
 * quaranta secondi, o solo a 2560px, o solo su una particella su cento,
 * non si vede in un'occhiata. Qui la geometria si campiona — tre
 * larghezze, decine di istanti, migliaia di particelle — e si verifica
 * che le proprietà promesse valgano SEMPRE, non in media.
 *
 * Uso:  node --import ./scripts/risolutore-ts.mjs scripts/test-onda.mjs
 */

import {
  BASE,
  MARGINE,
  RISERVA_FONDO,
  AMPIEZZA_1,
  AMPIEZZA_2,
  SPESSORE,
  campana,
  curva,
  mentosita,
  opacita,
  oscillazione,
  posizioneY,
  quante,
  semina,
} from "@/lib/onda";

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
function casoFisso(seme = 20260820) {
  let s = seme;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SCHERMI = [
  { nome: "mobile 375", L: 375, H: 900 },
  { nome: "desktop 1280", L: 1280, H: 672 },
  { nome: "grande 2560", L: 2560, H: 760 },
];
const ISTANTI = Array.from({ length: 60 }, (_, i) => i * 3.7);

for (const s of SCHERMI) {
  console.log(`\n${s.nome} — ${quante(s.L)} particelle`);
  const parti = semina(quante(s.L), s.L, casoFisso());

  /* 1. LA FASCIA STA DOVE DEVE. La curva è ancorata al fondo: nessuna
        particella può salire nella zona del testo, in nessun istante. */
  let piuAlta = Infinity;
  let piuBassa = -Infinity;
  for (const t of ISTANTI) {
    for (const p of parti) {
      if (opacita(p, s.L) <= 0.004) continue;
      const y = posizioneY(p, t, s.L, s.H);
      // Il raggio del bagliore conta: il bordo morbido è largo 3r.
      piuAlta = Math.min(piuAlta, y - p.r * 3);
      piuBassa = Math.max(piuBassa, y + p.r * 3);
    }
  }
  const tetto = s.H - BASE - AMPIEZZA_1 - AMPIEZZA_2 - SPESSORE - 10;
  prova(
    "l'onda non sale mai sopra la fascia che le spetta",
    piuAlta >= tetto,
    `più alta ${Math.round(piuAlta)}px, limite ${Math.round(tetto)}px`,
  );
  // E la fascia sta dentro lo spazio che l'hero le riserva col padding:
  // è il legame fra il CSS e la matematica, quello che di solito si
  // rompe in silenzio.
  prova(
    "l'onda resta dentro la riserva dichiarata all'hero",
    piuAlta >= s.H - RISERVA_FONDO,
    `${Math.round(piuAlta - (s.H - RISERVA_FONDO))}px di margine sotto il testo`,
  );
  prova(
    "l'onda resta dentro la sezione",
    piuBassa <= s.H,
    `più bassa ${Math.round(piuBassa)}px su ${s.H}px`,
  );

  /* 2. DENSITÀ MAGGIORE AL CENTRO. Si somma l'opacità per terzi: è la
        quantità di colore che l'occhio vede davvero, non il conteggio. */
  const terzi = [0, 0, 0];
  for (const p of parti) {
    const u = Math.min(0.999, Math.max(0, p.x / s.L));
    terzi[Math.floor(u * 3)] += opacita(p, s.L);
  }
  const rapporto = terzi[1] / ((terzi[0] + terzi[2]) / 2);
  prova(
    "il centro è più denso degli estremi",
    rapporto > 1.8,
    `centro/estremi ${rapporto.toFixed(2)}×`,
  );

  /* 3. DISSOLVENZA AI BORDI. Nessuna particella può essere visibile
        mentre riavvolge il giro: se lo fosse, si vedrebbe sparire. */
  const aiBordi = parti
    .map((p) => ({ ...p, x: -MARGINE }))
    .map((p) => opacita(p, s.L));
  prova(
    "ai bordi l'opacità è nulla",
    Math.max(...aiBordi) < 0.005,
    `massima ${Math.max(...aiBordi).toFixed(4)}`,
  );

  /* 4. LA MENTA È UNA MINORANZA, E STA AL CENTRO. */
  const visibili = parti.filter((p) => opacita(p, s.L) > 0.004);
  const mentose = visibili.filter((p) => mentosita(p, s.L) > 0.5);
  const quota = (mentose.length / visibili.length) * 100;
  prova(
    "la menta è una minoranza",
    quota > 2 && quota < 25,
    `${quota.toFixed(1)}% delle particelle visibili`,
  );
  const fuoriCentro = mentose.filter((p) => {
    const u = p.x / s.L;
    return u < 0.2 || u > 0.8;
  });
  prova(
    "nessuna menta fuori dalla parte centrale",
    fuoriCentro.length === 0,
    `${fuoriCentro.length} fuori`,
  );
  // La transizione dev'essere continua: fra pino pieno e menta piena
  // devono esistere particelle a mezza strada, altrimenti è a blocchi.
  const intermedie = visibili.filter((p) => {
    const m = mentosita(p, s.L);
    return m > 0.05 && m < 0.95;
  });
  prova(
    "la transizione al menta è graduale, non a blocchi",
    intermedie.length > 0,
    `${intermedie.length} particelle in transizione`,
  );

  /* 5. NESSUNA PARTICELLA SI MUOVE COME UN'ALTRA. */
  const firme = new Set(
    parti.map((p) => `${p.f1.toFixed(6)}|${p.p1.toFixed(6)}|${p.v.toFixed(6)}`),
  );
  prova(
    "ogni particella ha fase, frequenza e velocità proprie",
    firme.size === parti.length,
    `${firme.size} firme su ${parti.length}`,
  );

  /* 6. IL MOVIMENTO NON SI RIPETE. Con due sinusoidi in rapporto aureo
        la somma non torna al punto di partenza: si verifica che dopo un
        periodo della fondamentale lo scarto sia ancora sensibile. */
  const p0 = parti[0];
  const periodo = (Math.PI * 2) / p0.f1;
  const scarti = [1, 2, 3, 5, 8].map((k) =>
    Math.abs(oscillazione(p0, 0) - oscillazione(p0, periodo * k)),
  );
  prova(
    "l'oscillazione non si ripete dopo il periodo fondamentale",
    Math.min(...scarti) > 0.05,
    `scarto minimo ${Math.min(...scarti).toFixed(3)}`,
  );

  /* 7. NESSUN SALTO. Fra due fotogrammi a 60fps lo spostamento
        verticale dev'essere sotto il pixel: nessuno scatto, nessun
        rimbalzo. */
  let saltoMax = 0;
  for (const t of ISTANTI) {
    for (const p of parti) {
      const a = posizioneY(p, t, s.L, s.H);
      const b = posizioneY(p, t + 1 / 60, s.L, s.H);
      saltoMax = Math.max(saltoMax, Math.abs(b - a));
    }
  }
  prova(
    "nessuno scatto fra un fotogramma e l'altro",
    saltoMax < 1,
    `spostamento massimo ${saltoMax.toFixed(3)}px per fotogramma`,
  );
}

/* 8. LA CAMPANA È SIMMETRICA E DOLCE: nessun gradino. */
console.log("\nforma della campana");
const passi = Array.from({ length: 101 }, (_, i) => campana(i / 100));
let gradinoMax = 0;
for (let i = 1; i < passi.length; i++) {
  gradinoMax = Math.max(gradinoMax, Math.abs(passi[i] - passi[i - 1]));
}
prova("la densità cambia senza gradini", gradinoMax < 0.03,
  `salto massimo ${gradinoMax.toFixed(4)}`);
prova("la campana è simmetrica", Math.abs(campana(0.2) - campana(0.8)) < 1e-9);

/* 9. LA CURVA È DAVVERO SINUOSA: due frequenze non multiple. */
console.log("\ncurva portante");
const L = 1280, H = 672;
const campioni = Array.from({ length: 200 }, (_, i) => curva((i / 199) * L, 0, L, H));
const escursione = Math.max(...campioni) - Math.min(...campioni);
prova("la curva ha un'escursione visibile", escursione > 40,
  `${Math.round(escursione)}px`);
// Con una sola sinusoide i massimi sarebbero equidistanti: si conta
// quanti cambi di direzione ci sono, che con due frequenze sono di più.
let inversioni = 0;
for (let i = 2; i < campioni.length; i++) {
  const d1 = campioni[i - 1] - campioni[i - 2];
  const d2 = campioni[i] - campioni[i - 1];
  if (d1 * d2 < 0) inversioni++;
}
prova("la curva non è una sinusoide sola", inversioni >= 2,
  `${inversioni} inversioni di direzione`);

console.log(`\n${ok} prove superate, ${ko} fallite`);
if (ko > 0) process.exitCode = 1;
