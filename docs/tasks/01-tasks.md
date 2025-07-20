# Task List: User Authentication & Session Management

## Overview
This task list details the implementation steps for the User Authentication & Session Management feature as defined in `docs/plans/01-user-authentication-session-management.md`. The implementation follows the architecture guidelines and ADR 001 (Fastify Session Plugin Choice).

## Prerequisites
- Ensure the monorepo structure is set up with `@business-idea/core` and `@business-idea/web` packages
- Node.js LTS (v22.x) installed
- All dependencies from the root package.json installed

## Task List

### 1. Backend - Fastify Server Setup with Session Plugin

#### 1.1 Install Required Dependencies
- [ ] In `packages/core`, install: `fastify`, `@fastify/session`, `@fastify/cookie`, `@fastify/cors`
- [ ] Install security dependencies: `bcrypt`, `@types/bcrypt`
- [ ] Install type definitions: `@types/node`

#### 1.2 Create Fastify Server Instance
- [ ] Create `packages/core/src/server/fastify-server.ts`
- [ ] Initialize Fastify with logging enabled
- [ ] Register `@fastify/cookie` plugin (required by session plugin)
- [ ] Register `@fastify/session` plugin with in-memory store configuration:
  - Cookie name: `sessionId`
  - Cookie options: httpOnly: true, secure: false (dev), sameSite: 'lax'
  - Secret: Read from environment variable `SESSION_SECRET`
  - Session expiry: 30 minutes (1800000 ms)
- [ ] Register `@fastify/cors` plugin with configuration:
  - Origin: `http://localhost:5173` (React dev server)
  - Credentials: true

#### 1.3 Environment Configuration
- [ ] Update `.env.example` with:
  - `SESSION_SECRET=your-super-secret-session-key-min-32-chars`
  - `PORT=4000`
  - `NODE_ENV=development`
- [ ] Create `.env` file with actual values (ensure it's in .gitignore)
- [ ] Update `packages/core/src/services/config-service.ts` to include session configuration

### 2. Backend - In-Memory User Store

#### 2.1 Create User Types and Interfaces
- [ ] Create `packages/shared/src/types/user.ts` with:
  - `User` interface: { id: string, username: string, passwordHash: string, email: string, role: 'admin' | 'user' | 'guest' }
  - `UserCredentials` interface: { username: string, password: string }
  - Export these types from `packages/shared/src/types/index.ts`

#### 2.2 Implement In-Memory User Store
- [ ] Create `packages/core/src/services/user-store.ts`
- [ ] Implement singleton pattern for UserStore class
- [ ] Create Map<string, User> for user storage
- [ ] Add methods:
  - `findByUsername(username: string): User | null`
  - `findById(id: string): User | null`
  - `validateCredentials(username: string, password: string): Promise<User | null>`
- [ ] Initialize with test users:
  - admin: { username: 'admin', password: 'admin123', email: 'admin@test.com', role: 'admin' }
  - user: { username: 'user', password: 'user123', email: 'user@test.com', role: 'user' }
  - guest: { username: 'guest', password: 'guest123', email: 'guest@test.com', role: 'guest' }
- [ ] Hash all passwords using bcrypt with salt rounds of 10

### 3. Backend - Authentication API Endpoints

#### 3.1 Create Authentication Schemas
- [ ] Create `packages/core/src/schemas/auth-schemas.ts` using Zod:
  - Login request schema: { username: string, password: string }
  - Login response schema: { success: boolean, user?: UserInfo }
  - Session response schema: { authenticated: boolean, user?: UserInfo }
  - UserInfo type: { id: string, username: string, email: string, role: string }

#### 3.2 Implement Authentication Routes
- [ ] Create `packages/core/src/routes/auth-routes.ts`
- [ ] Implement POST `/api/auth/login`:
  - Validate request body against login schema
  - Check credentials using UserStore
  - Create session on success
  - Store user info in session (exclude password hash)
  - Return user info and success status
  - Return 401 with error message on failure
- [ ] Implement POST `/api/auth/logout`:
  - Destroy session
  - Clear session cookie
  - Return success status
- [ ] Implement GET `/api/auth/session`:
  - Check if session exists and is valid
  - Return user info if authenticated
  - Return 401 if not authenticated

#### 3.3 Register Routes
- [ ] Create `packages/core/src/routes/index.ts` to aggregate all routes
- [ ] Register auth routes in the Fastify server

### 4. Backend - Session Management Middleware

#### 4.1 Create Authentication Middleware
- [ ] Create `packages/core/src/middleware/auth-middleware.ts`
- [ ] Implement `requireAuth` hook:
  - Check if session exists
  - Validate session hasn't expired
  - Add user to request context
  - Return 401 if not authenticated
- [ ] Implement `optionalAuth` hook:
  - Same as requireAuth but doesn't return 401
  - Sets `request.user` to null if not authenticated

#### 4.2 Session Management Utilities
- [ ] Create `packages/core/src/utils/session-utils.ts`
- [ ] Implement session renewal logic (extend expiry on activity)
- [ ] Implement session cleanup scheduler (runs every hour)
- [ ] Add session logging for debugging

### 5. Backend - Server Integration

#### 5.1 Update Main Server Entry
- [ ] Create `packages/core/src/server/index.ts` as the main server entry
- [ ] Initialize Fastify server with all plugins and routes
- [ ] Add graceful shutdown handling
- [ ] Export server instance for testing

#### 5.2 Update Package Scripts
- [ ] Update `packages/core/package.json` scripts:
  - Add `"dev:server": "tsx watch src/server/index.ts"`
  - Add `"build:server": "tsc"`
  - Update main entry to point to server

### 6. Frontend - React Authentication Context

#### 6.1 Create Authentication Types
- [ ] Create `packages/web/src/types/auth.ts`:
  - Import User types from @business-idea/shared
  - Define AuthState interface
  - Define AuthContextType interface

#### 6.2 Implement Auth Context and Provider
- [ ] Create `packages/web/src/contexts/AuthContext.tsx`
- [ ] Create AuthContext with default values
- [ ] Implement AuthProvider component:
  - State: user, isAuthenticated, isLoading
  - Methods: login, logout, checkSession
  - Use fetch API for backend communication
  - Handle session persistence on mount
  - Provide context value to children

#### 6.3 Create useAuth Hook
- [ ] Create `packages/web/src/hooks/useAuth.ts`
- [ ] Export custom hook that uses AuthContext
- [ ] Add error handling for missing provider

### 7. Frontend - API Client Setup

#### 7.1 Create API Client
- [ ] Create `packages/web/src/lib/api-client.ts`
- [ ] Configure base URL from environment
- [ ] Set up fetch wrapper with:
  - Credentials: 'include' for cookies
  - Content-Type: 'application/json'
  - Error handling
  - Response parsing

#### 7.2 Create Auth API Functions
- [ ] Create `packages/web/src/api/auth.ts`
- [ ] Implement:
  - `login(credentials: UserCredentials): Promise<LoginResponse>`
  - `logout(): Promise<void>`
  - `getSession(): Promise<SessionResponse>`

### 8. Frontend - Login UI Component

#### 8.1 Create Login Form Component
- [ ] Create `packages/web/src/components/LoginForm.tsx`
- [ ] Use shadcn/ui components:
  - Card for container
  - Input for username/password fields
  - Button for submit
  - Label for field labels
- [ ] Implement form with:
  - Controlled inputs for username and password
  - Form validation (required fields)
  - Loading state during submission
  - Error message display
  - onSuccess callback prop

#### 8.2 Create Protected Route Component
- [ ] Create `packages/web/src/components/ProtectedRoute.tsx`
- [ ] Check authentication status
- [ ] Redirect to login if not authenticated
- [ ] Show loading state while checking auth
- [ ] Render children if authenticated

#### 8.3 Update App Layout
- [ ] Update `packages/web/src/App.tsx`:
  - Wrap app with AuthProvider
  - Add login route
  - Implement logout button in header when authenticated
  - Show username when logged in

### 9. Testing Setup

#### 9.1 Manual Testing Checklist
- [ ] Create `docs/testing/auth-testing-checklist.md`
- [ ] Include test scenarios:
  - Login with valid credentials (all test users)
  - Login with invalid credentials
  - Session persistence across page refresh
  - Logout functionality
  - Protected route access
  - Session timeout behavior
  - Concurrent session handling

#### 9.2 Development Testing Utilities
- [ ] Create `packages/core/src/utils/test-auth.ts`
- [ ] Add helper to create test sessions
- [ ] Add helper to clear all sessions
- [ ] Add session debugging endpoints (dev only)

### 10. CI/CD Configuration Updates

#### 10.1 GitHub Actions Workflow
- [ ] Update `.github/workflows/ci.yml` to support monorepo structure:
  - Add workspace caching strategy for npm dependencies
  - Configure matrix build for multiple packages
  - Update install command to use npm workspaces
  - Add separate build steps for each package:
    - Build @business-idea/shared first (dependency)
    - Build @business-idea/core (depends on shared)
    - Build @business-idea/web (depends on both shared and core)
  - Update lint command to run across all packages
  - Add environment variables for monorepo paths
  - Ensure proper build order based on package dependencies
  - Add job dependencies to enforce build order

#### 10.2 CI Environment Configuration
- [ ] Add Node.js workspace configuration checks
- [ ] Ensure npm version supports workspaces (npm 7+)
- [ ] Add package-specific build status badges
- [ ] Configure build artifacts for web package deployment

### 11. Documentation

#### 11.1 API Documentation
- [ ] Create `docs/api/authentication.md` with:
  - Endpoint specifications (request/response formats)
  - Authentication flow diagram (using mermaid)
  - Session management details
  - Example cURL commands for each endpoint

#### 11.2 Comprehensive Authentication Guide
- [ ] Create `docs/guides/authentication-implementation.md` with:
  - **Backend Implementation**
    - Fastify session plugin configuration details
    - Required environment variables
    - CORS setup for local development
    - Session configuration options explained
    - Troubleshooting common backend issues
  - **Frontend Implementation**
    - AuthContext usage examples
    - Protected route implementation guide
    - useAuth hook API documentation
    - LoginForm component props and usage
  - **Security Considerations**
    - Session security best practices implemented
    - Production deployment considerations
    - httpOnly cookie configuration
    - Password hashing with bcrypt
  - **Development and Testing**
    - Local development setup guide
    - Manual testing procedures
    - Common issues and solutions
  - **Future Enhancements**
    - Redis session store migration path
    - Database-backed user authentication
    - JWT token consideration

#### 11.3 Code Comments
- [ ] Add JSDoc comments to all authentication functions
- [ ] Document session configuration options in code
- [ ] Add inline comments explaining security decisions
- [ ] Document test user credentials in code

### 12. Integration Verification

#### 12.1 End-to-End Flow Testing
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Verify login flow works completely
- [ ] Verify session sharing between HTTP and future WebSocket
- [ ] Test all error scenarios

#### 12.2 Configuration Verification
- [ ] Ensure all environment variables are documented
- [ ] Verify CORS settings work correctly
- [ ] Test session timeout behavior
- [ ] Verify secure cookie settings for production

## Completion Checklist

Before marking this increment as complete, ensure:
- [ ] All test users can log in successfully
- [ ] Sessions persist across page refreshes
- [ ] Logout clears session properly
- [ ] Protected routes redirect when not authenticated
- [ ] All API endpoints return correct status codes
- [ ] Session timeout works as configured (30 minutes)
- [ ] All documentation tasks are complete
- [ ] Code follows TypeScript strict mode
- [ ] No ESLint errors
- [ ] Manual testing checklist is complete

## Notes

- This implementation uses in-memory storage for Phase 1. Sessions will be lost on server restart.
- The session secret must be at least 32 characters for security.
- Passwords are hashed using bcrypt with 10 salt rounds.
- CORS is configured for local development only; production will need different settings.
- All sensitive operations should log for debugging purposes in development mode.