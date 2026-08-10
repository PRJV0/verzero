/**
 * Regole del modulo di contatto — fonte unica per client e server.
 *
 * Le stesse regole girano due volte: nel browser per dare un errore
 * immediato e comprensibile, sul server perché è lì che si decide davvero.
 * Tenerle in un posto solo evita che le due validazioni divergano.
 */

export const OGGETTI = [
  {
    valore: "informazioni",
    label: "Informazioni generali",
    aiuto: "Domande su Ver0, su come funziona, sui tempi.",
  },
  {
    valore: "servizi",
    label: "Un servizio in particolare",
    aiuto: "Carbon, VSME, sistemi di gestione, Sigillo, prezzi.",
  },
  {
    valore: "partnership",
    label: "Partnership",
    aiuto: "Commercialisti, consulenti, associazioni, enti.",
  },
] as const;

export type Oggetto = (typeof OGGETTI)[number]["valore"];

export const OGGETTI_VALORI = OGGETTI.map((o) => o.valore) as readonly string[];

export const LIMITI = {
  nome: { min: 2, max: 120 },
  azienda: { max: 160 },
  email: { max: 254 },
  messaggio: { min: 10, max: 4000 },
} as const;

/** Controllo di forma, non di esistenza: la casella si verifica scrivendo. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

export type CampoContatto = "nome" | "azienda" | "email" | "oggetto" | "messaggio";

export type DatiContatto = {
  nome: string;
  azienda: string;
  email: string;
  oggetto: string;
  messaggio: string;
};

/**
 * Restituisce un errore per campo, in italiano e utile: dice cosa fare,
 * non solo che qualcosa è sbagliato.
 */
export function validaContatto(
  d: Partial<DatiContatto>,
): Partial<Record<CampoContatto, string>> {
  const errori: Partial<Record<CampoContatto, string>> = {};
  const nome = (d.nome ?? "").trim();
  const azienda = (d.azienda ?? "").trim();
  const email = (d.email ?? "").trim();
  const messaggio = (d.messaggio ?? "").trim();

  if (nome.length < LIMITI.nome.min)
    errori.nome = "Scrivi il tuo nome: almeno 2 caratteri.";
  else if (nome.length > LIMITI.nome.max)
    errori.nome = `Il nome non può superare ${LIMITI.nome.max} caratteri.`;

  if (azienda.length > LIMITI.azienda.max)
    errori.azienda = `Il nome dell'azienda non può superare ${LIMITI.azienda.max} caratteri.`;

  if (!email) errori.email = "Serve un'email per poterti rispondere.";
  else if (email.length > LIMITI.email.max || !EMAIL.test(email))
    errori.email = "Controlla l'email: manca la @ o il dominio non è completo.";

  if (!OGGETTI_VALORI.includes(d.oggetto ?? ""))
    errori.oggetto = "Scegli di cosa vuoi parlare.";

  if (messaggio.length < LIMITI.messaggio.min)
    errori.messaggio = `Racconta qualcosa in più: almeno ${LIMITI.messaggio.min} caratteri.`;
  else if (messaggio.length > LIMITI.messaggio.max)
    errori.messaggio = `Il messaggio non può superare ${LIMITI.messaggio.max} caratteri.`;

  return errori;
}

/** La promessa che facciamo in pagina, in un posto solo. */
export const PROMESSA_RISPOSTA =
  "Ti risponderemo entro un giorno lavorativo.";
