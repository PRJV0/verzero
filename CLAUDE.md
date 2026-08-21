# Ver0 — istruzioni di progetto

Documento vincolante per chi lavora su questo repository. La specifica di
prodotto vive in `SPEC.md`: qui stanno solo le regole che valgono **sempre**,
in ogni sessione, senza bisogno che vengano richieste di nuovo.

## Regola SEO permanente

Vale per ogni pagina nuova e per ogni pagina modificata. Le utilità stanno in
`src/lib/seo.ts` e vanno usate invece di scrivere metadati a mano.

1. **Title unico** (~55 caratteri) e **meta description unica** (~155),
   entrambi scritti per una persona che legge un risultato di ricerca, non
   per riempire un campo. Il marchio lo aggiunge il template del layout: le
   pagine dichiarano solo la propria parte.
2. **Un solo `<h1>` per pagina**, con gerarchia `h2`/`h3` coerente sotto: mai
   saltare un livello per ragioni estetiche.
3. **URL parlanti** e `canonical` dichiarato (lo fa `metadataPagina`).
4. **Open Graph e Twitter card** su ogni pagina pubblica.
5. **JSON-LD dove pertinente**: `Organization` in home, `Service` con `Offer`
   nelle pagine servizio, `FAQPage` dove ci sono domande **davvero presenti in
   pagina**, `BreadcrumbList` sulle pagine interne. Il markup descrive solo
   contenuto visibile: dichiarare cose non mostrate viola le linee guida.
6. **Alt descrittivi** su ogni immagine che porta significato; `alt=""` solo
   se davvero decorativa (e allora anche `aria-hidden`).
7. **Link interni** verso le pagine correlate (servizio ↔ Sigillo ↔ chi siamo
   ↔ contatti): ogni pagina deve avere una via d'uscita sensata.
8. **Sitemap**: una pagina pubblica e indicizzabile entra in `src/app/sitemap.ts`.
   Le pagine transazionali (`/acquista`, `/login`, `/dashboard`) restano fuori
   da sitemap e indice — sono escluse anche in `src/app/robots.ts`.
9. **Core Web Vitals**: l'immagine sopra la piega usa `priority`, le altre
   restano `lazy`; i contenitori hanno rapporto d'aspetto fisso per non
   spostare il layout durante il caricamento.

## Altre regole già in vigore

- **Movimento**: fonte unica in `src/app/globals.css` (token `--vz-micro`
  150ms, `--vz-stato` 250ms, `--vz-ingresso` 400ms, `--vz-scaglione` 70ms,
  `--vz-curva`). Mai durate o curve scritte a mano in un componente, mai
  `@keyframes` sparsi nei file: si aggiunge al sistema e si motiva. Ogni
  regola che nasconde contenuto sta dentro
  `@media (prefers-reduced-motion: no-preference)` — senza quella
  protezione un'animazione diventa contenuto mancante. Si animano solo
  `opacity` e `transform`. Dettagli e criteri in `SPEC.md` §12.X.
- **Dati nelle pagine pubbliche**: nelle vetrine, nelle infografiche e in
  ogni grafica del sito pubblico si usano SOLO imprese dichiaratamente
  inventate (oggi «Officina Lombardi S.r.l.») con partita IVA e valori
  plausibili ma fittizi, e la parola «esempio» visibile accanto. Mai il
  nome di un'azienda reale — nemmeno come segnaposto, nemmeno se
  sembra innocuo — e mai un dato che venga dal database: le pagine
  pubbliche non leggono `organizations`, `company_fields`, `documents`
  né qualunque altra tabella di clienti. Un nome vero in una vetrina è
  un dato personale pubblicato senza base giuridica. UNICA ECCEZIONE:
  `/verifica/[codice]`, dove mostrare l'impresa È il servizio — chi
  espone la targa ha chiesto di poter essere controllato, e lì si
  mostra solo ciò che il Sigillo dichiara.
- **Trasparenza vs riservatezza** (pagina `/sicurezza` e ogni testo
  pubblico sul tema): si dichiarano le **garanzie**, mai
  l'implementazione. Ammesso: natura delle protezioni, dove vivono i
  dati, chi accede e con quale titolo, esistenza e oggetto dei test,
  revocabilità, tracciabilità. Vietato: struttura del database e nomi di
  tabelle, testo o logica delle politiche, modelli AI usati e relative
  istruzioni, schemi di estrazione, soglie e regole di riconoscimento,
  mappatura dei dati sulle sezioni, costi per pratica, versioni, percorsi
  e nomi di file. Criterio: se un'informazione permette a un concorrente
  di replicare il metodo o a un attaccante di orientarsi, non va in
  pagina. Gli approfondimenti tecnici (questionari fornitori, audit IT)
  si danno in un documento riservato su richiesta, non sul sito. E
  nessun claim non dimostrabile: mai «sicurezza di livello bancario»,
  mai un sigillo che non possediamo. I contenuti stanno in
  `src/lib/sicurezza.ts`, con la data delle verifiche.
- **Prezzi**: fonte unica in `src/lib/pricing.ts`. Nessun prezzo scritto a mano
  nelle pagine, mai.
- **Catalogo**: fonte unica in `src/lib/catalog.ts`; aggiungere un servizio lì
  lo propaga a vetrina, pagina di dettaglio, funnel e sitemap.
- **DNS della posta**: l'SPF della radice è quello dell'hosting e **non va
  toccato**. Resend spedisce con Return-Path su `send.verzero.it` e allinea
  DMARC via DKIM (`d=verzero.it`): aggiungere Resend all'SPF della radice non
  serve e brucia uno dei dieci lookup. Dettagli in `SPEC.md` §12.A.1.
- **Migrazioni Supabase**: la rete blocca il protocollo Postgres. Si applicano
  via Management API in HTTPS con `curl`, poi si registra la versione in
  `supabase_migrations.schema_migrations`. Mai `supabase db push`.
- **Etichette di catalogo**: solo fattuali (Novità, In arrivo, Spesso richiesto
  insieme a X, Premiante nei bandi). Mai diciture di domanda non verificabili.
- **«Zero effort»**: non si dichiara mai da solo, sempre con la definizione.
  VIETATE le quantificazioni di tempo o impegno del cliente («un'ora del tuo
  tempo» e simili): ogni numero promesso è un ostaggio (SPEC §12.O).
