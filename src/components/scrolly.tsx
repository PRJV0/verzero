"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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

/** Fase che entra ed esce: il testo che accompagna il palco. */
const FOTOGRAMMI_FADE: Keyframe[] = [
  { opacity: 0, transform: "translateY(14px)", offset: 0 },
  { opacity: 1, transform: "none", offset: 0.12 },
  { opacity: 1, transform: "none", offset: 0.78 },
  { opacity: 0, transform: "translateY(-14px)", offset: 1 },
];

/** Variante "keep": una volta accesa resta accesa (l'anello che si riempie).
 *  Solo opacità: sono tracciati SVG, una scala li sposterebbe nel viewBox. */
const FOTOGRAMMI_KEEP: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 0.35 },
  { opacity: 1, offset: 1 },
];

const FOTOGRAMMI_PROGRESS: Keyframe[] = [
  { transform: "scaleX(0)" },
  { transform: "scaleX(1)" },
];

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
  children,
}: {
  /** Numero di fasi: guida l'altezza di scorrimento e le finestre. */
  steps: 3 | 4 | 5 | 6;
  className?: string;
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

    // Su mobile la sezione resta una sequenza statica impilata.
    if (!largo) return;

    // Chi ha chiesto meno movimento resta sulla versione statica completa.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const Timeline = (
      window as unknown as { ViewTimeline?: new (o: object) => AnimationTimeline }
    ).ViewTimeline;
    if (typeof Timeline !== "function") return;

    let timeline: AnimationTimeline;
    try {
      timeline = new Timeline({ subject: root, axis: "block" });
    } catch {
      return;
    }

    // Prova di vitalità: una timeline inattiva non ha tempo corrente. In quel
    // caso usciamo SENZA toccare nulla — meglio statico che invisibile.
    if (timeline.currentTime == null) return;

    const animazioni: Animation[] = [];
    const anima = (
      el: Element,
      fotogrammi: Keyframe[],
      opzioni: OpzioniScorrimento,
    ) => {
      const complete: OpzioniScorrimento = {
        timeline,
        fill: "both",
        easing: "linear",
        ...opzioni,
      };
      animazioni.push(el.animate(fotogrammi, complete));
    };

    // Da qui in poi le fasi si sovrappongono: lo dice il CSS su data-live.
    root.dataset.live = "1";

    root.querySelectorAll<HTMLElement>("[data-fase]").forEach((el) => {
      const indice = Number(el.dataset.fase);
      if (!indice) return;
      const tieni = el.dataset.modo === "keep";
      anima(
        el,
        tieni ? FOTOGRAMMI_KEEP : FOTOGRAMMI_FADE,
        finestra(indice, steps),
      );
    });

    const barra = root.querySelector(".vz-scrolly-progress");
    if (barra) {
      anima(barra, FOTOGRAMMI_PROGRESS, {
        rangeStart: "contain 0%",
        rangeEnd: "contain 100%",
      });
    }

    const spegni = () => {
      window.removeEventListener("scroll", sorveglia);
      animazioni.forEach((a) => a.cancel());
      delete root.dataset.live;
    };

    // Guardiano. Una timeline può esistere, dichiararsi attiva e restare
    // ferma (Chrome 148 in-app: progresso congelato a ogni scorrimento).
    // Allora la narrazione non parte e il contenuto resterebbe nascosto.
    // Controllo: il progresso dichiarato deve corrispondere a quello che
    // la posizione della sezione impone. Se mente, si torna allo statico.
    const sorveglia = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progresso della fascia "cover": 0 quando la sezione entra dal
      // basso, 1 quando esce dall'alto.
      const atteso = (vh - rect.top) / (vh + rect.height);
      // Troppo lontana dal viewport: il confronto non è affidabile.
      if (atteso < 0.05 || atteso > 0.95) return;

      const ora = timeline.currentTime as
        | { value?: number }
        | number
        | null;
      if (ora == null) return spegni();
      const letto =
        (typeof ora === "number" ? ora : (ora.value ?? NaN)) / 100;
      if (!Number.isFinite(letto) || Math.abs(letto - atteso) > 0.15)
        return spegni();

      // Coerente con la geometria: il meccanismo è reale, basta controlli.
      window.removeEventListener("scroll", sorveglia);
    };
    window.addEventListener("scroll", sorveglia, { passive: true });
    // Primo controllo al fotogramma successivo: attivando la modalità narrata
    // la sezione cambia altezza, e va confrontata a layout assestato.
    const primo = requestAnimationFrame(sorveglia);

    return () => {
      cancelAnimationFrame(primo);
      window.removeEventListener("scroll", sorveglia);
      animazioni.forEach((a) => a.cancel());
      delete root.dataset.live;
    };
  }, [steps, largo]);

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
