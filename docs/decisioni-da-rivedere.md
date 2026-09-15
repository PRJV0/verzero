# Decisioni da rivedere

Le scelte fatte in autonomia dove sarebbe servito il parere del fondatore.
Per ciascuna: che cosa si è deciso, perché era l'opzione più prudente, e
l'alternativa scartata. Una decisione rivista si cancella da qui e, se
cambia il codice, si scrive nel commit che la cambia.

Aperto il **15 settembre 2026**, con la generazione dell'elaborato
(`src/lib/elaborato/`, `docs/motore.md` §5–§8).

---

## Il documento di collaudo

**1. Il collaudo è un Inventario GHG 2025, non un manuale.**
È l'unico elaborato in cui convivono tutte le provenienze richieste —
valori letti dalle bollette, fattori da banche dati, emissioni calcolate —
e il più esposto a una verifica numerica. Impresa e dati sono quelli
inventati del sito (Officina Lombardi S.r.l.), con «esempio» su ogni
pagina. *Alternativa:* un manuale ISO 9001 in DOCX, oggi non componibile
(le sezioni di processo non hanno ancora contenuto dichiarato).

## I fattori di emissione

**2. I fattori stanno in un registro di codice verificato, non nella
tabella `emission_factors` prevista da SPEC §4.**
Stessa disciplina del registro delle norme: ogni valore porta pubblicazione,
tabella, indirizzo ufficiale e data di verifica, passa da una revisione del
codice e viene copiato nella versione del documento. *Costo:* aggiornarli
richiede un rilascio. *Da rivedere* quando i fattori da mantenere saranno
molti o li aggiornerà chi non tocca il codice.

**3. Scope 2 location-based: il fattore ISPRA dell'anno di esercizio anche
se preliminare, in CO₂ equivalente.**
Per il 2025: 201,01 g CO₂eq/kWh (Rapporti ISPRA 430/2026, tab. 1.18, dato
preliminare), dichiarato come tale nel documento. È il dato dello stesso
esercizio e il più alto dei due candidati. *Alternative:* l'ultimo
definitivo (2024: 194,04) o la sola CO₂ (tab. 1.7: 199,6).

**4. Scope 2 market-based: mix residuale AIB, non quello GSE.**
AIB European Residual Mixes 2025, Italia 420,2 g CO₂/kWh (tabella 2; la nota
6 dichiara corretto quel valore contro il 428 del grafico). Verificato sul
PDF di AIB. Il mix residuale nazionale pubblicato dal GSE (390,9 g secondo
ISPRA) non è stato verificato sulla fonte GSE. *Da rivedere* se si preferisce
la fonte nazionale.

**5. Fornitura «rinnovabile» dichiarata in bolletta = zero nel
market-based, senza chiedere l'evidenza delle garanzie d'origine.**
È la regola di SPEC §7. *Rischio:* un'offerta commerciale «verde» senza GO
annullate. *Alternativa prudente:* chiedere il documento delle GO prima di
azzerare.

**6. Carburanti: fattori per litro DESNZ 2025, variante «100% minerale».**
Le tabelle nazionali danno i carburanti per tonnellata e non pubblicano la
densità della benzina. La variante minerale conta come fossile anche la
quota di biocarburante: sovrastima di pochi punti, e niente CO₂ biogenica da
rendicontare a parte. *Alternative:* parametri MASE per tonnellata con la
densità ISPRA (esiste solo per il gasolio), o la variante britannica «media»
(miscela diversa da quella italiana).

**7. Un fattore dell'anno dopo l'esercizio non si usa mai.**
Si usa quello dello stesso esercizio, altrimenti il più recente precedente
entro due anni; se non c'è, il documento non esce (mancanza «da parte
nostra»). Oggi il registro copre il 2024 e il 2025 per elettricità e gas, il
solo 2025 per i carburanti.

## Il controllo di consegna

**8. Buchi e sovrapposizioni di bollette oltre tre giorni bloccano.**
Un contatore attivato o chiuso durante l'anno si dichiara dal portale, accanto
alla mancanza: periodo di attività dentro l'esercizio, oppure «non attivo».
La copertura si chiede solo dentro quel periodo, e bollette che fatturano
consumi fuori dal periodo dichiarato lo smentiscono e bloccano.

**9. Senza bollette del gas né registri carburanti lo Scope 1 blocca, e si
sblocca solo con una dichiarazione.**
L'impresa dichiara di non avere avuto consumi diretti di combustibili — la
frase è fissa e comprende impianti a gas, gasolio o GPL e veicoli in uso,
anche a noleggio o in leasing. Il documento riporta la dichiarazione con la
sigla I e scrive «zero per dichiarazione, non per misura». *Alternativa più
severa:* chiedere un'evidenza (un contratto di locazione con riscaldamento
incluso, un elenco dei mezzi vuoto). *Alternativa più leggera:* ammettere lo
zero senza dichiarazione, che è quello che la revisione ha trovato
indistinguibile da un inventario incompleto.

**9bis. Un documento di un altro esercizio non blocca; una fonte che c'era
l'anno prima e manca in questo sì.**
Al secondo anno l'archivio contiene i documenti del primo: si escludono in
silenzio dal calcolo. Ma un contatore (POD, PDR) con bollette dell'esercizio
precedente e nessuna in questo, o un registro carburanti dell'anno prima
senza rifornimenti in questo, bloccano finché arrivano i documenti nuovi o una
dichiarazione (contatore non attivo; nessun consumo di gas; nessun
rifornimento). Si guarda il SOLO esercizio precedente: un contatore chiuso tre
anni fa non chiede una dichiarazione ogni anno. *Alternativa più severa:*
guardare tutto l'archivio. *Più leggera:* nessun confronto fra esercizi, e il
rischio di un inventario che perde una sede senza che nessuno lo veda.

**9ter. Un documento dell'inventario non ancora letto, o illeggibile, blocca.**
Potrebbe essere proprio la bolletta che manca, e non si sa finché non è letto.
In coda o in lettura tocca a noi; non letto o illeggibile, all'impresa
(avviare la lettura, caricare una copia leggibile o eliminarlo). *Costo:* un
documento illeggibile di un anno passato ferma l'inventario di quest'anno
finché non lo si toglie.

**9quater. Energia elettrica compresa nell'affitto: il rimedio resta
«scrivici».**
Senza bollette lo Scope 2 non si calcola, e la ripartizione dei consumi di un
edificio condiviso è un caso da valutare con chi valida. Non c'è ancora una
dichiarazione né un tipo di documento per il prospetto del locatore.

**10. Un dato non confermato blocca solo se il documento lo usa.**
Un numero REA da confermare non ferma un inventario; un consumo, un periodo o
una riga di registro sì.

**11. Anche un documento non ancora validato si scarica.**
Porta «in attesa di validazione» su ogni piè di pagina e nella copertina, e
la pagina di validazione dice che manca. *Alternativa più restrittiva:*
scaricabile solo dopo la validazione.

## Provenienza e contenuto

**12. Una quarta sigla oltre alle tre richieste: I, «inserito
dall'organizzazione».**
I dati digitati alla registrazione o nella scheda non vengono né da un
documento né da una banca dati: farli passare per l'una o per l'altra
sarebbe falso. Le pagine del sito dell'impresa sono D (documento
dell'impresa, con indirizzo).

**12bis. Un valore riscritto dal cliente è I, anche se corregge un errore
evidente della lettura.**
Il documento cita come fonte l'organizzazione («valori scritti
dall'organizzazione al posto di quelli letti su…»), non la bolletta: chi apre
la pagina indicata troverebbe un altro numero. Lo stesso per la scheda
impresa: un dato recuperato e poi riscritto passa a provenienza «utente». Un
valore ricavato dalla lettura da altre celle è C, con il documento come
ingresso. *Alternativa:* D con una nota «corretto dall'organizzazione».

**12ter. Un numero o una data non canonici bloccano, anche quando
un'interpretazione sembra ovvia.**
«11.840» non si legge né come undicimila né come undici: si chiede di
riscriverlo, e la correzione dal portale lo salva già nella forma giusta.
Una scelta fuori elenco («forse» per la fornitura rinnovabile) blocca allo
stesso modo. *Alternativa:* interpretare all'italiana, che è corretto quasi
sempre — e sbaglia di mille volte quando non lo è.

**13. La sigla accanto a ogni singolo valore, anche quando una riga intera
viene dalla stessa bolletta.**
È la lettura letterale di «ogni dato riporta la provenienza». *Alternativa:*
una sigla per riga, più pulita da leggere.

**14. Limiti dichiarati dell'inventario, da far valutare in validazione.**
Le emissioni dirette non sono ripartite per gas (CO₂, CH₄, N₂O);
l'intensità è solo per addetto (nessuna fonte confermata del fatturato, che
la scheda di catalogo cita); l'incertezza è qualitativa; le emissioni
fuggitive dei refrigeranti sono dichiarate come escluse.

**15. La fonte della sezione «Metodologia» nel modello dice «ISPRA, MASE,
AIB e DESNZ».**
La scheda pubblica del servizio dice ancora «Fattori di emissione ISPRA e
DEFRA»: è testo commerciale, non l'ho toccato. DEFRA oggi si chiama DESNZ, e
i fattori usati vengono anche da MASE e AIB.

## La veste

**16. Tipografia: Inter nel PDF, Arial nel DOCX; niente Fraunces.**
Fraunces è la voce del marchio Verzero: in un documento dell'impresa
diventerebbe un secondo marchio. Arial nel DOCX perché si apre ovunque.

**17. Il nostro marchio compare due volte, e mai insieme a quello del
cliente.**
Una riga di testo in fondo alla copertina («Composto con la piattaforma
Verzero») e il logotipo semplice nel colophon dell'ultima pagina, nei suoi
colori. Niente payoff, niente Sigillo nei documenti.

**18. Contrasto misurato su carta da ufficio (#F2F1EC), non sul bianco puro.**
Soglie: titoli 4,5:1, filetti 3:1, fasce 1,3:1. Nessuna verifica di gamut CMYK:
per i colori molto saturi c'è solo un avviso.

**19. Un logo a bassa risoluzione si rimpicciolisce invece di essere
rifiutato.**
In copertina si cerca la dimensione più grande che dia 200 dpi, fino a un
minimo di 25 mm; sotto i 150 dpi a quel minimo il logo non si usa. Il logo
chiaro su trasparente si rifiuta; quello su fondo colorato si usa con avviso.

**19bis. Logo: file fino a 4 MB e 25 milioni di pixel; il PNG preparato
fino a 4 MB.**
Quattro e non cinque perché la piattaforma che ospita il portale tronca le
richieste a 4,5 MB. Oltre i 25 milioni di pixel l'immagine si rifiuta
leggendo l'intestazione, prima di decodificarla. Se il PNG rifilato supera
i 4 MB si riduce a una tavolozza di 256 colori, poi a 1.600 pixel: per un
logo non si vede, per una fotografia sì. Un SVG con DOCTYPE o entità si
rifiuta anche se il disegno è innocuo.

## Versioni, validazione, formati

**20. La validazione emette una revisione nuova, non modifica quella
validata.**
Le versioni sono immutabili anche per il service role, con una sola
eccezione: l'azzeramento automatico di «generata da» quando l'utente viene
cancellato. Chi valida oggi è un amministratore dal cruscotto
`/dashboard/motore` — la sezione si mostra solo agli amministratori — con
nome, qualifica e rilievi scritti a mano: non c'è ancora un registro dei
professionisti. Alla validazione i riferimenti normativi si ricalcolano dal
registro di oggi, e una norma ritirata nel frattempo la ferma.

**20bis. Le dichiarazioni le rende l'impresa titolare, non il consulente.**
Come la generazione e la lettura dei documenti. Una dichiarazione ritirata
resta nella scheda come «rifiutata», non si cancella.

**21. La generazione la avvia solo l'impresa.**
Il consulente con mandato vede stato, versioni e file. Coerente con la
lettura dei documenti, che avvia l'impresa.

**22. PDF 1.7 con caratteri incorporati, senza dichiarare PDF/A.**
PDFKit sa produrre PDF/A-2b, ma senza una validazione con veraPDF
dichiararlo nei metadati sarebbe un'affermazione non verificata.

**23. DOCX solo per manuali e sistema parità.**
Inventario, bilancio VSME e profilo ESG escono solo in PDF (docs/motore.md §5).
L'indice del DOCX è un campo di Word che si aggiorna all'apertura.

## Ambiente

**24. La migrazione `20260915120000_elaborati_e_marchio.sql` non è applicata
al remoto.**
Per istruzione. Finché non lo è, il pannello del documento finale mostra il
controllo di consegna vero e dice che la generazione non è ancora attiva;
la veste dei documenti idem. Il portale non è stato provato con una sessione
autenticata: le prove coprono composizione, controllo, calcolo, veste e
formati, e la build di produzione passa.
