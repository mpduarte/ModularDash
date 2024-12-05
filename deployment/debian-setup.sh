#!/bin/bash

# Exit on error
set -e

# Function to display usage
usage() {
    echo "Usage: $0 [--docker]"
    echo
    echo "Options:"
    echo "  --docker    Configure for Docker deployment"
    exit 1
}

# Default values
DOCKER_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            DOCKER_MODE=true
            shift
            ;;
        *)
            usage
            ;;
    esac
done

echo "Starting Debian system setup..."

# System update and basic tools
apt-get update
apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    python3 \
    make \
    g++ \
    postgresql-client

# Add Node.js repository and install
if [ ! -f "/etc/apt/sources.list.d/nodesource.list" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
fi
apt-get install -y nodejs

# Install latest npm
npm install -g npm@latest

if [ "$DOCKER_MODE" = false ]; then
    # Install additional dependencies for traditional deployment
    apt-get install -y \
        nginx \
        postgresql \
        certbot \
        python3-certbot-nginx
        
    # Set up system user and directories
    groupadd -r modular-dash || true
    useradd -r -g modular-dash -s /bin/false modular-dash || true
    
    # Create necessary directories
    mkdir -p /opt/modular-dash /var/log/modular-dash /var/lib/modular-dash
    chown -R modular-dash:modular-dash /opt/modular-dash /var/log/modular-dash /var/lib/modular-dash
    
    # Set up log rotation
    cat > /etc/logrotate.d/modular-dash << EOF
/var/log/modular-dash/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 modular-dash modular-dash
}
EOF
fi

# Clean up
apt-get clean
rm -rf /var/lib/apt/lists/*

echo "Debian system setup completed successfully"
