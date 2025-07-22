# Increment 4: Smart Table - Ideation Agent Integration

## 1. Detailed Scope

### Included Features:

1. **Data Transformation Pipeline**
   - Create transformer utility to map ideation agent output (businessIdeaSchema) to frontend BusinessIdea interface
   - Map backend field names to frontend expectations:
     - `title` → `idea.title` (direct mapping)
     - Initialize `idea.name` to empty string "" (not present in backend model)
     - `description` → `idea.description` (direct mapping)
     - `id` → `idea.id` (ULID from backend, direct mapping)
     - `businessModel` → `idea.businessModel` (direct mapping)
     - `disruptionPotential` → `scores.disruption`
     - `marketPotential` → `scores.market`
     - `technicalComplexity` → `scores.technical`
     - `capitalIntensity` → `scores.capital`
     - `blueOceanScore` → `scores.blueOcean`
     - `overallScore` → `scores.overall`
     - `reasoning` → `idea.reasoning` (full object mapping)
     - `competitorAnalysis` → `idea.competitorAnalysis`
     - `criticalAnalysis` → `idea.criticalAnalysis`
   - Preserve ULID identifiers from backend data
   - Add metadata fields (starred: false, lastUpdated: timestamp, isCurrentRun: true, reportPath: null)

2. **Real-time WebSocket Integration**
   - Connect SmartTable to WebSocket event stream from Terminal Output Streaming (Increment 3)
   - Listen for WorkflowEvent messages with type 'result' or 'progress' only
   - Parse streaming JSON data from ideation agent
   - Update table rows progressively as each idea is generated
   - Handle partial data states gracefully

3. **Enhanced SmartTable Component**
   - Maintain existing sortable columns functionality
   - Ensure all business idea fields from schema are displayed:
     - Title and description
     - Business model (B2B, B2C, B2B2C, Marketplace, SaaS, DTC)
     - All score fields with reasoning tooltips
     - Competitor and critical analysis placeholders
   - Keep existing expand/collapse tooltip functionality for long text
   - Preserve responsive table design with horizontal scrolling

4. **Loading and Progress States**
   - Show skeleton rows while ideas are being generated
   - Display progress indicator showing "Generating idea X of Y"
   - Animate new row additions with subtle transitions
   - Show "pending" state for incomplete analysis fields

5. **Visual Score Indicators**
   - Maintain existing color coding system:
     - High scores (7-10): Green/Success color
     - Medium scores (4-6.9): Yellow/Warning color
     - Low scores (1-3.9): Red/Destructive color
   - Keep icon associations for each score type
   - Preserve hover tooltips showing reasoning

### Technical Implementation Details:
- React 18.3.1 with TypeScript
- Use existing shadcn/ui table components
- Integrate with @fastify/websocket client-side implementation
- Leverage existing SmartTable structure without breaking changes

### Excluded Features:
- Editing capabilities for business ideas
- Export functionality (CSV, PDF, etc.)
- Advanced filtering or search features
- Pagination (display all ideas in single scrollable view)
- Data persistence beyond current session
- Comparison features between ideas
- Batch operations on multiple ideas
- Advanced analytics or charting

## 2. Detailed Acceptance Criteria

1. **Data Transformation**
   - [ ] Transformer utility correctly maps all fields from businessIdeaSchema to BusinessIdea interface
   - [ ] Backend `title` field maps to `idea.title`
   - [ ] `idea.name` is initialized to empty string "" (field not present in backend)
   - [ ] Backend `description` field maps to `idea.description`
   - [ ] Backend `id` field (ULID) maps directly to `idea.id`
   - [ ] All score fields are properly converted from 1-10 scale
   - [ ] Missing optional fields (blueOceanScore, overallScore) are handled as null
   - [ ] Reasoning object is fully populated for all score types
   - [ ] Metadata fields are properly initialized (starred: false, isCurrentRun: true, etc.)

2. **Real-time Updates**
   - [ ] Table updates within 100ms of receiving WebSocket event
   - [ ] New rows appear with smooth animation (no jarring jumps)
   - [ ] Partial data is displayed immediately (e.g., title/description before scores)
   - [ ] No data loss during rapid successive updates
   - [ ] WebSocket disconnection is handled gracefully with retry logic

3. **User Interface**
   - [ ] All business idea fields are visible in the table
   - [ ] Sortable columns work correctly for all numeric scores
   - [ ] Tooltips display full reasoning text on hover
   - [ ] Table remains responsive on mobile devices (horizontal scroll)
   - [ ] Visual score indicators match defined color ranges
   - [ ] Loading skeleton shows during idea generation

4. **Integration Testing**
   - [ ] SmartTable correctly receives and displays mock ideation data
   - [ ] Progressive updates work with simulated WebSocket events
   - [ ] Table handles 10+ ideas without performance degradation
   - [ ] Existing features (starring, report viewing) remain functional
   - [ ] No console errors during streaming updates

5. **Edge Cases**
   - [ ] Empty state displays when no ideas are generated
   - [ ] Malformed JSON from WebSocket is handled without crashing
   - [ ] Duplicate idea detection prevents same idea appearing twice
   - [ ] Long text fields are truncated appropriately with ellipsis
   - [ ] Score fields handle null/undefined values gracefully

## 3. Detailed Documentation Tasks

1. **API Documentation**
   - Document the data transformation logic in `packages/web/src/utils/idea-transformer.ts`
   - Add JSDoc comments for all transformer functions
   - Include example input/output for the transformation

2. **Component Documentation**
   - Update SmartTable component documentation with new props/behavior
   - Document WebSocket event structure for ideation ideas
   - Add inline comments for real-time update logic

3. **Integration Guide**
   - Create `docs/guides/smart-table-integration.md` with:
     - WebSocket event format for ideation data
     - Data flow diagram from backend to SmartTable
     - Troubleshooting common integration issues

4. **Type Definitions**
   - Ensure all TypeScript interfaces are well-documented
   - Add comments explaining the mapping between backend and frontend types
   - Document any type assertions or conversions

5. **README Updates**
   - Update packages/web/README.md with SmartTable real-time features
   - Add section on WebSocket integration for developers
   - Include example of expected data format