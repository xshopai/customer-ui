<div align="center">

# 🛍️ Customer UI

**Modern React e-commerce storefront for the xshopai platform**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Getting Started](#-getting-started) •
[Documentation](#-documentation) •
[Testing](#-testing) •
[Contributing](#-contributing)

</div>

---

## 🎯 Overview

The **Customer UI** is the consumer-facing storefront for the xshopai e-commerce platform. Built with React and Tailwind CSS, it delivers a fast, responsive shopping experience including product browsing, cart management, checkout, order tracking, AI-powered chat support, and review submission. All API calls are routed through the [Web BFF](https://github.com/xshopai/web-bff).

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🛒 Shopping Experience

- Product catalog with search & filters
- Category browsing & trending products
- Shopping cart with quantity management
- Complete checkout flow with order tracking

</td>
<td width="50%">

### 🤖 AI-Powered Chat

- Natural language product search
- Order inquiry & tracking via chat
- Conversational shopping assistant
- Powered by Azure OpenAI (GPT-4o)

</td>
</tr>
<tr>
<td width="50%">

### 🔐 User Management

- Registration with email verification
- JWT-based authentication (cookie)
- Profile management & address book
- Order history & review submission

</td>
<td width="50%">

### 📱 Modern Frontend

- TailwindCSS responsive design
- Dark mode support
- Redux Toolkit + Zustand state
- TanStack React Query data fetching

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- npm 9+
- Running backend services (Web BFF on port 8014)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/xshopai/customer-ui.git
cd customer-ui

# Build and run
docker build -t customer-ui .
docker run -p 3000:80 customer-ui
```

### Local Development Setup

<details>
<summary><b>🔧 Development Server</b></summary>

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env — ensure REACT_APP_BFF_URL=http://localhost:8014

# Start development server (hot reload)
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

📖 See [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for detailed instructions.

</details>

<details>
<summary><b>🏗️ Production Build</b></summary>

```bash
# Create optimized production build
npm run build

# Serve with nginx (Docker)
docker build -t customer-ui .
docker run -p 3000:80 customer-ui
```

The Dockerfile uses multi-stage builds with nginx for production serving.

</details>

---

## 📚 Documentation

| Document                                          | Description                                        |
| :------------------------------------------------ | :------------------------------------------------- |
| 📘 [Local Development](docs/LOCAL_DEVELOPMENT.md) | Step-by-step local setup and development workflows |
| ☁️ [Azure Container Apps](docs/ACA_DEPLOYMENT.md) | Deploy to Azure Container Apps                     |
| 🏗️ [Architecture](docs/ARCHITECTURE.md)           | Component structure, routing, and state management |
| 📋 [Product Requirements](docs/PRD.md)            | Feature specifications and user stories            |
| 🔧 [Prerequisites](docs/PREREQUISITES.md)         | Detailed prerequisite installation guide           |

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run Playwright E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed browser
npm run test:e2e:headed

# Lint code
npm run lint

# Format code
npm run format
```

### Test Coverage

| Metric     | Status                   |
| :--------- | :----------------------- |
| Unit Tests | ✅ React Testing Library |
| E2E Tests  | ✅ Playwright            |
| Linting    | ✅ ESLint                |

---

## 🏗️ Project Structure

```
customer-ui/
├── 📁 src/                       # Application source code
│   ├── 📁 api/                   # API client (Axios → Web BFF)
│   ├── 📁 components/            # Reusable UI components
│   ├── 📁 contexts/              # React context providers
│   ├── 📁 data/                  # Static data and constants
│   ├── 📁 hooks/                 # Custom React hooks
│   ├── 📁 pages/                 # Page-level components (routes)
│   ├── 📁 store/                 # Redux Toolkit + Zustand stores
│   ├── 📁 telemetry/             # Azure Application Insights
│   └── 📁 utils/                 # Helper functions
├── 📁 public/                    # Static assets
├── 📁 tests/                     # Playwright E2E tests
├── 📁 scripts/                   # Build and utility scripts
├── 📁 docs/                      # Documentation
├── 📄 Dockerfile                 # Multi-stage build (nginx)
├── 📄 nginx.conf                 # Production nginx configuration
└── 📄 package.json               # Dependencies and scripts
```

---

## 🔧 Technology Stack

| Category         | Technology                                     |
| :--------------- | :--------------------------------------------- |
| ⚛️ Framework     | React 18.2 with React Router v6                |
| 🎨 Styling       | TailwindCSS with responsive design & dark mode |
| 📦 State         | Redux Toolkit + Zustand + TanStack React Query |
| 🌐 HTTP Client   | Axios (all requests via Web BFF)               |
| 🧪 Testing       | React Testing Library + Playwright E2E         |
| 📊 Observability | Azure Application Insights                     |
| 🐳 Deployment    | Docker multi-stage build with nginx            |

---

## ⚡ Quick Reference

```bash
# 🚀 Development
npm start                         # Start dev server (port 3000)
npm run build                     # Production build

# 🧪 Testing
npm test                          # Unit tests
npm run test:e2e                  # Playwright E2E tests
npm run test:e2e:ui               # E2E with Playwright UI

# 🔍 Code Quality
npm run lint                      # ESLint check
npm run lint:fix                  # Auto-fix lint issues
npm run format                    # Prettier format

# 🐳 Docker
docker build -t customer-ui .
docker run -p 3000:80 customer-ui
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Write** tests for your changes
4. **Run** the test suite
   ```bash
   npm test && npm run lint
   ```
5. **Commit** your changes
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

Please ensure your PR:

- ✅ Passes all existing tests
- ✅ Includes tests for new functionality
- ✅ Follows the existing code style
- ✅ Updates documentation as needed

---

## 🆘 Support

| Resource         | Link                                                                     |
| :--------------- | :----------------------------------------------------------------------- |
| 🐛 Bug Reports   | [GitHub Issues](https://github.com/xshopai/customer-ui/issues)           |
| 📖 Documentation | [docs/](docs/)                                                           |
| 💬 Discussions   | [GitHub Discussions](https://github.com/xshopai/customer-ui/discussions) |

---

## 📄 License

This project is part of the **xshopai** e-commerce platform.
Licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[⬆ Back to Top](#-customer-ui)**

Made with ❤️ by the xshopai team

</div>
