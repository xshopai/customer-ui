# Copilot Coding Agent Instructions for xshopai/customer-ui

## Project Overview

- **Type:** React SPA with functional components and hooks
- **Styling:** Tailwind CSS with custom purple theme and dark mode (`darkMode: 'class'`)
- **State Management:** Hybrid - Redux Toolkit + Zustand + React Query
  - Redux: Cart, user profile, orders (`src/store/slices/`)
  - Zustand: Authentication state (`src/store/authStore.js`)
  - React Query: Server state and caching with 5min stale time
- **API Layer:** Centralized BFF client with JWT auth and token refresh (`src/api/bffClient.js`)

## Critical Architecture Patterns

### State Management Layering

- **Redux (RTK):** Domain state (cart, orders, user profile)
- **Zustand:** Authentication state with localStorage persistence
- **React Query:** Server state, caching, and async operations
- **Context:** Only for theming (`ThemeContext.js`)

### Authentication Flow

- JWT with refresh tokens via `bffClient.js` interceptors
- Zustand store (`authStore.js`) manages auth state + localStorage
- `useAuth.js` hook provides mutations for login/register/logout
- Auto token refresh on 401 with retry logic
- Cart transfer on login (guest → authenticated user)

### API Client Architecture

- Single `bffClient.js` with request/response interceptors
- Correlation IDs for request tracing (`x-correlation-id`)
- Automatic JWT injection and refresh handling
- Network error enhancement and logging

### Component Organization

- Feature-based folders: `components/{cart,home,layout,ui}/`
- Pages in `src/pages/` map 1:1 to routes
- `ProtectedRoute.jsx` wrapper for auth-required pages
- Layout component handles cart sidebar state

## Key Conventions

### Routing Patterns

```text
/:department → ProductListPage
/:department/:category → ProductListPage
/:department/:category/:subcategory → ProductListPage
```

Single component handles hierarchical product filtering via URL params.

### Error Handling

- `ErrorBoundary.jsx` at app root
- `bffClient.js` enhances errors with backend messages
- React Query mutations handle async errors
- Toast notifications via react-toastify

### Development Workflow

```bash
npm start          # Dev server (React scripts)
npm run build      # Production build
npm run lint       # ESLint checking
npm run lint:fix   # Auto-fix linting issues
npm run format     # Prettier formatting
```

## Integration Points

### State Initialization

- `Layout.jsx` fetches cart on mount and auth change
- `useAuth.js` handles user data fetching only when authenticated
- Cart state persists across auth transitions

### Mock Data Strategy

- Static data in `src/data/` for products, orders, reviews
- BFF client points to `process.env.REACT_APP_BFF_URL` or localhost:8014
- Easy swap to real backend by changing BFF URL

## Examples

**Add authenticated page:**

```jsx
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

**API call with React Query:**

```jsx
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: () => bffClient.get('/api/products').then(r => r.data),
});
```

**Access auth state:**

```jsx
const { user, isAuthenticated } = useAuthStore();
const { loginAsync } = useAuth();
```

## Critical Files

- `src/App.jsx` — Provider setup and routing
- `src/api/bffClient.js` — HTTP client with auth interceptors
- `src/store/authStore.js` — Zustand auth store
- `src/hooks/useAuth.js` — Auth mutations and queries
- `src/components/layout/Layout.jsx` — App shell with cart state
