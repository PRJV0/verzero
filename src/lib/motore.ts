import {
  BadgeCheck,
  ClipboardList,
  Database,
  FileSearch,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Le cinque fasi del Motore Ver0 — fonte unica per la sezione narrativa,
 * usata sia in home sia in chi-siamo (SPEC §12.P: raccolta documentale
 * guidata, mai «carica quello che vuoi»).
 */
export type FaseMotore = {
  icon: LucideIcon;
  titolo: string;
  desc: string;
  /** Esempio concreto mostrato accanto alla fase. */
  esempio: string;
};

export const MOTORE_FASI: FaseMotore[] = [
  {
    icon: ClipboardList,
    titolo: "Ti chiediamo documenti precisi",
    desc: "Per ogni percorso il Motore indica la lista puntuale di ciò che serve: non «carica quello che vuoi», ma esattamente quello che la norma richiede.",
    esempio: "Carbon: bollette dei vettori energetici, registri carburanti, visura",
  },
  {
    icon: FileSearch,
    titolo: "Legge e struttura",
    desc: "Estrae i dati dai documenti — anche da una foto — li normalizza e li etichetta per qualità: misurato, da documento, stimato.",
    esempio: "POD, consumi in kWh, periodo di fatturazione, tipo di fornitura",
  },
  {
    icon: Database,
    titolo: "Incrocia le banche dati ufficiali",
    desc: "Collega i tuoi dati alle fonti camerali ed energetiche e segnala cosa manca, prima che diventi un problema.",
    esempio: "Anagrafica, ATECO, addetti, unità locali dal Registro Imprese",
  },
  {
    icon: BadgeCheck,
    titolo: "Genera i documenti conformi",
    desc: "Costruisce ogni documento sulla struttura della norma di riferimento, con i valori tracciabili alla fonte riga per riga.",
    esempio: "Report GHG secondo UNI EN ISO 14064-1 e GHG Protocol",
  },
  {
    icon: UserCheck,
    titolo: "Un professionista verifica",
    desc: "Il team tecnico valida prima dell'emissione: la responsabilità resta di una persona, con nome e cognome dentro la piattaforma.",
    esempio: "Marcatore «verificato dal team tecnico» sul documento emesso",
  },
];
