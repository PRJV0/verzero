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
10. **Si controlla in produzione**, non a occhio:
    `node scripts/controllo-indicizzabilita.mjs` interroga il sito con lo
    user agent dei crawler (Googlebot, Bingbot, OAI-SearchBot,
    Claude-SearchBot, PerplexityBot, GPTBot) e verifica per ogni URL
    della sitemap stato, `X-Robots-Tag`, meta robots e canonical — che
    deve combaciare con la riga di sitemap. Controlla anche che le aree
    transazionali siano davvero fuori indice e che nessuna pagina
    pubblica cada sotto un `Disallow`. Da rieseguire dopo ogni rilascio
    che tocchi metadati, `robots.ts`, `sitemap.ts` o il proxy: un
    `noindex` di troppo non si vede in pagina e non dà errore.

## Visibilità nelle risposte generate (AEO/GEO)

Vale insieme alla regola SEO, non al suo posto: un motore manda una
persona sulla pagina, un assistente legge la pagina e risponde al posto
suo. Cambia cosa deve fare il testo.

1. **Ogni affermazione regge da sola.** Una risposta che serve solo se si
   è letto il paragrafo sopra è inutilizzabile fuori dal sito. Soggetto
   esplicito (Verzero), oggetto per esteso (il percorso con il suo
   taglio), niente «questo servizio», «come visto», «il prezzo indicato».
   Il criterio: se la frase, ritagliata e incollata altrove, diventa
   ambigua, va riscritta.
2. **Le domande frequenti si compongono, non si scrivono.** Vivono in
   `src/lib/faq-servizio.ts` e nascono da catalogo e listino: quattordici
   testi scritti a mano, alla seconda revisione di prezzo, sono
   quattordici testi che mentono. Le stesse voci si mostrano in fondo
   alla pagina (`DomandeFrequenti`) e si marcano con `FAQPage`, carattere
   per carattere — mai una in più nel markup che in pagina.
3. **`robots.txt` distingue le famiglie** (`src/lib/ai-canali.ts`):
   crawler di ricerca e citazione, crawler di addestramento, tutti gli
   altri. Oggi sono tutti ammessi, con le stesse esclusioni
   (`/acquista/`, `/login`, `/dashboard`, `/api/`, `/auth/`): per un
   marchio nuovo la presenza nella conoscenza dei modelli vale più del
   controllo su un contenuto che è comunque pubblico. Aggiungere un
   agente significa aggiungerlo lì, non scrivere una riga nel file.
4. **Una sola entità.** Nome (`Verzero`) e descrizione (`SITO.descrizione`)
   sono identici in sito, dati strutturati, `llms.txt` e — quando
   esisteranno — profili esterni. `sameAs` resta vuoto finché i profili
   non esistono: un URL dichiarato e assente è peggio del silenzio.
   `@id` condiviso fra `Organization`, `WebSite` e `provider` dei
   servizi, altrimenti il grafo ha tre nodi al posto di uno.
5. **`llms.txt` è un segnale complementare**, generato dalle stesse fonti
   di sitemap e catalogo. Nessuna aspettativa di effetto: se la
   convenzione muore, il file si cancella e non lascia debiti. Non può
   contenere nulla che il sito non dica già — in particolare nessuna
   mappatura operativa (v. «metodo sì, mappature no»).
6. **Si misura.** `arrivo_ai` (referrer, lo manda il browser) e
   `crawler_ai` (user agent, lo scrive il server dopo la risposta) sono
   due eventi distinti: una scansione non è una visita, e sommarle
   significa credere di avere traffico.

Prove: `node --import ./scripts/risolutore-ts.mjs scripts/test-aeo.mjs`.

## Altre regole già in vigore

- **Movimento**: fonte unica in `src/app/globals.css` (token `--vz-micro`
  150ms, `--vz-stato` 250ms, `--vz-ingresso` 400ms, `--vz-scaglione` 70ms,
  `--vz-curva`). Mai durate o curve scritte a mano in un componente, mai
  `@keyframes` sparsi nei file: si aggiunge al sistema e si motiva. Ogni
  regola che nasconde contenuto sta dentro
  `@media (prefers-reduced-motion: no-preference)` — senza quella
  protezione un'animazione diventa contenuto mancante. Si animano solo
  `opacity` e `transform`. Dettagli e criteri in `SPEC.md` §12.X.
  Le comparse allo scroll hanno **una sola implementazione**, in
  `src/lib/reveal.ts`: chi ne serve una nuova la chiama, non la
  riscrive — due copie diventano due tarature diverse alla prima
  modifica. E disattivare la narrazione su schermo stretto non deve mai
  disattivare anche la comparsa (SPEC §12.O).
- **`overflow-hidden` uccide il palco.** Un antenato che ritaglia annulla
  il `position: sticky` dei discendenti E rende inerte una
  scroll-timeline, perché diventa lui il contenitore di scorrimento — e
  non scorre. Non dà errore: la sezione smette semplicemente di
  ancorarsi e le fasi restano ferme. Ci è già costato due sessioni. Chi
  deve ritagliare lo faccia sull'elemento che ritaglia (la filigrana, il
  nastro), mai sulla sezione che contiene una narrazione.
- **Adattare, non degradare**. Quando desktop e mobile hanno vincoli
  diversi si adatta la PRESENTAZIONE, non si abbassa il desktop al
  livello del mobile: un contenuto solo, due rese. Il caso di scuola è
  lo Zero in home — sul largo la narrazione allo scorrimento, sullo
  stretto il nastro che scorre da sé — con le declinazioni prese dalla
  stessa fonte (`src/lib/zeri.ts`). Non è la duplicazione che la regola
  del movimento vieta: lì si parlava di due implementazioni dello STESSO
  comportamento, qui di due comportamenti voluti. Tre condizioni, tutte
  obbligatorie: (1) il contenuto resta uno, e viene da una fonte sola;
  (2) la scelta la fa il CSS, così entrambe stanno nel markup e
  `display: none` toglie quella inattiva anche dall'albero di
  accessibilità e ne ferma le animazioni — niente scelte dopo
  l'idratazione, che producono sfarfallio; (3) il passaggio da una resa
  all'altra al ridimensionamento non lascia stati incoerenti: mai due
  rese insieme, mai contenuto rimasto invisibile, mai lo stesso testo
  letto due volte.
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
- **Ogni pagina fa un mestiere solo.** Il catalogo contiene i servizi, il
  prezzo, cosa tratta ciascuno e il modo di scegliere; il contesto — le
  norme, il perché te lo chiedono — vive in `/guide`, fuori dal menu e
  raggiungibile dal footer e da un rimando contestuale per pagina. Un
  contenuto corretto nel posto sbagliato costa comunque: allunga la
  strada verso quello che il lettore era venuto a fare.
- **Le designazioni di norma si verificano su UNI, sempre.** Ogni
  designazione citata nel sito, nel catalogo (`src/lib/catalog.ts`) o nei
  documenti generati (`src/lib/bozza.ts`) va controllata su
  **store.uni.com** PRIMA della pubblicazione: è quella l'autorità sulla
  designazione italiana, non il sito ISO e tanto meno un articolo che la
  riassume. Le norme vengono ritirate e sostituite in silenzio — nel
  2024 l'aggiornamento sul clima ha toccato tutte quelle sui sistemi di
  gestione, e la ISO 14001 ha cambiato edizione ad aprile 2026: una
  designazione superata su un sito che vende conformità è la peggiore
  figura possibile, e non dà errore da nessuna parte. Il caso più grave
  è il generatore di bozze, dove la stringa finisce dentro il documento
  che il cliente porta all'audit.
  Il controllo è automatico e non facoltativo:
  `node scripts/controllo-norme.mjs` estrae ogni designazione dal codice
  e dai documenti e la confronta con il registro verificato in testa allo
  script; fallisce su una designazione **sconosciuta** — così una norma
  nuova non entra in pagina senza passare da una verifica — e su una
  **ritirata usata come valida**. Citare una designazione ritirata è
  ammesso solo per dire che è ritirata, e il controllo lo riconosce dalla
  parola «ritirat» sulla stessa riga.
  **Ricontrollo periodico**: `node scripts/controllo-norme.mjs --online`
  rilegge lo stato dal catalogo UNI e segnala le norme ritirate dopo
  l'ultima verifica. Da eseguire ogni pochi mesi e prima di ogni
  revisione dei contenuti normativi — non a ogni build, perché interroga
  un sito terzo. La data dell'ultima verifica sta nel registro.
- **Fatti con la fonte, o niente fatti.** Ogni affermazione su norme,
  obblighi o numeri di mercato pubblicata sul sito porta il riferimento
  per esteso (numero, data, articolo o paragrafo) e un link alla fonte
  UFFICIALE — EUR-Lex, EBA, Commissione, l'ente che pubblica il dato —
  mai a un blog che riassume. Si verifica PRIMA di scrivere: se una
  fonte non regge, la riga si toglie invece di genericizzarla («le
  banche chiedono sempre più spesso dati ESG» senza riferimento è
  riempitivo, non informazione). Le fonti stanno in un file di dati con
  la data dell'ultima verifica (`src/lib/richieste.ts`), perché le norme
  cambiano — l'Omnibus del 2026 ne è la prova — e un riferimento
  sbagliato in pagina vale meno di una sezione assente. Se dopo la
  verifica restano meno di tre righe solide, la sezione si elimina.
- **Metodo sì, mappature no** (sito pubblico). Sulle pagine pubbliche si
  mostrano **il metodo e il risultato**, MAI le mappature operative
  documento → norma → sezione: quali documenti servono per il carbon,
  quali per la 9001, quale sezione alimenta ciascuno. Ammesso: come
  lavoriamo (tracciabilità delle fonti, validazione professionale,
  aggiornamento normativo), esempi **generici e non esaustivi**
  («documenti che hai già in azienda, come bollette o visure»), com'è
  fatto l'elaborato. Le norme si citano in modo generico («conforme alla
  norma di riferimento del percorso scelto»), non con l'elenco
  percorso-per-percorso. Le checklist precise vivono **nel portale**,
  dopo l'attivazione, costruite sul percorso del cliente: `documenti` in
  `src/lib/catalog.ts` è dato di portale, non di vetrina. Criterio: se
  un'informazione permette di ricostruire come si assembla un percorso,
  non va in pagina.
- **Prezzi**: fonte unica in `src/lib/pricing.ts`. Nessun prezzo scritto a mano
  nelle pagine, mai. E **nessun confronto economico con il mercato**:
  non si affianca il nostro prezzo a quello di terzi, non si citano
  cifre altrui, non si esprimono giudizi — diretti o impliciti — sul
  lavoro dei consulenti. Si parla solo delle nostre caratteristiche.
- **Catalogo**: fonte unica in `src/lib/catalog.ts`; aggiungere un servizio lì
  lo propaga a vetrina, pagina di dettaglio, funnel e sitemap. Ogni voce
  dichiara anche il **momento** del ciclo a cui risponde (partenza,
  aggiornamento, verifica, mantenimento), le **norme** che tocca (chiavi
  di `NORME` in `src/lib/norme.ts`) e gli **ambiti**. Non è
  decorazione: è ciò che collega fra loro i percorsi che parlano della
  stessa cosa — chi cerca «9001» deve trovare il manuale, il suo
  aggiornamento e il supporto all'audit, non solo quello che ha la
  cifra nel titolo. `momento` e `ambiti` sono obbligatori proprio
  perché un percorso che non li dichiara sparirebbe in silenzio dai
  risultati correlati invece di dare errore; il controllo è in
  `scripts/test-orientatore.mjs`.
- **DNS della posta**: l'SPF della radice è quello dell'hosting e **non va
  toccato**. Resend spedisce con Return-Path su `send.verzero.it` e allinea
  DMARC via DKIM (`d=verzero.it`): aggiungere Resend all'SPF della radice non
  serve e brucia uno dei dieci lookup. Dettagli in `SPEC.md` §12.A.1.
- **Migrazioni Supabase**: la rete blocca il protocollo Postgres. Si applicano
  via Management API in HTTPS con `curl`, poi si registra la versione in
  `supabase_migrations.schema_migrations`. Mai `supabase db push`.
- **Etichette di catalogo**: solo fattuali (Novità, In arrivo, Spesso richiesto
  insieme a X, Premiante nei bandi). Mai diciture di domanda non verificabili.
- **Il lessico si controlla da solo.** `node scripts/controllo-lessico.mjs`
  gira PRIMA della build (`prebuild`) e la ferma se rientra una parola
  vietata. Oggi ne sorveglia una: i professionisti **validano /
  convalidano / analizzano**, MAI «firmano» (SPEC §12.O — la firma
  implica un'assunzione di responsabilità professionale e
  un'asseverazione che non fanno parte del servizio). La regola era già
  stata violata due volte, la seconda da un titolo che suonava bene: una
  regola che vive solo in un documento rientra alla terza riscrittura.
  Gli usi legittimi della parola — la firma di un'email, il foglio firma
  che è un tipo di documento del cliente, la firma DKIM — stanno in un
  elenco chiuso dentro lo script, e ci si aggiungono consapevolmente.
  I commenti non si controllano: lì il divieto si deve poter spiegare.
- **«Zero effort»**: non si dichiara mai da solo, sempre con la definizione.
  VIETATE le quantificazioni di tempo o impegno del cliente («un'ora del tuo
  tempo» e simili): ogni numero promesso è un ostaggio (SPEC §12.O).
- **Il marchio si compone, non si ridisegna.** Un solo componente
  (`src/components/brand/marchio.tsx`) con due varianti: SEMPLICE (il
  logotipo da solo — intestazione, portale) ed ESTESA (logotipo senza lo
  zero finale, payoff in maiuscolo spaziato della stessa larghezza, e un
  solo zero grande che chiude le due righe — footer, materiali
  scaricabili, anteprima social). Le proporzioni stanno in
  `src/lib/marchio.ts` e sono MISURATE, non disegnate: chi ne cambia una
  fa fallire `scripts/test-marchio.mjs`. Regole che il codice fa
  rispettare da sé: tratto dello zero identico a quello del logotipo (non
  si scala con l'ellisse), area di rispetto pari alla larghezza dello
  zero, e sotto `LOCKUP.minimaPx` la variante estesa ripiega da sola su
  quella semplice — un payoff illeggibile non è un marchio più piccolo.
  I file in `public/brand/marchio-esteso*.svg` NON si toccano a mano: si
  rigenerano con `scripts/esporta-marchio.mjs`, e
  `--controlla` fallisce se sono rimasti indietro rispetto al codice.
  **Un secondo lockup dentro la pagina è quasi sempre di troppo**: il
  footer lo porta su ogni pagina, quindi in fondo a una pagina
  istituzionale se ne vedrebbero due nella stessa schermata.
- **Payoff di marca**: `A norma in tempo zero`, fonte unica in
  `SITO.payoff` (`src/lib/seo.ts`). Una forma sola, mai riscritta:
  accompagna il logotipo nel footer, chiude il titolo del sito
  (`Verzero — A norma in tempo zero`), è lo `slogan` di
  `Organization` e firma le email al cliente. Chi lo scrive a mano
  invece di leggerlo dalla costante fa fallire `scripts/test-aeo.mjs`,
  che cerca le varianti vicine in tutto `src/` — compresa la forma
  ritirata di prima e le versioni con la punteggiatura che il payoff non
  ha. Niente virgole dentro, niente punto in fondo, e `zero` minuscolo:
  lì è l'aggettivo di «tempo», non il nome della cosa.
  **Che cosa significa «in tempo Zero»**: è lo Zero del sistema di
  marca — il tempo che ci mette il CLIENTE, «bastano i documenti che
  hai già» — e NON un termine di consegna. La regola contro le
  quantificazioni di tempo resta in vigore anche per il payoff: nessun
  testo può appoggiarsi a quelle tre parole per promettere una data.
  Nel sottotitolo dell'hero «Zero» porta il peso e il colore
  dell'accento del sistema (semibold in menta viva, come `NastroZero`),
  e «in tempo Zero» non va mai spezzato a capo: «Zero» da solo su una
  riga torna a essere un numero.
