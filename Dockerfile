# Multi-stage build for NestJS backend
FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Development stage
FROM base AS development

# Install all dependencies including dev dependencies
RUN yarn install --frozen-lockfile && yarn cache clean

# Copy source code
COPY . .

# Pre-create all necessary directories and set permissions
RUN mkdir -p /app/dist/modules/message/templates \
             /app/dist/modules/transaction/templates \
             /app/dist/modules/user/templates && \
    chown -R nestjs:nodejs /app && \
    chmod -R 775 /app
USER nestjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/bank || exit 1

# Start development server
CMD ["dumb-init", "yarn", "start:dev"]

# Build stage
FROM base AS builder

# Install all dependencies
RUN yarn install --frozen-lockfile && yarn cache clean

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init wget && \
    rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean && \
    rm -rf /tmp/* /var/tmp/*

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy migration files
COPY --from=builder --chown=nestjs:nodejs /app/src/migrations ./src/migrations

# Change ownership to app user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/bank || exit 1

# Start production server
CMD ["dumb-init", "node", "dist/main"]
