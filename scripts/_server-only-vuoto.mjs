/**
 * Sostituto di `server-only` per il banco di prova.
 *
 * `server-only` esiste per far FALLIRE la compilazione del pacchetto
 * client se un modulo di server ci finisce dentro. In uno script Node non
 * c'è nessun pacchetto client: la guardia non protegge niente e impedisce
 * soltanto di provare il codice di server. Qui la si sostituisce con il
 * vuoto — nel codice dell'applicazione resta, intatta, dov'è utile.
 */
export {};
