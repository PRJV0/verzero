/**
 * Test delle policy RLS (SPEC fase 1, criterio di completamento):
 * due account di due organizzazioni NON devono vedere i dati altrui.
 *
 * Esecuzione:  node scripts/test-rls.mjs
 * Richiede .env.local con NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY. Crea due utenti/organizzazioni di prova
 * (prefisso rls-test) e li elimina alla fine, qualunque sia l'esito.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- env da .env.local (senza dipendenze) ---
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) {
  console.error("Variabili mancanti in .env.local");
  process.exit(1);
}

const admin = createClient(URL_, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = Math.random().toString(36).slice(2, 8);
const PASSWORD = "RlsTest-" + stamp + "-Aa1";
const utenti = [
  { email: `rls-test-a-${stamp}@example.com`, piva: "00743110157", nome: `RLS Test A ${stamp}` },
  { email: `rls-test-b-${stamp}@example.com`, piva: "00905811006", nome: `RLS Test B ${stamp}` },
];

let esiti = [];
function check(nome, ok, dettaglio = "") {
  esiti.push({ nome, ok });
  console.log(`${ok ? "✅" : "❌"} ${nome}${dettaglio ? " — " + dettaglio : ""}`);
}

const daPulire = { userIds: [], orgIds: [] };

async function setupUno({ email, piva, nome }) {
  const { data: u, error: eu } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (eu) throw new Error("createUser: " + eu.message);
  daPulire.userIds.push(u.user.id);

  const { data: org, error: eo } = await admin
    .from("organizations")
    .insert({ ragione_sociale: nome, partita_iva: piva, dimensione: "micro" })
    .select()
    .single();
  if (eo) throw new Error("insert org: " + eo.message);
  daPulire.orgIds.push(org.id);

  const { error: ep } = await admin
    .from("profiles")
    .insert({ id: u.user.id, organization_id: org.id, role: "owner" });
  if (ep) throw new Error("insert profile: " + ep.message);

  const { data: ord, error: er } = await admin
    .from("orders")
    .insert({
      organization_id: org.id,
      created_by: u.user.id,
      servizio_slug: "carbon-light",
      dimensione: "micro",
      formula: "mensile",
      prezzo_canone: 45,
    })
    .select()
    .single();
  if (er) throw new Error("insert order: " + er.message);

  const { error: ec } = await admin.from("consents").insert({
    organization_id: org.id,
    user_id: u.user.id,
    doc_type: "condizioni_servizio",
    doc_version: "test",
    accepted_at: new Date().toISOString(),
  });
  if (ec) throw new Error("insert consent: " + ec.message);

  const client = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: el } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (el) throw new Error("login: " + el.message);

  return { client, org, ordine: ord, userId: u.user.id };
}

async function main() {
  console.log("— setup: due utenti, due organizzazioni, dati per ciascuna —");
  const A = await setupUno(utenti[0]);
  const B = await setupUno(utenti[1]);

  console.log("\n— test isolamento (utente A) —");

  {
    const { data } = await A.client.from("organizations").select("id");
    check(
      "A vede solo la propria organizzazione",
      data?.length === 1 && data[0].id === A.org.id,
      `viste: ${data?.length}`,
    );
  }
  {
    const { data } = await A.client
      .from("organizations")
      .select("id")
      .eq("id", B.org.id);
    check("A non legge l'organizzazione di B", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client.from("orders").select("id, organization_id");
    check(
      "A vede solo i propri ordini",
      (data ?? []).every((o) => o.organization_id === A.org.id) && data.length === 1,
    );
  }
  {
    const { data } = await A.client.from("consents").select("id").eq("organization_id", B.org.id);
    check("A non legge i consensi di B", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client.from("profiles").select("id");
    check(
      "A vede solo i profili della propria org",
      (data ?? []).length === 1 && data[0].id === A.userId,
    );
  }
  {
    // Update cross-org: non deve toccare righe (0 aggiornate).
    const { data } = await A.client
      .from("organizations")
      .update({ settore: "hack" })
      .eq("id", B.org.id)
      .select();
    const { data: verifica } = await admin
      .from("organizations")
      .select("settore")
      .eq("id", B.org.id)
      .single();
    check(
      "A non aggiorna l'organizzazione di B",
      (data ?? []).length === 0 && verifica.settore === null,
    );
  }
  {
    // Insert nell'org di B: la policy with check deve rifiutare.
    const { error } = await A.client.from("orders").insert({
      organization_id: B.org.id,
      servizio_slug: "carbon-light",
      dimensione: "micro",
      formula: "mensile",
      prezzo_canone: 1,
    });
    check("A non inserisce ordini nell'org di B", !!error, error?.code ?? "");
  }
  {
    // Anonimo: nessuna policy → nessuna riga.
    const anonClient = createClient(URL_, ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await anonClient.from("organizations").select("id");
    check("anonimo non legge nulla", (data ?? []).length === 0);
  }
  {
    // Simmetria: B non vede A.
    const { data } = await B.client.from("orders").select("organization_id");
    check(
      "B vede solo i propri ordini",
      (data ?? []).every((o) => o.organization_id === B.org.id) && data.length === 1,
    );
  }
}

async function cleanup() {
  for (const id of daPulire.orgIds) {
    await admin.from("organizations").delete().eq("id", id);
  }
  for (const id of daPulire.userIds) {
    await admin.auth.admin.deleteUser(id);
  }
  console.log("\n— pulizia completata (utenti e organizzazioni di prova rimossi) —");
}

try {
  await main();
} catch (e) {
  console.error("ERRORE DI SETUP/ESECUZIONE:", e.message);
  esiti.push({ nome: "esecuzione", ok: false });
} finally {
  try {
    await cleanup();
  } catch (e) {
    console.error("pulizia incompleta:", e.message);
  }
}

const falliti = esiti.filter((e) => !e.ok);
console.log(`\nRisultato: ${esiti.length - falliti.length}/${esiti.length} test superati`);
process.exit(falliti.length ? 1 : 0);
