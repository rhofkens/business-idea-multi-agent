import type { ConsoleEvent } from '@business-idea/shared';

/**
 * Service for capturing console output during agent execution.
 * Implements the pattern defined in ADR-005.
 */
export class ConsoleCaptureService {
  private originalMethods: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };
  
  private isIntercepting = false;
  
  constructor() {
    // Store original console methods
    this.originalMethods = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };
  }
  
  /**
   * Intercept console methods and capture output
   * 
   * @param agentName - Name of the agent being executed
   * @param callback - Function to call with captured console events
   */
  intercept(agentName: string, callback: (event: ConsoleEvent) => void): void {
    if (this.isIntercepting) {
      this.originalMethods.warn('Console capture already active, ignoring new intercept request');
      return;
    }
    
    this.isIntercepting = true;
    
    // Intercept console.log
    console.log = (...args: unknown[]): void => {
      this.originalMethods.log(...args); // Preserve original functionality
      this.captureEvent('log', agentName, args, callback);
    };
    
    // Intercept console.warn
    console.warn = (...args: unknown[]): void => {
      this.originalMethods.warn(...args); // Preserve original functionality
      this.captureEvent('warn', agentName, args, callback);
    };
    
    // Intercept console.error
    console.error = (...args: unknown[]): void => {
      this.originalMethods.error(...args); // Preserve original functionality
      this.captureEvent('error', agentName, args, callback);
    };
  }
  
  /**
   * Restore original console methods
   */
  restore(): void {
    if (!this.isIntercepting) {
      return;
    }
    
    console.log = this.originalMethods.log;
    console.warn = this.originalMethods.warn;
    console.error = this.originalMethods.error;
    
    this.isIntercepting = false;
  }
  
  /**
   * Capture and format console event
   */
  private captureEvent(
    level: 'log' | 'warn' | 'error',
    agentName: string,
    args: unknown[],
    callback: (event: ConsoleEvent) => void
  ): void {
    const event: ConsoleEvent = {
      level,
      agentName,
      message: this.formatMessage(args),
      timestamp: new Date().toISOString()
    };
    
    try {
      callback(event);
    } catch (error) {
      // Use original method to avoid infinite loop
      this.originalMethods.error('Error in console capture callback:', error);
    }
  }
  
  /**
   * Format console arguments into a single message string
   */
  private formatMessage(args: unknown[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }
  
  /**
   * Ensure console is restored even if an error occurs
   * Useful for wrapping agent execution
   */
  async withCapture<T>(
    agentName: string,
    callback: (event: ConsoleEvent) => void,
    fn: () => Promise<T>
  ): Promise<T> {
    this.intercept(agentName, callback);
    try {
      return await fn();
    } finally {
      this.restore();
    }
  }
}

// Export singleton instance
export const consoleCaptureService = new ConsoleCaptureService();