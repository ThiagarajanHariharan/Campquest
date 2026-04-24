# CampusQuest Go - Microservices DevOps Project

## 📋 Project Overview

**CampusQuest Go** is a location-aware health and rewards ecosystem for university students. The application combines fitness tracking, campus canteen management, geofencing technology, and a rewards store into a seamless microservices-based platform.

### Key Features

- **Fitness Sync (Service A)**: Integrates with Strava to track workout data and convert miles into Quest Points (1 mile = 10 points)
- **Merchant Stall (Service B)**: Canteen management system with full CRUD operations for menu items
- **Geo-Location (Service C)**: Location-aware service that displays menus only when users are within 50m of a canteen
- **Rewards Store (Service D)**: Digital merch shop where students spend Quest Points on school hoodies and merchandise
- **React Frontend**: Modern UI dashboard for all services

---

## 🎯 Project Structure

```
campusquest-go/
├── services/                      # All microservices
│   ├── fitness-sync-service/     # Service A (Member A)
│   │   ├── src/
│   │   │   └── index.js
│   │   ├── tests/
│   │   │   └── fitness.test.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── merchant-stall-service/   # Service B (Member B)
│   │   ├── src/
│   │   │   └── index.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── geolocation-service/      # Service C (Member C)
│   │   ├── src/
│   │   │   └── index.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── rewards-store-service/    # Service D (Member D)
│       ├── src/
│       │   └── index.js
│       ├── tests/
│       ├── Dockerfile
│       └── package.json
├── frontend/                      # React application
│   ├── src/
│   │   ├── App.js
│   │   └── App.css
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── integration-tests/             # End-to-end tests
│   └── e2e.test.js
├── ansible/                       # Infrastructure as Code
│   ├── inventory/
│   │   └── hosts.yml
│   └── playbooks/
│       └── deploy.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions pipeline
├── docker-compose.yml            # Orchestration file
├── init.sql                       # Database initialization
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites

- Docker & Docker Compose (v2.0+)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (containerized)
- Git

### Phase 1: Local Development (Weeks 1-10)

#### 1. Clone the Repository
```bash
git clone https://github.com/your-team/campusquest-go.git
cd campusquest-go
```

#### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install service dependencies
for service in services/*/; do
  cd "$service"
  npm install
  cd ../..
done
```

#### 3. Start Services Locally with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 4. Verify Services
```bash
# Check health endpoints
curl http://localhost:3001/health  # Fitness-Sync
curl http://localhost:3002/health  # Merchant-Stall
curl http://localhost:3003/health  # Geo-Location
curl http://localhost:3004/health  # Rewards-Store
curl http://localhost:3000         # Frontend
```

### Phase 2: DevOps Implementation (Weeks 11-13)

#### 1. GitHub Actions CI/CD Pipeline

The pipeline is configured to:
- Run unit tests on every push
- Perform security scanning (Snyk)
- Build Docker images
- Run integration tests
- Deploy to staging environment (on main branch only)

View pipeline status: https://github.com/your-team/campusquest-go/actions

#### 2. Infrastructure as Code with Ansible

Deploy to any environment using Ansible:
```bash
# Development (local)
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/deploy.yml -e deployment_env=development

# Staging
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/deploy.yml -e deployment_env=staging

# Production
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/deploy.yml -e deployment_env=production
```

#### 3. Run Integration Tests
```bash
# Start services with Docker Compose
docker-compose up -d

# Wait for services to be healthy
sleep 15

# Run tests
npm test -- integration-tests/e2e.test.js

# Stop services
docker-compose down
```

---

## 📡 Service Endpoints

### Fitness-Sync Service (Port 3001)

```bash
# Health check
GET /health

# Get user's fitness data and quest points
GET /api/fitness/user/:userId

# Sync fitness activity from Strava (1 mile = 10 points)
POST /api/fitness/sync
Body: {
  "user_id": 1,
  "activity_type": "running",
  "distance_miles": 5.5,
  "calories_burned": 450
}

# Get top 10 users by quest points
GET /api/fitness/leaderboard

# Create new user
POST /api/fitness/user
Body: {
  "username": "student123",
  "email": "student@campus.edu",
  "password_hash": "hashed_password"
}
```

### Merchant-Stall Service (Port 3002)

```bash
# Health check
GET /health

# List all canteens
GET /api/merchant/canteens

# Get menu for a specific canteen
GET /api/merchant/canteen/:canteenId/menu

# Create menu item (CRUD: Create)
POST /api/merchant/canteen/:canteenId/menu
Body: {
  "name": "Chicken Rice",
  "description": "Delicious chicken rice",
  "price": 3.50,
  "calories": 600
}

# Update menu item (CRUD: Update)
PUT /api/merchant/menu/:menuItemId
Body: {
  "name": "Vegetable Stir-fry",
  "price": 3.00,
  "calories": 500
}

# Delete menu item (CRUD: Delete)
DELETE /api/merchant/menu/:menuItemId

# Get healthy items only (calories <= 600)
GET /api/merchant/canteen/:canteenId/healthy
```

### Geo-Location Service (Port 3003)

```bash
# Health check
GET /health

# Check user location and find nearby canteens (50m radius)
POST /api/geo/check-location
Body: {
  "user_id": 1,
  "latitude": 1.3429,
  "longitude": 103.6818
}

# Get menu for a specific canteen
GET /api/geo/canteen/:canteenId/menu

# Get user's current location and nearby canteen
GET /api/geo/user/:userId/current-location

# Get all canteens on campus
GET /api/geo/canteens/all
```

### Rewards-Store Service (Port 3004)

```bash
# Health check
GET /health

# Get all available merchandise
GET /api/rewards/merchandise

# Get specific merchandise details
GET /api/rewards/merchandise/:merchandiseId

# Get user's quest points balance
GET /api/rewards/user/:userId/balance

# Get user's transaction history
GET /api/rewards/user/:userId/transactions

# Claim merchandise (spend quest points)
POST /api/rewards/claim
Body: {
  "user_id": 1,
  "merchandise_id": 1,
  "quantity": 1
}

# Create new merchandise (admin)
POST /api/rewards/merchandise
Body: {
  "name": "Campus Hoodie",
  "description": "Premium CampusQuest hoodie",
  "cost_in_points": 500,
  "stock_quantity": 100
}

# Update merchandise (admin)
PUT /api/rewards/merchandise/:merchandiseId
```

---

## 🧪 Testing Strategy

### Unit Tests (Service-Level)

Each service has comprehensive unit tests:

```bash
# Run fitness-sync tests
cd services/fitness-sync-service
npm test

# Run merchant-stall tests
cd ../merchant-stall-service
npm test

# ... and so on for other services
```

### Integration Tests (End-to-End)

Tests the complete workflow: Fitness Sync → Geolocation → Claim Reward

```bash
# Ensure all services are running
docker-compose up -d

# Run integration tests
npm test -- integration-tests/e2e.test.js
```

### Test Coverage

- ✅ Service health checks
- ✅ Complete user journeys
- ✅ CRUD operations
- ✅ Geolocation accuracy (50m radius)
- ✅ Inventory management
- ✅ Concurrent transaction safety
- ✅ Error handling
- ✅ Performance benchmarks

---

## 🔐 Security & DevSecOps

### Implemented Security Measures

1. **Secret Management**
   - Database credentials stored in `.env` (not in git)
   - Use `ansible-vault` for production secrets

2. **Container Security**
   - Multi-stage Docker builds for smaller images
   - Non-root user execution
   - Read-only file systems where possible

3. **CI/CD Security**
   - Snyk security scanning for dependencies
   - Hardcoded secret detection
   - Container image scanning before deployment

4. **Database**
   - Database transactions prevent race conditions
   - SQL parameterization prevents injection
   - Row-level locking for critical operations

### Enable Snyk Security Scanning

```bash
# Set up Snyk token
export SNYK_TOKEN=your_snyk_token

# Run security scan locally
snyk test services/
```

---

## 📊 Team Member Contributions

### Phase 1: Application Features

| Member | Service | Feature | Key Endpoints |
|--------|---------|---------|---------------|
| **A** | Fitness-Sync | Strava integration, points calculation | `POST /api/fitness/sync`, `GET /api/fitness/leaderboard` |
| **B** | Merchant-Stall | Menu management (CRUD) | `POST/GET/PUT/DELETE /api/menu` |
| **C** | Geo-Location | 50m radius geofencing | `POST /api/geo/check-location` |
| **D** | Rewards-Store | Merchandise shop, inventory | `POST /api/rewards/claim`, `GET /api/rewards/merchandise` |

### Phase 2: DevOps Components

| Member | DevOps Component | Implementation |
|--------|------------------|-----------------|
| **A** | Unit Testing | Jest tests for fitness service |
| **B** | Security Scanning | Snyk integration in CI pipeline |
| **C** | Integration Testing | E2E tests spanning all services |
| **D** | Deployment Automation | Ansible playbooks, Docker optimization |

---

## 🏗️ Infrastructure Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Port 3000)            │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴────────────────────────────────────────────┐
     │                                                     │
┌────▼─────────┐  ┌────────────┐  ┌────────────┐  ┌────▼─────┐
│  Fitness     │  │  Merchant  │  │    Geo     │  │ Rewards  │
│  (3001)      │  │  (3002)    │  │  (3003)    │  │  (3004)  │
└────┬─────────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘
     │                  │               │              │
     └──────────────────┴───────────────┴──────────────┘
                        │
              ┌─────────▼──────────┐
              │  PostgreSQL (5432) │
              │  CampusQuest DB    │
              └────────────────────┘
```

### Deployment Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD Pipeline)
    ↓
[Test] → [Security Scan] → [Build Docker] → [Integration Test]
    ↓
Container Registry (GHCR)
    ↓
Ansible (Infrastructure as Code)
    ↓
Deployment Environment (Dev/Staging/Prod)
```

---

## 📈 Monitoring & Logging

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f fitness-sync

# Real-time monitoring
watch docker-compose ps
```

### Database Backups

Automated daily backups at 2:00 AM (via Ansible):

```bash
# Manual backup
docker exec campusquest_db pg_dump -U campusquest_user -d campusquest_db > backup.sql

# List backups
ls /opt/campusquest-go/backups/
```

---

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d

# Check port conflicts
netstat -tuln | grep 300
```

### Database Connection Issues

```bash
# Connect to database
docker exec -it campusquest_db psql -U campusquest_user -d campusquest_db

# Check database tables
\dt

# Exit
\q
```

### Container Health Checks Failing

```bash
# Check service endpoint manually
curl -v http://localhost:3001/health

# Restart service
docker-compose restart fitness-sync

# Check resource limits
docker stats
```

---

## 📚 Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | Node.js + Express | 18 |
| Frontend | React | 18 |
| Database | PostgreSQL | 15 |
| Containerization | Docker | Latest |
| Orchestration | Docker Compose | 2.0+ |
| CI/CD | GitHub Actions | - |
| IaC | Ansible | 2.10+ |
| Testing | Jest + Axios | Latest |
| Security | Snyk | - |

---

## 🎓 Learning Outcomes

By completing this project, your team will understand:

- ✅ **Microservices Architecture**: Design loosely-coupled services
- ✅ **CI/CD Pipelines**: Automate build, test, and deployment
- ✅ **Containerization**: Package applications reliably with Docker
- ✅ **Infrastructure as Code**: Reproducible deployments with Ansible
- ✅ **DevSecOps**: Integrate security throughout the pipeline
- ✅ **Testing Strategies**: Unit, integration, and E2E testing
- ✅ **Team Collaboration**: Using Git, branching, and code reviews
- ✅ **System Design**: Scalability, reliability, maintainability

---

## 📞 Support & Contact

For issues or questions:

1. Check GitHub Issues: https://github.com/your-team/campusquest-go/issues
2. Review CI/CD logs: https://github.com/your-team/campusquest-go/actions
3. Check service health endpoints
4. Review Docker Compose logs: `docker-compose logs`

---

## 📝 Assessment Checklist

### Phase 1 (Week 10)
- [ ] Problem statement clearly defined
- [ ] Target users identified
- [ ] 4 functional features demonstrable
- [ ] Basic system architecture documented
- [ ] Working prototype deployed locally
- [ ] GitHub repository with commits from all members
- [ ] Docker files created for all services
- [ ] Basic docker-compose.yml functional

### Phase 2 (Week 13)
- [ ] All services Dockerized and running
- [ ] CI/CD pipeline configured and working
- [ ] Unit tests passing (all services)
- [ ] Integration tests passing (end-to-end)
- [ ] Security scanning implemented
- [ ] Ansible playbooks for deployment
- [ ] Staging environment deployment working
- [ ] Team documentation complete

---

**Last Updated**: April 24, 2026
**Version**: 1.0.0
**Status**: Ready for Phase 1 Midpoint Assessment
