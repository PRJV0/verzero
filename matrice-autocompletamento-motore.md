# Matrice di autocompletamento del Motore Ver0
Quanto di ogni documento il Motore riesce a comporre PRIMA che il cliente carichi qualcosa.
Stime di progettazione (da verificare sui documenti reali della fase 2), basate sulla struttura dei documenti definita in SPEC e sulle fonti mappate nel report banche dati.

## Come si legge
- **Solo fonti gratuite** = VIES, verifica P.IVA, ISPRA/DEFRA/AIB/IPCC (fattori), EFRAG VSME (template e tassonomia), ACCREDIA (certificazioni possedute), RNA/incentivi.gov.it (bandi), ISTAT/gradi giorno, SIAPE (benchmark).
- **+ pay-per-use** = aggiunge visura camerale, bilanci depositati, soci e cariche, unità locali, PEC, ATECO ufficiale, addetti, dati catastali (OpenAPI/Telemaco, ~5-10 € a pratica).
- **Resto** = ciò che può arrivare SOLO dal cliente (dati di attività: consumi, litri, ore, organico per genere, processi) o dalla validazione professionale.

Nota di metodo: la percentuale è calcolata sulle SEZIONI del documento, pesate come nell'anello (popolata 1, impostata 0,5, in attesa 0). Non è "il documento è pronto al X%", è "il Motore ha già fatto il X% del lavoro documentale".

---

## Matrice per servizio

| Servizio | Solo gratuite | + pay-per-use | Cosa resta al cliente |
|---|---|---|---|
| **Carbon Footprint di Organizzazione — Scope 1 e 2** | ~35-40% | **~55-60%** | Bollette elettriche e gas, registri carburanti, dati flotta |
| **Carbon Footprint — Scope 1, 2 e 3** | ~25-30% | ~40-45% | Come sopra + dati di filiera, acquisti, logistica |
| **Bilancio di Sostenibilità (VSME) Base** | ~40-45% | **~60-65%** | Consumi, organico e turnover, infortuni, policy esistenti |
| **Bilancio di Sostenibilità (VSME) Avanzato** | ~30-35% | ~45-50% | Come sopra + politiche, obiettivi, azioni, catena del valore |
| **Manuale ISO 9001** | ~50-55% | **~70-75%** | Organigramma, mappa dei processi, procedure esistenti |
| **Manuale ISO 14001** | ~45-50% | ~65-70% | Aspetti ambientali del sito, autorizzazioni, rifiuti |
| **Manuale ISO 45001** | ~45-50% | ~65-70% | DVR (fuori perimetro), organigramma sicurezza, formazione |
| **UNI/PdR 125 (parità di genere)** | ~30-35% | ~45-50% | Organico per genere e inquadramento, retribuzioni, policy HR |
| **SA8000** | ~30-35% | ~45-50% | Dati occupazionali, contratti, filiera, procedure sociali |
| **Rating UNI/TS 11820 (circolarità)** | ~25-30% | ~40-45% | Dati di materia, rifiuti, acqua, energia, modelli di business |
| **Check-up energetico** | ~35-40% | ~50-55% | Bollette 12 mesi, elenco impianti, orari di funzionamento |
| **Miglioramento score rating ESG** | ~45-50% | ~65-70% | Nulla di nuovo: si compone dai dati degli altri percorsi |
| **Kit Comunicazione** | — | **~90%** | Nulla: si genera dai dati già verificati in piattaforma |
| **Supporto all'audit** | — | ~20% | I rilievi ricevuti dall'organismo (il cliente li carica) |

---

## Le tre leve che spostano davvero i numeri

**1. La visura camerale (pay-per-use, ~5-10 €).** È il singolo dato che vale di più: porta ragione sociale ufficiale, forma giuridica, ATECO, sede e unità locali, cariche, addetti, capitale, bilanci. Da sola aggiunge mediamente **15-20 punti** di completamento su ogni servizio, perché popola l'intera anagrafica e i confini organizzativi di qualunque documento. Vale il costo in ogni singola pratica.

**2. I fattori di emissione (gratuiti).** ISPRA, DEFRA e AIB rendono la sezione "metodologia e fattori" di carbon e VSME **completa al 100% senza il cliente**: sono sezioni tecniche che nella consulenza tradizionale costano ore e qui costano zero.

**3. ACCREDIA (gratuito).** Sapere quali certificazioni l'impresa ha già cambia due cose: precompila i prerequisiti dei manuali e alimenta i suggerimenti commerciali con effort residuo ("hai già la 9001: la 14001 ti costa metà lavoro").

---

## Cosa il Motore NON potrà mai precompilare
I **dati di attività** — consumi, litri, ore, organico per genere, quantità di rifiuti, processi aziendali. Non esistono in nessuna banca dati pubblica o commerciale: appartengono all'impresa. È qui che vive il "zero effort onesto": non promettiamo che non serva nulla, promettiamo che chiediamo solo questo.

Conseguenza di prodotto: la percentuale di partenza del percorso è il nostro argomento di vendita, la lista di ciò che manca è il nostro contratto morale col cliente. Entrambe vanno mostrate in chiaro.

---

## Come usarla
- **In vendita:** "il tuo documento parte già al 60%" è il claim più forte del catalogo — ma va verificato sui documenti reali prima di scriverlo sul sito.
- **In prodotto:** ogni percorso deve dichiarare la propria percentuale di partenza attesa; se un percorso non supera il 30%, va rivista la struttura del documento o la sequenza di raccolta.
- **In economia:** il costo dati per pratica (~5-10 €) è irrilevante rispetto al canone; la visura si compra sempre, dopo l'incasso.
