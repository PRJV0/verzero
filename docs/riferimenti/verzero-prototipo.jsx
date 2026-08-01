import React, { useState, useEffect } from "react";
import {
  Leaf, FileText, Zap, Upload, Check, Download, Sparkles, LayoutDashboard,
  ChevronRight, ArrowRight, ArrowLeft, Building2, TrendingDown, Plus,
  CircleCheck, FileCheck2, ShieldCheck, Scale, MessageCircle, Search,
  Landmark, Database, User, Bot, FolderOpen, LifeBuoy, CalendarDays, History
} from "lucide-react";

const C = {
  ink: "#17251F", pine: "#0E5238", pineDark: "#0A3D2A", moss: "#E7F0EA",
  paper: "#F6F7F5", line: "#E3E6E1", mint: "#1D9E75", gray: "#66716B",
  grayLight: "#98A19B", white: "#FFFFFF", amberSoft: "#F7ECD9", amberInk: "#7A4E0E",
};

const fontLink = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap');
    .vz-body { font-family: 'Inter', system-ui, sans-serif; }
    .vz-display { font-family: 'Fraunces', Georgia, serif; }
    .vz-fade { animation: vzFade .35s ease; }
    @keyframes vzFade { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: none;} }
    @media (prefers-reduced-motion: reduce) { .vz-fade { animation: none; } }
  `}</style>
);

function Card({ children, className = "", style = {} }) {
  return (
    <div className={"rounded-xl " + className} style={{ background: C.white, border: `1px solid ${C.line}`, ...style }}>
      {children}
    </div>
  );
}

function Pill({ bg, fg, children }) {
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: bg, color: fg }}>{children}</span>;
}

/* ------------- Sito pubblico: homepage ------------- */

function Home({ choose }) {
  const servizi = [
    { name: "Percorso Ver0", price: "199 €/mese", desc: "Piattaforma + carbon footprint + bilancio VSME. La via diretta al bollino.", featured: true },
    { name: "Carbon footprint Base", price: "89 €/mese", desc: "Scope 1 e 2 secondo GHG Protocol e ISO 14064-1." },
    { name: "Bilancio VSME Base", price: "129 €/mese", desc: "Il report che banche e clienti capofiliera ti chiedono." },
    { name: "Manuale ISO 9001 o 14001", price: "990 € + 49 €/mese", desc: "Impianto documentale pronto per la certificazione." },
    { name: "Parità di genere PdR 125", price: "129 €/mese", desc: "KPI, sistema di gestione e fascicolo per l'audit." },
    { name: "Rating economia circolare", price: "129 €/mese", desc: "Punteggio di circolarità con report dedicato." },
  ];
  return (
    <div className="vz-fade">
      <div className="flex items-center justify-between px-5 py-3" style={{ background: C.white, borderBottom: `1px solid ${C.line}` }}>
        <span className="vz-display font-semibold text-xl" style={{ color: C.pine }}>Ver<span style={{ color: C.pineDark }}>0</span><span style={{ color: C.mint }}>.</span></span>
        <div className="hidden sm:flex gap-5 text-xs" style={{ color: C.gray }}>
          <span>Come funziona</span><span>Servizi e prezzi</span><span>Il bollino</span><span>Partner</span>
        </div>
        <button onClick={() => choose(servizi[0])} className="text-xs px-3.5 py-2 rounded-lg" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>Inizia ora</button>
      </div>

      <div className="text-center px-5 py-14" style={{ background: C.moss }}>
        <p className="text-xs tracking-widest mb-3" style={{ color: C.mint, fontWeight: 500 }}>SOSTENIBILITÀ · EFFICIENZA ENERGETICA · SISTEMI DI GESTIONE</p>
        <h1 className="vz-display text-3xl md:text-4xl max-w-2xl mx-auto" style={{ color: C.pineDark, lineHeight: 1.2 }}>
          La consulenza per la tua impresa,<br />a portata di un cl<span style={{ color: C.mint }}>AI</span>ck.
        </h1>
        <p className="text-sm max-w-lg mx-auto mt-4 mb-6" style={{ color: C.pine }}>
          La piattaforma che qualifica la tua azienda con l'effort più basso di sempre, a una frazione del prezzo
          della consulenza tradizionale: l'AI fa il lavoro pesante, le persone verificano, tu raccogli il risultato.
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center">
          <button onClick={() => choose(servizi[0])} className="text-sm px-5 py-2.5 rounded-lg" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>
            Scopri cosa possiamo fare per te
          </button>
          <button className="text-sm px-5 py-2.5 rounded-lg" style={{ background: C.white, color: C.pine, border: `1px solid ${C.pine}`, fontWeight: 500 }}>
            Verifica un bollino
          </button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center mt-5 text-xs" style={{ color: C.pine }}>
          <span className="flex items-center gap-1.5"><CircleCheck size={14} style={{ color: C.mint }} /> Prezzi in chiaro, sotto la media di mercato</span>
          <span className="flex items-center gap-1.5"><CircleCheck size={14} style={{ color: C.mint }} /> Effort minimo: mai un dato che sappiamo già</span>
          <span className="flex items-center gap-1.5"><CircleCheck size={14} style={{ color: C.mint }} /> Qualifica verificabile da chiunque</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-10 max-w-4xl mx-auto">
        {[
          { icon: Leaf, t: "Sostenibilità", d: "Carbon footprint, bilancio VSME, economia circolare: i documenti che banche e clienti ti chiedono, verificabili da chiunque." },
          { icon: Zap, t: "Efficienza energetica", d: "Dai consumi reali alle opportunità di risparmio: la tua energia letta, misurata e messa al lavoro." },
          { icon: Scale, t: "Sistemi di gestione", d: "Manuali e procedure ISO e parità di genere, generati sui tuoi dati e pronti per la certificazione." },
        ].map((s) => (
          <Card key={s.t} className="p-5 text-center">
            <span className="inline-flex w-11 h-11 rounded-full items-center justify-center" style={{ background: C.moss, color: C.pine }}><s.icon size={20} /></span>
            <p className="text-sm font-semibold mt-3" style={{ color: C.ink }}>{s.t}</p>
            <p className="text-xs mt-1.5" style={{ color: C.gray, lineHeight: 1.6 }}>{s.d}</p>
          </Card>
        ))}
      </div>

      <div className="px-5 py-10" style={{ background: C.pineDark }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center shrink-0" style={{ background: C.moss, border: `3px solid ${C.white}` }}>
            <span className="vz-display font-semibold text-3xl leading-none" style={{ color: C.pine }}>0</span>
            <span className="text-[10px] tracking-widest mt-0.5" style={{ color: C.pineDark }}>2026</span>
          </div>
          <div className="text-center md:text-left">
            <p className="vz-display text-2xl" style={{ color: C.white }}>Ver0 qualifica la tua impresa.</p>
            <p className="text-sm mt-2 max-w-lg" style={{ color: C.moss }}>
              Non ti consegniamo solo documenti: ti accompagniamo a una qualifica verificabile da chiunque, che vale davanti a banche, capofiliera e stazioni appaltanti. Il bollino non si compra — si dimostra, ogni anno.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {["Reputazione", "Attendibilità", "Riconoscimento"].map((t) => (
                <span key={t} className="text-xs px-3.5 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", color: C.white, border: `1px solid ${C.mint}` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-8 max-w-4xl mx-auto text-center">
        {[
          { icon: Upload, t: "1. Carica i documenti", d: "Bollette e fatture: li legge l'AI" },
          { icon: CircleCheck, t: "2. Verifica e conferma", d: "Tu controlli, la piattaforma calcola" },
          { icon: ShieldCheck, t: "3. Ottieni report e bollino", d: "Documenti difendibili, verificabili da chiunque" },
        ].map((s) => (
          <div key={s.t}>
            <span className="inline-flex w-10 h-10 rounded-full items-center justify-center" style={{ background: C.moss, color: C.pine }}><s.icon size={19} /></span>
            <p className="text-sm font-semibold mt-2" style={{ color: C.ink }}>{s.t}</p>
            <p className="text-xs mt-0.5" style={{ color: C.gray }}>{s.d}</p>
          </div>
        ))}
      </div>

      <div className="px-5 pb-8 max-w-4xl mx-auto">
        <p className="vz-display text-xl mb-1 text-center" style={{ color: C.ink }}>Servizi e prezzi, in chiaro</p>
        <p className="text-xs mb-4 text-center" style={{ color: C.gray }}>Nessun preventivo da chiedere: attivi quello che ti serve, quando ti serve.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {servizi.map((s) => (
            <Card key={s.name} className="p-4 flex flex-col" style={s.featured ? { border: `2px solid ${C.pine}`, background: C.white } : {}}>
              {s.featured && <span className="self-start mb-2"><Pill bg={C.pine} fg={C.white}>Il più scelto</Pill></span>}
              <p className="text-sm font-semibold" style={{ color: C.ink }}>{s.name}</p>
              <p className="text-xs mt-1 mb-3 flex-1" style={{ color: C.gray }}>{s.desc}</p>
              <div className="flex items-center justify-between">
                <p className="vz-display text-lg" style={{ color: s.featured ? C.pine : C.ink }}>{s.price}</p>
                <button onClick={() => choose(s)} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: s.featured ? C.pine : C.white, color: s.featured ? C.white : C.pine, border: `1px solid ${C.pine}`, fontWeight: 500 }}>
                  Attiva
                </button>
              </div>
            </Card>
          ))}
        </div>
        <p className="text-xs text-center mt-3" style={{ color: C.grayLight }}>
          Prezzi per aziende fino a 50 dipendenti, IVA esclusa · 51-200 dipendenti: listino +60% · −10% con pagamento annuale
        </p>
      </div>

      <div className="flex items-center gap-4 max-w-3xl mx-auto mb-8 mx-5 sm:mx-auto p-4 rounded-xl" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
        <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0" style={{ background: C.moss, border: `2.5px solid ${C.pine}` }}>
          <span className="vz-display font-semibold text-lg leading-none" style={{ color: C.pine }}>0</span>
          <span className="text-[9px] tracking-wide" style={{ color: C.pineDark }}>2026</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: C.ink }}>Il bollino non si compra. Si dimostra.</p>
          <p className="text-xs" style={{ color: C.gray }}>Criteri pubblici, dati verificati, QR di controllo. Millesimato: ogni anno va riconquistato.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs" style={{ borderTop: `1px solid ${C.line}`, color: C.grayLight }}>
        <span>Commercialista o consulente? Programma partner con provvigioni ricorrenti</span>
        <span>verzero.it · dati ospitati in UE · dietro lo schermo ci sono sempre persone</span>
      </div>
    </div>
  );
}

/* ------------- Dettaglio servizio ------------- */

const SERVICE_DETAILS = {
  "Percorso Ver0": {
    desc: "Il pacchetto completo che porta la tua impresa dalla prima bolletta al bollino: carbon footprint e bilancio di sostenibilità insieme, con un unico inserimento dati.",
    output: ["Report carbon footprint conforme a GHG Protocol e ISO 14064-1", "Bilancio di sostenibilità in formato VSME (standard EFRAG)", "Bollino Impresa Ver0 livello 1 al completamento, con pagina pubblica di verifica e QR", "Dashboard sempre aggiornata e documenti scaricabili e condivisibili"],
    ganci: ["Le banche chiedono già questi dati per il credito: presentati con documenti standard, non con questionari compilati a mano", "I clienti capofiliera devono rendicontare lo Scope 3: un fornitore qualificato Ver0 parte avvantaggiato", "Costo di un ordine di grandezza inferiore alla consulenza tradizionale, con il bollino incluso nel percorso"],
  },
  "Carbon footprint Base": {
    desc: "La misura ufficiale delle emissioni della tua organizzazione: Scope 1 e 2 calcolati dai tuoi documenti reali, con metodo riconosciuto a livello internazionale.",
    output: ["Report di inventario GHG conforme a GHG Protocol e ISO 14064-1", "Scope 2 in doppia lettura (location-based e market-based)", "Etichetta di qualità su ogni dato (misurato / da documento / stimato) e tracciabilità dei fattori di emissione", "Intensità emissiva calcolata dal bilancio depositato"],
    ganci: ["È il documento che i clienti grandi ti stanno per chiedere (o ti hanno già chiesto): arriva pronto, non rincorrere", "Primo passo verso il bollino Impresa Ver0", "Ogni anno si rinnova in poche ore: lo storico resta in piattaforma"],
  },
  "Bilancio VSME Base": {
    desc: "Il bilancio di sostenibilità nel formato europeo pensato per le PMI: un documento unico e standard che risponde a banche, clienti e bandi senza rifare il lavoro ogni volta.",
    output: ["Bilancio conforme allo standard VSME (EFRAG), modulo base", "Narrativa professionale generata sui tuoi dati e rivista da te", "Indicatori ambientali importati automaticamente dagli altri moduli attivi", "Versione PDF scaricabile e versione online condivisibile"],
    ganci: ["Un solo documento standard al posto di dieci questionari diversi di banche e clienti", "La consulenza tradizionale lo fa pagare migliaia di euro: qui è un canone mensile", "Richiesto sempre più spesso nei rating bancari ESG per l'accesso al credito"],
  },
  "Manuale ISO 9001 o 14001": {
    desc: "L'impianto documentale completo del tuo sistema di gestione — qualità o ambiente — generato sui dati reali della tua azienda e pronto per l'audit di certificazione.",
    output: ["Manuale, politica, analisi del contesto, rischi e opportunità secondo la struttura HLS (punti 4-10)", "Procedure gestionali e modulistica di registrazione complete", "Tutto in formato Word modificabile, di tua proprietà", "Scadenzario di audit interni e riesami incluso nel mantenimento"],
    ganci: ["La certificazione è requisito o premialità in bandi e qualifiche fornitori: senza, certe porte restano chiuse", "La consulenza tradizionale chiede migliaia di euro per gli stessi documenti, spesso da template riciclati", "Per la 14001, l'analisi ambientale nasce già precompilata dai tuoi dati carbon"],
  },
  "Parità di genere PdR 125": {
    desc: "Il percorso verso la certificazione della parità di genere: autovalutazione sui KPI ufficiali, sistema di gestione e fascicolo pronto per l'audit dell'organismo accreditato.",
    output: ["Autovalutazione guidata sui KPI delle sei aree della UNI/PdR 125:2022", "Politica, piano strategico e procedure del sistema di gestione della parità", "Fascicolo documentale pronto per l'audit di certificazione", "KPI di governance precompilati dai dati camerali"],
    ganci: ["Esonero contributivo per le aziende certificate: il servizio si ripaga da solo", "Premialità nei bandi pubblici e punteggi negli appalti", "Un segnale forte per attrarre e trattenere talenti"],
  },
  "Rating economia circolare": {
    desc: "La misura di quanto la tua impresa è circolare: materiali, rifiuti, riuso ed energia in un punteggio chiaro, con le azioni per migliorarlo.",
    output: ["Punteggio di circolarità con dettaglio per area", "Report dedicato con posizionamento rispetto al tuo settore", "Piano di miglioramento con azioni ordinate per impatto"],
    ganci: ["Le filiere chiedono sempre più spesso evidenze di circolarità ai fornitori", "Si integra con carbon e VSME: dati già inseriti, punteggio quasi gratis in termini di effort", "Un argomento distintivo in più nelle gare e nelle presentazioni commerciali"],
  },
};



function Dettaglio({ service, buy, back }) {
  const s = service || { name: "Percorso Ver0", price: "199 \u20ac/mese", desc: "" };
  const det = SERVICE_DETAILS[s.name] || SERVICE_DETAILS["Percorso Ver0"];
  return (
    <div className="vz-fade max-w-3xl mx-auto pt-6 px-4">
      <button onClick={back} className="flex items-center gap-1.5 text-xs mb-4" style={{ color: C.gray }}>
        <ArrowLeft size={13} /> Torna al sito
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <h1 className="vz-display text-2xl mb-1" style={{ color: C.ink }}>{s.name}</h1>
          <p className="text-sm mb-4" style={{ color: C.gray }}>{det.desc}</p>
          <Card className="p-4 mb-3">
            <p className="text-sm font-semibold mb-2" style={{ color: C.ink }}>Cosa ottieni</p>
            <div className="space-y-1.5 text-sm" style={{ color: C.gray }}>
              {det.output.map((x) => (
                <p key={x} className="flex items-start gap-2"><FileCheck2 size={15} className="mt-0.5 shrink-0" style={{ color: C.pine }} /> {x}</p>
              ))}
            </div>
          </Card>
          <Card className="p-4 mb-3" style={{ background: C.moss, border: "none" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: C.pineDark }}>Perché conviene adesso</p>
            <div className="space-y-1.5 text-sm" style={{ color: C.pine }}>
              {det.ganci.map((x) => (
                <p key={x} className="flex items-start gap-2"><Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: C.mint }} /> {x}</p>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold mb-2" style={{ color: C.ink }}>Quanto tempo ti chiede</p>
            <p className="text-sm" style={{ color: C.gray }}>
              Circa <span className="font-semibold" style={{ color: C.ink }}>3 ore di lavoro totali</span> distribuite come preferisci.
              Nessun campo ti blocca: se un dato non lo hai, lo stimiamo insieme o lo deleghi al tuo commercialista.
            </p>
          </Card>
        </div>
        <div>
          <Card className="p-4" style={{ border: `2px solid ${C.pine}` }}>
            <p className="text-xs" style={{ color: C.gray }}>Prezzo</p>
            <p className="vz-display text-2xl mb-1" style={{ color: C.pine }}>{s.price}</p>
            <p className="text-xs mb-3" style={{ color: C.grayLight }}>IVA esclusa \u00b7 fino a 50 dipendenti \u00b7 disdici quando vuoi \u00b7 \u221210% con pagamento annuale</p>
            <button onClick={buy} className="w-full text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>
              Procedi all'acquisto <ArrowRight size={15} />
            </button>
          </Card>
          <p className="text-xs mt-3 text-center" style={{ color: C.grayLight }}>Dati ospitati in UE \u00b7 dietro lo schermo ci sono sempre persone</p>
        </div>
      </div>
    </div>
  );
}

/* ------------- Checkout ------------- */

function Checkout({ service, pay, back }) {
  const s = service || { name: "Percorso Ver0", price: "199 \u20ac/mese" };
  const [billing, setBilling] = useState("mensile");
  const [tos, setTos] = useState(false);
  const [banche, setBanche] = useState(false);
  return (
    <div className="vz-fade max-w-3xl mx-auto pt-6 px-4">
      <button onClick={back} className="flex items-center gap-1.5 text-xs mb-3" style={{ color: C.gray }}>
        <ArrowLeft size={13} /> Torna al dettaglio
      </button>
      <div className="flex items-center gap-2 text-xs mb-4" style={{ color: C.grayLight }}>
        <span style={{ color: C.mint }}>1 \u00b7 Servizio \u2713</span><span>\u2014</span>
        <span style={{ color: C.pine, fontWeight: 600 }}>2 \u00b7 Checkout</span><span>\u2014</span><span>3 \u00b7 La tua area</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2">
          <p className="text-sm font-semibold mb-3" style={{ color: C.ink }}>Dati di fatturazione</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {[["Ragione sociale", "Meccanica Toscana S.r.l."], ["Partita IVA", "01234567890"], ["Codice SDI o PEC", "es. M5UXCR1"], ["Email", "amministrazione@..."]].map(([l, ph]) => (
              <div key={l}>
                <label className="text-xs block mb-1" style={{ color: C.gray }}>{l}</label>
                <input placeholder={ph} className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }} />
              </div>
            ))}
          </div>
          <p className="text-sm font-semibold mb-2" style={{ color: C.ink }}>Pagamento</p>
          <div className="flex gap-2 mb-3">
            {[["mensile", "Mensile", s.price], ["annuale", "Annuale anticipato", "\u221210%"]].map(([id, l, note]) => (
              <button key={id} onClick={() => setBilling(id)} className="flex-1 text-sm px-3 py-2.5 rounded-lg text-left" style={{ border: `1.5px solid ${billing === id ? C.pine : C.line}`, background: billing === id ? C.moss : C.white, color: C.ink }}>
                <span className="font-medium">{l}</span> <span className="text-xs" style={{ color: C.pine }}>{note}</span>
              </button>
            ))}
          </div>
          <div className="h-10 rounded-lg flex items-center px-3 text-xs mb-4" style={{ background: C.paper, color: C.grayLight }}>
            Carta \u00b7 SEPA \u00b7 bonifico \u2014 (modulo di pagamento)
          </div>
          <label className="flex items-start gap-2 text-xs mb-2 cursor-pointer" style={{ color: C.gray }}>
            <input type="checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)} className="mt-0.5" />
            <span>Accetto i termini di servizio e l'informativa privacy.</span>
          </label>
          <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: C.gray }}>
            <input type="checkbox" checked={banche} onChange={(e) => setBanche(e.target.checked)} className="mt-0.5" />
            <span>Autorizzo Verzero a interrogare per mio conto le banche dati ufficiali e commerciali per precompilare la mia area. Revocabile in ogni momento.</span>
          </label>
        </Card>
        <div>
          <Card className="p-4">
            <p className="text-xs" style={{ color: C.gray }}>Riepilogo ordine</p>
            <p className="text-sm font-semibold mt-1" style={{ color: C.ink }}>{s.name}</p>
            <p className="vz-display text-xl mb-1" style={{ color: C.pine }}>{billing === "annuale" ? "\u221210% \u00b7 annuale" : s.price}</p>
            <p className="text-xs mb-3" style={{ color: C.grayLight }}>IVA esclusa \u00b7 fattura elettronica automatica</p>
            <button disabled={!tos || !banche} onClick={pay} className="w-full text-sm px-4 py-2.5 rounded-lg" style={{ background: tos && banche ? C.pine : C.grayLight, color: C.white, fontWeight: 500 }}>
              Paga e attiva
            </button>
            <p className="text-xs mt-2" style={{ color: C.grayLight }}>La precompilazione dalle banche dati parte solo dopo il pagamento.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------- Attivazione post-pagamento ------------- */

function Attivazione({ enter }) {
  const [steps, setSteps] = useState([]);
  const [ready, setReady] = useState(false);
  const sources = [
    { icon: Landmark, label: "Registro Imprese \u2014 anagrafica, ATECO, cariche" },
    { icon: Database, label: "Bilanci depositati (XBRL) \u2014 dati economici" },
    { icon: Search, label: "Unit\u00e0 locali e addetti" },
  ];
  useEffect(() => {
    const timers = sources.map((_, i) => setTimeout(() => setSteps((s) => [...s, i]), 700 * (i + 1)));
    const done = setTimeout(() => setReady(true), 700 * sources.length + 600);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);
  return (
    <div className="vz-fade max-w-xl mx-auto pt-10 px-4">
      <div className="text-center mb-5">
        <span className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full" style={{ background: "#EAF3DE", color: "#27500A", fontWeight: 500 }}>
          <CircleCheck size={16} /> Pagamento confermato \u2014 fattura in arrivo via SDI
        </span>
      </div>
      <Card className="p-6">
        <p className="vz-display text-xl mb-1" style={{ color: C.ink }}>Stiamo preparando la tua area</p>
        <p className="text-sm mb-4" style={{ color: C.gray }}>Con la P.IVA 01234567890 indicata al checkout stiamo interrogando le fonti ufficiali per precompilare il tuo servizio.</p>
        <div className="space-y-2 mb-4">
          {sources.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2.5 text-sm" style={{ color: steps.includes(i) ? C.pine : C.grayLight }}>
              {steps.includes(i)
                ? <CircleCheck size={16} style={{ color: C.mint }} />
                : <span className="w-4 h-4 rounded-full inline-block animate-pulse" style={{ border: `1.5px solid ${C.grayLight}` }} />}
              <s.icon size={15} /> {s.label}
            </div>
          ))}
        </div>
        {ready && (
          <div className="vz-fade p-4 rounded-xl" style={{ background: C.moss }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: C.pine, color: C.white }}>MT</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.pineDark }}>Meccanica Toscana S.r.l.</p>
                <p className="text-xs" style={{ color: C.pine }}>Meccanica di precisione \u00b7 ATECO 25.62 \u00b7 34 addetti \u00b7 2 unit\u00e0 locali</p>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: C.pine }}>Area pronta: ti chiederemo solo ci\u00f2 che nessuna banca dati sa.</p>
            <button onClick={enter} className="w-full text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>
              Entra nella tua area riservata <ArrowRight size={15} />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------- Dashboard ------------- */

const SERVICE_META = {
  "Percorso Ver0": { icon: Leaf, steps: ["Conferma i dati precompilati", "Carica le bollette 2025", "Completa il questionario VSME", "Genera report e richiedi il bollino"], done: 1, cta: "Carica le bollette", view: "wizard" },
  "Carbon footprint Base": { icon: Leaf, steps: ["Conferma i dati precompilati", "Carica bollette e carburanti", "Verifica le stime proposte", "Genera il report"], done: 1, cta: "Carica le bollette", view: "wizard" },
  "Bilancio VSME Base": { icon: FileText, steps: ["Conferma i dati precompilati", "Questionario guidato per aree", "Rivedi la narrativa generata", "Scarica il bilancio"], done: 1, cta: "Apri il questionario", view: "wizard" },
  "Manuale ISO 9001 o 14001": { icon: Scale, steps: ["Conferma i dati precompilati", "Questionario su processi e ruoli", "Rivedi il manuale generato", "Esporta in Word e avvia l'audit"], done: 1, cta: "Apri il questionario", view: "wizard" },
  "Parit\u00e0 di genere PdR 125": { icon: ShieldCheck, steps: ["Conferma governance da visura", "Inserisci i 6 KPI aggregati", "Rivedi il sistema generato", "Prepara il fascicolo per l'audit"], done: 1, cta: "Inserisci i KPI", view: "wizard" },
  "Rating economia circolare": { icon: Building2, steps: ["Conferma i dati precompilati", "Questionario di circolarit\u00e0", "Rivedi il punteggio", "Scarica il report"], done: 1, cta: "Apri il questionario", view: "wizard" },
};

function Dashboard({ go, service }) {
  const meta = SERVICE_META[service?.name] || SERVICE_META["Percorso Ver0"];
  const SIcon = meta.icon;
  const modules = [
    { icon: Leaf, title: "Carbon footprint", sub: "ISO 14064-1 · Scope 1, 2, 3", badge: <Pill bg="#EAF3DE" fg="#27500A">Completato</Pill>, cta: "Apri report", act: () => {} },
    { icon: FileText, title: "Bilancio VSME", sub: "In corso · 60%", badge: <Pill bg={C.amberSoft} fg={C.amberInk}>In corso</Pill>, cta: "Riprendi", act: () => go("wizard") },
    { icon: Scale, title: "Sistemi di gestione ISO", sub: "9001 · 14001 · manuali e procedure", badge: <Pill bg={C.moss} fg={C.pine}>Novità</Pill>, cta: "Scopri", act: () => go("catalogo") },
    { icon: ShieldCheck, title: "Parità di genere", sub: "UNI/PdR 125 · KPI e sistema", badge: <Pill bg={C.moss} fg={C.pine}>Novità</Pill>, cta: "Scopri", act: () => go("catalogo") },
  ];
  return (
    <div className="vz-fade">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="vz-display text-2xl" style={{ color: C.ink }}>Buongiorno, Meccanica Toscana</h1>
          <p className="text-sm mt-0.5" style={{ color: C.gray }}>Anno di rendicontazione 2025 · dati precompilati da fonti ufficiali</p>
        </div>
      </div>

      <Card className="p-4 mb-5" style={{ border: `2px solid ${C.pine}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.pine, color: C.white }}><SIcon size={19} /></span>
            <div className="min-w-0">
              <p className="text-xs" style={{ color: C.gray }}>Il tuo servizio attivo</p>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>{service?.name || "Percorso Ver0"}</p>
            </div>
          </div>
          <button onClick={() => go(meta.view)} className="text-sm px-4 py-2 rounded-lg flex items-center gap-1.5" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>
            {meta.cta} <ArrowRight size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${C.line}` }}>
          {meta.steps.map((st, i) => (
            <span key={st} className="flex items-center gap-1.5" style={{ color: i < meta.done ? C.mint : i === meta.done ? C.pine : C.grayLight, fontWeight: i === meta.done ? 600 : 400 }}>
              {i < meta.done ? <CircleCheck size={13} /> : <span className="w-3 h-3 rounded-full inline-block" style={{ border: "1.5px solid currentColor" }} />}
              {st}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card className="p-4">
          <p className="text-xs mb-1" style={{ color: C.gray }}>Emissioni totali</p>
          <p className="vz-display text-3xl" style={{ color: C.ink }}>412 <span className="text-sm vz-body" style={{ color: C.gray }}>tCO₂e</span></p>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.mint }}><TrendingDown size={13} /> −8% sul 2024</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs mb-1" style={{ color: C.gray }}>Intensità emissiva</p>
          <p className="vz-display text-3xl" style={{ color: C.ink }}>96 <span className="text-sm vz-body" style={{ color: C.gray }}>t/M€</span></p>
          <p className="text-xs mt-1" style={{ color: C.gray }}>dal bilancio XBRL depositato</p>
        </Card>
        <Card className="p-4" style={{ background: C.moss, border: "none" }}>
          <p className="text-xs mb-1 font-medium" style={{ color: C.pine }}>Bollino Impresa Ver0 2026</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex flex-col items-center justify-center" style={{ background: C.white, border: `2.5px solid ${C.pine}` }}>
              <span className="vz-display font-semibold text-lg leading-none" style={{ color: C.pine }}>0</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.pineDark }}>Livello 1 · all'82%</p>
              <p className="text-xs" style={{ color: C.pine }}>ambito carbon verificato · VSME in corso</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.amberSoft, color: C.amberInk }}><Landmark size={18} /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: C.ink }}>3 bandi compatibili con la tua azienda</p>
              <p className="text-xs" style={{ color: C.gray }}>Finanza agevolata che può coprire i tuoi servizi</p>
            </div>
          </div>
          <button onClick={() => go("bandi")} className="text-sm px-3 py-2 rounded-lg shrink-0" style={{ border: `1px solid ${C.line}`, color: C.pine, fontWeight: 500, background: C.white }}>Vedi</button>
        </Card>
        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.moss, color: C.pine }}><History size={18} /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Documenti pregressi</p>
              <p className="text-xs" style={{ color: C.gray }}>Bilanci, certificati o report già fatti? Portali: diamo continuità</p>
            </div>
          </div>
          <button className="text-sm px-3 py-2 rounded-lg shrink-0" style={{ border: `1px solid ${C.line}`, color: C.pine, fontWeight: 500, background: C.white }}>Carica</button>
        </Card>
      </div>

      <p className="text-sm font-semibold mb-2.5" style={{ color: C.ink }}>Amplia il tuo percorso</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {modules.map((m) => (
          <Card key={m.title} className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.moss, color: C.pine }}><m.icon size={18} /></span>
              {m.badge}
            </div>
            <p className="text-sm font-semibold" style={{ color: C.ink }}>{m.title}</p>
            <p className="text-xs mt-0.5 mb-3 flex-1" style={{ color: C.gray }}>{m.sub}</p>
            <button onClick={m.act} className="text-sm px-3 py-2 rounded-lg w-full flex items-center justify-center gap-1.5" style={{ border: `1px solid ${C.line}`, color: C.pine, fontWeight: 500, background: C.white }}>
              {m.cta} <ChevronRight size={14} />
            </button>
          </Card>
        ))}
      </div>

      <p className="text-sm font-semibold mb-2.5" style={{ color: C.ink }}>Documenti recenti</p>
      <Card>
        {[
          { name: "Report carbon footprint 2025.pdf", meta: "Verificato dal team tecnico · 14 lug 2026", human: true },
          { name: "Bilancio VSME 2025 — bozza.pdf", meta: "Generato dalla piattaforma · 18 lug 2026", human: false },
        ].map((d, i) => (
          <div key={d.name} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div className="flex items-center gap-3 min-w-0">
              <FileCheck2 size={17} style={{ color: C.gray }} />
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: C.ink }}>{d.name}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: d.human ? C.mint : C.grayLight }}>
                  {d.human ? <User size={11} /> : <Bot size={11} />} {d.meta}
                </p>
              </div>
            </div>
            <button aria-label={"Scarica " + d.name} className="p-2 rounded-lg" style={{ color: C.gray }}><Download size={16} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ------------- Wizard energia (impatto live) ------------- */

function Wizard({ go }) {
  const [phase, setPhase] = useState("empty");
  const [kwh, setKwh] = useState(104300);
  const [supply, setSupply] = useState("go");
  const impact = supply === "go" ? 0 : Math.round(kwh * 0.000262 * 10) / 10;

  useEffect(() => {
    if (phase === "extracting") {
      const t = setTimeout(() => setPhase("done"), 1300);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="vz-fade">
      <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.gray }}>
        <ArrowLeft size={15} /> Dashboard
      </button>
      <h1 className="vz-display text-2xl mb-1" style={{ color: C.ink }}>Energia elettrica 2025</h1>
      <p className="text-sm mb-5" style={{ color: C.gray }}>Carica la bolletta: la legge l'AI, tu confermi. Se un dato non c'è, lo stimiamo insieme — nessun campo ti blocca.</p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          {phase === "empty" ? (
            <button onClick={() => setPhase("extracting")} className="w-full rounded-xl p-8 text-center" style={{ border: `1.5px dashed ${C.grayLight}`, background: C.white }}>
              <Upload size={26} className="mx-auto mb-2" style={{ color: C.gray }} />
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Trascina qui le bollette</p>
              <p className="text-xs mt-1 mb-3" style={{ color: C.gray }}>PDF o foto, anche più mesi insieme</p>
              <span className="inline-block text-sm px-3.5 py-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.pine, fontWeight: 500 }}>Simula caricamento</span>
            </button>
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.paper }}><FileText size={17} style={{ color: C.gray }} /></span>
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: C.ink }}>bolletta_giugno_2026.pdf</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: phase === "extracting" ? C.amberInk : C.mint }}>
                    <Sparkles size={12} /> {phase === "extracting" ? "Lettura AI in corso…" : "Dati estratti — verifica e conferma"}
                  </p>
                </div>
              </div>
            </Card>
          )}
          <Card className="p-4 mt-4" style={{ background: C.moss, border: "none" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: C.pine }}>Impatto di questo passaggio</p>
            <p className="vz-display text-3xl" style={{ color: C.pineDark }}>
              {phase === "empty" || phase === "extracting" ? "—" : impact.toLocaleString("it-IT")}
              <span className="text-sm vz-body ml-1.5" style={{ color: C.pine }}>tCO₂e</span>
            </p>
            <p className="text-xs mt-1" style={{ color: C.pine }}>
              {supply === "go" && phase === "done" ? "Fornitura con GO: Scope 2 market-based azzerato" : "Scope 2 · si aggiorna mentre inserisci"}
            </p>
          </Card>
        </div>

        <Card className="p-5 md:col-span-3">
          <p className="text-sm font-semibold mb-3" style={{ color: C.ink }}>Verifica i dati estratti</p>
          {phase !== "done" ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-9 rounded-lg" style={{ background: C.paper }} />)}
              <p className="text-xs" style={{ color: C.grayLight }}>I campi si compileranno da soli dopo il caricamento.</p>
            </div>
          ) : (
            <div className="space-y-3 vz-fade">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: C.gray }}>POD</label>
                  <input defaultValue="IT001E12345678" className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: C.gray }}>Consumo (kWh)</label>
                  <input type="number" value={kwh} onChange={(e) => setKwh(Number(e.target.value) || 0)} className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: C.gray }}>Tipo di fornitura</label>
                <select value={supply} onChange={(e) => setSupply(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.white }}>
                  <option value="go">100% rinnovabile con Garanzia d'Origine</option>
                  <option value="mix">Mix energetico nazionale</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <p className="text-xs" style={{ color: C.gray }}>Cambia fornitura o consumo:<br />l'impatto si aggiorna subito.</p>
                <button onClick={() => go("dashboard")} className="text-sm px-4 py-2 rounded-lg flex items-center gap-1.5" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>
                  Conferma <Check size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------- Catalogo ------------- */

function Catalogo({ go }) {
  const items = [
    { icon: Leaf, title: "Carbon footprint Base", price: "89", unit: "€/mese", desc: "Scope 1 e 2, dai documenti al report verificabile.", state: "attivo" },
    { icon: FileText, title: "Bilancio VSME Base", price: "129", unit: "€/mese", desc: "Report VSME con indicatori importati dagli altri moduli.", state: "attivo" },
    { icon: Scale, title: "Manuale ISO 9001", price: "990", unit: "€ + 49 €/mese", desc: "Impianto documentale completo, pronto per la certificazione. Mantenimento e scadenzario inclusi nel canone.", state: "disponibile" },
    { icon: Scale, title: "Manuale ISO 14001", price: "990", unit: "€ + 49 €/mese", desc: "Analisi ambientale precompilata dai tuoi dati carbon. Registro obblighi aggiornato automaticamente.", state: "disponibile" },
    { icon: ShieldCheck, title: "Parità di genere PdR 125", price: "129", unit: "€/mese", desc: "KPI delle sei aree, sistema di gestione e fascicolo per l'audit. Esonero contributivo per le certificate.", state: "disponibile" },
    { icon: Building2, title: "Rating economia circolare", price: "129", unit: "€/mese", desc: "Questionario guidato e punteggio di circolarità.", state: "disponibile" },
  ];
  return (
    <div className="vz-fade">
      <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.gray }}>
        <ArrowLeft size={15} /> Dashboard
      </button>
      <h1 className="vz-display text-2xl mb-1" style={{ color: C.ink }}>Catalogo servizi</h1>
      <p className="text-sm mb-4" style={{ color: C.gray }}>Ogni servizio riusa i dati che hai già: più moduli attivi, meno lavoro per ciascuno. Prezzi per aziende fino a 50 dipendenti, IVA esclusa.</p>
      <div className="rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3" style={{ background: C.moss, border: `2px solid ${C.pine}` }}>
        <div>
          <Pill bg={C.pine} fg={C.white}>Consigliato</Pill>
          <p className="text-base font-semibold mt-2" style={{ color: C.pineDark }}>Percorso Ver0 — 199 €/mese</p>
          <p className="text-xs mt-0.5" style={{ color: C.pine }}>Piattaforma + carbon Base + VSME Base. La via diretta al bollino.</p>
        </div>
        <button className="text-sm px-4 py-2 rounded-lg" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>Attiva il Percorso</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((m) => (
          <Card key={m.title} className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.moss, color: C.pine }}><m.icon size={18} /></span>
              {m.state === "attivo" && <Pill bg="#EAF3DE" fg="#27500A">Attivo</Pill>}
            </div>
            <p className="text-sm font-semibold" style={{ color: C.ink }}>{m.title}</p>
            <p className="text-xs mt-1 mb-3 flex-1" style={{ color: C.gray }}>{m.desc}</p>
            <div className="flex items-center justify-between">
              <p className="vz-display text-lg" style={{ color: C.ink }}>{m.price} <span className="text-xs vz-body" style={{ color: C.gray }}>{m.unit}</span></p>
              {m.state === "disponibile" && (
                <button className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>
                  <Plus size={13} /> Attiva
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------- Assistenza uomo+AI ------------- */

function Assistenza({ go }) {
  const msgs = [
    { who: "user", text: "Non trovo il coefficiente C sulla bolletta del gas, mi blocco qui?" },
    { who: "ai", text: "No, nessun blocco: se il coefficiente non è in bolletta posso stimarlo dal tuo comune e dal tipo di fornitura. Il dato verrà etichettato come \"stimato\" nel report. Vuoi che proceda?" },
    { who: "user", text: "Sì, ma preferirei che qualcuno lo verificasse." },
    { who: "human", text: "Ciao, sono Marco del team tecnico. Ho verificato: per la tua fornitura il coefficiente stimato è corretto. L'ho validato io — nel report comparirà come verificato. Buon proseguimento!" },
  ];
  return (
    <div className="vz-fade max-w-2xl">
      <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.gray }}>
        <ArrowLeft size={15} /> Dashboard
      </button>
      <h1 className="vz-display text-2xl mb-1" style={{ color: C.ink }}>Assistenza</h1>
      <p className="text-sm mb-5" style={{ color: C.gray }}>AI per la velocità, persone per la verifica. Sai sempre chi ti sta rispondendo — risposta umana garantita entro il giorno lavorativo successivo.</p>
      <Card className="p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={"flex " + (m.who === "user" ? "justify-end" : "justify-start")}>
            <div className="max-w-md rounded-xl px-3.5 py-2.5" style={{
              background: m.who === "user" ? C.pine : m.who === "human" ? C.moss : C.paper,
              color: m.who === "user" ? C.white : C.ink,
            }}>
              {m.who !== "user" && (
                <p className="text-xs mb-1 flex items-center gap-1 font-medium" style={{ color: m.who === "human" ? C.pine : C.gray }}>
                  {m.who === "human" ? <User size={11} /> : <Bot size={11} />}
                  {m.who === "human" ? "Marco · team tecnico (persona)" : "Assistente Verzero (AI)"}
                </p>
              )}
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
          <input placeholder="Scrivi un messaggio…" className="flex-1 text-sm px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }} />
          <button className="text-sm px-4 py-2 rounded-lg" style={{ background: C.pine, color: C.white, fontWeight: 500 }}>Invia</button>
        </div>
      </Card>
    </div>
  );
}

/* ------------- Osservatorio bandi ------------- */

function Bandi({ go }) {
  const bandi = [
    { ente: "Camera di Commercio", titolo: "Voucher digitalizzazione e sostenibilità PMI", copre: ["Carbon footprint", "Bilancio VSME"], intensita: "50% delle spese, fino a 10.000 €", scad: "30 set 2026" },
    { ente: "Regione Toscana", titolo: "Contributi per certificazioni e sistemi di gestione", copre: ["Manuale ISO 9001/14001"], intensita: "fino al 70% delle spese", scad: "15 nov 2026" },
    { ente: "Nazionale", titolo: "Fondo certificazione parità di genere", copre: ["Parità di genere PdR 125"], intensita: "contributo su certificazione e assistenza", scad: "a sportello" },
  ];
  return (
    <div className="vz-fade">
      <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.gray }}>
        <ArrowLeft size={15} /> Dashboard
      </button>
      <h1 className="vz-display text-2xl mb-1" style={{ color: C.ink }}>Bandi per la tua azienda</h1>
      <p className="text-sm mb-5" style={{ color: C.gray }}>Selezionati sul tuo profilo (meccanica di precisione · Toscana · 34 addetti). Aggiornati dall'AI e verificati dal team · ultimo aggiornamento: luglio 2026.</p>
      <div className="space-y-3">
        {bandi.map((b) => (
          <Card key={b.titolo} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs" style={{ color: C.gray }}>{b.ente}</p>
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{b.titolo}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {b.copre.map((c) => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full" style={{ background: C.moss, color: C.pine }}>copre: {c}</span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium" style={{ color: C.pine }}>{b.intensita}</p>
                <p className="text-xs mt-0.5" style={{ color: C.gray }}>scadenza: {b.scad}</p>
                <button className="text-xs mt-2 px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.pine, fontWeight: 500 }}>Testo ufficiale ↗</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs mt-4" style={{ color: C.grayLight }}>Schede di sintesi a scopo informativo: fanno fede esclusivamente i documenti ufficiali degli enti. Nessuna garanzia di ammissione.</p>
    </div>
  );
}

/* ------------- Corner con il consulente ------------- */

function Corner({ go }) {
  const [picked, setPicked] = useState(null);
  const giorni = [
    { g: "Mar 28 lug", slots: ["9:30", "11:00", "15:30"] },
    { g: "Gio 30 lug", slots: ["10:00", "14:30"] },
    { g: "Ven 31 lug", slots: ["9:00", "12:00", "16:00"] },
  ];
  return (
    <div className="vz-fade max-w-2xl">
      <button onClick={() => go("dashboard")} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.gray }}>
        <ArrowLeft size={15} /> Dashboard
      </button>
      <h1 className="vz-display text-2xl mb-1" style={{ color: C.ink }}>Prenota un corner</h1>
      <p className="text-sm mb-5" style={{ color: C.gray }}>Mezz'ora con un consulente del team, sulla tua pratica. Disponibilità pubblicate dall'ufficio.</p>
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: C.moss, color: C.pine }}>M</span>
          <div>
            <p className="text-sm font-medium" style={{ color: C.ink }}>Marco · team tecnico</p>
            <p className="text-xs" style={{ color: C.gray }}>Argomento: Bilancio VSME in corso</p>
          </div>
        </div>
        <div className="space-y-3">
          {giorni.map((d) => (
            <div key={d.g}>
              <p className="text-xs font-medium mb-1.5" style={{ color: C.gray }}>{d.g}</p>
              <div className="flex flex-wrap gap-2">
                {d.slots.map((o) => {
                  const id = d.g + o;
                  const sel = picked === id;
                  return (
                    <button key={id} onClick={() => setPicked(id)} className="text-sm px-3.5 py-2 rounded-lg" style={{ border: `1.5px solid ${sel ? C.pine : C.line}`, background: sel ? C.moss : C.white, color: sel ? C.pineDark : C.ink, fontWeight: sel ? 600 : 400 }}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <p className="text-xs" style={{ color: C.gray }}>Riceverai conferma e link videochiamata via email.</p>
          <button disabled={!picked} className="text-sm px-4 py-2 rounded-lg" style={{ background: picked ? C.pine : C.grayLight, color: C.white, fontWeight: 500 }}>
            Conferma il corner
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ------------- Shell ------------- */

export default function VerzeroDemo() {
  const [view, setView] = useState("home");
  const [service, setService] = useState(null);
  const nav = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "wizard", icon: Upload, label: "Raccolta dati" },
    { id: "catalogo", icon: FolderOpen, label: "Catalogo" },
    { id: "bandi", icon: Landmark, label: "Bandi" },
    { id: "corner", icon: CalendarDays, label: "Corner" },
    { id: "assistenza", icon: LifeBuoy, label: "Assistenza" },
  ];

  if (view === "home" || view === "dettaglio" || view === "checkout" || view === "attivazione") {
    return (
      <div className="vz-body min-h-screen pb-10" style={{ background: C.paper }}>
        {fontLink}
        {view === "home" && <Home choose={(s) => { setService(s); setView("dettaglio"); }} />}
        {view === "dettaglio" && <Dettaglio service={service} back={() => setView("home")} buy={() => setView("checkout")} />}
        {view === "checkout" && <Checkout service={service} back={() => setView("dettaglio")} pay={() => setView("attivazione")} />}
        {view === "attivazione" && <Attivazione enter={() => setView("dashboard")} />}
      </div>
    );
  }

  return (
    <div className="vz-body min-h-screen" style={{ background: C.paper }}>
      {fontLink}
      <div className="flex min-h-screen">
        <aside className="flex flex-col gap-1 p-3 w-14 md:w-52 shrink-0" style={{ background: C.white, borderRight: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2 px-2 py-3 mb-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center vz-display font-semibold" style={{ background: C.pine, color: C.white }}>0</span>
            <span className="vz-display text-lg hidden md:inline" style={{ color: C.ink }}>Ver0<span style={{ color: C.mint }}>.</span></span>
          </div>
          {nav.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left"
              style={{ background: view === n.id ? C.moss : "transparent", color: view === n.id ? C.pine : C.gray, fontWeight: view === n.id ? 600 : 400 }}>
              <n.icon size={17} /><span className="hidden md:inline">{n.label}</span>
            </button>
          ))}
          <button onClick={() => setView("home")} className="mt-auto flex items-center gap-2.5 px-3 py-2 text-xs" style={{ color: C.grayLight }}>
            <ArrowLeft size={14} /><span className="hidden md:inline">Torna al sito pubblico</span>
          </button>
        </aside>
        <main className="flex-1 min-w-0 p-4 md:p-8 max-w-5xl">
          {view === "dashboard" && <Dashboard go={setView} service={service} />}
          {view === "wizard" && <Wizard go={setView} />}
          {view === "catalogo" && <Catalogo go={setView} />}
          {view === "bandi" && <Bandi go={setView} />}
          {view === "corner" && <Corner go={setView} />}
          {view === "assistenza" && <Assistenza go={setView} />}
        </main>
        <button onClick={() => setView("assistenza")} aria-label="Apri assistenza"
          className="fixed bottom-5 right-5 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: C.pine, color: C.white, boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );
}
