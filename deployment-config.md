# FocusFlow Deployment Strategy

## Infrastructure Overview

### Services Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   AI Service    │
│   (Next.js)     │    │   (Express)     │    │   (FastAPI)     │
│   Vercel        │    │   Railway       │    │   Railway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Supabase      │
                       └─────────────────┘
```

## Docker Configuration

### Frontend Dockerfile
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Backend Dockerfile
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Build the application
RUN npm run build

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
```

### AI Service Dockerfile
```dockerfile
# AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash ai
RUN chown -R ai:ai /app
USER ai

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/focusflow
      - JWT_SECRET=dev-secret-key
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/focusflow
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./ai-service:/app
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=focusflow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-schema.sql:/docker-entrypoint-initdb.d/schema.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy FocusFlow

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: focusflow_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Install AI service dependencies
        working-directory: ./ai-service
        run: pip install -r requirements.txt

      - name: Run backend tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/focusflow_test

      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test

      - name: Run AI service tests
        working-directory: ./ai-service
        run: python -m pytest

      - name: Run integration tests
        run: npm run test:integration

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:latest
          labels: ${{ steps.meta.outputs.labels }}

      - name: Build and push AI service image
        uses: docker/build-push-action@v5
        with:
          context: ./ai-service
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ai-service:latest
          labels: ${{ steps.meta.outputs.labels }}

      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
          service-id: ${{ secrets.RAILWAY_SERVICE_ID }}

      - name: Deploy frontend to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Environment Configuration

### Production Environment Variables
```bash
# Backend Environment Variables
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/focusflow
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=https://focusflow.app
EMAIL_SERVICE_API_KEY=your-email-service-key
AI_SERVICE_URL=https://ai-service.focusflow.app

# AI Service Environment Variables
DATABASE_URL=postgresql://user:password@host:5432/focusflow
REDIS_URL=redis://host:6379
PYTHONPATH=/app
MODEL_STORAGE_PATH=/app/models

# Frontend Environment Variables
NEXT_PUBLIC_API_URL=https://api.focusflow.app
NEXT_PUBLIC_WS_URL=wss://api.focusflow.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### Development Environment Variables
```bash
# .env.development
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/focusflow_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-key
JWT_REFRESH_SECRET=dev-refresh-secret-key
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

## Deployment Platforms

### Frontend (Vercel)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_ENVIRONMENT": "production"
  },
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Backend (Railway)
```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[services]
[services.web]
[services.web.name]
[services.web.environment]
[services.web.environmentVariables]
NODE_ENV = "production"
PORT = "5000"

[[services.ports]]
port = 5000
handlers = ["http"]
```

### Database (Supabase)
```sql
-- Supabase migration for production
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status 
ON tasks(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_logs_user_date 
ON time_logs(user_id, start_time);

-- Set up Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
-- ... other RLS policies
```

## Monitoring and Observability

### Application Monitoring
```javascript
// monitoring.js
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

const databaseConnections = new prometheus.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

module.exports = {
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseConnections,
};
```

### Health Checks
```javascript
// health.js
class HealthChecker {
  constructor(database, redis, aiService) {
    this.database = database;
    this.redis = redis;
    this.aiService = aiService;
  }

  async checkHealth() {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    try {
      // Database health check
      await this.database.query('SELECT 1');
      checks.services.database = { status: 'healthy' };
    } catch (error) {
      checks.services.database = { status: 'unhealthy', error: error.message };
      checks.status = 'degraded';
    }

    try {
      // Redis health check
      await this.redis.ping();
      checks.services.redis = { status: 'healthy' };
    } catch (error) {
      checks.services.redis = { status: 'unhealthy', error: error.message };
      checks.status = 'degraded';
    }

    try {
      // AI service health check
      const response = await fetch(`${process.env.AI_SERVICE_URL}/health`);
      checks.services.ai_service = { 
        status: response.ok ? 'healthy' : 'unhealthy' 
      };
    } catch (error) {
      checks.services.ai_service = { status: 'unhealthy', error: error.message };
      checks.status = 'degraded';
    }

    return checks;
  }
}
```

## Scaling Strategy

### Horizontal Scaling
- **Frontend**: Vercel automatically scales based on traffic
- **Backend**: Railway can scale horizontally with load balancer
- **Database**: Supabase provides automatic scaling and connection pooling
- **AI Service**: Can be scaled independently based on ML processing load

### Performance Optimization
- **Caching**: Redis for session storage and frequently accessed data
- **CDN**: Vercel's edge network for static assets
- **Database**: Read replicas for analytics queries
- **Load Balancing**: Railway's built-in load balancing

### Backup and Disaster Recovery
- **Database**: Daily automated backups with point-in-time recovery
- **Code**: Git version control with multiple environments
- **Assets**: CDN with automatic failover
- **Monitoring**: Alert systems for service degradation

## Security in Production

### SSL/TLS Configuration
- All services use HTTPS with automatic certificate renewal
- Internal service communication uses mTLS
- Database connections encrypted

### Network Security
- VPC isolation for internal services
- Firewall rules restricting access
- DDoS protection through Cloudflare

### Secrets Management
- Environment variables encrypted at rest
- Rotation of secrets every 90 days
- Audit logging for all secret access

This deployment strategy ensures high availability, scalability, and security for the FocusFlow application in production.
