# Authentication API Reference

## TypeScript Types

```typescript
// User object
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

// Login request
interface LoginRequest {
  email: string;
  password: string;
}

// API Responses
interface LoginResponse extends User {}

interface LogoutResponse {
  message: string;
}

interface UserResponse extends User {}

interface CheckResponse {
  authenticated: boolean;
}

interface ErrorResponse {
  error?: string;
  statusCode?: number;
  message?: string;
}
```

## Authentication Endpoints

### Login

```typescript
POST /api/auth/login
Content-Type: application/json

Request:
{
  email: string;    // Required, valid email format
  password: string; // Required, min length: 6
}

Success Response: 200 OK
{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

Error Responses:
- 400 Bad Request: Invalid request body
- 401 Unauthorized: Invalid credentials
```

**Implementation Example**:
```typescript
// Frontend
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Adm!nP@ss2024'
  })
});

const user = await response.json();

// Backend route handler
fastify.post<{ Body: LoginRequest }>('/login', {
  schema: {
    body: LoginSchema
  }
}, async (request, reply) => {
  const { email, password } = request.body;
  const user = await validateUser(email, password);
  
  if (!user) {
    return reply.code(401).send({ error: 'Invalid email or password' });
  }
  
  request.session.userId = user.id;
  request.session.userRole = user.role;
  
  return reply.send(user);
});
```

### Logout

```typescript
POST /api/auth/logout

Success Response: 200 OK
{
  message: 'Logged out successfully';
}
```

**Implementation Example**:
```typescript
// Frontend
const response = await fetch('http://localhost:3001/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

// Backend route handler
fastify.post('/logout', async (request, reply) => {
  request.session.destroy();
  return reply.send({ message: 'Logged out successfully' });
});
```

### Get Current User

```typescript
GET /api/auth/user

Success Response: 200 OK
{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

Error Response:
- 401 Unauthorized: Not authenticated
```

**Implementation Example**:
```typescript
// Frontend
const response = await fetch('http://localhost:3001/api/auth/user', {
  credentials: 'include'
});

if (response.ok) {
  const user = await response.json();
  // User is authenticated
} else {
  // User is not authenticated
}

// Backend route handler
fastify.get('/user', {
  preHandler: requireAuth
}, async (request, reply) => {
  const user = getUserById(request.session.userId);
  if (!user) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }
  return reply.send(user);
});
```

### Check Authentication Status

```typescript
GET /api/auth/check

Success Response: 200 OK
{
  authenticated: true;
}

Error Response: 401 Unauthorized
{
  authenticated: false;
}
```

**Implementation Example**:
```typescript
// Frontend - Quick auth check
const response = await fetch('http://localhost:3001/api/auth/check', {
  credentials: 'include'
});

const { authenticated } = await response.json();

// Backend route handler
fastify.get('/check', async (request, reply) => {
  if (request.session.userId) {
    return reply.send({ authenticated: true });
  }
  return reply.code(401).send({ authenticated: false });
});
```

## Middleware Functions

### requireAuth

Ensures the user is authenticated before accessing the route.

```typescript
const requireAuth: FastifyRequest = async (request, reply) => {
  if (!request.session.userId) {
    reply.code(401).send({ error: 'Not authenticated' });
  }
};

// Usage
fastify.get('/protected', {
  preHandler: requireAuth
}, handler);
```

### requireRole

Ensures the user has the required role.

```typescript
const requireRole = (role: UserRole) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.session.userId) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
    
    if (request.session.userRole !== role) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
};

// Usage
fastify.get('/admin', {
  preHandler: requireRole('admin')
}, handler);
```

## Session Configuration

```typescript
// Fastify session plugin configuration
await fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1800000 // 30 minutes
  },
  rolling: true // Reset expiry on activity
});
```

## Frontend Integration

### React Context

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Routes

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

## Error Handling

### Backend Error Handler

```typescript
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message
    });
  }

  fastify.log.error(error);
  reply.code(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An internal server error occurred'
  });
});
```

### Frontend Error Handling

```typescript
class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

const handleAuthError = (error: unknown) => {
  if (error instanceof AuthError) {
    switch (error.statusCode) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Show permission denied message
        toast.error('You do not have permission to access this resource');
        break;
      default:
        // Show generic error
        toast.error(error.message);
    }
  }
};
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with a salt rounds of 10
2. **Session Security**: Sessions use httpOnly cookies to prevent XSS attacks
3. **CORS**: Configured to only accept requests from the frontend origin
4. **CSRF Protection**: Using sameSite cookies for basic CSRF protection
5. **Environment Variables**: Sensitive configuration stored in environment variables

## Testing

### Backend Testing Example

```typescript
import { test } from 'tap';
import { build } from './app';

test('POST /api/auth/login', async (t) => {
  const app = build();
  
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: 'admin@test.com',
      password: 'Adm!nP@ss2024'
    }
  });
  
  t.equal(response.statusCode, 200);
  t.match(response.json(), {
    id: String,
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin'
  });
});
```

### Frontend Testing Example

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from './AuthContext';

test('login updates user state', async () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
  const { result } = renderHook(() => useAuth(), { wrapper });
  
  await act(async () => {
    await result.current.login('admin@test.com', 'Adm!nP@ss2024');
  });
  
  expect(result.current.user).toEqual({
    id: expect.any(String),
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin'
  });
});