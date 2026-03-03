# Copilot Instructions — customer-ui

## Service Identity

- **Name**: customer-ui
- **Purpose**: Customer-facing e-commerce storefront — product browsing, cart, checkout, order tracking, reviews
- **Port**: 3000
- **Language**: JavaScript (JSX)
- **Framework**: React 18.2 with Create React App (react-scripts 5)
- **State Management**: Redux Toolkit + Zustand + TanStack Query v5
- **Styling**: TailwindCSS 3 + Heroicons

## Architecture

- **Pattern**: SPA (Single Page Application) — communicates with web-bff API gateway
- **API Communication**: Axios HTTP client → Web BFF (port 8014)
- **State**: Redux Toolkit for global state, Zustand for lightweight stores, TanStack Query for server state caching
- **Routing**: React Router DOM v6
- **Telemetry**: Azure Application Insights SDK

## Project Structure

```
customer-ui/
├── src/
│   ├── api/             # Axios API client configuration
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React context providers
│   ├── data/            # Static data / constants
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page-level components (route targets)
│   ├── store/           # Redux Toolkit slices + Zustand stores
│   ├── telemetry/       # Application Insights setup
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Root component with routing
│   ├── index.js         # Entry point
│   └── index.css        # TailwindCSS imports
├── public/
├── postcss.config.js
├── tailwind.config.js   # (via CRA config)
├── nginx.conf           # Production reverse proxy config
├── Dockerfile
└── package.json
```

## Code Conventions

- **JavaScript JSX** (not TypeScript)
- Use **functional components** with hooks exclusively
- Use **TailwindCSS** utility classes for all styling (no CSS modules)
- Use **Redux Toolkit** `createSlice` for global state management
- Use **TanStack Query** `useQuery`/`useMutation` for API data fetching
- Use **Zustand** for lightweight local state (cart, auth state)
- Use **React Router v6** `BrowserRouter`, `Routes`, `Route` for navigation
- Use **Axios** for HTTP requests (configured with base URL and interceptors)
- Toast notifications via **react-toastify**
- Icons via **@heroicons/react** (`/24/outline`, `/24/solid`)

## Key Patterns

- All API calls go through Web BFF (never directly to microservices)
- Guest cart support with UUID-based cart transfer on login
- JWT stored in cookies (httpOnly) managed by BFF
- Application Insights integration for telemetry
- Docker multi-stage build: Node.js build → Nginx for production serving
- `docker-entrypoint.sh` injects runtime environment variables for Nginx

## Security Rules

- Never embed API keys or secrets in source code or build artifacts
- All API calls MUST go through Web BFF — never call microservices directly from the browser
- Use `httpOnly` cookies for JWT token storage (managed by Web BFF) — never store JWTs in localStorage
- Validate all form inputs before submission
- Sanitize user-provided data before rendering to prevent XSS
- Protect cart and order operations: enforce authentication before proceeding

## Error Handling

- Use React Error Boundaries for unexpected component errors
- Display user-friendly error messages via toast notifications (`react-toastify`)
- Never expose raw API error details or stack traces in the UI
- Handle 401 responses by redirecting to login
- Handle network failures with a retry prompt or fallback UI

## Logging Rules

- Use **Azure Application Insights** SDK for telemetry
- Track page views, user actions, and exceptions
- Never log JWT tokens or sensitive user data to Application Insights
- Include correlation IDs in custom telemetry events for tracing

## Testing Requirements

- All new components MUST have unit tests
- Use **React Testing Library** + **Jest** (via react-scripts) as the test framework
- Use **Playwright** for end-to-end tests
- Mock API service calls in component unit tests
- Do NOT call real Web BFF in unit tests
- Run: `npm test` (unit), `npm run test:e2e` (end-to-end)

## Non-Goals

- This app is NOT responsible for business logic — it delegates all operations to Web BFF
- This app does NOT store or manage data locally (no local database)
- This app does NOT issue JWT tokens — authentication handled by auth-service via Web BFF
- This app does NOT communicate directly with microservices

## Environment Variables

```
PORT=3000
REACT_APP_API_URL=http://localhost:8014
REACT_APP_APPINSIGHTS_CONNECTION_STRING=<optional>
```

## Common Commands

```bash
npm start              # Dev server (port 3000)
npm run build          # Production build
npm test               # Unit tests
npm run test:e2e       # Playwright E2E tests
npm run lint           # ESLint
npm run format         # Prettier
```
