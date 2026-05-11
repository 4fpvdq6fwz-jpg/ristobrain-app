#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup.sh — Backup PostgreSQL di RistoBrain
#
# Uso:
#   ./scripts/backup.sh                  # backup locale
#   ./scripts/backup.sh --upload         # backup + upload su S3
#
# Variabili d'ambiente (dal file .env):
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   BACKUP_DIR        (default: ./backups)
#   BACKUP_RETENTION  (giorni da tenere, default: 30)
#   S3_BUCKET         (es: s3://my-bucket/ristobrain-backups)
#   AWS_PROFILE       (opzionale, default: default)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configurazione ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Carica .env se presente
if [[ -f "$PROJECT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

POSTGRES_USER="${POSTGRES_USER:-ristobrain}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
POSTGRES_DB="${POSTGRES_DB:-ristobrain}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
BACKUP_RETENTION="${BACKUP_RETENTION:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ristobrain_${TIMESTAMP}.sql.gz"
UPLOAD="${1:-}"

# ── Colori per i log ───────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()    { echo -e "${GREEN}[$(date +'%H:%M:%S')] $*${NC}"; }
warn()   { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARN: $*${NC}"; }
error()  { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $*${NC}" >&2; exit 1; }

# ── Prerequisiti ──────────────────────────────────────────────────────────
command -v docker &>/dev/null || error "docker non trovato"
mkdir -p "$BACKUP_DIR"

# ── Backup ────────────────────────────────────────────────────────────────
log "Avvio backup di '$POSTGRES_DB'..."

PGPASSWORD="$POSTGRES_PASSWORD" docker exec ristobrain_db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Backup completato: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Upload opzionale su S3 ─────────────────────────────────────────────────
if [[ "$UPLOAD" == "--upload" ]]; then
  if [[ -z "${S3_BUCKET:-}" ]]; then
    warn "S3_BUCKET non definita — skip upload"
  else
    command -v aws &>/dev/null || error "aws CLI non trovato (richiesto per --upload)"
    log "Upload su $S3_BUCKET..."
    aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/$(basename "$BACKUP_FILE")" \
      ${AWS_PROFILE:+--profile "$AWS_PROFILE"}
    log "Upload completato!"
  fi
fi

# ── Pulizia backup vecchi ─────────────────────────────────────────────────
log "Pulizia backup più vecchi di $BACKUP_RETENTION giorni..."
find "$BACKUP_DIR" -name "ristobrain_*.sql.gz" -mtime +"$BACKUP_RETENTION" -delete
REMAINING=$(find "$BACKUP_DIR" -name "ristobrain_*.sql.gz" | wc -l | tr -d ' ')
log "$REMAINING backup conservati in $BACKUP_DIR"

log "✅ Backup terminato con successo."
