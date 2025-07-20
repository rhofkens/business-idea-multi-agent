import { User, UserCredentials } from '@business-idea/shared';
import bcrypt from 'bcrypt';

/**
 * In-memory user store for development and testing.
 *
 * This class implements a simple in-memory storage solution for user data,
 * suitable for development, testing, and proof-of-concept applications.
 * It uses the Singleton pattern to ensure a single instance across the application.
 *
 * Features:
 * - Password hashing with bcrypt (10 salt rounds)
 * - Pre-initialized test users for development
 * - CRUD operations for user management
 * - Credential validation
 *
 * Test Users:
 * - admin@test.com / admin123 (role: admin)
 * - user@test.com / user123 (role: user)
 * - guest@test.com / guest123 (role: guest)
 *
 * @warning In production, this should be replaced with a proper database
 *          implementation using PostgreSQL, MongoDB, or similar.
 */
export class UserStore {
  private static instance: UserStore;
  private users: Map<string, User & { password: string }> = new Map();
  private idCounter = 1;

  private constructor() {
    // Initialize with test users
    this.initializeTestUsers();
  }

  /**
   * Get the singleton instance of UserStore.
   *
   * Ensures that only one instance of the user store exists throughout
   * the application lifecycle, maintaining consistent user data.
   *
   * @returns {UserStore} The singleton instance of UserStore
   *
   * @example
   * ```typescript
   * const userStore = UserStore.getInstance();
   * const user = await userStore.findByEmail('admin@test.com');
   * ```
   */
  public static getInstance(): UserStore {
    if (!UserStore.instance) {
      UserStore.instance = new UserStore();
    }
    return UserStore.instance;
  }

  /**
   * Initialize test users for development.
   *
   * Creates three test users with different roles for testing various
   * authentication and authorization scenarios. Each user has their
   * password hashed using bcrypt with 10 salt rounds.
   *
   * Test Users:
   * - admin@test.com (password: admin123) - Full admin privileges
   * - user@test.com (password: user123) - Standard user privileges
   * - guest@test.com (password: guest123) - Limited guest privileges
   *
   * @private
   * @returns {Promise<void>}
   */
  private async initializeTestUsers(): Promise<void> {
    const saltRounds = 10;

    // Admin user
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    this.users.set('admin@test.com', {
      id: String(this.idCounter++),
      email: 'admin@test.com',
      username: 'admin',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      password: adminPassword
    });

    // Regular user
    const userPassword = await bcrypt.hash('user123', saltRounds);
    this.users.set('user@test.com', {
      id: String(this.idCounter++),
      email: 'user@test.com',
      username: 'user',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      password: userPassword
    });

    // Guest user
    const guestPassword = await bcrypt.hash('guest123', saltRounds);
    this.users.set('guest@test.com', {
      id: String(this.idCounter++),
      email: 'guest@test.com',
      username: 'guest',
      role: 'guest',
      createdAt: new Date(),
      updatedAt: new Date(),
      password: guestPassword
    });
  }

  /**
   * Find a user by email address.
   *
   * Searches for a user in the store by their email address.
   * Returns the user data without the password field for security.
   *
   * @param {string} email - The email address to search for
   * @returns {Promise<User | null>} The user object without password, or null if not found
   *
   * @example
   * ```typescript
   * const user = await userStore.findByEmail('admin@test.com');
   * if (user) {
   *   console.log(`Found user: ${user.username} with role: ${user.role}`);
   * }
   * ```
   */
  public async findByEmail(email: string): Promise<User | null> {
    const userWithPassword = this.users.get(email);
    if (!userWithPassword) {
      return null;
    }

    // Return user without password
    const { password: _password, ...user } = userWithPassword;
    return user;
  }

  /**
   * Validate user credentials.
   *
   * Verifies that the provided email and password match a user in the store.
   * Uses bcrypt to securely compare the provided password with the stored hash.
   *
   * @param {UserCredentials} credentials - Object containing email and password
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's plain text password
   * @returns {Promise<User | null>} The authenticated user without password, or null if invalid
   *
   * @example
   * ```typescript
   * const credentials = { email: 'admin@test.com', password: 'admin123' };
   * const user = await userStore.validateCredentials(credentials);
   * if (user) {
   *   console.log('Login successful!');
   * } else {
   *   console.log('Invalid credentials');
   * }
   * ```
   */
  public async validateCredentials(credentials: UserCredentials): Promise<User | null> {
    const userWithPassword = this.users.get(credentials.email);
    if (!userWithPassword) {
      return null;
    }

    const isValid = await bcrypt.compare(credentials.password, userWithPassword.password);
    if (!isValid) {
      return null;
    }

    // Return user without password
    const { password: _password, ...user } = userWithPassword;
    return user;
  }

  /**
   * Get a user by their unique ID.
   *
   * Searches through all users to find one matching the provided ID.
   * Returns the user data without the password field for security.
   *
   * @param {string} id - The unique user ID to search for
   * @returns {Promise<User | null>} The user object without password, or null if not found
   *
   * @example
   * ```typescript
   * const user = await userStore.findById('1');
   * if (user) {
   *   console.log(`Found user: ${user.email}`);
   * }
   * ```
   */
  public async findById(id: string): Promise<User | null> {
    for (const userWithPassword of this.users.values()) {
      if (userWithPassword.id === id) {
        const { password: _password, ...user } = userWithPassword;
        return user;
      }
    }
    return null;
  }

  /**
   * Create a new user (for testing purposes).
   *
   * Adds a new user to the store with the provided details.
   * The password is automatically hashed using bcrypt before storage.
   *
   * @param {string} email - Unique email address for the user
   * @param {string} username - Display username
   * @param {string} password - Plain text password (will be hashed)
   * @param {User['role']} role - User role: 'admin', 'user', or 'guest' (default: 'user')
   * @returns {Promise<User>} The created user object without password
   * @throws {Error} If a user with the same email already exists
   *
   * @example
   * ```typescript
   * try {
   *   const newUser = await userStore.create(
   *     'newuser@test.com',
   *     'newuser',
   *     'password123',
   *     'user'
   *   );
   *   console.log(`Created user with ID: ${newUser.id}`);
   * } catch (error) {
   *   console.error('User creation failed:', error.message);
   * }
   * ```
   */
  public async create(email: string, username: string, password: string, role: User['role'] = 'user'): Promise<User> {
    if (this.users.has(email)) {
      throw new Error('User with this email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser: User & { password: string } = {
      id: String(this.idCounter++),
      email,
      username,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: hashedPassword
    };

    this.users.set(email, newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Get all users (for testing purposes).
   *
   * Returns an array of all users in the store, with password fields removed.
   * Useful for debugging and testing scenarios.
   *
   * @returns {Promise<User[]>} Array of all users without passwords
   *
   * @example
   * ```typescript
   * const allUsers = await userStore.getAllUsers();
   * console.log(`Total users: ${allUsers.length}`);
   * allUsers.forEach(user => {
   *   console.log(`- ${user.email} (${user.role})`);
   * });
   * ```
   *
   * @warning This method should not be exposed in production APIs
   */
  public async getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    for (const userWithPassword of this.users.values()) {
      const { password: _password, ...user } = userWithPassword;
      users.push(user);
    }
    return users;
  }
}