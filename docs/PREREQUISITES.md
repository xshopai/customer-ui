# Customer UI - Prerequisites

This document lists all prerequisites required to develop, build, and deploy the Customer UI application.

## Development Prerequisites

### Required Software

| Software | Version      | Purpose            | Installation                        |
| -------- | ------------ | ------------------ | ----------------------------------- |
| Node.js  | 18.x or 20.x | JavaScript runtime | [nodejs.org](https://nodejs.org/)   |
| npm      | 9.x+         | Package manager    | Included with Node.js               |
| Git      | 2.x+         | Version control    | [git-scm.com](https://git-scm.com/) |

### Optional but Recommended

| Software       | Version | Purpose               | Installation                                                  |
| -------------- | ------- | --------------------- | ------------------------------------------------------------- |
| VS Code        | Latest  | IDE                   | [code.visualstudio.com](https://code.visualstudio.com/)       |
| Docker Desktop | Latest  | Container development | [docker.com](https://www.docker.com/products/docker-desktop/) |

### VS Code Extensions

| Extension                              | Purpose               |
| -------------------------------------- | --------------------- |
| ES7+ React/Redux/React-Native snippets | React code snippets   |
| ESLint                                 | JavaScript linting    |
| Prettier                               | Code formatting       |
| Tailwind CSS IntelliSense              | Tailwind autocomplete |
| Auto Rename Tag                        | HTML/JSX tag renaming |

## Verify Installation

```bash
# Check Node.js
node --version
# Expected: v18.x.x or v20.x.x

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check Git
git --version
# Expected: git version 2.x.x
```

## Backend Dependencies

Customer UI requires the following services to be running:

| Service | Port           | Required For     |
| ------- | -------------- | ---------------- |
| Web BFF | 3100 (or 8080) | All API requests |

### With Full Stack

For complete functionality, these backend services should be available (via Web BFF):

| Service           | Purpose            |
| ----------------- | ------------------ |
| Product Service   | Product catalog    |
| Auth Service      | Authentication     |
| User Service      | User profiles      |
| Cart Service      | Shopping cart      |
| Inventory Service | Stock availability |
| Order Service     | Order management   |
| Review Service    | Product reviews    |

## Cloud Deployment Prerequisites

### Azure Container Apps Deployment

| Tool      | Version | Purpose          | Installation                                                                      |
| --------- | ------- | ---------------- | --------------------------------------------------------------------------------- |
| Azure CLI | 2.50+   | Azure management | [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) |
| Docker    | 20.x+   | Container builds | [docker.com](https://www.docker.com/)                                             |

### Required Azure Resources

| Resource                   | Purpose                                |
| -------------------------- | -------------------------------------- |
| Azure Subscription         | Azure account with active subscription |
| Resource Group             | Container for Azure resources          |
| Azure Container Registry   | Store Docker images                    |
| Container Apps Environment | Host container apps                    |

### Verify Azure CLI

```bash
# Check Azure CLI
az --version
# Expected: azure-cli 2.50.0 or higher

# Login to Azure
az login

# Verify subscription
az account show
```

## Environment Variables

### Development (.env)

```env
PORT=3000
REACT_APP_BFF_URL=http://localhost:8014
```

### Production

| Variable            | Description                     |
| ------------------- | ------------------------------- |
| `REACT_APP_BFF_URL` | Web BFF URL (set at build time) |

**Note:** React environment variables are embedded at build time. For runtime configuration, the deployment script configures the build with the correct BFF URL.

## Network Requirements

### Development

| Port | Service                  | Direction |
| ---- | ------------------------ | --------- |
| 3000 | Customer UI (dev server) | Inbound   |
| 3100 | Web BFF                  | Outbound  |

### Production (Azure)

| Endpoint                  | Purpose            | Direction |
| ------------------------- | ------------------ | --------- |
| `*.azurecontainerapps.io` | Container Apps     | Both      |
| `*.azurecr.io`            | Container Registry | Outbound  |

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file configured (`.env`)
- [ ] Web BFF running (for API calls)

## Troubleshooting

### Node.js Version Issues

```bash
# Use nvm to manage Node versions
nvm install 20
nvm use 20
```

### npm Permission Issues (Linux/Mac)

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Port Already in Use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Linux/Mac
lsof -i :3000
kill -9 <pid>
```

---

**Next Steps:** See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for development setup instructions.
