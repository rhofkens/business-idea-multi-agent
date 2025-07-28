import { db } from '../db.js';
import { runs, type Run, type NewRun } from '../schema.js';
import { eq, desc } from 'drizzle-orm';
import { ulid } from 'ulidx';
import type { BusinessPreferences } from '@business-idea/shared';

export interface RunRepository {
  createRun(userId: string, preferences: BusinessPreferences): Promise<Run>;
  getRunsByUser(userId: string): Promise<Run[]>;
  getLatestRun(userId: string): Promise<Run | null>;
  updateRunDocumentPath(runId: string, documentPath: string): Promise<void>;
}

export class RunRepositoryImpl implements RunRepository {
  async createRun(userId: string, preferences: BusinessPreferences): Promise<Run> {
    const now = new Date();
    const newRun: NewRun = {
      id: ulid(),
      userId,
      preferences: JSON.stringify(preferences),
      fullDocumentPath: null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert without transaction per ADR-009
    await db.insert(runs).values(newRun);

    // Return the created run
    const [createdRun] = await db
      .select()
      .from(runs)
      .where(eq(runs.id, newRun.id));

    return createdRun;
  }

  async getRunsByUser(userId: string): Promise<Run[]> {
    return await db
      .select()
      .from(runs)
      .where(eq(runs.userId, userId))
      .orderBy(desc(runs.createdAt));
  }

  async getLatestRun(userId: string): Promise<Run | null> {
    const [latestRun] = await db
      .select()
      .from(runs)
      .where(eq(runs.userId, userId))
      .orderBy(desc(runs.createdAt))
      .limit(1);

    return latestRun || null;
  }

  async updateRunDocumentPath(runId: string, documentPath: string): Promise<void> {
    await db
      .update(runs)
      .set({
        fullDocumentPath: documentPath,
        updatedAt: new Date(),
      })
      .where(eq(runs.id, runId));
  }
}

// Export singleton instance
export const runRepository = new RunRepositoryImpl();