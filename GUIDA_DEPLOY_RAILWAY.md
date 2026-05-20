# 🚀 Guida Deploy RistoBrain su Railway

## PASSO 1 — Aggiorna GitHub

Fai doppio clic su **`PUSH_TO_GITHUB.command`** nella cartella ristobrain-app.

---

## PASSO 2 — Crea progetto su Railway

1. Vai su [https://railway.com/new/github](https://railway.com/new/github)
2. Clicca su **`4fpvdq6fwz-jpg/ristobrain-app`**
3. Clicca **"Deploy Now"**

Railway creerà automaticamente il servizio con il codice del repository.

---

## PASSO 3 — Aggiungi PostgreSQL

1. Nel progetto Railway, clicca **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway aggiungerà il database e configurerà automaticamente `DATABASE_URL`

---

## PASSO 4 — Configura il servizio Backend

Railway ha deployato l'intera app come un servizio. Devi creare due servizi separati:

### Opzione A — Deploy dalla cartella `/backend`
1. Clicca sul servizio creato → **Settings** → **Root Directory** → scrivi `backend`
2. Vai su **Variables** e aggiungi:
   ```
   JWT_SECRET=ristobrain_jwt_2026_super_segreto_cambia_questo
   NODE_ENV=production
   PORT=4000
   ```
3. Clicca **"Deploy"** per riavviare con le nuove variabili

### Configura il dominio Backend
1. Clicca **Settings** → **Networking** → **Generate Domain**
2. Copia l'URL generato (es: `https://backend-production-xxxx.up.railway.app`)

---

## PASSO 5 — Crea servizio Frontend

1. Nel progetto Railway, clicca **"+ New"** → **"GitHub Repo"** → stesso repo
2. Vai su **Settings** → **Root Directory** → scrivi `frontend`
3. Vai su **Variables** e aggiungi:
   ```
   BACKEND_URL=https://backend-production-xxxx.up.railway.app
   NODE_ENV=production
   PORT=3000
   ```
   *(sostituisci con l'URL del backend copiato al passo 4)*
4. Clicca **"Deploy"**

### Configura il dominio Frontend
1. Clicca **Settings** → **Networking** → **Generate Domain**
2. Questo è l'**URL finale dell'app**! 🎉

---

## PASSO 6 — Verifica

1. Apri l'URL del frontend nel browser
2. Login con:
   - Email: `chef@demo.it`
   - Password: `demo1234`

---

## 💡 Note importanti

- **Database**: Le tabelle vengono create automaticamente al primo avvio
- **AI Assistant**: Per attivare l'AI, aggiungi `ANTHROPIC_API_KEY=sk-ant-xxxx` alle variabili del backend
- **Costo Railway**: Il piano Hobby costa $5/mese + utilizzo. Con uso moderato ~$10-15/mese totali
- **Log**: Per vedere i log, clicca sul servizio → **Deployments** → **View Logs**

---

## 🆘 Problemi comuni

**Il backend non parte**: Controlla i log. Verifica che `DATABASE_URL` sia configurato (viene da PostgreSQL automaticamente).

**Il frontend dà errori API**: Verifica che `BACKEND_URL` nel frontend punti esattamente all'URL del backend (con https://, senza slash finale).

**Login non funziona**: Il seed del database viene caricato al primo avvio. Aspetta 1-2 minuti dopo il primo deploy.
