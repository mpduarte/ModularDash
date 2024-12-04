#!/bin/bash

# Exit on error
set -e

# Default deployment method
DEPLOY_METHOD="traditional"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --docker)
      DEPLOY_METHOD="docker"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./deploy.sh [--docker]"
      exit 1
      ;;
  esac
done

echo "Starting Modular Dashboard deployment using $DEPLOY_METHOD method..."

if [ "$DEPLOY_METHOD" = "docker" ]; then
    # Docker-based deployment
    echo "Performing Docker-based deployment..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    # Build and start containers
    echo "Building and starting Docker containers..."
    docker-compose -f deployment/docker-compose.yml up --build -d

    echo "Docker deployment completed successfully!"
    echo "The application should now be running at http://localhost:5000"

else
    # Traditional deployment
    echo "Performing traditional deployment..."

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
    cp -r . /opt/modular-dash/
    cd /opt/modular-dash

    # Install dependencies
    echo "Installing Node.js dependencies..."
    npm ci --production

    # Build the application
    echo "Building the application..."
    npm run build

    # Setup environment file
    echo "Setting up environment file..."
    if [ ! -f .env ]; then
        cat > .env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/modular_dash
EOL
    fi

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

    echo "Traditional deployment completed successfully!"
    echo "Please update the .env file with your database credentials and nginx configuration with your domain name."
fi

# Final instructions
echo "
Deployment completed! Next steps:
1. If using traditional deployment:
   - Update /opt/modular-dash/.env with your database credentials
   - Update /etc/nginx/sites-available/modular-dash with your domain
   - Run: systemctl restart modular-dash

2. If using Docker deployment:
   - Update the environment variables in docker-compose.yml
   - Run: docker-compose -f deployment/docker-compose.yml restart

For more information, see deployment/README.md"
