import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyWebsocket from '@fastify/websocket';
import type { WebSocket } from 'ws';

/**
 * WebSocket plugin configuration
 * Registers the @fastify/websocket plugin with appropriate options
 */
async function websocketPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Register the WebSocket plugin
  await fastify.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB max message size
      perMessageDeflate: false // Disable compression for simplicity
    },
    errorHandler: (error: Error, socket: WebSocket, _req: FastifyRequest, _reply: FastifyReply) => {
      // Log error and terminate connection
      fastify.log.error('WebSocket error:', error);
      socket.terminate();
    }
  });

  fastify.log.info('WebSocket plugin registered successfully');
}

export default fp(websocketPlugin, {
  name: 'websocket-plugin',
  dependencies: ['@fastify/session'] // Ensure session plugin is loaded first
});