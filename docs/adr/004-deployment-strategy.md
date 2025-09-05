# ADR-004: Deployment Strategy and CI/CD Pipeline

## Status
Accepted

## Context
We need to establish a deployment strategy that balances cost, reliability, and development velocity. The application consists of a React frontend and NestJS backend with different deployment requirements and constraints.

## Decision
We will implement a hybrid deployment strategy:
- **Frontend**: Zero-downtime deployment via S3 + CloudFront
- **Backend**: Rolling deployment with brief downtime for cost optimization

## GitHub Actions Workflows

The project uses GitHub Actions for automated CI/CD with separate workflows for frontend and backend:

### **Frontend Pipeline** (`.github/workflows/frontend-ci.yaml` & `deploy-frontend.yaml`)
- **Triggers**: Pull requests and pushes to `main` branch (frontend changes only)
- **CI Steps**:
  - Code quality checks (ESLint, Prettier)
  - Unit tests with coverage reporting
  - Build verification
- **Deployment**: 
  - Builds React app and deploys to S3
  - Invalidates CloudFront distribution
  - **Live URL**: https://easygenerator.omarshabaan.tech

### **Backend Pipeline** (`.github/workflows/backend-ci.yaml` & `deploy-backend.yaml`)  
- **Triggers**: Pull requests and pushes to `main` branch (backend changes only)
- **CI Steps**:
  - Code quality checks (ESLint, Prettier)
  - Unit and integration tests
  - Docker image build and push to ECR
- **Deployment**:
  - Deploys to AWS ECS with rolling updates
  - **API URL**: https://be.easygenerator.omarshabaan.tech

### **Pipeline Features**
- 🔒 **OIDC Authentication**: Secure AWS access without long-lived credentials
- 📊 **Code Coverage**: Automated coverage reporting via CodeCov
- 🏗️ **Path-based Triggers**: Only runs when relevant files change
- 🔄 **Separate Environments**: Independent CI/CD for frontend and backend
- ⚡ **Fast Builds**: Optimized Node.js caching and parallel jobs

## Deployment Strategy
- **Frontend**: Zero-downtime deployment (S3 + CloudFront invalidation)
- **Backend**: Rolling deployment with brief downtime (~30-60 seconds for cost optimization)

## SSL/TLS Configuration
The backend API uses a cost-optimized SSL setup (see [ADR-003](./003-ssl-tls-configuration.md) for details):

- **SSL Termination**: Nginx reverse proxy on EC2 instance
- **Certificate**: Let's Encrypt free SSL certificates with automatic renewal
- **Architecture**: ECS on EC2 instances (not Fargate + ALB + ACM)
  - **Cost Savings**: ~$16/month by avoiding Application Load Balancer
  - **Trade-off**: Manual SSL management vs AWS Certificate Manager automation
  - **Renewal**: Automated via certbot cron job on EC2 instance

## 🔄 Future CI/CD Improvements (TODO)
- [ ] **Rollback Mechanism**: Automatic rollback on deployment failure or health check errors
- [ ] **Blue-Green Deployment**: Zero-downtime backend deployments (currently simple rolling for cost)
- [ ] **Fix Backend Linting Errors**: Resolve ESLint/Prettier issues in backend codebase
- [ ] **End-to-End Testing**: Automated E2E tests in staging environment
- [ ] **Performance Testing**: Load testing integration before production deployment

## Implementation Details

### Frontend Deployment Strategy
**S3 + CloudFront Approach**
- **Zero Downtime**: Instant deployment with cache invalidation
- **Global CDN**: Low latency worldwide via CloudFront edge locations  
- **Cost Effective**: Pay-per-use model, no fixed infrastructure costs
- **Simplicity**: Static files, no complex orchestration needed

### Backend Deployment Strategy
**Rolling Deployment (Cost-Optimized)**
- **Brief Downtime**: 30-60 seconds during container replacement
- **Cost Savings**: Avoid ALB costs (~$16/month) by using single EC2 + ECS
- **Acceptable Trade-off**: Short downtime acceptable for MVP phase
- **Simple Implementation**: Less complexity than blue-green deployments

## Consequences

### Positive
- **Cost Effective**: Minimal infrastructure costs during MVP phase
- **Developer Experience**: Fast feedback loops, separate pipelines
- **Scalability**: Architecture supports future enhancements
- **Security**: OIDC authentication, encrypted communication

### Negative
- **Backend Downtime**: 30-60 seconds during deployments
- **Manual Rollbacks**: No automated rollback mechanism yet
- **Single Point of Failure**: One EC2 instance for backend
- **Operational Overhead**: Manual SSL management (see ADR-003)

## Related ADRs
- [ADR-003: SSL/TLS Configuration Strategy](./003-ssl-tls-configuration.md)
- [ADR-001: Frontend Authentication State Management](./001-frontend-authentication-state-management.md) 
- [ADR-002: Backend Authentication Architecture](./002-backend-authentication-architecture-decisions.md)