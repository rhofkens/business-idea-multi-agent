# Increment 8: Agent Workflow Statistics

## 1. Detailed Scope

### Features and User Stories (from PRD)
- **Progress Monitoring**: Real-time progress tracking for each agent
- **Simple Progress Metrics**: Display ideas completed (0-10 scale) for each agent
- **Visual Progress Indicators**: Progress bars and status badges in the dashboard

### Specific Tasks and Sub-tasks

#### Backend Tasks
1. **Add Progress Tracking to Agent Events**
   - Modify ideation agent to emit progress updates (ideas completed count)
   - Modify competitor agent to emit progress updates
   - Modify critic agent to emit progress updates
   - Modify documentation agent to emit progress updates
   - Ensure all progress events include `ideaId` for proper frontend mapping

2. **WebSocket Event Structure**
   - Define simple progress event structure:
     ```typescript
     interface AgentProgressEvent {
       type: 'agent-progress';
       ideaId: string;
       agentId: 'ideation' | 'competitor' | 'critic' | 'documentation';
       progress: number; // 0-10 scale
       status: 'idle' | 'active' | 'completed' | 'error';
       currentTask?: string;
     }
     ```

#### Frontend Tasks
1. **Integrate Progress Updates with AgentProgressDashboard**
   - Connect WebSocket progress events to update agent status
   - Map progress values (0-10 scale) to progress bars
   - Update agent status badges based on event data
   - Display current task information

2. **State Management**
   - Use React's built-in state management (no Redux)
   - Store progress state at the session level
   - Reset progress when starting new workflow
   - Preserve progress during page navigation within session

### What is Explicitly Excluded
- Complex timing metrics or performance statistics
- Historical data persistence
- Detailed task-level progress tracking
- Analytics or aggregated statistics
- Database storage of progress data

## 2. Detailed Acceptance Criteria

### Backend Criteria
1. **Progress Event Emission**
   - [ ] Each agent emits progress events after processing each idea
   - [ ] Progress events include correct agent ID and idea count (0-10)
   - [ ] Events include current status (idle/active/completed/error)
   - [ ] Events include current task description (optional)
   - [ ] All events include `ideaId` for frontend mapping

2. **WebSocket Delivery**
   - [ ] Progress events are delivered via existing WebSocket connection
   - [ ] Events are properly typed and validated
   - [ ] Events are sent in real-time as agents process ideas

### Frontend Criteria
1. **Dashboard Updates**
   - [ ] AgentProgressDashboard receives and processes progress events
   - [ ] Progress bars update smoothly showing X/10 ideas completed
   - [ ] Status badges reflect current agent state
   - [ ] Current task text updates when provided
   - [ ] Dashboard shows all four agents with correct icons and colors

2. **User Experience**
   - [ ] Progress updates appear in real-time without page refresh
   - [ ] Visual feedback is smooth and responsive
   - [ ] Progress resets when starting new workflow
   - [ ] No console errors or warnings during progress updates

### Integration Criteria
1. **End-to-End Flow**
   - [ ] Starting workflow shows all agents at 0/10 progress
   - [ ] Each agent shows incremental progress as ideas are processed
   - [ ] Agents transition through idle → active → completed states
   - [ ] Error states are properly displayed if agent fails
   - [ ] Final state shows all agents at 10/10 when workflow completes

## 3. Detailed Documentation Tasks

### Code Documentation
1. **Event Type Documentation**
   - Document `AgentProgressEvent` interface in shared types
   - Add JSDoc comments explaining progress scale (0-10)
   - Document status transitions and their meanings

2. **Component Documentation**
   - Update AgentProgressDashboard component documentation
   - Document props interface and default values
   - Add usage examples in component file

### API Documentation
1. **WebSocket Events**
   - Add `agent-progress` event to WebSocket event documentation
   - Include example payloads for each agent
   - Document event flow and timing

### User Documentation
1. **Progress Monitoring Guide**
   - Add section to user guide explaining progress indicators
   - Include screenshots of dashboard in different states
   - Explain what each status means (idle, active, completed, error)

## Implementation Notes

### Simplified Approach
Based on the existing AgentProgressDashboard component, we're implementing a simplified progress tracking system:
- Progress is simply the count of ideas completed (0-10)
- No complex metrics or timing data needed
- Focus on real-time visual feedback
- Leverage existing component structure

### WebSocket Integration
Progress events should follow the existing WebSocket patterns:
- Use the established event emission structure
- Include `ideaId` in all events for row mapping
- Emit events at natural processing boundaries

### State Management
Following the architecture guidelines:
- Use React's built-in state management (no Redux)
- Keep progress state simple and session-scoped
- Reset on new workflow initiation