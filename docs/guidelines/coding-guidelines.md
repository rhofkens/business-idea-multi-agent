# Coding Guidelines

This document outlines coding standards and best practices for the Business Idea Generator web application, based on the technology stack defined in the architecture document.

## Table of Contents
1. [General Principles](#general-principles)
2. [Backend Guidelines (Fastify + TypeScript)](#backend-guidelines-fastify--typescript)
3. [Frontend Guidelines (React 18.3.1 + TypeScript)](#frontend-guidelines-react-1831--typescript)
4. [Code Formatting and Linting](#code-formatting-and-linting)
5. [Version Control](#version-control)
6. [Error Handling and Logging](#error-handling-and-logging)
7. [Testing Standards](#testing-standards)

## General Principles

### Code Quality
- Write code for humans first, computers second
- Prefer clarity over cleverness
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names
- Avoid premature optimization
- Document complex logic with comments

### TypeScript Usage
- **Always use strict TypeScript** - no `any` types unless absolutely necessary
- Define interfaces for all data structures
- Use type inference where possible, explicit types where necessary
- Leverage discriminated unions for state management
- Prefer `interface` over `type` for object shapes

## Backend Guidelines (Fastify + TypeScript)

### Project Structure
```
packages/api/
├── src/
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── plugins/         # Fastify plugins
│   ├── schemas/         # Request/response schemas
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── websocket/       # WebSocket handlers
│   └── server.ts        # Main server file
```

### Fastify Best Practices

#### Route Definitions
Based on context7 Fastify patterns:

```typescript
// routes/auth.routes.ts
import { FastifyPluginCallback } from 'fastify'
import { Type } from '@sinclair/typebox'

interface AuthRequest {
  Body: {
    email: string
    password: string
  }
}

const authRoutes: FastifyPluginCallback = (fastify, opts, done) => {
  fastify.post<AuthRequest>('/login', {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 6 })
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
          user: Type.Object({
            id: Type.String(),
            email: Type.String()
          })
        })
      }
    },
    preValidation: async (request, reply) => {
      // Custom validation logic if needed
    }
  }, async (request, reply) => {
    const { email, password } = request.body
    // Authentication logic
    return { token: 'jwt-token', user: { id: '123', email } }
  })
  
  done()
}

export default authRoutes
```

#### Plugin Development
```typescript
// plugins/jwt.plugin.ts
import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { FastifyPluginCallback } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
    }
  }
}

const jwtPlugin: FastifyPluginCallback = async (fastify, opts) => {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret'
  })
  
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
}

export default fp(jwtPlugin, '5.x')
```

### WebSocket Implementation
```typescript
// websocket/handlers.ts
import { WebSocket } from 'ws'

interface WSMessage {
  type: 'agent_update' | 'generation_complete' | 'error'
  payload: unknown
}

export function handleWebSocketConnection(ws: WebSocket, sessionId: string) {
  ws.on('message', (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString())
      
      switch (message.type) {
        case 'agent_update':
          // Handle agent updates
          break
        // ... other cases
      }
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { message: 'Invalid message format' }
      }))
    }
  })
}
```

### In-Memory Storage Pattern
```typescript
// services/session.service.ts
interface Session {
  id: string
  userId: string
  createdAt: Date
  lastActivity: Date
  data: Map<string, unknown>
}

class SessionService {
  private sessions = new Map<string, Session>()
  
  create(userId: string): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      data: new Map()
    }
    
    this.sessions.set(session.id, session)
    return session
  }
  
  get(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = new Date()
    }
    return session
  }
  
  // Cleanup old sessions periodically
  cleanup() {
    const now = Date.now()
    const timeout = 30 * 60 * 1000 // 30 minutes
    
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > timeout) {
        this.sessions.delete(id)
      }
    }
  }
}

export const sessionService = new SessionService()
```

## Frontend Guidelines (React 18.3.1 + TypeScript)

### Component Structure
```
packages/web/src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── hooks/           # Custom hooks
├── lib/             # Utilities and helpers
├── types/           # TypeScript types
└── services/        # API services
```

### React Best Practices

#### Component Patterns
Based on context7 React 18.3.1 patterns:

```typescript
// components/IdeaGenerationForm.tsx
import { useState, useCallback } from 'react'

interface FormData {
  industry: string
  targetMarket: string
  problemStatement: string
}

export function IdeaGenerationForm() {
  const [formData, setFormData] = useState<FormData>({
    industry: '',
    targetMarket: '',
    problemStatement: ''
  })
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  
  // Use useCallback for stable function references
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    try {
      // API call
      await generateIdeas(formData)
      setStatus('success')
    } catch (error) {
      setStatus('error')
    }
  }, [formData])
  
  const handleInputChange = useCallback((field: keyof FormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }))
    }
  }, [])
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

#### Custom Hooks
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: unknown) => void
  onError?: (error: Event) => void
  reconnect?: boolean
}

export function useWebSocket({ url, onMessage, onError, reconnect = true }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  
  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url)
      
      ws.current.onopen = () => {
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.current.onerror = (error) => {
        onError?.(error)
        setIsConnected(false)
      }
      
      ws.current.onclose = () => {
        setIsConnected(false)
        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(connect, 3001)
        }
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }, [url, onMessage, onError, reconnect])
  
  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      ws.current?.close()
    }
  }, [connect])
  
  const send = useCallback((data: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])
  
  return { isConnected, send }
}
```

#### State Management with useReducer
For complex state logic, use useReducer with discriminated unions:

```typescript
// components/AgentProgressDashboard.tsx
import { useReducer } from 'react'

type AgentState = 
  | { status: 'idle' }
  | { status: 'running'; currentAgent: string; progress: number }
  | { status: 'completed'; results: AgentResult[] }
  | { status: 'error'; error: string }

type AgentAction =
  | { type: 'start'; agent: string }
  | { type: 'updateProgress'; progress: number }
  | { type: 'complete'; results: AgentResult[] }
  | { type: 'error'; error: string }
  | { type: 'reset' }

function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'start':
      return { status: 'running', currentAgent: action.agent, progress: 0 }
    case 'updateProgress':
      return state.status === 'running' 
        ? { ...state, progress: action.progress }
        : state
    case 'complete':
      return { status: 'completed', results: action.results }
    case 'error':
      return { status: 'error', error: action.error }
    case 'reset':
      return { status: 'idle' }
    default:
      return state
  }
}

export function AgentProgressDashboard() {
  const [state, dispatch] = useReducer(agentReducer, { status: 'idle' })
  
  // Component logic...
}
```

### Making Static Components Dynamic
When converting existing static components:

1. **Identify State Requirements**
   - What data needs to be dynamic?
   - What user interactions need handling?
   - What real-time updates are needed?

2. **Add State Management**
   ```typescript
   // Before (static)
   export function SmartTable() {
     return (
       <table>
         <tbody>
           <tr><td>Static Data</td></tr>
         </tbody>
       </table>
     )
   }
   
   // After (dynamic)
   export function SmartTable({ data, onRowClick }: SmartTableProps) {
     const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
     const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
     
     const sortedData = useMemo(() => {
       if (!sortConfig) return data
       // Sorting logic
       return [...data].sort(/* ... */)
     }, [data, sortConfig])
     
     return (
       <table>
         {/* Dynamic content */}
       </table>
     )
   }
   ```

3. **Connect to Backend**
   ```typescript
   // services/api.ts
   const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001'
   
   export async function generateIdeas(params: IdeaGenerationParams) {
     const response = await fetch(`${API_BASE}/api/ideas/generate`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${getAuthToken()}`
       },
       body: JSON.stringify(params)
     })
     
     if (!response.ok) {
       throw new Error(`API Error: ${response.statusText}`)
     }
     
     return response.json()
   }
   ```

## Code Formatting and Linting

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'react/react-in-jsx-scope': 'off', // Not needed in React 18
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
```

### Prettier Configuration
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Version Control

### Git Workflow
- Use feature branches: `feature/description`, `fix/description`, `chore/description`
- Keep commits atomic and focused
- Write meaningful commit messages

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(api): add WebSocket support for real-time updates

- Implemented WebSocket server using native ws library
- Added session-based connection management
- Created message handlers for agent updates

Closes #123
```

## Error Handling and Logging

### Backend Error Handling
```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// In routes
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        message: error.message,
        code: error.code
      }
    })
  } else {
    // Log unexpected errors
    fastify.log.error(error)
    reply.status(500).send({
      error: {
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
      }
    })
  }
})
```

### Frontend Error Boundaries
```typescript
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }
    
    return this.props.children
  }
}
```

## Testing Standards

### Phase 1: Manual Testing
During the initial development phase, we focus on manual testing to ensure rapid iteration and functionality validation.

#### Backend Manual Testing
- Use tools like Postman or Insomnia to test API endpoints
- Verify authentication flows manually with JWT tokens
- Test WebSocket connections using browser developer tools
- Validate error responses and edge cases

#### Frontend Manual Testing
- Test all user interactions in different browsers
- Verify form submissions and validations
- Test WebSocket real-time updates
- Check responsive design across devices
- Validate error states and loading indicators

#### Manual Testing Checklist
- [ ] Authentication flow (login/logout)
- [ ] Form validations and submissions
- [ ] WebSocket connection and reconnection
- [ ] API error handling
- [ ] UI component interactions
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

### Phase 2: Automated Testing (Future)
Automated testing will be introduced in Phase 2 to ensure code quality and prevent regressions:

#### Planned Testing Stack
- **Backend**: Tap for Fastify route testing
- **Frontend**: Jest + React Testing Library
- **E2E**: Playwright or Cypress
- **Code Coverage**: Target 80% coverage

#### Example Test Structure (Phase 2)
```typescript
// Future automated test example
// tests/routes/auth.test.ts
import { test } from 'tap'
import { build } from '../helper'

test('POST /login returns JWT token', async (t) => {
  const app = build()
  
  const response = await app.inject({
    method: 'POST',
    url: '/login',
    payload: {
      email: 'test@example.com',
      password: 'T3st!Pass@24'
    }
  })
  
  t.equal(response.statusCode, 200)
  t.ok(response.json().token)
})
```

## Summary

These guidelines provide a foundation for consistent, maintainable code across the Business Idea Generator application. Key takeaways:

1. **Use TypeScript strictly** - leverage its type system fully
2. **Follow framework best practices** - use patterns recommended by React 18.3.1 and Fastify documentation
3. **Keep it simple** - align with the lightweight Phase 1 architecture
4. **Prioritize readability** - write code that's easy to understand and maintain
5. **Test manually in Phase 1** - ensure reliability through thorough manual testing (automated testing in Phase 2)

As the application evolves toward Phase 2, these guidelines should be updated to reflect new patterns and requirements.