/**
 * Represents a workflow event that is transmitted via WebSocket
 * to provide real-time updates on agent execution and console output.
 */
export interface WorkflowEvent {
  /** Unique identifier for the event */
  id: string;
  
  /** ISO 8601 timestamp when the event occurred */
  timestamp: string;
  
  /** Type of event being transmitted */
  type: 'log' | 'status' | 'error' | 'progress' | 'result';
  
  /** Name of the agent that generated this event */
  agentName: string;
  
  /** Log level for console output events */
  level: 'info' | 'warn' | 'error' | 'debug';
  
  /** The actual message content */
  message: string;
  
  /** Optional metadata for additional context */
  metadata?: {
    /** Progress percentage (0-100) for progress events */
    progress?: number;
    
    /** Current stage of execution */
    stage?: string;
    
    /** Additional data specific to the event type */
    data?: unknown;
  };
}

/**
 * Message sent from client to server via WebSocket
 */
export interface ClientMessage {
  /** Type of client message */
  type: 'ping' | 'subscribe' | 'unsubscribe';
  
  /** Optional data payload */
  data?: {
    /** Agent name for subscription operations */
    agentName?: string;
    /** Session ID for connection events */
    sessionId?: string;
    /** Error message for error events */
    message?: string;
  };
}

/**
 * Message sent from server to client via WebSocket
 */
export interface ServerEvent {
  /** Type of server event */
  type: 'workflow' | 'pong' | 'error' | 'connected' | 'disconnected';
  
  /** Event payload - WorkflowEvent for 'workflow' type, or other structured data */
  data?: WorkflowEvent | {
    /** Session ID for connection events */
    sessionId?: string;
    /** Error message for error events */
    message?: string;
  };
  
  /** Error message for 'error' type */
  error?: string;
}

/**
 * WebSocket connection state
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Console event captured from agent execution
 */
export interface ConsoleEvent {
  /** Console method that was called */
  level: 'log' | 'warn' | 'error';
  
  /** Name of the agent that generated the output */
  agentName: string;
  
  /** The console message */
  message: string;
  
  /** ISO 8601 timestamp */
  timestamp: string;
}