#!/bin/bash

# Exit on error
set -e

# Source environment variables
if [ -f .env ]; then
    source .env
fi

echo "Starting Debian-specific deployment..."

# Run debian setup script
chmod +x deployment/debian-setup.sh
./deployment/debian-setup.sh || {
    echo "Error: Failed to run debian setup script"
    exit 1
}

# Create necessary directories
mkdir -p /opt/modular-dash/logs
mkdir -p /opt/modular-dash/data

# Setup application
echo "Setting up application..."

# Copy application files
cp -r . /opt/modular-dash/
cd /opt/modular-dash

# Install production dependencies
npm ci --production

# Build the application
npm run build

# Setup systemd service
echo "Setting up systemd service..."
cp deployment/modular-dash.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable modular-dash
systemctl start modular-dash

# Setup nginx
echo "Setting up nginx..."
cp deployment/nginx.conf /etc/nginx/sites-available/modular-dash
ln -sf /etc/nginx/sites-available/modular-dash /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Set proper permissions
chown -R modular-dash:modular-dash /opt/modular-dash
chmod -R 750 /opt/modular-dash

echo "Debian deployment completed successfully!"
