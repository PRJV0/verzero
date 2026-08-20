import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Contesto condiviso delle otto sezioni del portale (SPEC §12.H).
 *
 * Un solo punto risolve autenticazione, profilo e — per il consulente —
 * l'elenco clienti e il cliente selezionato (?cliente=). Ogni pagina
 * riceve l'organizzazione su cui lavorare: per l'impresa è la propria
 * (e la RLS la impone comunque), per il consulente quella scelta tra i
 * mandati attivi.
 */
export type ContestoPortale = {
  userId: string;
  email: string;
  ruolo: "impresa" | "consulente";
  wizardVisto: boolean;
  /** L'organizzazione su cui la sezione lavora (null: nessuna). */
  org: {
    id: string;
    ragione_sociale: string;
    partita_iva: string;
    dimensione: string;
    billing_email: string | null;
    /** Il sito ufficiale: da lì l'AI Ver0 legge il profilo pubblico (§12.D). */
    sito_web: string | null;
    /** L'anno solare chiuso a cui si riferiscono i documenti (§12.C). */
    anno_rendicontazione: number;
  } | null;
  /** Solo per il consulente: i clienti con mandato attivo. */
  clienti: { id: string; ragione_sociale: string }[];
};

export async function caricaContesto(
  clienteScelto?: string,
  /** Il percorso della sezione: serve per ripulire un ?cliente= non valido. */
  percorsoBase = "/dashboard",
): Promise<ContestoPortale> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo, wizard_visto_at, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const ruolo = profilo?.ruolo === "consulente" ? "consulente" : "impresa";

  if (ruolo === "consulente") {
    // La RLS mostra solo le organizzazioni con mandato attivo.
    const { data: clienti } = await supabase
      .from("organizations")
      .select("id, ragione_sociale, partita_iva, dimensione, billing_email, sito_web, anno_rendicontazione")
      .order("ragione_sociale");
    // Un ?cliente= che non corrisponde a un mandato attivo (revocato nel
    // frattempo, URL vecchio, id arbitrario) non deve restare nell'URL a
    // propagarsi: si riparte dalla sezione senza parametro.
    if (clienteScelto && !(clienti ?? []).some((c) => c.id === clienteScelto)) {
      redirect(percorsoBase);
    }
    const org =
      (clienteScelto && (clienti ?? []).find((c) => c.id === clienteScelto)) ||
      (clienti ?? [])[0] ||
      null;
    return {
      userId: user.id,
      email: user.email ?? "",
      ruolo,
      wizardVisto: true, // il wizard di primo accesso è dell'impresa
      org,
      clienti: (clienti ?? []).map((c) => ({
        id: c.id,
        ragione_sociale: c.ragione_sociale,
      })),
    };
  }

  // Filtro esplicito sull'organizzazione del profilo: la RLS può mostrare
  // anche organizzazioni gestite per mandato (utente insieme impresa e
  // consulente via back-office), e un maybeSingle() senza filtro con 2+
  // righe tornerebbe null azzerando il portale in silenzio.
  const { data: org } = profilo?.organization_id
    ? await supabase
        .from("organizations")
        .select("id, ragione_sociale, partita_iva, dimensione, billing_email, sito_web, anno_rendicontazione")
        .eq("id", profilo.organization_id)
        .maybeSingle()
    : { data: null };

  return {
    userId: user.id,
    email: user.email ?? "",
    ruolo,
    wizardVisto: profilo?.wizard_visto_at != null,
    org: org ?? null,
    clienti: [],
  };
}
