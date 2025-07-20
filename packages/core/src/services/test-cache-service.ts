import { promises as fs } from 'fs';
import path from 'path';

export interface TestCacheConfig {
  enabled: boolean;
  fileName: string;
}

export class TestCacheService {
  private static readonly TEST_CACHE_DIR = 'tests/cache';

  static async loadOrExecute<T>(
    config: TestCacheConfig,
    executor: () => Promise<T>
  ): Promise<T> {
    if (!config.enabled) {
      return executor();
    }

    const filePath = path.join(this.TEST_CACHE_DIR, config.fileName);

    try {
      // Try to read from cache
      const cachedData = await fs.readFile(filePath, 'utf-8');
      console.log(`[TestCache] Loading from cache: ${config.fileName}`);
      return JSON.parse(cachedData) as T;
    } catch (_error) {
      // Cache doesn't exist, execute and save
      console.log(`[TestCache] Cache miss, executing: ${config.fileName}`);
      const result = await executor();
      
      // Ensure directory exists
      await fs.mkdir(this.TEST_CACHE_DIR, { recursive: true });
      
      // Save to cache
      await fs.writeFile(filePath, JSON.stringify(result, null, 2));
      console.log(`[TestCache] Saved to cache: ${config.fileName}`);
      
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