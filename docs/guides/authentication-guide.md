# Authentication Implementation Guide

## Overview

The Business Idea Generator uses a session-based authentication system built with Fastify on the backend and React on the frontend. This guide covers the complete implementation details, security considerations, and best practices.

## Architecture

### Technology Stack

**Backend:**
- Fastify 5.x - Modern web framework
- @fastify/session - Session management plugin
- @fastify/cookie - Cookie parsing
- @fastify/cors - CORS handling
- bcrypt - Password hashing
- TypeBox - Schema validation

**Frontend:**
- React 18.x - UI framework
- React Router v6 - Client-side routing
- React Context API - State management
- Tailwind CSS - Styling
- shadcn/ui - Component library

### Session Flow

```
1. User Login
   ├── Frontend sends credentials to /api/auth/login
   ├── Backend validates credentials
   ├── Backend creates session and sets httpOnly cookie
   └── Frontend receives user data and updates context

2. Authenticated Requests
   ├── Browser automatically includes session cookie
   ├── Backend validates session on each request
   └── Backend extends session expiry (rolling sessions)

3. Logout
   ├── Frontend calls /api/auth/logout
   ├── Backend destroys session
   └── Frontend clears user context and redirects
```

## Backend Implementation

### 1. Session Configuration

```typescript
// packages/core/src/server.ts
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';

await fastify.register(fastifyCookie);
await fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  cookie: {
    httpOnly: true,        // Prevent XSS attacks
    secure: false,         // HTTPS only in production
    sameSite: 'lax',      // CSRF protection
    maxAge: 1800000       // 30 minutes
  },
  rolling: true           // Extend session on activity
});
```

### 2. TypeScript Session Types

```typescript
// packages/core/src/auth/types.ts
declare module 'fastify' {
  interface Session {
    userId?: string;
    userRole?: UserRole;
  }
}
```

### 3. User Store Implementation

```typescript
// packages/core/src/auth/user-store.ts
import bcrypt from 'bcrypt';
import { User } from '@business-idea/shared';

const SALT_ROUNDS = 10;

// In-memory store for development
const users = new Map<string, User & { passwordHash: string }>();

// Initialize test users
export async function initializeTestUsers() {
  const password = await bcrypt.hash('password123', SALT_ROUNDS);
  
  users.set('1', {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    passwordHash: password
  });
  
  // Add other test users...
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  const user = Array.from(users.values()).find(u => u.email === email);
  
  if (!user) return null;
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

### 4. Authentication Routes

```typescript
// packages/core/src/auth/auth-routes.ts
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { validateUser } from './user-store';

const LoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 })
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Login endpoint
  fastify.post<{ Body: LoginRequest }>('/login', {
    schema: {
      body: LoginSchema,
      response: {
        200: UserSchema,
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;
    
    const user = await validateUser(email, password);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }
    
    // Set session
    request.session.userId = user.id;
    request.session.userRole = user.role;
    
    return reply.send(user);
  });
  
  // Other endpoints...
};
```

### 5. Authentication Middleware

```typescript
// packages/core/src/auth/middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@business-idea/shared';

export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.session.userId) {
    reply.code(401).send({ error: 'Not authenticated' });
  }
};

export const requireRole = (role: UserRole) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.session.userId) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
    
    if (request.session.userRole !== role) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
};
```

## Frontend Implementation

### 1. Auth Context Setup

```typescript
// packages/web/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@business-idea/shared';
import * as authApi from '../lib/auth-api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const user = await authApi.login(email, password);
    setUser(user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. API Client Configuration

```typescript
// packages/web/src/lib/api-client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Request failed: ${response.statusText}`);
  }

  return response.json();
}
```

### 3. Protected Routes

```typescript
// packages/web/src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### 4. Login Form Component

```typescript
// packages/web/src/components/LoginForm.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};
```

## Security Best Practices

### 1. Password Security

- **Hashing**: Use bcrypt with 10 salt rounds
- **Minimum Length**: Enforce 6+ character passwords
- **Never Store Plain Text**: Always hash passwords before storage

### 2. Session Security

- **HttpOnly Cookies**: Prevent JavaScript access to session cookies
- **Secure Flag**: Use HTTPS in production
- **SameSite**: Set to 'lax' for CSRF protection
- **Rolling Sessions**: Extend expiry on activity
- **Session Secret**: Use strong, random secret in production

### 3. CORS Configuration

```typescript
await fastify.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});
```

### 4. Environment Variables

```bash
# .env
SESSION_SECRET=your-strong-random-secret-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### 5. Input Validation

- Use TypeBox schemas for all API inputs
- Validate email format
- Enforce password requirements
- Sanitize error messages (don't leak sensitive info)

## Testing Strategy

### Backend Testing

```typescript
// Test authentication flow
test('POST /api/auth/login - success', async (t) => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: 'admin@test.com',
      password: 'password123'
    }
  });
  
  t.equal(response.statusCode, 200);
  t.ok(response.headers['set-cookie']);
});

// Test protected endpoints
test('GET /api/auth/user - authenticated', async (t) => {
  // Login first
  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@test.com', password: 'password123' }
  });
  
  const cookie = loginResponse.headers['set-cookie'];
  
  // Access protected endpoint
  const response = await app.inject({
    method: 'GET',
    url: '/api/auth/user',
    headers: { cookie }
  });
  
  t.equal(response.statusCode, 200);
});
```

### Frontend Testing

```typescript
// Test login flow
test('login updates auth context', async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider
  });
  
  await act(async () => {
    await result.current.login('admin@test.com', 'password123');
  });
  
  expect(result.current.user).toBeTruthy();
  expect(result.current.user?.email).toBe('admin@test.com');
});

// Test protected routes
test('protected route redirects when not authenticated', () => {
  const { container } = render(
    <MemoryRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
  
  expect(container.textContent).toContain('Login Page');
});
```

## Deployment Considerations

### 1. Production Environment Variables

```bash
SESSION_SECRET=<generate-strong-random-secret>
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
PORT=3000
```

### 2. Session Store

Replace in-memory store with persistent storage:

```typescript
// Use Redis for production
import connectRedis from 'connect-redis';
import Redis from 'ioredis';

const RedisStore = connectRedis(fastifySession);
const redis = new Redis(process.env.REDIS_URL);

await fastify.register(fastifySession, {
  store: new RedisStore({ client: redis }),
  // ... other options
});
```

### 3. HTTPS Configuration

```typescript
// Enable secure cookies in production
cookie: {
  secure: process.env.NODE_ENV === 'production',
  // ... other options
}
```

### 4. Rate Limiting

Add rate limiting to prevent brute force attacks:

```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 5,
  timeWindow: '15 minutes',
  errorResponseBuilder: () => ({
    error: 'Too many login attempts. Please try again later.'
  })
});
```

## Troubleshooting

### Common Issues

1. **"Not authenticated" errors**
   - Check CORS configuration
   - Ensure `credentials: 'include'` in fetch requests
   - Verify cookie settings

2. **Session not persisting**
   - Check session secret is set
   - Verify cookie domain matches
   - Ensure httpOnly and secure flags are appropriate

3. **Login succeeds but user not set**
   - Check AuthContext provider wrapping
   - Verify API response format
   - Check for console errors

### Debug Checklist

1. **Backend Debugging**
   ```bash
   # Enable debug logging
   LOG_LEVEL=debug npm run dev
   ```

2. **Frontend Debugging**
   - Check Network tab for cookies
   - Verify API responses
   - Check React DevTools for context state

3. **Session Debugging**
   ```typescript
   // Add session logging
   fastify.addHook('onRequest', async (request) => {
     fastify.log.debug({ session: request.session }, 'Session state');
   });
   ```

## Next Steps

1. **Enhanced Security**
   - Implement CSRF tokens
   - Add two-factor authentication
   - Set up security headers

2. **User Management**
   - Add user registration
   - Implement password reset
   - Add email verification

3. **Production Readiness**
   - Set up Redis for sessions
   - Configure HTTPS
   - Add monitoring and logging

4. **Performance**
   - Implement caching strategies
   - Add request compression
   - Optimize session management