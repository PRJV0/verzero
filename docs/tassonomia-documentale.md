# Tassonomia documentale del Motore

**Generato da `scripts/mappa-documentale.mjs`: non si modifica a mano.**
La fonte è il registro in `src/lib/motore/famiglie.ts` e lo smistamento in
`src/lib/documenti.ts`. Per aggiungere un tipo si tocca il codice, e questa
pagina si rigenera — una mappa scritta a mano diverge al primo tipo nuovo,
e una mappa che mente è peggio di nessuna mappa.

Le famiglie e le forme sono spiegate in `docs/motore.md` §2.

- **FONTE** — se ne estraggono dati puntuali (bollette, visure, registri).
- **OPERA** — se ne estrae la struttura (manuali, procedure, verbali).
- **scheda** — campi fissi, una volta sola.
- **tabella** — N righe della stessa forma.

Le tre pallottole indicano quanto spesso quel tipo arriva **nativo**,
**scansionato** e **manoscritto**: ●●● prevalente, ●●○ frequente,
●○○ raro, ○○○ mai.

**5 tipi su 20 si sanno leggere oggi.** Gli altri sono
dichiarati: vengono archiviati, riconosciuti e smistati come sempre — i
chip «alimenta …» funzionano — ma il loro contenuto non viene ancora
letto. Dichiarato non è implementato, e il portale non lascia credere il
contrario.

---

## Si leggono oggi

### bolletta di energia elettrica

| | |
|---|---|
| chiave | `bolletta-elettrica` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | **si legge** (bolletta-elettrica/1) |
| nativo · scansione · manoscritto | ●●● · ●○○ · ○○○ |

**Si estrae:** POD e fornitore; periodo di fatturazione; consumo totale e per fascia F1/F2/F3; importo; Garanzia d'Origine dichiarata.

**Attesa di qualità:** Lo emette un sistema informatico: arriva quasi sempre in PDF nativo, e si legge in chiaro.

**Percorsi serviti:** Carbon Footprint di Organizzazione · Percorso Ver0 · Bilancio di Sostenibilità (VSME).

---

### visura camerale

| | |
|---|---|
| chiave | `visura` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | **si legge** (visura/1) |
| nativo · scansione · manoscritto | ●●● · ●○○ · ○○○ |

**Si estrae:** denominazione, partita IVA e codice fiscale; forma giuridica e data di costituzione; sede legale; ATECO prevalente con descrizione; REA, capitale sociale, addetti dichiarati, PEC.

**Attesa di qualità:** Lo emette un sistema informatico: arriva quasi sempre in PDF nativo, e si legge in chiaro.

**Percorsi serviti:** Carbon Footprint di Organizzazione · Percorso Ver0 · Bilancio di Sostenibilità (VSME).

---

### organigramma o atto di delega

| | |
|---|---|
| chiave | `organigramma` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | **si legge** (organigramma/1) |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** una riga per ruolo: funzione, responsabilità, a chi riporta; presenza di delega formale e suo ambito; NON le persone: al manuale serve il ruolo, non il nome.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0 · Sistema di Gestione per la Parità di Genere.

---

### dati di organico aggregati

| | |
|---|---|
| chiave | `organico` |
| famiglia | **FONTE** |
| forma | tabella (righe ripetute) |
| stato | **si legge** (organico/1) |
| nativo · scansione · manoscritto | ●●● · ●○○ · ●○○ |

**Si estrae:** una riga per inquadramento × genere; numero di addetti, tempo indeterminato, part time; retribuzione media lorda annua, dove dichiarata; fascia d'età, dove dichiarata.

**Attesa di qualità:** Di solito un foglio di calcolo o una stampa da gestionale: nativo, ma con intestazioni di colonna imprevedibili.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0 · Sistema di Gestione per la Parità di Genere.

---

### registro di formazione o foglio firma

| | |
|---|---|
| chiave | `formazione` |
| famiglia | **FONTE** |
| forma | tabella (righe ripetute) |
| stato | **si legge** (formazione/1) |
| nativo · scansione · manoscritto | ●○○ · ●●○ · ●●● |

**Si estrae:** una riga per corso: argomento, data, ore, partecipanti; partecipanti per genere e inquadramento, dove distinti; ambito (sicurezza, qualità, ambiente, parità, tecnico); docente o ente formatore.

**Attesa di qualità:** Compilato a mano su modulo prestampato: confidenza ridotta d'ufficio e conferma riga per riga.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0 · Sistema di Gestione per la Parità di Genere.


---

## Dichiarati, non ancora letti

### bolletta del gas

| | |
|---|---|
| chiave | `bolletta-gas` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●● · ●○○ · ○○○ |

**Si estrae:** PDR e fornitore; periodo di fatturazione; consumo in Smc e coefficiente C; importo.

**Attesa di qualità:** Lo emette un sistema informatico: arriva quasi sempre in PDF nativo, e si legge in chiaro.

**Percorsi serviti:** Carbon Footprint di Organizzazione · Percorso Ver0 · Bilancio di Sostenibilità (VSME).

---

### bolletta del teleriscaldamento

| | |
|---|---|
| chiave | `teleriscaldamento` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●● · ●○○ · ○○○ |

**Si estrae:** identificativo dell'utenza e gestore; periodo; energia termica in kWh o MWh; importo.

**Attesa di qualità:** Lo emette un sistema informatico: arriva quasi sempre in PDF nativo, e si legge in chiaro.

**Percorsi serviti:** Carbon Footprint di Organizzazione · Percorso Ver0 · Bilancio di Sostenibilità (VSME).

---

### registro o fatture dei carburanti

| | |
|---|---|
| chiave | `carburanti` |
| famiglia | **FONTE** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●●○ |

**Si estrae:** una riga per rifornimento: data, tipo di carburante, litri, importo; mezzo o targa quando dichiarata; chilometri percorsi, dove il registro li tiene.

**Attesa di qualità:** Le schede carburante di flotta sono spesso compilate a mano; le fatture dei consorzi sono native.

**Percorsi serviti:** Carbon Footprint di Organizzazione · Percorso Ver0.

---

### bilancio depositato

| | |
|---|---|
| chiave | `bilancio` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●● · ●○○ · ○○○ |

**Si estrae:** esercizio di riferimento; ricavi, valore della produzione, costo del personale; totale attivo e patrimonio netto; numero medio di dipendenti dalla nota integrativa.

**Attesa di qualità:** Lo emette un sistema informatico: arriva quasi sempre in PDF nativo, e si legge in chiaro.

**Percorsi serviti:** Carbon Footprint di Organizzazione · Percorso Ver0 · Bilancio di Sostenibilità (VSME).

---

### manuale del sistema di gestione

| | |
|---|---|
| chiave | `manuale-sistema` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** indice e gerarchia delle sezioni, con la pagina; designazioni normative citate, con edizione; ruoli e responsabilità nominati; procedure e moduli richiamati; data di emissione e stato delle revisioni.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Manuale del Sistema di Gestione ISO 9001 · Manuale del Sistema di Gestione ISO 14001 · Manuale del Sistema di Gestione ISO 45001.

---

### procedura o istruzione operativa

| | |
|---|---|
| chiave | `procedure` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** codice, titolo, revisione e data; scopo e campo di applicazione; responsabilità coinvolte; moduli e registrazioni richiamati.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Manuale del Sistema di Gestione ISO 9001 · Bilancio di Sostenibilità (VSME) · Percorso Ver0.

---

### politica o codice aziendale

| | |
|---|---|
| chiave | `politiche` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** impegni dichiarati, uno per riga; ambito (qualità, ambiente, sicurezza, etica, parità); data, firma della direzione, riesame previsto.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0 · Sistema di Gestione per la Parità di Genere.

---

### verbale di riunione o riesame

| | |
|---|---|
| chiave | `verbali` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●○○ · ●●○ · ●●● |

**Si estrae:** una riga per punto all'ordine del giorno o decisione; azioni decise, responsabile e scadenza; data della riunione e funzioni presenti.

**Attesa di qualità:** Compilato a mano su modulo prestampato: confidenza ridotta d'ufficio e conferma riga per riga.

**Percorsi serviti:** Manuale del Sistema di Gestione ISO 9001 · Bilancio di Sostenibilità (VSME) · Percorso Ver0.

---

### documento di valutazione dei rischi

| | |
|---|---|
| chiave | `dvr` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** una riga per rischio: descrizione, valutazione, misure; figure della sicurezza nominate (RSPP, medico competente, RLS); data di emissione e di aggiornamento.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Manuale del Sistema di Gestione ISO 45001.

---

### registro di manutenzione

| | |
|---|---|
| chiave | `manutenzione` |
| famiglia | **FONTE** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●○○ · ●●○ · ●●● |

**Si estrae:** una riga per intervento: data, macchina, tipo, esito; ore di fermo e ricambi, dove annotati; firma o sigla dell'operatore.

**Attesa di qualità:** Compilato a mano su modulo prestampato: confidenza ridotta d'ufficio e conferma riga per riga.

**Percorsi serviti:** Manuale del Sistema di Gestione ISO 9001.

---

### registro dei rifiuti, MUD o formulari

| | |
|---|---|
| chiave | `rifiuti` |
| famiglia | **FONTE** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●●○ |

**Si estrae:** una riga per movimento: data, codice EER, quantità, destino; operazione di recupero o smaltimento (R/D); trasportatore e destinatario.

**Attesa di qualità:** Il MUD è nativo; i formulari sono moduli prestampati compilati a mano, in quattro copie e spesso sbiaditi.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0.

---

### autorizzazione ambientale

| | |
|---|---|
| chiave | `autorizzazioni` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** tipo (AUA, AIA, scarichi, emissioni in atmosfera); ente che l'ha rilasciata, numero e data; scadenza e prescrizioni con periodicità; matrici autorizzate.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0 · Manuale del Sistema di Gestione ISO 14001.

---

### contratto o capitolato

| | |
|---|---|
| chiave | `contratti` |
| famiglia | **OPERA** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** una riga per requisito di sostenibilità richiesto dal committente; certificazioni o rendicontazioni imposte, con scadenza; clausole di penale o esclusione collegate.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Percorso Ver0.

---

### questionario ESG già compilato

| | |
|---|---|
| chiave | `questionari-esg` |
| famiglia | **FONTE** |
| forma | tabella (righe ripetute) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●● · ●○○ · ●○○ |

**Si estrae:** una riga per domanda: testo, risposta data, evidenza allegata; piattaforma o committente (EcoVadis, Synesgy, Open-es, banca); punteggio o esito, se comunicato.

**Attesa di qualità:** Di solito un foglio di calcolo o una stampa da gestionale: nativo, ma con intestazioni di colonna imprevedibili.

**Percorsi serviti:** Percorso Ver0.

---

### certificato di sistema di gestione

| | |
|---|---|
| chiave | `certificato` |
| famiglia | **FONTE** |
| forma | scheda (campi fissi) |
| stato | dichiarato |
| nativo · scansione · manoscritto | ●●○ · ●●○ · ●○○ |

**Si estrae:** norma e designazione con edizione; ente di certificazione e numero del certificato; date di emissione, scadenza e ciclo; scopo e siti coperti.

**Attesa di qualità:** Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.

**Percorsi serviti:** Bilancio di Sostenibilità (VSME) · Percorso Ver0.


---

## Ordine di implementazione

Il criterio è il valore commerciale, non la comodità tecnica:

1. **Bollette** — aprono il Carbon Footprint, che è il percorso più venduto.
2. **Visura, organigramma, organico, formazione** — sono il cuneo: aprono
   insieme la parità di genere (UNI/PdR 125), gli indicatori sociali del
   VSME e la parte anagrafica di ogni manuale.
3. **Gas, teleriscaldamento, carburanti** — completano lo Scope 1 e 2.
4. **Manuale di sistema e procedure** — sono la famiglia OPERA e aprono
   l'Aggiornamento del Sistema di Gestione.
5. Il resto, quando serve.
