#!/usr/bin/env node
/**
 * DIAGNOSI DELLA POSTA (SPEC §12.E).
 *
 * Prima di chiedersi «è finita in spam?», conviene guardare le cose che
 * decidono se ci finirà: l'autenticazione del dominio. SPF, DKIM e DMARC
 * non sono opinioni — o i record ci sono e sono verificati, o non ci
 * sono. Questo script legge lo stato del dominio su Resend e, se gli si
 * passa un indirizzo, manda un messaggio di prova.
 *
 *   node --env-file=.env.local scripts/verifica-resend.mjs
 *   node --env-file=.env.local scripts/verifica-resend.mjs prova@dominio.it
 */

const chiave = process.env.RESEND_API_KEY;
if (!chiave) {
  console.error(
    "Manca RESEND_API_KEY in .env.local (averla su Vercel non basta: questo script gira in locale).",
  );
  process.exit(1);
}

const intestazioni = { Authorization: `Bearer ${chiave}` };

const risposta = await fetch("https://api.resend.com/domains", {
  headers: intestazioni,
});

let domini = [];
if (risposta.ok) {
  ({ data: domini = [] } = await risposta.json());
} else {
  const dettaglio = await risposta.text();
  // Una chiave di solo invio non può leggere i domini: è il permesso
  // GIUSTO (meno può fare, meglio è). Non è un problema da risolvere
  // allargando i permessi: lo stato del dominio si vede dal pannello
  // Resend, e la prova che conta la danno le intestazioni dei messaggi
  // effettivamente ricevuti — vedi scripts/collaudo-accesso.mjs.
  if (/restricted/i.test(dettaglio)) {
    console.log(
      [
        "La chiave è di SOLO INVIO e non può elencare i domini: giusto così,",
        "è il permesso minimo necessario. Lo stato del dominio si legge dal",
        "pannello Resend; SPF, DKIM e DMARC li misura il collaudo leggendo",
        "le intestazioni dei messaggi davvero ricevuti.",
      ].join("\n"),
    );
  } else {
    console.error(`Resend ha risposto ${risposta.status}: ${dettaglio}`);
    process.exit(1);
  }
}

if (domini.length === 0 && risposta.ok) {
  console.log("Nessun dominio configurato su Resend.");
  process.exit(1);
}

for (const dominio of domini) {
  console.log(`\nDominio: ${dominio.name}  →  ${dominio.status}`);
  console.log(`  regione: ${dominio.region ?? "—"}`);

  // Il dettaglio dei record: è qui che si vede se DKIM e SPF reggono.
  const dettaglio = await fetch(`https://api.resend.com/domains/${dominio.id}`, {
    headers: intestazioni,
  });
  if (!dettaglio.ok) continue;
  const d = await dettaglio.json();
  for (const record of d.records ?? []) {
    const tipo =
      record.record === "DKIM" || /domainkey/i.test(record.name ?? "")
        ? "DKIM"
        : /dmarc/i.test(record.name ?? "")
          ? "DMARC"
          : record.record === "SPF"
            ? "SPF"
            : (record.record ?? record.type);
    console.log(
      `  ${String(tipo).padEnd(6)} ${String(record.status ?? "—").padEnd(12)} ${String(record.name ?? "").slice(0, 40)}`,
    );
  }
  const haDmarc = (d.records ?? []).some((r) => /dmarc/i.test(r.name ?? ""));
  if (!haDmarc) {
    console.log(
      "  DMARC  assente      → non blocca l'invio, ma un record DMARC (anche p=none)\n" +
        "                        migliora la reputazione e dice ai provider come trattare\n" +
        "                        i messaggi non autenticati. Vale la pena aggiungerlo.",
    );
  }
}

const destinatario = process.argv[2];
if (destinatario) {
  const mittente = process.env.RESEND_FROM ?? "Ver0 <noreply@verzero.it>";
  console.log(`\nInvio di prova da ${mittente} a ${destinatario}…`);
  const invio = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { ...intestazioni, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: mittente,
      to: [destinatario],
      subject: "Prova di consegna — Ver0",
      text: [
        "Messaggio di prova inviato dalla configurazione Resend di Ver0.",
        "",
        "Se lo stai leggendo, il dominio è autenticato e la consegna funziona.",
        "Controlla nell'intestazione del messaggio che SPF, DKIM e DMARC",
        "risultino 'pass': è quello che decide se i messaggi successivi",
        "finiranno nella posta in arrivo o in quella indesiderata.",
      ].join("\n"),
    }),
  });
  const esito = await invio.json();
  console.log(
    invio.ok
      ? `  inviato, id ${esito.id}`
      : `  NON inviato (${invio.status}): ${JSON.stringify(esito)}`,
  );
}
