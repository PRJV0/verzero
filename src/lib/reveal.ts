/**
 * IL MOTORE DEI REVEAL, in un posto solo.
 *
 * Lo usano il `RevealObserver` globale (tutti gli elementi `.vz-reveal`
 * di una pagina) e lo scrollytelling quando sullo schermo stretto
 * rinuncia alla narrazione. Sono due chiamanti con lo stesso bisogno:
 * scriverlo due volte avrebbe prodotto due tarature diverse alla prima
 * modifica, ed è esattamente il difetto che questo file corregge.
 *
 * ═══ TARATURA PER SCHERMI CORTI ═══
 *
 * 1. SOGLIA ZERO, non 0,05. Una soglia sull'AREA chiede che sia visibile
 *    una frazione dell'elemento: su un blocco alto quanto due schermate
 *    quel 5% arriva quando il contenuto è già stato letto. A decidere
 *    dev'essere il BORDO che entra dal basso.
 *
 * 2. MARGINE PROPORZIONATO. Un `rootMargin` negativo in fondo ritarda
 *    l'accensione: su uno schermo alto non si nota, su uno corto si
 *    mangia l'animazione, perché la corsa di scorrimento è molto più
 *    breve. Sotto i 720px di altezza il margine si annulla.
 *
 * 3. LA PIEGA È L'ALTEZZA PIENA. Escludere tutto ciò che al montaggio sta
 *    nel primo 92% dello schermo significa, su un telefono, non animare
 *    quasi nulla. Si esclude solo ciò che è davvero già in vista.
 *
 * ═══ SCAGLIONAMENTO ═══
 * Il ritardo non viene da una griglia decisa a tavolino ma dall'ORDINE
 * REALE di comparsa, che su mobile è quello dell'impilamento: gli
 * elementi che entrano insieme ricevono indici crescenti dall'alto verso
 * il basso, e il CSS li traduce in ritardi.
 *
 * ═══ RETI DI SICUREZZA ═══
 * - Il paracadute rivela tutto se l'observer non consegna MAI nulla:
 *   resta una rete, non il comportamento normale.
 * - Un controllo manuale agganciato allo scorrimento raggiunge
 *   l'observer quando resta indietro (su iOS lo scorrimento inerziale
 *   può diradare le consegne).
 */

export function attivaReveal(elementi: HTMLElement[]): () => void {
  if (elementi.length === 0) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  if (!("IntersectionObserver" in window)) return () => {};

  const vh = window.innerHeight;
  const margineBasso = vh < 720 ? 0 : Math.round(vh * 0.06);

  let vivo = false;
  let ordine = 0;
  let ultimaComparsa = 0;

  const rivela = (el: HTMLElement) => {
    if (el.dataset.reveal !== "attesa") return;
    const ora = performance.now();
    // Chi entra a distanza dal precedente riparte da capo: lo
    // scaglionamento serve dentro un gruppo, non lungo tutta la pagina.
    if (ora - ultimaComparsa > 400) ordine = 0;
    ultimaComparsa = ora;
    el.style.setProperty("--vz-i", String(ordine));
    ordine = Math.min(ordine + 1, 5);
    el.dataset.reveal = "visibile";
    osservatore.unobserve(el);
  };

  const osservatore = new IntersectionObserver(
    (voci) => {
      vivo = true;
      const entrate = voci
        .filter((v) => v.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      for (const voce of entrate) rivela(voce.target as HTMLElement);
    },
    { rootMargin: `0px 0px -${margineBasso}px 0px`, threshold: 0 },
  );

  const scoperti = () =>
    elementi.filter((el) => el.dataset.reveal === "attesa");

  const paracadute = window.setTimeout(() => {
    if (vivo) return;
    osservatore.disconnect();
    for (const el of scoperti()) delete el.dataset.reveal;
  }, 1800);

  for (const el of elementi) {
    if (el.dataset.reveal === "visibile") continue;
    // Davvero già in vista: resta visibile da subito, senza animazione.
    if (el.getBoundingClientRect().top < vh) continue;
    el.dataset.reveal = "attesa";
    osservatore.observe(el);
  }

  let inCoda = false;
  const controlla = () => {
    inCoda = false;
    const limite = window.innerHeight - margineBasso;
    for (const el of scoperti()) {
      const r = el.getBoundingClientRect();
      if (r.top < limite && r.bottom > 0) rivela(el);
    }
  };
  const suScorrimento = () => {
    if (inCoda) return;
    inCoda = true;
    requestAnimationFrame(controlla);
  };
  window.addEventListener("scroll", suScorrimento, { passive: true });
  window.addEventListener("scrollend", controlla);

  return () => {
    window.clearTimeout(paracadute);
    window.removeEventListener("scroll", suScorrimento);
    window.removeEventListener("scrollend", controlla);
    osservatore.disconnect();
    // Mai lasciare elementi nascosti quando l'observer non c'è più.
    for (const el of scoperti()) delete el.dataset.reveal;
  };
}
