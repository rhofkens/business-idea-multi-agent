/**
 * Initialize database script
 * 
 * This script creates the database tables using drizzle-orm directly.
 * It's a workaround for the npm workspace hoisting issue with drizzle-kit.
 */

import { sql } from 'drizzle-orm';
import { db } from './db.js';

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create runs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        preferences TEXT NOT NULL,
        fullDocumentPath TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);
    
    // Create ideas table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        runId TEXT NOT NULL,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        businessModel TEXT NOT NULL,
        disruptionPotential INTEGER NOT NULL,
        marketPotential INTEGER NOT NULL,
        technicalComplexity INTEGER NOT NULL,
        capitalIntensity INTEGER NOT NULL,
        blueOceanScore INTEGER,
        overallScore INTEGER,
        reasoning TEXT NOT NULL,
        competitorAnalysis TEXT,
        criticalAnalysis TEXT,
        stage TEXT NOT NULL,
        starred INTEGER NOT NULL DEFAULT 0,
        documentPath TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (runId) REFERENCES runs(id)
      )
    `);
    
    // Create indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_runs_userId ON runs(userId)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ideas_runId ON ideas(runId)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ideas_userId ON ideas(userId)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_ideas_starred ON ideas(starred)`);
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase().then(() => process.exit(0));
}

export { initDatabase };