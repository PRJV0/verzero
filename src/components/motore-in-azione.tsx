import {
  Building2,
  ChevronDown,
  Database,
  FileCheck2,
  FileText,
  Globe,
  Layers,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

/**
 * IL SISTEMA, non un caso.
 *
 * La versione precedente raccontava un solo documento — l'inventario GHG
 * — riga per riga: bella scena, argomento sbagliato. Chi guarda deve
 * capire il MECCANISMO in tre secondi: cosa entra, chi lavora, cosa esce.
 * Quindi infografica, non racconto: tre colonne, poche parole, e sotto
 * l'unico argomento che vende davvero — quando apri il portale il
 * documento non è vuoto.
 *
 * ONESTÀ SUI DATI: qui non compare nessuna impresa vera. L'esempio è
 * un'azienda inventata e lo dice in pagina (regola in CLAUDE.md): un
 * nome reale in una vetrina è un dato personale pubblicato senza base
 * giuridica, e nemmeno il nome più innocuo fa eccezione.
 *
 * NOMENCLATURA: il motore si nomina per esteso e si dichiara PROPRIETARIO
 * e specializzato, perché è quello il perimetro — non un assistente
 * generalista con un prompt sopra.
 */

/** L'impresa d'esempio del sito: inventata, e dichiarata tale. */
export const IMPRESA_ESEMPIO = {
  nome: "Officina Lombardi S.r.l.",
  /* Formato plausibile ma volutamente NON valido: undici cifre con una
     lettera in mezzo. Una partita IVA formalmente corretta potrebbe
     appartenere a qualcuno per caso. */
  piva: "IT 0499X881207",
} as const;

/* (a) COSA ENTRA — le tre provenienze, dette dal punto di vista di chi legge. */
const FONTI = [
  {
    icona: FileText,
    titolo: "I documenti che hai già",
    testo: "Bollette, visure, cedolini, certificati: quelli nel tuo archivio.",
  },
  {
    icona: Database,
    titolo: "Le banche dati ufficiali",
    testo: "Le interroghiamo noi, sul mandato che ci dai all'attivazione.",
  },
  {
    icona: Globe,
    titolo: "Il tuo sito e i dati pubblici",
    testo: "Come descrivi la tua attività, e ciò che di te è già pubblico.",
  },
];

/* (b) CHI LAVORA — le tre funzioni del motore. */
const FUNZIONI = [
  { icona: ScanLine, titolo: "Legge e comprende", testo: "Estrae i dati dai tuoi documenti." },
  { icona: Layers, titolo: "Incrocia e verifica", testo: "Confronta le fonti e segnala ciò che non torna." },
  { icona: FileCheck2, titolo: "Compone secondo norma", testo: "Scrive il documento nella struttura che lo standard richiede." },
];

/* (c) COSA ESCE — più percorsi, ognuno con la sua norma citata. */
const ESITI = [
  { nome: "Carbon Footprint di Organizzazione", norma: "UNI EN ISO 14064-1:2019" },
  { nome: "Bilancio di Sostenibilità", norma: "standard VSME (EFRAG)" },
  { nome: "Manuali dei sistemi di gestione", norma: "UNI EN ISO 9001, 14001, 45001" },
  { nome: "Sistema per la parità di genere", norma: "UNI/PdR 125:2022" },
];

/** L'anello della scena finale: quasi pieno, con la fetta che manca. */
function AnelloEsempio({ percentuale = 68 }: { percentuale?: number }) {
  const totale = 8;
  const piene = Math.round((percentuale / 100) * totale);
  const R = 40;
  const punto = (g: number) => [
    50 + R * Math.cos((g * Math.PI) / 180),
    50 + R * Math.sin((g * Math.PI) / 180),
  ];
  const spazio = 6;
  const ampiezza = 360 / totale - spazio;
  const arco = (i: number) => {
    const da = -90 + i * (ampiezza + spazio) + spazio / 2;
    const a = da + ampiezza;
    const [x1, y1] = punto(da);
    const [x2, y2] = punto(a);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Esempio: documento composto al ${percentuale} per cento`}
      className="h-32 w-32 shrink-0 md:h-40 md:w-40"
    >
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="#2FCF9A"
        strokeOpacity="0.25"
        strokeWidth="1.4"
        strokeDasharray="0.1 6.4"
        strokeLinecap="round"
      />
      {Array.from({ length: totale }, (_, i) => (
        <path
          key={i}
          className="vz-arco"
          style={{ "--vz-i": i } as React.CSSProperties}
          d={arco(i)}
          fill="none"
          stroke={i < piene ? "#2FCF9A" : "#F7ECD9"}
          strokeOpacity={i < piene ? 1 : 0.85}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      <text
        x="50"
        y="49"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "23px",
          fontVariantNumeric: "tabular-nums",
        }}
        fill="#FFFFFF"
      >
        {percentuale}%
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        style={{ fontSize: "7px", letterSpacing: "1px" }}
        fill="#2FCF9A"
      >
        GIÀ COMPOSTO
      </text>
    </svg>
  );
}

/**
 * IL LIVELLO DI PROFONDITÀ, che si apre solo dove serve.
 *
 * In home lo schema resta muto: lì si vende il risultato. In
 * /come-funziona ogni blocco si può aprire e raccontare il METODO —
 * cosa leggiamo, con che mandato, come componiamo, chi valida, come
 * resta tracciata la provenienza.
 *
 * VINCOLO: si spiega il metodo, MAI le regole interne di estrazione. La
 * differenza è netta e va tenuta: «leggiamo i campi che servono dalla
 * bolletta» si dice; quali indizi usiamo per riconoscerli, no. Il primo
 * è fiducia, il secondo è know-how regalato.
 */
const DETTAGLI: Record<string, { titolo: string; punti: string[] }> = {
  entra: {
    titolo: "Cosa leggiamo, e con che mandato",
    punti: [
      "Dai tuoi documenti prendiamo i campi che servono al percorso — consumi, periodi, quantità, ruoli — e ognuno resta legato al file da cui viene.",
      "Le banche dati ufficiali le interroghiamo NOI, sul mandato che ci dai al momento dell'attivazione: VIES per la partita IVA europea, Registro Imprese per i dati camerali, ATECO per la classificazione, ACCREDIA per le certificazioni che già possiedi.",
      "Il mandato è revocabile in qualunque momento dalle Impostazioni: alla revoca la piattaforma continua a funzionare con l'inserimento manuale.",
      "Dal tuo sito leggiamo solo il tuo sito, rispettando le regole che pubblica per i programmi automatici. Mai aggregatori commerciali di terze parti: i loro termini quasi sempre lo vietano.",
    ],
  },
  motore: {
    titolo: "Come compone secondo norma",
    punti: [
      "La struttura non è «ispirata» allo standard: è quella che lo standard richiede, sezione per sezione, con i punti della norma nell'ordine in cui la norma li chiede.",
      "Dove due fonti dicono cose diverse il Motore non sceglie da solo: segnala la discordanza e la porta alla tua conferma.",
      "Quando un dato manca e si può stimare, la stima è dichiarata come tale nel documento — mai spacciata per misura.",
      "Un professionista del team tecnico controlla perimetro, fattori e completezza prima della consegna, e mette per iscritto i rilievi: la responsabilità resta di una persona.",
    ],
  },
  esce: {
    titolo: "Come resta tracciata la provenienza",
    punti: [
      "Ogni valore nel documento porta con sé la sua origine: quale documento, quale banca dati, quale calcolo.",
      "Nel portale ogni campo mostra un badge di provenienza — inserito da te, recuperato da noi, in attesa — e i dati recuperati restano «da confermare» finché non li validi.",
      "Un dato che rifiuti non entra in nessun documento, e non te lo riproponiamo.",
      "I documenti sono di parte prima: l'eventuale verifica di terza parte è un percorso successivo, con organismi accreditati. Non la vendiamo come inclusa.",
    ],
  },
};

/** Il blocco che si apre: nativo, quindi accessibile da tastiera. */
function Dettaglio({ chiave }: { chiave: keyof typeof DETTAGLI }) {
  const d = DETTAGLI[chiave];
  return (
    <details className="group mt-2 rounded-xl border border-white/12 bg-white/[0.03]">
      <summary className="vz-interattivo flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-mint-bright">
        {d.titolo}
        <ChevronDown
          size={15}
          aria-hidden
          className="shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="space-y-2 px-4 pb-4 pt-1">
        {d.punti.map((punto) => (
          <li
            key={punto}
            className="flex gap-2 text-xs leading-relaxed text-moss/75"
          >
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-mint-bright/70" />
            {punto}
          </li>
        ))}
      </ul>
    </details>
  );
}

function Colonna({
  occhiello,
  children,
}: {
  occhiello: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-mint-bright/70">
        {occhiello}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function MotoreInAzione({ dettaglio = false }: { dettaglio?: boolean }) {
  return (
    <div className="vz-anello-vivo mx-auto max-w-5xl text-left">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_1.15fr_1fr]">
        {/* (a) COSA ENTRA */}
        <Colonna occhiello="Cosa entra">
          {FONTI.map(({ icona: Icona, titolo, testo }) => (
            <div
              key={titolo}
              className="flex gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3"
            >
              <Icona size={17} className="mt-0.5 shrink-0 text-moss" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{titolo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-moss/70">
                  {testo}
                </p>
              </div>
            </div>
          ))}
          {dettaglio && <Dettaglio chiave="entra" />}
        </Colonna>

        {/* (b) CHI LAVORA — dominante, e nominato per esteso. */}
        <div className="relative min-w-0 rounded-2xl border-2 border-mint-bright/35 bg-mint-bright/[0.07] p-5 sm:p-6">
          <span
            aria-hidden
            className="vz-motore-glow pointer-events-none absolute inset-0 rounded-2xl"
          />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mint-bright">
              Il motore
            </p>
            <p className="mt-1 font-display text-2xl leading-tight text-white md:text-3xl">
              AI Ver0
            </p>
            <p className="mt-1 text-xs font-medium text-mint-bright">
              Proprietaria e specializzata sui documenti d&apos;impresa
            </p>
            <div className="mt-4 space-y-2">
              {FUNZIONI.map(({ icona: Icona, titolo, testo }) => (
                <div
                  key={titolo}
                  className="flex gap-3 rounded-xl bg-pine-deep/50 px-4 py-3"
                >
                  <Icona
                    size={17}
                    className="mt-0.5 shrink-0 text-mint-bright"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{titolo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-moss/70">
                      {testo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-moss/70">
              <ShieldCheck
                size={14}
                className="mt-0.5 shrink-0 text-mint-bright"
                aria-hidden
              />
              Un professionista valida prima della consegna: la responsabilità
              resta di una persona.
            </p>
            {dettaglio && <Dettaglio chiave="motore" />}
          </div>
        </div>

        {/* (c) COSA ESCE — più percorsi, ognuno con la norma citata. */}
        <Colonna occhiello="Cosa esce">
          {ESITI.map((e) => (
            <div
              key={e.nome}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3"
            >
              <p className="text-sm font-semibold text-white">{e.nome}</p>
              <p className="mt-0.5 text-[11px] font-medium text-mint-bright">
                {e.norma}
              </p>
            </div>
          ))}
          <p className="px-1 pt-1 text-[11px] leading-relaxed text-moss/60">
            Solo standard ufficiali: nessuna certificazione inventata da noi.
          </p>
          {dettaglio && <Dettaglio chiave="esce" />}
        </Colonna>
      </div>

      {/* (d) LA SCENA FINALE — l'argomento vero. */}
      <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl border border-white/12 bg-white/[0.04] p-6 sm:flex-row sm:gap-8">
        <AnelloEsempio />
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mint-bright/70">
            Il primo accesso
          </p>
          <p className="mt-1.5 font-display text-2xl leading-tight text-white md:text-3xl">
            Entri nel portale e il documento è già composto.
          </p>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-moss/75">
            Non una pagina bianca da riempire: le sezioni che si possono
            comporre dai dati recuperati sono già scritte, con la fonte
            accanto a ogni dato.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-soft/90 px-3 py-1.5 text-[11px] font-semibold text-amber-ink">
            <Building2 size={13} aria-hidden />
            La parte chiara dell&apos;anello è quello che serve da te
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-moss/55">
            Esempio su un&apos;impresa inventata ({IMPRESA_ESEMPIO.nome}): la
            quota già composta dipende dai documenti che hai e dalle banche
            dati che ti riguardano.
          </p>
        </div>
      </div>
    </div>
  );
}
