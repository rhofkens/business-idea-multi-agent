# ADR-007: WebSocket Connection Management and Event Handling

## Status
Superseded - Updated to reflect WebSocketProvider implementation

## Context
The WebSocket connection transmits various event types including 'log', 'status', 'error', 'progress', and 'result'. Different UI components need different subsets of these events:
- Terminal Output component needs all event types for comprehensive logging
- SmartTable component only needs 'result' events with business ideas
- Agent Progress Dashboard needs 'status' and 'progress' events

Initial implementation had a critical issue where multiple components were creating separate WebSocket connections:
- Each component using useWebSocket hook directly created its own connection
- This led to competing connections and event handling conflicts
- SmartTable wasn't receiving real-time updates because another connection was consuming the events

## Decision
We implemented a WebSocketProvider pattern to ensure a single shared WebSocket connection across all components.

Implementation approach:
1. Create a WebSocketProvider context that wraps the useWebSocket hook
2. All components access the shared connection through useWebSocketContext
3. Event filtering happens at the component level through specialized hooks

### Core Implementation:

```typescript
// WebSocketContext.tsx
const WebSocketContext = createContext<ReturnType<typeof useWebSocket> | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webSocket = useWebSocket();
  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};
```

### Component Usage:
```typescript
// In components like SmartTable
const { events, isConnected } = useWebSocketContext();

// Event filtering in specialized hooks
const useIdeaStream = () => {
  const { events } = useWebSocketContext();
  
  // Filter for specific event types
  const ideaEvents = events.filter(event => 
    event.type === 'result' && event.data?.ideas
  );
  
  return { ideas, isStreaming };
};
```

## Consequences
- **Positive**: Single WebSocket connection shared across all components
- **Positive**: Eliminates connection conflicts and event consumption issues
- **Positive**: Centralized connection management with clear ownership
- **Positive**: Components can still filter events based on their needs
- **Positive**: Easier to debug WebSocket issues with single connection
- **Negative**: All components receive all events (filtering happens client-side)
- **Negative**: Need to ensure WebSocketProvider is at appropriate level in component tree

## Implementation Details
1. WebSocketProvider must wrap all components that need WebSocket access
2. Components use useWebSocketContext instead of useWebSocket directly
3. Event filtering implemented in specialized hooks (useIdeaStream, etc.)
4. Connection state and events are shared across all consumers

## Alternatives Considered
- **Original approach**: Each component creates its own connection - rejected due to conflicts
- **Server-side filtering**: Different endpoints for different event types - too complex
- **Event bus pattern**: Separate event distribution layer - unnecessary complexity