import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@business-idea/shared';
import type { AuthState, AuthContextValue, LoginCredentials } from '../types/auth';
import { authApi } from '../services/auth-api';

/**
 * Default authentication state.
 *
 * Initial state used when the AuthProvider mounts, before
 * authentication status is checked with the server.
 */
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

/**
 * Authentication context.
 *
 * Provides authentication state and methods throughout the application.
 * Must be accessed via the useAuthContext hook to ensure proper error handling.
 *
 * @see {@link useAuthContext}
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for the AuthProvider component.
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component.
 *
 * Manages authentication state and provides auth functions to the entire application.
 * Should be placed at the root of your component tree to ensure all components
 * have access to authentication functionality.
 *
 * Features:
 * - Automatic authentication check on mount
 * - Login/logout functionality with server communication
 * - Role-based access control helpers
 * - Loading and error state management
 * - Session persistence via httpOnly cookies
 *
 * @param {AuthProviderProps} props - Component props
 * @param {React.ReactNode} props.children - Child components that need auth access
 *
 * @example
 * ```tsx
 * // In your App.tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           <Route path="/login" element={<LoginPage />} />
 *           <Route path="/dashboard" element={
 *             <ProtectedRoute>
 *               <Dashboard />
 *             </ProtectedRoute>
 *           } />
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  /**
   * Check authentication status on mount.
   *
   * Automatically verifies if the user has an active session when
   * the application loads, enabling seamless authentication persistence.
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check current authentication status.
   *
   * Queries the server to verify if there's an active session.
   * Updates the auth state based on the server response.
   *
   * @private
   */
  const checkAuth = async () => {
    console.log('🔄 AuthContext.checkAuth() called');
    try {
      console.log('🔄 Calling authApi.checkAuth()...');
      const { authenticated, user } = await authApi.checkAuth();
      
      console.log('📡 checkAuth response:', { authenticated, user });

      if (authenticated && user) {
        console.log('✅ User authenticated, setting auth state');
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });
      } else {
        console.log('⚠️ User not authenticated');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Failed to check authentication status',
      });
    }
  };

  /**
   * Login function.
   *
   * Authenticates the user with the provided credentials and updates
   * the auth state on success. Throws an error on failure.
   *
   * @param {LoginCredentials} credentials - User login credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @throws {Error} If login fails due to invalid credentials or server error
   *
   * @example
   * ```tsx
   * const { login } = useAuthContext();
   *
   * try {
   *   await login({ email: 'user@example.com', password: 'password123' });
   *   // Redirect to dashboard
   * } catch (error) {
   *   // Show error message
   * }
   * ```
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('🔐 AuthContext.login() called with:', { email: credentials.email, password: '***' });
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🌐 Making direct fetch to login endpoint...');
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Login fetch response status:', response.status, response.statusText);
      console.log('📡 Login fetch response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📦 Login response data:', data);

      if (response.ok && data.user) {
        console.log('✅ Login successful, setting authenticated state');
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          isLoading: false,
          error: null,
        });
        console.log('✅ Auth state updated successfully');
      } else {
        console.error('❌ Login failed - response not ok or no user:', { ok: response.ok, hasUser: !!data.user });
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: data.error || 'Login failed',
        });
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login exception caught:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  /**
   * Logout function.
   *
   * Ends the user's session on the server and clears local auth state.
   * Even if the server request fails, the local state is cleared to
   * ensure the user is logged out on the client side.
   *
   * @throws {Error} If logout request fails (though local state is still cleared)
   *
   * @example
   * ```tsx
   * const { logout } = useAuthContext();
   *
   * const handleLogout = async () => {
   *   try {
   *     await logout();
   *     // Redirect to login page
   *   } catch (error) {
   *     // Error is logged but user is still logged out locally
   *   }
   * };
   * ```
   */
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await authApi.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Logout failed',
      });
      throw error;
    }
  }, []);

  /**
   * Check if user has a specific role.
   *
   * @param {UserRole} role - The role to check for ('admin', 'user', or 'guest')
   * @returns {boolean} True if the user has the specified role, false otherwise
   *
   * @example
   * ```tsx
   * const { hasRole } = useAuthContext();
   *
   * if (hasRole('admin')) {
   *   return <AdminPanel />;
   * }
   * ```
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return authState.user?.role === role;
  }, [authState.user]);

  /**
   * Check if user has any of the specified roles.
   *
   * Useful for components that should be accessible to multiple role types.
   *
   * @param {UserRole[]} roles - Array of roles to check
   * @returns {boolean} True if the user has any of the specified roles
   *
   * @example
   * ```tsx
   * const { hasAnyRole } = useAuthContext();
   *
   * if (hasAnyRole(['admin', 'user'])) {
   *   return <AuthenticatedContent />;
   * } else {
   *   return <GuestContent />;
   * }
   * ```
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  }, [authState.user]);

  /**
   * Refresh authentication state.
   *
   * Manually triggers a re-check of the authentication status.
   * Useful after operations that might affect session state.
   *
   * @example
   * ```tsx
   * const { refreshAuth } = useAuthContext();
   *
   * // After updating user profile
   * await updateProfile(data);
   * await refreshAuth(); // Refresh to get updated user data
   * ```
   */
  const refreshAuth = useCallback(async () => {
    await checkAuth();
  }, []);

  const contextValue: AuthContextValue = {
    authState,
    login,
    logout,
    hasRole,
    hasAnyRole,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context.
 *
 * Provides access to authentication state and methods.
 * Must be used within an AuthProvider component.
 *
 * @returns {AuthContextValue} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { authState, login, logout, hasRole } = useAuthContext();
 *
 *   if (authState.isLoading) {
 *     return <Spinner />;
 *   }
 *
 *   if (!authState.isAuthenticated) {
 *     return <LoginPrompt />;
 *   }
 *
 *   return <div>Welcome, {authState.user?.username}!</div>;
 * }
 * ```
 */
export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;