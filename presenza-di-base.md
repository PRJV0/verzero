# Presenza di base — ricognizione e testi pronti

Ricognizione del 24 agosto 2026. Nessuna iscrizione è stata fatta: qui
c'è l'elenco verificato e i testi da incollare.

Quando un profilo esiste davvero, il suo URL va aggiunto a
`PROFILI_UFFICIALI` in `src/lib/seo.ts`: da lì entra nel `sameAs` dei
dati strutturati, che è la riga che dice «questa azienda e quel profilo
sono la stessa entità». Finché l'elenco è vuoto, `sameAs` non compare —
un URL dichiarato e assente è peggio del silenzio.

---

## Il vincolo che decide quasi tutto

**La società non è ancora costituita: non c'è partita IVA.** Questo non è
un dettaglio burocratico, è il filtro principale. Le piattaforme si
dividono in due gruppi:

- quelle che verificano il **dominio** (`verzero.it`, che esiste e ha la
  posta attiva) — accessibili **oggi**;
- quelle che verificano **l'esistenza giuridica** (P.IVA, sede, dati
  camerali) — da fare **dopo la costituzione**.

C'è poi un punto che vale per tutte: molte richiedono un **amministratore
persona fisica** con un profilo reale. Non è in contrasto con la regola
«nessun riferimento personale nei testi»: l'amministratore è un requisito
tecnico della piattaforma, non un contenuto pubblicato. Nei testi che
seguono non compare nessun nome, nessun telefono e nessuna geografia
oltre «Italia».

---

## (a) Profili aziendali generalisti

### 1. Pagina aziendale LinkedIn — **fattibile oggi**

| | |
|---|---|
| Costo | Gratuito |
| Serve la P.IVA | No |
| Serve una persona | Sì: un profilo LinkedIn personale come amministratore |
| Tempi | Immediato, nessuna approvazione |

**Cosa serve.** Un profilo personale con l'esperienza in Verzero
dichiarata nella sezione Experience, e un indirizzo di posta sul dominio
`verzero.it` confermato sul profilo — gli indirizzi generalisti (Gmail e
simili) non sono accettati. LinkedIn richiede anche che il profilo
dell'amministratore sia consolidato (non appena creato, con un minimo di
collegamenti): è un controllo anti-profilo-falso.

**Perché conta.** È il profilo che i modelli e i motori trovano per primo
quando cercano un'organizzazione, ed è la fonte più comune di `sameAs`
credibile. Verificato sulle pagine di aiuto ufficiali di LinkedIn.

### 2. Crunchbase — **fattibile oggi, con riserva**

| | |
|---|---|
| Costo | Profilo base gratuito |
| Serve la P.IVA | No |
| Serve una persona | Sì, un account |
| Tempi | Revisione redazionale, tempi non dichiarati |

Le schede sono spesso citate come fonte quando si chiede «chi sono i
fornitori di X». La riserva: Crunchbase accetta aziende pre-costituzione
ma la scheda resta scarna finché non ci sono dati verificabili
(costituzione, finanziamenti, dipendenti). **Consiglio: dopo la
costituzione**, non adesso — una scheda vuota è un segnale debole.

### 3. Google Business Profile — **da NON fare**

Richiede un'attività con un indirizzo verificabile o un'area di servizio
definita, e la verifica avviene per posta o video. È in contrasto diretto
con il vincolo «nessuna geografia oltre Italia», e senza società non c'è
niente da verificare. Da riconsiderare solo se un giorno ci sarà una sede
e la si vorrà pubblicare.

---

## (b) Elenchi di software B2B e SaaS

Sono la categoria più importante per la visibilità nelle risposte
generate: quando qualcuno chiede a un assistente «quali piattaforme
esistono per il bilancio di sostenibilità», le fonti che vengono lette
sono queste, non i siti dei singoli fornitori.

### 4. Capterra Italia — **prioritaria, dopo la costituzione**

| | |
|---|---|
| Costo | Scheda base gratuita (il modello Gartner Digital Markets: gratis la scheda, a pagamento la visibilità) |
| Serve la P.IVA | Sì, in pratica: l'onboarding fornitore chiede i dati dell'azienda |
| Serve una persona | Sì, un referente con posta aziendale |
| Tempi | Revisione redazionale prima della pubblicazione |

**Verificato**: la categoria italiana «Software ESG» è attiva e contiene
circa 75 prodotti su tre pagine, con fornitori reali e riconoscibili. È
esattamente l'elenco in cui un'impresa italiana cerca. Le categorie
adiacenti da valutare: gestione della qualità, gestione documentale,
conformità.

**Nota**: G2, Capterra, GetApp e Software Advice appartengono a due soli
gruppi (G2 e Gartner Digital Markets). Iscriversi a Capterra copre in
gran parte anche GetApp e Software Advice, che condividono il catalogo.

### 5. G2 — **prioritaria, dopo la costituzione**

| | |
|---|---|
| Costo | Profilo base gratuito, rivendicabile |
| Serve la P.IVA | Sì, in pratica |
| Serve una persona | Sì, con posta aziendale sul dominio |
| Tempi | Verifica del rivendicante, poi revisione |

La pagina di rivendicazione del profilo è attiva e il servizio è vivo. Le
recensioni sono il cuore del sistema: senza clienti che le scrivano, la
scheda resta poco visibile. **Ha senso quando ci saranno i primi clienti
attivi**, non prima.

### 6. SaaSHub — **fattibile oggi**

| | |
|---|---|
| Costo | Gratuito |
| Serve la P.IVA | No |
| Serve una persona | Un account |
| Tempi | Verifica della proprietà del prodotto |

**Verificato**: pagina di invio attiva, dichiaratamente gratuita.
**Attenzione**: SaaSHub offre anche un invio in blocco verso 108 altri
siti. **Non usarlo.** È esattamente la fabbrica di directory-spazzatura
da evitare: link da domini senza lettori, tutti uguali, che nel migliore
dei casi non servono a niente. Fare la sola scheda su SaaSHub.

### 7. AlternativeTo — **fattibile oggi, valore medio**

Gratuito, invio libero, utile perché intercetta chi cerca «alternativa a
X». Il modulo di invio ha risposto con un blocco automatico alla
verifica: da controllare a mano al momento dell'iscrizione. Nessun dato
societario richiesto.

### 8. Product Hunt — **non ora**

Gratuito e ad alto traffico, ma è un lancio: si fa una volta sola e
conviene farlo quando il prodotto è provabile da chiunque. Oggi il sito
raccoglie una lista d'attesa. Farlo adesso brucia l'unica occasione.

---

## (c) Directory italiane di settore

**Esito della ricerca: non ne ho trovata nessuna che superi i quattro
criteri insieme** (attiva, gratuita, non spam, pertinente a un fornitore
di software). Quello che esiste è una di queste tre cose:

- **piattaforme per le imprese, non per i fornitori** — SACE ESG Hub,
  Open-es e simili censiscono le aziende che rendicontano, non chi
  fornisce gli strumenti;
- **elenchi che richiedono una certificazione** — la directory B Corp
  richiede la certificazione, che è a pagamento e presuppone un'azienda
  operativa; l'elenco Accredia riguarda gli organismi accreditati, che
  noi non siamo e non saremo;
- **aggregatori commerciali e blog di settore** con elenchi redazionali:
  si entra scrivendo alla redazione, non iscrivendosi, e il risultato non
  è controllabile.

**Conclusione onesta**: per il mercato italiano la strada che funziona
non è una directory di settore, sono le **edizioni italiane degli
elenchi software** (Capterra.it in testa). Meglio riconoscerlo che
riempire l'elenco con voci deboli.

Da tenere d'occhio, senza farci conto oggi: le associazioni di settore
(reti d'impresa sulla sostenibilità) pubblicano elenchi soci, ma sono
adesioni a pagamento e vanno valutate come tali, non come presenza
gratuita.

---

## Scartate, e perché

| Cosa | Perché |
|---|---|
| Invio in blocco a 100+ directory (SaaSHub bulk, servizi «300 directory») | Link da domini senza lettori. Non portano persone e non aiutano l'entità: un profilo identico ripetuto ovunque è rumore. |
| Directory generaliste di aziende italiane a pagamento | Costo per una scheda che nessuno consulta. |
| Elenchi «migliori software ESG» di blog | Non sono iscrizioni, sono contenuti redazionali: si ottiene scrivendo, e non è presenza di base. |
| Google Business Profile | Richiede geografia verificabile. |

---

## I testi, pronti da incollare

Tutti derivano dalla descrizione ufficiale dell'entità
(`SITO.descrizione` in `src/lib/seo.ts`), che è la stessa usata nei dati
strutturati e in `llms.txt`. **Non riscriverli sul posto**: è la
coincidenza fra le versioni a rendere riconoscibile l'entità.

### Nome

```
Verzero
```

Mai «Ver0» come nome dell'organizzazione: quello è il monogramma e resta
il nome dei prodotti (Sigillo Ver0, AI Ver0). Dove esiste un campo
«nome alternativo» o «anche conosciuto come»:

```
Ver0
```

### Sito

```
https://verzero.it
```

### Descrizione breve (max 160 caratteri)

```
La piattaforma italiana che qualifica le imprese su sostenibilità e sistemi di gestione: documenti conformi, validati da professionisti, prezzi pubblici.
```

### Descrizione brevissima (max 100 caratteri, per i campi stretti)

```
Qualifica d'impresa su sostenibilità e sistemi di gestione, con prezzi pubblici.
```

### Descrizione ufficiale (quella dei dati strutturati — usare dove ci stanno ~280 caratteri)

```
Verzero è la piattaforma italiana che qualifica le imprese su sostenibilità e sistemi di gestione: un'AI proprietaria compone i documenti a partire da quelli che l'impresa ha già, un professionista li valida prima della consegna e i prezzi sono pubblici per fascia dimensionale.
```

### Descrizione lunga (per i campi da 800–1500 caratteri)

```
Verzero è la piattaforma italiana che qualifica le imprese su sostenibilità e sistemi di gestione: un'AI proprietaria compone i documenti a partire da quelli che l'impresa ha già, un professionista li valida prima della consegna e i prezzi sono pubblici per fascia dimensionale.

I percorsi coprono la carbon footprint di organizzazione secondo GHG Protocol e UNI EN ISO 14064-1:2019, il bilancio di sostenibilità nel formato volontario VSME raccomandato dalla Commissione europea, i sistemi di gestione ISO 9001, ISO 14001 e ISO 45001, la parità di genere secondo UNI/PdR 125:2022, la responsabilità sociale SA8000 e la misura della circolarità secondo UNI/TS 11820.

Verzero lavora solo su standard e norme nazionali e internazionali riconosciute: nessun protocollo proprietario. I documenti prodotti sono di parte prima — l'eventuale certificazione resta di competenza di un organismo accreditato al termine di un audit, e non è compresa nei percorsi.

Il Sigillo Ver0 è la targa verificabile che attesta i percorsi conclusi da un'impresa, con criteri pubblici e una pagina di verifica aperta a chiunque.

Verzero opera in Italia.
```

### Categorie da scegliere, in ordine di pertinenza

Dove si può scegliere più di una, in quest'ordine:

1. Software ESG / Sostenibilità (ESG software, Sustainability management)
2. Gestione della conformità (Compliance management)
3. Gestione della qualità (Quality management, QMS)
4. Gestione ambientale (EHS, Environmental management)
5. Reportistica e rendicontazione (Reporting)

### Parole chiave

Da usare dove il campo esiste, senza ripetere il nome:

```
bilancio di sostenibilità, VSME, carbon footprint di organizzazione,
GHG Protocol, ISO 14064-1, ISO 9001, ISO 14001, ISO 45001,
UNI/PdR 125, parità di genere, SA8000, economia circolare,
rendicontazione di sostenibilità, questionari ESG, qualifica fornitori,
sistemi di gestione, PMI
```

### Che cosa NON scrivere, mai

- Nomi, ruoli o riferimenti a persone.
- Numeri di telefono.
- Indirizzi o geografia più precisa di «Italia».
- La parola «certificato» riferita ai nostri documenti: sono di parte
  prima, la certificazione la rilascia un organismo accreditato.
- Confronti di prezzo con il mercato o giudizi sul lavoro di consulenti.
- Numeri che non possiamo dimostrare (clienti, tempi, risparmi).

### Contatto da usare dove è obbligatorio

```
info@verzero.it
```

---

## Ordine consigliato

**Adesso, senza aspettare la costituzione:**

1. Pagina aziendale LinkedIn — è quella che vale di più e costa meno.
2. SaaSHub (solo la scheda singola).
3. AlternativeTo, se il modulo si apre senza attriti.

**Dopo la costituzione, con la P.IVA:**

4. Capterra Italia — categoria Software ESG.
5. Crunchbase.

**Quando ci saranno i primi clienti attivi:**

6. G2 — ha senso quando qualcuno può lasciare una recensione.
7. Product Hunt — una volta sola, a prodotto provabile.

Dopo ogni iscrizione andata a buon fine: aggiungere l'URL del profilo a
`PROFILI_UFFICIALI` in `src/lib/seo.ts` e verificare che il nome e la
descrizione sul profilo coincidano con quelli qui sopra.
