# SmartTable Competitor Agent Integration Plan

## Overview

This plan outlines the integration of Competitor Agent progress updates into the SmartTable component. Similar to the Ideation Agent integration (step 4), we'll leverage the existing WebSocket infrastructure to receive and display real-time competitor analysis data.

## Technical Context

- The agent orchestrator already sends WebSocket events from the competitor agent
- We only need to handle "progress" event types  
- All required data is contained in the event payload
- No API endpoint extensions are needed

## Implementation Tasks

### 1. Update WebSocket Event Types

Update the WebSocket event types to support competitor agent events:

**File:** `packages/shared/src/types/websocket-events.ts`
- Add event type for competitor agent progress

### 2. Update SmartTable Component

Enhance the SmartTable to handle competitor agent data:

**File:** `packages/web/src/components/SmartTable.tsx`
- Add handler for competitor agent progress events (type: "progress")
- Parse competitor data from event payload
- Update the business idea with competitor information

### 3. Update Business Idea Type (if needed)

If the competitor data structure requires new fields:

**File:** `packages/shared/src/types/business-idea.ts`
- Add competitor-related fields to BusinessIdea interface

### 4. Testing

Create integration tests to verify:
- SmartTable correctly receives and processes competitor agent events
- Competitor data is properly displayed in the table
- Real-time updates work as expected

## Data Flow

1. Competitor Agent generates analysis data
2. Agent Orchestrator sends WebSocket event (type: "progress")
3. Frontend WebSocket connection receives event
4. SmartTable component processes event payload
5. UI updates with competitor information

## Testing Checklist

- [ ] WebSocket events are received correctly
- [ ] Competitor data is parsed from payload
- [ ] SmartTable updates in real-time
- [ ] No errors in console during updates
- [ ] Data persists correctly in table state

## Success Criteria

- SmartTable displays competitor analysis data in real-time
- All competitor agent progress events are handled
- No performance degradation with multiple updates
- Clean integration with existing WebSocket infrastructure