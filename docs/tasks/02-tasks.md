# Step 2: Business Preference Integration - Implementation Tasks

This document provides a detailed, executable list of sub-tasks for implementing the Business Preference Integration feature. All tasks must be completed in the order specified and comply with the architecture guidelines, coding guidelines, and Architecture Decision Records (ADRs).

## Prerequisites
- Ensure Step 1 is fully completed and tested
- Review `docs/plans/02-business-preference-integration.md`
- Review `docs/guidelines/architecture.md` and `docs/guidelines/coding-guidelines.md`
- Review ADRs: 001, 002, 003, 004

## Implementation Tasks

### 1. Convert Business Verticals Taxonomy to JSON

1.1. Create `packages/shared/src/data/business-verticals.json`
   - Follow the structure defined in ADR-004
   - Convert all verticals and subverticals from `docs/PRD/business_verticals_taxonomy.md`
   - Assign kebab-case IDs to each vertical and subvertical
   - Include version "1.0.0"
   - Validate the JSON structure

1.2. Create TypeScript types in `packages/shared/src/types/business.ts`
   ```typescript
   export interface BusinessSubvertical {
     id: string;
     name: string;
     examples: string[];
   }
   
   export interface BusinessVertical {
     id: string;
     name: string;
     description: string;
     subverticals: BusinessSubvertical[];
   }
   
   export interface BusinessVerticalsData {
     version: string;
     verticals: BusinessVertical[];
   }
   ```

1.3. Create validation schema in `packages/shared/src/schemas/business.ts`
   - Export JSON Schema for business preferences validation
   - Include enums generated from the business-verticals.json

### 2. Install Required Dependencies

2.1. Add dependencies to `packages/web/package.json`
   ```bash
   npm install ulidx --workspace @business-idea/web
   ```

### 3. Create Business Preferences API Endpoint

3.1. Create route handler in `packages/web/src/routes/preferences.ts`
   - Import Fastify types and schemas
   - Import business types from @business-idea/shared
   - Import agent workflow from @business-idea/core
   - Follow Fastify v5 patterns from context7 research

3.2. Implement POST /api/preferences endpoint
   - Define request body schema using full JSON Schema format:
     ```typescript
     const bodySchema = {
       type: 'object',
       properties: {
         vertical: { type: 'string' },
         subvertical: { type: 'string' },
         businessModel: { 
           type: 'string',
           enum: ['b2b', 'b2c', 'b2b2c', 'marketplace', 'saas', 'subscription'] 
         },
         userComments: { type: 'string' }
       },
       required: ['vertical', 'subvertical', 'businessModel']
     };
     ```
   - Define response schema for 200 and 400 status codes
   - Implement validation against business-verticals.json data

3.3. Implement request handler logic
   - Generate process ID using ULID (as per ADR-003)
   - Store preferences in session using fastify-session
   - Trigger agent workflow asynchronously using setImmediate (as per ADR-002)
   - Return immediate response with processId

3.4. Add error handling
   - Handle validation errors with 400 status
   - Handle server errors with 500 status
   - Log errors appropriately

### 4. Integrate Agent Workflow

4.1. Create agent trigger module in `packages/web/src/services/agent-trigger.ts`
   - Import agent modules from @business-idea/core
   - Create `executeAgentWorkflow` function that:
     - Accepts preferences and processId
     - Creates research plan from preferences
     - Executes the multi-agent workflow
     - Logs progress to console (existing functionality)
     - Handles errors gracefully

4.2. Connect to existing agent infrastructure
   - Ensure all agent environment variables are available
   - Verify OpenAI API key is configured
   - Test agent workflow execution

### 5. Register Route with Fastify

5.1. Update `packages/web/src/server.ts`
   - Import the preferences route
   - Register the route with the Fastify instance
   - Ensure route is registered after session plugin

### 6. Update API Documentation

6.1. Create `packages/web/docs/api/preferences.md`
   - Document POST /api/preferences endpoint
   - Include request/response schemas
   - Provide example requests and responses
   - Document error codes

### 7. Manual Testing Checklist

7.1. Test with valid preferences
   - Verify immediate response with processId
   - Verify agent workflow starts (check console logs)
   - Verify session stores preferences

7.2. Test validation
   - Missing required fields return 400
   - Invalid vertical/subvertical combinations return 400
   - Invalid business model returns 400

7.3. Test error scenarios
   - Server errors are logged
   - API remains responsive even if agent fails

## Validation Checklist

Before marking this step as complete, ensure:

- [ ] Manual testing confirms async behavior
- [ ] API documentation is complete
- [ ] Code follows TypeScript standards from coding guidelines
- [ ] Fastify patterns match context7 recommendations
- [ ] All ADR decisions are implemented correctly
- [ ] No blocking operations in API handler
- [ ] Error handling is comprehensive
- [ ] Logging provides sufficient debugging information

## Dependencies

- Existing Step 1 implementation
- @business-idea/core agent modules  
- OpenAI API access
- All environment variables configured

## Notes

- The agent workflow will output to console as it currently does
- Real-time updates and WebSocket integration are deferred to Step 3
- Email delivery is out of scope for this step
- Focus is on API endpoint and basic integration only