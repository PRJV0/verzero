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

- **Prezzi**: fonte unica in `src/lib/pricing.ts`. Nessun prezzo scritto a mano
  nelle pagine, mai.
- **Catalogo**: fonte unica in `src/lib/catalog.ts`; aggiungere un servizio lì
  lo propaga a vetrina, pagina di dettaglio, funnel e sitemap.
- **Migrazioni Supabase**: la rete blocca il protocollo Postgres. Si applicano
  via Management API in HTTPS con `curl`, poi si registra la versione in
  `supabase_migrations.schema_migrations`. Mai `supabase db push`.
- **Etichette di catalogo**: solo fattuali (Novità, In arrivo, Spesso richiesto
  insieme a X, Premiante nei bandi). Mai diciture di domanda non verificabili.
- **«Zero effort»**: non si dichiara mai da solo, sempre con la definizione e,
  dove possibile, la quantificazione (SPEC §12.O).
