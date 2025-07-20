import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@business-idea/shared';

/**
 * Middleware to ensure user is authenticated.
 *
 * Checks if a valid user session exists before allowing access to the route.
 * If no session exists, returns a 401 Unauthorized response.
 *
 * @param request - Fastify request object containing session data
 * @param reply - Fastify reply object for sending responses
 *
 * @example
 * ```typescript
 * // Apply to a single route
 * fastify.get('/protected', { preHandler: requireAuth }, async (request, reply) => {
 *   // Route handler - user is guaranteed to be authenticated
 *   const user = request.session.user!;
 *   return { message: `Hello ${user.username}!` };
 * });
 * ```
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.session.user) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
}

/**
 * Middleware factory to check user role permissions.
 *
 * Creates a middleware function that verifies the authenticated user has one of the
 * allowed roles. This provides role-based access control (RBAC) for routes.
 *
 * @param allowedRoles - Array of roles that can access the route
 * @returns Middleware function that checks authentication and role permissions
 *
 * @example
 * ```typescript
 * // Allow only admin users
 * fastify.get('/admin', { preHandler: requireRole(['admin']) }, handler);
 *
 * // Allow both admin and user roles
 * fastify.get('/dashboard', { preHandler: requireRole(['admin', 'user']) }, handler);
 *
 * // Multiple middleware can be chained
 * fastify.get('/api/users', {
 *   preHandler: [requireAuth, requireRole(['admin'])]
 * }, handler);
 * ```
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async function(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // First check if user is authenticated
    if (!request.session.user) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    // Then check if user has required role
    const userRole = request.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
  };
}

/**
 * Middleware to check if user is admin.
 *
 * Convenience middleware that specifically checks for admin role.
 * Internally uses requireRole(['admin']) for consistency.
 *
 * @param request - Fastify request object containing session data
 * @param reply - Fastify reply object for sending responses
 *
 * @example
 * ```typescript
 * // Protect admin-only routes
 * fastify.get('/admin/users', { preHandler: requireAdmin }, async (request, reply) => {
 *   // Only admin users can access this
 *   return await userService.getAllUsers();
 * });
 *
 * // Can be combined with other middleware
 * fastify.delete('/api/users/:id', {
 *   preHandler: [requireAdmin, validateUserId]
 * }, handler);
 * ```
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return requireRole(['admin'])(request, reply);
}

/**
 * Middleware to optionally load user if authenticated.
 *
 * This middleware does not block the request if the user is not authenticated.
 * It's useful for routes that have different behavior for authenticated vs
 * unauthenticated users, but don't require authentication.
 *
 * The session.user will be available if the user is logged in, otherwise it will be undefined.
 *
 * @param request - Fastify request object that may contain session data
 * @param reply - Fastify reply object (not used in this middleware)
 *
 * @example
 * ```typescript
 * // Route that shows different content based on authentication status
 * fastify.get('/home', { preHandler: optionalAuth }, async (request, reply) => {
 *   if (request.session.user) {
 *     // Show personalized content for logged-in users
 *     return {
 *       message: `Welcome back, ${request.session.user.username}!`,
 *       showDashboard: true
 *     };
 *   } else {
 *     // Show generic content for guests
 *     return {
 *       message: 'Welcome! Please log in to access all features.',
 *       showDashboard: false
 *     };
 *   }
 * });
 * ```
 */
export async function optionalAuth(
  _request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // This middleware doesn't need to do anything
  // The session.user will be available if user is logged in
  // This is useful for routes that behave differently for
  // authenticated vs unauthenticated users
}