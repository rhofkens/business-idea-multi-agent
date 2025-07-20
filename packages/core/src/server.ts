import 'dotenv/config';
import { createFastifyServer } from './server/fastify-server.js';
import { loggingService } from './services/logging-service.js';

/**
 * Start the Fastify server independently of the agent orchestrator.
 * This allows for testing authentication without running the full idea generation.
 *
 * @description
 * This function initializes and starts the Fastify server with all necessary
 * plugins and routes, including authentication endpoints. It's designed to
 * run the server standalone for development and testing purposes.
 */
async function startServer() {
  try {
    // Create the Fastify server instance
    const server = await createFastifyServer();
    
    // Get port from environment or use default
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    // Start the server
    await server.listen({ port, host });
    
    loggingService.log({
      level: 'INFO',
      message: `Server started successfully`,
      details: `Listening on http://${host}:${port}`
    });

    console.log(`\n🚀 Server is running!`);
    console.log(`📍 API available at: http://localhost:${port}/api`);
    console.log(`🔐 Auth endpoints: http://localhost:${port}/api/auth/*`);
    console.log(`\n💡 Tip: Use 'npm run server' to run just the server without idea generation`);
    
    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      loggingService.log({
        level: 'INFO',
        message: `Received ${signal}, starting graceful shutdown`
      });
      
      try {
        await server.close();
        loggingService.log({
          level: 'INFO',
          message: 'Server closed successfully'
        });
        process.exit(0);
      } catch (error) {
        loggingService.log({
          level: 'ERROR',
          message: 'Error during shutdown',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        process.exit(1);
      }
    };
    
    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    loggingService.log({
      level: 'ERROR',
      message: 'Failed to start server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Start the server
startServer();