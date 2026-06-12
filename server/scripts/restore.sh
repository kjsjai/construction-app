#!/bin/sh

# Fail on any error
set -e

# Configuration
DB_PATH=${DB_PATH:-"/data/database.sqlite"}
BACKUP_ARCHIVE=$1

if [ -z "$BACKUP_ARCHIVE" ]; then
    echo "Usage: $0 <path-to-backup-archive.sqlite.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_ARCHIVE" ]; then
    echo "Error: Backup archive not found at $BACKUP_ARCHIVE"
    exit 1
fi

echo "=================================================="
echo "WARNING: Restoring will overwrite the current DB!"
echo "Ensure the application server is STOPPED."
echo "=================================================="
printf "Are you sure you want to proceed? (y/N) "
read -r REPLY

case "$REPLY" in
  [yY][eE][sS]|[yY]) 
    # Proceed
    ;;
  *)
    echo "Restore cancelled."
    exit 0
    ;;
esac

# 1. Create a safety backup of the current state before overwriting
echo "Creating safety backup of current database..."
SAFETY_BACKUP="${DB_PATH}.safety-$(date +"%Y%m%d-%H%M%S").bak"
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$SAFETY_BACKUP"
    echo "Safety backup created at $SAFETY_BACKUP"
fi

# 2. Decompress and restore
echo "Restoring database from archive..."
gzip -dc "$BACKUP_ARCHIVE" > "$DB_PATH"

# 3. Verify integrity
echo "Running integrity check on restored database..."
INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")

if [ "$INTEGRITY" != "ok" ]; then
    echo "FATAL: Integrity check failed after restore! ($INTEGRITY)"
    echo "Attempting to rollback to safety backup..."
    if [ -f "$SAFETY_BACKUP" ]; then
        cp "$SAFETY_BACKUP" "$DB_PATH"
        echo "Rollback complete. The restore operation failed."
    else
        echo "Error: No safety backup found to rollback to!"
    fi
    exit 1
fi

echo "Restore completed successfully."
