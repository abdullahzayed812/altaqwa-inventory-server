#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

DB_USER="${DB_USER:-abdo}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_NAME="${DB_NAME:-agriculture_inventory}"
GDRIVE_REMOTE="gdrive"
GDRIVE_DIR="agriculture-backups"
KEEP_DAYS=14
TEMP_DIR="/tmp/agriculture_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

mkdir -p "$TEMP_DIR"

echo "[$(date)] Starting backup..."

# Dump database from running container
docker exec agriculture-db \
  mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  --single-transaction --routines --triggers \
  | gzip > "$TEMP_DIR/$BACKUP_FILE"

echo "[$(date)] Dump complete: $BACKUP_FILE ($(du -sh "$TEMP_DIR/$BACKUP_FILE" | cut -f1))"

# Upload to Google Drive
rclone copy "$TEMP_DIR/$BACKUP_FILE" "$GDRIVE_REMOTE:$GDRIVE_DIR/" --progress

echo "[$(date)] Upload complete."

# Remove local temp file
rm -f "$TEMP_DIR/$BACKUP_FILE"

# Delete remote backups older than KEEP_DAYS
rclone delete "$GDRIVE_REMOTE:$GDRIVE_DIR/" --min-age "${KEEP_DAYS}d"

echo "[$(date)] Old backups cleaned up (kept last ${KEEP_DAYS} days)."
echo "[$(date)] Backup done."
