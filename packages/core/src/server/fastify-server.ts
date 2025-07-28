import Fastify, { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCors from '@fastify/cors';
import { authRoutes } from '../routes/auth-routes.js';
import { registerPreferencesRoutes } from '../routes/preferences-routes.js';
import { registerIdeasRoutes } from '../routes/ideas-routes.js';
import websocketPlugin from '../plugins/websocket-plugin.js';
import { websocketRoute } from '../routes/websocket-route.js';
import documentationRoutes from '../routes/documentation-routes.js';

/**
 * Creates and configures a Fastify server instance with necessary plugins
 * for authentication and session management.
 * 
 * @returns Configured Fastify instance
 */
export async function createFastifyServer(): Promise<FastifyInstance> {
  // Initialize Fastify with logging enabled
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    }
  });

  // Register CORS plugin first and await it to ensure it's ready
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests from the React dev server
      const allowedOrigins = ['http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Explicitly allow OPTIONS
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], // Add common headers
    exposedHeaders: ['Set-Cookie'], // Allow frontend to see Set-Cookie header
    preflightContinue: false, // Let Fastify handle OPTIONS
    optionsSuccessStatus: 204, // Proper status for preflight
    maxAge: 86400, // Cache preflight for 24 hours
    strictPreflight: false // Don't require exact route match for OPTIONS
  });

  // Register cookie plugin (required by session plugin)
  await fastify.register(fastifyCookie);

  // Register session plugin with in-memory store configuration
  await fastify.register(fastifySession, {
    cookieName: 'sessionId',
    secret: process.env.SESSION_SECRET || 'default-dev-secret-min-32-characters',
    cookie: {
      // Security settings
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      // Session expiry: 30 minutes (1800000 ms)
      maxAge: 1800000
    },
    // Use default MemoryStore (in-memory storage)
    saveUninitialized: false,
    rolling: true // Reset expiry on activity
  });

  // Register WebSocket plugin after session (it depends on session)
  await fastify.register(websocketPlugin);

  // Register authentication routes after CORS
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  
  // Register preferences routes
  await fastify.register(registerPreferencesRoutes, { prefix: '/api' });
  
  // Register ideas routes
  await fastify.register(registerIdeasRoutes);
  
  // Register documentation routes
  await fastify.register(documentationRoutes);
  
  // Register WebSocket routes (no prefix, uses /ws directly)
  await fastify.register(websocketRoute);

  // Log registered plugins on server ready
  fastify.ready((err) => {
    if (err) {
      fastify.log.error('Error registering plugins:', err);
      throw err;
    }
    fastify.log.info('All plugins registered successfully');
  });

  return fastify;
}

// Type augmentation for session data
declare module '@fastify/session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      email: string;
      role: 'admin' | 'user' | 'guest';
    };
    businessPreferences?: {
      vertical: string;
      subVertical: string;
      businessModel: string;
      additionalContext: string;
    };
  }
}