# Step 7: Smart Table Documentation Agent Integration

## Detailed Scope

### Features to Implement
1. **Documentation Generation Integration**
   - Add "View Documentation" link for each business idea row
   - Implement modal dialog to display individual idea documentation using MD viewer
   - Integrate with DocumentationAgent workflow results via REST API

2. **Real-time Documentation Progress**
   - Subscribe to existing DocumentationAgent WebSocket events (already sent by orchestrator)
   - Handle progress events showing section generation status
   - Handle result events indicating complete report availability
   - Display documentation generation progress messages

3. **Full Report Access**
   - Add "Show Full Report" button in SmartTable header
   - Enable button only after receiving DocumentationAgent result event
   - Display complete documentation report in modal with MD viewer
   - Parse file path from result event to identify report location

4. **UI State Management**
   - Halt "Analysis in progress" spinner at bottom of table when documentation completes
   - Reset "Generate Ideas" button state back to normal after documentation
   - Show appropriate progress indicators during documentation generation

### Technical Implementation
1. **WebSocket Event Handling**
   - Listen for `progress` and `result` events for DocumentationAgent (the WebSocket handler unwraps the workflow wrapper)
   - Handle two event types:
     - **Progress events**: Show section generation progress
       ```typescript
       {
         id: "uuid",
         timestamp: "ISO-date",
         type: "progress",
         agentName: "DocumentationAgent",
         level: "info",
         message: "📝 Generated section: Risk Assessment",
         metadata: {
           stage: "section-generation",
           data: { section: "Risk Assessment" }
         }
       }
       ```
     - **Result events**: Indicate complete report is ready (with file path)
   - Use same pattern as CriticAgent and CompetitorAgent implementations in SmartTable

2. **Frontend Components**
   - Extend SmartTable component with documentation column
   - Create MD viewer modal component for displaying documentation
   - Add "Show Full Report" button in table header
   - Show documentation progress indicators

3. **REST API Endpoints**
   - Create new GET endpoints:
     - `/api/documentation/:ulid` - Get individual idea documentation by ULID
     - `/api/documentation/report/:filename` - Get full report by filename
   - Handle large content appropriately (documentation can be quite big)
   - Return markdown content with proper headers
   - Implement error handling for missing documentation

4. **State Management**
   - Track documentation generation progress based on progress events
   - Enable "Show Full Report" button upon receiving result event
   - Reset UI states (spinner, button) when documentation completes
   - Handle loading and error states for REST API calls

### Integration Points
- Existing WebSocket connection (events unwrapped by handler)
- SmartTable filters for DocumentationAgent progress/result events
- New REST API endpoints for retrieving documentation content
- MD viewer modal component for displaying documentation

### Exclusions
- Documentation content editing capabilities
- PDF export functionality
- Documentation versioning
- Offline documentation access
- WebSocket content streaming (all content retrieved via REST API)

## Detailed Acceptance Criteria

### WebSocket Event Handling
1. **Progress Event Reception**
   - SmartTable receives DocumentationAgent progress events
   - Progress messages display in appropriate UI location
   - Each section generation event updates the UI
   - Messages show which section is being generated

2. **Result Event Processing**
   - Result event triggers UI state changes
   - "Show Full Report" button becomes enabled
   - "Analysis in progress" spinner stops
   - "Generate Ideas" button returns to normal state
   - File path is extracted from result event for later retrieval

### REST API Integration
1. **Individual Documentation Endpoint**
   - GET `/api/documentation/:ulid` returns markdown content
   - Returns 404 if documentation not found
   - Handles large content efficiently
   - Proper content-type headers

2. **Full Report Endpoint**
   - GET `/api/documentation/report/:filename` returns full report
   - Filename parsed from result event
   - Returns complete markdown report
   - Error handling for invalid filenames

### UI Components
1. **View Documentation Links**
   - Each table row shows "View Documentation" when available
   - Link opens MD viewer modal
   - Modal displays markdown content properly formatted
   - Modal can be closed easily

2. **Show Full Report Button**
   - Button appears in SmartTable header
   - Initially disabled or hidden
   - Enabled after receiving result event
   - Opens full report in MD viewer modal

3. **Progress Indicators**
   - Documentation progress visible during generation
   - "Analysis in progress" spinner at table bottom
   - Spinner stops when documentation completes
   - Clear visual feedback for all states

4. **Button State Management**
   - "Generate Ideas" button disabled during analysis
   - Button returns to normal after documentation completes
   - Proper transitions between states
   - No stuck states or UI glitches

### Technical Requirements
1. **Event Flow**
   - SmartTable subscribes to WebSocket events (unwrapped by handler)
   - Filters for DocumentationAgent progress and result events
   - Processes progress and result events differently
   - Updates UI based on event type

2. **Error Handling**
   - Handle missing documentation gracefully
   - Show error states in UI
   - Retry logic for failed API calls
   - User-friendly error messages

## Detailed Documentation Tasks

### Code Documentation
1. **Backend Documentation**
   - Document new REST API endpoints
   - Add JSDoc for documentation retrieval logic
   - Document error response formats
   - Include example API responses

2. **Frontend Documentation**
   - Document WebSocket event handling for DocumentationAgent
   - Add comments for MD viewer modal implementation
   - Document button state management logic
   - Update SmartTable component documentation

### API Documentation
1. **REST Endpoints**
   - Document `/api/documentation/:ulid` endpoint
   - Document `/api/documentation/report/:filename` endpoint
   - Include request/response examples
   - Document error codes and responses

2. **WebSocket Events**
   - Document DocumentationAgent event formats (progress and result)
   - Note that the WebSocket handler unwraps the workflow wrapper
   - Include example event payloads
   - Document event flow and timing

### User Documentation
1. **Feature Guide**
   - Add "Viewing Documentation" section
   - Explain how to access individual idea docs
   - Document full report access
   - Include screenshots of MD viewer

### Architecture Updates
1. **Update architecture.md**
   - Add documentation retrieval flow
   - Document REST API endpoints
   - Update WebSocket event flow diagram
   - Note separation of event streaming and content retrieval

## Implementation Notes

### Key Technical Decisions
1. **Content Delivery**
   - WebSocket events don't include content (too large)
   - Content retrieved via REST API on demand
   - Efficient handling of large markdown documents

2. **UI State Coordination**
   - Three UI elements coordinated by result event:
     - "Show Full Report" button enablement
     - "Analysis in progress" spinner halt
     - "Generate Ideas" button reset

3. **Event Integration**
   - Leverage existing WebSocket event pattern from CriticAgent/CompetitorAgent
   - WebSocket handler automatically unwraps workflow wrapper
   - Frontend listens for progress and result events

### Implementation Order
1. Create REST API endpoints for documentation retrieval
2. Add WebSocket event handlers in SmartTable
3. Implement MD viewer modal component
4. Add "View Documentation" links to table rows
5. Implement "Show Full Report" button
6. Coordinate UI state changes on result event