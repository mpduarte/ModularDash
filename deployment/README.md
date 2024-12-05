# Deployment Guide

This guide explains how to deploy the Modular Dashboard application using either traditional deployment or Docker-based deployment.

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 16.x
- Nginx (for traditional deployment)
- Docker and Docker Compose (for Docker deployment)

## Environment Variables Setup

Create a `.env` file with the following variables:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/modular_dash
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=modular_dash
PGHOST=localhost
PGPORT=5432
```

## Docker Deployment

1. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. Build and start the containers:
   ```bash
   cd deployment
   docker-compose up -d
   ```

3. Database Operations:
   ```bash
   # Create a backup
   ./deployment/db-ops.sh backup

   # Restore from a backup
   ./deployment/db-ops.sh restore backups/db_backup_20240205_123456.sql
   ```

4. Monitor the logs:
   ```bash
   # View all container logs
   docker-compose -f deployment/docker-compose.yml logs -f

   # View application logs
   tail -f logs/modular-dash/error.log
   tail -f logs/modular-dash/access.log
   ```

4. Access the application at `http://localhost:5000`

### Docker Health Checks and Monitoring

The application includes comprehensive monitoring and health check capabilities:

1. Health Checks:
   - App Service: Checks `/api/health` endpoint every 30 seconds
   - Database: Checks PostgreSQL connectivity every 10 seconds

2. Monitoring Stack:
   - Prometheus: Access metrics dashboard at `http://localhost:9090`
   - Node Exporter: System metrics collection
   - Postgres Exporter: Database metrics collection

3. Metrics Available:
   - Application performance metrics
   - System resource utilization
   - Database performance statistics
   - Custom business metrics

4. Accessing Monitoring:
   ```bash
   # View Prometheus dashboard
   open http://localhost:9090

   # Check Node Exporter metrics
   curl http://localhost:9100/metrics

   # View Postgres metrics
   curl http://localhost:9187/metrics
   ```

## Monitoring Setup

### Replit Deployment
For Replit deployment, metrics are available at the `/metrics` endpoint when `ENABLE_METRICS=true` is set in the environment variables.

### Docker Deployment
The Docker deployment includes a full monitoring stack:

1. Prometheus (metrics collection and storage)
2. Node Exporter (system metrics)
3. Postgres Exporter (database metrics)

Access the monitoring interfaces:
- Prometheus UI: `http://localhost:9090`
- Node Exporter metrics: `http://localhost:9100/metrics`
- Postgres Exporter metrics: `http://localhost:9187/metrics`

### Available Metrics
- HTTP request duration and counts
- System resource utilization
- Database performance metrics
- Custom application metrics

### Dashboard Setup
1. Access Prometheus UI
2. Navigate to Graph view
3. Use PromQL to query metrics, e.g.:
   - `http_requests_total`: Total HTTP requests
   - `http_request_duration_seconds_bucket`: Request duration histogram
   - `nodejs_heap_size_total_bytes`: Node.js memory usage

## Traditional Deployment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm ci --production
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Set up the systemd service:
   ```bash
   sudo cp deployment/modular-dash.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable modular-dash
   sudo systemctl start modular-dash
   ```

5. Configure Nginx:
   ```bash
   sudo cp deployment/nginx.conf /etc/nginx/sites-available/modular-dash
   sudo ln -sf /etc/nginx/sites-available/modular-dash /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Service Management

- Start: `sudo systemctl start modular-dash`
- Stop: `sudo systemctl stop modular-dash`
- Restart: `sudo systemctl restart modular-dash`
- View logs: `sudo journalctl -u modular-dash -f`

## Database Setup

1. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE modular_dash;
   CREATE USER modular_dash WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE modular_dash TO modular_dash;
   ```

2. Update the `.env` file with your database credentials.

## Security Considerations

1. SSL/TLS Configuration:
   - Use Let's Encrypt for SSL certificates
   - Update Nginx configuration to enable HTTPS
   - Force HTTPS redirection

2. Database Security:
   - Use strong passwords
   - Configure PostgreSQL access restrictions
   - Enable regular backups

3. Application Security:
   - Keep Node.js and dependencies updated
   - Configure appropriate firewall rules
   - Use secure headers and CORS settings

## Troubleshooting

1. Application Issues:
   ```bash
   # Check application logs
   sudo journalctl -u modular-dash -f
   # Or for Docker
   docker-compose logs -f app
   ```

2. Database Issues:
   ```bash
   # Check database logs
   sudo journalctl -u postgresql
   # Or for Docker
   docker-compose logs -f db
   ```

3. Common Solutions:
   - Verify environment variables are set correctly
   - Check database connectivity
   - Ensure correct file permissions
   - Verify port availability
