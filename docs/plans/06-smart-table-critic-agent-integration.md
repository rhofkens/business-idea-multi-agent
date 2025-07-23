# Smart Table - Critic Agent Integration

## Detailed Scope

### Features to Implement

1. **WebSocket Event Handling**
   - Listen for `workflow` events with inner type `progress` from the CriticAgent
   - Extract critic analysis data from the nested event structure
   - The agent orchestrator already emits these events during the workflow execution

2. **Event Payload Structure**
   - Outer event type: `workflow`
   - Inner event structure:
     - `data.type`: "progress"
     - `data.agentName`: "CriticAgent"
     - `data.metadata.stage`: "critical-evaluation"
     - `data.metadata.data.evaluation`: Contains the evaluation results

3. **Data Extraction and Mapping**
   - Extract evaluation data from `data.metadata.data.evaluation`
   - Map `evaluation.overallScore` to frontend `scores.overall`
   - Extract `evaluation.ideaId` for matching with existing ideas
   - Map critical analysis form `data.metadata.data.evaluation.criticalAnalysis`

4. **Frontend State Management**
   - Update React state to handle incoming critic analysis data
   - Match ideas by ULID to update the correct row in the SmartTable
   - Maintain loading states while critic analysis is in progress

5. **SmartTable Display Integration**
   - Display critical analysis text in the "Critical Analysis" column with tooltip
   - Show "Analysis pending..." placeholder while critic agent is processing
   - Update "Overall" score column with the calculated overall score
   - Apply score color coding to overall score (high: 8-10, medium: 5-7.9, low: 0-4.9)

### Technical Implementation Details

- **WebSocket Event Flow:**
  1. CriticAgent processes ideas during the workflow
  2. Agent orchestrator emits `workflow` events with progress data
  3. Frontend WebSocket handler filters for events where:
     - `type === "workflow"`
     - `data.type === "progress"`
     - `data.agentName === "CriticAgent"`
     - `data.metadata.stage === "critical-evaluation"`
  4. Extract evaluation data from `data.metadata.data.evaluation`

- **Frontend Updates:**
  1. WebSocket listener captures `workflow` events
  2. Apply filtering criteria to identify CriticAgent progress events
  3. Extract evaluation data from the nested structure
  4. Update the corresponding idea by matching `evaluation.ideaId`
  5. SmartTable re-renders to show updated overall score

### Exclusions
- No backend changes needed (agent orchestrator already sends events)
- No modifications to critic agent logic or scoring methodology
- No changes to ADR-005 overall score calculation
- No UI changes beyond displaying the critic data in existing columns

## Detailed Acceptance Criteria

### WebSocket Event Handling

1. **Event Reception**
   - [ ] Frontend correctly filters `workflow` events with CriticAgent progress data
   - [ ] Nested event structure is properly navigated to reach evaluation data
   - [ ] Ideas are matched by ULID using `evaluation.ideaId`

2. **Data Processing**
   - [ ] Overall score is extracted from `data.metadata.data.evaluation.overallScore`
   - [ ] Score value is mapped to frontend `scores.overall` field
   - [ ] Error handling for missing or malformed evaluation data
   - [ ] Handle events that may only contain score without full analysis

### Frontend State Management

1. **State Updates**
   - [ ] React state correctly updates the matched idea with critic data
   - [ ] State preserves existing idea data while adding critic fields
   - [ ] Loading states transition appropriately

2. **Data Integrity**
   - [ ] ULID matching ensures correct idea updates
   - [ ] No data loss during state updates
   - [ ] Handles partial updates gracefully

### UI Display

1. **Critical Analysis Column**
   - [ ] Shows truncated preview (50 characters max) in the cell
   - [ ] Full text displays in tooltip on hover
   - [ ] "Analysis pending..." shown for ideas awaiting evaluation

2. **Overall Score Column**
   - [ ] Displays numeric score (0-10) with one decimal place
   - [ ] Color coding applied: green (8-10), yellow (5-7.9), red (0-4.9)
   - [ ] Score updates immediately when event is received

3. **User Experience**
   - [ ] Progressive updates as each idea receives critical analysis
   - [ ] No UI freezing during event processing
   - [ ] Clear visual indication of analysis completion status

### Integration Testing

1. **End-to-End Flow**
   - [ ] Generate ideas → Critic analysis events received → Table updates correctly
   - [ ] All critic data properly displayed in SmartTable
   - [ ] Real-time updates work without page refresh

2. **Error Scenarios**
   - [ ] Handle missing critic data gracefully
   - [ ] Display appropriate placeholder for failed analyses
   - [ ] UI remains responsive even with event errors

## Detailed Documentation Tasks

1. **WebSocket Integration Guide Updates**
   - Document the `workflow` event structure for CriticAgent
   - Provide code examples for the multi-level filtering criteria
   - Include the nested path to evaluation data: `data.metadata.data.evaluation`

2. **Frontend State Management**
   - Document the state shape for overall score data
   - Explain ULID-based matching using `evaluation.ideaId`
   - Provide examples of extracting score from nested structure

3. **Event Payload Reference**
   - Document the exact structure with sample payload:
     ```
     {
       type: "workflow",
       data: {
         type: "progress",
         agentName: "CriticAgent",
         metadata: {
           stage: "critical-evaluation",
           data: {
             evaluation: {
               ideaId: "ULID",
               ideaTitle: "Title",
               overallScore: 5.4
             }
           }
         }
       }
     }
     ```
   - Note the deep nesting of evaluation data
   - Clarify that critical analysis text may come separately

4. **Testing Documentation**
   - Create test cases for critic event handling
   - Document the expected event sequence during workflow
   - Provide mock event data for frontend testing