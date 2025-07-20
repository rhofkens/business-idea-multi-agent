import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@business-idea/shared';
import { Loader2 } from 'lucide-react';

/**
 * Props for the ProtectedRoute component.
 *
 * @interface ProtectedRouteProps
 * @property {React.ReactNode} children - The content to render when access is granted
 * @property {UserRole} [requiredRole] - Optional specific role required to access the route
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute component for securing application routes.
 *
 * @description
 * This component acts as a wrapper for protected content, ensuring that only
 * authenticated users (and optionally users with specific roles) can access
 * certain routes. It handles loading states, authentication checks, and
 * role-based access control.
 *
 * Features:
 * - Shows loading spinner during authentication check
 * - Redirects unauthenticated users to login page
 * - Preserves the intended destination for post-login redirect
 * - Enforces role-based access control when required
 * - Displays access denied message for unauthorized users
 *
 * @example
 * ```tsx
 * // Basic usage - requires authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // With role requirement
 * <ProtectedRoute requiredRole={UserRole.ADMIN}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 *
 * @param {ProtectedRouteProps} props - The component props
 * @returns {JSX.Element} Protected content, loading state, redirect, or access denied message
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;