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
   * nessuno vede. Non tocca il ripiego sul largo, che resta sempre.
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
     * IL RIPIEGO — quando la narrazione non parte, le fasi si accendono
     * lo stesso.
     *
     * «Niente narrazione» era diventato «niente animazione»: la lista
     * restava statica e compariva tutta insieme. Succedeva su schermo
     * stretto, dove il palco sticky non si usa (SPEC §12.O), ma succede
     * anche su schermo LARGO ogni volta che le scroll-timeline non ci
     * sono — Safari fino a poco fa — o che ci sono e mentono (Chrome
     * in-app: progresso congelato). In tutti quei casi la sequenza resta
     * impilata, ma si accende una fase alla volta mentre si scorre, con
     * lo stesso motore dei reveal del resto del sito.
     *
     * Unica eccezione voluta: «riduci movimento», dove lo statico è la
     * risposta giusta e non un ripiego.
     */
    let spegniReveal: (() => void) | null = null;
    let accese: HTMLElement[] = [];
    const ripiego = () => {
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
      if (revealSuStretto) ripiego();
      return spegniIlRipiego;
    }

    // Chi ha chiesto meno movimento resta sulla versione statica completa.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const Timeline = (
      window as unknown as { ViewTimeline?: new (o: object) => AnimationTimeline }
    ).ViewTimeline;
    if (typeof Timeline !== "function") {
      ripiego();
      return spegniIlRipiego;
    }

    let timeline: AnimationTimeline;
    try {
      timeline = new Timeline({ subject: root, axis: "block" });
    } catch {
      ripiego();
      return spegniIlRipiego;
    }

    // Prova di vitalità: una timeline inattiva non ha tempo corrente. In quel
    // caso non si narra — ma le fasi si accendono comunque, una alla volta.
    if (timeline.currentTime == null) {
      ripiego();
      return spegniIlRipiego;
    }

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
      // La timeline ha mentito: si torna alla sequenza impilata, ma con
      // le comparse — non con sei blocchi che appaiono tutti insieme.
      ripiego();
    };

    /*
     * IL GUARDIANO — misura l'EFFETTO, non l'API.
     *
     * Una timeline può esistere, dichiararsi attiva e restare ferma
     * (Chrome 148 in-app: progresso congelato a ogni scorrimento). Allora
     * la narrazione non narra e le fasi restano tutte alla stessa
     * opacità, cioè cinque su sei invisibili: contenuto perso.
     *
     * La versione precedente confrontava `timeline.currentTime` con la
     * geometria della sezione, e sbagliava: in Chrome quel valore letto
     * dal thread principale resta indietro — misurato, costante a 0,492
     * mentre le fasi si avvicendavano correttamente sotto gli occhi. Il
     * guardiano spegneva così una narrazione sana, che è esattamente il
     * danno da cui doveva proteggere.
     *
     * Ora la domanda è quella giusta: scorrendo dentro la sezione, le
     * opacità CAMBIANO? Se cambiano, il meccanismo è reale e i controlli
     * finiscono lì. Se dopo cinque scorrimenti utili il quadro è identico
     * a se stesso, la timeline è inerte e si torna alla sequenza
     * impilata, con le comparse.
     */
    const fasiSorvegliate = Array.from(
      root.querySelectorAll<HTMLElement>("[data-fase]"),
    );
    const quadro = () =>
      fasiSorvegliate.map((f) => getComputedStyle(f).opacity).join(",");

    let campioni = 0;
    let precedente = "";
    const sorveglia = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progresso della fascia "cover": 0 quando la sezione entra dal
      // basso, 1 quando esce dall'alto. Fuori da questa finestra la
      // narrazione non ha nulla da mostrare e non si giudica.
      const atteso = (vh - rect.top) / (vh + rect.height);
      if (atteso < 0.05 || atteso > 0.95) return;

      const ora = quadro();
      if (precedente && ora !== precedente) {
        // Si muove davvero: il meccanismo è reale, bastano i controlli.
        window.removeEventListener("scroll", sorveglia);
        return;
      }
      precedente = ora;
      campioni += 1;
      if (campioni >= 5) spegni();
    };
    window.addEventListener("scroll", sorveglia, { passive: true });
    // Il primo quadro si prende a layout assestato: attivando la modalità
    // narrata la sezione cambia altezza di migliaia di pixel, e prima che
    // il cambio finisca qualunque lettura è rumore. Da lì in poi decide
    // lo scorrimento.
    const primo = window.setTimeout(() => {
      precedente = quadro();
    }, 450);

    return () => {
      window.clearTimeout(primo);
      window.removeEventListener("scroll", sorveglia);
      animazioni.forEach((a) => a.cancel());
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
