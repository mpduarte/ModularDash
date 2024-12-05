#!/bin/bash

# Exit on error
set -e

# Default values
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to display usage
usage() {
    echo "Usage: $0 [backup|restore] [options]"
    echo
    echo "Commands:"
    echo "  backup              Create a database backup"
    echo "  restore FILE        Restore database from a backup file"
    echo
    echo "Options:"
    echo "  --dir=DIRECTORY    Backup directory (default: ./backups)"
    exit 1
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

case "$1" in
    backup)
        echo "Creating database backup..."
        BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
        if [ -f /.dockerenv ]; then
            # Running inside Docker
            pg_dump -U "$PGUSER" -h "$PGHOST" "$PGDATABASE" > "$BACKUP_FILE"
        else
            # Running with docker-compose
            docker-compose -f deployment/docker-compose.yml exec -T db pg_dump -U "$PGUSER" "$PGDATABASE" > "$BACKUP_FILE"
        fi
        echo "Backup created: $BACKUP_FILE"
        ;;
        
    restore)
        if [ -z "$2" ]; then
            echo "Error: Backup file not specified"
            usage
        fi
        
        if [ ! -f "$2" ]; then
            echo "Error: Backup file '$2' not found"
            exit 1
        }
        
        echo "Restoring database from $2..."
        if [ -f /.dockerenv ]; then
            # Running inside Docker
            psql -U "$PGUSER" -h "$PGHOST" "$PGDATABASE" < "$2"
        else
            # Running with docker-compose
            docker-compose -f deployment/docker-compose.yml exec -T db psql -U "$PGUSER" "$PGDATABASE" < "$2"
        fi
        echo "Database restored successfully"
        ;;
        
    *)
        usage
        ;;
esac
