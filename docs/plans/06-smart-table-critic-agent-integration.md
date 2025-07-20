# Smart Table - Critic Agent Integration

## Detailed Scope

### Features to Implement

1. **API Endpoint Integration**
   - Extend existing workflow API endpoint to trigger critic agent after competitor agent completes
   - Agent runs in the deterministic chain: Ideation → Competitor → Critic → Documentation
   - Critic agent evaluates business ideas with risk assessment and critical analysis

2. **WebSocket Event Streaming**
   - Emit `critical-analysis` events with structure: `{ ideaId, ideaTitle, analysis, overallScore }`
   - Stream status updates during critic evaluation process
   - Handle progress tracking for multiple ideas being analyzed

3. **Data Transformation**
   - Map backend `overallScore` field to frontend `scores.overall`
   - Pass through `criticalAnalysis` field directly (already matches frontend expectation)
   - Ensure `reasoning.overall` is properly populated for overall score explanations

4. **Frontend State Management**
   - Update React state to handle incoming critic analysis data
   - Implement progressive updates as each idea receives its critical evaluation
   - Maintain loading states for critical analysis column

5. **SmartTable Display Integration**
   - Display critical analysis text in the "Critical Analysis" column with tooltip
   - Show "Analysis pending..." placeholder while critic agent is processing
   - Update "Overall" score column with calculated overall score from critic agent
   - Apply score color coding to overall score (high: 8-10, medium: 5-7.9, low: 0-4.9)

### Technical Implementation Details

- **Backend Processing Flow:**
  1. Critic agent receives ideas with competitor analysis completed
  2. For each idea, performs web searches for risks and challenges
  3. Calculates overall score using ADR-005 methodology
  4. Emits real-time events for each completed analysis

- **Frontend Updates:**
  1. WebSocket listener captures `critical-analysis` events
  2. React state updates the corresponding idea with new fields
  3. SmartTable re-renders to show updated critical analysis and overall score

### Exclusions
- No modifications to critic agent logic or scoring methodology
- No changes to ADR-005 overall score calculation
- No UI changes beyond displaying the critic data in existing columns
- Documentation agent integration handled in next increment

## Detailed Acceptance Criteria

### Backend Criteria

1. **API Processing**
   - [ ] Critic agent executes automatically after competitor agent completes
   - [ ] All business ideas receive critical analysis and overall score
   - [ ] Error handling preserves workflow continuity if critic analysis fails for specific ideas

2. **WebSocket Events**
   - [ ] `critical-analysis` events emit with correct structure: `{ ideaId, ideaTitle, analysis, overallScore }`
   - [ ] Status events indicate critic agent progress ("Evaluating idea 1/5", etc.)
   - [ ] Events stream in real-time as each idea completes analysis

3. **Data Integrity**
   - [ ] Overall score calculated according to ADR-005 methodology (0-10 scale)
   - [ ] Critical analysis provides meaningful risk assessment for each idea
   - [ ] Failed analyses default to score 5.0 with appropriate error message

### Frontend Criteria

1. **Data Reception**
   - [ ] WebSocket handler correctly processes `critical-analysis` events
   - [ ] React state updates ideas with `criticalAnalysis` and `scores.overall`
   - [ ] State updates trigger SmartTable re-renders

2. **UI Display**
   - [ ] Critical Analysis column shows full text via tooltip on hover
   - [ ] Truncated preview displays in cell (50 characters max)
   - [ ] "Analysis pending..." shown for ideas awaiting critic evaluation
   - [ ] Overall score displays with appropriate color coding

3. **User Experience**
   - [ ] Progressive updates show each idea's critical analysis as it completes
   - [ ] No UI freezing during critic agent processing
   - [ ] Clear visual indication of which ideas have completed critical analysis

### Integration Testing

1. **End-to-End Flow**
   - [ ] Generate ideas → Run competitor analysis → Critic analysis auto-triggers
   - [ ] All WebSocket events properly received and processed
   - [ ] Final table shows all scores and analyses correctly

2. **Error Scenarios**
   - [ ] Handle critic agent timeout gracefully
   - [ ] Display error state if critical analysis fails
   - [ ] Workflow continues even if individual analyses fail

## Detailed Documentation Tasks

1. **API Documentation Updates**
   - Update workflow endpoint documentation to describe critic agent integration
   - Document the `critical-analysis` WebSocket event structure including `ideaId` field
   - Add examples of critic agent response data

2. **Field Mapping Documentation**
   - Document transformation: `overallScore` → `scores.overall`
   - Explain critic agent's role in the processing chain
   - Note that `criticalAnalysis` passes through without transformation

3. **Frontend Integration Guide**
   - Document React state structure for critic analysis data
   - Provide code examples for handling `critical-analysis` events
   - Include troubleshooting guide for common integration issues

4. **Testing Documentation**
   - Create test cases for critic agent integration
   - Document expected WebSocket event sequence
   - Provide sample test data for frontend development