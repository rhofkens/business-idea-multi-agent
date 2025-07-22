# Terminal Output Streaming - Implementation Tasks

This document provides a detailed, ordered list of tasks for implementing Terminal Output Streaming as specified in `docs/plans/03-terminal-output-streaming.md`.

## Prerequisites
- Completed Step 1: User Authentication & Session Management
- Completed Step 2: Business Preference Integration
- Fastify server running with session management
- React web application with authenticated routes

## Implementation Tasks

### 1. WebSocket Plugin Installation and Configuration

#### 1.1 Install WebSocket Dependencies
- Install `@fastify/websocket` plugin: `npm install @fastify/websocket`
- Install TypeScript types for ws package: `npm install @types/ws --save-dev`
- Add `@fastify/websocket` to `packages/core/package.json` dependencies
- Add `@types/ws` to `packages/core/package.json` devDependencies
- Verify compatibility with current Fastify version

#### 1.2 Configure WebSocket Plugin
- Create `packages/core/src/plugins/websocket-plugin.ts`
- Register plugin in `packages/core/src/server/fastify-server.ts` using pattern:
  ```typescript
  fastify.register(require('@fastify/websocket'), {
    options: {
      maxPayload: 1048576 // 1MB max message size
    },
    errorHandler: (error, socket, req, reply) => {
      // Log error and terminate connection
      socket.terminate()
    }
  })
  ```
- Ensure plugin is registered after session plugin for authentication access

### 2. Define WebSocket Event Types

#### 2.1 Create Event Interface
- Create `packages/shared/src/types/websocket-events.ts`
- Define `WorkflowEvent` interface as specified in step plan:
  ```typescript
  interface WorkflowEvent {
    id: string;
    timestamp: string;
    type: 'log' | 'status' | 'error' | 'progress' | 'result';
    agentName: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    metadata?: {
      progress?: number;
      stage?: string;
      data?: any;
    };
  }
  ```
- Export from `packages/shared/src/types/index.ts`

#### 2.2 Define Client/Server Message Types
- Add `ClientMessage` and `ServerEvent` interfaces
- Include message types for connection lifecycle
- Add to shared types for frontend consumption

### 3. Implement Console Output Capture Service

#### 3.1 Create Console Capture Service
- Create `packages/core/src/services/console-capture-service.ts`
- Implement the pattern from ADR-005:
  - Store original console methods
  - Create interceptor methods
  - Add agent context injection
  - Implement restore functionality

#### 3.2 Create Console Event Types
- Define internal console event structure
- Add timestamp generation using ISO 8601 format
- Include agent identification

### 4. Create WebSocket Route Handler

#### 4.1 Implement WebSocket Endpoint
- Create `packages/core/src/routes/websocket-routes.ts`
- Implement `/ws/workflow` endpoint using Fastify pattern:
  ```typescript
  fastify.get('/ws/workflow', { websocket: true }, (socket, req) => {
    // WebSocket handler implementation
  })
  ```
- Configure route within a plugin context for proper encapsulation

#### 4.2 Add Authentication with preValidation Hook
- Implement preValidation hook for authentication:
  ```typescript
  fastify.addHook('preValidation', async (request, reply) => {
    // Extract and validate session token
    // Return 401 if unauthorized
  })
  ```
- Extract session token from query parameters or headers
- Validate session using existing session service
- Store session info in request context for handler access

#### 4.3 Implement Connection Lifecycle
- Set up socket event handlers in the WebSocket route handler:
  - `socket.on('message', ...)` for incoming messages
  - `socket.on('close', ...)` for cleanup
  - `socket.on('error', ...)` for error handling
- Use socket.send() for sending messages to client
- Handle connection state management

### 5. Create WebSocket Session Manager

#### 5.1 Create Session Manager Service
- Create `packages/core/src/services/websocket-session-manager.ts`
- Track active WebSocket connections by session ID
- Implement connection registry (Map structure)
- Add methods: addConnection, removeConnection, getConnections

#### 5.2 Implement Broadcast Logic
- Create method to send events to all connections for a session
- Handle connection failures gracefully
- Remove failed connections from registry
- Add logging for debugging

### 6. Integrate Console Capture with Agent Orchestrator

#### 6.1 Modify Agent Orchestrator
- Update `packages/core/src/orchestrator/agent-orchestrator.ts`
- Inject console capture service
- Wrap agent executions with console interception
- Ensure restoration on completion or error

#### 6.2 Add Event Emission
- Create event emitter for workflow events
- Emit captured console events
- Add workflow status events (started, completed, failed)
- Include agent identification in all events

#### 6.3 Connect to WebSocket Broadcasting
- Link event emitter to WebSocket session manager
- Transform console events to WorkflowEvent format
- Add unique event ID generation (using ulid)
- Send events directly to connected clients (no buffering needed)

### 7. Frontend WebSocket Hook Implementation

#### 7.1 Create WebSocket Hook
- Create `packages/web/src/hooks/useWebSocket.ts`
- Implement connection management with React 18.3.1 patterns
- Add automatic reconnection with exponential backoff
- Handle connection state (connecting, connected, disconnected, error)

#### 7.2 Implement Event Handling
- Create event buffer for UI updates
- Parse incoming WebSocket messages
- Handle different event types
- Add TypeScript types for events

#### 7.3 Add Authentication Integration
- Get session token from auth context
- Include token in WebSocket connection URL
- Handle authentication failures
- Clear connection on logout

### 8. Update Terminal Output Component

#### 8.1 Enhance Terminal Component
- Update `packages/web/src/components/TerminalOutput.tsx`
- Connect to WebSocket hook
- Display events in real-time
- Maintain internal event buffer

#### 8.2 Implement UI Features
- Add color coding based on log level:
  - info: default color
  - warn: yellow/orange
  - error: red
  - debug: gray
- Implement auto-scroll with user override detection
- Add clear terminal button
- Show connection status indicator

#### 8.3 Add Event Formatting
- Format timestamps for display
- Show agent names clearly
- Handle long messages with word wrap
- Add syntax highlighting for JSON data

### 9. Testing Implementation

#### 9.1 Backend Testing
- Create test for WebSocket plugin registration
- Test console capture service functionality
- Test WebSocket authentication scenarios
- Test message handling and connection lifecycle

#### 9.2 Integration Testing
- all tests manual
- Test end-to-end workflow with console output
- Verify event ordering
- Test reconnection scenarios

#### 9.3 Frontend Testing
- all tests manual
- Test WebSocket hook lifecycle
- Verify terminal component updates
- Test connection state handling
- Validate user interaction features

### 10. Documentation Tasks

#### 10.1 API Documentation
- Create `docs/api/websocket-api-reference.md`
- Document `/ws/workflow` endpoint
- Define all WorkflowEvent types and schemas
- Include connection handshake example
- Document authentication requirements
- Add error codes and meanings

#### 10.2 Frontend Integration Guide
- Create `docs/guides/websocket-integration-guide.md`
- Document useWebSocket hook usage
- Provide TerminalOutput component examples
- Include event handling patterns
- Add troubleshooting section
- Document performance optimization tips

#### 10.3 Architecture Documentation Updates
- Update `docs/guidelines/architecture.md`:
  - Add "Console Output Capture" section
  - Document WebSocket event streaming
  - Add WebSocket message flow diagram
  - Include connection lifecycle details
- Create sequence diagram for event flow

#### 10.4 Developer Setup Guide
- Create `docs/guides/websocket-development-guide.md`
- Add wscat testing instructions
- Document mock event generation
- Include Chrome DevTools WebSocket debugging
- Add performance monitoring guidelines
- Document local development proxy setup

### 11. Configuration and Deployment

#### 11.1 Environment Configuration
- Add WebSocket-specific environment variables if needed
- Document configuration options
- Set appropriate defaults

#### 11.2 Update Development Scripts
- Ensure WebSocket works in development mode
- Test with Vite proxy configuration
- Verify hot reload doesn't break connections

## Acceptance Criteria Validation

This task list addresses all acceptance criteria from the step plan:
- WebSocket endpoint implementation (Tasks 4-5)
- Console output capture (Tasks 3, 6)
- Event streaming with proper format (Tasks 2, 6)
- Frontend real-time display (Tasks 7-8)
- User experience features (Task 8)
- All documentation requirements (Task 10)

## Dependencies
- Existing session management from Step 1
- Process ID generation from Step 2
- Running Fastify server
- React application with authentication

## Notes
- Follow ADR-005 for console capture implementation
- Event buffering removed per KISS principle (ADR-006 to be deleted)
- Ensure all code follows the patterns in coding-guidelines.md
- Use TypeScript strict mode for all new files
- Follow @fastify/websocket patterns from official documentation