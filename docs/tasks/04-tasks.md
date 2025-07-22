# Step 4: Smart Table - Ideation Agent Integration - Sub-Tasks

## Overview
This document provides detailed implementation tasks for integrating the ideation agent output with the SmartTable component, including data transformation, real-time WebSocket updates, and visual enhancements.

## Sub-Tasks

### 1. Create Business Idea Data Transformer Utility

**File**: `packages/web/src/utils/idea-transformer.ts`

**Requirements**:
- Create a transformer function that maps backend `businessIdeaSchema` to frontend `BusinessIdea` interface
- Implement the following field mappings:
  - `title` → `idea.title` (direct)
  - Initialize `idea.name` as empty string "" (field not in backend)
  - `description` → `idea.description` (direct)
  - `id` → `idea.id` (ULID from backend, direct)
  - `businessModel` → `idea.businessModel` (direct)
  - `disruptionPotential` → `scores.disruption`
  - `marketPotential` → `scores.market`
  - `technicalComplexity` → `scores.technical`
  - `capitalIntensity` → `scores.capital`
  - `blueOceanScore` → `scores.blueOcean`
  - `overallScore` → `scores.overall`
  - `reasoning` → `idea.reasoning` (full object mapping)
  - `competitorAnalysis` → `idea.competitorAnalysis`
  - `criticalAnalysis` → `idea.criticalAnalysis`
- Add metadata fields:
  - `starred: false`
  - `lastUpdated: new Date().toISOString()`
  - `isCurrentRun: true`
  - `reportPath: null`
- Add JSDoc comments with example input/output
- Export type for the backend schema if not already available

**Validation**:
- Handle null/undefined values gracefully
- Ensure ULID format validation
- Provide default values for optional fields

### 2. Extend WebSocket Hook with Event Type Filtering

**File**: `packages/web/src/hooks/useWebSocket.ts`

**Requirements**:
- Add `eventTypes` parameter to filter WorkflowEvent by type
- Implement filtering logic before calling onMessage
- Support array of event types: `['result', 'progress']` for SmartTable
- Maintain backward compatibility for components not using filtering
- Add TypeScript types for event type filtering

**Implementation Details**:
```typescript
interface UseWebSocketOptions {
  url: string;
  eventTypes?: Array<WorkflowEvent['type']>; // New parameter
  onMessage?: (data: unknown) => void;
  // ... existing options
}
```

### 3. Create WebSocket Integration Hook for SmartTable

**File**: `packages/web/src/hooks/useIdeaStream.ts`

**Requirements**:
- Custom hook specifically for SmartTable WebSocket integration
- Use the enhanced useWebSocket hook with event filtering for 'result' and 'progress' events
- Parse WorkflowEvent metadata.data as businessIdeaSchema when type is 'result'
- Transform parsed data using the idea-transformer utility
- Return structured data:
  - `ideas: BusinessIdea[]` - accumulated ideas
  - `isLoading: boolean` - connection/generation state
  - `progress: { current: number, total: number }` - from progress events
  - `error: Error | null` - error state
- Handle partial data updates progressively
- Implement duplicate detection using ULID

**State Management**:
- Use useReducer for complex state updates
- Actions: ADD_IDEA, UPDATE_IDEA, SET_PROGRESS, SET_ERROR, RESET

### 4. Implement Loading States in SmartTable

**File**: `packages/web/src/components/SmartTable.tsx`

**Requirements**:
- Add skeleton loading rows when `isLoading` is true
- Show progress indicator: "Generating idea X of Y"
- Implement smooth transitions for new row additions
- Add CSS animations for row appearance
- Show "pending" state for incomplete fields (null values)

**UI Elements**:
- Skeleton component from shadcn/ui
- Progress bar or counter in table header
- Fade-in animation for new rows (CSS transition)

### 5. Integrate Real-time Updates into SmartTable

**File**: `packages/web/src/components/SmartTable.tsx`

**Requirements**:
- Import and use the useIdeaStream hook
- Replace static ideas prop with streamed data
- Merge real-time ideas with any existing/persisted ideas
- Ensure updates happen within 100ms of receiving events
- Maintain existing functionality (starring, filtering, tooltips)
- Handle WebSocket disconnection gracefully with retry

**Integration Points**:
- Pass WebSocket URL from environment/config
- Handle session ID for connection
- Merge with existing ideas array

### 6. Update TypeScript Type Definitions

**Files**:
- `packages/web/src/types/business-idea.ts` (if local types needed)
- Update imports to use shared types where applicable

**Requirements**:
- Ensure all interfaces are properly typed
- Add comments explaining backend/frontend mapping
- Export transformer input/output types
- Document any type assertions
- Ensure compatibility with shared types package

### 7. Implement Visual Enhancements for Desktop

**File**: `packages/web/src/components/SmartTable.tsx`

**Requirements**:
- Ensure score color coding works with real-time updates
- Verify icon associations remain consistent
- Test hover tooltips during streaming updates
- Add subtle highlight for newly added rows
- Focus on desktop browser experience only

**Visual Elements**:
- Maintain existing color system (green/yellow/red)
- Keep icon mappings for score types
- Add CSS class for new row highlighting
- Optimize for desktop viewing

### 8. Update Component Documentation

**Files**:
- `packages/web/src/components/SmartTable.tsx` (inline JSDoc)
- `packages/web/src/hooks/useIdeaStream.ts` (JSDoc)
- `packages/web/src/utils/idea-transformer.ts` (JSDoc)

**Requirements**:
- Add comprehensive JSDoc comments for all new functions, hooks, and components
- Document new props, parameters, and return types
- Include usage examples in JSDoc comments
- Document the real-time update mechanism
- Add inline comments for complex logic

## Validation Checklist

Before marking this step complete, ensure:

1. [ ] All transformer mappings work correctly
2. [ ] WebSocket integration shows real-time updates
3. [ ] Loading states display properly
4. [ ] All existing SmartTable features still work
5. [ ] Manual testing confirms smooth experience
6. [ ] No console errors during normal operation
7. [ ] Code follows project coding guidelines
8. [ ] JSDoc documentation is complete

## Dependencies

- Completed Step 3: Terminal Output Streaming (WebSocket infrastructure)
- Existing SmartTable component
- Backend emitting WorkflowEvents with idea data
- Shared types package with WebSocket event definitions

## Future Considerations

The following enhancements are identified for future milestones:

### Error Handling and Edge Cases
- Handle malformed JSON gracefully
- Display appropriate empty states
- Implement error boundaries for the table
- Add try-catch blocks throughout
- Log errors to console with context
- Show user-friendly error messages
- Handle null/undefined score values with defaults

### Performance Optimization
- Implement React.memo where appropriate
- Use useMemo for expensive computations
- Debounce rapid WebSocket updates if needed
- Profile component with React DevTools
- Ensure smooth scrolling with many rows
- Memoize row components
- Consider virtualization for 50+ rows
- Batch state updates
- Optimize re-render triggers

### Integration Testing
- Test SmartTable with mock WebSocket events
- Verify progressive updates work correctly
- Test handling of 10+ ideas without performance issues
- Verify existing features remain functional
- Test error scenarios
- Check no console errors during streaming

### Mobile Responsiveness
- Optimize table layout for mobile devices
- Implement touch-friendly interactions
- Test on various screen sizes
- Consider alternative mobile-specific views

### Advanced Documentation
- Create comprehensive integration guide
- Document WebSocket event format
- Create data flow diagrams
- Provide troubleshooting guides
- Document performance characteristics