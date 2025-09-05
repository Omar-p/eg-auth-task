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

## 📝 API Documentation

Once running, visit https://be.easygenerator.omarshabaan.tech/api/docs for interactive API documentation (Swagger).

## 🚀 Deployment

### Production Build
```bash
make prod-build
make prod-up
```

