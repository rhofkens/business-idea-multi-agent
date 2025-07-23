# Step 5: SmartTable - Competitor Agent Integration Tasks

## Overview
This document provides detailed sub-tasks for implementing competitor agent progress updates in the SmartTable component. The implementation will enable real-time display of competitor analysis data and Blue Ocean scores as they are generated.

## Sub-Tasks

### 1. Add CompetitorAgent Subscription to SmartTable

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- Add `'CompetitorAgent'` to the list of subscribed agents in the useEffect hook (currently only subscribes to 'IdeationAgent')
- Ensure the subscription is added in the dependency array
- Follow the existing pattern established for IdeationAgent subscription

**Code Location:** Lines 109-119 where the current subscription logic exists

---

### 2. Update Event Type Filtering

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- Modify the event filtering logic to handle both 'result' and 'progress' event types
- Currently filters only for `event.type === 'result'` (line 127)
- Update to: `(event.type === 'result' || event.type === 'progress')`
- This allows the component to process competitor analysis updates which come as 'progress' events

**Code Location:** Line 127 in the event filtering logic

---

### 3. Add Competitor Data Parsing Logic

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- Add logic to differentiate between IdeationAgent and CompetitorAgent events
- For CompetitorAgent 'progress' events:
  - Parse the event payload to extract competitor analysis data
  - The payload structure follows the CompetitorStreamEvent schema from `packages/core/src/schemas/competitor-agent-schemas.ts`
  - Extract the `competitors` array and `blueOceanScore` from the event data
- Add appropriate type guards to ensure type safety when parsing event data

**Implementation Notes:**
- Check `event.agentName` to identify the source agent
- For CompetitorAgent events with type 'progress', the payload will contain:
  ```typescript
  {
    type: 'competitor-analysis',
    competitors: Array<{
      name: string;
      description: string;
      targetMarket: string;
      strengths: string[];
      weaknesses: string[];
    }>,
    blueOceanScore: number
  }
  ```

---

### 4. Update Business Idea State with Competitor Data

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- When a CompetitorAgent progress event is received:
  - Find the corresponding business idea by matching the `businessIdeaId` from the event
  - Update the business idea's `competitorAnalysis` field with the parsed competitor data
  - Update the business idea's `blueOceanScore` field with the received score
  - Use the `setIdeas` state updater with the functional update pattern to ensure immutability
- Ensure the update maintains all other existing properties of the business idea

**Implementation Pattern:**
```typescript
setIdeas(prevIdeas => 
  prevIdeas.map(idea => 
    idea.id === event.businessIdeaId 
      ? { ...idea, competitorAnalysis, blueOceanScore }
      : idea
  )
);
```

---

### 5. Add Error Handling for Competitor Events

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- Wrap the competitor event parsing logic in a try-catch block
- Log parsing errors to console with descriptive error messages
- Ensure the component continues to function even if a single event fails to parse
- Add validation for required fields (competitors array, blueOceanScore)
- Handle edge cases where the business idea ID doesn't match any existing ideas

**Error Handling Pattern:**
- Use console.error for logging with context about the failed event
- Continue processing subsequent events even if one fails

---

### 6. Update Component Cleanup

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- Ensure the cleanup function in the useEffect hook unsubscribes from both agents
- Add 'CompetitorAgent' to the unsubscribe call in the cleanup function
- This prevents memory leaks and unnecessary event processing after component unmount

**Code Location:** In the return function of the useEffect hook (around line 140)

---

### 7. Add Type Imports for Competitor Data

**File:** `packages/web/src/components/SmartTable.tsx`

**Details:**
- Import necessary types from shared package if not already imported
- Ensure TypeScript types are properly defined for the competitor analysis structure
- The BusinessIdea type already includes competitorAnalysis and blueOceanScore fields
- No additional type definitions needed unless for intermediate parsing

---

### 8. Test Real-Time Updates

**Details:**
- Create a test scenario to verify competitor agent integration:
  1. Generate business ideas through the IdeationAgent
  2. Observe real-time updates as CompetitorAgent processes each idea
  3. Verify that competitor analysis data appears in the table
  4. Verify that Blue Ocean scores are displayed correctly
  5. Test multiple concurrent updates
  6. Test error scenarios (malformed events, missing data)

**Testing Checklist:**
- [ ] Competitor data appears in real-time for each business idea
- [ ] Blue Ocean scores update correctly
- [ ] No console errors during normal operation
- [ ] Component handles malformed events gracefully
- [ ] Unsubscribe works correctly on component unmount

---

### 9. Verify WebSocket Event Flow

**Details:**
- Use browser developer tools to monitor WebSocket messages
- Verify that:
  - Subscribe message is sent for CompetitorAgent
  - Progress events are received with correct structure
  - Events are properly filtered and processed
  - Unsubscribe message is sent on cleanup
- Document any observed issues or anomalies

---

### 10. Code Review Checklist

**Details:**
Before considering the implementation complete, verify:
- [ ] All changes follow the coding guidelines in `docs/guidelines/coding-guidelines.md`
- [ ] Event handling follows patterns established in ADR-006 (event buffering)
- [ ] Component subscriptions follow ADR-007 (component-specific subscriptions)
- [ ] No new architectural decisions were needed (existing patterns suffice)
- [ ] Code is properly typed with TypeScript
- [ ] Error handling is comprehensive
- [ ] No memory leaks (proper cleanup)
- [ ] Real-time updates work as expected

---

## Implementation Order

Execute tasks in this sequence:
1. Tasks 1-2: Add subscription and update filtering
2. Tasks 3-4: Implement data parsing and state updates
3. Task 5: Add error handling
4. Task 6-7: Update cleanup and types
5. Tasks 8-9: Test the implementation
6. Task 10: Final review

## Acceptance Criteria Verification

This implementation satisfies all acceptance criteria from the step plan:
- ✓ SmartTable subscribes to CompetitorAgent WebSocket events
- ✓ Receives and processes real-time competitor analysis updates
- ✓ Updates BusinessIdea rows with competitor data and Blue Ocean scores
- ✓ Maintains existing IdeationAgent functionality
- ✓ Handles errors gracefully
- ✓ Follows established architectural patterns