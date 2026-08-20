# Brief di esperienza — Verzero
Documento di direzione UX/UI/interaction design. Non è una lista di ritocchi: è il modo in cui il prodotto deve *comportarsi*.

## 1. Il problema, detto onestamente
Oggi il sito e il portale sono corretti, puliti e leggibili — e piatti. Tutto ha lo stesso peso, niente si muove per un motivo, nulla sorprende. Un utente non ricorda nulla dopo averlo chiuso. Il salto da fare non è "più grafica": è **dare al prodotto un comportamento**.

## 2. Tre principi guida
**a) Ogni schermata ha UN protagonista.** Un solo elemento domina (per scala, colore o movimento); tutto il resto è supporto. Se due cose competono, una delle due va spostata o eliminata.
**b) Il movimento spiega, non decora.** Nessuna animazione esiste per bellezza: mostra una trasformazione (documento → dato), rivela una gerarchia, o dà una risposta a un gesto. Se non spiega nulla, si toglie.
**c) La sorpresa nasce dalla competenza, non dagli effetti.** L'effetto "wow" più forte di Verzero non è un video: è il momento in cui l'utente vede la piattaforma sapere cose di lui che non ha inserito. Il design deve mettere in scena *quello*.

## 3. I momenti da progettare (in ordine di impatto)
1. **Primo impatto in home (0-3 secondi).** Il claim deve entrare in scena, non stare fermo. Vedi §4.
2. **Il Motore che lavora.** Da sequenza raccontata a sequenza vista: documento reale → campi che si accendono uno a uno → documento conforme. È la scena madre.
3. **Il numero che sale.** L'anello di completamento che avanza sotto gli occhi quando arriva un dato: micro-momento, altissima soddisfazione.
4. **Il riconoscimento (portale, primo accesso).** "Abbiamo già trovato 7 dati sulla tua impresa" con i campi che compaiono in sequenza, ognuno con la sua fonte.
5. **La conferma di un dato.** Gesto singolo, feedback immediato e fisico (spunta che si disegna, riga che cambia stato, contatore che scende).
6. **Il Sigillo.** L'anello che si chiude segmento dopo segmento: la meccanica del prodotto resa visibile.

## 4. Il primo impatto: opzioni a confronto
**Opzione A — Video di sfondo.** Massimo impatto emotivo, standard delle piattaforme tech. Costi reali: peso (anche ottimizzato, MB), impatto su LCP e Core Web Vitals (che abbiamo appena messo a posto), consumo dati su mobile, e il rischio "stock video generico" che abbassa la percezione invece di alzarla. Se si fa: video muto, in loop, breve (6-10s), sotto i 2 MB, con poster statico immediato, disattivato su rete lenta e su prefers-reduced-motion, mai su mobile (dove si mostra il poster).
**Opzione B — Movimento vettoriale del brand.** Lo zero canonico che si costruisce con un tratto, filigrane che scorrono lentamente, particelle-documento che convergono nel Motore: leggerissimo (SVG/CSS, pochi KB), sempre coerente col brand, nessun rischio stock, funziona su ogni dispositivo.
**Opzione C — Tipografia cinetica.** Il claim si compone parola per parola, la parola-Zero si trasforma (es. "zero" che diventa il segno grafico), sfondo a gradiente vivo che si muove impercettibilmente. Costo quasi nullo, altissima personalità editoriale.
**Raccomandazione:** C come base + B come strato di profondità; A solo con girato **vero** (le tue imprese, i tuoi luoghi) quando ce ne sarà uno — un video generico di gente in ufficio farebbe scendere Verzero al livello di tutti gli altri.

## 5. Sistema di movimento (regole, non gusti)
- Durate: micro-interazioni 150ms, transizioni di stato 250ms, ingressi di sezione 400ms. Una sola curva di accelerazione in tutto il prodotto.
- Ingressi: mai più di 3 elementi animati contemporaneamente; scaglionamento 60-80ms tra elementi di una lista.
- Ogni elemento cliccabile ha 4 stati progettati: riposo, hover, premuto, disabilitato. Nessuno può essere identico all'altro.
- `prefers-reduced-motion`: tutto statico, nessun contenuto perso.
- Nessuna animazione blocca l'interazione. Mai.

## 6. Interfaccia: densità e leggibilità
- Zone di **input** e zone di **lettura** graficamente diverse e riconoscibili a colpo d'occhio (sfondo, bordo, ombra).
- Colore = significato, sempre lo stesso: menta = l'AI ha fatto, ambra = serve a te, pino = struttura, grigio = in attesa.
- Ogni numero ha un indicatore visivo (anello, barra, sparkline). Nessuna cifra nuda in mezzo al testo.
- Icone: un set unico, stesso peso di tratto, sempre dentro contenitori regolari.
- Testo: gerarchia a quattro livelli chiaramente distinti (display, titolo, corpo, secondario). Se due livelli si somigliano, uno è di troppo.

## 7. Usabilità: le regole non negoziabili
- Ogni schermata risponde a: dove sono, cosa posso fare qui, cosa succede dopo.
- Nessun vicolo cieco: ogni stato vuoto propone un'azione.
- Errori: cosa è successo, perché, cosa fare adesso. Mai codici, mai "errore generico".
- Attese: sempre un'indicazione di progresso onesta; se dura più di 2 secondi, si dice cosa sta accadendo.
- Mobile-first davvero: aree toccabili ≥44px, niente hover come unico modo di scoprire qualcosa.
- Accessibilità: contrasti verificati, focus visibile, navigazione da tastiera, testi alternativi.

## 8. Criteri di accettazione
1. Uno screenshot senza logo è riconoscibile come Ver0.
2. Un visitatore che scorre la home in 10 secondi sa: cosa fai, che c'è un'AI potente sotto, quanto costi, dove cliccare.
3. Chi apre il portale la prima volta capisce in 5 secondi dove inserire dati, dove leggere risultati, cosa manca.
4. Almeno tre momenti dell'esperienza fanno alzare un sopracciglio (in senso buono).
5. Core Web Vitals restano verdi: nessun effetto pagato con la velocità.
