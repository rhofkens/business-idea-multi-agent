# Step 09: SQLite Persistence with Drizzle - Task List

This task list implements the SQLite persistence layer as detailed in `docs/plans/09-sqlite-persistence-with-drizzle.md`.

## Phase 1: Database Setup

### Task 1.1: Install Dependencies
Add to `packages/core/package.json`:
```json
{
  "dependencies": {
    "drizzle-orm": "latest",
    "better-sqlite3": "latest"
  },
  "devDependencies": {
    "@types/better-sqlite3": "latest",
    "drizzle-kit": "latest"
  }
}
```

### Task 1.2: Create Database Connection
Create `packages/core/src/data/db.ts`:
```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('business-ideas.db');
export const db = drizzle(sqlite, { schema });
```
- Add `.gitignore` entry for `business-ideas.db`

### Task 1.3: Define Schema
Create `packages/core/src/data/schema.ts`:
```typescript
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
  // ... all BusinessIdea fields
  stage: text('stage').notNull(),
  starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
  documentPath: text('documentPath'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});
```
Note: Complete the ideas table with all BusinessIdea fields from the schema section (title, description, businessModel, disruptionPotential, marketPotential, technicalComplexity, capitalIntensity, blueOceanScore, overallScore, reasoning, competitorAnalysis, criticalAnalysis)

## Phase 2: Repository Implementation

### Task 2.1: Create RunRepository
Implement `packages/core/src/data/repositories/run-repository.ts` with interface:
```typescript
interface RunRepository {
  createRun(userId: string, preferences: BusinessPreferences): Promise<Run>;
  getRunsByUser(userId: string): Promise<Run[]>;
  getLatestRun(userId: string): Promise<Run | null>;
  updateRunDocumentPath(runId: string, documentPath: string): Promise<void>;
}
```
- Use Drizzle query builder, no transactions per ADR-009

### Task 2.2: Create IdeaRepository  
Implement `packages/core/src/data/repositories/idea-repository.ts` with interface:
```typescript
interface IdeaRepository {
  createIdea(runId: string, userId: string, idea: BusinessIdea): Promise<void>;
  updateIdeaStage(ideaId: string, stage: IdeaStage, data: Partial<BusinessIdea>): Promise<void>;
  updateIdeaDocumentPath(ideaId: string, documentPath: string): Promise<void>;
  getIdeasByRun(runId: string): Promise<BusinessIdea[]>;
  getIdeasByUser(userId: string, starred?: boolean): Promise<BusinessIdea[]>;
  getIdeaById(ideaId: string): Promise<BusinessIdea | null>;
  setStarred(ideaId: string, starred: boolean): Promise<void>;
}
```
- Ensure ULID from BusinessIdea is used as primary key

## Phase 3: Orchestrator Integration

### Task 3.1: Update AgentOrchestrator
- Modify `packages/core/src/orchestrator/agent-orchestrator.ts`
- Create run at start, pass runId through context
- Import and initialize repositories

### Task 3.2: Update Step Functions
- Modify each step file in `packages/core/src/orchestrator/steps/`:
  - `ideation-step.ts`: Call createIdea after refinement
  - `competitor-step.ts`: Call updateIdeaStage with competitor data
  - `critic-step.ts`: Call updateIdeaStage with critic data
  - `documentation-step.ts`: Store document paths

## Phase 4: API Routes

### Task 4.1: Create Ideas Routes
Create `packages/core/src/routes/ideas-routes.ts`:
```typescript
// GET /api/ideas
// Query params: ?starred=true
async function getIdeas(request, reply) {
  const userId = request.session.userId;
  const starred = request.query.starred;
  const ideas = await ideaRepository.getIdeasByUser(userId, starred);
  return { ideas };
}

// GET /api/ideas/:id
async function getIdea(request, reply) {
  const idea = await ideaRepository.getIdeaById(request.params.id);
  return { idea };
}

// POST /api/ideas/:id/star
// Body: { starred: boolean }
async function starIdea(request, reply) {
  await ideaRepository.setStarred(request.params.id, request.body.starred);
  return { success: true };
}

// GET /api/runs
async function getRuns(request, reply) {
  const userId = request.session.userId;
  const runs = await runRepository.getRunsByUser(userId);
  return { runs };
}
```
- Use Fastify patterns from coding guidelines

### Task 4.2: Register Routes
- Add ideas routes to server configuration
- Ensure session middleware is applied

## Phase 5: Frontend Integration

### Task 5.1: Create Ideas Service
Create `packages/web/src/services/ideas-service.ts`:
```typescript
// services/ideas-service.ts
export const ideasService = {
  async getIdeas(starred?: boolean): Promise<BusinessIdea[]> {
    const params = starred !== undefined ? `?starred=${starred}` : '';
    const response = await fetch(`/api/ideas${params}`);
    return response.json();
  },
  
  async starIdea(ideaId: string, starred: boolean): Promise<void> {
    await fetch(`/api/ideas/${ideaId}/star`, {
      method: 'POST',
      body: JSON.stringify({ starred })
    });
  }
};
```

### Task 5.2: Update SmartTable
- Modify `packages/web/src/components/SmartTable.tsx`
- When "Current Run Only" toggle is OFF: fetch ideas from `/api/ideas`
- When toggle is ON: use existing WebSocket event data
- No merging of data - two distinct states

## Phase 6: Database Configuration

### Task 6.1: Create Drizzle Config
Create `packages/core/drizzle.config.ts`:
```typescript
// drizzle.config.ts
export default {
  schema: './src/data/schema.ts',
  out: './migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './business-ideas.db',
  },
};
```

### Task 6.2: Add Migration Scripts
Add to `packages/core/package.json`:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit migrate:sqlite"
  }
}
```
- Test migration generation and execution

## Testing & Documentation

### Task 7.1: Manual Testing
- Test complete flow: idea generation → persistence → retrieval
- Verify starring functionality
- Test current run vs historical data toggle

### Task 7.2: Update Documentation
- Add database setup to main README
- Document new API endpoints
- Note ADR-009 decision on no transactions

## Key Implementation Notes
1. **No new ID generation**: Use existing ULID from BusinessIdea as primary key
2. **Simple starring**: Boolean flag on ideas table, no separate favorites table
3. **Stage tracking**: Simple enum to track idea progress through agents ('ideation' | 'competitor' | 'critic' | 'documented')
4. **Document paths**: Store both individual idea docs and full report path
5. **No transactions**: Keep operations simple and atomic per ADR-009
6. **No cleanup**: Retain all historical data
7. **WebSocket events continue**: Ensure real-time updates work alongside persistence