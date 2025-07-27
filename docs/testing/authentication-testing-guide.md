# Authentication System Testing Guide

This guide provides comprehensive testing procedures for the authentication system implemented in the business idea generator web application.

## Overview

The authentication system uses:
- **Backend**: Fastify server running on **port 3001** (provides API endpoints)
- **Frontend**: React app running on **port 5173** (Vite dev server)
- **Storage**: In-memory user store (test users only)
- **Sessions**: Server-side sessions with httpOnly cookies

### Architecture
- All authentication API endpoints (`/api/auth/*`) are served by the **backend** on port 3001
- The frontend React app communicates with the backend via HTTP requests
- Session cookies are managed by the backend server

## Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | Adm!nP@ss2024 | admin |
| user@test.com | Us3r$ecure#24 | user |
| guest@test.com | Gu3st!Pass@24 | guest |

## Automated Testing

### Backend Tests

Run backend tests from the core package:
```bash
cd packages/core
npm test
```

Expected test coverage:
- Authentication routes: 100%
- Session management: 100%
- User store operations: 100%
- Middleware functions: 100%

### Frontend Tests

Run frontend tests from the web package:
```bash
cd packages/web
npm test
```

Expected test coverage:
- AuthContext: 100%
- useAuth hook: 100%
- LoginForm component: 100%
- ProtectedRoute component: 100%

## Manual Testing Procedures

### 1. Environment Setup

```bash
# From project root
npm install
npm run build

# Terminal 1: Start backend server (Fastify on port 3001)
npm run start:core
# This starts the backend API server that handles authentication

# Terminal 2: Start frontend dev server (React on port 5173)
cd packages/web
npm run dev
# This starts the React development server
```

**Important:**
- Backend runs on: http://localhost:3001
- Frontend runs on: http://localhost:5173
- API endpoints are at: http://localhost:3001/api/auth/*

### 2. Authentication Flow Testing

#### A. Successful Login Flow

1. Open browser to http://localhost:5173 (frontend)
2. Should redirect to /login
3. Enter credentials:
   - Email: admin@test.com
   - Password: Adm!nP@ss2024
4. Click "Login"
   - This sends a POST request to http://localhost:3001/api/auth/login (backend)
5. Verify:
   - Redirected to home page
   - User email displayed
   - Role displayed
   - Logout button visible
   - Session cookie set from backend

#### B. Failed Login Scenarios

Test each scenario and verify appropriate error messages:

1. **Invalid Email Format**
   - Email: "notanemail"
   - Error: "Invalid email address"

2. **Empty Fields**
   - Leave email empty: "Email is required"
   - Leave password empty: "Password is required"

3. **Wrong Credentials**
   - Email: admin@test.com
   - Password: wrongpassword
   - Error: "Invalid credentials"

4. **Non-existent User**
   - Email: fake@test.com
   - Password: Adm!nP@ss2024
   - Error: "Invalid credentials"

### 3. Session Management Testing

#### A. Session Persistence

1. Login successfully
2. Refresh the page (F5)
3. Verify still logged in
4. Open new tab to same URL
5. Verify logged in there too

#### B. Session Expiry

1. Login successfully
2. Wait 31 minutes (or modify session timeout for testing)
3. Try to navigate
4. Should redirect to login

#### C. Logout Testing

1. Login successfully
2. Click logout button
3. Verify:
   - Redirected to login page
   - Cannot access home page
   - Session cookie removed

### 4. API Testing with cURL

All API requests go to the backend server on port 3001:

#### Login Request
```bash
# POST to backend API endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Adm!nP@ss2024"}' \
  -c cookies.txt -v
```

#### Check Authentication
```bash
curl http://localhost:3001/api/auth/check \
  -b cookies.txt
```

#### Get User Info
```bash
curl http://localhost:3001/api/auth/user \
  -b cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

### 5. Security Testing

#### A. Cookie Security
1. Login and inspect cookies in browser DevTools
2. Verify:
   - Cookie has httpOnly flag
   - Cookie has secure flag (in production)
   - SameSite attribute set

#### B. CORS Testing
1. Try to make API request from different origin
2. Verify CORS blocks unauthorized origins

#### C. Session Hijacking Prevention
1. Copy session cookie value
2. Use in different browser/incognito
3. Verify session isolation

### 6. Performance Testing

#### A. Login Response Time
- Target: < 200ms for login response
- Test with multiple concurrent logins

#### B. Session Lookup Performance
- Target: < 50ms for auth check
- Test with many active sessions

## Troubleshooting Common Issues

### Issue: "Cannot connect to server"
- Check backend is running on port 3001: `npm run start:core`
- Check frontend is running on port 5173: `cd packages/web && npm run dev`
- Verify no firewall blocking
- Check .env configuration
- Ensure you started BOTH servers (backend AND frontend)

### Issue: "CORS error"
- Verify frontend URL in CORS config
- Check origin header in requests

### Issue: "Session not persisting"
- Check cookie settings in browser
- Verify session store configuration
- Check for clock skew between client/server

### Issue: "Login always fails"
- Verify bcrypt is installed
- Check user store initialization
- Verify password hashing

## Development Tools

### Browser Extensions
- React Developer Tools - inspect auth context
- EditThisCookie - view/modify session cookies

### Debugging Sessions
```javascript
// Add to auth routes for debugging
fastify.get('/api/auth/debug-session', async (request, reply) => {
  return {
    sessionId: request.session.sessionId,
    userId: request.session.userId,
    expires: request.session.cookie.expires
  };
});
```

## Best Practices

1. **Always test logout** - ensures sessions are properly cleaned
2. **Test with multiple users** - verify session isolation
3. **Check error messages** - should not leak sensitive info
4. **Verify redirects** - protected routes should redirect properly
5. **Test edge cases** - expired sessions, invalid data, etc.

## Continuous Integration

Add these tests to CI pipeline:
```yaml
- name: Auth Integration Tests
  run: |
    npm run test:auth
    npm run test:e2e:auth
```

## Security Checklist

- [ ] Passwords are hashed with bcrypt (10 rounds)
- [ ] Sessions expire after inactivity
- [ ] Cookies are httpOnly
- [ ] CORS properly configured
- [ ] No sensitive data in error messages
- [ ] Rate limiting on login endpoint (future)
- [ ] Session fixation protection
- [ ] XSS protection on forms