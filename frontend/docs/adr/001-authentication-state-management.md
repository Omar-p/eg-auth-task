# ADR-001: Authentication State Management with React Context

## Status
Accepted

## Context

We need to implement authentication state management for our React application, including handling access tokens and refresh tokens. The main considerations are:

1. **State Management Approach**: Choose between React Context, Redux, Zustand, or other state management solutions
2. **Token Storage Strategy**: Decide where and how to store access tokens and refresh tokens
3. **Security Requirements**: Implement industry-standard security practices for token handling
4. **Simplicity vs Complexity**: Balance between robust functionality and maintainable code

## Decision

### State Management: React Context

We will use **React Context** with the `useState` and `useEffect` hooks for authentication state management instead of additional libraries like Redux or Zustand.

### Token Storage Strategy

We will implement a **hybrid token storage approach**:

1. **Access Tokens**: Stored in **memory only** (React state)
2. **Refresh Tokens**: Stored in **HttpOnly cookies** (managed by backend)
3. **User Data**: Stored in **localStorage** for persistence across browser sessions

## Rationale

### Why React Context over Redux/Zustand?

#### Advantages of React Context:
- **No additional dependencies**: Reduces bundle size and dependency management
- **Built-in to React**: Leverages React's native state management capabilities
- **Sufficient complexity**: Our authentication state is relatively simple (user, tokens, loading state)
- **Co-location**: State logic stays close to where it's used
- **Type safety**: Works seamlessly with TypeScript without additional setup

#### When React Context is appropriate:
- **Limited state complexity**: Authentication state has clear boundaries
- **Infrequent updates**: Authentication state doesn't change frequently
- **Single domain**: All authentication-related state in one context

### Token Storage Security Strategy

#### Access Tokens in Memory (React State)
```typescript
const [accessToken, setAccessToken] = useState<string | null>(null);
```

**Advantages:**
- **XSS Protection**: Cannot be accessed via `document.cookie` or localStorage
- **Automatic cleanup**: Cleared on page refresh/browser close
- **No persistence risk**: Cannot be stolen if device is compromised while offline

**Trade-offs:**
- **Lost on refresh**: Requires refresh token to obtain new access token
- **Memory only**: Must implement refresh logic on app initialization

#### Refresh Tokens in HttpOnly Cookies
```typescript
// Backend sets cookie
response.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Allows cross-subdomain for our architecture
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

**Advantages:**
- **XSS Protection**: JavaScript cannot access HttpOnly cookies
- **Automatic inclusion**: Browser sends cookie with matching requests
- **CSRF Protection**: SameSite=Lax provides protection
- **Secure transmission**: Secure flag ensures HTTPS-only transmission

#### User Data in localStorage
```typescript
localStorage.setItem('user_data', JSON.stringify(user));
```

**Rationale:**
- **Non-sensitive data**: Contains only user ID, name, and email
- **UI persistence**: Allows showing user info immediately on app load
- **Refresh token validation**: User presence indicates potential valid session

### Implementation Architecture

#### File Structure
```
src/contexts/
├── AuthContext.tsx  # React component (AuthProvider)
└── auth.types.ts    # Types, context, and useAuth hook
```

#### Type Definitions
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  getAccessToken: () => string | null;
}
```

#### Separation of Concerns
- **AuthContext.tsx**: Contains only the `AuthProvider` component for React Fast Refresh compatibility
- **auth.types.ts**: Contains TypeScript interfaces, context creation, and the `useAuth` hook
- **Imports**: Components import `useAuth` from `auth.types.ts` to avoid circular dependencies

#### Authentication Actions
Authentication actions (login, register) are handled by dedicated React Query mutation hooks rather than AuthContext methods:
- **useLoginMutation**: Handles login flow with React Query mutations
- **useRegisterMutation**: Handles registration flow with React Query mutations
- **AuthContext focus**: Limited to state management (user, loading, tokens, logout)
- **Benefits**: Better separation of concerns, improved error handling, optimistic updates

#### AuthAPI Integration
The AuthAPI singleton integrates with AuthContext for secure token management:
- **Token Access**: AuthContext provides token getter/setter methods to AuthAPI
- **Authorization Headers**: All authenticated requests include `Bearer {token}` headers
- **Automatic Refresh**: Failed 401 requests trigger token refresh and request retry
- **Error Handling**: Custom `HttpError` class preserves HTTP status codes for proper error handling

### Automatic Token Refresh Strategy

```typescript
useEffect(() => {
  const initializeAuth = async () => {
    const userData = localStorage.getItem('user_data');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Attempt to refresh access token using HttpOnly cookie
        const refreshResponse = await authAPI.refreshToken();
        setAccessToken(refreshResponse.accessToken);
      } catch (refreshError) {
        // Refresh failed, user needs to re-login
        console.log('Token refresh failed on app load');
      }
    }
    setIsLoading(false);
  };

  initializeAuth();
}, []);
```

### Request Interceptor with Automatic Refresh

```typescript
// AuthAPI integration with token management
class AuthAPI {
  private getAccessToken: () => string | null = () => null;
  private setAccessToken: (token: string | null) => void = () => {};

  setTokenGetter(getter: () => string | null) {
    this.getAccessToken = getter;
  }

  setTokenSetter(setter: (token: string | null) => void) {
    this.setAccessToken = setter;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const fetchWithToken = async (token: string | null) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return fetch(url, { ...options, headers, credentials: 'include' });
    };

    let response = await fetchWithToken(this.getAccessToken());

    // Handle 401 with auto-refresh (but not for auth endpoints)
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshPromise = this.attemptRefresh().finally(() => {
          this.isRefreshing = false;
          this.refreshPromise = null;
        });
      }

      const newToken = await this.refreshPromise;
      if (newToken) {
        response = await fetchWithToken(newToken);
      } else {
        this.setAccessToken(null);
        throw new HttpError('Session expired', 401);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new HttpError(error.message || `HTTP ${response.status}`, response.status);
    }

    return response.json();
  }
}

// AuthContext setup
useEffect(() => {
  authAPI.setTokenGetter(() => accessTokenRef.current);
  authAPI.setTokenSetter((token) => setAccessToken(token));
}, []);
```

## Consequences

### Positive Consequences

1. **Security First**: Industry-standard token storage approach
   - Access tokens in memory prevent XSS attacks
   - HttpOnly cookies prevent JavaScript access to refresh tokens
   - SameSite=Lax provides CSRF protection

2. **Simplicity**: No additional state management libraries
   - Reduced bundle size
   - Fewer dependencies to maintain
   - Native React approach

3. **User Experience**: Seamless token refresh
   - Automatic retry on 401 errors
   - User stays logged in across browser sessions
   - Graceful handling of expired tokens

4. **Developer Experience**: Clear patterns
   - Single source of truth for auth state
   - TypeScript support out of the box
   - Easy to test and mock

5. **Mobile Responsiveness**: Adaptive UI
   - `useMobile()` hook for responsive design
   - Touch-friendly authentication forms
   - Optimized for mobile user experience

6. **Robust Error Handling**: Custom HttpError class
   - Preserves HTTP status codes for proper error handling
   - Integrates with React Query retry logic
   - Prevents unnecessary retries on 4xx errors
   - Better debugging and monitoring capabilities

### Negative Consequences

1. **Re-renders**: Context changes cause re-renders of consumers
   - **Mitigation**: Optimize with React.memo where needed
   - **Assessment**: Minimal impact due to infrequent auth state changes

2. **Memory Loss**: Access tokens lost on page refresh
   - **Mitigation**: Automatic refresh on app initialization
   - **Assessment**: Acceptable trade-off for security

3. **Single Context**: All auth logic in one context
   - **Mitigation**: Context is focused and has clear boundaries
   - **Assessment**: Appropriate for authentication domain

### Alternative Approaches Considered

#### Redux Toolkit
- **Pros**: Powerful DevTools, Time-travel debugging, Mature ecosystem
- **Cons**: Additional complexity, Bundle size, Overkill for our use case
- **Decision**: Rejected due to unnecessary complexity

#### Zustand
- **Pros**: Smaller bundle, Simpler than Redux, Good TypeScript support
- **Cons**: Additional dependency, Learning curve, Not needed for our scope
- **Decision**: Rejected in favor of native React approach

#### All tokens in localStorage
- **Pros**: Persistent across sessions, Simple implementation
- **Cons**: **Major security vulnerability** to XSS attacks
- **Decision**: Rejected due to security risks

#### All tokens in memory
- **Pros**: Maximum security from XSS
- **Cons**: Poor user experience (login on every page refresh)
- **Decision**: Rejected due to UX impact

## Implementation Notes

### File Organization
- **Context Separation**: Split for React Fast Refresh compatibility
  - `AuthContext.tsx` exports only components (`AuthProvider`)
  - `auth.types.ts` exports types, context, and hooks (`useAuth`)
- **Import Pattern**: Components import `useAuth` from `auth.types.ts`
- **Type Safety**: All authentication types centralized in one location
- **AuthAPI Integration**: Singleton pattern with token access from AuthContext

### Error Handling Architecture
```typescript
export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// React Query integration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
          return false; // Don't retry 4xx errors
        }
        return failureCount < 3;
      },
    },
  },
});
```

### Mobile Responsiveness
- **`useMobile()` hook**: Uses `window.matchMedia` for performance
- **Responsive breakpoint**: 768px (matches Tailwind CSS)
- **Test environment**: Gracefully handles missing `matchMedia` in tests
- **UI Adaptation**: Forms, buttons, and spacing adapt to screen size

### Environment-Specific Configuration
- **Development**: SameSite=strict, Secure=false
- **Production**: SameSite=lax, Secure=true, Domain=.omarshabaan.tech

### Testing Strategy
- Mock the AuthContext in tests
- Test token refresh scenarios
- Test automatic logout on refresh failure
- Test cross-domain cookie behavior
- Test mobile hook with different screen sizes

### Monitoring and Logging
- Log authentication events (login, logout, token refresh)
- Monitor refresh token failure rates
- Track user session duration
- Monitor mobile vs desktop usage patterns

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 6749: OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [React Context Best Practices](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## Date
2025-01-09

## Authors
- Claude Code Assistant