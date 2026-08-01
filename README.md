# Verzero

Piattaforma di sostenibilità ed efficienza energetica per PMI.
Specifica di riferimento: [SPEC.md](SPEC.md) · stato dei lavori: [PROGRESS.md](PROGRESS.md)

## Avvio locale

Serve Node.js 20+ (non installato sulla macchina di sviluppo attuale):

```bash
winget install OpenJS.NodeJS.LTS
```

Poi, dalla radice del progetto:

```bash
npm install
```

Copia `.env.local.example` in `.env.local` e compila le variabili (progetto Supabase
in regione EU, Francoforte). Infine:

```bash
npm run dev
```

## Struttura

```
src/
  app/
    (public)/      sito pubblico — home, servizi, prezzi
    (auth)/        login
    (app)/         area riservata (protetta dal middleware)
    auth/callback/ scambio del magic link con la sessione
  components/ui/   componenti riusabili, stile dal prototipo
  lib/
    supabase/      client browser / server / admin
    ai/            estrazione documenti via Claude API (fase 2)
    calc/          motore di calcolo emissioni (fase 3)
  types/           tipi del database (rigenerati da Supabase)
supabase/migrations/  schema e policy RLS (fase 1)
docs/
  riferimenti/     prototipo visivo
  schede-servizio/ una scheda per modulo (SPEC §16)
```

## Regole non negoziabili

- **RLS attiva su tutte le tabelle.** È la barriera di sicurezza primaria; il codice
  applicativo è la seconda (SPEC §3).
- **La chiave Claude non raggiunge mai il browser.** Le chiamate all'API avvengono
  solo in route handler e server action.
- **I fattori di emissione non si scrivono nel codice**: si leggono sempre dalla
  tabella `emission_factors`, così l'aggiornamento annuale non richiede un deploy.
- **Mai chiedere un dato che si può estrarre da un documento caricato.**
