# Implementation Plan: ULID-based Unique Identifiers for Business Ideas

## Executive Summary

This plan details the implementation of unique identifiers for business ideas using ULID (Universally Unique Lexicographically Sortable Identifier) format. The primary goal is to enable reliable tracking of ideas as they progress through the agent pipeline (ideation → competitor → critic → documentation) and support accurate UI updates in the SmartTable component.

## Problem Statement

Currently, business ideas lack persistent unique identifiers:
- Frontend uses temporary numeric IDs that are not preserved across agent stages
- Backend doesn't track ideas with consistent identifiers
- UI cannot reliably update specific ideas as they progress through analysis
- No way to correlate ideas between different agent outputs

## Solution Overview

Implement ULID-based unique identifiers that:
- Are generated when ideas are first created in the ideation agent
- Are preserved immutably through all downstream agents
- Enable reliable tracking and UI updates
- Follow the established pattern from ADR-003

## Detailed Implementation Plan

### Phase 1: Core Type Updates (Breaking Change)

#### 1.1 Install Dependencies

**Files to modify:**
- `packages/shared/package.json`
- `packages/core/package.json`

**Changes:**
```json
{
  "dependencies": {
    "ulidx": "^2.1.0"
  }
}
```

#### 1.2 Update Shared Types

**File: `packages/shared/src/types/business-idea.ts`**

Add the `id` field to the BusinessIdea interface:
```typescript
export interface BusinessIdea {
  /** Unique identifier in ULID format */
  id: string;
  title: string;
  description: string;
  businessModel: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'SaaS' | 'DTC';
  // ... rest of the fields remain unchanged
}
```

#### 1.3 Update Zod Schema

**File: `packages/shared/src/types/business-idea-schema.ts`**

```typescript
import { z } from 'zod';

// ULID validation regex
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export const businessIdeaSchema = z.object({
  id: z.string().regex(ULID_REGEX, 'Invalid ULID format'),
  title: z.string(),
  description: z.string(),
  // ... rest of the schema remains unchanged
});
```

### Phase 2: Backend Implementation

#### 2.1 Update Ideation Agent

**File: `packages/core/src/agents/ideation-agent.ts`**

**Imports:**
```typescript
import { ulid } from 'ulidx';
```

**Update system prompt (lines 14-76):**
Add ID field requirements to the prompt:
```typescript
const systemPrompt = `
You are an elite business strategist and innovation expert...

CRITICAL REQUIREMENTS:
- Each idea MUST have a unique "id" field
- The "id" field will be provided to you - YOU MUST NOT GENERATE OR MODIFY IT
- IDs are IMMUTABLE - always preserve the exact ID provided
- Output ONLY valid JSON with no additional text, markdown, or explanations
- The root object MUST have a single key "ideas"
- Each object in the "ideas" array MUST conform exactly to this structure:

{
  "id": "string - REQUIRED - The unique identifier provided (DO NOT MODIFY)",
  "title": "string - A compelling, memorable name that captures the essence of the innovation",
  // ... rest of the structure
}
`;
```

**Update refinement prompt (lines 78-106):**
```typescript
const refinementPrompt = `
You are a world-class business strategist...

CRITICAL ID PRESERVATION:
- Each idea has a unique "id" field that MUST BE PRESERVED EXACTLY
- Do NOT generate new IDs or modify existing ones
- The "id" field is immutable and must be copied exactly as provided
- When refining ideas, maintain the same ID for each corresponding idea

You MUST output a valid JSON object with a single key "ideas" containing the refined array...
`;
```

**Modify idea generation logic:**

In the `executeIdeationAgent` function, we need to inject IDs before sending to the LLM:

```typescript
async function* executeIdeationAgent(
  preferences: BusinessPreferences,
): AsyncGenerator<StreamEvent, void, unknown> {
  yield { type: 'status', data: 'Generating initial business ideas...' };
  
  // Generate 10 unique IDs upfront
  const ideaIds = Array.from({ length: 10 }, () => ulid());
  
  const userPrompt = `Generate business ideas for the following preferences:
    Vertical: ${preferences.vertical}
    Sub-Vertical: ${preferences.subVertical}
    Business Model: ${preferences.businessModel}
    
    IMPORTANT: Use these exact IDs for the 10 ideas (in order):
    ${ideaIds.map((id, index) => `${index + 1}. "${id}"`).join('\n')}
    
    Each idea MUST use the corresponding ID from this list. Do not modify or regenerate these IDs.`;

  // ... rest of the implementation
}
```

#### 2.2 Update Competitor Agent

**File: `packages/core/src/agents/competitor-agent.ts`**

**Update system prompt (lines 12-50):**
```typescript
const competitorAnalysisPrompt = `
You are a market research expert specializing in competitive analysis and Blue Ocean strategy.

CRITICAL ID PRESERVATION:
- Each business idea has a unique "id" field that MUST BE PRESERVED
- Copy the "id" field exactly as provided - do not modify it
- The "id" is immutable and serves as the primary identifier

Your task is to analyze a single business idea and provide:
1. A comprehensive competitor analysis
2. A Blue Ocean score based on the methodology

Return your analysis as a JSON object with these fields:
{
  "id": "Original id - MUST BE PRESERVED EXACTLY",
  "title": "Original title",
  // ... rest of the structure
}
`;
```

**Update `analyzeSingleIdea` function (lines 65-112):**
```typescript
async function analyzeSingleIdea(idea: BusinessIdea): Promise<BusinessIdea> {
  const agent = createCompetitorAgent();
  
  const promptText = `
Analyze this business idea for competitors and calculate the Blue Ocean score.

CRITICAL: The idea has ID "${idea.id}" - you MUST preserve this exact ID in your response.

${JSON.stringify(idea, null, 2)}

Perform web searches to gather competitive intelligence, then provide your analysis.
Remember to include the exact ID in your response.
`;

  // ... rest of implementation ensures ID is preserved
}
```

#### 2.3 Update Critic Agent

**File: `packages/core/src/agents/critic-agent.ts`**

**Update system prompt (lines 13-71):**
```typescript
const criticalEvaluationPrompt = `
You are a business critic expert specializing in risk assessment...

CRITICAL ID PRESERVATION:
- Each business idea has a unique "id" field that MUST BE PRESERVED
- Copy the "id" field exactly as provided - do not modify it
- The "id" is immutable and serves as the primary identifier

Return your analysis as a JSON object with these fields:
{
  "id": "Original id - MUST BE PRESERVED EXACTLY",
  "title": "Original title",
  // ... rest of the structure
}
`;
```

#### 2.4 Update Documentation Agent

**File: `packages/core/src/agents/documentation-agent.ts`**

Similar updates to preserve the ID field through documentation generation.

### Phase 3: Frontend Updates

#### 3.1 Update SmartTable Component

**File: `packages/web/src/components/SmartTable.tsx`**

**Update interface (lines 35-63):**
```typescript
interface BusinessIdea {
  id: string; // Changed from number to string
  starred: boolean;
  title: string;
  // ... rest of the interface
}
```

**Update star toggle logic (line 201):**
```typescript
onClick={() => onStarToggle(idea.id)} // Now passes string ID
```

**Update table cell rendering (lines 215-217):**
```typescript
<TableCell className="font-medium text-sm">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{idea.id.slice(0, 8)}...</span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-mono text-xs">{idea.id}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</TableCell>
```

#### 3.2 Update Index Page

**File: `packages/web/src/pages/Index.tsx`**

**Update interface (lines 20-48):**
```typescript
interface BusinessIdea {
  id: string; // Changed from number to string
  // ... rest of the interface
}
```

**Update handleStarToggle (lines 231-235):**
```typescript
const handleStarToggle = (id: string) => {
  setIdeas(prev => prev.map(idea => 
    idea.id === id ? { ...idea, starred: !idea.starred } : idea
  ));
};
```

**Update mock data (lines 114-173):**
```typescript
const mockIdeas: BusinessIdea[] = [
  {
    id: '01HQ8X5K4MR6YH0XN5ZVQKX123', // ULID format
    starred: true,
    title: "AI-Powered Personal Finance Coach",
    // ... rest of the data
  },
  {
    id: '01HQ8X5K4MR6YH0XN5ZVQKX124', // ULID format
    starred: false,
    title: "Smart Contract Insurance Platform",
    // ... rest of the data
  },
];
```

### Phase 4: WebSocket Event Updates

#### 4.1 Update Event Metadata

**File: `packages/shared/src/types/websocket-events.ts`**

Update the metadata type to include idea IDs:
```typescript
export interface WorkflowEvent {
  // ... existing fields
  metadata?: {
    /** Progress percentage (0-100) for progress events */
    progress?: number;
    
    /** Current stage of execution */
    stage?: string;
    
    /** Additional data specific to the event type */
    data?: {
      /** ID of the business idea being processed */
      ideaId?: string;
      // ... other fields
    };
  };
}
```

#### 4.2 Update Agent Orchestrator

**File: `packages/core/src/orchestrator/agent-orchestrator.ts`**

Update event emissions to include idea IDs in metadata for tracking.

### Phase 5: Test Data Updates

#### 5.1 Update Test Cache Files

Update any cached test data files to include ULID-formatted IDs:
- `ideation-ideas.json`
- `competitor-ideas.json`
- `critic-ideas.json`
- `documentation-output.json`

### Phase 6: Testing Strategy

#### 6.1 Unit Tests
- Test ULID generation in ideation agent
- Test ID preservation in each agent
- Test Zod schema validation for ID format

#### 6.2 Integration Tests
- Test complete flow from ideation to documentation
- Verify IDs are preserved throughout
- Test WebSocket events contain correct IDs

#### 6.3 Manual Testing
- Generate new ideas and verify IDs appear
- Check ID preservation through all stages

### Migration Considerations

Since this is a breaking change:
1. Existing cached data will become invalid
2. Any running sessions will need to be restarted
3. Frontend localStorage may need to be cleared

### Documentation Updates

1. Update API documentation to include ID field
2. Add notes about ID immutability in agent documentation
3. Update WebSocket event documentation

### Success Criteria

1. ✅ All ideas have unique ULID identifiers
2. ✅ IDs are preserved through entire agent pipeline
3. ✅ All tests pass
4. ✅ No regression in existing functionality

### Rollback Plan

If issues arise:
1. Revert type changes in shared package
2. Revert agent prompt changes
3. Revert frontend changes
4. Clear any corrupted cache data

### Timeline Estimate

- Phase 1 (Core Types): 1 hour
- Phase 2 (Backend): 2-3 hours
- Phase 3 (Frontend): 1-2 hours
- Phase 4 (WebSocket): 1 hour
- Phase 5 (Test Data): 30 minutes
- Phase 6 (Testing): 2 hours

**Total: 7.5-9.5 hours**