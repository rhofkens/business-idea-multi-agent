import { FastifyRequest } from 'fastify';
import { User, SessionUser } from '@business-idea/shared';

/**
 * Type for custom session data.
 * Extends the session to allow arbitrary key-value pairs
 * while preserving the core session structure.
 */
interface SessionData {
  user?: SessionUser;
  cookie?: unknown;
  [key: string]: unknown;
}

/**
 * Session management utilities for handling user sessions.
 *
 * This class provides a centralized interface for managing user sessions
 * in the application. It handles session creation, destruction, and
 * provides various utility methods for session data management.
 *
 * All methods are static, so no instantiation is required.
 *
 * @example
 * ```typescript
 * // Create a session after successful login
 * await SessionUtils.createSession(request, user);
 *
 * // Check if user is authenticated
 * if (SessionUtils.isAuthenticated(request)) {
 *   const user = SessionUtils.getSessionUser(request);
 *   console.log(`User ${user.username} is logged in`);
 * }
 *
 * // Destroy session on logout
 * await SessionUtils.destroySession(request);
 * ```
 */
export class SessionUtils {
  /**
   * Create a session for a user.
   *
   * This method creates a new session for the authenticated user by:
   * 1. Extracting minimal user data (id, email, username, role) for session storage
   * 2. Storing the user data in the session
   * 3. Regenerating the session ID for security (prevents session fixation attacks)
   *
   * @param request - Fastify request object with session support
   * @param user - Complete user object from database/user store
   *
   * @example
   * ```typescript
   * // In login route handler
   * const user = await userStore.findByEmail(email);
   * if (user && await bcrypt.compare(password, user.passwordHash)) {
   *   await SessionUtils.createSession(request, user);
   *   return { message: 'Login successful' };
   * }
   * ```
   */
  static async createSession(request: FastifyRequest, user: User): Promise<void> {
    // Store minimal user data in session
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    request.session.user = sessionUser;
    
    // Regenerate session ID for security
    await request.session.regenerate();
  }

  /**
   * Destroy the current session.
   *
   * Completely removes the session from the session store and clears
   * the session cookie from the client. This method returns a Promise
   * that resolves when the session is successfully destroyed.
   *
   * @param request - Fastify request object with an active session
   * @throws Will throw an error if session destruction fails
   *
   * @example
   * ```typescript
   * // In logout route handler
   * try {
   *   await SessionUtils.destroySession(request);
   *   return { message: 'Logged out successfully' };
   * } catch (error) {
   *   reply.status(500).send({ error: 'Failed to logout' });
   * }
   * ```
   */
  static async destroySession(request: FastifyRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      request.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get the current session user.
   *
   * Retrieves the user information stored in the current session.
   * Returns null if no user is authenticated (i.e., no active session).
   *
   * @param request - Fastify request object with session support
   * @returns The session user object containing id, email, username, and role,
   *          or null if not authenticated
   *
   * @example
   * ```typescript
   * // In a route handler
   * const user = SessionUtils.getSessionUser(request);
   * if (user) {
   *   console.log(`User ${user.username} (${user.email}) is logged in`);
   *   console.log(`User role: ${user.role}`);
   * } else {
   *   console.log('No user is logged in');
   * }
   * ```
   */
  static getSessionUser(request: FastifyRequest): SessionUser | null {
    return request.session.user || null;
  }

  /**
   * Check if user is authenticated.
   *
   * Determines whether there is an active user session. This is a simple
   * boolean check that verifies if user data exists in the session.
   *
   * @param request - Fastify request object with session support
   * @returns True if a user is authenticated (session contains user data),
   *          false otherwise
   *
   * @example
   * ```typescript
   * // In middleware or route handler
   * if (!SessionUtils.isAuthenticated(request)) {
   *   reply.status(401).send({ error: 'Authentication required' });
   *   return;
   * }
   *
   * // Or use with conditional logic
   * const isLoggedIn = SessionUtils.isAuthenticated(request);
   * const greeting = isLoggedIn ? 'Welcome back!' : 'Please log in';
   * ```
   */
  static isAuthenticated(request: FastifyRequest): boolean {
    return !!request.session.user;
  }

  /**
   * Check if user has a specific role.
   *
   * Verifies whether the authenticated user has the specified role.
   * This method is useful for implementing role-based access control (RBAC)
   * throughout the application.
   *
   * @param request - Fastify request object with session support
   * @param role - The role to check against (e.g., 'admin', 'user', 'guest')
   * @returns True if the authenticated user has the specified role,
   *          false if not authenticated or has a different role
   *
   * @example
   * ```typescript
   * // Check for admin role
   * if (SessionUtils.hasRole(request, 'admin')) {
   *   // Allow admin-specific operations
   *   return await performAdminAction();
   * }
   *
   * // Check for multiple roles
   * const canModerate = SessionUtils.hasRole(request, 'admin') ||
   *                     SessionUtils.hasRole(request, 'moderator');
   * ```
   */
  static hasRole(request: FastifyRequest, role: string): boolean {
    const user = this.getSessionUser(request);
    return user ? user.role === role : false;
  }

  /**
   * Refresh session expiry time.
   *
   * Manually updates the session's last access time, which extends its
   * expiration. This is automatically handled when rolling sessions are
   * enabled (as configured in this application), but this method allows
   * explicit refresh when needed.
   *
   * Use cases include:
   * - Keeping sessions alive during long-running operations
   * - Refreshing session before critical operations
   * - Implementing custom session timeout logic
   *
   * @param request - Fastify request object with session support
   *
   * @example
   * ```typescript
   * // Keep session alive during a long operation
   * async function processLargeDataset(request: FastifyRequest) {
   *   for (const batch of dataBatches) {
   *     await processBatch(batch);
   *     // Refresh session every batch to prevent timeout
   *     SessionUtils.touchSession(request);
   *   }
   * }
   * ```
   */
  static touchSession(request: FastifyRequest): void {
    // Simply accessing the session will refresh it when rolling is enabled
    request.session.touch();
  }

  /**
   * Set custom session data.
   *
   * Stores arbitrary data in the session under the specified key.
   * This is useful for maintaining state across requests, such as:
   * - User preferences
   * - Multi-step form data
   * - Shopping cart contents
   * - Temporary flags or settings
   *
   * Note: The 'user' key is reserved and cannot be overwritten
   * to prevent accidental corruption of authentication state.
   *
   * @param request - Fastify request object with session support
   * @param key - The key under which to store the data (cannot be 'user')
   * @param value - The value to store (must be JSON-serializable)
   *
   * @example
   * ```typescript
   * // Store user preferences
   * SessionUtils.setSessionData(request, 'theme', 'dark');
   * SessionUtils.setSessionData(request, 'language', 'en');
   *
   * // Store multi-step form data
   * SessionUtils.setSessionData(request, 'registrationStep1', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  static setSessionData(request: FastifyRequest, key: string, value: unknown): void {
    if (key !== 'user') {
      // Prevent overwriting the user key
      (request.session as unknown as SessionData)[key] = value;
    }
  }

  /**
   * Get custom session data.
   *
   * Retrieves data previously stored in the session under the specified key.
   * Returns undefined if the key doesn't exist in the session.
   *
   * This method is commonly used to:
   * - Retrieve user preferences
   * - Access multi-step form data
   * - Get temporary flags or settings
   * - Restore state between requests
   *
   * @param request - Fastify request object with session support
   * @param key - The key to retrieve data for
   * @returns The stored value, or undefined if the key doesn't exist
   *
   * @example
   * ```typescript
   * // Retrieve user preferences
   * const theme = SessionUtils.getSessionData(request, 'theme') || 'light';
   * const language = SessionUtils.getSessionData(request, 'language') || 'en';
   *
   * // Retrieve and validate multi-step form data
   * const step1Data = SessionUtils.getSessionData(request, 'registrationStep1');
   * if (!step1Data) {
   *   return reply.redirect('/registration/step1');
   * }
   * ```
   */
  static getSessionData(request: FastifyRequest, key: string): unknown {
    return (request.session as unknown as SessionData)[key];
  }

  /**
   * Clear all custom session data except user.
   *
   * Removes all session data while preserving the user authentication state
   * and session cookie configuration. This is useful for:
   * - Resetting application state without logging out
   * - Clearing temporary data after completion of multi-step processes
   * - Cleaning up session data on errors
   * - Preparing for a fresh start within the same session
   *
   * The method preserves:
   * - User authentication data ('user' key)
   * - Session cookie configuration ('cookie' key)
   *
   * @param request - Fastify request object with session support
   *
   * @example
   * ```typescript
   * // Clear session after completing a multi-step form
   * async function completeRegistration(request: FastifyRequest) {
   *   // Process final registration step
   *   await saveRegistration(registrationData);
   *
   *   // Clear all temporary form data from session
   *   SessionUtils.clearSessionData(request);
   *
   *   return { success: true, message: 'Registration complete!' };
   * }
   *
   * // Reset session state on error
   * catch (error) {
   *   SessionUtils.clearSessionData(request);
   *   throw error;
   * }
   * ```
   */
  static clearSessionData(request: FastifyRequest): void {
    const user = request.session.user;
    const keys = Object.keys(request.session);
    
    keys.forEach(key => {
      if (key !== 'user' && key !== 'cookie') {
        delete (request.session as unknown as SessionData)[key];
      }
    });
    
    // Restore user if it existed
    if (user) {
      request.session.user = user;
    }
  }
}