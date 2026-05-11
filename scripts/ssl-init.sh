#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ssl-init.sh — Primo setup SSL con Let's Encrypt
#
# Da eseguire UNA VOLTA sul server di produzione prima di avviare Nginx con SSL.
# Uso: ./scripts/ssl-init.sh tuodominio.com email@tuodominio.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

[[ -z "$DOMAIN" ]] && { echo "Uso: $0 <dominio> <email>"; exit 1; }
[[ -z "$EMAIL"  ]] && { echo "Uso: $0 <dominio> <email>"; exit 1; }

echo "🔐 Richiesta certificato SSL per $DOMAIN..."

# Avvia Nginx solo su HTTP (senza SSL) per il challenge
docker compose -f docker-compose.prod.yml up -d nginx

# Richiedi il certificato via webroot
docker compose -f docker-compose.prod.yml run --rm certbot \
  certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

echo ""
echo "✅ Certificato SSL ottenuto!"
echo "   Ora sostituisci 'TUODOMINIO.COM' in nginx/conf.d/ristobrain.conf"
echo "   con: $DOMAIN"
echo ""
echo "   Poi riavvia tutto:"
echo "   docker compose -f docker-compose.prod.yml --env-file .env up -d"
