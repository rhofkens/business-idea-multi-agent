import { Type, Static } from '@sinclair/typebox';

/**
 * Schema for user login requests.
 *
 * Validates that the request contains:
 * - A valid email address (format validation)
 * - A password with minimum 6 characters
 *
 * Used by POST /api/auth/login endpoint
 *
 * @example
 * ```json
 * {
 *   "email": "admin@test.com",
 *   "password": "admin123"
 * }
 * ```
 */
export const LoginRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 })
});

/**
 * TypeScript type derived from LoginRequestSchema
 */
export type LoginRequest = Static<typeof LoginRequestSchema>;

/**
 * Schema for successful login responses.
 *
 * Returns user information and a success message.
 * The user object contains:
 * - id: Unique user identifier
 * - email: User's email address
 * - username: Display username
 * - role: User's permission level (admin, user, or guest)
 *
 * @example
 * ```json
 * {
 *   "user": {
 *     "id": "1",
 *     "email": "admin@test.com",
 *     "username": "admin",
 *     "role": "admin"
 *   },
 *   "message": "Login successful"
 * }
 * ```
 */
export const LoginResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.String({ format: 'email' }),
    username: Type.String(),
    role: Type.Union([
      Type.Literal('admin'),
      Type.Literal('user'),
      Type.Literal('guest')
    ])
  }),
  message: Type.String()
});

export type LoginResponse = Static<typeof LoginResponseSchema>;

/**
 * Schema for logout responses.
 *
 * Simple response confirming successful logout.
 * Used by POST /api/auth/logout endpoint
 *
 * @example
 * ```json
 * {
 *   "message": "Logout successful"
 * }
 * ```
 */
export const LogoutResponseSchema = Type.Object({
  message: Type.String()
});

/**
 * TypeScript type derived from LogoutResponseSchema
 */
export type LogoutResponse = Static<typeof LogoutResponseSchema>;

/**
 * Schema for current user retrieval responses.
 *
 * Returns the authenticated user's information or null if not authenticated.
 * Used by GET /api/auth/user endpoint
 *
 * The user can be either:
 * - A complete user object with id, email, username, and role
 * - null if no user is currently authenticated
 *
 * @example Authenticated user:
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
 * @example No authenticated user:
 * ```json
 * {
 *   "user": null
 * }
 * ```
 */
export const CurrentUserResponseSchema = Type.Object({
  user: Type.Union([
    Type.Object({
      id: Type.String(),
      email: Type.String({ format: 'email' }),
      username: Type.String(),
      role: Type.Union([
        Type.Literal('admin'),
        Type.Literal('user'),
        Type.Literal('guest')
      ])
    }),
    Type.Null()
  ])
});

/**
 * TypeScript type derived from CurrentUserResponseSchema
 */
export type CurrentUserResponse = Static<typeof CurrentUserResponseSchema>;

/**
 * Schema for API error responses.
 *
 * Standardized error format used across all authentication endpoints.
 * Contains:
 * - error: Human-readable error message
 * - statusCode: HTTP status code
 *
 * Common status codes:
 * - 401: Unauthorized (invalid credentials, no session)
 * - 403: Forbidden (insufficient permissions)
 * - 500: Internal server error
 *
 * @example
 * ```json
 * {
 *   "error": "Invalid email or password",
 *   "statusCode": 401
 * }
 * ```
 */
export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  statusCode: Type.Number()
});

/**
 * TypeScript type derived from ErrorResponseSchema
 */
export type ErrorResponse = Static<typeof ErrorResponseSchema>;