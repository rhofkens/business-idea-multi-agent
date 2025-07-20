# ADR 002: Two-Pass Ideation Optimization Approach

## Status
Accepted

## Context
The initial ideation agent implementation using gpt-4o was generating business ideas of moderate quality. To improve the quality and depth of the generated business ideas, we needed to implement an optimization strategy that would:
1. Leverage more advanced AI capabilities
2. Apply critical refinement to initial ideas
3. Maintain the streaming architecture for real-time feedback

## Decision
We have implemented a two-pass generation system with the following components:

### 1. Model Upgrade
- Upgraded from `gpt-4o` to `o3` model for enhanced reasoning capabilities
- Made the model configurable via environment variables (`IDEATION_MODEL`)

### 2. Two-Pass Generation Architecture
- **First Pass**: Generate initial business ideas with enhanced prompting
- **Second Pass**: Refine and critically analyze the initial ideas

### 3. Enhanced Prompting Strategy
The system prompt was significantly enhanced to:
- Encourage critical thinking and deeper analysis
- Provide detailed scoring guidance (1-10 scale)
- Include a comprehensive example with high-quality scoring rationale
- Emphasize innovation and disruption potential

### 4. Refinement Process
Created a separate refinement prompt that:
- Critically reviews initial ideas
- Adjusts scores based on deeper analysis
- Enhances descriptions with specific metrics and data points
- Identifies overlooked opportunities and risks

### 5. Configuration Options
- `IDEATION_MODEL`: Choose between "o3" (default) and "gpt-4o"
- `USE_REFINEMENT`: Enable/disable two-pass refinement (default: true)

## Implementation Details

### Streaming Architecture Updates
The streaming system was enhanced to handle new event types:
- `status`: Progress updates during generation phases
- `idea`: Initial business ideas
- `refined-idea`: Enhanced ideas after refinement
- `chunk`: Raw streaming data
- `complete`: Generation completion signal

### Code Structure
```typescript
// Two separate agent instances for clarity
const ideationAgentInstance = new Agent({
  name: 'Ideation Agent',
  instructions: systemPrompt,
  model: configService.ideationModel,
});

const refinementAgentInstance = new Agent({
  name: 'Refinement Agent',
  instructions: refinementPrompt,
  model: configService.ideationModel,
});
```

## Consequences

### Positive
- **Higher Quality Ideas**: More innovative and thoroughly analyzed business concepts
- **Flexible Configuration**: Easy switching between models and refinement modes
- **Better Scoring**: More rigorous and realistic scoring with detailed justifications
- **Enhanced User Experience**: Real-time status updates during both generation phases

### Negative
- **Increased Latency**: Two-pass generation takes longer than single-pass
- **Higher Token Usage**: Refinement pass increases API costs
- **Complexity**: More complex streaming logic to handle multiple phases

### Neutral
- The refinement phase doesn't emit raw chunks to avoid confusion
- Both passes use the same model for consistency
- Validation occurs at each phase independently

## Alternatives Considered

1. **Single Pass with Better Prompting Only**
   - Rejected: Limited improvement potential without refinement
   
2. **Using Different Models for Each Pass**
   - Rejected: Added complexity without clear benefits
   
3. **Batch Processing Instead of Streaming**
   - Rejected: Would lose real-time feedback capability

## References
- OpenAI Agents SDK documentation
- Streaming architecture patterns
- Prompt engineering best practices