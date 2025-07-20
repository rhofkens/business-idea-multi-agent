# Increment 7: Smart Table - Documentation Agent Integration

## 1. Detailed Scope

### Features and User Stories to Implement

1. **Documentation Agent WebSocket Integration**
   - Implement WebSocket handlers for documentation agent events
   - Create event streaming for individual idea summaries
   - Handle section-generated events with idea-specific content

2. **SmartTable Summary Column Enhancement**
   - Add summary column to display idea-specific documentation
   - Show real-time updates as summaries are generated
   - Display summary content inline in the table row

3. **Complete Report Button**
   - Add "View Complete Report" button to table header
   - Show button only when documentation is complete
   - Link to full generated report document

### Technical Implementation Details

1. **Backend (packages/server)**
   - WebSocket event handlers for:
     - `type: 'status'` - General status messages
     - `type: 'section-generated'` - Individual idea summary with content
     - `type: 'complete'` - Final completion with report path
   - Event structure for section-generated:
     ```typescript
     interface SectionGeneratedEvent {
       type: 'section-generated';
       ideaId: string;      // Maps to specific table row
       summary: string;     // Idea-specific summary content
       section: string;     // Section identifier
     }
     ```

2. **Frontend (packages/web)**
   - Add summary column to SmartTable
   - Handle section-generated events to update specific rows
   - Add "View Complete Report" button to table header
   - Show/hide button based on documentation completion

3. **Integration with Existing Workflow**
   - Documentation agent processes each idea individually
   - Emits summary for each idea as it's processed
   - Generates complete report after all ideas processed
   - Report combines all individual summaries

### Key Technical Considerations

1. **Individual Idea Updates**
   - Each idea gets its own summary via WebSocket
   - Summary content is displayed in the table row
   - Real-time updates as agent processes ideas

2. **Event Flow**
   - Agent generates summary for each idea
   - Emits section-generated event with ideaId and content
   - Frontend updates specific table row with summary
   - Complete event signals full report availability

3. **UI Layout**
   - New summary column in SmartTable
   - Inline display of summary content
   - Header button for complete report access

### Exclusions from This Increment
- Editing individual summaries
- Downloading individual idea summaries
- Report customization or templating
- Summary length configuration

## 2. Detailed Acceptance Criteria

### Backend Requirements

1. **WebSocket Event Streaming**
   - ✓ Documentation agent emits section-generated events for each idea
   - ✓ Each event includes ideaId and summary content
   - ✓ Events are emitted as ideas are processed
   - ✓ Complete event includes generated report path

2. **Event Structure**
   - ✓ Section-generated events contain valid ideaId
   - ✓ Summary content is properly formatted
   - ✓ Events are sent in processing order
   - ✓ No duplicate events for same idea

3. **Agent Integration**
   - ✓ Documentation agent receives all analyzed ideas
   - ✓ Processes ideas sequentially or in parallel
   - ✓ Generates meaningful summaries for each idea
   - ✓ Creates complete report after all summaries

### Frontend Requirements

1. **SmartTable Summary Column**
   - ✓ New column displays "Pending" initially
   - ✓ Updates to show summary when received
   - ✓ Summary text is readable and well-formatted
   - ✓ Column has appropriate width and styling

2. **Real-time Updates**
   - ✓ Individual rows update as events arrive
   - ✓ No lag or flickering during updates
   - ✓ Summaries appear immediately upon receipt
   - ✓ All ideas eventually show summaries

3. **Complete Report Button**
   - ✓ Button appears in table header area
   - ✓ Initially hidden or disabled
   - ✓ Enables when documentation completes
   - ✓ Opens full report in new tab/window

### Integration Requirements

1. **End-to-End Flow**
   - ✓ Critic completion triggers documentation
   - ✓ Each idea receives individual summary
   - ✓ Table rows update in real-time
   - ✓ Complete report available at end

2. **Data Consistency**
   - ✓ Summaries match idea content
   - ✓ All ideas included in final report
   - ✓ No missing or mismatched summaries
   - ✓ Report contains all individual summaries

## 3. Detailed Documentation Tasks

### Code Documentation
1. **Backend Documentation**
   - Document section-generated event structure
   - Add JSDoc for summary generation logic
   - Document the event emission flow
   - Include example event payloads

2. **Frontend Documentation**
   - Document summary column implementation
   - Add comments for event handling logic
   - Document complete report button behavior
   - Update SmartTable props documentation

### User Documentation
1. **Feature Documentation**
   - Add "Documentation Summaries" section to user guide
   - Explain how summaries appear in the table
   - Document the complete report button
   - Include screenshots of summary display

### API Documentation
1. **WebSocket Events**
   - Document section-generated event format
   - Provide example payloads with summaries
   - Document the ideaId mapping requirement
   - Include timing and ordering details

### Architecture Updates
1. **Update architecture.md**
   - Add documentation agent summary flow
   - Document individual vs complete report
   - Update event flow diagrams
   - Include summary display architecture

## Implementation Notes

### Summary Display Approach
Based on the clarification, the documentation agent:
- Generates a summary for each individual idea
- Sends summaries via WebSocket with idea IDs
- Updates table rows in real-time
- Creates a complete report combining all summaries

### UI Changes Required
- Add summary column to SmartTable component
- Implement "View Complete Report" button in header
- Handle section-generated events in WebSocket listener
- Update table state with incoming summaries

### Event Handling
The key difference from the original plan:
- Focus on individual idea summaries, not just report status
- Each idea gets its own content update
- Complete report is secondary to individual summaries
- Real-time row updates as summaries are generated