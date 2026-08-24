/**
 * SCENA DI PROVA PER LA VERIFICA VISIVA DEL MOTORE.
 *
 * Crea un'impresa di prova con un percorso attivo e una bolletta già
 * caricata, esegue la lettura, e stampa le credenziali per entrare nel
 * portale e GUARDARE il risultato. Serve a verificare con gli occhi ciò
 * che i test verificano con le asserzioni: dove finiscono i campi, come
 * si vede la confidenza, e se l'anello sale della quantità giusta.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/_scena-motore.mjs
 *   node --import ./scripts/risolutore-ts.mjs scripts/_scena-motore.mjs --pulisci
 *
 * ⚠ SCRIVE NELLA BANCA DATI VERA — quella a cui punta `.env.local`.
 * Crea un'impresa con partita IVA 99900011122, un utente, un percorso
 * attivo e un documento. Non è un test: è un banco, e **va pulito**
 * appena si è finito di guardare, con `--pulisci`.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = "scena-motore@verzero.it";
const PASSWORD = "ScenaMotore!2026";
const PIVA = "99900011122";

async function utenteEsistente() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data?.users?.find((u) => u.email === EMAIL) ?? null;
}

if (process.argv.includes("--pulisci")) {
  const u = await utenteEsistente();
  if (u) await admin.auth.admin.deleteUser(u.id);
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("partita_iva", PIVA)
    .maybeSingle();
  if (org) {
    const { data: docs } = await admin
      .from("documents")
      .select("percorso")
      .eq("organization_id", org.id);
    if (docs?.length) {
      await admin.storage.from("documenti").remove(docs.map((d) => d.percorso));
    }
    await admin.from("organizations").delete().eq("id", org.id);
  }
  console.log("Scena rimossa.");
  process.exit(0);
}

/* — 1. Impresa — */
let { data: org } = await admin
  .from("organizations")
  .select("id")
  .eq("partita_iva", PIVA)
  .maybeSingle();
if (!org) {
  const { data, error } = await admin
    .from("organizations")
    .insert({
      ragione_sociale: "Officina Lombardi S.r.l. (esempio)",
      partita_iva: PIVA,
      dimensione: "piccola",
      anno_rendicontazione: 2025,
    })
    .select("id")
    .single();
  if (error) throw error;
  org = data;
}

/* — 2. Accesso — */
let utente = await utenteEsistente();
if (!utente) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  utente = data.user;
}
await admin
  .from("profiles")
  .upsert({ id: utente.id, organization_id: org.id, full_name: "Prova Motore", role: "owner" });

/* — 3. Un percorso attivo, così le sezioni esistono — */
const { data: moduli } = await admin
  .from("module_activations")
  .select("id")
  .eq("organization_id", org.id)
  .eq("module", "carbon-footprint-scope-1-2");
if (!moduli?.length) {
  await admin.from("module_activations").insert({
    organization_id: org.id,
    module: "carbon-footprint-scope-1-2",
    stato: "attivo",
    activated_at: new Date().toISOString(),
  });
}

/* — 4. La bolletta: quella che genera `collaudo-motore.mjs`. — */
const pdf = readFileSync("/tmp/bolletta-collaudo.pdf");
const percorso = `${org.id}/bolletta_elettrica_gennaio_2025.pdf`;
await admin.storage
  .from("documenti")
  .upload(percorso, pdf, { contentType: "application/pdf", upsert: true });

let { data: doc } = await admin
  .from("documents")
  .select("id, stato")
  .eq("percorso", percorso)
  .maybeSingle();
if (!doc) {
  const { data, error } = await admin
    .from("documents")
    .insert({
      organization_id: org.id,
      nome_file: "bolletta_elettrica_gennaio_2025.pdf",
      percorso,
      mime: "application/pdf",
      dimensione: pdf.byteLength,
      tipo: "bolletta-elettrica",
      tipo_confermato: false,
      stato: "smistato",
    })
    .select("id, stato")
    .single();
  if (error) throw error;
  doc = data;
}

/* — 5. La lettura — */
if (!process.argv.includes("--senza-lettura")) {
  const { eseguiLettura } = await import("../src/lib/motore/registra.ts");
  const esito = await eseguiLettura({
    documentId: doc.id,
    organizationId: org.id,
    percorso,
    mime: "application/pdf",
    tipo: "bolletta-elettrica",
    annoRendicontazione: 2025,
  });
  console.log(`\nLettura: ${esito.ok ? "riuscita" : "fallita"} — ${esito.messaggio}`);
}

const { data: campi } = await admin
  .from("document_fields")
  .select("campo, valore, confidenza, stato, pagina")
  .eq("document_id", doc.id);

console.log(`
Scena pronta.

  Accesso : ${EMAIL}
  Password: ${PASSWORD}
  Impresa : Officina Lombardi S.r.l. (esempio) — ${org.id}
  Campi   : ${campi?.length ?? 0} righe in document_fields

  http://localhost:3000/login  →  /dashboard/documenti  e  /dashboard/percorsi

Per rimuovere tutto: node --import ./scripts/risolutore-ts.mjs scripts/_scena-motore.mjs --pulisci
`);
