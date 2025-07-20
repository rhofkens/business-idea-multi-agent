import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

/**
 * LoginForm component for user authentication.
 *
 * @description
 * This component provides a complete login interface for the Business Idea Generator application.
 * It includes form inputs for email and password, error handling, loading states, and displays
 * test account credentials for development purposes.
 *
 * Features:
 * - Email and password input fields with validation
 * - Loading state management during authentication
 * - Error display for failed login attempts
 * - Test account information display
 * - Responsive design using Tailwind CSS
 * - Accessible form controls with proper labels
 *
 * @example
 * ```tsx
 * // Use in a page or layout component
 * import LoginForm from '@/components/LoginForm';
 *
 * function LoginPage() {
 *   return <LoginForm />;
 * }
 * ```
 *
 * @returns {JSX.Element} The rendered login form component
 */
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, authState } = useAuthContext();
  const isLoading = authState.isLoading;
  const error = authState.error;

  /**
   * Handles form submission for user login.
   *
   * @description
   * Prevents default form submission, calls the login function from useAuth hook
   * with the current email and password state values. The actual navigation is
   * handled by the authentication context upon successful login.
   *
   * @param {React.FormEvent} e - The form submission event
   * @returns {Promise<void>} Promise that resolves when login attempt completes
   */
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 LoginForm.handleSubmit() called');
    e.preventDefault();
    console.log('🔄 Starting login process...', { email, password: '***' });

    try {
      console.log('🔄 Calling login with credentials object...');
      await login({ email, password });
      console.log('✅ Login completed in form handler');
      
      // Redirect to main page after successful login
      console.log('🔄 Redirecting to main page...');
      navigate('/');
      console.log('✅ Navigation to main page initiated');
    } catch (err) {
      console.error('❌ Login error in form handler:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Business Idea Generator</CardTitle>
            <CardDescription>
              Sign in to your account to generate and analyze business ideas
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Test accounts:</p>
                <ul className="mt-2 space-y-1">
                  <li>admin@test.com (Admin)</li>
                  <li>user@test.com (User)</li>
                  <li>guest@test.com (Guest)</li>
                </ul>
                <p className="mt-2">Password: password123</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;