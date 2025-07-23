# Task Plan: Smart Table - Critic Agent Integration

## Overview
This task plan implements the integration of CriticAgent data into the SmartTable component. The implementation focuses on handling WebSocket `workflow` events with nested CriticAgent progress data, extracting evaluation information, and updating the SmartTable UI with critical analysis and overall scores.

## Pre-Implementation Analysis Tasks

### Task 1: Review Existing WebSocket Event Handling in SmartTable
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Analyze the current event filtering logic in the `useMemo` hook (lines 124-226) to understand how to extend it for `workflow` events
- **Verification**: Document how IdeationAgent and CompetitorAgent events are currently being filtered and processed

### Task 2: Review SmartTable Component Structure
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Analyze the current state management and data structure for ideas
- **Verification**: Document how ideas are currently updated and what fields need to be added for critic data

### Task 3: Review WebSocket Event Types
- **File**: `packages/shared/src/types/websocket-events.ts`
- **Action**: Check existing WebSocket event type definitions
- **Verification**: Identify if `workflow` event type is already defined or needs to be added

## Implementation Tasks

### Task 4: Update WebSocket Event Type Definitions
- **File**: `packages/shared/src/types/websocket-events.ts`
- **Action**: Add or update the `WorkflowEvent` type to include the nested structure for CriticAgent events
- **Requirements**:
  - Define the workflow event structure with proper TypeScript types
  - Include the nested `data.metadata.data.evaluation` structure
  - Ensure type safety for `ideaId`, `overallScore`, `criticalAnalysis`, and `reasoning` fields
- **Compliance**: Follow TypeScript strict typing guidelines from coding-guidelines.md

### Task 5: Create Critic Event Filtering Logic
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Extend the event filtering logic in the `useMemo` hook (around lines 139-153) to filter and process `workflow` events from CriticAgent
- **Requirements**:
  - Add filtering for events where:
    - `agentName === "CriticAgent"`
    - `type === "workflow"`
    - `data.type === "progress"`
    - `data.metadata.stage === "critical-evaluation"`
  - Extract evaluation data from the nested structure
  - Map `evaluation.ideaId` to match existing ideas by ULID
- **Compliance**: Use the WebSocketProvider pattern from ADR-007 with component-level filtering

### Task 6: Update Business Idea Type
- **File**: `packages/shared/src/types/business-idea.ts`
- **Action**: Ensure the BusinessIdea interface includes fields for critic data
- **Requirements**:
  - Verify `scores.overall` field exists and is nullable
  - Verify `criticalAnalysis` field exists and is nullable
  - Ensure proper TypeScript types for all fields
- **Compliance**: Maintain backward compatibility with existing data structure

### Task 7: Implement Critic Data State Updates
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Add logic in the event processing loop to update ideas with critic evaluation data
- **Requirements**:
  - Create a new map similar to `competitorDataMap` for critic data
  - When a critic event is received, store the evaluation data in the map
  - In the merge phase (around lines 196-211), update ideas with:
    - `scores.overall` from `evaluation.overallScore`
    - `criticalAnalysis` from evaluation data
  - Preserve all existing idea data while adding critic fields
  - Handle cases where evaluation data might be partial
- **Compliance**: Follow React 18.3.1 state update patterns from coding-guidelines.md

### Task 8: Update SmartTable Critical Analysis Display
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Implement the Critical Analysis column display logic
- **Requirements**:
  - Show truncated preview (50 characters max) in the cell
  - Display "Analysis pending..." for ideas without critic data
  - Implement tooltip to show full critical analysis text on hover
  - Use appropriate UI components from shadcn/ui
- **Compliance**: Follow component patterns from coding-guidelines.md

### Task 9: Update SmartTable Overall Score Display
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Implement the Overall Score column display with color coding
- **Requirements**:
  - Display numeric score with one decimal place
  - Apply color coding:
    - Green for scores 8-10 (high)
    - Yellow for scores 5-7.9 (medium)
    - Red for scores 0-4.9 (low)
  - Handle null/undefined scores appropriately
  - Ensure immediate UI update when score is received
- **Compliance**: Use Tailwind CSS for styling as per architecture.md

### Task 10: Add Loading States for Critic Analysis
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Implement visual indicators for ideas awaiting critic evaluation
- **Requirements**:
  - Show appropriate loading state in Critical Analysis column
  - Show placeholder in Overall Score column while pending
  - Ensure smooth transition when data arrives
  - Maintain table layout stability during updates
- **Compliance**: Follow loading state patterns from coding-guidelines.md

### Task 11: Handle Error Scenarios
- **File**: `packages/web/src/components/SmartTable.tsx`
- **Action**: Add error handling for malformed or missing critic data in the event processing logic
- **Requirements**:
  - Add try-catch blocks around critic event parsing (similar to CompetitorAgent handling)
  - Gracefully handle missing evaluation data
  - Log errors appropriately for debugging
  - Display user-friendly placeholders for failed analyses
  - Ensure UI remains responsive even with errors
- **Compliance**: Follow error handling patterns from coding-guidelines.md

## Testing Tasks

### Task 12: Create Manual Test Cases
- **File**: `docs/testing/manual-test-checklist.md`
- **Action**: Add test cases for critic agent integration
- **Test Cases**:
  - Generate ideas and verify critic events are received
  - Verify critical analysis displays correctly (truncated and full)
  - Verify overall score displays with correct color coding
  - Test error scenarios (missing data, malformed events)
  - Test UI responsiveness during real-time updates
  - Verify ULID matching works correctly
- **Compliance**: Follow manual testing approach from architecture.md

### Task 13: Test WebSocket Event Flow
- **Action**: Manually test the complete event flow
- **Requirements**:
  - Start idea generation process
  - Monitor WebSocket events in browser DevTools
  - Verify workflow events are received with correct structure
  - Verify SmartTable updates in real-time
  - Test reconnection scenarios
- **Verification**: All acceptance criteria from step plan are met

## Documentation Tasks

### Task 14: Update WebSocket Integration Guide
- **File**: `docs/guides/frontend-websocket-integration.md`
- **Action**: Document the workflow event handling for CriticAgent
- **Requirements**:
  - Add section on `workflow` event structure
  - Provide code examples for multi-level filtering
  - Document the nested path: `data.metadata.data.evaluation`
  - Include sample event payload from step plan
- **Compliance**: Follow documentation standards

### Task 15: Update API Reference
- **File**: `docs/api/websocket-api-reference.md`
- **Action**: Add workflow event type documentation
- **Requirements**:
  - Document the complete event structure
  - Explain the filtering criteria
  - Provide integration examples
  - Note that critical analysis text may come separately
- **Compliance**: Maintain consistency with existing documentation

### Task 16: Create Testing Documentation
- **Action**: Document test scenarios and expected behavior
- **Requirements**:
  - Document the event sequence during workflow
  - Provide mock event data for frontend testing
  - Include troubleshooting guide for common issues
  - Add examples of successful integration
- **Output**: Add to relevant testing documentation

## Post-Implementation Verification

### Task 17: Verify Compliance with Architecture
- **Action**: Review implementation against architecture.md
- **Checklist**:
  - [ ] Uses React 18.3.1 patterns correctly
  - [ ] Follows WebSocketProvider pattern from ADR-007
  - [ ] Maintains monorepo package boundaries
  - [ ] Uses proper TypeScript types throughout
  - [ ] Implements real-time updates correctly

### Task 18: Verify Acceptance Criteria
- **Action**: Test against all acceptance criteria from step plan
- **Checklist**:
  - [ ] Frontend correctly filters workflow events
  - [ ] Nested event structure properly navigated
  - [ ] Ideas matched by ULID correctly
  - [ ] Overall score extracted and displayed
  - [ ] Critical analysis shows with truncation/tooltip
  - [ ] Loading states work correctly
  - [ ] Error handling in place
  - [ ] Real-time updates work without refresh
  - [ ] Color coding applied correctly

## Implementation Order
1. Tasks 1-3: Analysis and review (30 minutes)
2. Tasks 4-6: Type definitions and data structure updates (45 minutes)
3. Tasks 7-11: Core implementation (2-3 hours)
4. Tasks 12-13: Testing (1 hour)
5. Tasks 14-16: Documentation (1 hour)
6. Tasks 17-18: Verification (30 minutes)

## Notes
- No backend changes are required as the agent orchestrator already emits the necessary events
- Focus is entirely on frontend WebSocket event handling and UI updates
- The implementation extends existing patterns rather than creating new ones
- All tasks comply with the architecture guidelines and existing ADRs