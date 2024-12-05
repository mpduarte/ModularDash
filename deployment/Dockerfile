# Build stage
FROM node:20-slim AS builder

# Install system dependencies required for building
RUN apt-get update && apt-get install -y \
    curl \
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
FROM node:20-slim

# Install production system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r modular-dash && useradd -r -g modular-dash modular-dash

# Create app directory and log directory
WORKDIR /app
RUN mkdir -p /var/log/modular-dash && \
    chown -R modular-dash:modular-dash /var/log/modular-dash

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/public ./public

# Set ownership to non-root user
RUN chown -R modular-dash:modular-dash /app

# Switch to non-root user
USER modular-dash

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start command
CMD ["npm", "run", "start"]
