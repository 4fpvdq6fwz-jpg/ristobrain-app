# 🍽️ RistoBrain + MenuMaster

**Food Cost & Menu Engineering per ristoratori professionisti**

Un'app full-stack completa per calcolare il food cost, gestire ricette e menu, analizzare le vendite e ottimizzare i prezzi — tutto in tempo reale.

---

## 🚀 Avvio rapido (Docker Compose)

### Prerequisiti
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installato
- Git

### 1. Clona il progetto
```bash
git clone <tuo-repo>
cd ristobrain-app
```

### 2. Configura le variabili d'ambiente
```bash
cp .env.example .env
# Apri .env e personalizza se necessario (già pronto per il dev)
```

### 3. Avvia tutto con un comando
```bash
docker compose up -d
```

Attendi ~30 secondi per l'avvio iniziale. Il database viene creato e popolato con dati demo automaticamente.

### 4. Apri l'app
- **Frontend (web):** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health check:** http://localhost:4000/health

### 5. Login demo
```
Email:    chef@demo.it
Password: demo1234
```

---

## 🏗️ Stack tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Express + TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (bcryptjs) |
| Charts | Recharts |
| Deploy | Docker Compose |

---

## 📁 Struttura del progetto

```
ristobrain-app/
├── docker-compose.yml          # Orchestrazione servizi
├── .env.example                # Template variabili
│
├── backend/
│   ├── src/
│   │   ├── index.ts            # Entry point Express
│   │   ├── config.ts           # Configurazione env
│   │   ├── db.ts               # Pool PostgreSQL
│   │   ├── types.ts            # Tipi TypeScript
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT middleware
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts         # Login, register, me
│   │   │   ├── ingredients.ts  # CRUD ingredienti + prezzi
│   │   │   ├── recipes.ts      # CRUD ricette + BOM
│   │   │   ├── menus.ts        # CRUD menu + item
│   │   │   ├── sales.ts        # Periodi vendite
│   │   │   ├── calculations.ts # Food cost, engineering, pricing
│   │   │   ├── locations.ts    # Locali
│   │   │   └── suppliers.ts    # Fornitori
│   │   └── db/
│   │       ├── schema.sql      # Schema PostgreSQL completo
│   │       └── seed.sql        # Dati demo
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx         # Redirect login/dashboard
    │   │   ├── login/           # Login & register
    │   │   ├── dashboard/       # KPI overview
    │   │   ├── ingredients/     # Gestione ingredienti
    │   │   ├── recipes/         # Ricette + BOM + food cost live
    │   │   ├── menus/           # Menu con FC% per piatto
    │   │   ├── sales/           # Analisi vendite
    │   │   ├── engineering/     # Menu Engineering Matrix
    │   │   ├── pricing/         # Suggerimenti prezzi
    │   │   ├── locations/       # Locali
    │   │   └── suppliers/       # Fornitori
    │   ├── components/
    │   │   ├── AppLayout.tsx    # Layout con sidebar + auth guard
    │   │   ├── Sidebar.tsx      # Navigazione
    │   │   ├── KpiCard.tsx      # Card metriche
    │   │   └── FcBadge.tsx      # Badge Food Cost %
    │   └── lib/
    │       ├── api.ts           # Axios client + tutti gli endpoint
    │       └── auth.ts          # JWT storage utils
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── Dockerfile
```

---

## 🔌 API Reference

Base URL: `http://localhost:4000/api`

### Auth
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/auth/login` | Login → JWT token |
| POST | `/auth/register` | Registra nuovo utente + workspace |
| GET | `/auth/me` | Profilo utente corrente |
| PUT | `/auth/password` | Cambia password |

### Ingredienti
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/ingredients` | Lista con prezzo corrente |
| POST | `/ingredients` | Crea ingrediente |
| PUT | `/ingredients/:id` | Modifica |
| DELETE | `/ingredients/:id` | Soft delete |
| POST | `/ingredients/:id/prices` | Aggiungi prezzo storico |
| GET | `/ingredients/categories/list` | Lista categorie |

### Ricette
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/recipes` | Lista con costo/porzione |
| GET | `/recipes/:id` | Dettaglio con BOM e costi |
| POST | `/recipes` | Crea ricetta (+ingredienti) |
| PUT | `/recipes/:id` | Modifica (+ingredienti) |
| POST | `/recipes/:id/clone` | Duplica ricetta |
| DELETE | `/recipes/:id` | Soft delete |

### Calcoli
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/calc/recipe/:id` | Food cost dettagliato |
| GET | `/calc/menu/:menuId` | FC% tutti i piatti |
| GET | `/calc/engineering?periodId=` | Menu Engineering Matrix |
| GET | `/calc/pricing-suggestions?menuId=&targetFcPct=` | Prezzi ottimali |

---

## 🧮 Formule

```
Food Cost % = (Costo Porzione / Prezzo Vendita) × 100

Costo Ingrediente = (Quantità / Fattore Conversione) × Prezzo/UM × (1 + Sfrido%)

Costo Porzione = Σ(Costi Ingredienti) / Numero Porzioni

Prezzo Suggerito = Costo Porzione / (Target FC% / 100)

Margine Contribuzione = Prezzo - Costo Porzione
```

### Menu Engineering Matrix
| | Alto Margine CM | Basso Margine CM |
|--|--|--|
| **Alta Popolarità** | ⭐ Star → Promuovi | 🐎 Plowhorse → Riduci costi |
| **Bassa Popolarità** | 🧩 Puzzle → Visibilità | 🐕 Dog → Rimuovi |

---

## 🛠️ Sviluppo locale (senza Docker)

### Backend
```bash
cd backend
npm install
# Assicurati che PostgreSQL e Redis siano attivi
cp ../.env.example .env
npm run dev     # ts-node-dev, hot reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Next.js dev server
```

---

## 🚀 Prossimi step per la produzione

1. **Dominio + SSL** — Nginx reverse proxy con certbot
2. **CI/CD** — GitHub Actions → build Docker → deploy
3. **Backup DB** — pg_dump schedulato
4. **Monitoring** — Sentry per errori, Prometheus + Grafana per metriche
5. **AI Features** — OpenAI API per suggerimenti menu intelligenti
6. **Mobile App** — React Native che usa le stesse API

---

## 📝 Licenza
MIT — Creato con ❤️ per i professionisti della ristorazione italiana.
