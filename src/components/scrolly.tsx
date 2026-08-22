"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { attivaReveal } from "@/lib/reveal";

/** Sotto questa soglia la narrazione non parte mai (SPEC §12.O — mobile):
 *  su schermo stretto il palco sticky ruba spazio alla lettura e lo
 *  scorrimento lungo pesa. Meglio la sequenza statica, completa e fluida. */
const SOGLIA_NARRAZIONE = "(min-width: 768px)";

/**
 * Scrollytelling — impalcatura condivisa delle tre sezioni narrative
 * (Motore Ver0, Sigillo, lo Zero).
 *
 * Contratto di accessibilità: il markup è una lista statica e completa, e
 * NIENTE viene nascosto finché non è certo che l'avvicendamento funzioni.
 * Senza JavaScript, senza supporto alle scroll-timeline, o con «riduci
 * movimento» attivo, le fasi restano semplicemente impilate e leggibili.
 *
 * Perché non basta `@supports (animation-timeline: view())`: esistono
 * motori in cui quella query risponde `true` ma le timeline dichiarate in
 * CSS restano inerti (Chrome 148 in-app: la stessa ViewTimeline creata via
 * JS è attiva, quella da `view-timeline-name` no). Fidandosi di @supports il
 * contenuto resterebbe a opacity 0 — invisibile. Qui la timeline viene
 * creata e MISURATA: solo se è viva si passa alla modalità narrata.
 *
 * Vincolo di prodotto: si usa SOLO nelle sezioni narrative. Mai su
 * catalogo, pagine prezzo e funnel d'acquisto.
 */

/**
 * I FOTOGRAMMI, dichiarati una volta per due esecutori.
 *
 * La stessa curva serve alla scroll-timeline CSS — dove il browser la
 * interpola da sé, fuori dal thread principale — e al calcolo in
 * JavaScript che subentra dove quella non c'è. Scriverla due volte
 * vorrebbe dire due animazioni diverse a seconda del browser: la
 * differenza non darebbe errore da nessuna parte, e nessuno se ne
 * accorgerebbe finché non la vede il fondatore.
 */
type Fotogramma = { offset: number; opacita: number; y?: number };

/** Entra, resta, esce: la fase che lascia il posto alla successiva. */
const FADE: Fotogramma[] = [
  { offset: 0, opacita: 0, y: 14 },
  // Entrata e uscita strette: fra una declinazione e l'altra il palco
  // resta vuoto per il tempo di un battito, non per un intero respiro —
  // misurato, con la curva precedente il vuoto durava un sesto di fetta.
  { offset: 0.08, opacita: 1, y: 0 },
  { offset: 0.9, opacita: 1, y: 0 },
  { offset: 1, opacita: 0, y: -14 },
];

/**
 * L'ULTIMA fase non esce: resta in scena finché la sezione si sblocca e
 * la pagina riprende a scorrere. Con la curva normale il palco si
 * svuotava proprio nell'ultimo tratto — cioè nel momento in cui l'occhio
 * cerca la conclusione e trova uno schermo vuoto.
 */
const ULTIMA: Fotogramma[] = [
  { offset: 0, opacita: 0, y: 14 },
  { offset: 0.08, opacita: 1, y: 0 },
  { offset: 1, opacita: 1, y: 0 },
];

/** Variante "keep": una volta accesa resta accesa (l'anello che si riempie).
 *  Solo opacità: sono tracciati SVG, una traslazione li sposterebbe nel viewBox. */
const KEEP: Fotogramma[] = [
  { offset: 0, opacita: 0 },
  { offset: 0.35, opacita: 1 },
  { offset: 1, opacita: 1 },
];

const FOTOGRAMMI_PROGRESS: Keyframe[] = [
  { transform: "scaleX(0)" },
  { transform: "scaleX(1)" },
];

/** La stessa curva in forma di Keyframe, per la scroll-timeline. */
function inKeyframe(fotogrammi: Fotogramma[]): Keyframe[] {
  return fotogrammi.map((k) => ({
    offset: k.offset,
    opacity: k.opacita,
    ...(k.y === undefined
      ? {}
      : { transform: k.y === 0 ? "none" : `translateY(${k.y}px)` }),
  }));
}

/** La stessa curva calcolata a mano, per il ripiego a progressione. */
function valore(fotogrammi: Fotogramma[], t: number): { opacita: number; y: number } {
  if (t <= fotogrammi[0].offset) {
    return { opacita: fotogrammi[0].opacita, y: fotogrammi[0].y ?? 0 };
  }
  for (let i = 1; i < fotogrammi.length; i++) {
    const a = fotogrammi[i - 1];
    const b = fotogrammi[i];
    if (t > b.offset) continue;
    const arco = b.offset - a.offset;
    // Interpolazione lineare, come `easing: "linear"` sulla timeline:
    // il ritmo lo detta lo scorrimento, non una curva sopra di esso.
    const q = arco === 0 ? 1 : (t - a.offset) / arco;
    return {
      opacita: a.opacita + (b.opacita - a.opacita) * q,
      y: (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * q,
    };
  }
  const ultimo = fotogrammi[fotogrammi.length - 1];
  return { opacita: ultimo.opacita, y: ultimo.y ?? 0 };
}

/** Opzioni di animazione legate a una scroll-timeline: `timeline`,
 *  `rangeStart` e `rangeEnd` non sono ancora nei tipi DOM di TypeScript. */
type OpzioniScorrimento = KeyframeAnimationOptions & {
  timeline?: AnimationTimeline;
  rangeStart?: string;
  rangeEnd?: string;
};

/** La fascia "contain" è il periodo in cui il contenitore copre il viewport:
 *  coincide con la fase sticky. Ogni fase ne prende una fetta uguale. */
function finestra(indice: number, totale: number): OpzioniScorrimento {
  const q = (n: number) => `contain ${((n / totale) * 100).toFixed(3)}%`;
  return { rangeStart: q(indice - 1), rangeEnd: q(indice) };
}

export function Scrolly({
  steps,
  className = "",
  revealSuStretto = true,
  children,
}: {
  /** Numero di fasi: guida l'altezza di scorrimento e le finestre. */
  steps: 3 | 4 | 5 | 6;
  className?: string;
  /**
   * Sotto i 768px le fasi si accendono una alla volta con il motore dei
   * reveal. Si disattiva quando lo schermo stretto ha GIÀ una sua
   * presentazione — in home il nastro dello Zero — perché lì questa copia
   * è nascosta, e accenderla sarebbe un terzo comportamento su nodi che
   * nessuno vede.
   */
  revealSuStretto?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /** Larghezza sufficiente per la narrazione: si rivaluta al ridimensionamento
   *  e alla rotazione, così passare a schermo stretto la disattiva davvero. */
  const [largo, setLargo] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(SOGLIA_NARRAZIONE);
    const aggiorna = () => setLargo(mq.matches);
    aggiorna();
    mq.addEventListener("change", aggiorna);
    return () => mq.removeEventListener("change", aggiorna);
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /*
     * IL RIPIEGO SULLO STRETTO — sequenza impilata con le comparse.
     *
     * Sotto i 768px il palco sticky non si usa (SPEC §12.O): la sezione
     * resta una lista, ma le fasi si accendono una alla volta mentre si
     * scorre, invece di comparire tutte insieme.
     */
    let spegniReveal: (() => void) | null = null;
    let accese: HTMLElement[] = [];
    const ripiegoImpilato = () => {
      if (spegniReveal) return;
      accese = Array.from(root.querySelectorAll<HTMLElement>("[data-fase]"));
      for (const f of accese) f.classList.add("vz-reveal");
      spegniReveal = attivaReveal(accese);
    };
    const spegniIlRipiego = () => {
      spegniReveal?.();
      spegniReveal = null;
      for (const f of accese) f.classList.remove("vz-reveal");
      accese = [];
    };

    if (!largo) {
      if (revealSuStretto) ripiegoImpilato();
      return spegniIlRipiego;
    }

    // Chi ha chiesto meno movimento resta sulla versione statica completa:
    // tutte le declinazioni visibili, nessun palco, nessun avvicendamento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fasi = Array.from(root.querySelectorAll<HTMLElement>("[data-fase]"))
      .map((el) => {
        const indice = Number(el.dataset.fase);
        const fotogrammi =
          el.dataset.modo === "keep"
            ? KEEP
            : indice === steps
              ? ULTIMA
              : FADE;
        return { el, indice, fotogrammi };
      })
      .filter((f) => f.indice > 0);
    if (fasi.length === 0) return;
    const barra = root.querySelector<HTMLElement>(".vz-scrolly-progress");

    /*
     * ═══ LA PROGRESSIONE, CALCOLATA ═══
     *
     * La fascia "contain" è il tratto in cui la sezione copre lo schermo,
     * cioè esattamente il tratto in cui il palco resta ancorato: comincia
     * quando il bordo alto della sezione tocca il bordo alto della
     * finestra e finisce quando il bordo basso raggiunge quello basso.
     * È la stessa fascia che la scroll-timeline usa in CSS — per questo i
     * due modi mostrano la stessa cosa nello stesso punto.
     */
    const progresso = () => {
      const r = root.getBoundingClientRect();
      const corsa = r.height - window.innerHeight;
      if (corsa <= 0) return 1;
      return Math.min(1, Math.max(0, -r.top / corsa));
    };

    let inCoda = false;
    let dipingiAttivo = false;
    const dipingi = () => {
      inCoda = false;
      try {
        const p = progresso();
        const fetta = 1 / steps;
        for (const f of fasi) {
          const t = Math.min(
            1,
            Math.max(0, (p - (f.indice - 1) * fetta) / fetta),
          );
          const v = valore(f.fotogrammi, t);
          f.el.style.opacity = String(Math.round(v.opacita * 1000) / 1000);
          f.el.style.transform = v.y === 0 ? "none" : `translateY(${v.y}px)`;
        }
        if (barra) barra.style.transform = `scaleX(${p})`;
      } catch {
        // PARACADUTE. Se il calcolo si rompe, la sezione torna leggibile
        // invece di restare a schermo vuoto: senza `data-live` il CSS non
        // nasconde più nulla.
        smettiDiDipingere();
        delete root.dataset.live;
      }
    };
    const suScorrimento = () => {
      if (inCoda) return;
      inCoda = true;
      requestAnimationFrame(dipingi);
    };
    const dipingiSempre = () => {
      if (dipingiAttivo) return;
      dipingiAttivo = true;
      // Passivo: non si intercetta e non si ferma nulla. Lo scorrimento
      // resta dell'utente — mai «scroll hijacking».
      window.addEventListener("scroll", suScorrimento, { passive: true });
      window.addEventListener("resize", suScorrimento, { passive: true });
      dipingi();
    };
    const smettiDiDipingere = () => {
      if (!dipingiAttivo) return;
      dipingiAttivo = false;
      window.removeEventListener("scroll", suScorrimento);
      window.removeEventListener("resize", suScorrimento);
      for (const f of fasi) {
        f.el.style.opacity = "";
        f.el.style.transform = "";
      }
      if (barra) barra.style.transform = "";
    };

    /* ═══ IL MODO PREFERITO: la scroll-timeline in CSS ═══ */
    const animazioni: Animation[] = [];
    const Timeline = (
      window as unknown as { ViewTimeline?: new (o: object) => AnimationTimeline }
    ).ViewTimeline;

    let timeline: AnimationTimeline | null = null;
    if (typeof Timeline === "function") {
      try {
        const t = new Timeline({ subject: root, axis: "block" });
        if (t.currentTime != null) timeline = t;
      } catch {
        timeline = null;
      }
    }

    // Da qui in poi la sezione si ancora e le fasi si sovrappongono: lo
    // dice il CSS su data-live. Lo si accende SOLO ora, quando è certo
    // che qualcuno — la timeline o il calcolo — le farà comparire.
    root.dataset.live = "1";

    if (timeline) {
      const anima = (
        el: Element,
        fotogrammi: Keyframe[],
        opzioni: OpzioniScorrimento,
      ) => {
        animazioni.push(
          el.animate(fotogrammi, {
            timeline,
            fill: "both",
            easing: "linear",
            ...opzioni,
          }),
        );
      };
      for (const f of fasi) {
        anima(f.el, inKeyframe(f.fotogrammi), finestra(f.indice, steps));
      }
      if (barra) {
        anima(barra, FOTOGRAMMI_PROGRESS, {
          rangeStart: "contain 0%",
          rangeEnd: "contain 100%",
        });
      }
    } else {
      // Nessuna scroll-timeline (Safari fino a poco fa): si calcola.
      dipingiSempre();
    }

    /*
     * ═══ IL GUARDIANO — misura l'EFFETTO, non l'API ═══
     *
     * Una timeline può esistere, dichiararsi attiva e restare ferma
     * (Chrome 148 in-app: progresso congelato a ogni scorrimento). Allora
     * il palco resta ancorato con una sola fase accesa e le altre
     * invisibili: contenuto perso.
     *
     * Non si legge `timeline.currentTime` per deciderlo: in Chrome quel
     * valore letto dal thread principale resta indietro — misurato,
     * costante a 0,492 mentre le fasi si avvicendavano correttamente — e
     * chi lo usava spegneva narrazioni sane. Si guarda invece il quadro
     * delle opacità: se scorrendo dentro la sezione cambia, il meccanismo
     * è reale e i controlli finiscono; se dopo tre scorrimenti utili è
     * identico a se stesso, la timeline è inerte.
     *
     * E il rimedio non è più rinunciare al palco: si passa al calcolo
     * della progressione, che fa la stessa cosa sullo stesso tratto.
     */
    const quadro = () => fasi.map((f) => f.el.style.opacity || getComputedStyle(f.el).opacity).join(",");

    let campioni = 0;
    let precedente = "";
    const sorveglia = () => {
      if (dipingiAttivo) return;
      // Si giudica SOLO dentro il tratto ancorato, dove le fasi devono
      // avvicendarsi. Fuori di lì il quadro è fermo anche quando tutto
      // funziona — è fermo perché non c'è ancora niente da mostrare — e
      // un guardiano che giudicasse anche lì boccerebbe sempre.
      const p = progresso();
      if (p <= 0.02 || p >= 0.98) return;

      const ora = quadro();
      if (precedente && ora !== precedente) {
        window.removeEventListener("scroll", sorveglia);
        return;
      }
      precedente = ora;
      campioni += 1;
      if (campioni >= 3) {
        window.removeEventListener("scroll", sorveglia);
        animazioni.forEach((a) => a.cancel());
        animazioni.length = 0;
        dipingiSempre();
      }
    };
    if (timeline) {
      window.addEventListener("scroll", sorveglia, { passive: true });
    }
    // Il primo quadro si prende a layout assestato: attivando la modalità
    // narrata la sezione cresce di migliaia di pixel, e prima che il
    // cambio finisca qualunque lettura è rumore.
    const primo = window.setTimeout(() => {
      precedente = quadro();
    }, 450);

    return () => {
      window.clearTimeout(primo);
      window.removeEventListener("scroll", sorveglia);
      animazioni.forEach((a) => a.cancel());
      smettiDiDipingere();
      delete root.dataset.live;
      spegniIlRipiego();
    };
  }, [steps, largo, revealSuStretto]);

  return (
    <div
      ref={ref}
      // --steps dimensiona l'altezza di scorrimento (usata solo da vive).
      className={`vz-scrolly relative ${className}`}
      style={{ "--steps": steps } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Il palco: resta fermo mentre le fasi scorrono. */
export function ScrollyStage({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`vz-scrolly-stage ${className}`}>
      <div className="w-full">{children}</div>
    </div>
  );
}

/** Contenitore delle fasi: sovrapposte quando animate, impilate altrimenti. */
export function ScrollySteps({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`vz-scrolly-steps ${className}`}>{children}</div>;
}

/**
 * Una fase. `mode="keep"` per gli elementi che, una volta accesi, devono
 * restare accesi (i segmenti dell'anello del Sigillo).
 */
export function ScrollyStep({
  index,
  mode = "fade",
  className = "",
  children,
}: {
  /** 1-based: è la fetta di scorrimento che accende questa fase. */
  index: number;
  mode?: "fade" | "keep";
  className?: string;
  children: ReactNode;
}) {
  const base = mode === "keep" ? "vz-fase-keep" : "vz-fase";
  return (
    <div
      data-fase={index}
      data-modo={mode}
      className={`${base} ${base}-${index} ${className}`}
    >
      {children}
    </div>
  );
}

/** Barra di avanzamento della narrazione (decorativa). */
export function ScrollyProgress({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div
      aria-hidden
      className={
        "h-px w-full overflow-hidden " +
        (tone === "dark" ? "bg-white/15" : "bg-line")
      }
    >
      <div
        className={
          "vz-scrolly-progress h-full w-full " +
          (tone === "dark" ? "bg-mint-bright" : "bg-mint")
        }
      />
    </div>
  );
}
