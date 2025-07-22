import type { WebSocket } from 'ws';
import type { WorkflowEvent } from '@business-idea/shared';
import { EventEmitter } from 'events';

// Import WebSocket state constants
const OPEN = 1; // WebSocket.OPEN value

// Ring buffer implementation for event buffering
class EventBuffer {
  private buffer: WorkflowEvent[] = [];
  private maxSize: number;
  private head: number = 0;
  private size: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  push(event: WorkflowEvent): void {
    if (this.size < this.maxSize) {
      this.buffer.push(event);
      this.size++;
    } else {
      // Overwrite oldest event
      this.buffer[this.head] = event;
      this.head = (this.head + 1) % this.maxSize;
    }
  }

  getAll(): WorkflowEvent[] {
    if (this.size < this.maxSize) {
      return [...this.buffer];
    }
    
    // Return events in chronological order
    const result: WorkflowEvent[] = [];
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.maxSize;
      result.push(this.buffer[index]);
    }
    return result;
  }

  clear(): void {
    this.buffer = [];
    this.head = 0;
    this.size = 0;
  }
}

interface WebSocketSession {
  sessionId: string;
  socket: WebSocket;
  subscribedAgents: string[];
  connectedAt: Date;
  lastActivity: Date;
}

export class WebSocketSessionManager extends EventEmitter {
  private static instance: WebSocketSessionManager;
  private sessions: Map<string, WebSocketSession> = new Map();
  private eventBuffer: EventBuffer = new EventBuffer(1000);

  private constructor() {
    super();
  }

  public static getInstance(): WebSocketSessionManager {
    if (!WebSocketSessionManager.instance) {
      WebSocketSessionManager.instance = new WebSocketSessionManager();
    }
    return WebSocketSessionManager.instance;
  }

  /**
   * Add a new WebSocket connection
   */
  addConnection(sessionId: string, socket: WebSocket): void {
    const session: WebSocketSession = {
      sessionId,
      socket,
      subscribedAgents: [],
      connectedAt: new Date(),
      lastActivity: new Date()
    };
    
    this.sessions.set(sessionId, session);
    this.emit('connection-added', sessionId);
  }
  
  /**
   * Remove a WebSocket connection
   */
  removeConnection(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.emit('connection-removed', sessionId);
    }
  }

  /**
   * Update subscriptions for a session
   */
  updateSubscriptions(sessionId: string, agentNames: string[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.subscribedAgents = agentNames;
      session.lastActivity = new Date();
    }
  }

  /**
   * Get buffered events for a session
   */
  getBufferedEvents(sessionId: string): WorkflowEvent[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    
    // Filter events based on agent subscriptions
    const allEvents = this.eventBuffer.getAll();
    if (session.subscribedAgents.length === 0) {
      // No subscriptions, return all events
      return allEvents;
    }
    
    // Return only events from subscribed agents
    return allEvents.filter(event => 
      session.subscribedAgents.includes(event.agentName)
    );
  }

  /**
   * Broadcast a workflow event to all subscribed sessions
   * Also stores the event in the buffer
   */
  broadcastWorkflowEvent(event: WorkflowEvent): void {
    // Store in buffer
    this.eventBuffer.push(event);
    
    // Broadcast to subscribed sessions
    this.sessions.forEach(session => {
      // Check if session is subscribed to this agent or has no specific subscriptions
      if (session.subscribedAgents.length === 0 || 
          session.subscribedAgents.includes(event.agentName)) {
        this.sendEventToSession(session, event);
      }
    });
  }
  
  /**
   * Send an event to a specific session
   */
  private sendEventToSession(session: WebSocketSession, event: WorkflowEvent): void {
    if (session.socket.readyState === OPEN) {
      session.socket.send(JSON.stringify({
        type: 'workflow',
        data: event
      }));
    }
  }
  
  /**
   * Clear event buffer (e.g., when needed)
   */
  clearEventBuffer(): void {
    this.eventBuffer.clear();
  }
  
  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Check if a session is connected
   */
  isSessionConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session ? session.socket.readyState === OPEN : false;
  }
}