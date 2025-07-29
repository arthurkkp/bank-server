# Docker Setup for Bank Application

This document provides instructions for running the Bank Application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Development Environment

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

### Production Environment

1. **Start production services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Services

### PostgreSQL Database
- **Container:** `bank-postgres`
- **Port:** `5432`
- **Database:** `bank`
- **Username:** `root`
- **Password:** `root`

### Bank Server (NestJS API)
- **Container:** `bank-server`
- **Port:** `4000`
- **Health Check:** `http://localhost:4000/health`
- **API Documentation:** `http://localhost:4000/documentation`

### Bank Client (React Frontend)
- **Container:** `bank-client`
- **Port:** `3000` (development) / `80` (production)
- **URL:** `http://localhost:3000`

## Environment Variables

### Bank Server
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `4000` |
| `DB_HOST` | Database host | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | `root` |
| `DB_DATABASE` | Database name | `bank` |
| `JWT_SECRET_KEY` | JWT secret key | `your-secret-key` |

### Bank Client
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | API base URL | `http://localhost:4000/bank` |

## Building Images

### Build Server Image
```bash
cd bank-server
docker build -t bank-server:latest .
```

### Build Client Image
```bash
cd bank-client
docker build -t bank-client:latest .
```

## Security Scanning

### Install Trivy
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```

### Scan Images
```bash
# Scan server image
trivy image bank-server:latest

# Scan client image
trivy image bank-client:latest

# Scan with specific severity
trivy image --severity HIGH,CRITICAL bank-server:latest
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Ensure ports 3000, 4000, and 5432 are not in use
   - Modify port mappings in docker-compose.yml if needed

2. **Database connection issues:**
   - Wait for PostgreSQL to be ready (health check)
   - Check database credentials in environment variables

3. **Client can't connect to server:**
   - Verify `REACT_APP_API_URL` environment variable
   - Ensure server container is running and healthy

4. **Permission issues:**
   - Containers run as non-root users for security
   - Check file permissions if mounting volumes

### Useful Commands

```bash
# View container logs
docker-compose logs [service-name]

# Execute commands in running container
docker-compose exec bank-server sh
docker-compose exec bank-client sh

# Rebuild specific service
docker-compose build bank-server
docker-compose up -d bank-server

# Remove all containers and volumes
docker-compose down -v

# View container resource usage
docker stats
```

### Health Checks

All services include health checks:
- **PostgreSQL:** `pg_isready` command
- **Bank Server:** HTTP request to `/health` endpoint
- **Bank Client:** HTTP request to root path

Check health status:
```bash
docker-compose ps
```

## Development Workflow

1. **Make code changes**
2. **Rebuild affected service:**
   ```bash
   docker-compose build bank-server
   docker-compose up -d bank-server
   ```
3. **View logs:**
   ```bash
   docker-compose logs -f bank-server
   ```

## Production Deployment

For production deployment, you must set environment variables before starting services:

1. **Set required environment variables:**
   ```bash
   export JWT_SECRET_KEY="your-secure-jwt-secret"
   export JWT_FORGOTTEN_PASSWORD_TOKEN_SECRET="your-forgotten-password-secret"
   export DB_USERNAME="your-db-username"
   export DB_PASSWORD="your-secure-db-password"
   export POSTGRES_USER="your-postgres-user"
   export POSTGRES_PASSWORD="your-secure-postgres-password"
   export BANK_ROOT_EMAIL="your-root-email"
   export BANK_ROOT_PASSWORD="your-secure-root-password"
   export BANK_AUTHOR_EMAIL="your-author-email"
   export BANK_AUTHOR_PASSWORD="your-secure-author-password"
   export EMAIL_ADDRESS="your-email-address"
   export EMAIL_PASSWORD="your-email-password"
   ```

2. **Use production compose file:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Additional production considerations:**
   - Set up proper SSL/TLS termination (nginx proxy, load balancer)
   - Configure monitoring and logging
   - Set up backup strategy for PostgreSQL data
   - Use Docker secrets or external secret management for sensitive data

**Security Note:** Never commit production secrets to version control. Use environment variables, Docker secrets, or a secure secret management system.

## Security Considerations

- Containers run as non-root users
- Multi-stage builds minimize attack surface
- Regular security scanning with Trivy
- Environment variables for sensitive configuration
- Network isolation between services
- Health checks for service monitoring
