# Il Motore Ver0 — architettura

Documento di progettazione, scritto prima del codice. Fase 2, 24 agosto 2026.

Vincolante come `SPEC.md`: chi implementa una parte del Motore parte da
qui. Dove una scelta è aperta, è scritto che è aperta e quali sono le
alternative — non si scopre a metà implementazione.

---

## 0. Che cosa deve fare, in una riga

Prende i documenti che l'impresa ha già, ne estrae dati **verificabili**,
e produce l'elaborato finale conforme alla norma di riferimento, con la
tracciabilità di ogni valore e la validazione di un professionista.

Due parole pesano più delle altre: **verificabili** (§4) e **finale**
(§5). Un motore che estrae numeri senza dire da dove vengono produce un
documento che nessuno può controllare; un motore che si ferma ai dati
lascia al cliente il lavoro per cui ci ha pagato.

---

## 1. Su che cosa si appoggia (già esistente)

Il Motore non parte da zero. Queste fondamenta sono già nel repository e
la progettazione le assume:

| Cosa | Dove | Che cosa dà al Motore |
|---|---|---|
| `documents` | migrazione `hub_documenti` | file, mime, dimensione, `tipo`, `tipo_confermato`, `stato` |
| `company_fields` | migrazione `scheda_impresa` | `provenienza` (`utente`/`motore`), `fonte`, **`stato: da_confermare`**, `confirmed_at` |
| `documenti.ts` | `src/lib/documenti.ts` | tipo documento → destinazioni `{doc, sezione}`: i chip |
| `norme.ts` | `src/lib/norme.ts` | designazione **in vigore** verificata su UNI |
| `bozza.ts` | `src/lib/bozza.ts` | struttura dei documenti generati |
| Storage con RLS di percorso | Supabase | isolamento fra imprese, già coperto da 53 test |

**`company_fields.stato = 'da_confermare'` esiste già**: il requisito
«i valori arrivano in stato da confermare e non entrano nei calcoli
finché il cliente non li conferma» è metà implementato prima di
cominciare. Quello che manca è chi ci scrive dentro.

---

## 2. Due famiglie di documenti (requisito a)

L'astrazione è a tre livelli, e regge l'aggiunta di un tipo senza
toccare la pipeline:

```
tipo documento  →  famiglia  →  schema di estrazione
bolletta_energia   FONTE       SchemaBollettaElettrica
visura             FONTE       SchemaVisura
manuale_9001       OPERA       SchemaManualeSistema
```

### FONTE — si estraggono dati puntuali

Bollette, visure, registri, tabelle, cedolini. L'output è un **oggetto di
campi**, ciascuno con valore, unità, confidenza e provenienza. Alimenta
`company_fields` e le sezioni della bozza.

### OPERA — si estrae struttura

Manuali di sistema, procedure, documenti già redatti. L'output è una
**rappresentazione del documento**: indice, sezioni con i punti di norma
che coprono, designazioni normative citate, responsabilità, procedure
richiamate. Alimenta due cose: l'analisi degli scostamenti rispetto
all'edizione in vigore (percorso «Aggiornamento del Sistema di
Gestione») e la rigenerazione.

### Perché la distinzione è nell'architettura e non nel prompt

Cambia tutto a valle: un documento-FONTE produce righe in
`company_fields`; un documento-OPERA produce un albero e un elenco di
scostamenti. Diverso schema, diversa validazione, diverso posto in
banca dati, diversa faccia nel portale. Trattarli con lo stesso codice
«perché tanto è sempre estrazione» significa scoprire alla terza
famiglia che la pipeline non ci sta.

**Estendere** = aggiungere una voce a `TIPI_DOCUMENTO` con la sua
famiglia e il suo schema Zod. Nessun altro file cambia.

---

## 3. Documenti non nativi digitali (requisito b)

### La decisione: percorso ibrido, deciso dal file

**Non OCR preliminare per tutto. Non lettura multimodale per tutto.**

```
PDF in ingresso
  ├─ ha uno strato di testo?  →  estrai il testo localmente, manda TESTO
  └─ è immagine (scansione/foto)?  →  manda le PAGINE COME IMMAGINI al modello
```

**Perché non OCR preliminare sempre.** Un OCR che sbaglia produce un
errore *invisibile*: il modello riceve «1.2SO kWh» e non ha modo di
sapere che l'originale diceva 1.250. Il modello multimodale guarda la
pagina e vede il contesto — l'etichetta accanto, la colonna, il totale
che deve tornare. Su documenti strutturati come una bolletta, il
contesto vale più della trascrizione. In più un OCR è un componente in
più da installare, aggiornare e sorvegliare.

**Perché non lettura multimodale sempre.** Una pagina immagine costa
circa 1.500–2.000 token; la stessa pagina in testo nativo ne costa
qualche centinaio. Su un PDF nativo mandare l'immagine è pagare tre
volte tanto per un'informazione che il file contiene già in chiaro. E il
testo nativo è **esatto**: non c'è lettura, c'è copia.

**Il rilevamento** è meccanico: si estrae il testo del PDF; se la resa è
sotto una soglia di caratteri per pagina, il PDF è una scansione. La
soglia è un parametro, non una costante sparsa.

### Pre-elaborazione delle immagini

Solo dove serve, e misurata: raddrizzamento (deskew), normalizzazione
del contrasto, ritaglio dei margini, ridimensionamento al limite utile
(oltre una certa risoluzione si pagano token senza guadagnare
accuratezza). Multipagina: una pagina per blocco immagine, mai
concatenate in una sola immagine lunga — si perde il riferimento di
pagina, che serve alla provenienza (§4).

**Rischio dichiarato**: la pre-elaborazione può peggiorare. Un contrasto
spinto su una scansione già pulita mangia i tratti sottili. Regola:
ogni trasformazione è disattivabile per tipo di documento, e si attiva
solo se misurata su casi reali.

### Annotazioni manoscritte — limiti dichiarati

Registri compilati a mano, note a margine, correzioni sopra il
prestampato. Il modello le legge, ma:

> **Regola inviolabile.** Ogni dato letto da manoscritto è marcato a
> confidenza ridotta (`fonte_lettura: "manoscritto"`, confidenza
> massima 0,6 qualunque cosa dica il modello) e **richiede conferma
> esplicita del cliente**. Non entra in nessun calcolo prima della
> conferma, nemmeno provvisoriamente. Nell'interfaccia è marcato come
> tale, non confuso con gli altri campi da confermare.

Il motivo non è tecnico ma di responsabilità: una cifra scritta a mano
letta male produce un documento sbagliato che porta la nostra
validazione. Meglio chiedere una conferma in più che difendere un
numero che non abbiamo davvero letto.

**Limite ulteriore**: se la pagina manoscritta è illeggibile, il campo
resta **vuoto** con la motivazione, e si chiede al cliente di
trascriverlo. Non si tira a indovinare dal contesto.

---

## 4. Affidabilità del dato (requisito d) — regole inviolabili

Queste sei regole non si negoziano con nessuna esigenza di prodotto.

1. **Nessun dato inventato.** Se un campo non è leggibile con certezza,
   resta `null` e porta la ragione. Il prompt lo dice, lo schema lo
   permette (`.nullable()`), la validazione lo pretende. Un campo pieno
   di un valore plausibile è peggio di un campo vuoto: il vuoto si vede,
   il plausibile no.
2. **Ogni valore porta la provenienza**: numero di pagina e, dove
   disponibile, la stringa esatta letta (`estratto_da`). Chi controlla
   deve poter aprire la pagina indicata e trovarci quel numero.
3. **Confidenza per campo**, non per documento. In una bolletta il POD
   può essere certo e il consumo per fascia incerto: una confidenza
   unica media le due cose e nasconde proprio quella che serve.
4. **Stato `da_confermare` sempre**, senza eccezioni per «campi facili».
   `company_fields` lo prevede già. I calcoli leggono solo i
   `confermato`.
5. **Documento non pertinente**: se il file non è del tipo dichiarato,
   se è di un anno fuori dal periodo di rendicontazione, o se è
   illeggibile, il Motore lo **dice** — con il motivo e con che cosa
   fare — invece di estrarre quello che riesce. Un'estrazione parziale
   da un documento sbagliato è la forma più costosa di errore, perché
   sembra un successo.
6. **La validazione è lato server**, con Zod, indipendente da quello che
   il modello promette di restituire. Structured output riduce gli
   errori di forma, non li elimina, e non dice nulla sulla plausibilità:
   un consumo di 4 miliardi di kWh passa qualunque schema.

### Controlli di plausibilità

Oltre allo schema: intervalli per campo (un POD ha 14 caratteri e
comincia per `IT`), coerenza interna (la somma delle fasce deve dare il
totale, entro una tolleranza), coerenza con il periodo dichiarato. Uno
scarto non blocca: **abbassa la confidenza e lo segnala**, perché la
bolletta potrebbe avere ragione e la nostra regola torto.

---

## 5. Generazione dei documenti (requisito e)

Il Motore produce l'elaborato, non solo i dati.

**Struttura**: presa dalla norma di riferimento del servizio — indice,
sezioni obbligatorie nell'ordine che la norma richiede. **La
designazione e l'edizione vengono da `src/lib/norme.ts`**, mai scritte
nel template: è lo stesso registro che il controllo automatico sorveglia,
quindi un documento generato non può citare un'edizione ritirata.

**Contenuti obbligatori** in ogni elaborato: metodologia dichiarata,
perimetro, tracciabilità dei dati con la fonte per valore, dichiarazione
esplicita di ciò che è stimato, pagina di validazione professionale con
nome di chi ha verificato e i rilievi.

**Controllo di conformità prima della consegna** — non un'aspirazione,
un blocco:

```
sezioni_richieste(norma, edizione)  →  presenti nel documento?
    tutte  →  si consegna
    manca  →  NON si consegna: si elenca cosa manca e perché
```

Il controllo vive accanto al registro delle norme, e la lista delle
sezioni richieste è dato, non codice.

**Formati**: PDF impaginato come consegna; **DOCX** dove il cliente deve
poter intervenire (i manuali di sistema, che vivono e cambiano). Il DOCX
non è un ripiego: un manuale che il cliente non può modificare è un
manuale che diventa falso al primo cambio di organigramma.

---

## 6. Personalizzazione grafica (requisito f)

Template **separati dai contenuti**: il contenuto è dato, il template è
presentazione. Cambiare il marchio di un'impresa non deve toccare una
riga di contenuto.

Impostazioni memorizzate a livello di **organizzazione** e riusate su
tutti i suoi documenti: logo, colori, intestazione, piè di pagina, dati
identificativi.

**Controlli sul logo**: formato (PNG/SVG/JPG), risoluzione minima per la
stampa, sfondo (un logo su fondo bianco dentro un'intestazione colorata
è un rettangolo bianco). Se il logo non passa i controlli, si dice cosa
non va — non lo si usa lo stesso.

**Colori con contrasto verificato**: la selezione del colore sociale
calcola il contrasto sul testo che ci finirà sopra e **rifiuta** le
combinazioni sotto soglia. Un documento che va in stampa e all'audit non
può avere un titolo illeggibile perché il verde aziendale è bello a
schermo. La stessa funzione di contrasto che usiamo per il logotipo del
sito.

**Anteprima prima della generazione**, e **impostazione neutra
predefinita**: chi non carica niente ottiene un documento professionale,
non un documento con un buco al posto del logo.

---

## 7. Volumi (requisito c)

**Due corsie, non una.**

| Corsia | Quando | Come |
|---|---|---|
| **Interattiva** | il cliente ha appena caricato un file e sta guardando | chiamata diretta, avanzamento onesto in pagina |
| **Massiva** | dodici bollette insieme, rielaborazioni, rigenerazioni | **Batch API** — asincrona, metà del costo |

La corsia massiva usa il Batch API di Anthropic: costa il 50% e non
tiene occupata nessuna funzione. I risultati **arrivano in ordine
qualsiasi** e si riconoscono dal `custom_id` — mai per posizione.

**Coda e idempotenza**: tabella `motore_lavori` con stato, tentativi,
`chiave_idempotenza` (documento + versione dello schema): rilanciare un
lavoro già fatto non lo rifà e non ripaga. Ritentativi con arretramento
esponenziale sui soli errori ritentabili (429, 5xx, rete); mai su 400,
che è un difetto nostro e va visto.

**Limiti duri**, dichiarati e verificati prima della chiamata: 32 MB per
richiesta e 600 pagine sono i limiti dell'API; i nostri sono più bassi e
stanno in un solo posto. Documenti lunghi: segmentazione per pagine con
ricucitura dei risultati.

**Tetto di spesa per pratica**: prima di ogni chiamata si conta il costo
previsto (`messages.count_tokens`) e lo si somma allo speso della
pratica. Superata la soglia, il lavoro si ferma e **allarma** invece di
continuare a spendere. Una pratica che costa dieci volte le altre è
quasi sempre un difetto, non un cliente complicato.

**Registro tecnico** — tabella di solo back-office, una riga per
chiamata: documento, modello, token in/out, esito, durata, costo
stimato. Serve a tre domande che senza registro non hanno risposta:
quanto ci costa davvero una pratica, quale tipo di documento fallisce
più spesso, se un cambio di prompt ha peggiorato le cose.

---

## 8. Tracciabilità e versioni (requisito g)

Ogni documento generato è una **riga versionata**: versione, data, anno
di rendicontazione, **edizioni delle norme usate** (copiate al momento
della generazione, non risolte a posteriori), elenco delle fonti dei
dati, stato di validazione, chi ha validato.

Copiare le edizioni invece di puntarle è deliberato: fra un anno il
registro dirà un'altra cosa, e il documento deve continuare a dichiarare
su quale edizione **è stato costruito**.

**Rigenerabile** quando cambiano i dati o le norme. È il meccanismo che
rende vera la promessa «i documenti non invecchiano nel cassetto» — e
che alimenta il mantenimento del percorso di aggiornamento.

---

## 9. Le scelte sul modello

### Modello predefinito: `claude-opus-5`

Il codice usa **`claude-opus-5`**. Non è una scelta di comodo: su
documenti storti — scansioni, tabelle disallineate, prestampati con
correzioni a mano — la differenza fra un modello e l'altro non è
stilistica, è il numero di campi che tornano giusti. E un campo
sbagliato costa più di qualunque risparmio: passa in un documento che
porta la nostra validazione.

**Scendere di modello per costo è una decisione del fondatore, non
un'ottimizzazione da fare in silenzio.** I numeri per deciderlo stanno
qui sotto.

### Costo per pratica (calcolato, non stimato a occhio)

Pratica tipo: 12 bollette scansionate (2 pagine), 3 documenti nativi,
generazione dell'elaborato finale.

| Modello | Bolletta scansione | Bolletta nativa | Generazione | **Pratica** | In batch |
|---|---|---|---|---|---|
| Opus 5 | $0,04 | $0,03 | $0,48 | **~$1,05** | ~$0,53 |
| Sonnet 5 | $0,02 | $0,02 | $0,28 | ~$0,63 | ~$0,32 |
| Haiku 4.5 | $0,01 | $0,01 | $0,10 | ~$0,21 | ~$0,11 |

Prezzi listino Anthropic al 24 agosto 2026 ($5/$25 per milione di token
su Opus 5; Sonnet 5 in promozione a $2/$10 fino al 31 agosto 2026).

**La conclusione che conta**: contro un canone da 45 €/mese, un euro di
modello per pratica **non è la voce che decide la marginalità**. Il
costo del Motore non è l'inferenza: è il tempo del professionista che
valida. Ottimizzare il modello prima di aver misurato il resto è
ottimizzare la voce sbagliata.

### Struttura della risposta

Structured output (`output_config.format`) più **validazione Zod lato
server**: la prima riduce gli errori di forma, la seconda è quella di
cui ci fidiamo.

**Vincolo tecnico dichiarato**: le *citations* native dell'API — che
darebbero la pagina di provenienza gratis — **non sono compatibili con
`output_config.format`** (l'API risponde 400). Per questo la provenienza
è un **campo dello schema** che il modello compila, non una funzione
dell'API. È una scelta obbligata, non preferita: se un domani le due
cose diventeranno compatibili, la provenienza nativa è più affidabile di
quella dichiarata dal modello, e vale la pena tornarci.

### Ragionamento ed effort

Su Opus 5 il ragionamento è attivo di default. Per l'estrazione si usa
`output_config.effort` basso o medio — è un compito di lettura, non di
ragionamento — e si alza solo per i documenti-OPERA, dove il lavoro è di
analisi. **Non si disattiva il ragionamento**: su Opus 5 ha due modi di
fallire noti, e abbassare l'effort ottiene lo stesso risparmio senza
rischi.

---

## 10. Rischi dichiarati

| Rischio | Perché | Come lo teniamo |
|---|---|---|
| **Manoscritto** | accuratezza non garantita, e nessuno può garantirla | confidenza massima 0,6, conferma obbligatoria, mai nei calcoli |
| **Scansioni di bassa qualità** | foto storte, ombre, fuori fuoco, fax | rilevamento qualità, e se sotto soglia si CHIEDE un file migliore invece di estrarre |
| **Bollette di fornitori nuovi** | ogni fornitore impagina a modo suo | lo schema è per contenuto, non per posizione; i casi che falliscono diventano prove |
| **Deriva silenziosa del prompt** | una modifica migliora un caso e ne peggiora dieci | insieme di prove con documenti reali, eseguito prima di ogni modifica al prompt |
| **Costo fuori controllo** | un PDF di 400 pagine caricato per sbaglio | limiti duri prima della chiamata, tetto per pratica, allarme |
| **Dipendenza da un fornitore** | il Motore è la nostra proprietà, l'inferenza no | schemi e validazione sono nostri e indipendenti; cambia il chiamante, non l'impianto |
| **Attese lunghe** | un documento lungo può richiedere minuti | corsia massiva asincrona, avanzamento onesto, mai una schermata che finge |

---

## 11. Che cosa si implementa, in che ordine

1. **Bolletta elettrica** (la prima tappa): schema, rilevamento
   nativo/scansione, estrazione, validazione, confidenza, provenienza,
   `da_confermare`, effetto visibile nel portale. Prove con risposte
   simulate e casi storti, poi con una bolletta vera.
2. Gli altri documenti-FONTE: visura, bilancio, registri carburante.
3. Coda, corsia massiva, registro tecnico e tetto di spesa — quando i
   volumi lo giustificano, non prima.
4. Generazione dell'elaborato con controllo di conformità.
5. Personalizzazione grafica.
6. Documenti-OPERA e analisi degli scostamenti (percorso
   «Aggiornamento del Sistema di Gestione»).

L'ordine non è negoziabile su un punto: **la tappa 1 arriva fino al
portale**. Un'estrazione che funziona nei test e non si vede in pagina
non è una tappa completata — è codice che nessuno ha ancora usato.
