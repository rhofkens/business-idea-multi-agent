# Smart Table - Competitor Agent Integration

## Detailed Scope

### Features and Tasks Included:

1. **API Endpoint Enhancement**
   - Modify the existing `/api/generate-ideas` endpoint to include competitor analysis data in the response
   - Ensure the endpoint returns the fields populated by the competitor agent:
     - `competitorAnalysis` (string)
     - `blueOceanScore` (number)
     - `blueOceanReasoning` (string)

2. **Data Transformation Layer**
   - Create data mapping functions to transform backend competitor agent output to frontend format:
     - `blueOceanScore` → `scores.blueOcean`
     - `blueOceanReasoning` → `reasoning.blueOcean`
     - `competitorAnalysis` → `competitorAnalysis` (direct mapping)
   - Handle null/undefined values appropriately (e.g., competitor analysis might be pending)

3. **WebSocket Event Updates**
   - Extend WorkflowEvent interface to include competitor agent events
   - Add new event types:
     - `competitor-analysis-started`
     - `competitor-analysis-progress` (with streaming updates)
     - `competitor-analysis-completed`
     - `competitor-analysis-error`
   - Include Blue Ocean score calculation progress in events

4. **Frontend State Management**
   - Update the SmartTable component's data handling to properly display:
     - Competitor analysis text with truncation and tooltip
     - Blue Ocean score with appropriate color coding and icon
     - Blue Ocean reasoning in tooltip
   - Handle progressive updates as competitor analysis completes after ideation

5. **Visual Indicators**
   - Implement loading states for competitor analysis column
   - Add progress indicators while analysis is being performed
   - Use the existing `Building` icon (line 78 in SmartTable.tsx) for Blue Ocean scores
   - Apply the existing score color/background functions for Blue Ocean scores

### Technical Specifications:
- Ensure compatibility with existing SmartTable structure
- Maintain the asynchronous nature where competitor analysis runs after ideation
- Use TypeScript interfaces for type safety
- Follow the established WebSocket event patterns from Increment 3

### Explicitly Excluded:
- Changes to the competitor agent logic itself (already implemented in V1.0)
- Modifications to the Blue Ocean scoring algorithm (defined in ADR 003)
- Web search functionality (handled by the backend agent)
- Changes to other agent integrations (critic, documentation)

## Detailed Acceptance Criteria

1. **API Response Structure**
   - [ ] The `/api/generate-ideas` endpoint returns business ideas with competitor analysis fields
   - [ ] Response includes `competitorAnalysis`, `blueOceanScore`, and `blueOceanReasoning` for each idea
   - [ ] Fields can be null/undefined if analysis is still in progress

2. **Data Transformation**
   - [ ] Backend `blueOceanScore` correctly maps to frontend `scores.blueOcean`
   - [ ] Backend `blueOceanReasoning` correctly maps to frontend `reasoning.blueOcean`
   - [ ] Null/undefined values are handled gracefully without breaking the UI

3. **Real-time Updates**
   - [ ] WebSocket emits `competitor-analysis-started` when analysis begins
   - [ ] Progress updates are streamed via `competitor-analysis-progress` events
   - [ ] `competitor-analysis-completed` event includes the final analysis data
   - [ ] Error events properly communicate failures to the frontend

4. **SmartTable Display**
   - [ ] Competitor Analysis column shows truncated text with full content in tooltip
   - [ ] Blue Ocean score displays with appropriate color coding (high/medium/low)
   - [ ] Blue Ocean reasoning appears in tooltip when hovering over the score
   - [ ] Loading state shows "Analysis pending..." while processing

5. **Progressive Enhancement**
   - [ ] Ideas initially display without competitor data
   - [ ] Competitor analysis fields update in real-time as analysis completes
   - [ ] No page refresh required to see updated competitor data
   - [ ] Multiple ideas can have analysis running simultaneously

6. **Error Handling**
   - [ ] Failed competitor analysis shows appropriate error message
   - [ ] Partial failures don't break the entire table
   - [ ] Users can see which analyses failed and why

## Detailed Documentation Tasks

1. **API Documentation**
   - Update API endpoint documentation to include new competitor analysis fields
   - Document the expected format and types for each field
   - Add examples showing ideas with and without competitor data

2. **WebSocket Event Documentation**
   - Document new competitor analysis event types
   - Provide event payload examples
   - Explain the event lifecycle for competitor analysis

3. **Frontend Integration Guide**
   - Document the data transformation mappings
   - Explain how to handle progressive updates in the UI
   - Provide code examples for consuming competitor analysis events

4. **Testing Documentation**
   - Create test scenarios for competitor analysis integration
   - Document how to test progressive updates
   - Include edge cases (timeouts, failures, partial data)

5. **Update Architecture Documentation**
   - Add sequence diagram showing competitor analysis flow
   - Update the data flow diagram to include competitor agent integration
   - Document the asynchronous processing model