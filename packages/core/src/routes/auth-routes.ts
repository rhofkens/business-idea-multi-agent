import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
  CurrentUserResponseSchema,
  ErrorResponseSchema,
  LoginRequest
} from '../schemas/auth-schemas.js';
import { UserStore } from '../services/user-store.js';
import { SessionUser } from '@business-idea/shared';

/**
 * Register authentication routes with the Fastify instance.
 *
 * This module defines all authentication-related endpoints:
 * - POST /api/auth/login - User authentication with email/password
 * - POST /api/auth/logout - Session termination
 * - GET /api/auth/user - Current user retrieval
 * - GET /api/auth/check - Authentication status check
 *
 * All routes are prefixed with the base path defined during route registration.
 * Session management is handled automatically via Fastify session plugin.
 *
 * @param fastify - The Fastify instance to register routes on
 * @returns Promise that resolves when all routes are registered
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const userStore = UserStore.getInstance();

  /**
   * POST /api/auth/login - Authenticate user and create session
   *
   * Validates user credentials against the in-memory user store using bcrypt
   * for secure password comparison. On successful authentication:
   * - Creates a new session with user data
   * - Sets session cookie (httpOnly, secure in production)
   * - Returns user information
   *
   * Request body:
   * @param {string} email - User's email address
   * @param {string} password - User's plain text password
   *
   * Response:
   * - 200: Successful login with user data and success message
   * - 401: Invalid credentials
   * - 500: Internal server error
   *
   * Example request:
   * ```json
   * {
   *   "email": "admin@test.com",
   *   "password": "admin123"
   * }
   * ```
   */
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      try {
        // Validate credentials
        const user = await userStore.validateCredentials({ email, password });

        if (!user) {
          return reply.status(401).send({
            error: 'Invalid email or password',
            statusCode: 401
          });
        }

        // Create session user
        const sessionUser: SessionUser = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };

        // Store user in session
        request.session.user = sessionUser;

        return reply.send({
          user: sessionUser,
          message: 'Login successful'
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
          statusCode: 500
        });
      }
    }
  );

  /**
   * POST /api/auth/logout - End user session
   *
   * Destroys the current session and clears the session cookie.
   * This endpoint is accessible to all users (authenticated or not).
   * If no session exists, still returns success.
   *
   * No request body required.
   *
   * Response:
   * - 200: Logout successful
   * - 500: Internal server error (rare, only on session destroy failure)
   *
   * Side effects:
   * - Removes session from server store
   * - Clears session cookie in browser
   */
  fastify.post(
    '/logout',
    {
      schema: {
        response: {
          200: LogoutResponseSchema
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Destroy session
        await request.session.destroy();

        return reply.send({
          message: 'Logout successful'
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
          statusCode: 500
        });
      }
    }
  );

  /**
   * GET /api/auth/user - Get current authenticated user
   *
   * Returns the currently authenticated user's data from the session.
   * Unlike /api/auth/check, this endpoint returns full user details
   * or null if no user is authenticated.
   *
   * No authentication middleware - returns null for unauthenticated requests.
   *
   * Response:
   * - 200: Success with user object or null
   * - 500: Internal server error
   *
   * Example response (authenticated):
   * ```json
   * {
   *   "user": {
   *     "id": "1",
   *     "email": "admin@test.com",
   *     "username": "admin",
   *     "role": "admin"
   *   }
   * }
   * ```
   *
   * Example response (not authenticated):
   * ```json
   * {
   *   "user": null
   * }
   * ```
   */
  fastify.get(
    '/user',
    {
      schema: {
        response: {
          200: CurrentUserResponseSchema
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get user from session
        const user = request.session.user || null;

        return reply.send({
          user
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
          statusCode: 500
        });
      }
    }
  );

  /**
   * GET /api/auth/check - Check authentication status
   *
   * Quick endpoint to verify if the current request has a valid session.
   * Useful for frontend components to check auth state without making
   * a full user request. Does not require authentication.
   *
   * Response:
   * - 200: Always returns success with authentication status
   *
   * Example response (authenticated):
   * ```json
   * {
   *   "authenticated": true,
   *   "user": {
   *     "id": "1",
   *     "email": "admin@test.com",
   *     "username": "admin",
   *     "role": "admin"
   *   }
   * }
   * ```
   *
   * Example response (not authenticated):
   * ```json
   * {
   *   "authenticated": false,
   *   "user": null
   * }
   * ```
   */
  fastify.get(
    '/check',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const isAuthenticated = !!request.session.user;
      
      return reply.send({
        authenticated: isAuthenticated,
        user: request.session.user || null
      });
    }
  );
}