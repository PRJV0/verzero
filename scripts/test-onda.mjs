/*
 * PROVE SULL'ONDA.
 *
 * Un'animazione non si collauda guardandola: un difetto che compare al
 * quarantesimo secondo, o solo a 2560px, o su una particella su cento,
 * non si vede in un'occhiata. Qui la geometria si campiona — quattro
 * larghezze, ottanta istanti, migliaia di particelle — e si verifica che
 * le proprietà promesse valgano SEMPRE, non in media.
 *
 * La prova che conta di più è il CONTRASTO del claim sopra l'onda IN
 * MOVIMENTO, nel punto peggiore. Non su fondo uniforme.
 *
 * Uso:  node --import ./scripts/risolutore-ts.mjs scripts/test-onda.mjs
 */

import {
  A1,
  A2,
  A3,
  ONDA_HERO,
  PINO,
  PRESET,
  SBORDO,
  SPESSORE,
  accento,
  campana,
  curva,
  fattoreMaschera,
  fattoreMaschere,
  opacita,
  oscillazione,
  posizioneY,
  posizionePerLarghezza,
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

/* Le quattro larghezze richieste. `L` è la larghezza del CANVAS, che
   sborda di SBORDO da entrambi i lati rispetto alla parte visibile. */
const SCHERMI = [
  { nome: "mobile 375", visibile: 375, H: 760 },
  { nome: "desktop 1280", visibile: 1280, H: 720 },
  { nome: "grande 1440", visibile: 1440, H: 720 },
  { nome: "grande 2560", visibile: 2560, H: 800 },
].map((s) => ({ ...s, L: s.visibile + SBORDO * 2 }));

const ISTANTI = Array.from({ length: 80 }, (_, i) => i * 2.9);

/* LE RIGHE DEL CLAIM, con la geometria dichiarata dall'hero: occhiello,
   due righe di display, sottotitolo, fila dei bottoni. Sono misure
   generose — una riga più larga del vero protegge di meno, quindi il
   caso peggiore che ne esce è conservativo. */
function righeDi(s) {
  const disp = s.visibile < 640 ? 40 : s.visibile < 768 ? 52 : s.visibile < 1280 ? 72 : 80;
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
  return blocco.map((r) => {
    const cy = y + r.h / 2;
    y += r.h + r.gap;
    return {
      cx: s.L / 2,
      cy,
      rx: (r.w / 2) * 1.45,
      ry: (r.h / 2) * 1.55,
      minimo: 0.09,
      // Il rettangolo vero della riga, dove stanno le lettere.
      testo: { x0: s.L / 2 - r.w / 2, x1: s.L / 2 + r.w / 2, y0: cy - r.h / 2, y1: cy + r.h / 2 },
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
/** Un colore con opacità sopra il bianco. */
const sopraBianco = ([r, g, b], a) => [
  Math.round(255 + (r - 255) * a),
  Math.round(255 + (g - 255) * a),
  Math.round(255 + (b - 255) * a),
];

const TESTO_TENUE = sopraBianco([10, 61, 42], 0.8); // pine-dark/80
/**
 * Fin dove può arrivare la velatura prima che il contrasto scenda sotto
 * 4,5:1 — la soglia AA per il testo grande. Non è un numero scelto a
 * mano: si ricava risolvendo il contrasto.
 */
const VELATURA_LIMITE = (() => {
  for (let a = 0; a <= 1; a += 0.005) {
    if (contrasto(sopraBianco([10, 61, 42], 0.8), sopraBianco(PINO, a)) < 4.5) {
      return Math.max(0, a - 0.005);
    }
  }
  return 1;
})();
const TESTO_CHIAVE = [14, 82, 56]; // pino pieno, la parola «cloud»

for (const s of SCHERMI) {
  const c = {
    ...ONDA_HERO,
    posizione: posizionePerLarghezza(s.visibile, ONDA_HERO),
  };
  const n = quante(s.L, c);
  console.log(
    `\n${s.nome} — ${n} particelle, curva al ${Math.round(c.posizione * 100)}%`,
  );
  const parti = semina(n, s.L, c, casoFisso());
  const righe = righeDi(s);

  /* 1. L'ONDA ATTRAVERSA L'HERO, non ci passa sotto. */
  let alta = Infinity;
  let bassa = -Infinity;
  for (const t of ISTANTI) {
    for (const p of parti) {
      if (opacita(p, s.L, c) <= 0.004) continue;
      const y = posizioneY(p, t, s.L, s.H, c);
      alta = Math.min(alta, y);
      bassa = Math.max(bassa, y);
    }
  }
  const fascia = (bassa - alta) / s.H;
  prova(
    "la fascia occupa una porzione ampia dell'hero",
    fascia >= 0.45 && fascia <= 0.65,
    `${Math.round(fascia * 100)}% dell'altezza fra cresta e ventre`,
  );
  prova(
    "la fascia attraversa la banda centrale (passa dietro il claim)",
    alta < s.H * 0.45 && bassa > s.H * 0.55,
    `da ${Math.round(alta)}px a ${Math.round(bassa)}px su ${s.H}px`,
  );

  /* 2. NIENTE TAGLI NETTI: il canvas sborda, quindi ai margini VISIBILI
        l'onda è ancora viva e si spegne fuori dall'inquadratura. */
  const alBordoVisibile = parti
    .map((p) => opacita({ ...p, x: SBORDO + 4 }, s.L, c))
    .concat(parti.map((p) => opacita({ ...p, x: s.L - SBORDO - 4 }, s.L, c)));
  prova(
    "ai bordi visibili l'onda è ancora viva (nessun taglio netto)",
    Math.max(...alBordoVisibile) > 0.02,
    `opacità massima ${Math.max(...alBordoVisibile).toFixed(3)}`,
  );
  const alBordoCanvas = parti.map((p) => opacita({ ...p, x: -SBORDO }, s.L, c));
  prova(
    "al bordo del canvas l'opacità è nulla (esce in dissolvenza)",
    Math.max(...alBordoCanvas) < 0.005,
    `massima ${Math.max(...alBordoCanvas).toFixed(4)}`,
  );

  /* 3. DENSITÀ MAGGIORE AL CENTRO, rarefatta agli estremi. */
  const terzi = [0, 0, 0];
  for (const p of parti) {
    const u = Math.min(0.999, Math.max(0, p.x / s.L));
    terzi[Math.floor(u * 3)] += opacita(p, s.L, c);
  }
  const rapporto = terzi[1] / ((terzi[0] + terzi[2]) / 2);
  prova("il centro è più denso degli estremi", rapporto > 1.8,
    `centro/estremi ${rapporto.toFixed(2)}×`);

  /* 4. L'ACCENTO È UNA MINORANZA, E STA AL CENTRO. */
  const visibili = parti.filter((p) => opacita(p, s.L, c) > 0.004);
  const accentate = visibili.filter((p) => accento(p, s.L) > 0.5);
  const quota = (accentate.length / visibili.length) * 100;
  prova("l'accento è una minoranza", quota > 2 && quota < 25,
    `${quota.toFixed(1)}% delle particelle visibili`);
  const fuori = accentate.filter((p) => {
    const u = p.x / s.L;
    return u < 0.22 || u > 0.78;
  });
  prova("nessun accento fuori dalla parte centrale", fuori.length === 0,
    `${fuori.length} fuori`);
  const intermedie = visibili.filter((p) => {
    const m = accento(p, s.L);
    return m > 0.05 && m < 0.95;
  });
  prova("la transizione all'accento è graduale, non a blocchi",
    intermedie.length > 0, `${intermedie.length} in transizione`);

  /* 5. NESSUNA PARTICELLA SI MUOVE COME UN'ALTRA, e qualcuna corre. */
  const firme = new Set(
    parti.map((p) => `${p.f1.toFixed(6)}|${p.p1.toFixed(6)}|${p.v.toFixed(4)}`),
  );
  prova("ogni particella ha fase, frequenza e velocità proprie",
    firme.size === parti.length, `${firme.size} firme su ${parti.length}`);
  const veloci = parti.filter((p) => Math.abs(p.v) > 34).length;
  prova("una minoranza corre più delle altre",
    veloci > 0 && veloci < parti.length * 0.3,
    `${veloci} particelle più veloci`);

  /* 6. IL MOVIMENTO NON SI RIPETE: tre sinusoidi, periodi non multipli. */
  const p0 = parti[0];
  const periodo = (Math.PI * 2) / p0.f1;
  const scarti = [1, 2, 3, 5, 8, 13].map((k) =>
    Math.abs(oscillazione(p0, 0) - oscillazione(p0, periodo * k)),
  );
  prova("l'oscillazione non si ripete dopo il periodo fondamentale",
    Math.min(...scarti) > 0.03,
    `scarto minimo ${Math.min(...scarti).toFixed(3)}`);

  /* 7. NESSUNO SCATTO fra due fotogrammi a 60fps. */
  let salto = 0;
  for (const t of ISTANTI) {
    for (const p of parti) {
      salto = Math.max(
        salto,
        Math.abs(
          posizioneY(p, t + 1 / 60, s.L, s.H, c) - posizioneY(p, t, s.L, s.H, c),
        ),
      );
    }
  }
  prova("nessuno scatto fra un fotogramma e l'altro", salto < 1.2,
    `spostamento massimo ${salto.toFixed(3)}px per fotogramma`);

  /* 8. IL CONTRASTO DEL CLAIM SOPRA L'ONDA IN MOVIMENTO, nel punto
        peggiore.

        Si campiona una griglia di punti dentro il BLOCCO DEL TESTO — non
        dentro l'ellisse della maschera, che è volutamente più grande e
        arriva dove le lettere non ci sono — e per ogni punto si compone
        il colore come lo comporrebbe il browser: ogni particella
        contribuisce con la sua opacità pesata dal profilo del suo
        bagliore, e i contributi si COMPONGONO, non si sommano. Sommare
        le opacità dava numeri come «copertura 480%», che non vuol dire
        niente: due velature al 30% fanno il 51%, non il 60%. */
  const PASSO = 24;
  /** Il profilo del bagliore, gli stessi stop del gradiente dello sprite. */
  const profilo = (u) => {
    if (u >= 1) return 0;
    if (u <= 0.35) return 1 + (0.55 - 1) * (u / 0.35);
    if (u <= 0.7) return 0.55 + (0.12 - 0.55) * ((u - 0.35) / 0.35);
    return 0.12 * (1 - (u - 0.7) / 0.3);
  };

  let coperturaPeggiore = 0;
  for (const t of ISTANTI) {
    const vicine = [];
    for (const p of parti) {
      const y = posizioneY(p, t, s.L, s.H, c);
      const a = opacita(p, s.L, c, fattoreMaschere(p.x, y, righe));
      if (a <= 0.004) continue;
      vicine.push({ x: p.x, y, a, raggio: p.r * 3 });
    }
    for (const r of righe) {
      for (let x = r.testo.x0; x <= r.testo.x1; x += PASSO) {
        for (let y = r.testo.y0; y <= r.testo.y1; y += PASSO) {
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

  const fondoPeggiore = sopraBianco(PINO, Math.min(1, coperturaPeggiore));
  const cTenue = contrasto(TESTO_TENUE, fondoPeggiore);
  const cChiave = contrasto(TESTO_CHIAVE, fondoPeggiore);
  prova(
    "il claim resta leggibile nel punto peggiore dell'onda in movimento",
    cTenue >= 4.5,
    `fondo peggiore rgb(${fondoPeggiore.join(",")}) — testo tenue ${cTenue.toFixed(2)}:1`,
  );
  prova("la parola-chiave regge meglio del resto", cChiave > cTenue,
    `«cloud» ${cChiave.toFixed(2)}:1 contro ${cTenue.toFixed(2)}:1`);
  // La velatura di per sé non è un difetto: conta solo in quanto abbassa
  // il contrasto. La soglia è quella calcolata, non una preferenza.
  prova("la maschera tiene l'onda a velo dietro il testo",
    coperturaPeggiore < VELATURA_LIMITE,
    `velatura massima ${(coperturaPeggiore * 100).toFixed(1)}% sul limite di ${(VELATURA_LIMITE * 100).toFixed(1)}%`);
}

/* 9. LA MASCHERA NON HA BORDI VISIBILI: la caduta è continua. */
console.log("\nmaschera del testo");
const m = { cx: 0, cy: 0, rx: 400, ry: 200, minimo: 0.09 };
let gradino = 0;
let prec = fattoreMaschera(-500, 0, m);
for (let x = -500; x <= 500; x += 1) {
  const v = fattoreMaschera(x, 0, m);
  gradino = Math.max(gradino, Math.abs(v - prec));
  prec = v;
}
// Per PIXEL, non per campione: sotto il 2% di variazione al pixel una
// sfumatura non si distingue da un gradiente continuo.
prova("la maschera sfuma senza gradini", gradino < 0.02,
  `variazione massima ${(gradino * 100).toFixed(2)}% al pixel`);
prova("al centro della maschera resta pochissimo",
  fattoreMaschera(0, 0, m) <= 0.1, `${fattoreMaschera(0, 0, m).toFixed(3)}`);
prova("fuori dalla maschera l'onda è intatta",
  fattoreMaschera(450, 0, m) === 1);

/* 10. LA CURVA È SINUOSA DAVVERO: tre frequenze non multiple. */
console.log("\ncurva portante");
const L = 1280 + SBORDO * 2;
const H = 720;
const campioni = Array.from({ length: 400 }, (_, i) =>
  curva((i / 399) * L, 0, L, H, ONDA_HERO),
);
const escursione = Math.max(...campioni) - Math.min(...campioni);
prova("l'escursione è quella dichiarata dalle ampiezze",
  escursione > (A1 + A2 + A3) * H,
  `${Math.round(escursione)}px su ${Math.round((A1 + A2 + A3) * H * 2)}px teorici`);
let inversioni = 0;
for (let i = 2; i < campioni.length; i++) {
  if ((campioni[i - 1] - campioni[i - 2]) * (campioni[i] - campioni[i - 1]) < 0)
    inversioni++;
}
prova("la curva non è una sinusoide sola", inversioni >= 3,
  `${inversioni} inversioni di direzione`);

/* 11. I PRESET DEL RIUSO rispettano la regola della discrezione. */
console.log("\npreset del riuso");
for (const [nome, cfg] of Object.entries(PRESET)) {
  const soglia = nome === "tecnica" ? 0.31 : 0.25;
  prova(`«${nome}» resta discreto`, cfg.opacita <= soglia,
    `opacità ${Math.round(cfg.opacita * 100)}%`);
}
prova("i preset scuri usano la palette invertita",
  PRESET.tecnica.palette === "scura" && PRESET.tenueScura.palette === "scura");
prova("lo spessore della fascia è quello dichiarato", SPESSORE === 0.075);

console.log(`\n${ok} prove superate, ${ko} fallite`);
if (ko > 0) process.exitCode = 1;
