import { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  WorkflowEvent, 
  ClientMessage, 
  ServerEvent 
} from '@business-idea/shared';

export interface WebSocketOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface WebSocketState {
  isConnected: boolean;
  events: WorkflowEvent[];
  error: string | null;
  reconnectAttempts: number;
}

export interface WebSocketActions {
  subscribe: (agentName: string) => void;
  unsubscribe: (agentName: string) => void;
  clearEvents: () => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: WebSocketOptions = {}): WebSocketState & WebSocketActions {
  const {
    url = '/ws',
    autoReconnect = true,
    reconnectDelay = 1000,
    maxReconnectAttempts = 5
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    events: [],
    error: null,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedAgentsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleWorkflowEvent = useCallback((event: WorkflowEvent) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      events: [...prev.events, event]
    }));
  }, []);

  const handleServerEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'pong':
        // Pong received, connection is healthy
        break;
      case 'error':
        setState(prev => ({
          ...prev,
          error: event.error || 'Unknown error'
        }));
        break;
      case 'workflow':
        if (event.data) {
          handleWorkflowEvent(event.data as WorkflowEvent);
        }
        break;
    }
  }, [handleWorkflowEvent]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    clearReconnectTimeout();
    clearPingInterval();

    try {
      // Build WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In development, use the backend server host
      const host = import.meta.env.DEV ? 'localhost:3001' : window.location.host;
      const wsUrl = `${protocol}//${host}${url}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return;

        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          reconnectAttempts: 0
        }));

        // Re-subscribe to previously subscribed agents
        subscribedAgentsRef.current.forEach(agentName => {
          sendMessage({ type: 'subscribe', data: { agentName } });
        });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          sendMessage({ type: 'ping' });
        }, 30000); // Ping every 30 seconds
      };

      wsRef.current.onclose = (event) => {
        if (!mountedRef.current) return;

        console.log('WebSocket disconnected', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: event.reason || 'Connection closed'
        }));

        clearPingInterval();

        // Attempt reconnection if enabled and not at max attempts
        if (
          autoReconnect && 
          state.reconnectAttempts < maxReconnectAttempts &&
          mountedRef.current
        ) {
          const nextAttempt = state.reconnectAttempts + 1;
          const delay = reconnectDelay * Math.min(nextAttempt, 3); // Cap exponential backoff

          console.log(`Reconnecting in ${delay}ms (attempt ${nextAttempt}/${maxReconnectAttempts})`);
          
          setState(prev => ({
            ...prev,
            reconnectAttempts: nextAttempt
          }));

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerEvent;
          handleServerEvent(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection'
      }));
    }
  }, [
    url, 
    autoReconnect, 
    reconnectDelay, 
    maxReconnectAttempts, 
    state.reconnectAttempts,
    sendMessage,
    handleServerEvent,
    clearReconnectTimeout,
    clearPingInterval
  ]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearPingInterval();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      reconnectAttempts: 0
    }));
  }, [clearReconnectTimeout, clearPingInterval]);

  const subscribe = useCallback((agentName: string) => {
    subscribedAgentsRef.current.add(agentName);
    sendMessage({ type: 'subscribe', data: { agentName } });
  }, [sendMessage]);

  const unsubscribe = useCallback((agentName: string) => {
    subscribedAgentsRef.current.delete(agentName);
    sendMessage({ type: 'unsubscribe', data: { agentName } });
  }, [sendMessage]);

  const clearEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      events: []
    }));
  }, []);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    subscribe,
    unsubscribe,
    clearEvents,
    connect,
    disconnect
  };
}