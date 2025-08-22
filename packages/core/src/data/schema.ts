import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  preferences: text('preferences').notNull(), // JSON string
  fullDocumentPath: text('fullDocumentPath'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const ideas = sqliteTable('ideas', {
  id: text('id').primaryKey(), // Use existing ULID from BusinessIdea
  runId: text('runId').notNull().references(() => runs.id),
  userId: text('userId').notNull(),
  
  // Core BusinessIdea fields
  title: text('title').notNull(),
  description: text('description').notNull(),
  businessModel: text('businessModel').notNull(),
  executionMode: text('executionMode'),
  disruptionPotential: integer('disruptionPotential').notNull(),
  marketPotential: integer('marketPotential').notNull(),
  technicalComplexity: integer('technicalComplexity').notNull(),
  capitalIntensity: integer('capitalIntensity').notNull(),
  blueOceanScore: integer('blueOceanScore'),
  overallScore: integer('overallScore'),
  
  // Reasoning fields (stored as JSON)
  reasoning: text('reasoning').notNull(), // JSON string
  
  // Analysis fields
  competitorAnalysis: text('competitorAnalysis'),
  criticalAnalysis: text('criticalAnalysis'),
  
  // Tracking fields
  stage: text('stage').notNull(), // 'ideation' | 'competitor' | 'critic' | 'documented'
  starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
  documentPath: text('documentPath'),
  
  // Timestamps
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Type exports for use in repositories
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

// Stage enum
export type IdeaStage = 'ideation' | 'competitor' | 'critic' | 'documented';