# DECISIONI.md — Motore Creatività Menu

Log delle scelte di adattamento del brief "RistoBrain Autonomo (v2)" allo stack già esistente e online.
Principio guida del brief: dove un dettaglio è ambiguo, scegliere l'opzione più semplice e a minor manutenzione.

## Decisione architetturale principale

Il brief descriveva una **ricostruzione da zero** su Supabase + Vercel. Esisteva però già
un'app RistoBrain **live e funzionante** su un altro stack, con auth, food cost, analisi ABC,
simulatore prezzi, dashboard KPI, billing Stripe, fatture e multilingua già implementati
(cioè gran parte delle Fasi 0 e 2 del brief).

**Scelta (confermata dal Chef): integrare il Motore Creatività nell'app esistente, senza
sconvolgere nulla.** Niente Supabase/Vercel: si riusa lo stack già in produzione. Il valore del
brief è la *logica* del Motore Creatività, non il fornitore di database o di hosting.

## Mappatura stack: brief → esistente

| Brief | Implementato come |
|---|---|
| Supabase (Postgres + Auth + RLS) | Postgres gestito + auth JWT/bcrypt già esistenti |
| Isolamento via `auth.uid()` + RLS | Isolamento a livello applicativo per `workspace_id` (filtro in ogni query) |
| Vercel | Railway (deploy automatico da GitHub `main`) |
| `claude-sonnet-4-6` server-side | Identico: chiamata server-side a `claude-sonnet-4-6` |
| Tabella `restaurants` | Tabella `locations` esistente, estesa con colonne `formato`, `regione`, `ticket_target`, `vincoli` (additivo, non disruptivo) |
| Endpoint `/api/genera-menu` | `POST /api/creativita/generate` (router `menuEngine`) |

## Modello dati (additivo, nessuna tabella esistente modificata in modo distruttivo)

- `house_rules` (regole della casa) — per `workspace_id`.
- `reference_menus` (menu di riferimento few-shot) — per `workspace_id`.
- `menu_generations` (log generazioni) — per `workspace_id`, con `brief_input`/`output` JSONB e `model`.
- `locations` esteso: `formato`, `regione`, `ticket_target`, `vincoli` (tutte nullable).

Migrazioni idempotenti (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

## Motore (POST /api/creativita/generate)

1. Carica regole attive (ordinate per priorità) + menu di riferimento attivi + contesto ristorante.
2. Costruisce il system prompt con la gerarchia rigida: regole della casa > menu di riferimento > web.
3. Chiama `claude-sonnet-4-6` chiedendo SOLO JSON. `max_tokens` = 3500.
4. Se `usa_web=true`: aggiunge il tool `web_search` (server tool Anthropic, `max_uses: 3`) come fonte marginale.
5. Parsing JSON robusto: rimozione fence ```json e fallback su primo `{` … ultimo `}`. Su JSON non valido → errore leggibile, NON salva.
6. **Cintura di sicurezza pricing**: ogni `prezzo_suggerito` viene arrotondato al più vicino finale 7 (es. 12.70) lato server, oltre alla regola nel prompt.
7. Logga la generazione in `menu_generations` (non bloccante).

Gestione errori §7.6 implementata: nessuna regola → default conservativi + flag `usando_default` (avviso in UI);
API non configurata → 503 leggibile; chiamata fallita/timeout → 502 leggibile; nessun crash.

## Frontend

- Pagina `/regole`: CRUD `house_rules` + `reference_menus` (bilingue IT/EN). **Struttura vuota**: nessun dato precaricato, il Chef inserisce regole e menu di riferimento reali.
- Pagina `/creativita`: form (ristorante, tipo menu, stagione, n° piatti per categoria, ticket, ingredienti, toggle web) → genera → `DishCard` con semaforo food cost (verde <28 / giallo 28–35 / rosso >35), badge ABC, badge fonte (logica casa / web), export `.txt`.
- Voci `Creatività` e `Regole` aggiunte in cima alla Sidebar (dopo Dashboard).

## Scelte minori (default semplici)

- **Dati di seed §6**: NON precaricati (scelta del Chef: struttura vuota). Restano disponibili come riferimento nel brief.
- **Menu di riferimento verbatim §13.1**: li fornirà il Chef dalla pagina `/regole`; non inventati.
- **Categorie menu §13.4** (da confermare): default = `antipasti, primi, secondi, contorni, dolci`.
- **Stripe / Fase 3**: non toccata. Il billing esistente resta invariato; i tier Core/Pro/Premium del brief sono per una fase successiva.
- **Dominio / migrazione utenti §13.2–3**: nessun cambiamento; si resta sull'app e sugli utenti esistenti.
