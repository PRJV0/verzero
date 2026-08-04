import {
  Landmark,
  RefreshCw,
  BadgeCheck,
  Archive,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

/**
 * "Il canone include" (SPEC §12.V) — il pacchetto che ogni abbonamento attivo
 * comprende, su qualunque servizio. Fonte unica: la sezione dedicata in home
 * e i richiami accanto a ogni prezzo /mese leggono da qui.
 * Vincolo: mai promesse di esito sui bandi.
 */
export type BeneficioCanone = {
  icon: LucideIcon;
  title: string;
  desc: string;
  /** Nota secondaria (es. disclaimer bandi). */
  note?: string;
};

export const CANONE_INCLUDE: BeneficioCanone[] = [
  {
    icon: RefreshCw,
    title: "Il tuo documento non invecchia mai",
    desc: "Quando una norma cambia o ne arriva una nuova, il Motore Ver0 segnala l'impatto e aggiorna i documenti interessati — con verifica umana dove prevista.",
    note: "— Motore Ver0",
  },
  {
    icon: Landmark,
    title: "Osservatorio bandi, riservato agli abbonati",
    desc: "Bandi e incentivi pertinenti per il tuo profilo: settore, dimensione, territorio e percorsi attivi, con le scadenze in chiaro.",
    note: "Fanno fede i documenti ufficiali degli enti: nessuna promessa di ammissione o esito.",
  },
  {
    icon: BadgeCheck,
    title: "Mantenimento del Sigillo",
    desc: "Rinnovo annuale dei percorsi verificati, millesimo aggiornato, pagina pubblica di verifica sempre attiva.",
  },
  {
    icon: Archive,
    title: "Archivio e assistenza inclusi",
    desc: "I tuoi documenti sempre disponibili in un posto solo, con assistenza uomo+AI compresa nel canone.",
  },
  {
    icon: Megaphone,
    title: "Kit Comunicazione Ver0",
    desc: "Claim verificati con la fonte a supporto, materiali per filiera e banche, verifica anti-greenwashing dei tuoi testi. Comunichi solo ciò che puoi dimostrare.",
  },
];

/** Riga sintetica da mostrare accanto ai prezzi /mese. */
export const CANONE_INLINE =
  "Ogni canone include: bandi per il tuo profilo, documenti sempre aggiornati alle norme, mantenimento del Sigillo, archivio e assistenza, Kit Comunicazione.";
