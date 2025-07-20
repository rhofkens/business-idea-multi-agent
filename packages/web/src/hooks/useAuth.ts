import { useAuthContext } from '../contexts/AuthContext';
import type { User, UserRole } from '@business-idea/shared';
import type { LoginCredentials } from '../types/auth';

/**
 * Custom hook for authentication.
 *
 * Provides a simplified interface to authentication functionality,
 * wrapping the AuthContext with convenience methods and state accessors.
 * This is the primary hook for authentication in your components.
 *
 * @returns {Object} Authentication state and methods
 * @returns {boolean} returns.isAuthenticated - Whether user is authenticated
 * @returns {User | null} returns.user - Current user data or null
 * @returns {boolean} returns.isLoading - Loading state during auth operations
 * @returns {string | null} returns.error - Error message if any
 * @returns {Function} returns.login - Login function
 * @returns {Function} returns.logout - Logout function
 * @returns {Function} returns.refreshAuth - Refresh auth state function
 * @returns {Function} returns.hasRole - Check if user has specific role
 * @returns {Function} returns.hasAnyRole - Check if user has any of specified roles
 * @returns {Function} returns.isAdmin - Check if user is admin
 * @returns {Function} returns.isUser - Check if user has 'user' role
 * @returns {Function} returns.isGuest - Check if user has 'guest' role
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { isAuthenticated, login, logout, user, isLoading } = useAuth();
 *
 *   const handleAuth = async () => {
 *     if (isAuthenticated) {
 *       await logout();
 *     } else {
 *       await login({ email: 'user@example.com', password: 'password' });
 *     }
 *   };
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <button onClick={handleAuth}>
 *       {isAuthenticated ? `Logout ${user?.username}` : 'Login'}
 *     </button>
 *   );
 * }
 * ```
 */
export const useAuth = () => {
  const {
    authState,
    login,
    logout,
    hasRole,
    hasAnyRole,
    refreshAuth,
  } = useAuthContext();

  return {
    // Authentication state
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,

    // Authentication actions
    login,
    logout,
    refreshAuth,

    // Role checking utilities
    hasRole,
    hasAnyRole,

    // Convenience methods
    isAdmin: () => hasRole('admin' as UserRole),
    isUser: () => hasRole('user' as UserRole),
    isGuest: () => hasRole('guest' as UserRole),
  };
};

/**
 * Hook to get the current user.
 *
 * Convenience hook that returns only the current user data.
 * Useful when you only need user information without other auth state.
 *
 * @returns {User | null} Current user data or null if not authenticated
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const user = useCurrentUser();
 *
 *   if (!user) {
 *     return <div>Please log in to view your profile</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h2>Welcome, {user.username}!</h2>
 *       <p>Email: {user.email}</p>
 *       <p>Role: {user.role}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check if user has required role.
 *
 * Reactive hook that updates when auth state changes.
 * Useful for conditional rendering based on user role.
 *
 * @param {UserRole} role - The role to check ('admin', 'user', or 'guest')
 * @returns {boolean} True if user has the specified role, false otherwise
 *
 * @example
 * ```tsx
 * function AdminSection() {
 *   const isAdmin = useHasRole('admin');
 *
 *   if (!isAdmin) {
 *     return <div>Access denied. Admin only.</div>;
 *   }
 *
 *   return <AdminDashboard />;
 * }
 * ```
 */
export const useHasRole = (role: UserRole): boolean => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

/**
 * Hook to check if user has any of the required roles.
 *
 * Useful for components accessible to multiple role types.
 * Returns true if the user has at least one of the specified roles.
 *
 * @param {UserRole[]} roles - Array of roles to check
 * @returns {boolean} True if user has any of the specified roles
 *
 * @example
 * ```tsx
 * function MemberContent() {
 *   const isMember = useHasAnyRole(['admin', 'user']);
 *
 *   if (!isMember) {
 *     return <GuestPrompt />;
 *   }
 *
 *   return <MemberDashboard />;
 * }
 * ```
 */
export const useHasAnyRole = (roles: UserRole[]): boolean => {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles);
};

/**
 * Hook for authentication loading state.
 *
 * Isolated hook for components that only need loading state.
 * Useful for showing loading indicators during auth operations.
 *
 * @returns {boolean} True if auth operation is in progress
 *
 * @example
 * ```tsx
 * function App() {
 *   const isAuthLoading = useAuthLoading();
 *
 *   if (isAuthLoading) {
 *     return <FullPageLoader />;
 *   }
 *
 *   return <Routes />;
 * }
 * ```
 */
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};

/**
 * Hook for authentication error state.
 *
 * Provides access to authentication error messages.
 * Useful for displaying error feedback to users.
 *
 * @returns {string | null} Error message or null if no error
 *
 * @example
 * ```tsx
 * function AuthError() {
 *   const error = useAuthError();
 *
 *   if (!error) return null;
 *
 *   return (
 *     <Alert variant="error">
 *       {error}
 *     </Alert>
 *   );
 * }
 * ```
 */
export const useAuthError = (): string | null => {
  const { error } = useAuth();
  return error;
};

export default useAuth;