import { createFastifyServer } from './server/fastify-server.js';
import { loggingService } from './services/logging-service.js';
import { configService } from './services/config-service.js';

// Check for test cache flag
const useTestCache = process.argv.includes('--test-cache');
if (useTestCache) {
  console.log('🧪 Test cache mode enabled - will use cached results when available');
}

// Export for use in routes
export const isTestCacheEnabled = () => useTestCache;

async function startServer() {
  try {
    // Verify API key is loaded
    if (!configService.openAIApiKey) {
      loggingService.log({ level: 'ERROR', message: 'OpenAI API key is missing. Shutting down.' });
      process.exit(1);
    }

    const server = await createFastifyServer();
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    
    loggingService.log({ 
      level: 'INFO', 
      message: `Server is running at http://${host}:${port}`
    });
    
    console.log(`🚀 Server is running at http://${host}:${port}`);
    console.log(`🔌 WebSocket endpoint available at ws://${host}:${port}/ws`);
  } catch (err) {
    loggingService.log({ 
      level: 'ERROR', 
      message: 'Error starting server', 
      details: err instanceof Error ? err.message : String(err)
    });
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();