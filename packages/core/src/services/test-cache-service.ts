import { promises as fs } from 'fs';
import path from 'path';
import { WebSocketSessionManager } from './websocket-session-manager.js';
import type { WorkflowEvent } from '@business-idea/shared';

export interface TestCacheConfig {
  enabled: boolean;
  fileName: string;
  sessionId?: string;
}

export class TestCacheService {
  private static readonly TEST_CACHE_DIR = '../../tests/cache';
  private static wsManager = WebSocketSessionManager.getInstance();

  /**
   * Helper to emit test cache events via WebSocket
   */
  private static emitCacheEvent(
    message: string,
    level: WorkflowEvent['level'] = 'info',
    _sessionId?: string
  ): void {
    const event: WorkflowEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'log',
      agentName: 'TestCache',
      level,
      message: `🧪 ${message}`
    };
    
    this.wsManager.broadcastWorkflowEvent(event);
  }

  static async loadOrExecute<T>(
    config: TestCacheConfig,
    executor: () => Promise<T>
  ): Promise<T> {
    if (!config.enabled) {
      return executor();
    }

    const filePath = path.join(this.TEST_CACHE_DIR, config.fileName);
    console.log(`[TestCache] Using cache file: ${filePath}`);

    try {
      // Try to read from cache
      const cachedData = await fs.readFile(filePath, 'utf-8');
      const message = `Loading from cache: ${config.fileName}`;
      console.log(`[TestCache] ${message}`);
      
      // Emit WebSocket event for cache load
      this.emitCacheEvent(message, 'info', config.sessionId);
      
      return JSON.parse(cachedData) as T;
    } catch (_error) {
      // Cache doesn't exist, execute and save
      const message = `Cache miss, executing: ${config.fileName}`;
      console.log(`[TestCache] ${message}`);
      
      // Emit WebSocket event for cache miss
      this.emitCacheEvent(message, 'warn', config.sessionId);
      
      const result = await executor();
      
      // Ensure directory exists
      await fs.mkdir(this.TEST_CACHE_DIR, { recursive: true });
      
      // Save to cache
      await fs.writeFile(filePath, JSON.stringify(result, null, 2));
      const saveMessage = `Saved to cache: ${config.fileName}`;
      console.log(`[TestCache] ${saveMessage}`);
      
      // Emit WebSocket event for cache save
      this.emitCacheEvent(saveMessage, 'info', config.sessionId);
      
      return result;
    }
  }

  static async clearCache(fileName?: string): Promise<void> {
    if (fileName) {
      const filePath = path.join(this.TEST_CACHE_DIR, fileName);
      try {
        await fs.unlink(filePath);
        console.log(`[TestCache] Cleared cache: ${fileName}`);
      } catch (_error) {
        // File doesn't exist, ignore
      }
    } else {
      // Clear entire cache directory
      try {
        await fs.rm(this.TEST_CACHE_DIR, { recursive: true, force: true });
        console.log('[TestCache] Cleared all cache');
      } catch (_error) {
        // Directory doesn't exist, ignore
      }
    }
  }
}