# Easygenerator Authentication System

A modern full-stack authentication system built with NestJS (backend) and React (frontend), featuring JWT-based authentication, secure session management, and MongoDB integration.


## 🏗️ Infrastructure

![aws-diagram.png](./docs/aws-diagram.png)


### AWS Deployment
Infrastructure code and deployment scripts are located in the `infrastructure/` directory.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Environment Setup
1. Copy the environment template:
```bash
cp .env.example .env.development
```

2. Update `.env.development` with your preferred values (optional - defaults work for local development)

### Running the Application

#### Full Stack (Recommended)
```bash
# Start all services (frontend, backend, database)
make dev

# Or manually
docker compose up -d
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **MongoDB**: localhost:27017

#### Backend Only
```bash
# Navigate to backend directory
cd backend

# Start backend + database only
docker compose up -d
```

#### Development with Hot Reload
```bash
# Start with automatic code reloading
make dev

# View logs
make dev-logs
```

## 📋 Available Commands

### Development
- `make dev` - Start development environment
- `make dev-build` - Build and start development environment
- `make dev-logs` - Show development logs

### Service Management
- `make up` - Start all services
- `make down` - Stop all services
- `make restart` - Restart all services
- `make status` - Show service status

### Individual Services
- `make build-backend` - Rebuild backend only
- `make build-frontend` - Rebuild frontend only
- `make restart-backend` - Restart backend only
- `make restart-frontend` - Restart frontend only

### Logs
- `make logs` - Show all service logs
- `make logs-backend` - Show backend logs
- `make logs-frontend` - Show frontend logs
- `make logs-db` - Show MongoDB logs

### Database Management
- `make db-reset` - Reset MongoDB (⚠️ deletes all data)
- `make shell-db` - Access MongoDB shell


### Cleanup
- `make clean` - Remove containers and volumes
- `make clean-hard` - Nuclear cleanup (removes everything)

## 🛠️ Development

### Local Development Setup
```bash
# Install dependencies
make install

# Start development environment
make dev

# Run tests
make test
```

### Environment Variables
Key environment variables (see `.env.example` for full list):

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `BACKEND_PORT` | Backend server port | `3000` |
| `FRONTEND_PORT` | Frontend server port | `5173` |
| `MONGODB_PORT` | MongoDB port | `27017` |
| `JWT_SECRET` | JWT signing secret | *Change in production* |

### Project Structure
```
.
├── backend/           # NestJS backend application
├── frontend/          # React frontend application
├── docs/              # Project documentation and ADRs
├── mongodb/           # MongoDB initialization scripts
├── infrastructure/    # AWS/deployment configurations
├── docker-compose.yaml          # Main compose file
├── docker-compose.override.yaml # Development overrides
└── Makefile          # Development commands
```


### Architecture Overview
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: NestJS with TypeScript, Express.js
- **Database**: MongoDB with Docker
- **Authentication**: JWT tokens with refresh mechanism
- **Containerization**: Docker with multi-stage builds
- **Development**: Hot reload, file watching, health checks

### Security Features
- JWT access/refresh token pattern
- Secure HTTP-only cookies
- CORS protection
- Input validation and sanitization
- Password hashing with bcrypt
- Security headers middleware

### Logging & Monitoring
- **Structured JSON Logging**: Uses Pino for structured JSON logs in production
- **CloudWatch Integration**: Logs are optimized for AWS CloudWatch Logs Insights
- **Request Correlation**: Each request has a unique `traceId` for tracking across services
- **Contextual Logging**: Logs include user context, service metadata, and request information

Example log structure:
```json
{
  "level": 30,
  "time": 1757050044112,
  "pid": 1,
  "service": "easygenerator-auth-backend",
  "environment": "production",
  "req": {
    "method": "POST",
    "url": "/api/auth/sign-in"
  },
  "traceId": "ecbed0dc-a1d4-460c-8109-6460c367e463",
  "msg": "User signed in successfully: userId=68ba71036a95c7afb5aa60b1, email=user@example.com"
}
```

**CloudWatch Logs Insights Queries**:
- Track user sessions: `fields @timestamp, traceId, msg | filter userId like /68ba71036a95c7afb5aa60b1/`
- Monitor authentication flows: `fields @timestamp, traceId, msg | filter url like /auth/ | sort @timestamp desc`
- Trace request lifecycle: `fields @timestamp, msg | filter traceId = "ecbed0dc-a1d4-460c-8109-6460c367e463"`
![cloudwatch-log-insights](docs/cloudwatch-log-insights.png)

## 📝 API Documentation

Once running, visit https://be.easygenerator.omarshabaan.tech/api/docs for interactive API documentation (Swagger).

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The project uses GitHub Actions for automated CI/CD with separate workflows for frontend and backend:

#### **Frontend Pipeline** (`.github/workflows/frontend-ci.yaml` & `deploy-frontend.yaml`)
- **Triggers**: Pull requests and pushes to `main` branch (frontend changes only)
- **CI Steps**:
  - Code quality checks (ESLint, Prettier)
  - Unit tests with coverage reporting
  - Build verification
- **Deployment**: 
  - Builds React app and deploys to S3
  - Invalidates CloudFront distribution
  - **Live URL**: https://easygenerator.omarshabaan.tech

#### **Backend Pipeline** (`.github/workflows/backend-ci.yaml` & `deploy-backend.yaml`)  
- **Triggers**: Pull requests and pushes to `main` branch (backend changes only)
- **CI Steps**:
  - Code quality checks (ESLint, Prettier)
  - Unit and integration tests
  - Docker image build and push to ECR
- **Deployment**:
  - Deploys to AWS ECS with rolling updates
  - **API URL**: https://be.easygenerator.omarshabaan.tech

#### **Pipeline Features**
- 🔒 **OIDC Authentication**: Secure AWS access without long-lived credentials
- 📊 **Code Coverage**: Automated coverage reporting via CodeCov
- 🏗️ **Path-based Triggers**: Only runs when relevant files change
- 🔄 **Separate Environments**: Independent CI/CD for frontend and backend
- ⚡ **Fast Builds**: Optimized Node.js caching and parallel jobs

#### **Deployment Strategy**
- **Frontend**: Zero-downtime deployment (S3 + CloudFront invalidation)
- **Backend**: Rolling deployment with brief downtime (~30-60 seconds for cost optimization)

#### **SSL/TLS Configuration**
The backend API uses a cost-optimized SSL setup:

- **SSL Termination**: Nginx reverse proxy on EC2 instance
- **Certificate**: Let's Encrypt free SSL certificates with automatic renewal
- **Architecture**: ECS on EC2 instances (not Fargate + ALB + ACM)
  - **Cost Savings**: ~$16/month by avoiding Application Load Balancer
  - **Trade-off**: Manual SSL management vs AWS Certificate Manager automation
  - **Renewal**: Automated via certbot cron job on EC2 instance

**Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name be.easygenerator.omarshabaan.tech;
    
    ssl_certificate /etc/letsencrypt/live/be.easygenerator.omarshabaan.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/be.easygenerator.omarshabaan.tech/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **🔄 Future CI/CD Improvements (TODO)**
- [ ] **Rollback Mechanism**: Automatic rollback on deployment failure or health check errors
- [ ] **Blue-Green Deployment**: Zero-downtime backend deployments (currently simple rolling for cost)
- [ ] **Fix Backend Linting Errors**: Resolve ESLint/Prettier issues in backend codebase
- [ ] **End-to-End Testing**: Automated E2E tests in staging environment
- [ ] **Performance Testing**: Load testing integration before production deployment

## 🚀 Deployment

### Production Build
```bash
make prod-build
make prod-up
```

