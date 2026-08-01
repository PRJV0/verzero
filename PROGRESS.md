# PROGRESS — Verzero

Stato del lavoro, aggiornato a ogni sessione. Chi riparte legge da qui.

## Fase 0 — Setup

**Stato: scaffold completato, dipendenze installate, typecheck verde, repo git inizializzato.**

Fatto:

- `npm install` eseguito: 374 pacchetti, Next 15.5.21 / React 19.2.8 / TypeScript 5.9.3.
- `npx tsc --noEmit` passa: il codice compila.
- `git init` su branch `main`, 31 file in staging, `.env.local` verificato escluso.
- Modello di estrazione reso parametro (`src/lib/ai/config.ts` + `ANTHROPIC_EXTRACTION_MODEL`).


- Struttura Next.js 15 (App Router) + TypeScript + Tailwind v4, scritta a mano.
- Client Supabase nelle tre varianti: browser, server (RLS attiva), admin/service role.
- Middleware di sessione: rinfresca il token a ogni richiesta e protegge l'area riservata.
- Login via magic link + route di callback + dashboard autenticata (il criterio di
  completamento della fase 0).
- Token di brand del prototipo portati in `src/app/globals.css`.
- `SPEC.md` in radice, prototipo in `docs/riferimenti/verzero-prototipo.jsx`.

Da fare per chiudere la fase:

1. **Mettere Node nel PATH.** Non è installato: è lo ZIP `node-v24.18.0-win-x64`
   estratto in `Downloads`. Finché resta lì, ogni terminale nuovo non vede `node`.
   Va installato con l'installer MSI, oppure la cartella va aggiunta al PATH utente.
2. Creare il progetto Supabase in **regione EU (Francoforte)**, copiare
   `.env.local.example` in `.env.local` e compilarlo.
3. `npm run dev` e verificare il giro: home → login → email → dashboard.
4. Primo commit.
5. Deploy su Vercel con funzioni in regione EU (`fra1`) e le stesse variabili d'ambiente.

## Fase 1 — Fondamenta (non iniziata)

Schema DB di SPEC §4 con RLS su tutte le tabelle, onboarding organizzazione, inviti utenti.
Le migration vanno in `supabase/migrations/`. Prima di considerare chiusa la fase servono
**test espliciti di RLS**: due account di due organizzazioni non devono vedersi i dati.
Dopo le migration, rigenerare `src/types/database.ts` invece di scriverlo a mano.

## Decisioni prese

- **Login senza password** (magic link): meno superficie di rischio e nessuna credenziale
  da custodire per 3-5 aziende pilota. Rivedibile se i piloti lo trovano scomodo.
- **Tailwind v4** (CSS-first, `@theme` in `globals.css`): niente `tailwind.config.ts`.
- `src/lib/env.ts` fallisce subito se manca una variabile d'ambiente. Voluto: meglio
  un errore leggibile al primo avvio che un 401 opaco da Supabase. Conseguenza:
  anche `npm run build` richiede le variabili pubbliche impostate.

## Punti aperti

- **Modello Claude per l'estrazione: deciso in fase 2, con benchmark su bollette reali.**
  Nel frattempo è un parametro (`ANTHROPIC_EXTRACTION_MODEL`), non una scelta
  fissata nel codice: si cambia senza deploy. Candidati e default in
  `src/lib/ai/config.ts`. Metriche da misurare: campi estratti correttamente su
  bollette vere, tasso di `confidence: low`, costo per documento.
- **Script di installazione bloccati da npm** per `sharp` e `unrs-resolver`.
  Conseguenze: l'ottimizzazione immagini di Next e il resolver di ESLint potrebbero
  non funzionare. Si sbloccano con `npm approve-scripts` — da valutare.
- **`SPEC.md` è ora l'unica fonte di verità.** Gli originali numerati sono stati
  rimossi dalla radice: le revisioni nuove della specifica vanno scritte lì.
- Regione EU delle funzioni Vercel: da impostare da dashboard al primo deploy.
