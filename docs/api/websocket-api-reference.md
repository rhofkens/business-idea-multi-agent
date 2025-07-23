# WebSocket API Reference

## Overview

The Business Idea Multi-Agent application provides real-time WebSocket support for streaming agent workflow events. This enables clients to receive live updates about business idea generation progress, agent activities, and console output.

## WebSocket Endpoint

### Connection URL
```
ws://localhost:3001/ws
```

### Authentication
The WebSocket endpoint requires authentication through the existing session cookie. Clients must be authenticated via the REST API before establishing a WebSocket connection.

## Message Protocol

All WebSocket messages use JSON format with the following structure:

### Client-to-Server Messages

```typescript
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  data?: {
    agentName?: string;  // For subscribe/unsubscribe
  };
}
```

### Server-to-Client Messages

```typescript
interface ServerMessage {
  type: 'workflow' | 'pong' | 'error' | 'subscribed' | 'unsubscribed';
  data?: WorkflowEvent | ErrorData | SubscriptionData;
}
```

## Message Types

### 1. Subscribe to Agent Events

**Request:**
```json
{
  "type": "subscribe",
  "data": {
    "agentName": "IdeationAgent"
  }
}
```

**Response:**
```json
{
  "type": "subscribed",
  "data": {
    "agentName": "IdeationAgent"
  }
}
```

Available agent names:
- `IdeationAgent`
- `CompetitorAgent`
- `CriticAgent`
- `DocumentationAgent`
- `Orchestrator`

### 2. Unsubscribe from Agent Events

**Request:**
```json
{
  "type": "unsubscribe",
  "data": {
    "agentName": "IdeationAgent"
  }
}
```

**Response:**
```json
{
  "type": "unsubscribed",
  "data": {
    "agentName": "IdeationAgent"
  }
}
```

### 3. Workflow Events

**Server-to-Client Event:**
```json
{
  "type": "workflow",
  "data": {
    "id": "evt_123456",
    "timestamp": "2024-01-20T10:30:00Z",
    "processId": "proc_abc123",
    "agentName": "IdeationAgent",
    "type": "status",
    "message": "Generating initial business ideas...",
    "metadata": {}
  }
}
```

## Workflow Event Types

### 1. Status Events
Indicate agent progress and state changes.

```json
{
  "type": "workflow",
  "data": {
    "type": "status",
    "message": "Generating initial business ideas...",
    "agentName": "IdeationAgent",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### 2. Workflow Progress Events
Contain agent-specific progress data and evaluations.

**CriticAgent Evaluation Event:**
```json
{
  "type": "workflow",
  "data": {
    "id": "evt_789xyz",
    "timestamp": "2024-01-20T10:35:00Z",
    "processId": "proc_abc123",
    "agentName": "CriticAgent",
    "type": "workflow",
    "message": "Critical evaluation completed",
    "metadata": {
      "stage": "critical-evaluation",
      "data": {
        "evaluation": {
          "ideaId": "01JAXH123456789ABCDEFGHJ",
          "criticalAnalysis": "This AI-powered project management solution shows strong potential...",
          "overallScore": 8.5,
          "reasoning": {
            "marketPotential": "The global project management software market is expected to grow...",
            "technicalFeasibility": "The technical requirements are well within current capabilities...",
            "competitiveAdvantage": "The AI-driven insights provide a unique differentiator..."
          }
        }
      }
    }
  }
}
```

### 3. Log Events
Capture console output and detailed agent logs.

```json
{
  "type": "workflow",
  "data": {
    "type": "log",
    "message": "💡 Idea 1: AI-Powered Project Management",
    "agentName": "IdeationAgent",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### 4. Result Events
Contain structured data results from agents.

**IdeationAgent Result Event:**
```json
{
  "type": "workflow",
  "data": {
    "type": "result",
    "message": "Generated business idea",
    "agentName": "IdeationAgent",
    "metadata": {
      "data": {
        "idea": {
          "id": "01JAXH123456789ABCDEFGHJ",
          "title": "AI-Powered Project Management",
          "description": "...",
          "businessModel": "B2B SaaS",
          "disruptionPotential": 8,
          "marketPotential": 9,
          "technicalComplexity": 7,
          "capitalIntensity": 6,
          "reasoning": {
            "disruption": "...",
            "market": "...",
            "technical": "...",
            "capital": "..."
          }
        }
      }
    }
  }
}
```

**CompetitorAgent Result Event:**
```json
{
  "type": "workflow",
  "data": {
    "type": "result",
    "message": "Competitor analysis completed",
    "agentName": "CompetitorAgent",
    "metadata": {
      "data": {
        "analysis": {
          "ideaId": "01JAXH123456789ABCDEFGHJ",
          "competitors": [
            {
              "name": "Asana",
              "strengths": ["Market leader", "Strong integrations"],
              "weaknesses": ["Complex pricing", "Steep learning curve"],
              "marketShare": 15
            }
          ],
          "marketGaps": ["AI-driven insights", "Predictive analytics"],
          "differentiators": ["Automated resource allocation", "Risk prediction"]
        }
      }
    }
  }
}
```

### 5. Chunk Events
For streaming text generation.

```json
{
  "type": "workflow",
  "data": {
    "type": "chunk",
    "message": "Analyzing market potential",
    "agentName": "CompetitorAgent",
    "metadata": {
      "chunk": "The global project management software market..."
    }
  }
}
```

### 6. Complete Events
Signal workflow or agent completion.

```json
{
  "type": "workflow",
  "data": {
    "type": "complete",
    "message": "Business idea generation completed",
    "agentName": "Orchestrator"
  }
}
```

### 7. Error Events
Report errors during workflow execution.

```json
{
  "type": "workflow",
  "data": {
    "type": "error",
    "message": "Failed to generate ideas: API rate limit exceeded",
    "agentName": "IdeationAgent"
  }
}
```

## Connection Lifecycle

### 1. Establishing Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Subscribe to agents
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { agentName: 'IdeationAgent' }
  }));
};
```

### 2. Handling Events
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'workflow') {
    const workflowEvent = message.data;
    console.log(`[${workflowEvent.agentName}] ${workflowEvent.message}`);
  }
};
```

### 3. Error Handling
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  // Implement reconnection logic if needed
};
```

## Best Practices

1. **Subscription Management**: Subscribe only to the agents you need to monitor to reduce network traffic.

2. **Error Handling**: Implement robust error handling and reconnection logic for production applications.

3. **Event Buffering**: The server buffers the last 1000 events per session. Connect promptly after starting a workflow to avoid missing events.

4. **Heartbeat**: Send periodic ping messages to keep the connection alive:
   ```javascript
   setInterval(() => {
     ws.send(JSON.stringify({ type: 'ping' }));
   }, 30000);
   ```

5. **Resource Cleanup**: Always close WebSocket connections when done:
   ```javascript
   window.addEventListener('beforeunload', () => {
     ws.close();
   });
   ```

## Example: Complete Integration

```javascript
class WorkflowEventStream {
  constructor(onEvent) {
    this.ws = null;
    this.onEvent = onEvent;
    this.reconnectTimeout = null;
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:3001/ws');
    
    this.ws.onopen = () => {
      console.log('Connected to workflow events');
      this.subscribeToAllAgents();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'workflow') {
        this.onEvent(message.data);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from workflow events');
      this.scheduleReconnect();
    };
  }
  
  subscribeToAllAgents() {
    const agents = ['IdeationAgent', 'CompetitorAgent', 'CriticAgent', 'DocumentationAgent', 'Orchestrator'];
    agents.forEach(agent => {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        data: { agentName: agent }
      }));
    });
  }
  
  scheduleReconnect() {
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 5000);
  }
  
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const stream = new WorkflowEventStream((event) => {
  console.log(`[${event.agentName}] ${event.type}: ${event.message}`);
});

stream.connect();