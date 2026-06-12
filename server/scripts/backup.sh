#!/bin/sh

# Fail on any error
set -e

# Configuration variables
DB_PATH=${DB_PATH:-"/data/database.sqlite"}
BACKUP_DIR=${BACKUP_DIR:-"/data/backups"}
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Generate timestamp: YYYYMMDD-HHMMSS
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/database-${TIMESTAMP}.sqlite"

echo "Starting database backup process..."

# 1. Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# 2. Verify source database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

# 3. Create online backup using SQLite's built-in safe backup command
# This creates a consistent snapshot without blocking concurrent readers/writers
echo "Creating safe online backup..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# 4. Compress the backup to save disk space
echo "Compressing backup..."
gzip -f "$BACKUP_FILE"

echo "Backup created successfully: ${BACKUP_FILE}.gz"

# 5. Apply retention policy: delete backups older than configured days
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "database-*.sqlite.gz" -type f -mtime +${RETENTION_DAYS} -exec rm -f {} \;

echo "Backup process complete."
