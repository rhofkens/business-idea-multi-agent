# Business Preferences API Reference

## TypeScript Types

```typescript
// Business Preferences request
interface BusinessPreferences {
  vertical: string;
  subVertical: string;
  businessModel: string;
  additionalContext: string;
}

// Vertical with subverticals
interface VerticalWithSubverticals {
  id: string;
  name: string;
  description: string;
  subverticals: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

// Business Model
interface BusinessModel {
  id: string;
  name: string;
  description: string;
  advantages: string[];
  challenges: string[];
  examples: string[];
}

// API Responses
interface BusinessOptionsResponse {
  verticals: VerticalWithSubverticals[];
  businessModels: BusinessModel[];
}

interface PreferencesSubmissionResponse {
  processId: string;
  message: string;
  preferences: BusinessPreferences;
}

interface PreferencesErrorResponse {
  error: string;
  message?: string;
  validSubVerticals?: string[];
}
```

## Business Preferences Endpoints

### Get Business Options

Fetches all available business verticals, subverticals, and business models for the dropdown selections.

```typescript
GET /api/preferences/options

Success Response: 200 OK
{
  verticals: [
    {
      id: "technology",
      name: "Technology",
      description: "Digital products, software, and tech-enabled services",
      subverticals: [
        {
          id: "saas",
          name: "Software as a Service (SaaS)",
          description: "Cloud-based software solutions delivered on a subscription basis"
        },
        {
          id: "ai-ml",
          name: "Artificial Intelligence & Machine Learning",
          description: "AI-powered products and ML-based solutions"
        },
        // ... more subverticals
      ]
    },
    // ... more verticals
  ],
  businessModels: [
    {
      id: "subscription",
      name: "Subscription Model",
      description: "Recurring revenue through periodic subscription fees",
      advantages: [
        "Predictable recurring revenue",
        "Higher customer lifetime value",
        // ... more advantages
      ],
      challenges: [
        "Customer acquisition cost",
        "Churn management",
        // ... more challenges
      ],
      examples: [
        "Netflix (entertainment)",
        "Salesforce (CRM)",
        // ... more examples
      ]
    },
    // ... more business models
  ]
}
```

**Implementation Example**:
```typescript
// Frontend
const response = await fetch('http://localhost:3000/api/preferences/options', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
});

const options = await response.json();

// Backend route handler
fastify.get('/preferences/options', {
  schema: {
    response: {
      200: BusinessOptionsResponseSchema
    }
  }
}, async (request, reply) => {
  const verticals = getVerticalOptions();
  const verticalsWithSubverticals = verticals.map(vertical => ({
    id: vertical.id,
    name: vertical.name,
    description: vertical.description,
    subverticals: getSubverticalOptions(vertical.id)
  }));
  
  const businessModels = getBusinessModelOptions();
  
  return reply.send({
    verticals: verticalsWithSubverticals,
    businessModels
  });
});
```

### Submit Business Preferences

Submits business preferences and triggers the agent workflow for idea generation.

```typescript
POST /api/preferences
Content-Type: application/json

Request:
{
  vertical: string;         // Required, must be a valid vertical ID
  subVertical: string;      // Required, must be valid for the selected vertical
  businessModel: string;    // Required, must be a valid business model ID
  additionalContext: string; // Required, can be empty string
}

Success Response: 200 OK
{
  processId: string;  // ULID for tracking the workflow
  message: string;    // Success message
  preferences: {      // Echo of submitted preferences
    vertical: string;
    subVertical: string;
    businessModel: string;
    additionalContext: string;
  }
}

Error Responses:
- 400 Bad Request: Invalid subVertical for the selected vertical
  {
    error: "Invalid subVertical for the selected vertical",
    message: "The subVertical 'saas' is not valid for Healthcare",
    validSubVerticals: ["digital-health", "medical-devices", ...]
  }
- 400 Bad Request: Validation error (missing/invalid fields)
- 500 Internal Server Error: Processing failure
```

**Implementation Example**:
```typescript
// Frontend
const response = await fetch('http://localhost:3000/api/preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    vertical: 'technology',
    subVertical: 'saas',
    businessModel: 'subscription',
    additionalContext: 'Looking for B2B SaaS ideas in project management space'
  })
});

const result = await response.json();
console.log('Process ID:', result.processId);

// Backend route handler
fastify.post<{ Body: BusinessPreferences }>('/preferences', {
  schema: {
    body: BusinessPreferencesRequestSchema,
    response: {
      200: PreferencesResponseSchema,
      400: PreferencesErrorResponseSchema,
      500: PreferencesErrorResponseSchema
    }
  }
}, async (request, reply) => {
  const { vertical, subVertical, businessModel, additionalContext } = request.body;
  
  // Validate subVertical belongs to vertical
  if (!validateSubverticalsForVertical(vertical, [subVertical])) {
    const validSubVerticals = getSubverticalOptions(vertical);
    return reply.code(400).send({
      error: 'Invalid subVertical for the selected vertical',
      message: `The subVertical '${subVertical}' is not valid for ${vertical}`,
      validSubVerticals: validSubVerticals.map(s => s.id)
    });
  }
  
  // Generate process ID
  const processId = ulid();
  
  // Store in session
  SessionUtils.setSessionData(request, 'businessPreferences', request.body);
  
  // Trigger agent workflow asynchronously
  setImmediate(async () => {
    const orchestrator = new AgentOrchestrator();
    await orchestrator.runChain(request.body);
  });
  
  return reply.code(200).send({
    processId,
    message: 'Business preferences submitted successfully. Processing has started.',
    preferences: request.body
  });
});
```

## Session Storage

Business preferences are stored in the user's session after submission:

```typescript
// Session data structure
{
  user: { ... },  // User authentication data
  businessPreferences: {
    vertical: string;
    subVertical: string;
    businessModel: string;
    additionalContext: string;
  }
}
```

## Validation Rules

1. **Vertical**: Must be one of the predefined vertical IDs from the business verticals data
2. **SubVertical**: Must be a valid subvertical ID that belongs to the selected vertical
3. **Business Model**: Must be one of the predefined business model IDs
4. **Additional Context**: Can be any string, including empty string

## Agent Workflow Integration

When preferences are submitted:

1. A unique process ID (ULID) is generated for tracking
2. Preferences are stored in the user's session
3. The agent workflow is triggered asynchronously using `setImmediate()` (see ADR-002)
4. The API returns immediately with the process ID while processing continues in the background
5. The AgentOrchestrator processes the preferences through the agent chain

## Error Handling

### Validation Errors
- Missing required fields return 400 with detailed validation messages
- Invalid subVertical for vertical returns 400 with list of valid options

### Server Errors
- Agent workflow failures are logged but don't affect the API response
- Internal errors return 500 with generic error message

## Frontend Integration

### React Hook Example

```typescript
const useBusinessOptions = () => {
  return useQuery({
    queryKey: ['business-options'],
    queryFn: async () => {
      const response = await businessPreferencesApi.getOptions();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

const useSubmitPreferences = () => {
  return useMutation({
    mutationFn: async (preferences: BusinessPreferences) => {
      return businessPreferencesApi.submit(preferences);
    },
    onSuccess: (data) => {
      console.log('Process started:', data.processId);
      // Navigate or show success message
    },
    onError: (error) => {
      console.error('Submission failed:', error);
      // Show error message
    }
  });
};
```

## Testing Examples

### Backend Testing

```typescript
test('GET /api/preferences/options returns all options', async (t) => {
  const app = build();
  
  const response = await app.inject({
    method: 'GET',
    url: '/api/preferences/options'
  });
  
  t.equal(response.statusCode, 200);
  const data = response.json();
  t.ok(Array.isArray(data.verticals));
  t.ok(Array.isArray(data.businessModels));
  t.ok(data.verticals.length > 0);
  t.ok(data.businessModels.length > 0);
});

test('POST /api/preferences validates subVertical', async (t) => {
  const app = build();
  
  const response = await app.inject({
    method: 'POST',
    url: '/api/preferences',
    payload: {
      vertical: 'healthcare',
      subVertical: 'saas', // Invalid for healthcare
      businessModel: 'subscription',
      additionalContext: ''
    }
  });
  
  t.equal(response.statusCode, 400);
  const error = response.json();
  t.ok(error.validSubVerticals);
  t.ok(error.validSubVerticals.includes('digital-health'));
});