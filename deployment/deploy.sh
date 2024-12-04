#!/bin/bash

# Exit on error
set -e

echo "Starting Modular Dashboard deployment..."

# Install system dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y nodejs npm nginx postgresql

# Create application user
echo "Creating application user..."
useradd -r -s /bin/false modular-dash || true

# Create application directory
echo "Setting up application directory..."
mkdir -p /opt/modular-dash
chown modular-dash:modular-dash /opt/modular-dash

# Copy application files
echo "Copying application files..."
cp -r ../* /opt/modular-dash/
cd /opt/modular-dash

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Build the application
echo "Building the application..."
npm run build

# Setup environment file
echo "Setting up environment file..."
cat > /opt/modular-dash/.env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/modular_dash
EOL

# Set proper permissions
echo "Setting file permissions..."
chown -R modular-dash:modular-dash /opt/modular-dash
chmod 640 /opt/modular-dash/.env

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

echo "Deployment completed successfully!"
echo "Please update the .env file with your database credentials and nginx configuration with your domain name."
