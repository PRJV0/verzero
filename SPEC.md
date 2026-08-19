# Verzero — Specifica tecnica MVP
### Piattaforma digitale di sostenibilità ed energia per PMI
Versione 0.1 · luglio 2026 · documento di partenza per lo sviluppo con Claude Code

---

## 1. Visione e perimetro dell'MVP

MISSIONE: abbattere tempi e costi del sistema consulenziale italiano, partendo da settori specifici e allargandosi quando arrivano i numeri. L'AI è il motore di tutto.

Verzero accentra in un'unica piattaforma il maggior numero possibile di servizi consulenziali in ambito sostenibilità ed efficienza energetica, acquistabili in autonomia dal cliente finale — PMI e grandi aziende — ciascuno fruito nella propria area privata: carbon footprint di organizzazione, bilancio di sostenibilità VSME, diagnosi energetica, e nel tempo i sistemi di gestione (ISO 9001, 14001, UNI/PdR 125, 14064, 14067 e altri). Interfaccia semplice e pulita, prezzi sotto la media di mercato, massima automazione tramite AI: l'effort richiesto all'organizzazione è ridotto al minimo. Verzero si propone come piattaforma di riferimento della consulenza di nuova generazione: automazione AI e presidio umano integrati e ottimizzati — dietro lo schermo ci sono sempre persone che verificano le informazioni e rispondono. MESSAGGIO GUIDA (sintesi da cui discendono tutti i testi di sito e prodotto): "la piattaforma con i prezzi migliori del mercato che qualifica la tua azienda con l'effort più basso di sempre" — prezzo, qualifica, effort: ogni pagina deve far passare questi tre elementi. Posizionamento: Ver0 è un partner che QUALIFICA le imprese — attraverso i servizi le aziende ottengono vantaggi di reputazione, attendibilità e riconoscimento (verso banche, capofiliera, stazioni appaltanti), e questo messaggio deve essere percepibile fin dalla home del sito. Il principio guida dell'esperienza utente: **mai chiedere un dato che si può estrarre da un documento caricato**. Il cliente carica bollette e documenti, l'AI estrae i dati, il cliente verifica e conferma, la piattaforma genera i report.

**Perimetro MVP (fase 1-2):** un solo modulo completo end-to-end — il carbon footprint di organizzazione (Scope 1 e 2 completi, Scope 3 semplificato) — con multi-tenancy, upload documenti, estrazione AI, calcolo emissioni, dashboard e report PDF scaricabile.

**Fuori perimetro MVP (fasi successive):** modulo VSME, diagnosi energetica, CER, fatturazione Stripe, rete EGE convenzionati, portale amministratore.

**Utenti target dell'MVP:** 3-5 aziende pilota. Ogni azienda ha 1-3 utenti.

## 2. Stack tecnico

| Componente | Scelta | Motivazione |
|---|---|---|
| Frontend + backend | Next.js 15 (App Router, TypeScript) | Un solo framework per UI e API routes |
| UI | Tailwind CSS + componenti custom | Riuso del prototipo esistente (`verzero-prototipo.jsx`) |
| Database + Auth + Storage | Supabase (regione EU, Francoforte) | Postgres gestito, autenticazione, storage documenti, Row Level Security per il multi-tenant, residenza dati UE (requisito GDPR) |
| Motore AI | Claude API (modello `claude-sonnet-4-6`) | Estrazione dati da PDF bollette e generazione testi. Docs: https://docs.claude.com/en/api/overview |
| Grafici | Recharts | Già usato nel prototipo |
| Generazione PDF | @react-pdf/renderer (o Puppeteer su route server) | Report brandizzati scaricabili |
| Hosting | Vercel (funzioni in regione EU) | Deploy automatico da Git |
| Email transazionali | Resend | Invito utenti, notifiche report pronto |

Variabili d'ambiente richieste: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.

**Requisito trasversale di interfaccia:** web application responsive — piena fruibilita da desktop E da smartphone (mobile-first sui flussi chiave: upload documenti da fotocamera, conferma dati, consultazione dashboard e documenti). Nessuna app nativa nell'MVP.

## 3. Architettura e multi-tenancy

- Ogni azienda cliente è una `organization`. Ogni riga di ogni tabella dati porta `organization_id`.
- **Row Level Security (RLS) attiva su tutte le tabelle**: un utente vede solo i dati della propria organizzazione. Le policy RLS sono la barriera di sicurezza primaria; il codice applicativo è la seconda.
- I file caricati vanno in un bucket Supabase Storage privato, con path `{organization_id}/{document_id}.pdf` e policy di accesso allineate alla RLS.
- Le chiamate all'API Claude avvengono **solo lato server** (API routes / server actions): la chiave API non raggiunge mai il browser.
- Anno di rendicontazione come dimensione ovunque: tutti i dati di attività sono legati a `reporting_year`.

## 4. Modello dati (schema Postgres)

```sql
-- Identità e tenancy
organizations (
  id uuid pk, name text, vat_number text, ateco_code text,
  employees_count int, sector text, created_at timestamptz
)
profiles (           -- estende auth.users di Supabase
  id uuid pk references auth.users, full_name text,
  organization_id uuid references organizations, role text  -- 'owner' | 'member'
)

-- Moduli e attivazioni
modules ( id text pk, name text, description text )  -- 'carbon', 'vsme', 'audit'
module_activations (
  id uuid pk, organization_id uuid, module_id text,
  reporting_year int, status text,  -- 'active' | 'completed'
  activated_at timestamptz
)

-- Documenti e estrazioni
documents (
  id uuid pk, organization_id uuid, reporting_year int,
  kind text,          -- 'electricity_bill' | 'gas_bill' | 'fuel_invoice' | 'other'
  storage_path text, original_filename text,
  status text,        -- 'uploaded' | 'extracting' | 'extracted' | 'confirmed' | 'failed'
  uploaded_by uuid, created_at timestamptz
)
extractions (
  id uuid pk, document_id uuid, organization_id uuid,
  raw_json jsonb,     -- output integrale del modello
  model text, confidence text,  -- 'high' | 'medium' | 'low'
  created_at timestamptz
)

-- Dati di attività (una riga = un consumo confermato)
activity_data (
  id uuid pk, organization_id uuid, reporting_year int,
  scope int,          -- 1 | 2 | 3
  category text,      -- 'electricity' | 'natural_gas' | 'diesel' | 'petrol' | 'district_heating' | 'purchased_goods' | ...
  quantity numeric, unit text,   -- kWh, Smc, litri, km, €
  period_start date, period_end date,
  source_document_id uuid null,  -- null se inserito a mano
  supply_type text null,         -- per elettricità: 'go_renewable' | 'national_mix'
  confirmed_by uuid, created_at timestamptz
)

-- Fattori di emissione (tabella di sistema, non per-tenant)
emission_factors (
  id uuid pk, category text, unit text,
  factor_location numeric,   -- kgCO2e per unità (location-based)
  factor_market numeric null,
  source text, valid_year int   -- es. 'ISPRA 2025', 'DEFRA 2025'
)

-- Risultati e report
reports (
  id uuid pk, organization_id uuid, module_id text, reporting_year int,
  totals jsonb,       -- { scope1: n, scope2_location: n, scope2_market: n, scope3: n }
  storage_path text,  -- PDF generato
  generated_at timestamptz
)
```

Seed iniziale di `emission_factors`: elettricità mix nazionale Italia (fonte ISPRA, ultimo anno disponibile), gas naturale (Smc), gasolio e benzina (litri), GPL, teleriscaldamento. Nel codice il fattore non è mai hardcodato: si legge sempre da questa tabella, così l'aggiornamento annuale dei fattori non richiede deploy.

## 5. Flussi utente dell'MVP

**Flusso di acquisto e onboarding.** Sito pubblico → pagina di dettaglio del servizio → checkout (dati di fatturazione con P.IVA, scelta mensile/annuale anticipato, accettazione termini con autorizzazione alle banche dati, pagamento) → SOLO a pagamento avvenuto: creazione dell'area riservata, interrogazione delle banche dati e precompilazione (anagrafica, ATECO, addetti, dati economici) → scelta anno di rendicontazione → dashboard con checklist delle categorie da coprire. REGOLA: nessuna chiamata a banche dati a pagamento prima dell'incasso; eventuali anteprime pre-acquisto usano solo fonti gratuite o a costo trascurabile. Ogni servizio del catalogo ha la propria pagina di dettaglio con descrizione, caratteristiche dell'output (conforme alla norma di riferimento) e ganci commerciali; questi contenuti vivono in tabelle gestibili senza deploy, come i prezzi.

**Raccolta dati (il cuore del prodotto).** Wizard per categoria: Azienda → Veicoli e carburanti → Energia elettrica → Gas naturale → Altre fonti (Scope 3 semplificato). Per ogni categoria due strade:
1. *Carica documento*: upload PDF/foto → stato `extracting` → il motore AI estrae i campi → form precompilato → l'utente verifica, corregge se serve, conferma → si crea la riga in `activity_data` con `source_document_id`.
2. *Inserisci a mano*: form vuoto per chi ha già i totali (es. da contabilità).
Durante l'inserimento, un pannello mostra l'impatto in tCO2e calcolato in tempo reale (il momento "wow" già validato nel prototipo).

**Dashboard.** La dashboard e COMPOSTA dai soli servizi attivi dell'organizzazione: ogni modulo ha il proprio spazio di lavoro con i propri passi e contenuti, e la vista generale li aggrega mostrando in evidenza il servizio acquistato con il prossimo passo da compiere; i moduli non attivi compaiono come disponibili (upsell), mai come contenuto vuoto. Metriche mostrate solo se pertinenti ai moduli attivi (es. tCO2e solo con carbon attivo), stato dei moduli, documenti recenti. Il completamento si calcola come percentuale di categorie confermate sul totale delle categorie applicabili all'azienda.

**Generazione report.** Quando tutte le categorie obbligatorie sono confermate → bottone "Genera report" → calcolo dei totali → PDF brandizzato con metodologia, tabelle per categoria, grafici, dichiarazione di conformità GHG Protocol / ISO 14064-1 → salvato in `reports` e scaricabile. Il report riporta sempre Scope 2 in doppia lettura: location-based e market-based.

## 6. Motore di estrazione documenti (Claude API)

Pipeline server-side per ogni documento caricato:
1. Route `POST /api/documents/{id}/extract`: scarica il PDF dallo storage, lo invia all'API Claude come documento (base64) con un prompt di estrazione specifico per `kind`.
2. Il prompt chiede **solo JSON** conforme a uno schema per tipo documento. Esempio per `electricity_bill`:

```
Sei un estrattore di dati da bollette elettriche italiane. Analizza il documento
e restituisci SOLO un oggetto JSON, senza testo aggiuntivo, con questo schema:
{
  "pod": string | null,
  "supplier": string | null,
  "period_start": "YYYY-MM-DD" | null,
  "period_end": "YYYY-MM-DD" | null,
  "total_kwh": number | null,
  "supply_type": "go_renewable" | "national_mix" | "unknown",
  "confidence": "high" | "medium" | "low",
  "notes": string | null
}
Regole: se un campo non è leggibile usa null, non inventare mai valori.
total_kwh è il consumo fatturato del periodo, non la potenza impegnata.
supply_type è "go_renewable" solo se la bolletta menziona esplicitamente
energia 100% rinnovabile o Garanzia d'Origine. In notes segnala anomalie
(conguagli, stime, più POD nello stesso documento).
```

3. Parsing difensivo della risposta (strip di eventuali backtick, `JSON.parse` in try/catch). Salvataggio integrale in `extractions.raw_json`.
4. Se `confidence` è `low` o campi chiave sono null → il form si apre con un avviso "verifica con attenzione" e i campi mancanti evidenziati. **L'utente conferma sempre**: nessun dato entra in `activity_data` senza conferma umana. Questo è anche il posizionamento legale del prodotto: l'AI assiste, il cliente valida.
5. Prompt analoghi per `gas_bill` (Smc, coefficiente C) e `fuel_invoice` (litri per carburante).

Costo stimato: pochi centesimi per documento. Prevedere un limite di dimensione upload (10 MB) e un contatore di estrazioni per organizzazione.

## 7. Motore di calcolo

- Per ogni riga di `activity_data`: `emissioni = quantity × fattore` (dalla tabella `emission_factors`, per anno e categoria; conversione unità dove serve).
- Scope 2 elettricità: location-based sempre con il fattore del mix nazionale; market-based = 0 se `supply_type = 'go_renewable'`, altrimenti fattore del residual mix.
- Totali per Scope e per categoria, salvati in `reports.totals` alla generazione. Tutti gli arrotondamenti solo in presentazione (una cifra decimale), mai nei dati.
- Ogni calcolo deve essere ricostruibile: il report elenca per ogni voce quantità, unità, fattore usato e fonte del fattore. La tracciabilità è ciò che rende il documento difendibile davanti a banche e auditor.

## 8. Sicurezza, GDPR e requisiti non funzionali

- Residenza dati UE (Supabase Francoforte, funzioni Vercel EU). DPA firmato con i sub-processor; informativa privacy e nomina a responsabile del trattamento verso i clienti (da predisporre con un legale prima dei clienti paganti).
- RLS su tutte le tabelle; storage privato; chiavi API solo server-side; rate limiting sulle route di estrazione.
- Cancellazione account = cancellazione effettiva di dati e documenti (diritto all'oblio).
- Log applicativi senza dati personali; backup automatici Supabase attivi.
- Lingua: solo italiano nell'MVP. Struttura testi pronta per i18n futura.

## 9. Piano di lavoro per fasi

| Fase | Contenuto | Criterio di completamento |
|---|---|---|
| 0. Setup | Repo, Next.js + Supabase + deploy Vercel, CI minima | "Hello world" autenticato online |
| 1. Fondamenta | Schema DB con RLS, onboarding organizzazione, inviti utenti | Due account di due org non vedono i dati altrui (test esplicito) |
| 2. Raccolta dati | Upload documenti, pipeline estrazione, form di conferma, inserimento manuale, pannello impatto live | Bolletta reale caricata → dato confermato in activity_data |
| 3. Dashboard + report | Dashboard con metriche reali, motore di calcolo, generazione PDF | Report PDF completo generato da dati reali |
| 4. Pilota | Seed fattori ISPRA/DEFRA aggiornati, onboarding 3-5 aziende pilota, raccolta feedback | Primo report consegnato a un'azienda vera |

Ordine di sviluppo consigliato dentro ogni fase: prima il percorso felice end-to-end, poi gli stati di errore, poi la rifinitura UI riprendendo lo stile del prototipo.

## 10. Istruzioni per Claude Code

Metti questo file nella radice del repository come `SPEC.md` insieme a `verzero-prototipo.jsx` (riferimento visivo per lo stile). Primo comando suggerito, dalla cartella vuota del progetto:

> Leggi SPEC.md. Inizializza il progetto della fase 0: Next.js 15 con TypeScript e Tailwind, client Supabase configurato, struttura cartelle per app router. Poi fermati e mostrami la struttura prima di procedere.

Procedi una fase alla volta e chiedi a Claude Code di scrivere test per la RLS (fase 1) e per il motore di calcolo (fase 3) prima di considerarle chiuse. A ogni sessione, fai aggiornare un file `PROGRESS.md` con lo stato, così ogni nuova sessione riparte dal punto giusto.

## 11. Modulo Sigillo "Ver0 — Impresa Certificata"

Marchio di certificazione della piattaforma, esposto dalle aziende che raggiungono i criteri. Riferimento grafico: `Sigillo-ver0.svg` (sigillo circolare, wordmark "Ver0" con foglia innestata sullo zero, arco "IMPRESA CERTIFICATA", millesimo). Va costruito in coerenza con la direttiva UE 2024/825: criteri pubblici, verifica, revocabilità.

**Scala MULTI-PERCORSO (un solo sigillo, più strade per meritarlo; criteri per percorso pubblici, mai a pagamento):**
- Livello 1 — "Percorso verificato": si ottiene completando ALMENO UN percorso qualificante con validazione del team tecnico. Percorsi qualificanti (elenco estendibile, criteri pubblici per ciascuno): carbon footprint con categorie obbligatorie confermate; bilancio VSME completo e validato; sistema di gestione ISO (famiglia A) completato; fascicolo UNI/PdR 125 pronto per l'audit; check-up energetico con monitoraggio attivo. Il sigillo e unico ("Impresa Ver0" millesimato); la dicitura sotto il wordmark varia per ambito (es. "dati verificati - carbon", "sistema completo - qualita", "percorso verificato - parita"); la pagina pubblica di verifica elenca QUALI ambiti sono verificati e da quando. Piu percorsi = piu ambiti sulla stessa pagina, mai sigilli multipli.
- Livello 2 — "Risultato dimostrato" (sigillo pieno): livello 1 + risultato misurato nel proprio ambito: emissioni in calo a parita di perimetro (carbon); certificazione di terza parte conseguita da organismo accreditato (ISO / PdR 125); KPI di parita migliorati anno su anno; risparmi energetici realizzati e misurati. Premia il fatto, non il documento.
Estensione dati: `certifications` acquisisce i campi `pathway` (percorso che ha generato il livello) e la pagina pubblica espone l'elenco dei pathway verificati con date.

**Estensione del modello dati:**
```sql
certifications (
  id uuid pk, organization_id uuid, reporting_year int,
  level int,                -- 1 | 2
  status text,              -- 'active' | 'expired' | 'revoked'
  public_slug text unique,  -- per l'URL pubblico
  issued_at timestamptz, expires_at timestamptz,  -- 12 mesi dall'emissione
  revoked_reason text null
)
```

**Funzionalità:**
- Assegnazione automatica alla generazione del report se i criteri sono soddisfatti; scadenza a 12 mesi; passaggio a `expired` via job pianificato. Revoca manuale da ruolo amministratore piattaforma con motivazione obbligatoria.
- Pagina pubblica `/verifica/{public_slug}` senza login: ragione sociale, P.IVA, settore, livello e anno, emissioni totali, metodologia, data di verifica e scadenza, link a criteri pubblici, registro delle imprese certificate e canale di segnalazione usi impropri. Nessun altro dato oltre a questi (privacy by design).
- Kit grafico scaricabile per l'azienda certificata: SVG/PNG del sigillo millesimato con QR code che punta alla pagina di verifica, in versione colore e monocromatica.
- Registro pubblico `/registro`: elenco consultabile delle certificazioni attive.

Collocazione nel piano: la tabella e l'assegnazione automatica entrano in fase 3 (insieme alla generazione report); pagina pubblica, kit grafico e registro in fase 4. Nota legale (fuori dal codice): deposito del marchio di certificazione UE presso EUIPO con regolamento d'uso, e deposito del marchio denominativo "Verzero" e figurativo "Ver0".

**11.X — IDENTITA DEL SIGILLO (rev. minimal, CONGELATA — prevale su ogni descrizione precedente del marchio).**
- Nome: "Sigillo Ver0" (mai piu "bollino" in alcuna comunicazione); lo status dell'impresa resta "Impresa Ver0". Claim: "Il Sigillo non si compra. Si dimostra."
- Zero canonico E1: cifra zero geometrica monolinea (ellisse, nessuna foglia, nessun riempimento). REGOLA: e lo STESSO identico zero del logotipo Ver0 — un solo zero canonico in tutto il brand.
- Composizione del sigillo: placca circolare bianca + anello punteggiato + zero canonico centrale + millesimo (anno). Eliminati: foglia, arco "Impresa certificata", diciture d'ambito, riempimenti.
- Sistema dei segmenti (C3): ogni percorso verificato riempie un segmento pieno dell'anello punteggiato; piu percorsi = anello che si chiude progressivamente. Il sigillo "vuoto" (senza segmenti) e il marchio istituzionale di Verzero.
- Verificabilita a due livelli: il SIGILLO e il marchio puro (sul web e cliccabile verso la pagina pubblica di verifica); la TARGA DI VERIFICA e il formato composto per carta/PDF/adesivi: sigillo + QR univoco + codice (es. VER0-2026-00001) + "Verifica su verzero.it/verifica". Il QR non va MAI inciso dentro il sigillo.
- Fondo scuro: sigillo tono-su-tono in bianco con segmento menta acceso (#2FCF9A); su superfici stampate sempre la placca bianca. Wordmark bianco integrale su scuro.
- File di riferimento nel repository: logo-ver0.svg, sigillo-ver0.svg (base), sigillo-ver0-segmenti.svg (esempio 2 percorsi), targa-verifica-ver0.svg.

## 12. Listino, piani e regole di prezzo

Prezzi in canone mensile ricorrente, IVA esclusa, riferiti ad aziende fino a 50 dipendenti. I prezzi NON vanno hardcodati: vivono in una tabella `price_plans` gestibile senza deploy.

| Codice | Voce | Canone mensile |
|---|---|---|
| PLT | Canone piattaforma (obbligatorio) | 49 € |
| CF-B | Carbon footprint Base (Scope 1+2) | 89 € |
| CF-P | Carbon footprint Plus (Scope 3 + piano riduzione) | 199 € |
| VS-B | Bilancio VSME Base | 129 € |
| VS-P | Bilancio VSME Plus (con revisione umana) | 349 € |
| EC | Rating economia circolare | 129 € |
| SET | Pacchetto settore | 39 € |
| BUNDLE | Percorso Ver0 = PLT + CF-B + VS-B | 199 € (vs 267 € a listino) |

**Regole di prezzo:**
- Fascia dimensionale: 51-200 dipendenti → maggiorazione del 60% su tutte le voci. La fascia si determina dal dato dipendenti dell'organizzazione e va ricontrollata al rinnovo annuale.
- Pagamento annuale anticipato → sconto 10% sul totale.
- Il bundle Percorso Ver0 dà accesso ai requisiti del Sigillo livello 1; il Sigillo stesso non è mai una voce di prezzo (vincolo di conformità, vedi sezione 11).
- Canale partner: provvigione ricorrente standard del 20% sul canone incassato, uguale per tutti i canali partner; nessuna provvigione sul canale self-service.
- L'hub / registro pubblico delle imprese certificate è previsto ma NON va esposto nel marketing né nel prodotto fino alla decisione di lancio di seconda fase (massa critica di aziende certificate).

**12.W — DIREZIONE GRAFICA A TRE REGISTRI (decisione del fondatore).**
- Registro A "editoriale vivo" = impianto generale del sito: gerarchia tipografica drammatica (Fraunces display grande), parole-Zero in corsivo menta come accento, fotografie vere trattate in duotone verde (persone e imprese; placeholder finche non ci sono scatti propri).
- Registro B "tech botanico" = SOLO sezioni del Motore Ver0: fondo pino scuro, bagliori menta (#2FCF9A), flussi animati documenti→Motore→output (CSS, con prefers-reduced-motion), card in vetro.
- Registro C: RITIRATO dopo prova sul campo (crema/terracotta giudicato estraneo al brand dal fondatore). La pagina del Sigillo adotta il TRATTAMENTO SCURO ISTITUZIONALE: fondo pino profondo (#0A2E1F), sigillo tono-su-tono bianco con segmento menta acceso #2FCF9A (regole fondo scuro della sezione identita del Sigillo), tipografia bianca/salvia, targa di verifica su placca bianca. L'accento terracotta e i fondi crema si eliminano dal sito.
- Regola generale: la pulizia resta la firma — i tre registri non si mescolano nella stessa sezione; mai piu di un registro speciale (B o C) per schermata.

**12.X — EVOLUZIONE LISTINO: PREZZI PER DIMENSIONE D'AZIENDA (decisione del fondatore, prevale sul listino piatto).**
- Ogni servizio ha una MATRICE DI PREZZO per dimensione: micro / piccola / media / grande. OGNI passaggio di fascia cambia il prezzo: micro = listino attuale; piccola = +20%; media = +50%; grande = "su richiesta" con contatto (aggancio commerciale). Percentuali indicative, da validare nel modello economico prima del lancio.
- Trasparenza invariata: i prezzi restano pubblici PER FASCIA — il posizionamento "prezzi in chiaro" non si tocca.
- In home i prezzi si espongono come "da X €/mese" (X = prezzo micro); il prezzo esatto si compone nella pagina del servizio tramite SELETTORE DI DIMENSIONE (micro/piccola/media/grande) che aggiorna prezzo e CTA. La dimensione scelta si propaga al checkout.
- Fonte dati unica: matrice prezzi in un file/tabella dedicata (mai prezzi cablati nelle pagine), pronta a diventare tabella a database in fase 2.

**12.V — IL CANONE INCLUDE (pacchetto abbonato — giustifica il ricorrente, va comunicato ovunque c'e un prezzo /mese).**
Chi ha un abbonamento attivo su qualunque servizio riceve, incluso nel canone:
- OSSERVATORIO FINANZA AGEVOLATA riservato agli abbonati: segnalazione di bandi e incentivi pertinenti per profilo (settore, dimensione, territorio, percorsi attivi); mai promesse di esito.
- AGGIORNAMENTO DOCUMENTALE IN TEMPO REALE: quando cambia una norma o ne arriva una nuova che tocca i documenti del cliente, il Motore Ver0 segnala l'impatto e aggiorna/rigenera i documenti interessati (con verifica umana dove prevista). E il cuore del valore ricorrente: il documento non invecchia mai.
- MANTENIMENTO DEL SIGILLO: rinnovo annuale dei percorsi verificati, millesimo aggiornato, pagina pubblica di verifica sempre attiva.
- Archivio documentale sempre disponibile e assistenza (uomo+AI) inclusa.
Regola di comunicazione: ogni prezzo "/mese" sul sito deve rendere visibile questo pacchetto (tooltip, riga "il canone include", o sezione dedicata "Perche l'abbonamento").

**12.Z — CARBON FOOTPRINT IN DUE TAGLI (decisione del fondatore).**
- Il modulo carbon si declina in due prodotti distinti a catalogo: "Carbon Light" (Scope 1 e 2) al prezzo attuale del modulo, e "Carbon Completa" (Scope 1, 2 e 3) a prezzo superiore — indicativo +70%, da validare — perche lo Scope 3 richiede raccolta dati di filiera e metodi di stima piu onerosi.
- Ogni taglio mantiene le varianti Base/Plus (revisione umana) e la matrice per dimensione d'azienda. Upgrade Light→Completa sempre possibile pagando la differenza. Il Percorso Ver0 chiarisce quale taglio include.

**12.Y — VETRINA A CATALOGO PER CATEGORIE (sostituisce le card piatte in home).**
- La sezione servizi della home diventa un catalogo navigabile per categorie: Sostenibilita declinata nei tre pilastri E (ambiente: carbon, check-up energetico, monitoraggio, ISO 14001, rating circolarita), S (sociale: UNI/PdR 125, UNI ISO 21401, ISO 20121), G (governance: VSME/report ESG, ISO 9001, preparazione ai rating e questionari) + famiglia Sistemi di gestione + altre famiglie a seguire.
- Ogni voce: nome, una riga di beneficio, "da X €/mese" (o "da X € una tantum"), link alla pagina servizio.
- I servizi di roadmap compaiono marcati "IN ARRIVO" (ampliano l'offerta percepita, non acquistabili); nessuna voce puo suggerire che Verzero certifichi.

**12.D — FONTI DEL CLIENTE E PRESENZA WEB (arricchimento qualitativo, aggiunta alla 2.1).**
- CONSENTITE SEMPRE (col mandato gia raccolto al checkout): sito web dell'impresa cliente, sue pagine istituzionali e profili ufficiali, documenti pubblicati dall'impresa stessa. Il Motore ne ricava cio che nessuna banca dati contiene: descrizione di attivita e prodotti, sedi e stabilimenti, mercati serviti, certificazioni esposte, pagine sostenibilita, policy pubblicate, storia e numeri dichiarati. Alimenta le sezioni QUALITATIVE di VSME, manuali ISO, PdR 125 (dove le visure non arrivano). Regola: ogni dato estratto dal web del cliente e marcato con fonte e URL e resta "da confermare" finche il cliente non lo valida.
- CONSENTITE: fonti istituzionali pubbliche (registri e portali della PA, open data).
- CON CAUTELA: aggregatori commerciali terzi che ripubblicano dati camerali (es. portali tipo registroaziende e simili) — quasi sempre i loro termini vietano estrazione e reimpiego: si usano solo se i termini lo consentono espressamente o via contratto. Nota economica: la visura ufficiale pay-per-use costa pochi euro e da pieno diritto d'uso, quindi la scorciatoia non conviene nemmeno economicamente.
- Principio invariato: meglio un campo vuoto di un dato indifendibile.

**12.D.1 — PRESENZA WEB: COME E STATA IMPLEMENTATA (18/08/2026).**
- Si legge SOLO il dominio dichiarato dal cliente (registrazione o scheda) e i suoi sottodomini: mai un aggregatore terzo, mai un link che porti fuori. Il sito si chiede in registrazione come campo facoltativo.
- robots.txt letto e rispettato PRIMA di ogni pagina, con parser proprio (gruppi per user-agent, Allow/Disallow, jolly e ancora, crawl-delay). Assente = consentito; irraggiungibile o 5xx = NON si legge nulla. Ci presentiamo come Ver0Bot con un indirizzo verificabile; al massimo 5 pagine per giro, con pausa.
- Si estraggono solo CITAZIONI VERBATIM, mai sintesi: descrizione dai metadati, prodotti dalle voci di menu, certificazioni per nome di norma preciso, sedi solo con CAP, mercati solo da frasi autoportanti, pagine sostenibilita e policy come indirizzi. Ogni campo porta fonte E URL, senza i quali non si scrive.
- Ogni campo arriva "da confermare" e il cliente puo CONFERMARLO O RIFIUTARLO singolarmente. Un campo rifiutato esce dai documenti e il Motore non lo ripropone mai piu.
- Alimenta le sezioni qualitative: VSME "Profilo dell'impresa e modello di business", manuali ISO "Contesto dell'organizzazione", PdR 125 "Politica della parita".

**12.E — ACCESSO: PASSWORD FUNZIONANTE + HUB DOCUMENTI CENTRALE (correzioni bloccanti).**
- ACCESSO: il login con EMAIL E PASSWORD deve essere la via principale e funzionante (l'account nasce con password nel funnel); serve il flusso "Password dimenticata" completo (richiesta → email di reset → nuova password) e il cambio password dalle Impostazioni. Il magic link resta alternativa, MAI unica via. Il rate limit del servizio email integrato di Supabase (pochi invii/ora) e insufficiente: configurare SMTP proprio (Resend) PRIMA dei piloti — priorita alzata.
- STATO ACCESSO (19/08/2026, CHIUSO). Resend e il server di posta del progetto: smtp.resend.com:465, mittente noreply@verzero.it, 60 email/ora e un invio ogni 20s per indirizzo; testi in italiano per conferma registrazione, recupero password e link di accesso, tutti in forma token_hash (il link vale anche se l'email si apre su un altro dispositivo). CONFERMA EMAIL RIATTIVATA — l'account nasce con indirizzo verificato, perche mandato banche dati e consensi restino legati a un indirizzo dimostrabilmente controllato dal cliente. Site URL https://verzero.it; redirect per verzero.it, www, vercel.app e localhost. Flusso completo verificato su casella reale (24/24): registrazione → conferma → login → uscita → reset → nuova password.
  AUTENTICAZIONE DELLA POSTA: DKIM firma con d=verzero.it (allineato al mittente, e cio che fa passare DMARC); SPF corretto sul dominio di ritorno send.verzero.it via amazonses (il dominio principale NON deve includere Resend); DMARC ASSENTE — da aggiungere al DNS come TXT su _dmarc.verzero.it con "v=DMARC1; p=none; rua=mailto:dmarc@verzero.it". Il collaudo (scripts/collaudo-accesso.mjs) ricontrolla tutto questo a ogni esecuzione.
- HUB DOCUMENTI CENTRALE (coerenza col messaggio del sito): la sezione "Documenti" della dashboard e il punto unico dove il cliente porta cio che ha — con indicazioni chiare per tipo, drag&drop, e SMISTAMENTO AUTOMATICO: il Motore riconosce il documento, lo assegna ai servizi sottoscritti pertinenti e mostra dove e confluito ("questa bolletta alimenta: Carbon Footprint → sezione 3"). L'upload resta possibile anche dentro il singolo fascicolo, ma l'hub centrale e la porta principale. Nessuna promessa di "carica qualsiasi cosa": indicazioni guidate + riconoscimento del tipo + segnalazione se il documento non serve ai percorsi attivi.

**12.C — SESSIONE VISIBILE E CONFORMITA COOKIE/PRIVACY (19/08/2026).**
- SESSIONE: il logotipo nel portale riporta al sito pubblico; nelle pagine pubbliche l'header mostra il nome dell'impresa (avatar con iniziale) con menu "Vai al mio ecosistema" ed "Esci" al posto di "Accedi". Lo stato si legge LATO SERVER: conseguenza accettata e voluta, le pagine pubbliche diventano dinamiche invece che statiche — un indicatore giusto al primo fotogramma vale piu della cache.
- PERSISTENZA verificata: cookie di sessione con scadenza a 400 giorni e path=/, quindi condiviso fra sito e portale e NON perso alla chiusura del browser; nessun timebox ne timeout d'inattivita sul progetto. Dopo il reset password si entra direttamente nel portale, senza secondo login.
- COOKIE: oggi NESSUNO script di misurazione o marketing e installato, quindi gli unici cookie sono tecnici. Il banner esiste ugualmente perche la macchina del consenso sia gia montata: in assenza di scelta tutto cio che non e necessario resta spento, "Accetta tutto" e "Rifiuta i non necessari" hanno pari peso visivo, la scelta si revoca dal footer e dalla cookie policy, e dura 6 mesi.
- PAGINE LEGALI: /privacy e /cookie-policy pubbliche e in sitemap, linkate da footer e funnel. Titolare come SEGNAPOSTO in attesa della societa. I punti da far validare da un legale sono marcati in pagina con riquadri ambra: dati societari ed eventuale DPO, accordo art. 28 per i dati dei dipendenti dei clienti, DPIA sulla lettura automatizzata dei documenti, clausole contrattuali standard per il trasferimento verso Anthropic, termini di conservazione, qualificazione dei cookie di sessione come tecnici.

**12.F — PORTALE IMPRESA v2: SIGILLO IN PERCORSO, BUNDLE SCOMPOSTO, SUGGERIMENTI CON EFFORT RESIDUO, LINGUAGGIO PER NON ESPERTI (da completare PRIMA della tappa 2.1).**
- STATI DEL SIGILLO NEL PORTALE: (1) "PERCORSO AVVIATO" — dal primo giorno il cliente vede l'anello del Sigillo con lo stato di avvio e riceve la TARGA DI AVVIO scaricabile (sigillo + QR verso la pagina pubblica + dicitura millesimata "Percorso avviato 2026"): l'azienda puo usarla per dichiarare l'inizio del percorso. WORDING RIGOROSO: la targa di avvio dichiara un percorso IN CORSO, mai un risultato — visivamente distinta dal sigillo pieno (anello vuoto/tratteggiato, mai segmenti pieni); la pagina pubblica dice "percorso avviato il..., in corso di completamento". (2) Segmenti pieni SOLO a percorso verificato. Anti-greenwashing by design.
- BUNDLE SCOMPOSTO: il Percorso Ver0 (e ogni bundle) si presenta SEMPRE scomposto nei suoi documenti componenti — Carbon Footprint di Organizzazione (Scope 1 e 2), Bilancio di Sostenibilita (VSME) Base, Miglioramento score, Kit Comunicazione — ciascuno con la propria bozza, il proprio anello e il proprio fascicolo. NOMENCLATURA COMPLETA anche nel portale (mai "carbon" e basta).
- UN DATO, PIU DOCUMENTI: ogni dato recuperato o caricato mostra a QUALI documenti contribuisce (chip di destinazione: → Carbon, → VSME, → entrambi). Il principio "rispondi una volta sola" deve essere VISIBILE: quando un dato serve a due documenti, il cliente lo vede scritto.
- SUGGERIMENTI INTELLIGENTI (cross-sell nel portale): card "Con i dati che gia abbiamo potresti attivare..." per i servizi non attivi pertinenti, con: prezzo dalla matrice, SCONTO CLIENTE ATTIVO (add-on -15% per chi ha gia un abbonamento — da validare sul modello economico), ed EFFORT RESIDUO calcolato e dichiarato ("ti serviranno solo: organigramma" / "zero documenti aggiuntivi: abbiamo gia tutto"). Mai pressione: tono di opportunita, frequenza discreta.
- LINGUAGGIO PER NON ESPERTI (lato impresa): l'utente tipo NON ha competenze tecniche — ogni sigla o termine tecnico ha la spiegazione breve a portata (tooltip/riga secondaria: "Scope 2 = le emissioni dell'energia che compri"), le azioni dicono cosa succede dopo, gli stati sono frasi comprensibili e mai codici. Il lato partner/consulente puo restare tecnico.

**12.G — PRINCIPIO "MAI UNA CHECKLIST VUOTA": PRIMA CIO CHE ABBIAMO GIA FATTO, POI CIO CHE MANCA (regola di prodotto, cuore dell'innovazione).**
- Dopo l'acquisto il cliente NON deve mai trovarsi davanti a un elenco di cose da fare. La schermata del percorso si apre SEMPRE sul LAVORO GIA SVOLTO dal Motore: bozza del documento gia impostata e leggibile (sezioni popolate coi dati recuperati), percentuale di completamento gia significativa, campi compilati con badge di provenienza e fonte.
- La checklist dei documenti mancanti e SECONDARIA e va presentata come "cosa serve per completare", sotto o a lato della bozza, mai come prima cosa e mai come modulo vuoto da riempire.
- Regola di sequenza per ogni percorso: (1) mostrare cio che il Motore ha gia composto; (2) evidenziare cosa manca e perche serve; (3) chiedere solo quello. Ogni percorso deve avere una quota di precompilazione non banale gia al primo accesso (anagrafica, struttura del documento, sezioni standard, dati da banche dati, riferimenti normativi applicabili).
- Questo principio prevale su ogni scelta di layout della dashboard: e la dimostrazione visibile dell'innovazione di Verzero.

**12.H — PORTALE POST-ACQUISTO: STRUTTURA UNIVOCA + ARRICCHIMENTO AUTOMATICO ALL'ATTIVAZIONE (riprogettazione fase 2, prevale sull'ordine precedente delle tappe).**
- STRUTTURA UNIVOCA per tutti gli utenti, qualunque cosa abbiano acquistato — otto sezioni fisse: 1) Panoramica (evidenza in chiaro dei servizi in corso e prossime azioni); 2) La tua impresa (scheda anagrafica arricchita dal Motore); 3) I tuoi percorsi (card dei moduli attivi con fascicolo e avanzamento); 4) Documenti (archivio unico); 5) Sigillo (stato e targa); 6) Bandi (osservatorio abbonati); 7) Consulenza (corner e assistenza); 8) Impostazioni (dati, consensi e mandati revocabili). Il profilo consulente usa la STESSA struttura col selettore cliente. I servizi non attivi compaiono come opportunita, mai come vuoti.
- MOMENTO DI ARRIVO ("il Motore ha gia lavorato"): all'attivazione, forte del mandato banche dati del checkout, il Motore precompila la scheda impresa (ragione sociale, ATECO, sede e unita locali, PEC, dipendenti, cariche, capitale, bilanci ove disponibili, certificazioni gia possedute) e imposta il fascicolo del percorso; il primo accesso e un wizard in 3 passi: CONFERMA i tuoi dati (badge "recuperato da noi" su ogni campo) → ecco il tuo percorso → ecco cosa serve da te. Ogni dato recuperato mostra la fonte. UX: semplice, facile, intuitivo — mai un campo chiesto se una banca dati lo fornisce.
- FONTI DI ARRICCHIMENTO (prioritarie → estese): GRATUITE: VIES (validazione P.IVA UE), verifica P.IVA Agenzia Entrate, INI-PEC (PEC ufficiale), classificazioni ISTAT/ATECO, banca dati ACCREDIA (certificazioni gia possedute), fattori di emissione ISPRA/DEFRA (per i calcoli), Registro Nazionale Aiuti di Stato (de minimis, per bandi), incentivi.gov.it/OpenCoesione (osservatorio bandi). A CONSUMO VIA PROVIDER API (es. OpenAPI.it o equivalenti — pay-per-use, ideale in avvio): visura/Registro Imprese InfoCamere, bilanci depositati, elenco soci e cariche, unita locali. CONTRATTUALIZZABILI IN SEGUITO: Cerved (score e anagrafiche evolute), CRIF/CRIBIS, catasto immobili (via provider), GSE/ARERA e delega al distributore per i dati energia (ponte gia previsto), Terna/ETP se ESCo in futuro. Regola economica: fonti a pagamento SOLO post-incasso dell'ordine (mai per simulazioni).
- TAPPE FASE 2 RISEQUENZIATE: 2.0 struttura dashboard univoca + scheda impresa → 2.1 arricchimento automatico (gratuite subito, provider a consumo in sandbox) → 2.2 storage e upload documenti → 2.3 estrazione AI per tipo documento → 2.4 conferma umana → 2.5 primo calcolo.

**12.I — NOMENCLATURA UFFICIALE DEI SERVIZI (precisione tecnica, regola vincolante).**
- Ogni servizio si espone col NOME TECNICO COMPLETO; i tagli commerciali sono SOTTOTITOLI, mai il nome da soli: "Carbon Footprint di Organizzazione — Scope 1 e 2" e "Carbon Footprint di Organizzazione — Scope 1, 2 e 3" (mai "Carbon Light/Completa" da soli); "Bilancio di Sostenibilita (VSME) — Base" e "— Avanzato"; "Manuale del Sistema di Gestione ISO 9001"; e cosi via per tutto il catalogo. Nelle card compatte: nome tecnico in evidenza + taglio come riga secondaria. Un addetto ai lavori deve riconoscere il servizio esatto dal nome.
- ESTENSIBILITA DICHIARATA: Verzero e una piattaforma di consulenza destinata ad ampliarsi oltre gli ambiti attuali (es. Modello di Organizzazione e Gestione ex D.Lgs. 231/01, altre consulenze specialistiche): architettura, copy e categorie del catalogo non devono mai presupporre che gli ambiti siano solo quelli di oggi.

**12.J — HOME COME MANIFESTO, PROFONDITA ALL'INTERNO (regola di comunicazione e design).**
- La HOMEPAGE vende la potenza del Motore proprietario e il risultato — NON spiega il processo: niente fascicoli dettagliati, niente fasi tecniche estese, niente spoiler del metodo (che e anche protezione del know-how: il "come" dettagliato non si regala ai concorrenti in home). Ogni sezione della home: UN titolo grande e deciso + massimo 2 righe di testo + una CTA. La profondita tecnica vive nelle pagine interne (come-funziona, pagine servizio, dashboard).
- TIPOGRAFIA "SHOCK": display molto piu grande e coraggioso (statement di 2-5 parole che circoscrivono e indirizzano), contrasto netto pino/bianco, meno gradienti e morbidezze "patinate", bordi e blocchi decisi, bottoni grandi con verbi imperativi. Meno elementi, piu grandi: se una sezione ha piu di un messaggio, si spezza o si taglia.
- La sezione documenti in home si comprime a TRE battute visive secche (il necessario → il Motore → la firma) con rimando "guarda come funziona" alla pagina interna dove vive il fascicolo completo.

**12.K — ACCESSO ALL'ECOSISTEMA: DUE PROFILI (decisione del fondatore).**
- L'area riservata si comunica come ECOSISTEMA del cliente, non come semplice login: dal sito si accede con pulsante "Accedi" sempre visibile in header (e richiami nel footer e nelle CTA), che porta a una pagina di accesso con DUE PROFILI distinti:
  (a) IMPRESA: l'azienda che ha attivato i servizi — vede il proprio ecosistema (moduli, documenti, Sigillo, bandi, corner).
  (b) CONSULENTE PARTNER: professionista che usa la piattaforma come "admin" dei PROPRI clienti — dashboard con selettore cliente, vede e gestisce SOLO le organizzazioni a lui collegate.
- MODELLO DATI: ruolo sul profilo (impresa | consulente) + tabella di collegamento consultant_organizations (consulente ↔ organizzazioni gestite, con stato del mandato). RLS estesa: il consulente accede ai dati di un'organizzazione SOLO se il collegamento e attivo. L'impresa resta TITOLARE dei propri dati: il collegamento nasce da un invito/consenso dell'impresa (o da un'attivazione fatta dal consulente per conto del cliente, che il cliente puo revocare in ogni momento).
- FASI: adesso si predispongono modello dati, RLS, doppio accesso e selettore cliente in dashboard (struttura); la gestione operativa completa del portale consulente (attivazioni per conto, fatturazione partner, white-label) si sviluppa con le fasi 2-3 e il canale partner del go-to-market.

**12.M — AMPLIAMENTO PILASTRO SOCIAL (nuovi servizi).**
- UNI EN ISO 45001 (salute e sicurezza sul lavoro) — FAMIGLIA A, certificabile, HLS come 9001/14001. PERIMETRO DICHIARATO IN OGNI PUNTO DI CONTATTO: Verzero genera il SISTEMA DI GESTIONE (manuale, politica, procedure, moduli, monitoraggio, riesame) e lo integra con il DVR gia esistente dell'impresa; il DVR NON e nel perimetro — e obbligo indelegabile del datore di lavoro (artt. 17, 28-29 D.Lgs. 81/08) e resta a carico dell'impresa e del suo RSPP. Argomenti di vendita leciti: presunzione di conformita all'art. 30 D.Lgs. 81/08 per le parti corrispondenti (efficacia esimente ex D.Lgs. 231/01 SOLO se il sistema e effettivamente attuato — mai promettere protezione penale automatica), riduzione del premio INAIL (modello OT23), qualifica fornitori e gare. Prezzo: canone come i manuali ISO (primo anno pieno, dal 2 anno mantenimento) — allineato a 9001/14001, verificare mercato prima del lancio.
- UNI ISO 45003 (salute psicologica e benessere organizzativo) e UNI ISO 30415 (diversita e inclusione) — FAMIGLIA B (linee guida, NON certificabili): si vendono come percorsi di aderenza documentata e come add-on naturali di PdR 125 e 45001. Prezzo add-on ridotto.
- SA8000 (responsabilita sociale, schema SAI accreditato) — inserito come schema riconosciuto di parte terza (non UNI/ISO: va detto). Preparazione documentale e accompagnamento all'audit; mercato importante nelle filiere labour-intensive. Prezzo in target di mercato.
- ETICHETTE: vietate diciture di domanda non verificabili ("in forte richiesta", "il piu richiesto"). Ammesse solo etichette fattuali: "Novita", "In arrivo", "Spesso richiesto insieme a X" (se vero nel catalogo), "Premiante nei bandi" (se documentabile).

**12.L — BILANCIO VSME: DUE LIVELLI SULLO STANDARD.**
- Il VSME di EFRAG e articolato in MODULO BASE e MODULO COMPLETO (comprehensive): Verzero li rispecchia in due prodotti — "VSME Base" (modulo base: informativa essenziale, sufficiente per banche e prime richieste di filiera) e "VSME Avanzato" (modulo base + modulo completo: politiche, azioni, obiettivi, informazioni per partner commerciali e finanziatori piu esigenti), a prezzo superiore. Upgrade Base→Avanzato sempre possibile pagando la differenza.
- VERIFICA OBBLIGATORIA PRIMA DELLA PUBBLICAZIONE: denominazione esatta dei moduli ed edizione vigente dello standard EFRAG (e lo stesso per numeri ed edizioni di TUTTE le norme citate a sito: UNI, ISO, PdR, D.Lgs.) — su un sito che promette rigore, una citazione normativa sbagliata e l'errore piu costoso.

**12.N — SERVIZIO "SUPPORTO ALL'AUDIT" (one shot, add-on ad alto valore).**
- Cosa e: dopo l'audit dell'organismo di certificazione, il cliente carica i RILIEVI ricevuti (osservazioni, raccomandazioni, non conformita minori/maggiori) e Verzero adegua i documenti generati secondo quanto richiesto dall'ente, restituendo la documentazione revisionata + la nota di risposta ai rilievi. Motore Ver0 per la riscrittura, verifica umana obbligatoria prima della consegna.
- Formato: ONE SHOT (prezzo indicativo 390 euro fascia micro, gradini standard; ipotesi tariffa a "pacchetto rilievi", da validare). Nessun canone.
- DOVE SI VENDE (doppio ingresso): (a) a CATALOGO come add-on visibile nella famiglia trasversale e citato in fondo alle pagine dei servizi certificabili (ISO 9001/14001, PdR 125, 21401) — "hai gia un audit in corso? possiamo aiutarti anche se i documenti non li abbiamo fatti noi"; (b) nell'AREA RISERVATA, come azione contestuale sul modulo attivo ("Hai ricevuto rilievi dall'ente? Caricali qui") — e in dashboard e il punto di massima conversione, perche compare quando il cliente ne ha davvero bisogno.
- VINCOLI: non si promette il superamento dell'audit ne si interferisce con l'organismo (indipendenza della parte terza); si dichiara "adeguiamo la documentazione ai rilievi ricevuti"; niente contatto diretto con l'ente per conto del cliente.

**12.O — "ZERO EFFORT" ONESTO E CONCRETEZZA DEL MOTORE (regole di comunicazione).**
- ZERO EFFORT si dichiara con la formula canonica (rivista dal fondatore): "Zero effort, sul serio: bastano i documenti che hai gia in azienda. Il Motore Ver0 li trasforma in qualifiche, un professionista le valida." (varianti ammesse solo se mantengono i tre elementi: documenti esistenti → Motore → validazione umana).
- VERBO DELLA VERIFICA UMANA: i professionisti VALIDANO / CONVALIDANO / ANALIZZANO — MAI "firmano" (la firma implica assunzioni di responsabilita professionale e asseverazioni che non fanno parte del servizio): eliminare "firma/firmato" da tutto il sito e dai documenti di comunicazione. VIETATE le quantificazioni di tempo o impegno del cliente ("un'ora del tuo tempo" e simili): l'impegno varia per percorso e impresa, e ogni numero promesso e un ostaggio. Vietate anche le formule che promettono che il cliente non faccia nulla.
- CONCRETEZZA DEL MOTORE: la sezione del Motore non si racconta con astrazioni (particelle, zeri da cui "succedono cose") ma con ARTEFATTI REALI: nomi di documenti veri in ingresso (bolletta elettrica, visura camerale, registro carburanti), campi estratti con valori d'esempio plausibili, la norma applicata citata, l'anteprima del documento in uscita, il passaggio di verifica umana con esito. Regola: ogni fase mostra COSA entra, COSA esce e SU QUALE NORMA — solidita prima di spettacolo.
- MOBILE: le sezioni sticky/scrollytelling degradano su mobile a sequenza statica impilata e leggibile; nessun effetto che comprometta fluidita o leggibilita sotto i 768px.

**12.P — PRINCIPIO "SOLO STANDARD UFFICIALI" + RACCOLTA DOCUMENTALE GUIDATA (regole di comunicazione e prodotto).**
- SOLO STANDARD UFFICIALI: Verzero lavora esclusivamente su standard e normative nazionali e internazionali di riferimento — UNI EN ISO, UNI/PdR, D.Lgs., regolamenti e direttive europee, standard EFRAG/GHG Protocol — MAI su protocolli inventati o privi di validita tecnico-scientifica. Rientrano anche gli SCHEMI INTERNAZIONALI RICONOSCIUTI E ACCREDITATI di parte terza (es. SA8000 di SAI, accreditato SAAS): non sono norme UNI/ISO ma sono schemi certificabili riconosciuti dal mercato — vanno presentati come tali, distinguendoli con chiarezza dalle norme UNI/ISO. Questo principio va comunicato ovunque conti: home, chi-siamo (tra i principi), ogni pagina servizio (con le norme di riferimento citate con precisione), pagina Sigillo. E un differenziante contro gli schemi proprietari e un presidio anti-greenwashing.
- RACCOLTA DOCUMENTALE GUIDATA (sostituisce ogni formula tipo "carica quello che hai/vuoi"): il Motore Ver0 NON accetta documenti qualsiasi — per ogni percorso richiede una LISTA PRECISA di documenti (es. carbon: bollette dei vettori, registri carburanti, visura; ISO 9001: visura, organigramma, processi), li legge, incrocia le banche dati ufficiali e segnala cosa manca. La comunicazione racconta metodo e rigore ("il Motore ti chiede esattamente cio che serve, lo legge e lo trasforma"), mai onnipotenza. La checklist per percorso e parte della scheda servizio.
- NAVIGAZIONE: "Chi siamo" e la PRIMA voce del menu; la voce "Servizi e prezzi" si rinomina "Servizi".

**12.Q — FORMATO UNICO DEI PREZZI E CICLO DI VITA DEL CANONE (prevale su 12.R dove diverge).**
- FORMATO UNICO: tutti i servizi ricorrenti si espongono SOLO a canone mensile (impegno minimo 12 mesi) + opzione annuale unica soluzione -10%. Le parti fisse una tantum SPARISCONO dalla visualizzazione: si spalmano nel canone del primo anno. Restano una tantum solo i servizi one-shot senza canone (check-up energetico 290).
- RISPARMIO ASSOLUTO: accanto alla percentuale di sconto va SEMPRE mostrato il risparmio in euro ("-10% · risparmi 143 euro"). Vale per lo sconto annuale e per ogni confronto tra formule.
- CICLO DI VITA (anni successivi piu leggeri, mostrato con trasparenza):
  (a) Servizi con produzione iniziale (Manuali ISO 9001/14001, UNI/PdR 125): ANNO 1 canone pieno che ingloba la produzione — ISO: 139/mese (annuale 1.500); PdR 125: 119/mese (annuale 1.290) — DAL 2° ANNO solo mantenimento: ISO 59/mese, PdR 39/mese. In card: "primo anno 139/mese · dal 2° anno 59/mese".
  (b) Servizi documentali annuali (Carbon, VSME, Percorso Ver0): rinnovo DAL 2° ANNO a -20% ("i tuoi dati sono gia nel Motore: il rinnovo costa meno") — es. Percorso 119 → 95/mese dal 2° anno.
  (c) Il rinnovo e sempre LIBERO: nessun vincolo oltre i primi 12 mesi; va detto esplicitamente ("rinnovi solo se vuoi").
- COPY DEI SERVIZI: i testi delle pagine servizio si riscrivono in chiave professionale — tono istituzionale e concreto, benefici misurabili, terminologia tecnica corretta (norme citate con precisione), niente enfasi da marketing gonfiato; struttura fissa: cos'e / come funziona con Ver0 / cosa ottieni / requisiti e vincoli / la sezione OPPORTUNITA ("perche conviene adesso") che RESTA in ogni pagina. Revisione finale dei testi col fondatore prima dei piloti.

**12.R — REVISIONE FINALE LISTINO: KIT INCLUSO DI DEFAULT + DOPPIA ESPOSIZIONE MENSILE/ANNUALE (prevale sui numeri di 12.S).**
- Il KIT COMUNICAZIONE VER0 e INCLUSO DI DEFAULT in ogni servizio in abbonamento (entra nel pacchetto "il canone include" come quinto beneficio); di conseguenza tutti i canoni salgono leggermente. La voce standalone del Kit esce dal catalogo; per i servizi solo una tantum resta acquistabile come add-on (490 euro/anno fascia micro).
- MODALITA DI PAGAMENTO E VISUALIZZAZIONE (regola vincolante): ogni prezzo ricorrente si mostra in DOPPIA FORMA ben visibile — canone MENSILE in evidenza (valore visivamente inferiore; impegno minimo 12 mesi, dichiarato con chiarezza accanto) e, immediatamente sotto/accanto, l'opzione UNICA SOLUZIONE ANNUALE con SCONTO 10% e badge "-10%". Esempio di card: "45 euro/mese" grande + "oppure 490 euro/anno in unica soluzione (risparmi il 10%)".
- NUOVI PREZZI BASE FASCIA MICRO (mensile / annuale unica soluzione -10%; gradini di fascia invariati +20% piccola, +50% media, grande su richiesta):
  Carbon Light: 45/mese · 490/anno | Carbon Completa: 75/mese · 810/anno | Bilancio VSME: 89/mese · 960/anno | BUNDLE Percorso Ver0 (Carbon Light + VSME + miglioramento score + Kit): 119/mese · 1.290/anno | Manuale ISO 9001 o 14001: 990 una tantum + mantenimento 59/mese · 640/anno | UNI/PdR 125: 990 una tantum + mantenimento 39/mese · 420/anno | Check-up energetico: 290 una tantum | Miglioramento score rating (standalone): 45/mese · 490/anno | Rating economia circolare UNI/TS 11820: 59/mese · 640/anno.
- Il copy dei prezzi valorizza il Kit incluso: "incluso il Kit Comunicazione: claim verificati, materiali per filiera e banche, verifica anti-greenwashing dei tuoi testi".
- Resta ferma la verifica di coerenza sul modello economico (margine lordo >=70%).

**12.S — LISTINO "SHOCK" v2 (adattato al benchmark di mercato — proposta operativa, da validare sul modello economico prima del lancio).**
Principio: prezzi ancorati alle soglie psicologiche emerse dall'indagine (micro/piccola sotto 990 euro/anno per il bundle; media sotto 2.900 euro/anno) e sempre SOTTO il SaaS concorrente di riferimento, con il tradizionale come termine di paragone nel copy ("dal consulente: da 10.000 euro").
Prezzi base fascia MICRO (annuale, con equivalente mensile mostrato; fasce: piccola +20%, media +50%, grande su richiesta):
- Carbon Light (Scope 1+2): 390 euro/anno (39/mese) — riferimento: Greenly ~500 $, tradizionale 1.500-3.000.
- Carbon Completa (Scope 1-2-3): 660 euro/anno (66/mese) — regola +70% su Light.
- Bilancio VSME: 790 euro/anno (79/mese) — sotto Ecomate 949; tradizionale 5.000-10.000.
- BUNDLE "Percorso Ver0" (Carbon Light + VSME + preparazione rating): 990 euro/anno (99/mese) — l'offerta-manifesto sotto la soglia psicologica; upgrade a Carbon Completa +270/anno.
- Manuale ISO 9001 / ISO 14001: 990 una tantum + mantenimento 490/anno (49/mese) ciascuno — tradizionale 1.500-2.500 micro.
- UNI/PdR 125 (preparazione): 990 una tantum + 290/anno mantenimento — tradizionale 2.000-4.000; certificazione OdC esclusa e detto chiaramente.
- Check-up energetico: 290 una tantum.
- KIT COMUNICAZIONE VER0 (servizio ad alto margine): 590 euro/anno (fascia micro; gradini standard) o in bundle col Percorso. Il Motore genera dai SOLI dati verificati del cliente un kit pronto all'uso: claim ambientali difendibili con la fonte a supporto di ciascuno, one-pager per filiera e banche, testi per sito e social, template comunicato, linee guida d'uso del Sigillo — piu la VERIFICA DEI CLAIM: il cliente sottopone i propri testi e il Motore li valida contro i dati (semaforo verde/ambra/rosso con motivazione). Posizionamento: "comunica solo cio che puoi dimostrare" — tutela dal greenwashing e dalle nuove norme sui green claim. Margine quasi puro (generazione AI su dati gia in piattaforma); e la leva per NON svendere il resto del listino.
- Preparazione/miglioramento score rating (EcoVadis, Synesgy, Open-es): MAI venduto come assessment (quelli sono gratis sul mercato) ma come "miglioramento dello score": 490/anno add-on o incluso nel Percorso.
Regole di esposizione: prezzo annuale in evidenza con mensile accanto; accanto ai prezzi il paragone col tradizionale; il pacchetto "il canone include" sempre visibile; percentuali di fascia con gradini reali (v. 12.X).
COERENZA ECONOMICA: prima del lancio, verifica sul modello economico che ogni prezzo copra i costi variabili (banche dati + AI + revisione) con margine lordo >=70%; se un prezzo non regge, si alza il prezzo, non si taglia la revisione umana.

**12.T — FLUSSO DI ACQUISTO E REGISTRAZIONE (decisione del fondatore — sostituisce il solo magic link come porta d'ingresso all'acquisto).**
Scelto servizio, taglio e dimensione, il cliente entra in un funnel di acquisto in step:
1. RIEPILOGO: schermata con il riepilogo di cio che sta acquistando (servizio, taglio, dimensione, prezzo, cosa include il canone) sempre visibile a lato/in alto per tutto il funnel.
2. REGISTRAZIONE AZIENDA: dati impresa (ragione sociale, P.IVA, email aziendale) + creazione account con EMAIL E PASSWORD (il magic link resta come metodo di accesso successivo, non come porta d'acquisto).
3. CONSENSI (due flag distinti, non pre-spuntati): (a) accettazione condizioni di servizio; (b) AUTORIZZAZIONE ESPRESSA ad accedere in nome e per conto del cliente alle banche dati ufficiali per reperire le informazioni dell'azienda — sia fonti gratuite sia a pagamento (registro imprese/Camere di Commercio, provider camerali, Cerved e assimilati, catasti e fonti energetiche citate in specifica). Testo del mandato chiaro su: quali fonti, per quale finalita, revocabilita. NOTA: formulazione legale da validare con legale prima del lancio.
4. PAGAMENTO: schermata modalita di pagamento. In questa fase l'integrazione del pagamento reale (Stripe o equivalente) e rimandata alla fase successiva: UI pronta con provider disattivato o modalita test; nessun incasso reale prima della societa costituita.
5. ATTIVAZIONE: post-conferma si atterra nel flusso di attivazione gia specificato (onboarding, banche dati, precompilazione).

## 13. Estensioni del catalogo — CON GERARCHIA DI PRIORITÀ (aggiornata alla strategia dei 18 mesi)

NOTA DI PRIORITÀ (prevale sull'etichetta storica "post-MVP"): il blocco 13.5-13.8 — generatore di sistemi di gestione, PdR 125, arricchimento camerale e banche dati — è il CUORE della piattaforma e dell'innovazione, ed è il PRIMO prodotto da portare sul mercato nella finestra parallela (cuneo a bassa sovrapposizione: ISO 9001 + PdR 125), insieme al 13.9 (check-up energetico) come funnel. Le fasi 0-4 (carbon/VSME) restano il motore da costruire — infrastruttura comune di estrazione, calcolo e generazione — ma la loro spinta commerciale e di seconda ondata (post-decisione mese 18). Le sezioni 13.1-13.4 (compensazione, CFP/LCA di prodotto, academy, supporto certificazioni) sono fase 2: riusano lo stesso motore documentale e si attivano a valle. L'ordine di costruzione dei verticali in fase 2 di sviluppo segue questa nota, non l'ordine di numerazione.

Estensioni del catalogo dopo le fasi 0-4, per allineare l'ampiezza dell'offerta ai leader di mercato mantenendo il modello self-service con prezzi pubblici. Nessuna di queste voci entra nel codice dell'MVP; la struttura modulare (tabelle `modules` e `price_plans`) deve però permettere di aggiungerle senza rifattorizzazioni.

**13.1 Compensazione — "Contributo climatico" (priorità alta: opportunità di business rilevante).** Vendita in piattaforma di crediti di carbonio certificati (standard riconosciuti: Verra/VCS, Gold Standard) e Garanzie d'Origine, con margine di intermediazione. Il cliente vede il proprio residuo emissivo dal modulo carbon footprint e può finanziare progetti climatici in pochi click, con registro delle transazioni e attestato di contributo. VINCOLI DI CONFORMITÀ NON NEGOZIABILI (direttiva UE 2024/825): (a) mai generare o suggerire claim di neutralità o riduzione basati sulla compensazione ("carbon neutral", "a impatto zero grazie ai crediti"); il linguaggio in piattaforma e negli attestati è sempre "contributo climatico" riferito al finanziamento di progetti, distinto dalle emissioni proprie; (b) il Sigillo Ver0 non dipende MAI dai crediti acquistati: i criteri restano misurazione verificata (livello 1) e riduzione reale (livello 2); l'acquisto di crediti non concorre in alcun modo; (c) tracciabilità completa: per ogni credito venduto, progetto, standard, vintage e registro di ritiro visibili al cliente. INTEGRAZIONE TECNICA (fase 2): Verzero non gestisce crediti in proprio ma si collega a operatori esistenti — via API di provider/aggregatori di crediti certificati (catalogo progetti, acquisto, ritiro sul registro, certificato con seriali) o tramite accordi con exchange/broker (es. CTX - Carbon Trade Exchange) e canali diretti già in essere; selezione del partner con criteri di qualità espliciti e ritiro sempre nominativo per il cliente finale.

**13.2 Carbon footprint di prodotto (LCA semplificata).** Calcolo delle emissioni di prodotto/servizio a partire dai dati aziendali già in piattaforma; percorso certificato ISO 14067 / EPD tramite verificatori partner (stesso schema convenzionale degli EGE per la diagnosi energetica). Target: PMI manifatturiere sotto pressione di qualifica fornitori.

**13.3 Academy Verzero (formazione).** Corsi digitali in piattaforma su sostenibilità, rendicontazione e uso degli strumenti, con attestati; versione team per il coinvolgimento del personale. Margine elevato, nessun costo consulenziale, coerente con il self-service.

**13.4 Supporto certificazioni.** Accompagnamento a verifiche e certificazioni (es. ISO 14064 di parte terza) tramite rete di partner qualificati, con la piattaforma che prepara automaticamente il fascicolo documentale.

Nota di posizionamento: l'intera roadmap mantiene la differenza strutturale rispetto ai player consulenza-intensivi — self-service, prezzi pubblici, verifica incorporata (Sigillo) — che permette di servire in modo economico la fascia di clienti sotto la soglia di convenienza della consulenza tradizionale.

**13.5 Generatore di sistemi di gestione e documentali ISO (due famiglie; estensione 14064 verso verifica di parte terza).**

*Famiglia A — sistemi di gestione CERTIFICABILI (struttura HLS, stessa macchina di generazione):* ISO 9001 (qualita), ISO 14001 (ambiente), ISO 20121 (eventi sostenibili — verticale eventi/fiere/hospitality). Output: manuale, politica, procedure, modulistica, pronto per l'audit dell'organismo accreditato.

*Famiglia B — norme GUIDA, NON certificabili per costruzione:* ISO 26000 (responsabilita sociale), ISO 20400 (acquisti sostenibili — sinergia con Scope 3 e dati fornitori). Output: sistema documentale di ADERENZA — politica, procedure, autovalutazione strutturata sui temi della norma, report di allineamento spendibile verso filiere, rating ESG e capitolati. VINCOLO: la piattaforma non deve MAI promettere o lasciar intendere una certificazione per le norme di famiglia B; il linguaggio e sempre "aderenza/allineamento alla norma".

*Verticale Ho.Re.Ca e turismo (estensione delle famiglie sopra):* UNI ISO 21401 (sistema di gestione della sostenibilita per strutture ricettive — famiglia A, certificabile; i requisiti ambientali si precompilano dai dati carbon e check-up energetico gia in piattaforma) e UNI ISO 13009 (gestione di spiagge e stabilimenti balneari — standard di requisiti di servizio, certificabile, con impianto documentale dedicato non-HLS). Si integrano con ISO 20121 (eventi) e i pacchetti settore ristorazione/hospitality.

*Percorso "pronto per i portali" (Booking, Airbnb, OTA):* i portali espongono certificazioni di sostenibilita DI TERZA PARTE riconosciute (schemi accreditati, es. ambito GSTC, Green Key, EU Ecolabel, in taluni casi ISO 21401). Il servizio prepara la struttura alla certificazione riconosciuta: sistema di gestione generato, mappatura dei requisiti dello schema scelto, fascicolo per l'audit dell'ente. VINCOLI: mai promettere il badge sul portale (dipende dall'ente certificatore e dalle policy del portale, che cambiano e vanno monitorate dall'osservatorio); il Sigillo Ver0 NON e uno schema riconosciuto dai portali e non va mai presentato come tale.

*Posticipate:* ISO 45001 (vedi vincolo (c) sotto) e ISO 50001 — quest'ultima esclusa per ora perche il suo cuore (analisi energetica: usi significativi, baseline EnB, EnPI, piani d'azione) richiede dati granulari per essere credibile in audit; rientra quando check-up energetico e monitoraggio saranno attivi e alimenteranno l'analisi con curve e storici reali, con revisione tecnica umana obbligatoria su usi significativi e piani d'azione. Gancio da conservare per allora: la certificazione 50001 esonera dall'obbligo di diagnosi ex D.Lgs. 102. Modulo che genera l'impianto documentale completo di un sistema di gestione — manuale, politica, analisi del contesto, rischi e opportunità, procedure gestionali, modulistica — tramite questionario guidato più riuso automatico dei dati già in piattaforma (contesto, processi, consumi, aspetti ambientali dai moduli carbon/VSME). Flusso: questionario → generazione AI sezione per sezione → revisione e conferma del cliente → export in formato Word modificabile. Modello di prezzo: generazione una tantum a prezzo fortemente concorrenziale rispetto alla consulenza tradizionale + canone di mantenimento ricorrente (aggiornamenti normativi, scadenzario audit interni e riesami, registro formazione). VINCOLI: (a) mai riprodurre testo delle norme UNI/ISO (protetto da diritto d'autore): i documenti lavorano al livello dell'applicazione dei requisiti; l'acquisto della norma ufficiale resta a carico del cliente; (b) comunicazione esplicita che la piattaforma produce l'impianto documentale "pronto per la certificazione": la certificazione è rilasciata esclusivamente da organismi accreditati dopo audit; (c) la ISO 45001 (salute e sicurezza) è temporaneamente ESCLUSA dal perimetro del modulo per le implicazioni di responsabilità ex D.Lgs. 81/08: potrà entrare in una fase successiva solo con revisione umana obbligatoria di professionista convenzionato; (d) per la ISO 14064 l'estensione è il percorso di verifica di parte terza del carbon footprint già calcolato dal modulo core, tramite organismi accreditati partner.

**13.6 Certificazione della parità di genere — UNI/PdR 125:2022.** Modulo che prepara l'azienda alla certificazione della parità di genere: autovalutazione guidata sui KPI delle sei aree della prassi (cultura e strategia, governance, processi HR, opportunità di crescita, equità remunerativa, tutela della genitorialità e conciliazione), generazione del sistema di gestione della parità (politica, piano strategico, comitato guida, procedure) e fascicolo pronto per l'audit dell'organismo accreditato. Argomenti di vendita integrati nel modulo: esonero contributivo per le aziende certificate, premialità nei bandi pubblici e punteggi negli appalti. VINCOLI: i dati di dettaglio su retribuzioni e genere del personale sono dati sensibili — trattamento solo in forma aggregata ai fini dei KPI, mai archiviazione di dati nominativi su retribuzione o genere dei singoli dipendenti; la certificazione è rilasciata esclusivamente da organismi accreditati.

**13.7 Arricchimento anagrafico automatico (capacita di piattaforma, trasversale).** Integrazione con fonti dati camerali via API (InfoCamere/Registro Imprese, Cerved o aggregatori tipo openapi.it) per precompilare all'onboarding e mantenere aggiornati: anagrafica e sede, codici ATECO, numero addetti, cariche sociali e composizione degli organi (utile ai KPI di governance della PdR 125), unita locali. Principio: MAI chiedere al cliente un dato che una visura sa gia. Il costo per interrogazione entra nei costi variabili per cliente del modello economico. Le interrogazioni a pagamento partono SOLO dopo il pagamento del servizio: mai in fase di anteprima, simulazione o registrazione non pagata. I dati acquistati da provider esterni vanno usati nei limiti di licenza del provider e mai rivenduti come dato grezzo.

**13.8 Mappa delle banche dati (estende la 13.7 — la tesi di innovazione della piattaforma).** L'innovazione di Verzero e la combinazione di automazione AI e banche dati esterne, che abbatte il costo di erogazione rispetto alla consulenza tradizionale. Fonti in tre gruppi:
- Disponibili subito via API commerciali: dati camerali (InfoCamere/Registro Imprese, Cerved, aggregatori) per anagrafica, ATECO, addetti, cariche, unita locali; bilanci depositati in formato XBRL per dati economici, intensita emissive (tCO2e/fatturato) e indicatori VSME.
- Da esplorare per modalita di accesso: GSE (impianti FV e Garanzie d'Origine del cliente), SIAPE (classi energetiche degli immobili), dati ISTAT/Eurostat per ATECO per benchmark settoriali, monitoraggio fonti normative per alimentare registro obblighi di conformita 14001 e scadenzari.
- Base benchmark interna: i dati dei clienti alimentano benchmark proprietari (consumi ed emissioni per settore, dimensione, territorio) ESCLUSIVAMENTE in forma aggregata e anonimizzata; mai dati identificabili di un cliente visibili ad altri; la finalita va dichiarata nell'informativa e nei termini di servizio. Questo asset cresce con ogni cliente ed e il vantaggio competitivo di lungo periodo.

## 14. Principi di esperienza utente (vincoli di progettazione, valgono per ogni modulo)

Obiettivo contrattuale dell'esperienza: chi paga un servizio deve raggiungere il risultato senza impiegare un numero eccessivo di ore di risorse interne e senza mai trovarsi bloccato.

1. **Ogni campo ha una via d'uscita.** Accanto a ogni richiesta dati esistono sempre: "carica un documento" (estrazione AI), "non ho il dato - stimalo" (stima da benchmark per settore/dimensione, proposta e confermata dal cliente), "lo aggiungo dopo" (salvataggio parziale senza perdita). Vietati i campi obbligatori senza fallback.
2. **Qualita del dato dichiarata.** Ogni valore porta un'etichetta: misurato / da documento / stimato. I report espongono la ripartizione per qualita. Per il Sigillo livello 1 e richiesta una soglia minima di dati primari sulle categorie principali; le stime sono ammesse sulle voci minori. Le soglie sono parametri di sistema, non hardcoded.
3. **Budget di effort per modulo (requisito misurabile).** Tempo massimo di lavoro richiesto al cliente, dichiarato in interfaccia e verificato coi piloti: carbon footprint <= 3 ore, VSME <= 4 ore, PdR 125 <= 2 ore + aggregati dal consulente del lavoro. Superamenti sistematici in test = difetto da correggere.
4. **Delega integrata.** Il cliente puo invitare un soggetto esterno (commercialista, consulente) a compilare una singola sezione, con accesso limitato a quella sezione.
5. **Ultimo miglio umano.** Canale "sblocca la pratica": i clienti fermi sullo stesso passaggio oltre una soglia di giorni ricevono contatto proattivo di supporto. Metrica di prodotto principale: tasso di completamento dei percorsi avviati.

## 15. Consenso, trasparenza e modello di servizio uomo+AI

**15.1 Autorizzazione alle interrogazioni (onboarding, fase 1).** Nei termini di servizio accettati alla registrazione il cliente conferisce a Verzero incarico esplicito a interrogare per suo conto banche dati ufficiali e commerciali (elenco delle fonti nell'informativa, aggiornabile). L'accettazione e registrata con timestamp e versione del documento (tabella `consents`: user_id, organization_id, doc_type, doc_version, accepted_at). L'autorizzazione e revocabile dall'area privata; alla revoca la piattaforma continua a funzionare in modalita inserimento manuale. Le nuove versioni dei termini richiedono ri-accettazione tracciata. Testi legali definitivi a cura del legale privacy/ToS.

**15.2 Trasparenza uomo+AI (obbligo AI Act + posizionamento).** L'interfaccia dichiara sempre chi sta operando: le risposte e le elaborazioni automatiche sono etichettate come AI; gli interventi umani (validazione tecnica, revisione, supporto) sono etichettati come effettuati da una persona, con nome o ruolo. Vietato simulare operatori umani con sistemi automatici. I report espongono il marcatore "verificato dal team tecnico" dove la validazione umana e avvenuta (coerente coi criteri del Sigillo, sez. 11).

**15.3 Supporto ibrido.** Primo livello AI in tempo reale (assistente in piattaforma, addestrato su documentazione e stato pratica del cliente); escalation umana garantita con tempi di risposta dichiarati in interfaccia (parametro di sistema, es. entro il giorno lavorativo successivo nell'MVP); canale "sblocca la pratica" (sez. 14.5) presidiato da persone. Il posizionamento pubblico del servizio e: consulenza di nuova generazione — AI per la velocita, persone per la verifica e la responsabilita.

## 16. Metodo di progettazione dei servizi (scheda servizio)

Ogni nuovo servizio, PRIMA dello sviluppo, viene progettato con una scheda in cinque parti. Nessun modulo si costruisce senza la sua scheda approvata.

1. **Riferimento normativo.** Norma/standard che governa il documento di output e struttura che impone (es. ISO 14064-1 per il report GHG, standard VSME per il bilancio, UNI/PdR 125 per le sei aree KPI, struttura HLS punti 4-10 per i sistemi di gestione). Il documento generato segue la struttura della norma, non un formato proprietario. Mai riprodurre testo delle norme (diritto d'autore).
2. **Inventario dei dati.** Elenco completo dei campi richiesti dal documento, sezione per sezione.
3. **Mappa di reperimento.** Per OGNI campo, la gerarchia delle fonti in ordine di preferenza: (a) gia in piattaforma da altro modulo → (b) banca dati esterna → (c) estrazione AI da documento caricato → (d) domanda al cliente → (e) stima da benchmark con etichetta "stimato". La domanda diretta al cliente e sempre l'ultima risorsa. Ogni campo senza fonte (a)-(c) va giustificato.
4. **Punti di verifica umana.** Dove e cosa valida il team tecnico prima dell'emissione.
5. **Budget di effort.** Ore massime richieste al cliente, coerenti con la sezione 14; se la mappa di reperimento non le rispetta, si riprogetta la mappa.

Esempio di mappa di reperimento (estratto, modulo carbon footprint):
| Campo | Fonte primaria | Fallback |
|---|---|---|
| Ragione sociale, ATECO, addetti | (b) Registro Imprese | (d) cliente |
| Fatturato (per intensita emissiva) | (b) bilancio XBRL | (d) cliente |
| Consumo elettrico kWh | (c) bolletta caricata | (e) stima da benchmark ATECO |
| Tipo fornitura (GO / mix) | (c) bolletta | (d) cliente, default mix nazionale |
| Km flotta aziendale | (c) fatture carburante | (e) stima da n. veicoli |
| Fattori di emissione | tabella di sistema (ISPRA/DEFRA) | — mai richiesti al cliente |

Le schede servizio complete vivono nel repository in /docs/schede-servizio/, una per modulo, e sono l'input di lavoro per Claude Code su ogni nuovo modulo.

**13.9 Check-up energetico (efficienza energetica — primo servizio del filone, progettato per il lancio SENZA qualifica ESCo/ETP).**

Scheda servizio (metodo sez. 16):
1. *Riferimento normativo:* nessuna norma cogente governa l'output; il documento e un'analisi tariffaria e dei consumi in linea con le buone pratiche di settore. DISCLAIMER OBBLIGATORIO nel report e nel sito: il check-up NON e una diagnosi energetica ai sensi del D.Lgs. 102/2014 (quella richiede EGE ed e altro servizio in roadmap).
2. *Inventario dati:* consumi mensili e per fasce F1/F2/F3, potenza impegnata e massime potenze prelevate, energia reattiva/penali, oneri e corrispettivi unitari, tipologia contratto e prezzo, eventuale curva di carico quartoraria.
3. *Mappa di reperimento:* bollette gia in piattaforma (estrazione AI, fonte primaria per tutto) → curve di carico caricate dal cliente con wizard guidato al download dal Portale Consumi o dall'area del distributore (facoltative, sbloccano l'analisi avanzata) → delega al distributore per richiesta misure storiche (ponte, ove il processo del distributore lo consenta) → stima del profilo di carico da ripartizione F1/F2/F3 e profili standard di settore, etichettata "stimato". MAI richiesto al cliente cio che e gia in bolletta.
4. *Verifica umana:* il team tecnico valida i risparmi stimati sopra soglia prima dell'emissione del report.
5. *Effort cliente:* zero ore aggiuntive se le bollette sono gia caricate; ~15 minuti per il download facoltativo delle curve.

Output: report con anomalie tariffarie (potenza sovradimensionata, penali reattiva, oneri anomali, fasce sfavorevoli), stima del risparmio annuo in euro, confronto col mercato e azioni ordinate per impatto. Ganci: "scopri se paghi troppo l'energia" (funnel d'ingresso a basso prezzo e alta conversione); il risparmio individuato ripaga il servizio; riusa le bollette gia caricate (zero effort).

Evoluzione (roadmap societaria, post-costituzione): accreditamento al SII e iscrizione all'Elenco Terze Parti (delibere ARERA 158/2024 e 509/2024) — via piu naturale: certificazione ESCo UNI CEI 11352 della societa — per ricevere le curve in automatico su autorizzazione del cliente dal Portale Consumi (finalita "servizi connessi all'energia"), portando il monitoraggio a effort zero. Fino ad allora il servizio opera con le sole strade sopra.

## 17. Documenti pregressi e continuità documentale

Area "Documenti pregressi" nell'area riservata: il cliente carica documentazione gia esistente — bilanci di sostenibilita precedenti, carbon footprint redatti da terzi, diagnosi energetiche, certificati e manuali di sistemi di gestione, report di consulenza. Obiettivo: dare CONTINUITA al set documentale dell'azienda, non ripartire da zero.

Pipeline: upload → classificazione AI del tipo di documento → estrazione del patrimonio riusabile (anno base e perimetro di rendicontazione, metodologie e fattori usati, KPI adottati, valori storici, certificazioni possedute con scadenze, struttura della reportistica) → proposta di riuso nei moduli attivi, SEMPRE con conferma del cliente → i dati ereditati portano l'etichetta di qualita "da documento pregresso".

Effetti sui moduli: il carbon footprint eredita baseline e serie storica (confrontabilita anno su anno); il VSME prosegue con gli stessi indicatori e la stessa impostazione; i manuali di sistema partono dai documenti esistenti aggiornandoli invece di rigenerarli; le certificazioni possedute alimentano un registro certificazioni dell'organizzazione (con scadenze e promemoria di rinnovo). La piattaforma SEGNALA le discontinuita di perimetro o metodo rispetto al pregresso invece di nasconderle.

Estensione dati: `documents.kind` include i tipi pregressi (es. 'legacy_report', 'legacy_certificate', 'legacy_manual', 'legacy_audit'); nuova tabella `org_certifications` (organization_id, standard, ente, numero, data_emissione, scadenza, source_document_id) per il registro certificazioni.

GARANZIA (da esplicitare anche nei termini e nel sito): i documenti caricati dal cliente arricchiscono esclusivamente le elaborazioni DELLA SUA organizzazione; non vengono mai usati per addestrare modelli ne per alimentare output di altri clienti. Resta valida la sola aggregazione anonima per benchmark (sez. 13.8).

Gancio commerciale del modulo: "Non ricominci da zero: porta la tua storia, la continuiamo noi" — risposta diretta all'obiezione di chi ha gia investito in consulenza tradizionale.

## 18. Corner con il consulente — calendario prenotazioni (PREVISTO ORA, OPERATIVO IN FASE SUCCESSIVA)

Sezione "Prenota un corner" nell'area riservata: il cliente fissa appuntamenti di 30 minuti con un consulente del team, scegliendo tra le disponibilita che l'ufficio pubblica internamente. Estende il modello uomo+AI (sez. 15) da reattivo a prenotabile.

**Modello dei consulenti: RETE DI AFFILIATI A CHIAMATA (nessun costo di struttura diretto).** I consulenti tecnici sono professionisti esterni affiliati, compensati a slot erogato: il costo nasce solo quando c'e un corner prenotato (stessa logica dei costi variabili di banche dati e AI). Matrice percorso→qualifica per il matching automatico: sistemi di gestione ISO → consulente SGQ/auditor; UNI/PdR 125 → esperto di parita certificato; energia → EGE; carbon/VSME → esperto di sostenibilita. Requisiti di affiliazione verificati per ambito (titoli, certificazioni, esperienza); valutazione del cliente dopo ogni corner e revoca dell'affiliazione sotto soglia di qualita. Contratti: collaborazione autonoma genuina (mai vincoli assimilabili alla subordinazione); clausole obbligatorie di riservatezza sui dati cliente, non sviamento della clientela (il cliente e di Verzero) e divieto di proporre servizi propri nei corner. Estensione dati: `consultants` acquisisce qualifiche/ambiti, stato affiliazione e rating.

Meccanica: slot da 30 o 60 minuti; le disponibilita sono gestite SOLO dal back-office (pannello interno: consulente, giorni, fasce), mai calendari personali esposti; prenotazione dal cliente con motivo/modulo di riferimento (cosi il consulente arriva preparato sulla pratica); conferma + promemoria email; link videochiamata generato automaticamente; regole di annullamento e gestione no-show (parametri di sistema); ogni corner registrato nello storico della pratica.

Predisposizioni da fare SUBITO (fase 0-3, a costo quasi nullo): tabelle `consultants`, `availability_slots`, `bookings` nello schema (anche vuote); nessun vincolo architetturale che assuma supporto solo asincrono. Implementazione consigliata alla attivazione: valutare integrazione di un motore di scheduling esistente (es. Cal.com, self-hostable) prima di costruirne uno proprio.

Decisione commerciale da prendere all'attivazione (non ora): corner inclusi nei tier Plus / N corner inclusi per modulo / a pagamento singolo. Il costo del tempo consulente e l'unico costo orario umano rilevante della piattaforma: va prezzato o contingentato, mai illimitato gratuito.

## 19. Albo delle Imprese Ver0 e network (PREVISTO ORA, ATTIVO IN SECONDA FASE)

Evoluzione del registro pubblico (sez. 11) in un vero ALBO delle imprese qualificate, con funzioni di network tra i membri. E la forma matura dell'hub: un club di aziende qualificate, non un elenco clienti.

**Ammissione e permanenza:** si entra SOLO con Sigillo attivo (livello 1 o superiore); l'uscita e automatica alla scadenza o revoca del Sigillo. L'albo eredita cosi l'integrita del marchio: chi e dentro, e verificato oggi — non una volta nel passato.

**Funzioni (alla attivazione):** profilo azienda arricchito (ambiti verificati con date, certificazioni possedute dal registro di sez. 17, settore, territorio, presentazione); ricerca e filtri per settore/territorio/ambito; richieste di contatto tra membri (solo opt-in reciproco); vetrina "fornitori qualificati" consultabile dalle capofiliera per la qualifica di filiera (aggancio Scope 3). Fase ulteriore: matchmaking di filiera.

**Predisposizioni da fare SUBITO (a costo quasi nullo):** campo di visibilita del profilo sull'organizzazione (privato di default); opt-in esplicito al network nei consensi (sez. 15.1), distinto e revocabile; i dati esposti nell'albo sono SOLO quelli aziendali gia pubblici sulla pagina di verifica piu quelli che l'azienda sceglie di aggiungere — mai dati di consumo o di dettaglio.

**Attivazione:** alla massa critica (parametro di sistema, es. soglia minima di imprese qualificate per settore/territorio), per evitare l'effetto network vuoto gia deciso come rischio da scongiurare. Fino ad allora: nessuna menzione dell'albo nel marketing ne nel prodotto.

## 20. Osservatorio finanza agevolata (chiave commerciale distintiva)

Sezione dedicata, in due viste: (a) PUBBLICA sul sito — i principali bandi nazionali e regionali attivi negli ambiti Verzero (sostenibilita, efficienza energetica, digitalizzazione, certificazioni, parita di genere), come contenuto di acquisizione; (b) NELL'AREA RISERVATA — vista personalizzata: matching automatico tra bandi e profilo dell'organizzazione (ATECO, regione, dimensione, servizi attivi) con l'indicazione di QUALI servizi Verzero sono rendicontabili su ciascun bando ("questo bando copre fino al X% del modulo Y").

**Pipeline AI (aggiornamento MENSILE):** scansione delle fonti ufficiali (MIMIT, Invitalia, portali bandi regionali, Camere di Commercio, GSE) → estrazione strutturata per ogni bando: beneficiari, territorio, spese ammissibili, intensita di aiuto, scadenza, link al testo ufficiale → classificazione per ambito e mappatura ai servizi Verzero rendicontabili → VALIDAZIONE UMANA del team prima della pubblicazione (un bando sbagliato brucia fiducia) → pubblicazione con data di ultimo aggiornamento visibile.

**Regole:** ogni scheda bando linka SEMPRE il testo ufficiale e riporta il disclaimer che fanno fede esclusivamente i documenti ufficiali dell'ente; le scadenze generano promemoria per i clienti con match attivo; i bandi scaduti escono automaticamente; nessuna promessa di ammissione o esito.

**Dati:** tabella `grants` (ente, titolo, ambiti, territori, dimensioni ammesse, spese ammissibili, intensita, scadenza, url ufficiale, servizi_verzero_rendicontabili, stato, validated_by, updated_at).

**Evoluzione commerciale:** rete di consulenti di finanza agevolata convenzionati per la predisposizione delle domande (stesso schema partner, provvigione ricorrente), attivabile in seconda fase.

**13.10 Filone efficienza energetica — servizi in roadmap oltre il check-up (13.9).**
- *Monitoraggio energetico continuo:* bollette mensili (o curve di carico) → dashboard consumi, alert anomalie, benchmark di settore, intensita energetica; canone ricorrente; alimenta gratis il carbon dell'anno successivo. Le curve arrivano per le vie della 13.9 (upload guidato, delega distributore; ETP in evoluzione societaria).
- *Studio di fattibilita fotovoltaico:* dai consumi reali in piattaforma + superficie disponibile → producibilita (dati pubblici PVGIS), dimensionamento, autoconsumo stimato, tempi di ritorno, confronto acquisto/PPA/noleggio. Evoluzione commerciale: segnalazione qualificata a installatori/ESCo partner.
- *Diagnosi energetica ex D.Lgs. 102/2014:* pre-analisi automatica dalla piattaforma + incarico e firma di EGE convenzionato (schema partner, come i verificatori). Mercato a scadenze quadriennali certe (grandi imprese, energivori).
- *CER (comunita energetiche):* simulazione di fattibilita e incentivi in self-service; costituzione e pratiche tramite partner. Seconda fase.

## Appendice — Indice di controllo del catalogo (per non perdere niente)
Ogni servizio pensato, con il suo stato. Questo indice si AGGIORNA a ogni modifica del catalogo: se un servizio non e qui, e stato perso — segnalarlo.

**MVP (fasi 0-4):** Piattaforma base | Carbon footprint Base e Plus | Bilancio VSME Base e Plus | Rating economia circolare | Pacchetto settore Ho.Re.Ca ("Impatto Menù", "Impatto Soggiorno" — nomi provvisori Verzero, da battezzare col sistema dello zero) | Bundle "Percorso Ver0" | Sigillo Ver0 multi-percorso (sez. 11)
**Cuneo finestra 18 mesi (bassa sovrapposizione, primi verticali sviluppati):** Manuale ISO 9001 | UNI/PdR 125 (sez. 13.6)
**Sistemi di gestione (sez. 13.5):** Famiglia A certificabili: ISO 9001, ISO 14001, ISO 20121 + verticale Ho.Re.Ca: UNI ISO 21401, UNI ISO 13009 + percorso "pronto per i portali" OTA | Famiglia B aderenza (non certificabili): ISO 26000, ISO 20400, UNI ISO 45003, UNI ISO 30415 | Pilastro Social: UNI EN ISO 45001 (famiglia A, DVR escluso), SA8000 (schema accreditato non UNI/ISO) | Posticipate con condizioni di rientro: ISO 45001, ISO 50001
**Sostenibilita roadmap (sez. 13.1-13.4):** Compensazione "contributo climatico" (crediti + GO) | Carbon footprint di prodotto / LCA / ISO 14067 / EPD via partner | Academy formazione | Supporto certificazioni (ISO 14064 di parte terza)
**Efficienza energetica (sez. 13.9-13.10):** Check-up energetico | Monitoraggio continuo | Fattibilita fotovoltaico | Diagnosi ex D.Lgs. 102 con EGE | CER
**Servizi ad alto margine:** Supporto all'audit di certificazione (one shot, 12.N) | Kit Comunicazione Ver0 (claim verificati anti-greenwashing + verifica claim; 12.S)
**Estensioni future dichiarate:** Modello organizzativo ex D.Lgs. 231/01 e altre consulenze specialistiche (12.I)
**Capacita trasversali:** Arricchimento camerale (13.7) | Banche dati e benchmark interno (13.8) | Documenti pregressi e continuita (17) | Corner consulenti affiliati 30/60 min (18) | Albo Imprese Ver0 (19, non esposto fino a massa critica) | Osservatorio finanza agevolata (20)
