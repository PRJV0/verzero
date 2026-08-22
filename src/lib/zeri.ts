/**
 * LE DECLINAZIONI DELLO ZERO — fonte unica.
 *
 * Stavano dentro la home, dove le usava una sola sezione. Ora le legge il
 * nastro (`NastroZero`) e potrebbero servire altrove: una lista scritta
 * due volte diventa due liste diverse alla prima modifica.
 *
 * REGOLA (CLAUDE.md): «Zero effort» non si dichiara MAI da solo. Per
 * questo ogni voce porta con sé la sua definizione in una riga — nel
 * nastro le due parti scorrono insieme, mai separate.
 *
 * Le note sono al presente e senza quantificazioni di tempo o impegno
 * (SPEC §12.O): ogni numero promesso è un ostaggio.
 */

export type DeclinazioneZero = {
  /** La parola-accento, in corsivo menta: «Zero», «Verso zero». */
  accento: string;
  /** Il seguito del titolo: «effort», «domande inutili». */
  coda: string;
  /** La definizione, che viaggia sempre attaccata al titolo. */
  nota: string;
  /** Solo per l'ultima: il segno della foglia. */
  foglia?: boolean;
};

export const ZERI: DeclinazioneZero[] = [
  {
    accento: "Zero",
    coda: "effort",
    nota: "bastano i documenti che hai già in azienda",
  },
  {
    accento: "Zero",
    coda: "documenti che invecchiano",
    nota: "quando una norma cambia, li rivediamo noi",
  },
  {
    accento: "Zero",
    coda: "domande inutili",
    nota: "la visura l'abbiamo già letta noi",
  },
  {
    accento: "Zero",
    coda: "blocchi",
    nota: "se un dato manca, lo stimiamo insieme e lo dichiariamo",
  },
  {
    accento: "Zero",
    coda: "scorciatoie",
    nota: "il Sigillo non si compra, si dimostra",
  },
  {
    accento: "Verso zero",
    coda: "emissioni",
    nota: "misurate, ridotte, dimostrate",
    foglia: true,
  },
];
