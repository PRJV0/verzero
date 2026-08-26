/**
 * ESTRAE I TRACCIATI DEL MARCHIO dai due caratteri, una volta sola.
 *
 *   node scripts/estrai-tracciati-marchio.mjs
 *
 * ═══ PERCHÉ SERVE ═══
 * I file SVG del marchio dichiaravano `font-family: Fraunces` e basta.
 * Su questo sito il carattere c'è e si vede il marchio; su qualunque
 * altra macchina non c'è, e il file rende in Georgia — cioè il file
 * ufficiale del marchio mostra lettere che non sono quelle del marchio.
 * Si scopre solo aprendolo altrove, che è esattamente quando non si può
 * più rimediare.
 *
 * La cura è una sola: il nome e il payoff diventano TRACCIATI. Un
 * tracciato non ha bisogno di nessun carattere installato da nessuna
 * parte, e disegna sempre le stesse lettere.
 *
 * ═══ COME LO FA, E PERCHÉ NON BASTAVA IL CARATTERE ═══
 * I contorni vengono dal carattere; le POSIZIONI delle lettere no,
 * vengono misurate nel browser. Sono due cose diverse: sommare le
 * larghezze dei glifi dà una parola leggermente diversa da quella che si
 * vede in pagina, perché il browser applica anche le coppie di
 * crenatura (GPOS) che il carattere dichiara. Con le posizioni misurate
 * il tracciato è la stessa identica parola che sta nell'intestazione,
 * lettera per lettera.
 *
 * ═══ SI ESEGUE QUASI MAI ═══
 * Scarica da Google Fonts due sottinsiemi minuscoli (solo le lettere che
 * servono: ~2,5 kB l'uno) e riscrive `src/lib/marchio-tracciati.ts`. Va
 * rifatto solo se cambia il logotipo o il payoff. I caratteri non
 * restano nel repository: qui servono per un istante e quello che si
 * conserva è il tracciato.
 *
 * Fraunces e Inter sono sotto SIL Open Font License 1.1, che permette
 * espressamente di incorporare i glifi in un documento.
 */

import { writeFileSync } from "node:fs";

/* ------------------------------------------------------------------ */
/* Le posizioni, misurate nel browser (Fraunces 600 / Inter 500)       */
/* ------------------------------------------------------------------ */

const NOME = {
  testo: "Verzer",
  /** Ascissa di ogni lettera, in em, con la crenatura del browser. */
  offset: [0, 0.66199, 1.1952, 1.67349, 2.16569, 2.69888],
  larghezza: 3.17719,
  famiglia: "Fraunces:opsz,wght@9..144,600",
  peso: 600,
};

/** Il monogramma: le stesse tre lettere iniziali, stesse posizioni —
 *  la crenatura è a coppie, e V-e ed e-r qui sono le stesse. */
const NOME_CORTO = {
  testo: "Ver",
  offset: [0, 0.66199, 1.1952],
  larghezza: 1.67349,
};

const PAYOFF = {
  testo: "A NORMA IN TEMPO",
  offset: [
    0, 0.70884, 0.97532, 1.73163, 2.49822, 3.14616, 4.05898, 4.76782, 5.0343,
    5.3069, 6.06322, 6.3297, 6.98259, 7.58577, 8.49859, 9.14042,
  ],
  larghezza: 9.90702,
  famiglia: "Inter:wght@500",
  peso: 500,
  /** La crenatura del lockup, in em del payoff: v. src/lib/marchio.ts. */
  tracking: 0.1348,
};

/* ------------------------------------------------------------------ */
/* Lettura di un TTF: solo quello che serve                            */
/* ------------------------------------------------------------------ */

function tabelle(b) {
  const num = b.readUInt16BE(4);
  const out = {};
  for (let i = 0; i < num; i++) {
    const o = 12 + i * 16;
    out[b.toString("latin1", o, o + 4)] = {
      inizio: b.readUInt32BE(o + 8),
      lunghezza: b.readUInt32BE(o + 12),
    };
  }
  return out;
}

/** cmap formato 4: l'unico che serve per il latino di base. */
function mappaCaratteri(b, t) {
  const c = t["cmap"].inizio;
  const n = b.readUInt16BE(c + 2);
  let sotto = null;
  for (let i = 0; i < n; i++) {
    const o = c + 4 + i * 8;
    const piattaforma = b.readUInt16BE(o);
    const codifica = b.readUInt16BE(o + 2);
    const off = b.readUInt32BE(o + 4);
    if ((piattaforma === 3 && codifica === 1) || piattaforma === 0) {
      sotto = c + off;
    }
  }
  if (sotto === null) throw new Error("cmap: nessuna sottotabella utilizzabile");
  if (b.readUInt16BE(sotto) !== 4) throw new Error("cmap: formato inatteso");

  const segX2 = b.readUInt16BE(sotto + 6);
  const seg = segX2 / 2;
  const fine = sotto + 14;
  const inizio = fine + segX2 + 2;
  const delta = inizio + segX2;
  const rangeOff = delta + segX2;

  return (codice) => {
    for (let i = 0; i < seg; i++) {
      if (b.readUInt16BE(fine + i * 2) < codice) continue;
      const primo = b.readUInt16BE(inizio + i * 2);
      if (primo > codice) return 0;
      const ro = b.readUInt16BE(rangeOff + i * 2);
      if (ro === 0) {
        return (codice + b.readInt16BE(delta + i * 2)) & 0xffff;
      }
      const p = rangeOff + i * 2 + ro + (codice - primo) * 2;
      const g = b.readUInt16BE(p);
      return g === 0 ? 0 : (g + b.readInt16BE(delta + i * 2)) & 0xffff;
    }
    return 0;
  };
}

/** Il contorno di un glifo, come comandi SVG in unità del carattere. */
function tracciatoGlifo(b, t, upem, locaCorto, id) {
  const loca = t["loca"].inizio;
  const leggi = (i) =>
    locaCorto ? b.readUInt16BE(loca + i * 2) * 2 : b.readUInt32BE(loca + i * 4);
  const da = leggi(id);
  const a = leggi(id + 1);
  if (a <= da) return ""; // glifo vuoto: lo spazio

  let o = t["glyf"].inizio + da;
  const contorni = b.readInt16BE(o);
  if (contorni < 0) {
    throw new Error(`glifo ${id}: composito, non gestito (qui non serve)`);
  }
  o += 10;

  const fineContorni = [];
  for (let i = 0; i < contorni; i++) {
    fineContorni.push(b.readUInt16BE(o));
    o += 2;
  }
  const punti = fineContorni[contorni - 1] + 1;
  o += 2 + b.readUInt16BE(o); // istruzioni: si saltano

  const flag = [];
  while (flag.length < punti) {
    const f = b.readUInt8(o++);
    flag.push(f);
    if (f & 0x08) {
      let ripeti = b.readUInt8(o++);
      while (ripeti-- > 0) flag.push(f);
    }
  }

  const coord = (bitCorto, bitStesso) => {
    const out = [];
    let v = 0;
    for (const f of flag) {
      if (f & bitCorto) {
        const d = b.readUInt8(o++);
        v += f & bitStesso ? d : -d;
      } else if (!(f & bitStesso)) {
        v += b.readInt16BE(o);
        o += 2;
      }
      out.push(v);
    }
    return out;
  };
  const xs = coord(0x02, 0x10);
  const ys = coord(0x04, 0x20);

  /* — Da contorni quadratici a comandi SVG — */
  const cmd = [];
  let primo = 0;
  for (const ultimo of fineContorni) {
    const n = ultimo - primo + 1;
    const p = [];
    for (let i = 0; i < n; i++) {
      p.push({
        x: xs[primo + i],
        y: ys[primo + i],
        su: (flag[primo + i] & 0x01) !== 0,
      });
    }
    primo = ultimo + 1;
    if (n === 0) continue;

    // Il punto di partenza dev'essere sulla curva: se il contorno inizia
    // fuori, si prende il punto medio, che sulla curva ci sta per
    // costruzione.
    let avvio = p.findIndex((q) => q.su);
    let inizio;
    if (avvio < 0) {
      inizio = { x: (p[0].x + p[n - 1].x) / 2, y: (p[0].y + p[n - 1].y) / 2 };
      avvio = 0;
    } else {
      inizio = p[avvio];
      avvio += 1;
    }

    cmd.push(`M${inizio.x} ${inizio.y}`);
    let controllo = null;
    for (let k = 0; k < n; k++) {
      const q = p[(avvio + k) % n];
      if (q.su) {
        cmd.push(controllo ? `Q${controllo.x} ${controllo.y} ${q.x} ${q.y}` : `L${q.x} ${q.y}`);
        controllo = null;
      } else {
        if (controllo) {
          // Due fuori curva di fila: in mezzo c'è un punto implicito.
          const m = { x: (controllo.x + q.x) / 2, y: (controllo.y + q.y) / 2 };
          cmd.push(`Q${controllo.x} ${controllo.y} ${m.x} ${m.y}`);
        }
        controllo = q;
      }
    }
    cmd.push(
      controllo
        ? `Q${controllo.x} ${controllo.y} ${inizio.x} ${inizio.y}Z`
        : "Z",
    );
  }
  return cmd.join("");
}

/* ------------------------------------------------------------------ */

async function sottinsieme(famiglia, testo) {
  const url = `https://fonts.googleapis.com/css2?family=${famiglia}&text=${encodeURIComponent(testo)}`;
  const css = await (
    await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 6.1)" } })
  ).text();
  const dentro = css.match(/url\((https:\/\/[^)]+)\)/);
  if (!dentro) throw new Error(`nessun font in risposta per ${famiglia}`);
  const b = Buffer.from(await (await fetch(dentro[1])).arrayBuffer());
  if (b.readUInt32BE(0) !== 0x00010000) {
    throw new Error(
      `${famiglia}: il servizio ha risposto con un formato compresso, non con un TTF`,
    );
  }
  return b;
}

/**
 * Compone una parola: contorni dal carattere, posizioni dalla misura,
 * unità em con la linea di base a y = 0 e la y che cresce verso il basso
 * (SVG), non verso l'alto (carattere).
 */
function componi(b, { testo, offset }, passo = 0) {
  const t = tabelle(b);
  const upem = b.readUInt16BE(t["head"].inizio + 18);
  const locaCorto = b.readInt16BE(t["head"].inizio + 50) === 0;
  const glifo = mappaCaratteri(b, t);

  const pezzi = [];
  for (let i = 0; i < testo.length; i++) {
    const d = tracciatoGlifo(b, t, upem, locaCorto, glifo(testo.codePointAt(i)));
    if (!d) continue;
    const dx = offset[i] + i * passo;
    const trasformato = d.replace(
      /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
      (_, x, y) =>
        `${(+x / upem + dx).toFixed(4)} ${(-y / upem).toFixed(4)}`,
    );
    pezzi.push(trasformato);
  }
  return pezzi.join("");
}

const bNome = await sottinsieme(NOME.famiglia, NOME.testo);
const bPayoff = await sottinsieme(PAYOFF.famiglia, PAYOFF.testo);

const tracciatoNome = componi(bNome, NOME);
const tracciatoNomeCorto = componi(bNome, NOME_CORTO);
const tracciatoPayoff = componi(bPayoff, PAYOFF, PAYOFF.tracking);

const file = `/**
 * I TRACCIATI DEL MARCHIO — generati, non scritti.
 *
 *   node scripts/estrai-tracciati-marchio.mjs
 *
 * Il nome e il payoff del lockup, come contorni vettoriali: nessun
 * carattere da installare, nessuna macchina su cui il marchio possa
 * rendere in Georgia. Le lettere vengono da Fraunces 600 e Inter 500
 * (SIL Open Font License 1.1, che permette di incorporare i glifi); le
 * posizioni sono quelle misurate nel browser, crenatura compresa, così
 * il tracciato è la stessa parola che si legge nell'intestazione.
 *
 * Unità: em, linea di base a y = 0, x che parte da 0. La y cresce verso
 * il basso come vuole l'SVG.
 *
 * NON SI MODIFICA A MANO. Se cambia il logotipo o il payoff, si
 * riesegue lo script — e si rigenerano i file con
 * \`scripts/esporta-marchio.mjs\`.
 */

/** «Verzer» in Fraunces 600. Larghezza ${NOME.larghezza} em. */
export const TRACCIATO_NOME =
  "${tracciatoNome}";

/** «Ver» del monogramma, stesso carattere e stessa crenatura.
 *  Larghezza ${NOME_CORTO.larghezza} em. */
export const TRACCIATO_NOME_CORTO =
  "${tracciatoNomeCorto}";

/** «${PAYOFF.testo}» in Inter 500, già crenato per il lockup. */
export const TRACCIATO_PAYOFF =
  "${tracciatoPayoff}";
`;

writeFileSync("src/lib/marchio-tracciati.ts", file);
console.log(
  `Scritto src/lib/marchio-tracciati.ts — nome ${tracciatoNome.length} caratteri, payoff ${tracciatoPayoff.length}.`,
);
