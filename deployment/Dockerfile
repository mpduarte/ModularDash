# Build stage
FROM node:20-slim AS builder

# Install system dependencies required for building
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM debian:bookworm-slim

# Install Node.js and production system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    postgresql-client \
    curl \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@latest

# Create non-root user and required directories
RUN groupadd -r modular-dash && \
    useradd -r -g modular-dash -s /bin/false modular-dash && \
    mkdir -p /app /var/log/modular-dash /var/lib/modular-dash && \
    chown -R modular-dash:modular-dash /app /var/log/modular-dash /var/lib/modular-dash

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/public ./public
COPY deployment/logging.conf /etc/modular-dash/logging.conf

# Set proper permissions
RUN chown -R modular-dash:modular-dash /app && \
    chmod -R 550 /app && \
    chmod -R 770 /var/log/modular-dash /var/lib/modular-dash

# Add security labels
LABEL org.opencontainers.image.source="https://github.com/yourusername/modular-dash" \
      org.opencontainers.image.description="Modular Dashboard System" \
      org.opencontainers.image.licenses="MIT" \
      security.privileged=false \
      security.readonly=/app \
      security.network=true

# Switch to non-root user
USER modular-dash

# Expose port
EXPOSE 5000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Use tini as init system
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start command
CMD ["npm", "run", "start"]
