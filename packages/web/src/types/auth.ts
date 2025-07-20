import type { User, UserRole } from '@business-idea/shared';

/**
 * Authentication state for the frontend application
 */
export interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** The authenticated user, or null if not authenticated */
  user: User | null;
  /** Whether the authentication state is being loaded */
  isLoading: boolean;
  /** Any authentication error that occurred */
  error: string | null;
}

/**
 * Credentials for user login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Response from login API
 */
export interface LoginResponse {
  user: User;
  message: string;
}

/**
 * Response from logout API
 */
export interface LogoutResponse {
  message: string;
}

/**
 * Response from check authentication API
 */
export interface CheckAuthResponse {
  authenticated: boolean;
  user?: User;
}

/**
 * Context value for authentication
 */
export interface AuthContextValue {
  /** Current authentication state */
  authState: AuthState;
  /** Login function */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Check if user has a specific role */
  hasRole: (role: UserRole) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: UserRole[]) => boolean;
  /** Refresh authentication state */
  refreshAuth: () => Promise<void>;
}

/**
 * Props for components that require authentication
 */
export interface RequireAuthProps {
  /** Roles allowed to access this component */
  allowedRoles?: UserRole[];
  /** Component to render when not authenticated */
  fallback?: React.ComponentType;
  /** Whether to redirect to login when not authenticated */
  redirectToLogin?: boolean;
  /** Path to redirect to after login */
  redirectPath?: string;
}

/**
 * Props for protected routes
 */
export interface ProtectedRouteProps {
  /** Component to render when authenticated */
  children: React.ReactNode;
  /** Roles allowed to access this route */
  allowedRoles?: UserRole[];
  /** Path to redirect to when not authenticated */
  redirectTo?: string;
}