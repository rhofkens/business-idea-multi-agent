# Increment 3: Terminal Output Streaming

## 1. Detailed Scope

### Included:

1. **WebSocket Server Setup**
   - Install and configure @fastify/websocket plugin
   - Create WebSocket route handler at `/ws/workflow`
   - Implement connection lifecycle management (connect, disconnect, error handling)
   - Add WebSocket connection authentication using session tokens from increment 1

2. **Console Output Capture System**
   - Create output capture service to intercept all agent console.log, console.warn, console.error statements
   - Implement buffering mechanism for high-frequency outputs
   - Preserve original console functionality while capturing output
   - Support capturing different log levels (info, warn, error, debug)

3. **Structured Event Format**
   - Define TypeScript interfaces for WebSocket events in @business-idea/shared:
     ```typescript
     interface WorkflowEvent {
       id: string;           // Unique event ID
       timestamp: string;    // ISO 8601 timestamp
       type: 'log' | 'status' | 'error' | 'progress' | 'result';
       agentName: string;    // Which agent generated this
       level: 'info' | 'warn' | 'error' | 'debug';
       message: string;      // The actual output content
       metadata?: {          // Optional additional data
         progress?: number;  // For progress events (0-100)
         stage?: string;     // Current processing stage
         data?: any;         // Agent-specific data
       };
     }
     ```

4. **Backend WebSocket Integration**
   - Modify agent-orchestrator.ts to use output capture service
   - Implement event streaming during workflow execution
   - Add workflow state management (started, running, completed, failed)
   - Queue events while no client is connected (with size limits)

5. **Frontend WebSocket Client**
   - Create WebSocket hook using React 18.3.1 best practices
   - Implement automatic reconnection with exponential backoff
   - Handle connection states (connecting, connected, disconnected, error)
   - Create event buffer for UI updates

6. **Terminal UI Component Updates**
   - Enhance existing TerminalOutput component to display WebSocket events
   - Support text formatting (colors based on log level)
   - Implement auto-scroll with user override
   - Add clear terminal functionality
   - Show connection status indicator

### Excluded:
- Multiple concurrent workflow support
- WebSocket message compression
- Binary data transmission
- Historical event persistence to database
- Advanced filtering/searching of terminal output
- Terminal command input capabilities
- WebSocket scaling/clustering

## 2. Detailed Acceptance Criteria

1. **WebSocket Server Functionality**
   - [ ] WebSocket endpoint `/ws/workflow` is accessible and responds to connection requests
   - [ ] Only authenticated users (with valid session) can establish WebSocket connections
   - [ ] Server gracefully handles client disconnections and cleans up resources
   - [ ] Server can handle at least 100 events per second without dropping messages

2. **Console Output Capture**
   - [ ] All console.log outputs from agents are captured and streamed
   - [ ] All console.warn outputs from agents are captured and streamed
   - [ ] All console.error outputs from agents are captured and streamed
   - [ ] Original console functionality remains intact for debugging
   - [ ] Captured outputs include correct timestamps and agent identification
   - [ ] No output is lost during high-frequency logging bursts

3. **Event Streaming**
   - [ ] Events follow the defined WorkflowEvent interface structure
   - [ ] Events are transmitted in real-time (< 100ms delay)
   - [ ] Event order is preserved during transmission
   - [ ] Large messages (> 1KB) are handled correctly without truncation
   - [ ] Event IDs are unique and sequential

4. **Frontend Integration**
   - [ ] WebSocket connection establishes within 2 seconds of workflow start
   - [ ] All streamed events appear in the terminal UI
   - [ ] Connection status indicator shows correct state (connected/disconnected)
   - [ ] Automatic reconnection works after network interruption
   - [ ] Terminal can display at least 1000 lines without performance degradation
   - [ ] Events are buffered during disconnection and displayed on reconnect

5. **User Experience**
   - [ ] Users can see real-time agent processing output as it happens
   - [ ] Different log levels are visually distinguished (colors/icons)
   - [ ] Terminal auto-scrolls unless user has manually scrolled up
   - [ ] Users can clear the terminal output with a button click
   - [ ] No visible lag or stuttering during normal operation
   - [ ] Error messages are clearly highlighted and readable

## 3. Detailed Documentation Tasks

1. **API Documentation**
   - Document WebSocket endpoint `/ws/workflow` in API specification
   - Define all WorkflowEvent types and their schemas
   - Include WebSocket connection handshake example
   - Document authentication requirements for WebSocket connections
   - Add error codes and their meanings

2. **Frontend Integration Guide**
   - Create guide for using the WebSocket hook in React components
   - Document TerminalOutput component props and event handling
   - Provide examples of handling different event types
   - Include troubleshooting section for common connection issues
   - Add performance optimization tips

3. **Architecture Updates**
   - Update architecture.md section on "Real-time Communication" with WebSocket details
   - Add sequence diagram showing event flow from agent to UI
   - Document the console output capture mechanism
   - Explain event buffering and delivery guarantees
   - Include WebSocket connection lifecycle diagram

4. **Developer Setup Guide**
   - Add WebSocket testing instructions using wscat or similar tools
   - Document how to mock WebSocket events for frontend development
   - Include debugging tips for WebSocket connections in Chrome DevTools
   - Provide performance monitoring guidelines
   - Add instructions for local development with WebSocket proxy