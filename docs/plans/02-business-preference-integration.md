# Business Preference Integration - Detailed Implementation Plan

## Detailed Scope

This increment implements a simple API endpoint to receive business preferences from the React frontend and trigger the agent workflow asynchronously. The implementation will focus on minimal validation and maintaining compatibility with existing console output functionality.

### Included Features:
1. **POST /api/preferences endpoint**
   - Accept preference data from the frontend
   - Perform basic field presence validation
   - Trigger existing agent workflow asynchronously
   - Return immediate success response when agent process starts

2. **Preference Data Structure**
   - `vertical`: string (required) - Main business vertical (e.g., "Technology & Software", "Healthcare & Life Sciences")
   - `subvertical`: string (required) - Specific subvertical within the chosen vertical
   - `businessModel`: string (required) - e.g., "B2B", "B2C", "C2C"
   - `userComments`: string (optional) - Additional user comments (not used by agents yet)

3. **Business Verticals Taxonomy**
   - Convert business_verticals_taxonomy.md to JSON structure
   - Store taxonomy in codebase (e.g., in @business-idea/shared package)
   - Load taxonomy data for UI dropdown population
   - Enable selection of valid vertical/subvertical combinations

4. **Integration with Existing Agent System**
   - Direct pass-through of preferences to agent orchestrator
   - No modification to existing agent logic
   - Preserve all console output functionality

5. **Response Format**
   - Simple JSON success response
   - Include process ID or tracking identifier
   - No waiting for agent completion

### Explicitly Excluded:
- Session storage of preferences
- Complex validation logic or business rules
- Waiting for agent workflow completion
- WebSocket or SSE implementation (deferred to later increments)
- Database persistence
- Rate limiting or throttling

## Detailed Acceptance Criteria

1. **API Endpoint Functionality**
   - [ ] POST /api/preferences endpoint is accessible at the correct URL
   - [ ] Endpoint accepts JSON payload with vertical, subvertical, businessModel, and optional userComments
   - [ ] Returns 200 OK with success message when agent process starts successfully
   - [ ] Returns 400 Bad Request if any required field is missing

2. **Validation Requirements**
   - [ ] Validates that vertical field is present and non-empty
   - [ ] Validates that subvertical field is present and non-empty
   - [ ] Validates that businessModel field is present and non-empty
   - [ ] userComments field is optional and can be empty
   - [ ] Taxonomy data structure is loaded from JSON file in codebase
   - [ ] Basic validation that vertical/subvertical combination exists in taxonomy (optional for MVP)

3. **Agent Integration**
   - [ ] Successfully triggers the existing agent orchestrator with provided preferences
   - [ ] Agent process runs asynchronously without blocking the API response
   - [ ] Console output from agents continues to work unchanged
   - [ ] Any agent errors do not crash the API server

4. **Response Format**
   - [ ] Success response includes a status field with value "success"
   - [ ] Success response includes a message confirming process started
   - [ ] Success response includes a processId or similar tracking identifier
   - [ ] Response is returned immediately (< 1 second) after starting agent process

5. **Error Handling**
   - [ ] Missing field errors clearly identify which field is missing
   - [ ] Server errors (500) are returned if agent process fails to start
   - [ ] All errors return appropriate HTTP status codes
   - [ ] Error responses follow consistent JSON structure

6. **Taxonomy Implementation**
   - [ ] business_verticals_taxonomy.md converted to JSON structure
   - [ ] JSON file stored in appropriate location (@business-idea/shared or similar)
   - [ ] Taxonomy data can be imported and used in both frontend and backend
   - [ ] Structure maintains hierarchy of verticals and their subverticals

7. **Testing Verification**
   - [ ] Manual test via Postman/curl shows successful preference submission
   - [ ] Invalid requests properly rejected with meaningful errors
   - [ ] Console shows agent output after API returns success
   - [ ] Multiple concurrent requests can be handled
   - [ ] Vertical/subvertical selections work with full taxonomy

## Detailed Documentation Tasks

1. **API Reference Documentation**
   - Add POST /api/preferences endpoint to central API reference document
   - Include:
     - Endpoint URL and method
     - Request body schema with field descriptions:
       * vertical: Main category from business verticals taxonomy
       * subvertical: Subcategory within the chosen vertical
       * businessModel: Target business model (B2B, B2C, C2C, etc.)
       * userComments: Optional free-text comments
     - Example request payload
     - Success response format with example
     - Error response formats with examples
     - Note about asynchronous processing behavior