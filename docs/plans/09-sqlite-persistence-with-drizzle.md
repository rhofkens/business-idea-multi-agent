# Plan: SQLite Persistence with Drizzle ORM

## Overview
Add persistence layer to the business idea generation system using SQLite and Drizzle ORM. This will allow storing generated ideas, tracking runs, and enabling users to view historical data.

## Goals
1. Persist all generated business ideas to a SQLite database
2. Track orchestrator runs per user
3. Enable starring/favoriting ideas
4. Support filtering by current run or all historical data
5. Store documentation paths for each idea and run

## Database Schema Design

### Tables

#### 1. runs
Tracks each orchestrator execution session.
```sql
runs {
  id: text (ULID) PRIMARY KEY
  userId: text NOT NULL
  preferences: text (JSON) NOT NULL
  fullDocumentPath: text (nullable)
  createdAt: integer (timestamp) NOT NULL
  updatedAt: integer (timestamp) NOT NULL
}
```

#### 2. ideas
Stores all business ideas with their evolution through different stages.
```sql
ideas {
  id: text (ULID) PRIMARY KEY -- Use existing ULID from BusinessIdea
  runId: text NOT NULL REFERENCES runs(id)
  userId: text NOT NULL
  title: text NOT NULL
  description: text NOT NULL
  businessModel: text NOT NULL
  disruptionPotential: integer NOT NULL
  marketPotential: integer NOT NULL
  technicalComplexity: integer NOT NULL
  capitalIntensity: integer NOT NULL
  blueOceanScore: integer (nullable)
  overallScore: integer (nullable)
  reasoning: text (JSON) NOT NULL
  competitorAnalysis: text (nullable)
  criticalAnalysis: text (nullable)
  stage: text NOT NULL -- 'ideation' | 'competitor' | 'critic' | 'documented'
  starred: integer (boolean) NOT NULL DEFAULT 0
  documentPath: text (nullable)
  createdAt: integer (timestamp) NOT NULL
  updatedAt: integer (timestamp) NOT NULL
}

Indexes:
- idx_ideas_userId
- idx_ideas_runId
- idx_ideas_starred
```

## Directory Structure
```
packages/core/src/data/
├── db.ts               # Database connection singleton
├── schema.ts           # Drizzle schema definitions
└── repositories/
    ├── run-repository.ts
    └── idea-repository.ts
```

## Implementation Details

### Phase 1: Database Setup

#### 1.1 Dependencies
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

#### 1.2 Database Connection (db.ts)
```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('business-ideas.db');
export const db = drizzle(sqlite, { schema });
```

#### 1.3 Schema Definition (schema.ts)
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

### Phase 2: Repository Layer

#### 2.1 RunRepository
```typescript
interface RunRepository {
  createRun(userId: string, preferences: BusinessPreferences): Promise<Run>;
  getRunsByUser(userId: string): Promise<Run[]>;
  getLatestRun(userId: string): Promise<Run | null>;
  updateRunDocumentPath(runId: string, documentPath: string): Promise<void>;
}
```

#### 2.2 IdeaRepository
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

### Phase 3: Orchestrator Integration

#### 3.1 Modify agent-orchestrator.ts
- Create a new run when orchestration starts
- Pass runId through orchestrator context
- Store runId in context for all steps

#### 3.2 Update Step Functions

**ideation-step.ts**
- After generating each refined idea, call `ideaRepository.createIdea()`
- Use existing idea.id (ULID) as primary key

**competitor-step.ts**
- Update each idea with competitor analysis using `ideaRepository.updateIdeaStage()`

**critic-step.ts**
- Update each idea with critical analysis using `ideaRepository.updateIdeaStage()`

**documentation-step.ts**
- Store individual idea document paths using `ideaRepository.updateIdeaDocumentPath()`
- Store full report path using `runRepository.updateRunDocumentPath()`

### Phase 4: API Endpoints

#### 4.1 Routes (ideas-routes.ts)
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

### Phase 5: Frontend Integration

#### 5.1 SmartTable Updates
- When "Current Run Only" toggle is OFF: fetch ideas from `/api/ideas`
- When toggle is ON: use existing WebSocket event data
- No merging of data - two distinct states

#### 5.2 API Service
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

### Phase 6: Database Migrations

#### 6.1 Drizzle Config
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

#### 6.2 Migration Scripts
Add to package.json:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit migrate:sqlite"
  }
}
```

## Key Decisions

1. **No new ID generation**: Use existing ULID from BusinessIdea as primary key
2. **Simple starring**: Boolean flag on ideas table, no separate favorites table
3. **Stage tracking**: Simple enum to track idea progress through agents
4. **Document paths**: Store both individual idea docs and full report path
5. **No transactions**: Keep operations simple and atomic
6. **No cleanup**: Retain all historical data

## Testing Strategy

1. Unit tests for repositories
2. Integration tests for API endpoints
3. Manual testing of frontend toggle behavior
4. Migration rollback testing

## Documentation Updates

1. Add database setup instructions to README
2. Document new API endpoints in api-reference.md
3. Update frontend integration guide
4. Add troubleshooting section for common database issues