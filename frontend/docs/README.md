# Frontend Documentation

This directory contains technical documentation for the frontend React application.

## Architecture Decision Records (ADRs)

ADRs document important architectural decisions made during development:

- [ADR-001: Authentication State Management](./adr/001-authentication-state-management.md) - Decision to use React Context for state management and hybrid token storage strategy

## Project Structure

```
src/
├── components/          # Reusable UI components (shadcn/ui)
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication provider component
│   └── auth.types.ts   # Authentication types and useAuth hook
├── hooks/              # Custom React hooks
│   ├── useMobile.ts    # Mobile device detection
│   └── useAuthMutations.ts # Authentication API mutations
├── services/           # API service layers
│   └── auth-api.ts     # Authentication API client
├── utils/              # Utility functions
│   └── jwt.ts          # JWT token handling
└── views/              # Atomic design structure
    ├── atoms/          # Basic UI elements (Logo, etc.)
    ├── components/     # Composed components (Header, etc.)
    └── containers/     # Page-level containers
```

## Mobile Responsiveness

The application includes responsive design features:

- **`useMobile()` hook**: Detects mobile devices using `window.matchMedia`
- **Responsive forms**: Authentication forms adapt to mobile/desktop screen sizes
- **Touch-friendly UI**: Larger touch targets and optimized spacing on mobile
- **Performance optimized**: Uses MediaQuery API for efficient screen size detection

## Key Technologies

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **TanStack Query** for server state
- **Vitest** for testing
- **shadcn/ui** component library

## Security Considerations

- Access tokens stored in memory only
- Refresh tokens handled via HttpOnly cookies
- Automatic token refresh on API calls
- XSS and CSRF protection measures