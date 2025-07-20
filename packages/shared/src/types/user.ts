/**
 * User role types for authentication and authorization
 */
export type UserRole = 'admin' | 'user' | 'guest';

/**
 * User interface representing a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  
  /** Username for authentication */
  username: string;
  
  /** Email address */
  email: string;
  
  /** User role for authorization */
  role: UserRole;
  
  /** Timestamp when the user was created */
  createdAt: Date;
  
  /** Timestamp when the user was last updated */
  updatedAt: Date;
}
/**
 * User credentials for authentication
 */
export interface UserCredentials {
  /** Email for login */
  email: string;
  
  /** Password for authentication (plain text during login, hashed when stored) */
  password: string;
}

/**
 * Session user data (subset of User without sensitive fields)
 */
export interface SessionUser {
  /** User ID */
  id: string;
  
  /** Username */
  username: string;
  
  /** Email address */
  email: string;
  
  /** User role */
  role: UserRole;
}