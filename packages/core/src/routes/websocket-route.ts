import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type { ClientMessage, ServerEvent, WorkflowEvent } from '@business-idea/shared';
import { WebSocketSessionManager } from '../services/websocket-session-manager';

// Create a singleton instance of the session manager
const sessionManager = WebSocketSessionManager.getInstance();

export async function websocketRoute(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, (socket: WebSocket, request: FastifyRequest) => {
    const sessionId = (request as FastifyRequest & { session?: { sessionId?: string } }).session?.sessionId;
    
    if (!sessionId) {
      socket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Authentication required' }
      } as ServerEvent));
      socket.close();
      return;
    }

    const agentSubscriptions = new Set<string>();

    // Register the connection with the session manager
    sessionManager.addConnection(sessionId, socket);

    // Log connection
    fastify.log.info({ sessionId }, 'WebSocket connection established');

    // Send initial connection event
    const connectionEvent: ServerEvent = {
      type: 'connected',
      data: { sessionId }
    };
    socket.send(JSON.stringify(connectionEvent));

    // Handle incoming messages
    socket.on('message', (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        fastify.log.debug({ sessionId, message }, 'Received WebSocket message');
        
        switch (message.type) {
          case 'ping': {
            const pongResponse: ServerEvent = { type: 'pong' };
            socket.send(JSON.stringify(pongResponse));
            break;
          }

          case 'subscribe':
            if (message.data?.agentName) {
              agentSubscriptions.add(message.data.agentName);
              // Update subscriptions in session manager
              sessionManager.updateSubscriptions(sessionId, Array.from(agentSubscriptions));
              fastify.log.info({ sessionId, agentName: message.data.agentName }, 'Subscribed to agent');
            }
            break;

          case 'unsubscribe':
            if (message.data?.agentName) {
              agentSubscriptions.delete(message.data.agentName);
              // Update subscriptions in session manager
              sessionManager.updateSubscriptions(sessionId, Array.from(agentSubscriptions));
              fastify.log.info({ sessionId, agentName: message.data.agentName }, 'Unsubscribed from agent');
            }
            break;

          default:
            fastify.log.warn({ sessionId, type: message.type }, 'Unknown message type');
        }
      } catch (error) {
        fastify.log.error({ error, sessionId }, 'Failed to parse WebSocket message');
        const errorResponse: ServerEvent = {
          type: 'error',
          data: { message: 'Invalid message format' }
        };
        socket.send(JSON.stringify(errorResponse));
      }
    });

    // Handle disconnection
    socket.on('close', () => {
      fastify.log.info({ sessionId }, 'WebSocket connection closed');
      // Remove connection from session manager
      sessionManager.removeConnection(sessionId);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      fastify.log.error({ error, sessionId }, 'WebSocket error');
    });

    // Send any buffered events to the newly connected client
    const bufferedEvents = sessionManager.getBufferedEvents(sessionId);
    if (bufferedEvents.length > 0) {
      fastify.log.info({ sessionId, count: bufferedEvents.length }, 'Sending buffered events to client');
      bufferedEvents.forEach((event: WorkflowEvent) => {
        const serverEvent: ServerEvent = { type: 'workflow', data: event };
        socket.send(JSON.stringify(serverEvent));
      });
    }
  });
}