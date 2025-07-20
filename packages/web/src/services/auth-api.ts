import ApiClient from './api-client';
import type { User } from '@business-idea/shared';
import type { 
  LoginCredentials, 
  LoginResponse,
  CheckAuthResponse,
  LogoutResponse
} from '../types/auth';

/**
 * Auth API service for handling authentication-related API calls.
 *
 * This service provides a clean interface for all authentication
 * operations, wrapping the ApiClient with auth-specific methods.
 * All methods handle errors consistently by throwing with meaningful
 * messages for the UI to display.
 *
 * Features:
 * - Login/logout functionality
 * - Session-based authentication check
 * - Current user retrieval
 * - Automatic cookie handling via ApiClient
 *
 * @class AuthApi
 */
export class AuthApi {
  private client: ApiClient;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.client = new ApiClient({ baseURL });
  }

  /**
   * Login with email and password.
   *
   * Authenticates a user and establishes a session. The session
   * cookie is automatically handled by the browser.
   *
   * @param {LoginCredentials} credentials - User login credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @returns {Promise<LoginResponse>} Login response with user data and success message
   * @throws {Error} If login fails due to invalid credentials or server error
   *
   * @example
   * ```typescript
   * try {
   *   const response = await authApi.login({
   *     email: 'admin@test.com',
   *     password: 'admin123'
   *   });
   *   console.log('Logged in as:', response.user.username);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   * ```
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', credentials);
    
    if (!response.success) {
      throw new Error(response.error || 'Login failed');
    }
    
    return response.data!;
  }

  /**
   * Logout the current user.
   *
   * Destroys the user's session on the server and clears
   * the session cookie. This effectively logs the user out
   * of the application.
   *
   * @returns {Promise<LogoutResponse>} Logout confirmation response
   * @throws {Error} If logout fails due to server error
   *
   * @example
   * ```typescript
   * try {
   *   const response = await authApi.logout();
   *   console.log(response.message); // "Logged out successfully"
   * } catch (error) {
   *   console.error('Logout failed:', error.message);
   * }
   * ```
   */
  async logout(): Promise<LogoutResponse> {
    const response = await this.client.post<LogoutResponse>('/api/auth/logout', {});
    
    if (!response.success) {
      throw new Error(response.error || 'Logout failed');
    }
    
    return response.data!;
  }

  /**
   * Get the current authenticated user.
   *
   * Retrieves the user data for the currently authenticated session.
   * Requires an active session with a valid session cookie.
   *
   * @returns {Promise<User>} The authenticated user's data
   * @throws {Error} If not authenticated or request fails
   *
   * @example
   * ```typescript
   * try {
   *   const user = await authApi.getCurrentUser();
   *   console.log(`Current user: ${user.username} (${user.role})`);
   * } catch (error) {
   *   console.error('Not authenticated:', error.message);
   * }
   * ```
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/api/auth/user');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get current user');
    }
    
    return response.data!.user;
  }

  /**
   * Check if the user is authenticated.
   *
   * Verifies if there's an active session without retrieving
   * full user data. Useful for quick authentication checks
   * on app initialization or route guards.
   *
   * @returns {Promise<CheckAuthResponse>} Authentication status and user info if authenticated
   * @returns {Promise<CheckAuthResponse>} response.authenticated - Whether user is authenticated
   * @returns {Promise<CheckAuthResponse>} response.user - User data if authenticated, undefined otherwise
   * @throws {Error} If the check fails due to server error
   *
   * @example
   * ```typescript
   * try {
   *   const { authenticated, user } = await authApi.checkAuth();
   *   if (authenticated) {
   *     console.log('Authenticated as:', user?.username);
   *   } else {
   *     console.log('Not authenticated');
   *   }
   * } catch (error) {
   *   console.error('Auth check failed:', error.message);
   * }
   * ```
   */
  async checkAuth(): Promise<CheckAuthResponse> {
    const response = await this.client.get<CheckAuthResponse>('/api/auth/check');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to check auth status');
    }
    
    return response.data!;
  }
}

/**
 * Default AuthApi instance for use throughout the application.
 * Configured to use the default API base URL (http://localhost:3000).
 *
 * @example
 * ```typescript
 * import { authApi } from './services/auth-api';
 *
 * // Use the singleton instance
 * await authApi.login({ email, password });
 * ```
 */
export const authApi = new AuthApi();

/**
 * Convenience function for user login.
 * @see {@link AuthApi.login}
 */
export const login = (credentials: LoginCredentials) => authApi.login(credentials);

/**
 * Convenience function for user logout.
 * @see {@link AuthApi.logout}
 */
export const logout = () => authApi.logout();

/**
 * Convenience function to get current user.
 * @see {@link AuthApi.getCurrentUser}
 */
export const getCurrentUser = () => authApi.getCurrentUser();

/**
 * Convenience function to check authentication status.
 * @see {@link AuthApi.checkAuth}
 */
export const checkAuth = () => authApi.checkAuth();