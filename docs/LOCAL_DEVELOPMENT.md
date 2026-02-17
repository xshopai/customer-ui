# Customer UI - Local Development Guide

This guide covers setting up and running the Customer UI locally for development.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/xshopai/customer-ui.git
cd customer-ui

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Start development server
npm start
```

The app will be available at http://localhost:3000

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- npm 9+ installed
- Web BFF running (for API calls)

See [PREREQUISITES.md](PREREQUISITES.md) for detailed requirements.

## Environment Configuration

### Development Environment (.env)

Create a `.env` file in the project root:

```env
# Development Environment
PORT=3000
REACT_APP_BFF_URL=http://localhost:8014
```

### Environment Variables

| Variable            | Default                 | Description             |
| ------------------- | ----------------------- | ----------------------- |
| `PORT`              | `3000`                  | Development server port |
| `REACT_APP_BFF_URL` | `http://localhost:8014` | Web BFF URL             |

## Development Server

### Starting the Server

```bash
# Start with hot reload
npm start

# The app opens automatically at http://localhost:3000
```

### Development Features

- **Hot Reload:** Changes reflect immediately without manual refresh
- **ESLint:** Real-time linting errors in console
- **Source Maps:** Full debugging support in browser DevTools
- **React DevTools:** Component inspection and profiling

## Project Structure

```
customer-ui/
├── public/                 # Static files
│   ├── index.html         # HTML template
│   └── favicon.ico        # App icon
├── src/
│   ├── api/               # API client and endpoints
│   │   ├── bffClient.js   # Axios instance with interceptors
│   │   └── endpoints.js   # API endpoint definitions
│   ├── components/        # Reusable components
│   │   ├── cart/          # Cart components
│   │   ├── home/          # Homepage components
│   │   ├── layout/        # Layout (Header, Footer)
│   │   └── ui/            # Generic UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   ├── store/             # State management
│   │   ├── authStore.js   # Zustand auth store
│   │   └── slices/        # Redux slices
│   ├── utils/             # Utilities
│   ├── App.jsx            # Root component
│   └── index.js           # Entry point
├── .env                   # Environment variables
├── package.json           # Dependencies
└── tailwind.config.js     # Tailwind configuration
```

## Running with Backend Services

### Option 1: Connect to Local Web BFF

```bash
# Terminal 1: Start Web BFF (from web-bff directory)
cd ../web-bff
npm run dev

# Terminal 2: Start Customer UI
cd ../customer-ui
npm start
```

### Option 2: Connect to Remote BFF

Update `.env` to point to a remote BFF:

```env
REACT_APP_BFF_URL=https://web-bff.your-domain.com
```

### Option 3: Mock Data (Offline Development)

The app includes mock data in `src/data/` for basic offline development. Some features work without backend:

- Homepage with static products
- Product listing (static)
- Basic UI navigation

## Available Scripts

| Command            | Description               |
| ------------------ | ------------------------- |
| `npm start`        | Start development server  |
| `npm run build`    | Create production build   |
| `npm test`         | Run unit tests            |
| `npm run lint`     | Run ESLint                |
| `npm run lint:fix` | Fix linting issues        |
| `npm run format`   | Format code with Prettier |

## Development Workflow

### 1. Create a New Component

```bash
# Create component file
# src/components/products/ProductCard.jsx
```

```jsx
import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <img src={product.image} alt={product.name} />
      <h3 className="font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price}</p>
    </div>
  );
};

export default ProductCard;
```

### 2. Create a New Page

```jsx
// src/pages/NewPage.jsx
import React from 'react';
import Layout from '../components/layout/Layout';

const NewPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">New Page</h1>
      </div>
    </Layout>
  );
};

export default NewPage;
```

Add route in `App.jsx`:

```jsx
<Route path="/new-page" element={<NewPage />} />
```

### 3. Add API Call

```jsx
import { useQuery } from '@tanstack/react-query';
import bffClient from '../api/bffClient';
import { API_ENDPOINTS } from '../api/endpoints';

const MyComponent = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => bffClient.get(API_ENDPOINTS.PRODUCTS.LIST).then(r => r.data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
};
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ProductCard.test.jsx
```

### Test Example

```jsx
// src/components/products/ProductCard.test.jsx
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

test('renders product name', () => {
  const product = { name: 'Test Product', price: 29.99, image: '/test.jpg' };
  render(<ProductCard product={product} />);
  expect(screen.getByText('Test Product')).toBeInTheDocument();
});
```

## Styling with Tailwind CSS

### Tailwind Configuration

The project uses Tailwind CSS with a custom purple theme. See `tailwind.config.js`:

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          // ... purple scale
          900: '#4c1d95',
        },
      },
    },
  },
};
```

### Using Tailwind Classes

```jsx
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">
  Click Me
</button>
```

## Debugging

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Use React DevTools tab for component inspection
3. Use Network tab to monitor API calls
4. Use Console for errors and logs

### VS Code Debugging

1. Install "Debugger for Chrome" extension
2. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

3. Set breakpoints and press F5

## Common Issues

### API Connection Refused

```
Error: Network Error - Unable to connect to server
```

**Solution:** Ensure Web BFF is running on the configured URL.

### Port 3000 Already in Use

```bash
# Find and kill process
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Or use a different port
PORT=3001 npm start
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tailwind Styles Not Applying

```bash
# Restart dev server after tailwind.config.js changes
npm start
```

## Docker Development

### Build Development Image

```bash
docker build --target development -t customer-ui:dev .
```

### Run with Volume Mount

```bash
docker run -it -p 3000:3000 -v $(pwd)/src:/app/src customer-ui:dev
```

---

**Next Steps:**

- See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- See [ACA_DEPLOYMENT.md](ACA_DEPLOYMENT.md) for cloud deployment
