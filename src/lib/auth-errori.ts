/**
 * MESSAGGI D'ERRORE DELL'ACCESSO (SPEC §12.E) — fonte unica.
 *
 * Regola: mai un errore muto e mai un messaggio che mente. Se le
 * credenziali sono giuste ma manca un passaggio, il testo lo dice; se
 * abbiamo mandato troppe email, diciamo quanto aspettare. Il messaggio
 * spiega anche COSA FARE ORA: è il principio del linguaggio per non
 * esperti applicato al momento più frustrante del prodotto.
 */

/** Cosa può offrire l'interfaccia dopo l'errore, oltre al testo. */
export type RimedioAuth =
  /** Nessuna azione: basta correggere e riprovare. */
  | "nessuno"
  /** Proporre il reset della password. */
  | "reset"
  /** L'utente deve confermare l'indirizzo: offrire il rinvio. */
  | "conferma"
  /** Troppi tentativi: invitare ad attendere. */
  | "attendi";

export type ErroreAuth = {
  messaggio: string;
  rimedio: RimedioAuth;
  /** Secondi da attendere, quando il servizio li dichiara. */
  attesaSecondi?: number;
};

type ErroreSupabase = {
  code?: string;
  status?: number;
  message?: string;
};

/** «tra 47 secondi» / «tra 2 minuti»: mai un numero crudo di secondi. */
function attesaLeggibile(secondi: number): string {
  if (secondi < 90) return `tra ${Math.max(secondi, 5)} secondi`;
  const minuti = Math.ceil(secondi / 60);
  return `tra ${minuti} minuti`;
}

/** Supabase mette l'attesa nel testo: «... after 47 seconds». */
function secondiDaMessaggio(message: string): number | undefined {
  const m = message.match(/(\d+)\s*second/i);
  if (m) return Number(m[1]);
  const min = message.match(/(\d+)\s*minute/i);
  if (min) return Number(min[1]) * 60;
  return undefined;
}

/**
 * Traduce un errore di Supabase Auth in un messaggio per una persona.
 * `contesto` cambia solo le sfumature: la stessa condizione va detta in
 * modo diverso mentre accedi, mentre ti registri o mentre chiedi il reset.
 */
export function messaggioErroreAuth(
  errore: unknown,
  contesto: "accesso" | "registrazione" | "reset" | "cambio" = "accesso",
): ErroreAuth {
  const e = (errore ?? {}) as ErroreSupabase;
  const code = e.code ?? "";
  const message = e.message ?? "";
  const status = e.status ?? 0;

  // Troppi tentativi / troppe email: il caso che va detto con precisione,
  // perché l'utente ha fatto tutto giusto e deve solo aspettare.
  if (
    status === 429 ||
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    /rate limit/i.test(message)
  ) {
    const secondi = secondiDaMessaggio(message);
    const quando = secondi ? attesaLeggibile(secondi) : "tra qualche minuto";
    return {
      messaggio:
        contesto === "reset"
          ? `Abbiamo già inviato un'email di recupero da poco: riprova ${quando}. Se la prima non è arrivata, controlla anche la posta indesiderata.`
          : `Troppi tentativi ravvicinati: riprova ${quando}. Non è colpa dei tuoi dati, è una protezione automatica.`,
      rimedio: "attendi",
      attesaSecondi: secondi,
    };
  }

  // Indirizzo non ancora confermato: le credenziali SONO giuste. Dirlo.
  if (code === "email_not_confirmed" || /not confirmed/i.test(message)) {
    return {
      messaggio:
        "Email e password sono corrette, ma l'indirizzo non è ancora confermato. Ti rimandiamo il link di conferma: aprilo e sei dentro.",
      rimedio: "conferma",
    };
  }

  // Credenziali sbagliate: mai insinuare che sia un problema di sistema.
  if (code === "invalid_credentials" || /invalid login/i.test(message)) {
    return {
      messaggio:
        "Email o password non corrispondono. Controlla di non avere il blocco maiuscole attivo; se non ricordi la password puoi reimpostarla.",
      rimedio: "reset",
    };
  }

  if (code === "user_not_found" || status === 404) {
    return {
      messaggio:
        "Non troviamo un account con questa email. Controlla l'indirizzo: l'account nasce al primo acquisto dal catalogo.",
      rimedio: "nessuno",
    };
  }

  if (
    code === "weak_password" ||
    (/password/i.test(message) && /weak|short|characters/i.test(message))
  ) {
    return {
      messaggio:
        "La password è troppo debole: servono almeno 8 caratteri con una maiuscola, una minuscola e un numero.",
      rimedio: "nessuno",
    };
  }

  if (code === "same_password" || /should be different/i.test(message)) {
    return {
      messaggio:
        "La nuova password è identica a quella attuale: scegline una diversa.",
      rimedio: "nessuno",
    };
  }

  if (code === "user_already_exists" || /already registered|already exists/i.test(message)) {
    return {
      messaggio:
        "Questa email ha già un account. Accedi con la tua password, oppure reimpostala se non la ricordi.",
      rimedio: "reset",
    };
  }

  // Indirizzo rifiutato dal servizio (dominio inesistente o di prova).
  if (code === "email_address_invalid" || code === "email_address_not_authorized") {
    return {
      messaggio:
        "Questo indirizzo email non è accettato: controlla che sia scritto bene e che il dominio esista davvero.",
      rimedio: "nessuno",
    };
  }

  // Link o sessione non più validi. ATTENZIONE: si riconoscono dai CODICI e
  // da frasi precise, mai dalla sola parola «invalid» nel testo — ci
  // finivano dentro errori di tutt'altra natura, e il messaggio mentiva.
  if (
    code === "otp_expired" ||
    code === "session_not_found" ||
    code === "flow_state_not_found" ||
    code === "flow_state_expired" ||
    code === "bad_jwt" ||
    /link is invalid or has expired|token has expired|refresh token/i.test(message)
  ) {
    return {
      messaggio:
        contesto === "cambio"
          ? "La sessione è scaduta mentre cambiavi la password: rientra e riprova."
          : "Il link non è più valido: i link di recupero scadono dopo un'ora e valgono una volta sola. Richiedine uno nuovo.",
      rimedio: contesto === "reset" || contesto === "cambio" ? "nessuno" : "reset",
    };
  }

  // Rete o servizio: onesto sul fatto che non dipende dall'utente.
  return {
    messaggio:
      "Qualcosa è andato storto da parte nostra. Riprova tra un momento; se insiste, scrivici dalla pagina contatti.",
    rimedio: "nessuno",
  };
}
