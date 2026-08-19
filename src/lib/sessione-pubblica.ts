import { createClient } from "@/lib/supabase/server";

/**
 * LO STATO DI SESSIONE PER LE PAGINE PUBBLICHE.
 *
 * Serve a far comparire nell'header il nome dell'impresa al posto di
 * «Accedi» quando si è già dentro. Va letto LATO SERVER: con una
 * verifica fatta dopo l'idratazione il primo fotogramma mostrerebbe
 * «Accedi» anche a chi è autenticato, e chi ha appena fatto login
 * penserebbe di essere stato buttato fuori.
 *
 * Conseguenza da conoscere: leggere i cookie rende dinamiche le pagine
 * che lo fanno — non sono più generate una volta sola in fase di build.
 * È il prezzo di un indicatore corretto al primo colpo, e le pagine
 * restano interamente renderizzate dal server, quindi per i motori di
 * ricerca non cambia nulla.
 *
 * Non è un controllo di autorizzazione: quello resta della RLS e del
 * proxy. Qui decidiamo solo cosa disegnare.
 */
export type SessionePubblica = {
  autenticato: boolean;
  /** Ragione sociale dell'impresa, o lo studio per il consulente. */
  nome: string | null;
  /** L'iniziale per l'avatar quando il nome è lungo. */
  iniziale: string;
  email: string | null;
  ruolo: "impresa" | "consulente" | null;
};

const ANONIMO: SessionePubblica = {
  autenticato: false,
  nome: null,
  iniziale: "",
  email: null,
  ruolo: null,
};

export async function leggiSessionePubblica(): Promise<SessionePubblica> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ANONIMO;

    const { data: profilo } = await supabase
      .from("profiles")
      .select("ruolo, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const ruolo = profilo?.ruolo === "consulente" ? "consulente" : "impresa";
    let nome: string | null =
      ruolo === "consulente" ? "Consulente partner" : null;

    if (ruolo === "impresa" && profilo?.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("ragione_sociale")
        .eq("id", profilo.organization_id)
        .maybeSingle();
      nome = org?.ragione_sociale ?? null;
    }

    const etichetta = nome ?? user.email ?? "";
    return {
      autenticato: true,
      nome,
      iniziale: (etichetta.trim()[0] ?? "?").toUpperCase(),
      email: user.email ?? null,
      ruolo,
    };
  } catch {
    // Un guasto nel leggere la sessione non deve mai far cadere una
    // pagina pubblica: nel dubbio si mostra il sito come a un visitatore.
    return ANONIMO;
  }
}
