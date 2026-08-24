# Il Motore Ver0 — architettura

Documento vincolante, scritto prima del codice. Descrive **cosa legge** il
Motore, **come lo legge**, **cosa gli è vietato fare**, **cosa produce** e
**come si dimostra** che ciò che ha prodotto è vero.

Ogni scelta tecnica porta la sua motivazione e ogni rischio è dichiarato:
una scelta senza motivazione non si può rivedere, e un rischio non scritto
si scopre in produzione. Sintesi in `SPEC.md` §6. Dove questo documento
contrasta con `CLAUDE.md`, vince `CLAUDE.md`.

Riscritto e verificato il **24 agosto 2026**.

---

## 0. Che cosa deve fare, in una riga

Il cliente porta i documenti che ha già; il Motore li legge, ne ricava dati
**tracciabili**, e con quei dati compone l'elaborato **finale** conforme
alla norma del percorso — col marchio dell'impresa, versionato,
rigenerabile.

Le due parole pesanti sono *tracciabili* (§4) e *finale* (§5). Un motore che
estrae numeri senza dire da dove vengono produce un documento che nessuno
può controllare; un motore che si ferma ai dati lascia al cliente
esattamente il lavoro per cui ci ha pagato.

Ne discendono tre obblighi che valgono su tutto il resto:

1. **Il dato ha sempre una provenienza.** Un numero senza documento e senza
   pagina non è un dato: è un'affermazione.
2. **Il cliente conferma prima che il dato conti.** Niente entra in un
   calcolo o in un elaborato senza un gesto umano registrato.
3. **Il Motore dichiara ciò che non sa.** Un campo vuoto con la ragione
   scritta vale più di un campo pieno di cui nessuno risponde.

---

## 1. Su che cosa si innesta (esiste già)

Il Motore non introduce un'architettura parallela: si innesta su pezzi che
sono già nel repository e già coperti dai controlli.

| Pezzo | Dove | Cosa dà al Motore |
|---|---|---|
| Archivio documenti | `documents` + bucket `documenti` | file privato per organizzazione, RLS sulla cartella |
| Riconoscimento del tipo | `src/lib/documenti.ts` | tipo dedotto dal **nome** del file, con soglia di prudenza |
| Smistamento | `TIPI_DOCUMENTO[].destinazioni` | tipo → documento prodotto → sezione: i chip «alimenta …» |
| Scheda impresa | `company_fields` | `provenienza` (utente\|motore), `fonte`, **`stato: da_confermare`**, `confirmed_at` |
| Arricchimento da banche dati | `src/lib/arricchimento/` | il precedente: scrive già con `provenienza: 'motore'` e stato `da_confermare` |
| Bozza e anello | `src/lib/bozza.ts` | sezioni con stato **pesato**: l'anello sale quando lo stato sale |
| Registro delle norme | `src/lib/norme.ts` | designazione ed edizione **in vigore**, verificate su UNI |

Due conseguenze pratiche. La prima: il requisito «i valori arrivano in stato
da confermare e non entrano nei calcoli finché il cliente non li conferma» è
**metà implementato prima di cominciare** — manca chi ci scrive dentro. La
seconda: la lettura del contenuto è esattamente il gradino che oggi manca
fra «il file è arrivato» e «la sezione è compilata».

---

## 2. (a) Due famiglie di documenti in ingresso

Un documento entra in una delle due famiglie. La famiglia decide il tipo di
lavoro, non il tipo di file: un PDF può stare di qua o di là.

### FONTE — se ne estraggono dati puntuali

Bollette, visure, registri, tabelle, fatture, MUD, cedolini aggregati. Il
documento **contiene numeri e identificativi** che finiscono in una sezione
dell'elaborato. L'uscita è un insieme di campi tipizzati, ciascuno con
valore, unità, confidenza e provenienza.

### OPERA — se ne estrae la struttura

Manuali di sistema, procedure, politiche, DVR, documenti già redatti da
altri. Il documento **è già un elaborato**: non ci servono i suoi numeri, ci
serve com'è fatto. L'uscita è una struttura: indice e gerarchia delle
sezioni, designazioni normative citate con edizione, ruoli e responsabilità
nominati, procedure richiamate.

Serve a due cose che il catalogo vende già:

- **analisi degli scostamenti** — quali sezioni richieste dalla norma
  vigente mancano, quali designazioni citate risultano ritirate. Il
  confronto lo fa `src/lib/norme.ts`, la stessa fonte del controllo gratuito
  pubblico e dello script di sorveglianza: una verità sola;
- **rigenerazione** — riscrivere il manuale sull'edizione in vigore
  conservando i contenuti propri dell'impresa. È il servizio «Aggiornamento
  del Sistema di Gestione», e senza la famiglia OPERA non esiste.

### Due FORME, dentro le famiglie

La bolletta ci ha ingannati: è una **scheda**, un insieme di campi fissi.
Ma la maggior parte dei documenti che una PMI ha in casa è una **tabella**
— un registro di formazione con venti partecipanti, i dati di organico per
genere e inquadramento, un organigramma con quindici ruoli, un registro di
manutenzione con trenta interventi. Righe ripetute della stessa forma.

| Forma | Che cos'è | Esempi |
|---|---|---|
| **scheda** | campi fissi, una volta sola | bolletta, visura, autorizzazione |
| **tabella** | N righe della stessa forma | formazione, organico, organigramma, manutenzione |

Trattare una tabella come scheda significa inventare chiavi
(«partecipante1», «partecipante2») o perdere tutte le righe dopo la prima.
La forma non è un dettaglio di implementazione: cambia lo schema, cambia
la banca dati (`document_fields.riga`) e cambia soprattutto **come si
conferma**, che è dove si gioca l'usabilità (§3).

### L'astrazione: tipo → famiglia → forma → schema

```
TipoDocumento.chiave    →   famiglia   →   forma      →   schema
"bolletta-elettrica"    →   fonte      →   scheda     →   si legge
"visura"                →   fonte      →   scheda     →   si legge
"organico"              →   fonte      →   tabella    →   si legge
"formazione"            →   fonte      →   tabella    →   si legge
"organigramma"          →   opera      →   tabella    →   si legge
"manuale-sistema"       →   opera      →   tabella    →   dichiarato
```

**La mappa completa dei venti tipi — famiglia, forma, cosa si estrae,
percorsi serviti, attesa di qualità — sta in
`docs/tassonomia-documentale.md`, ed è GENERATA dal registro**
(`node --import ./scripts/risolutore-ts.mjs scripts/mappa-documentale.mjs`).
Non si scrive a mano: una mappa scritta a mano diverge al primo tipo
aggiunto, e una mappa che mente è peggio di nessuna mappa. Il controllo
`--controlla` fallisce se il file su disco non è allineato al codice.

Il registro vive in `src/lib/motore/famiglie.ts` ed è **una riga per tipo**.
Aggiungere un tipo significa: dichiararlo in `src/lib/documenti.ts` (dove già
dice a quale sezione alimenta), scrivere il suo schema Zod, aggiungere la
riga. Nessun ramo condizionale da toccare altrove — il motore di estrazione
**riceve** lo schema, non lo conosce.

### Perché la distinzione sta nell'architettura e non nel prompt

Cambia tutto a valle: FONTE produce righe di campi con confidenza e pagina;
OPERA produce un albero e un elenco di scostamenti. Diverso schema, diversa
validazione, diverso posto in banca dati, diversa faccia nel portale.
Trattarli con lo stesso codice «perché tanto è sempre estrazione» significa
scoprire alla terza famiglia che la pipeline non ci sta.

I tipi **senza schema** non sono un errore: restano archiviati e smistati
come oggi — il chip «alimenta …» funziona già — semplicemente non vengono
letti. È la condizione di partenza di tutti tranne uno, e va detta al
cliente invece di lasciargli credere il contrario.

**Rischio dichiarato.** OPERA ha uno schema molto più libero di FONTE:
«l'indice di un manuale» non ha forma canonica, e il rischio è una struttura
plausibile ma non corrispondente al documento. Mitigazione: ogni sezione
estratta porta la **pagina** e il titolo **così come compare**, e l'analisi
degli scostamenti si mostra sempre affiancata all'originale, mai da sola.

---

## 3. (b) Documenti non nativi digitali

### Il bivio, e come lo si riconosce

Un PDF può essere due cose molto diverse: un documento con **strato di
testo** (generato da un gestionale) o un'**immagine dentro un contenitore
PDF** (una scansione, o una foto salvata in PDF). La differenza cambia
costo, accuratezza e limiti, e va riconosciuta prima di spendere.

Il rilevamento è locale e non costa nulla: si decomprimono i flussi di
contenuto e si cercano gli operatori di testo (`Tj`, `TJ`, `'`, `"`); sopra
una soglia di caratteri per pagina il documento è nativo, sotto è una
scansione. Il numero di pagine si legge dall'albero delle pagine. Nessuna
dipendenza esterna: `zlib` è nel runtime di Node.

La soglia è un parametro in un posto solo, ed è **prudente**: nel dubbio si
tratta il file come scansione. Trattare un nativo come scansione costa
qualche centesimo in più; trattare una scansione come nativo significa
mandare al modello una pagina vuota e ricevere «non leggibile» su tutto.

### La scelta: lettura diretta dal modello, non OCR preliminare

**Non OCR nostro. Nessuna rasterizzazione nostra.** Il PDF si invia
all'API **così com'è**, come blocco `document`, e la fotografia come blocco
`image`. Il rilevamento nativo/scansione resta e conta, ma non decide *come*
si manda il file: decide **come si tratta il risultato**.

```
PDF in ingresso
 ├─ ha strato di testo   →  blocco `document`; provenienza «testo»
 └─ è immagine           →  blocco `document`; provenienza «immagine»,
                            attesa di confidenza più bassa, avviso qualità
Fotografia (JPEG/PNG)    →  blocco `image`;    provenienza «immagine»
```

**Perché non OCR preliminare.** Un OCR restituisce una sequenza di caratteri
e perde la struttura: nella tabella delle fasce F1/F2/F3 di una bolletta
italiana i numeri arrivano a valle senza le loro etichette, e il modello
deve indovinare l'accoppiamento. Peggio: un OCR che sbaglia produce un
errore **invisibile** — chi legge «1.2SO kWh» non ha modo di sapere che
l'originale diceva 1.250. Il modello multimodale guarda la pagina e vede il
contesto: l'etichetta accanto, la colonna, il totale che deve tornare. Su
documenti dove il significato sta nella posizione, il contesto vale più
della trascrizione. E un OCR è un secondo sistema da mantenere e da
incolpare: quando il dato è sbagliato bisogna stabilire chi ha sbagliato fra
i due.

**Perché non estraiamo noi il testo del PDF nativo.** Sarebbe l'ottimizzazione
ovvia — una pagina-immagine costa circa 1.500–2.000 token, la stessa pagina
in solo testo qualche centinaio — e la scartiamo **per ora**, con una
ragione precisa: estrarre testo da un PDF in modo affidabile significa
gestire codifiche, font sottoinsiemati e CID, e ricostruire le colonne. Un
estrattore fatto in casa restituisce la tabella delle fasce come una colonna
di numeri senza etichette: lo stesso difetto dell'OCR, ottenuto in proprio.
E il lato server dell'API il testo lo estrae già, tenendosi la pagina.

Resta un'ottimizzazione **misurabile e rimandata** — e la misura del §7 le
ha già tolto quasi tutto l'interesse: una pagina mandata come immagine è
costata *meno* della stessa pagina mandata come PDF nativo, perché il PDF
porta con sé sia il testo sia la pagina. Il risparmio atteso, insomma, non
c'era. Se un giorno i volumi lo giustificheranno si valuterà una libreria
PDF vera, confrontando accuratezza e costo sui documenti veri col log
tecnico. Non prima: risparmiare token peggiorando la lettura è il modo
sbagliato di risparmiare.

**La pre-elaborazione non la facciamo noi.** Raddrizzamento, contrasto e
resa delle pagine sono gestiti dal lato server dell'API. Scrivere una
pipeline di immagini nostra — deskew, soglia, ritaglio, ridimensionamento —
sarebbe lavoro duplicato, un'altra cosa che si rompe, e soprattutto un altro
posto dove **si può peggiorare**: un contrasto spinto su una scansione già
pulita mangia i tratti sottili, e un ritaglio automatico che sbaglia taglia
via un pezzo di documento senza dirlo. Il danno silenzioso è quello che
questo prodotto non si può permettere.

Quel che resta a carico nostro, lato client e prima del caricamento, è poco
e onesto: limite di dimensione, formati ammessi, e l'avviso che una foto
storta o sfocata si legge peggio. Se una foto è illeggibile si chiede di
rifarla: costa dieci secondi al cliente e non inventa niente.

**Multipagina**: la provenienza è per pagina, quindi le pagine non si
concatenano mai in un'unica immagine lunga — si perderebbe il riferimento di
pagina, che è metà della tracciabilità (§4.2).

**Limiti di ingresso**, dichiarati e verificati prima della chiamata: 20 MB
per file (limite del bucket), 100 pagine per richiesta di lettura, 30 MB di
documento verso l'API. Sono più bassi dei limiti dell'API (32 MB, 600
pagine) e stanno in un posto solo. Oltre: segmentazione (§7).

### Annotazioni manoscritte — regola inviolabile

Registri compilati a mano, note a margine, correzioni sopra il prestampato:
il Motore deve reggerli, e li regge male. È una constatazione, non una
previsione: la grafia varia per persona, le cifre 1/7, 4/9, 0/6 si
confondono, e un errore su una cifra è un errore di un ordine di grandezza.

> **Regola inviolabile.** Ogni dato letto da manoscritto è marcato
> `fonteLettura: "manoscritto"`, riceve **confidenza massima 0,6** qualunque
> cosa dica il modello, e **richiede conferma esplicita del cliente**. Non
> entra in nessun calcolo prima della conferma, nemmeno provvisoriamente.

In dettaglio, e senza eccezioni:

1. **Il tetto di confidenza lo impone il nostro codice** dopo la
   validazione, non il prompt. Una regola affidata alle istruzioni è una
   regola che il modello può disattendere.
2. **Nessun automatismo può confermarlo.** Nessuna modalità «conferma tutto»,
   presente o futura, può includere valori manoscritti.
3. **Illeggibile è un esito, non un fallimento.** Se la grafia non si legge,
   il campo resta vuoto con la ragione scritta e la pagina indicata, e il
   cliente lo compila a mano **vedendo l'immagine accanto**. Non si tira a
   indovinare dal contesto.
4. **La provenienza si vede.** In portale il manoscritto ha un'etichetta
   propria — «letto da una scrittura a mano: controlla» — e non è una
   sfumatura di grigio fra i campi da confermare: è un avviso.

Il motivo non è tecnico ma di responsabilità: una cifra scritta a mano letta
male produce un documento sbagliato **che porta la nostra validazione**.

### Il manoscritto è un CASO NORMALE, non un degrado

Registri di manutenzione, fogli firma, verbali: in una PMI italiana il
manoscritto non è l'eccezione, è metà dell'archivio. Le regole qui sopra
non si toccano — tetto di confidenza e conferma obbligatoria restano — ma
c'è un secondo problema, e ignorarlo le renderebbe inutili:

> **Se confermare venti righe costa venti viaggi fra lo schermo e il
> foglio, nessuno lo fa. E una regola che nessuno rispetta non protegge
> nessuno.** La conferma obbligatoria si difende rendendola VELOCE, non
> alleggerendola.

L'obiettivo dichiarato: **confermare venti righe scritte a mano deve
costare un minuto, non venti.** Come:

1. **Il documento sta accanto**, sempre, e si apre da solo sulla pagina
   della riga in corso. Nessuna finestra da cercare, nessuno zoom da
   rifare.
2. **Una riga alla volta**, grande, con accanto la riga **così com'è
   scritta sul foglio** (`estrattoDa`): il confronto è un colpo d'occhio.
3. **La tastiera basta**: Invio conferma e passa avanti, `E` corregge,
   `X` scarta, `↑ ↓` si muovono. Venti righe diventano venti battute.
4. **L'interfaccia avanza subito** e il salvataggio la insegue: aspettare
   il server a ogni riga trasformerebbe un minuto in cinque.
5. **Avanzamento visibile**: si vede quanto manca, e si vede che finisce.
6. **Il blocco «conferma quelle che tornano» esiste, e NON tocca il
   manoscritto**: conferma solo le righe lette in chiaro, senza avvisi e
   sopra la soglia di confidenza. Le righe a mano restano una per una, e
   la schermata lo dice — «una grafia non la conferma un automatismo».

Vive in `src/app/(app)/dashboard/documenti/[id]`.

**Rischio dichiarato.** Su registri interamente manoscritti — registri
rifiuti a penna, quaderni di manutenzione — l'accuratezza attesa non è
sufficiente a un uso non sorvegliato. Non lo si compensa con tecnologia: lo
si compensa dicendolo, e progettando la conferma perché mostri l'immagine
accanto al campo. Se un cliente porta solo registri manoscritti, il tempo
che risparmia è meno di quanto una vetrina entusiasta lascerebbe intendere:
la vetrina non deve lasciarlo intendere.

### Qualità della scansione

Il modello dichiara la qualità percepita come **campo del risultato**
(`leggibile` | `faticosa` | `illeggibile`), non come prosa da interpretare.

- `illeggibile` → non si scrive nessun campo: si registra l'esito e si dice
  cosa fare (rifare la foto con più luce, o inviare il PDF originale).
- `faticosa` → la confidenza di tutti i campi viene abbassata di 0,2 dal
  nostro codice, e l'avviso compare in portale.

---

## 4. (d) Affidabilità del dato — le sei regole inviolabili

Stanno prima di ogni ottimizzazione. Se una funzionalità le contraddice, si
toglie la funzionalità.

1. **Nessun dato inventato.** Se un campo non è leggibile con certezza resta
   **vuoto**, con la ragione. Il prompt lo impone, lo schema lo permette
   (`nullable`), la validazione lo pretende. Un campo pieno di un valore
   plausibile è peggio di un campo vuoto: il vuoto si vede, il plausibile no
   — e finisce in un documento che il cliente porta in banca.
2. **Ogni valore porta la sua provenienza**: documento, **pagina**, e il
   frammento di testo da cui è stato ricavato (`estrattoDa`). Chi controlla
   deve poter aprire la pagina indicata e trovarci quel numero.
3. **Confidenza per campo, non per documento.** In una bolletta il POD si
   legge benissimo e il consumo per fascia sta in una tabella storta: una
   confidenza unica media le due cose e nasconde proprio quella che serve.
4. **Stato «da confermare», sempre**, senza eccezioni per i campi facili.
   Non entra in nessun calcolo, non compare in nessun elaborato, **non fa
   salire l'anello a peso pieno** finché il cliente non conferma. La
   conferma è un gesto umano registrato con data: è anche il posizionamento
   legale del prodotto — l'AI assiste, il cliente valida.
5. **Documento sbagliato: lo si dice.** Tre casi distinti, tre messaggi
   distinti, mai un errore generico:
   - **altro tipo** («questa è una bolletta del gas, non elettrica») → si
     propone di riclassificarlo, e non lo si legge col prompt sbagliato;
   - **illeggibile** → si dice cosa fare per rimediare;
   - **fuori dall'anno di rendicontazione** → il dato si estrae lo stesso
     (è un documento vero) ma si segnala che il periodo non rientra
     nell'anno dichiarato, e non alimenta l'elaborato di quell'anno.

   Un'estrazione parziale da un documento sbagliato è la forma più costosa
   di errore, perché sembra un successo.
6. **La validazione è nostra, non del modello.** Lo schema Zod gira **lato
   server** sul JSON ricevuto, indipendentemente dal fatto che la risposta
   sia stata generata con vincolo di formato: il vincolo riduce gli errori di
   forma, non li elimina, e non dice **nulla** sulla plausibilità — un
   consumo di quattro miliardi di kWh passa qualunque schema.

### Controlli di plausibilità

Dopo la forma, il senso: un POD ha una forma nota (`IT` + 3 cifre + `E` +
8 caratteri), un periodo non finisce prima di iniziare, un consumo non è
negativo né di sei ordini di grandezza fuori scala, la somma delle fasce
deve dare il totale entro una tolleranza, l'importo deve stare in un
rapporto sensato col consumo.

Uno scarto **non blocca e non si scarta in silenzio**: abbassa la confidenza
e si segnala con l'avviso in chiaro — perché la bolletta potrebbe avere
ragione e la nostra regola torto.

---

## 5. (e) Generazione dei documenti

Il Motore produce l'elaborato, non solo i dati. Questa parte è progettata
qui e implementata dopo l'estrazione (§11): senza dati veri non c'è niente
da impaginare.

### La struttura viene dalla norma, non dal gusto

Ogni servizio dichiara il proprio **modello di elaborato**: indice, sezioni
obbligatorie nell'ordine che la norma richiede, sezioni condizionali, e per
ciascuna la fonte dei contenuti. Il modello è **dato, non codice**: si rivede
senza toccare il generatore.

Ogni elaborato contiene, per costruzione:

- **riferimenti normativi con designazione ed edizione VIGENTE**, presi da
  `src/lib/norme.ts` — mai scritti a mano nel modello. È lo stesso registro
  che `scripts/controllo-norme.mjs` sorveglia, quindi un documento generato
  non può citare un'edizione ritirata;
- **metodologia dichiarata**: come sono stati ottenuti i numeri, quali
  fattori, quale fonte dei fattori;
- **tracciabilità di dati e fonti**: per ogni valore, documento di
  provenienza, pagina, data di conferma;
- **dichiarazione esplicita di ciò che è stimato**;
- **pagina di validazione professionale**: chi ha validato, quando, con
  quale titolo, e i rilievi. Se la validazione non c'è, la pagina dice che
  manca — non si stampa vuota.

### Il controllo di conformità è bloccante

```
sezioni_richieste(norma, edizione)  →  presenti e piene nel documento?
    tutte  →  si consegna
    manca  →  NON si consegna: si elenca cosa manca e come rimediare
```

Verifica: presenza di **tutte** le sezioni obbligatorie; che nessuna
contenga solo segnaposto; che ogni designazione citata risulti **in vigore**
nel registro; che ogni valore numerico riportato abbia fonte tracciata e
stato `confermato`; che l'anno di rendicontazione sia coerente fra
copertina, dati e periodi dei documenti di origine.

Una consegna con una sezione mancante è peggio di una consegna in ritardo,
perché il cliente se ne accorge in audit.

### Formati

**PDF impaginato** sempre: è il documento che si porta. **DOCX modificabile**
dove il cliente deve poterci mettere le mani — manuali di sistema e
procedure, che vivono e cambiano in azienda. Un manuale che il cliente non
può modificare diventa falso al primo cambio di organigramma. Non per il
Carbon Footprint né per i bilanci: un documento di rendicontazione
modificabile dopo l'emissione perde la sua tracciabilità.

**Rischio dichiarato.** PDF e DOCX dallo stesso modello di contenuto
richiedono un generatore che tratti il contenuto come dato strutturato e
l'impaginazione come resa — la stessa disciplina di «adattare, non
degradare» applicata ai documenti. La scorciatoia (generare HTML e
stamparlo) produce un PDF accettabile e un DOCX inutilizzabile.

---

## 6. (f) Personalizzazione grafica per cliente

I **modelli sono separati dai contenuti**: il modello dice dove va cosa, il
contenuto non sa come sarà impaginato. Cambiare veste non tocca i dati, e
rigenerare con la veste nuova non cambia i numeri.

Le impostazioni di marchio stanno a livello di **organizzazione** e si
riusano su tutti i suoi documenti: si impostano una volta.

- **Logo** caricato dal cliente, con controlli su formato (PNG, SVG, JPEG),
  risoluzione minima per la stampa e sfondo. Un logo bianco su fondo
  trasparente sparirebbe su carta bianca, uno su fondo bianco dentro
  un'intestazione colorata è un rettangolo: lo si rileva e lo si **dice**,
  invece di usarlo lo stesso.
- **Colori sociali con contrasto verificato** — la stessa funzione di
  contrasto usata per il logotipo del sito, applicata al testo che ci
  finirà sopra e alla resa in stampa. Un colore che non passa non viene
  rifiutato in blocco: viene usato solo dove non porta testo (filetti,
  riquadri), e lo si dice. Un documento che va all'audit non può avere un
  titolo illeggibile perché il verde aziendale è bello a schermo.
- **Intestazioni e piè di pagina**: ragione sociale, partita IVA, anno di
  rendicontazione, numero di pagina, riferimento della versione (§8).
- **Anteprima prima della generazione**: la prima pagina e una pagina
  interna, col marchio applicato.

**Impostazione neutra predefinita**: senza logo e senza colori il documento
resta professionale — tipografia del prodotto, nessun rettangolo vuoto,
nessun «il tuo logo qui». Un documento neutro ben fatto è meglio di un
documento brandizzato male, e la maggioranza dei clienti non caricherà nulla.

---

## 7. (c) Volumi, coda, costi

### Due corsie, non una

| Corsia | Quando | Come |
|---|---|---|
| **Interattiva** | il cliente ha appena caricato e sta guardando | chiamata singola, avanzamento onesto in pagina, esito in pochi secondi |
| **Differita** | dodici bollette insieme, riletture dopo un cambio di schema, arretrati | coda con parallelismo controllato; per i lotti la **Batch API**, che costa la metà |

La differenza la fa **chi sta aspettando**. Un cliente davanti allo schermo
merita una risposta subito e paga il prezzo pieno; venti documenti riletti
stanotte non hanno nessuno che aspetta. I risultati della corsia differita
arrivano in **ordine qualsiasi** e si riconoscono dal `custom_id` — mai per
posizione.

### La coda

Tabella `motore_lavori`: documento, tipo di lavoro, stato
(`in_attesa` | `in_corso` | `fatto` | `fallito`), tentativi, prossimo
tentativo, chiave di idempotenza.

- **Idempotenza**: la chiave è `(document_id, tipo_lavoro, versione_schema)`.
  Lo stesso documento non si rilegge due volte con lo stesso schema se non
  glielo si chiede. Serve al doppio clic e serve ai ritentativi: un lavoro
  ripetuto costa denaro vero.
- **Ritentativi con arretramento**: tre tentativi, attesa crescente
  (5 s, 30 s, 3 min), **solo sugli errori ritentabili** — limite di
  frequenza, 5xx, rete. Mai su un 400, che è un difetto nostro e va visto;
  mai su un documento illeggibile o di tipo sbagliato, che fallirebbe
  identico costando tre volte.
- **Parallelismo controllato** per organizzazione, così un cliente con
  cinquanta documenti non mette in coda gli altri.

### Documenti lunghi

Sopra le 100 pagine il documento si **segmenta**, e ogni segmento porta il
proprio intervallo di pagine perché la provenienza resti esatta. Per FONTE
serve di rado (una bolletta sta in poche pagine) e riguarda registri e
bilanci; per OPERA è la norma, e l'indice si ricompone dai segmenti.

### Tetti di spesa — invisibili al cliente

**La regola che viene prima di tutte: i tetti non si mostrano mai al
cliente.** Nessun messaggio in pagina dice «hai superato il limite»,
nessuna barra di consumo, nessuna quota. Un cliente che paga un canone non
deve sapere quanto ci costa leggere i suoi documenti, e soprattutto non
deve regolarci sopra il proprio lavoro. Il tetto è un dispositivo di
sicurezza NOSTRO: ferma un difetto — un ciclo impazzito, un PDF di
quattrocento pagine caricato per sbaglio, un archivio dieci volte più
grande della media — prima che diventi una fattura.

Tre ambiti, con soglia (si avvisa e si continua) e tetto (ci si ferma).
Tarati sul costo misurato: una lettura ≈ $0,05, una pratica tipica ≈ $1,75.

| Ambito | Finestra | Soglia | Tetto | Perché lì |
|---|---|---|---|---|
| **pratica** | tutto lo storico del cliente | $5 | $15 | quasi dieci volte la pratica tipica: oltre, è quasi certamente un ciclo che si ripete |
| **organizzazione** | mese corrente | $20 | $60 | un cliente con quattro percorsi e archivio ricco arriva a ~$7: a $20 si guarda, a $60 si chiama |
| **giorno** | l'intero servizio | $50 | $150 | rete di sicurezza su un difetto che colpisce tutti insieme; da rialzare quando i clienti crescono |

Si ferma al **primo tetto superato**, guardando prima il giorno, poi
l'organizzazione, poi la pratica: fermare per il tetto più generale è più
informativo, perché dice che il problema non è di quel cliente.

Quando un tetto ferma il lavoro, il cliente legge che la lettura è **in
coda e riprende a breve** — che è vero — e il back-office riceve
l'allarme coi numeri in `motore_allarmi`. La seconda metà di quella frase
(«se fra qualche ora è ancora qui, scrivici») è vera proprio perché
l'allarme esiste: un blocco silenzioso è indistinguibile da un guasto.

**Mai attribuire all'ambiente un limite che è di budget.** È la regola che
tiene onesto tutto il resto (§7bis): se un tetto di spesa venisse
raccontato come attenzione ambientale, il primo cliente che se ne accorge
avrebbe ragione a non credere più a nient'altro.

### Cruscotto di back-office

`/dashboard/motore`, riservato all'amministratore — e la barriera è la
**RLS** (`is_admin()` sulle policy di `extractions` e `motore_allarmi`),
non un controllo dentro la pagina. Mostra: allarmi non ancora visti,
speso totale e di oggi, **costo per cliente** (che oggi è il costo per
pratica) con la percentuale sul tetto, **costo ed errori per tipo di
documento** — è così che si decide dove intervenire invece di supporlo —
e la tassonomia con ciò che si legge e ciò che è solo dichiarato.

### Log tecnico

Tabella `estrazioni`, **solo back-office**: nessuna policy per gli utenti
autenticati, ci accede il service role. Una riga per chiamata: documento,
modello, versione dello schema, famiglia, token in/out, esito, durata, costo
stimato **calcolato dai token effettivi** con una tabella prezzi versionata,
e il JSON grezzo ricevuto.

Risponde a tre domande che senza registro non hanno risposta: quanto costa
davvero una pratica, quale tipo di documento fallisce più spesso, se un
cambio di prompt ha peggiorato le cose.

### Costo per pratica

Listino Anthropic al 24 agosto 2026, per milione di token: **Opus 5** $5 in
/ $25 out · **Sonnet 5** $3 / $15 · **Haiku 4.5** $1 / $5. La Batch API
dimezza entrambi.

**Misurato**, non stimato — bolletta di una pagina, Opus 5 con
ragionamento adattivo ed effort medio (`scripts/collaudo-motore.mjs`,
24 agosto 2026):

| Corsia | Token in / out | Durata | **Costo** |
|---|---|---|---|
| PDF nativo | 4.361 / 1.154 | 15,1 s | **$0,0507** |
| Immagine (PNG a pagina intera) | 2.939 / 1.173 | 15,8 s | **$0,0440** |

Due cose che i numeri dicono e la teoria non diceva. La prima: **la
scansione non costa più del nativo** — anzi, qui costa meno, perché un PDF
mandato come `document` porta con sé sia il testo sia la pagina, mentre
un'immagine porta solo la pagina. Cade quindi l'argomento di risparmio a
favore dell'estrazione locale del testo, e resta solo quello di
accuratezza — che è a favore di mandare il documento intero. La seconda:
**l'uscita pesa quanto pesa il ragionamento**, circa 1.150 token, ed è la
metà abbondante della spesa.

Pratica tipo — Carbon Footprint Scope 1-2 di una PMI: una dozzina di
bollette elettriche, qualche bolletta gas, fatture carburante, visura,
bilancio; circa 25 documenti, più la generazione dell'elaborato.

| Modello | Per documento | 25 documenti | Generazione (stima) | **Pratica** | In batch |
|---|---|---|---|---|---|
| Opus 5 | $0,05 *(misurato)* | $1,25 | ~$0,50 | **~$1,75** | ~$0,88 |
| Sonnet 5 | ~$0,03 | ~$0,75 | ~$0,30 | ~$1,05 | ~$0,53 |
| Haiku 4.5 | ~$0,01 | ~$0,25 | ~$0,10 | ~$0,35 | ~$0,18 |

Solo la prima riga della colonna «per documento» è misurata; il resto è
proporzione sui listini, e la generazione dell'elaborato è una stima che
non ha ancora niente da misurare.

**La conclusione che conta**: contro il prezzo del servizio, meno di due
dollari di modello per pratica non è la voce che decide la marginalità. Il
costo del Motore non è l'inferenza: è il tempo del professionista che
valida. Ottimizzare il modello prima di aver misurato il resto è
ottimizzare la voce sbagliata — e un dato sbagliato costa più di tutta la
spesa di elaborazione di quella pratica.

---

## 7bis. Il riuso — non rifare due volte la stessa cosa

Da non confondere con i tetti, mai: **il tetto è un limite di budget ed è
invisibile; il riuso è una scelta di merito e si dice per quello che è.**
Se nulla è cambiato dall'ultima versione, rigenerare produce lo stesso
documento — e un'elaborazione che non cambia nulla è energia spesa per
niente.

**L'impronta** di un elaborato è l'hash dei suoi INGRESSI: dati confermati,
documenti di origine coi loro stati di lettura, edizioni delle norme,
modello del documento. Non del file prodotto — quello si conosce solo dopo
averlo prodotto, cioè dopo aver speso.

- **Impronta identica** → si riapre il documento esistente, con il
  messaggio: *«Nulla è cambiato dall'ultima versione: ti riapriamo il
  documento già generato. Ogni elaborazione ha un costo energetico e non ha
  senso spenderlo due volte per lo stesso risultato»*, e **accanto sempre**
  il modo di generare comunque una nuova versione. Un riuso senza via
  d'uscita non è un riuso, è un divieto.
- **Impronta diversa** (dati confermati, documenti nuovi, norma aggiornata,
  modello aggiornato) → **si rigenera, senza obiezioni, senza messaggi e
  senza chiedere conferma**, dicendo che cosa è cambiato. Il riuso non è un
  attrito da mettere in mezzo al lavoro: è una cortesia per il caso in cui
  il lavoro non c'è.
- **Cicli ripetuti ravvicinati** (tre versioni in un'ora) → si rigenera
  comunque, con un invito gentile a finire le modifiche prima. Invita, non
  vieta e non blocca.

Lo stesso principio vale già sulla **lettura** di un documento, dove è
implementato: rileggere lo stesso file con lo stesso schema restituisce gli
stessi dati, quindi non si rilegge — si riaprono i dati che ci sono, con la
stessa frase e con «rileggilo comunque» accanto. Si rilegge quando il file
è cambiato, quando lo schema è cambiato, o quando il cliente lo chiede.

Le decisioni sono pure e provate in `src/lib/motore/riuso.ts`: la
generazione, quando esisterà, ci si innesta senza riscriverle.

---

## 8. (g) Tracciabilità e versioni

Ogni elaborato generato è una **versione**, non un file che si sovrascrive.
Ogni versione porta:

- numero progressivo e data di emissione;
- **anno di rendicontazione**;
- **edizioni delle norme usate, copiate dentro la versione** — non un
  riferimento al registro. Il registro cambia (le norme si ritirano); un
  documento emesso nel 2026 deve continuare a dichiarare su quale edizione
  **è stato costruito**, altrimenti la sua storia diventa illeggibile;
- **elenco delle fonti dei dati**: per ogni valore, documento, pagina, data
  di conferma;
- **stato di validazione**: bozza, in validazione, validato — da chi, quando.

**Rigenerabile** quando cambiano i dati o le norme. Il portale segnala che
una nuova versione è possibile e **dice perché** — «la norma di riferimento
ha cambiato edizione il 15 aprile 2026», «hai confermato tre dati nuovi» —
invece di offrire un bottone «rigenera» che non dice cosa cambierebbe. Le
versioni precedenti restano: un documento consegnato non si cancella.

È il meccanismo che rende vera la promessa «i documenti non invecchiano nel
cassetto», e che alimenta il mantenimento del percorso di aggiornamento.

---

## 9. Le scelte sul modello e sulla chiamata

### Modello predefinito: `claude-opus-5`

Non è una scelta di comodo. Estrarre dati da documenti amministrativi
italiani — tabelle, fasce orarie, conguagli, prestampati con correzioni a
mano, scansioni storte — è il tipo di compito in cui la differenza fra
modelli non è stilistica: è il numero di campi che tornano giusti sui **casi
difficili**, che sono esattamente quelli in cui un errore passa inosservato.
Il caso facile lo legge chiunque.

`ANTHROPIC_EXTRACTION_MODEL` permette di cambiarlo senza deploy, ma
**abbassare il modello per risparmiare non è una decisione tecnica**: è una
decisione del fondatore, da prendere dopo aver confrontato gli esiti sugli
stessi documenti col log tecnico alla mano. Finché quel confronto non
esiste, il default resta il modello più capace.

### Struttura della risposta

`output_config.format` con lo schema, **più validazione Zod lato server**:
la prima riduce gli errori di forma, la seconda è quella di cui ci fidiamo.

**Vincolo dell'API, scoperto provando**: uno schema di structured output
ammette **al massimo 16 parametri con tipo unione** (annullabili o `anyOf`);
oltre, l'API risponde 400 perché il costo di compilazione cresce in modo
esponenziale. La forma naturale — un campo per proprietà, ciascuno
annullabile e con quattro sotto-proprietà annullabili — ne produceva
quaranta. Quindi i campi estratti viaggiano in un **elenco** con struttura
fissa e nessuna proprietà annullabile: «non letto» si dice con la stringa
vuota. Il vincolo ha migliorato il progetto invece di peggiorarlo: la forma
è ora identica per ogni documento-FONTE, e aggiungere un tipo significa
dichiarare le sue chiavi, non scrivere un altro schema annidato.

**Vincolo tecnico dichiarato**: le *citations* native dell'API — che
darebbero la pagina di provenienza gratis e verificata — **non sono
compatibili con `output_config.format`** (l'API risponde 400). Per questo la
provenienza è un **campo dello schema** che il modello compila, non una
funzione dell'API. È una scelta obbligata, non preferita: se le due cose
diventeranno compatibili, la provenienza nativa è più affidabile di quella
dichiarata dal modello, e vale la pena tornarci.

### Ragionamento ed effort

Il **ragionamento adattivo** (`thinking: {type: "adaptive"}`) resta attivo:
su una bolletta con conguagli, letture stimate e più POD nello stesso
documento la risposta giusta richiede di ragionare, non di trascrivere.
L'intensità si governa con `output_config.effort`: **medio** per FONTE — è
lettura, non analisi — e più alto per OPERA, dove il lavoro è di confronto
strutturale. Si abbassa l'effort, non si disattiva il ragionamento.

---

## 10. Rischi dichiarati, in un posto solo

| Rischio | Perché | Come lo teniamo |
|---|---|---|
| **Dato plausibile ma sbagliato** | il peggiore: sembra un successo e finisce in un documento consegnato | conferma umana obbligatoria, plausibilità, provenienza verificabile a colpo d'occhio |
| **Manoscritto** | accuratezza non garantita, e nessuno può garantirla | tetto di confidenza 0,6, conferma sempre, immagine accanto al campo, limite dichiarato in vetrina |
| **Scansioni di bassa qualità** | foto storte, ombre, fuori fuoco, fax | qualità dichiarata dal modello, confidenza abbassata, esito «illeggibile» con rimedio invece di estrazione a caso |
| **Bollette di fornitori nuovi** | ogni fornitore impagina a modo suo | lo schema è per contenuto, non per posizione; i casi che falliscono diventano prove |
| **Deriva silenziosa del prompt** | una modifica migliora un caso e ne peggiora dieci | insieme di prove con risposte simulate, eseguito prima di ogni modifica al prompt |
| **Costo fuori controllo** | un PDF di 400 pagine caricato per sbaglio, o ritentativi impazziti | limiti duri prima della chiamata, idempotenza, niente ritentativi sugli errori definitivi, tetto per pratica |
| **Norma cambiata dopo l'emissione** | documento che cita un'edizione ritirata | edizione copiata nella versione, registro sorvegliato, segnalazione di rigenerazione |
| **Struttura OPERA inventata** | analisi degli scostamenti sbagliata | pagina e titolo testuale per ogni sezione, confronto sempre affiancato all'originale |
| **Dipendenza da un fornitore** | il Motore è nostro, l'inferenza no | schemi, validazione e plausibilità sono nostri e indipendenti: cambia il chiamante, non l'impianto |
| **Attese lunghe** | un documento lungo può richiedere minuti | corsia differita asincrona, avanzamento onesto, mai una schermata che finge |

---

## 11. Ordine di implementazione

1. ~~**Bolletta elettrica**~~ — fatta: schema, rilevamento
   nativo/scansione, estrazione, validazione, plausibilità, confidenza,
   provenienza, stato «da confermare», effetto visibile nel portale.
2. ~~**Tassonomia completa**~~ — fatta: venti tipi dichiarati con famiglia,
   forma, cosa si estrae e attesa di qualità
   (`docs/tassonomia-documentale.md`).
3. ~~**I quattro tipi del cuneo**~~ — fatti: visura, organigramma,
   organico, formazione. Aprono parità di genere, indicatori sociali VSME e
   la parte anagrafica di ogni manuale.
4. ~~**Manoscritto come caso normale**~~ — fatta la vista affiancata con
   conferma per riga.
5. ~~**Tetti di spesa e riuso**~~ — fatti, col cruscotto di back-office.
6. **Gas, teleriscaldamento, carburanti** — completano Scope 1 e 2. Tre
   schemi, nessun codice nuovo. ← *prossima tappa*
7. Coda e corsia differita (Batch API) — quando i volumi lo giustificano.
8. Famiglia OPERA piena: manuale di sistema, procedure, verbali, e
   l'analisi degli scostamenti che apre l'Aggiornamento del Sistema di
   Gestione.
9. Generazione dell'elaborato con controllo di conformità bloccante — ed è
   lì che il riuso (§7bis) trova il suo caso principale.
10. Marchio del cliente e anteprima.
11. Versioni e rigenerazione.

L'ordine non è negoziabile su un punto: **la tappa 1 arriva fino al
portale**. Un'estrazione che funziona nei test e non si vede in pagina non è
una tappa completata — è codice che nessuno ha ancora usato.
