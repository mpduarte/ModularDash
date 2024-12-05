#!/bin/bash

# Exit on error
set -e

# Default values
DEPLOY_METHOD="traditional"
DEBIAN_VERSION="bookworm"
LOG_DIR="/var/log/modular-dash"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --docker)
      DEPLOY_METHOD="docker"
      shift
      ;;
    --debian-version)
      DEBIAN_VERSION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./deploy.sh [--docker] [--debian-version VERSION]"
      exit 1
      ;;
  esac
done

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check system requirements
check_requirements() {
  log "Checking system requirements..."
  
  if [ "$DEPLOY_METHOD" = "docker" ]; then
    if ! command -v docker &> /dev/null; then
      log "Docker not found. Installing Docker..."
      curl -fsSL https://get.docker.com -o get-docker.sh
      sudo sh get-docker.sh
      sudo usermod -aG docker $USER
    fi
    
    if ! command -v docker-compose &> /dev/null; then
      log "Docker Compose not found. Installing Docker Compose..."
      sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose
    fi
  else
    # Run Debian setup script for traditional deployment
    log "Running Debian setup script..."
    chmod +x deployment/debian-setup.sh
    ./deployment/debian-setup.sh || {
      log "Error: Failed to run Debian setup script"
      exit 1
    }
  fi
}

# Function to create backup
create_backup() {
  log "Creating backup..."
  mkdir -p "$BACKUP_DIR"
  
  if [ "$DEPLOY_METHOD" = "docker" ]; then
    if docker-compose -f deployment/docker-compose.yml ps | grep -q "Up"; then
      docker-compose -f deployment/docker-compose.yml exec -T db pg_dumpall -c -U "$PGUSER" > "$BACKUP_DIR/database_backup.sql"
    fi
  else
    if systemctl is-active --quiet postgresql; then
      pg_dumpall -U "$PGUSER" > "$BACKUP_DIR/database_backup.sql"
    fi
  fi
  
  # Backup configuration files
  if [ -d "/opt/modular-dash" ]; then
    cp -r /opt/modular-dash/config "$BACKUP_DIR/" 2>/dev/null || true
  fi
}

# Function to deploy application
deploy_application() {
  if [ "$DEPLOY_METHOD" = "docker" ]; then
    log "Performing Docker-based deployment..."
    
    # Stop existing containers
    docker-compose -f deployment/docker-compose.yml down || true
    
    # Clean up unused resources
    docker image prune -f
    
    # Build and start containers
    if ! docker-compose -f deployment/docker-compose.yml up --build -d; then
      log "Error: Failed to start containers"
      restore_backup
      exit 1
    fi
    
    # Wait for services to be healthy
    timeout 90 bash -c '
      until docker-compose -f deployment/docker-compose.yml ps | grep -q "healthy"; do 
        echo "Waiting for services..."
        sleep 1
      done
    ' || {
      log "Error: Services failed to become healthy"
      restore_backup
      exit 1
    }
  else
    log "Performing traditional deployment..."
    
    # Run Debian-specific deployment script
    chmod +x deployment/debian-deployment.sh
    if ! ./deployment/debian-deployment.sh; then
      log "Error: Traditional deployment failed"
      restore_backup
      exit 1
    fi
  fi
}

# Function to restore backup
restore_backup() {
  if [ -d "$BACKUP_DIR" ]; then
    log "Restoring from backup..."
    
    if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
      if [ "$DEPLOY_METHOD" = "docker" ]; then
        docker-compose -f deployment/docker-compose.yml up -d db
        sleep 5
        docker-compose -f deployment/docker-compose.yml exec -T db psql -U "$PGUSER" < "$BACKUP_DIR/database_backup.sql"
      else
        psql -U "$PGUSER" < "$BACKUP_DIR/database_backup.sql"
      fi
    fi
    
    if [ -d "$BACKUP_DIR/config" ]; then
      cp -r "$BACKUP_DIR/config" /opt/modular-dash/
    fi
  fi
}

# Function to verify deployment
verify_deployment() {
  log "Verifying deployment..."
  
  local max_retries=5
  local retry_count=0
  local endpoint="http://localhost:5000/api/health"
  
  while [ $retry_count -lt $max_retries ]; do
    if curl -s "$endpoint" | grep -q "ok"; then
      log "Deployment verified successfully!"
      return 0
    fi
    
    retry_count=$((retry_count + 1))
    sleep 5
  done
  
  log "Error: Deployment verification failed"
  return 1
}

# Main deployment process
main() {
  log "Starting deployment process..."
  
  check_requirements
  create_backup
  
  if ! deploy_application; then
    log "Deployment failed, rolling back..."
    restore_backup
    exit 1
  fi
  
  if ! verify_deployment; then
    log "Verification failed, rolling back..."
    restore_backup
    exit 1
  fi
  
  log "Deployment completed successfully!"
  
  # Print final instructions
  cat << EOF

Deployment completed! Next steps:
1. If using traditional deployment:
   - Update /opt/modular-dash/.env with your database credentials
   - Update /etc/nginx/sites-available/modular-dash with your domain
   - Run: systemctl restart modular-dash

2. If using Docker deployment:
   - Monitor logs with: docker-compose -f deployment/docker-compose.yml logs -f
   - Access metrics at: http://localhost:9090 (Prometheus)
   - Access application at: http://localhost:5000

For more information, see deployment/README.md
EOF
}

# Run main function
main
