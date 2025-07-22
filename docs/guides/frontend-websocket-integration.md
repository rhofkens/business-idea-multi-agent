# Frontend WebSocket Integration Guide

This guide explains how to integrate WebSocket functionality in the frontend to receive real-time updates from the Business Idea Generator workflow.

## Table of Contents

1. [Overview](#overview)
2. [WebSocket Hook Usage](#websocket-hook-usage)
3. [Terminal Component Integration](#terminal-component-integration)
4. [Event Types and Handling](#event-types-and-handling)
5. [Authentication and Session Management](#authentication-and-session-management)
6. [Error Handling and Reconnection](#error-handling-and-reconnection)
7. [Development Setup](#development-setup)
8. [Troubleshooting](#troubleshooting)

## Overview

The WebSocket integration provides real-time streaming of agent execution events, including:
- Agent status updates (thinking, completed)
- Streaming text chunks from agent responses
- Complete business ideas with all properties
- Log messages for debugging
- Error notifications

## WebSocket Hook Usage

The `useWebSocket` hook manages WebSocket connections and provides a clean interface for consuming real-time events.

### Basic Usage

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const {
    isConnected,
    events,
    error,
    subscribe,
    unsubscribe,
    clearEvents
  } = useWebSocket();

  // Subscribe to an agent's events
  useEffect(() => {
    subscribe('ideation');
    return () => unsubscribe('ideation');
  }, [subscribe, unsubscribe]);

  // Handle events
  useEffect(() => {
    events.forEach(event => {
      console.log('Received event:', event);
    });
  }, [events]);

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Hook Options

```typescript
const websocket = useWebSocket({
  url: '/ws',                    // WebSocket endpoint (default: '/ws')
  autoReconnect: true,           // Enable auto-reconnection (default: true)
  reconnectDelay: 1000,          // Base delay between reconnection attempts (default: 1000ms)
  maxReconnectAttempts: 5        // Maximum reconnection attempts (default: 5)
});
```

## Terminal Component Integration

The [`TerminalOutput`](packages/web/src/components/TerminalOutput.tsx) component provides a complete UI for displaying real-time agent execution:

```typescript
import { TerminalOutput } from '@/components/TerminalOutput';

function BusinessIdeaGenerator() {
  return (
    <TerminalOutput 
      agentName="ideation"
      className="h-96"
    />
  );
}
```

### Features

- **Real-time Event Display**: Shows agent status, streaming text, and results
- **Auto-scroll**: Automatically scrolls to show new content
- **Event Formatting**: Color-coded messages based on event type
- **Clear Functionality**: Button to clear all displayed events
- **Connection Status**: Visual indicator of WebSocket connection state

## Event Types and Handling

### WorkflowEvent Structure

```typescript
interface WorkflowEvent {
  type: 'chunk' | 'status' | 'idea' | 'refined-idea' | 'result' | 'log' | 'complete' | 'error';
  agentName: string;
  data?: any;
  timestamp: string;
  metadata?: {
    sequenceNumber?: number;
    sessionId?: string;
    [key: string]: any;
  };
}
```

### Event Type Details

#### Status Events
```typescript
// Agent thinking
{
  type: 'status',
  agentName: 'ideation',
  data: { status: 'thinking', message: 'Analyzing market trends...' }
}

// Agent completed
{
  type: 'status',
  agentName: 'ideation',
  data: { status: 'completed' }
}
```

#### Chunk Events (Streaming Text)
```typescript
{
  type: 'chunk',
  agentName: 'ideation',
  data: { content: 'Here\'s an innovative idea: ' }
}
```

#### Complete Business Idea Events
```typescript
{
  type: 'idea',
  agentName: 'ideation',
  data: {
    title: 'AI-Powered Recipe Assistant',
    description: 'An intelligent cooking companion...',
    businessModel: 'Subscription-based SaaS...',
    disruptionPotential: 'High - transforms how people cook...',
    marketPotential: 'Global market opportunity...',
    technicalComplexity: 'Medium - requires AI/ML expertise...',
    capitalIntensity: 'Low to Medium - mainly development costs...',
    reasoning: 'This idea leverages current AI trends...'
  }
}
```

#### Result Events (Final Output)
```typescript
{
  type: 'result',
  agentName: 'workflow',
  data: {
    refinedIdea: { /* refined idea object */ },
    originalIdea: { /* original idea object */ }
  }
}
```

### Custom Event Handling

```typescript
function handleWorkflowEvent(event: WorkflowEvent) {
  switch (event.type) {
    case 'chunk':
      // Append streaming text
      appendToOutput(event.data.content);
      break;
      
    case 'idea':
      // Display complete idea
      displayBusinessIdea(event.data);
      break;
      
    case 'error':
      // Handle errors
      showError(event.data.message);
      break;
      
    case 'complete':
      // Workflow finished
      onWorkflowComplete();
      break;
  }
}
```

## Authentication and Session Management

WebSocket connections require authentication. The connection automatically includes credentials from the current session.

### Authentication Flow

1. User logs in via the authentication API
2. Session cookie is set
3. WebSocket connection includes cookie in handshake
4. Server validates session and associates connection

### Session-Based Event Filtering

Events are automatically filtered by session:
- Each WebSocket connection is tied to a user session
- Only events from the user's workflow executions are received
- Multiple browser tabs share the same session and receive the same events

## Error Handling and Reconnection

### Automatic Reconnection

The WebSocket hook includes automatic reconnection with exponential backoff:

```typescript
// Reconnection behavior
- Attempt 1: Wait 1 second
- Attempt 2: Wait 2 seconds  
- Attempt 3: Wait 3 seconds
- Attempts 4-5: Wait 3 seconds (capped)
- After 5 attempts: Stop trying
```

### Manual Connection Management

```typescript
const { connect, disconnect } = useWebSocket();

// Manually reconnect
function handleReconnect() {
  connect();
}

// Disconnect when needed
function cleanup() {
  disconnect();
}
```

### Error States

```typescript
const { error, isConnected } = useWebSocket();

if (error) {
  // Handle connection errors
  if (error.includes('Authentication')) {
    // Redirect to login
  } else if (error.includes('timeout')) {
    // Show reconnection UI
  }
}
```

## Development Setup

### Environment Configuration

The WebSocket connection automatically adapts to the development environment:

```typescript
// Development: Connects to backend server
ws://localhost:3001/ws

// Production: Uses same host as frontend
wss://yourdomain.com/ws
```

### CORS Configuration

Ensure the backend CORS configuration includes your frontend origin:

```typescript
// packages/core/src/server/fastify-server.ts
cors: {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'https://yourdomain.com'  // Production domain
  ],
  credentials: true
}
```

### Testing WebSocket Connection

Use the provided test scripts:

```bash
# Test basic WebSocket functionality
node test-websocket.js

# Test full integration with agent workflow
node test-integration.js
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
- **Check**: Backend server is running on port 3001
- **Check**: No firewall blocking WebSocket connections
- **Solution**: Ensure `npm run dev` is running in packages/core

#### 2. Authentication Failed
- **Check**: User is logged in
- **Check**: Session cookie is present
- **Solution**: Clear cookies and log in again

#### 3. No Events Received
- **Check**: Subscribed to correct agent name
- **Check**: Workflow is actually running
- **Solution**: Check browser console for WebSocket messages

#### 4. Connection Drops After 30 Seconds
- **Check**: Ping messages are being sent
- **Check**: Server timeout configuration
- **Solution**: The hook sends ping every 30 seconds; check server logs

### Debug Mode

Enable WebSocket debug logging:

```typescript
// In your component
useEffect(() => {
  // Log all WebSocket events
  if (import.meta.env.DEV) {
    events.forEach(event => {
      console.log('[WebSocket Event]', event);
    });
  }
}, [events]);
```

### Browser DevTools

1. Open Network tab
2. Filter by "WS" to see WebSocket connections
3. Click on the connection to see:
   - Headers (including auth cookies)
   - Messages (all sent/received data)
   - Timing information

## Best Practices

1. **Unsubscribe on Cleanup**: Always unsubscribe from agents when components unmount
2. **Handle Connection State**: Show appropriate UI for disconnected state
3. **Limit Event Storage**: Clear old events to prevent memory issues
4. **Use Event Metadata**: Leverage sequence numbers for ordering and deduplication
5. **Error Boundaries**: Wrap WebSocket components in error boundaries

## Example: Complete Integration

```typescript
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { TerminalOutput } from '@/components/TerminalOutput';
import { Button } from '@/components/ui/button';
import { businessPreferencesApi } from '@/services/business-preferences-api';

export function BusinessIdeaGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  const handleGenerate = async () => {
    if (!isConnected) {
      alert('WebSocket not connected. Please refresh the page.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Subscribe to receive events
      subscribe('ideation');
      subscribe('refinement');
      
      // Trigger the workflow
      await businessPreferencesApi.generateIdea();
    } catch (error) {
      console.error('Failed to generate idea:', error);
      setIsGenerating(false);
    }
  };

  // Cleanup subscriptions
  useEffect(() => {
    return () => {
      unsubscribe('ideation');
      unsubscribe('refinement');
    };
  }, [unsubscribe]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Business Idea Generator</h1>
      
      <div className="mb-4">
        <Button 
          onClick={handleGenerate} 
          disabled={!isConnected || isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate New Idea'}
        </Button>
        
        <span className="ml-4 text-sm">
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <div className="border rounded-lg p-4 bg-black text-white">
        <TerminalOutput 
          agentName="ideation"
          className="h-96"
        />
      </div>
    </div>
  );
}
```

This completes the WebSocket integration, providing real-time updates for the Business Idea Generator workflow.