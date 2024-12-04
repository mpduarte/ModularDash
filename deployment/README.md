# Deployment Guide for Debian Systems

This guide explains how to deploy the Modular Dashboard application on a Debian-based system.

## Prerequisites

- Debian-based OS (Debian, Ubuntu)
- Root access or sudo privileges
- Domain name (if deploying to production)

## Quick Deploy

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Run the deployment script:
   ```bash
   cd deployment
   sudo ./deploy.sh
   ```

3. Update configuration:
   - Edit `/opt/modular-dash/.env` with your database credentials
   - Update `/etc/nginx/sites-available/modular-dash` with your domain name

## Manual Configuration

### Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE modular_dash;
   CREATE USER modular_dash WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE modular_dash TO modular_dash;
   ```

2. Update the .env file:
   ```
   DATABASE_URL=postgresql://modular_dash:your_password@localhost:5432/modular_dash
   ```

### Service Management

- Start the service: `sudo systemctl start modular-dash`
- Stop the service: `sudo systemctl stop modular-dash`
- Restart the service: `sudo systemctl restart modular-dash`
- View logs: `sudo journalctl -u modular-dash`

### Nginx Configuration

1. Update domain in nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/modular-dash
   ```

2. Test and restart nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Security Considerations

1. Set up SSL/TLS using Let's Encrypt
2. Configure firewall rules
3. Regularly update system packages
4. Use strong database passwords
5. Set up database backups

## Troubleshooting

1. Check application logs:
   ```bash
   sudo journalctl -u modular-dash -f
   ```

2. Check nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Verify service status:
   ```bash
   sudo systemctl status modular-dash
   ```
