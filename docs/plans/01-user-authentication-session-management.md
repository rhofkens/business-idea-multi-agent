# Increment 1: User Authentication & Session Management

## Detailed Scope

### Features to Implement:
1. **Fastify Server Setup with Session Plugin**
   - Configure Fastify server in the @business-idea/core package
   - Install and configure @fastify/secure-session or @fastify/session plugin
   - Set up session storage configuration (in-memory for initial implementation)
   - Configure CORS to allow credentials from the React frontend

2. **In-Memory User Store**
   - Create a simple in-memory user store with predefined test users
   - Implement user data structure: { id, username, password (hashed), email, role }
   - Create initial test users: admin, regular user, guest
   - Use bcrypt for password hashing (as shown in Fastify ecosystem)

3. **Authentication API Endpoints**
   - POST /api/auth/login - Authenticate user and create session
   - POST /api/auth/logout - Destroy session
   - GET /api/auth/session - Get current session/user info
   - Implement request validation using Fastify schemas

4. **Session Management Middleware**
   - Create authentication middleware to protect routes
   - Implement session validation and renewal logic
   - Handle session expiration gracefully
   - Add session data to request context for downstream use

5. **React Authentication Context**
   - Create AuthContext and AuthProvider in @business-idea/web
   - Implement login/logout functions that call API endpoints
   - Manage authentication state (user, isAuthenticated, isLoading)
   - Create useAuth hook for components
   - Handle session persistence across page refreshes

6. **Login UI Component**
   - Create login form using shadcn/ui components
   - Implement form validation
   - Show loading states during authentication
   - Display error messages for failed login attempts
   - Redirect to main app after successful login

### Explicitly Excluded:
- Database integration (using in-memory store only)
- Password reset functionality
- User registration/signup
- OAuth/SSO integration
- Remember me functionality
- Multi-factor authentication
- User profile management

## Detailed Acceptance Criteria

1. **Server Configuration**
   - [ ] Fastify server starts successfully with session plugin configured
   - [ ] Sessions are stored in-memory and persist during server runtime
   - [ ] CORS is properly configured to accept credentials from localhost:5173
   - [ ] Server logs session creation/destruction events

2. **Authentication Endpoints**
   - [ ] POST /api/auth/login accepts username/password and returns session cookie
   - [ ] Invalid credentials return 401 with appropriate error message
   - [ ] POST /api/auth/logout destroys session and clears cookie
   - [ ] GET /api/auth/session returns current user data when authenticated
   - [ ] GET /api/auth/session returns 401 when not authenticated
   - [ ] All endpoints have proper TypeScript types and validation schemas

3. **Session Security**
   - [ ] Sessions expire after configured timeout (default: 30 minutes)
   - [ ] Session cookies are httpOnly and secure (in production)
   - [ ] Passwords are properly hashed using bcrypt
   - [ ] Session IDs are cryptographically secure

4. **React Integration**
   - [ ] AuthContext provides user state to entire application
   - [ ] Login form successfully authenticates users
   - [ ] Logout button clears session and redirects to login
   - [ ] Protected routes redirect to login when not authenticated
   - [ ] Session persists across page refreshes
   - [ ] Loading states shown during authentication operations

5. **User Experience**
   - [ ] Login form shows validation errors for empty fields
   - [ ] Error messages displayed for incorrect credentials
   - [ ] Successful login redirects to main application
   - [ ] User can see their username in the UI when logged in
   - [ ] Logout is accessible from any page

6. **Testing Requirements**
   - [ ] Can login with test user credentials (admin/admin123, user/user123)
   - [ ] Cannot access protected routes without authentication
   - [ ] Session timeout works as expected
   - [ ] Multiple concurrent sessions are handled correctly

## Detailed Documentation Tasks

1. **API Documentation**
   - Create `docs/api/authentication.md` with:
     - Endpoint specifications (request/response formats)
     - Authentication flow diagram
     - Session management details
     - Example cURL commands for testing

2. **Implementation Guide**
   - Update `docs/implementation/setup.md` with:
     - Fastify session plugin configuration
     - Environment variables for session secrets
     - CORS setup for local development

3. **Frontend Documentation**
   - Create `docs/frontend/authentication.md` with:
     - AuthContext usage examples
     - Protected route implementation
     - useAuth hook documentation
     - Login form component props

4. **Security Guidelines**
   - Create `docs/security/session-management.md` with:
     - Session security best practices
     - Production deployment considerations
     - Session configuration options
     - Future enhancements (database storage, Redis)

5. **Code Comments**
   - Add JSDoc comments to all authentication-related functions
   - Document session configuration options
   - Explain security decisions in code comments