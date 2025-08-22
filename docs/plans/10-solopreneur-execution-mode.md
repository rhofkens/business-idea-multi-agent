# Solopreneur Execution Mode Implementation Plan

## Overview

Extend the business idea generator to serve solo entrepreneurs by adding an "Execution Mode" system using the factory pattern. This enables different modes (Solopreneur, Classic Startup, and future modes) to have their own prompts, scoring mechanisms, and validation rules. The initial implementation focuses on Solopreneur mode, which generates technically sophisticated ideas for small teams (1-3 people) that require expertise but can be built efficiently using AI-assisted coding tools.

## 1. UI/UX Changes

### 1.1 IdeaGenerationForm Component
**Location**: `packages/web/src/components/IdeaGenerationForm.tsx`

Add a new dropdown field:
- **Label**: "Execution Mode"
- **Options**: 
  - "Solo Entrepreneur" (default)
  - "Classic Startup"
- **Position**: After Business Model dropdown, before Additional Context

### 1.2 SmartTable Component
**Location**: `packages/web/src/components/SmartTable.tsx`

#### New Column
- **Header**: "Execution Mode"
- **Position**: After Business Model column
- **Display**: Badge component with different colors
  - Solo Entrepreneur: Purple/Indigo badge
  - Classic Startup: Blue badge

#### New Filter
- **Position**: Next to existing "Starred only" and "Live agent data" toggles
- **Type**: Dropdown/Select component
- **Options**:
  - "All" (default)
  - "Solo Entrepreneur"
  - "Classic Startup"
- **Icon**: Users or Building icon

## 2. Architecture - Factory Pattern Implementation

### 2.1 Core Factory Structure

#### Base Interface
**Location**: `packages/core/src/execution-modes/base/ExecutionModeFactory.ts`

```typescript
interface ExecutionModeFactory {
  mode: string;
  
  // Prompt generators
  getIdeationPrompt(preferences: BusinessPreferences): string;
  getCompetitorPrompt(idea: BusinessIdea): string;
  getCriticPrompt(idea: BusinessIdea): string;
  getDocumentationPrompt(ideas: BusinessIdea[]): string;
  
  // Scoring configuration
  getScoringWeights(): ScoringWeights;
  calculateOverallScore(idea: BusinessIdea): number;
  
  // Validation
  validateIdea(idea: BusinessIdea): ValidationResult;
  
  // Configuration
  getConfig(): ExecutionModeConfig;
}
```

#### Registry Pattern
**Location**: `packages/core/src/execution-modes/registry/ExecutionModeRegistry.ts`

```typescript
class ExecutionModeRegistry {
  private factories = new Map<string, ExecutionModeFactory>();
  
  register(factory: ExecutionModeFactory): void;
  getFactory(mode: string): ExecutionModeFactory;
  getSupportedModes(): string[];
}
```

### 2.2 Concrete Implementations

#### SolopreneurModeFactory
**Location**: `packages/core/src/execution-modes/solopreneur/`

Structure:
```
solopreneur/
├── SolopreneurModeFactory.ts
├── prompts/
│   ├── ideation.ts
│   ├── competitor.ts
│   ├── critic.ts
│   └── documentation.ts
├── scoring/
│   ├── weights.ts
│   └── calculator.ts
└── validation/
    └── rules.ts
```

#### ClassicStartupModeFactory
**Location**: `packages/core/src/execution-modes/classic-startup/`

(Same structure as above, refactoring existing logic)

## 3. Data Model Changes

### 3.1 Schema Updates
**Location**: `packages/shared/src/types/business-idea-schema.ts`

```typescript
// Add to businessIdeaSchema
executionMode: z.enum(['solopreneur', 'classic-startup']).default('solopreneur'),
```

### 3.2 Database Schema
**Location**: `packages/core/src/data/schema.ts`

```sql
-- Add column to ideas table
executionMode: text('executionMode').notNull().default('solopreneur'),
```

### 3.3 Type Definitions
- Update `BusinessIdea` interface
- Add `ExecutionMode` type
- Add `ScoringWeights` interface
- Add `ValidationResult` interface

## 4. Agent Integration with Factory Pattern

### 4.1 Agent Modifications

#### Update Agent Signatures
All agents need to accept the factory:

```typescript
// ideation-agent.ts
export async function* ideationAgent(
  preferences: BusinessPreferences,
  factory: ExecutionModeFactory
): AsyncGenerator<StreamEvent> {
  const prompt = factory.getIdeationPrompt(preferences);
  // Use prompt with agent
}

// Similar updates for other agents
```

#### Remove Conditional Logic
- Remove all `if (executionMode === 'solopreneur')` checks
- Replace with factory method calls

### 4.2 Orchestrator Updates

**Location**: `packages/core/src/orchestrator/agent-orchestrator.ts`

```typescript
export class AgentOrchestrator {
  constructor(private registry: ExecutionModeRegistry) {}
  
  async runWorkflow(preferences: BusinessPreferences) {
    const factory = this.registry.getFactory(preferences.executionMode);
    
    // Pass factory to each step
    const ideas = await this.ideationStep.execute(preferences, factory);
    const scoredIdeas = await this.competitorStep.execute(ideas, factory);
    // etc.
  }
}
```

## 5. Prompt Implementations

### 5.1 Solopreneur Mode Prompts

#### Ideation Prompt
**Location**: `packages/core/src/execution-modes/solopreneur/prompts/ideation.ts`

```typescript
When executionMode is "solopreneur", focus on:

CRITICAL SOLOPRENEUR REQUIREMENTS:
1. Ideas MUST have defensible technical complexity
2. Buildable by 1-3 person teams using AI-assisted coding
3. Target markets of $10M-$1B TAM (not micro-niches)
4. Require expertise that creates barriers to entry
5. Leverage AI coding tools for 5-10x development speed

TECHNICAL REQUIREMENTS:
- Complex algorithms or ML models central to value
- Sophisticated architecture with real-time processing
- Advanced API integrations with complex business logic
- Domain expertise encoded in technical implementation
- Performance optimizations that competitors can't easily match

EVALUATION CRITERIA FOR SOLOPRENEURS:
- Technical Moat: Must require significant expertise to replicate
- AI Leverage: 70-90% buildable with Claude Code/Cursor
- Market Size: $10M minimum TAM, ideally $50M+
- Revenue Potential: Can reach $50K-500K MRR
- Customer Value: Solve problems worth $100-10K/month

IDEA CHARACTERISTICS:
- Technically sophisticated SaaS with clear moats
- ML/AI-powered solutions requiring domain expertise
- Developer tools solving complex problems
- Infrastructure automation with advanced features
- Data processing platforms with proprietary algorithms
- Vertical AI applications for specific industries
```

## 6. Scoring System Implementation

### 6.1 Solopreneur Scoring Weights
**Location**: `packages/core/src/execution-modes/solopreneur/scoring/weights.ts`

```typescript
export const solopreneurWeights: ScoringWeights = {
  technicalMoat: 0.25,      // Defensibility through technical sophistication
  marketPotential: 0.20,    // $10M+ TAM requirement
  aiLeverage: 0.20,         // How much AI accelerates development
  complexity: 0.15,         // Sweet spot: not too simple, not too complex
  capitalIntensity: 0.10,   // Lower is better
  blueOcean: 0.10          // Competitive differentiation
};
```

### 6.2 Classic Startup Scoring Weights
**Location**: `packages/core/src/execution-modes/classic-startup/scoring/weights.ts`

```typescript
export const classicStartupWeights: ScoringWeights = {
  marketPotential: 0.30,    // Large TAM critical
  disruption: 0.25,         // Innovation potential
  scalability: 0.20,        // Growth potential
  defensibility: 0.15,      // Moats and barriers
  blueOcean: 0.10          // Market opportunity
};
```

### 5.2 Competitor Prompt
**Location**: `packages/core/src/execution-modes/solopreneur/prompts/competitor.ts`

```typescript
For solopreneur ideas, additionally evaluate:

COMPETITIVE ADVANTAGES FOR SOLOPRENEURS:
1. Technical sophistication - Is the implementation difficult to copy?
2. Speed advantage - Can iterate faster than larger teams?
3. Focus advantage - Can excel by doing one thing extremely well?
4. Cost structure - Can profitably serve at lower prices?
5. Direct founder expertise - Does technical excellence matter more than features?

SEARCH FOCUS:
- Identify technically inferior but successful competitors
- Find overpriced enterprise solutions with poor UX
- Look for markets where incumbents are complacent
- Check GitHub for attempted open-source solutions
- Identify complex problems people solve manually
```

### 5.3 Critic Prompt
**Location**: `packages/core/src/execution-modes/solopreneur/prompts/critic.ts`

```typescript
For solopreneur ideas, critically evaluate:

SOLOPRENEUR-SPECIFIC RISKS:
1. Technical Complexity Risk: Is it too complex even with AI assistance?
2. Market Size Risk: Is the TAM actually large enough ($10M+)?
3. Competition Risk: Can funded startups easily replicate this?
4. Support Burden: Will customer support scale with growth?
5. Technical Debt: Is the architecture maintainable long-term?
6. Talent Risk: If you need to hire, can you find the expertise?

POSITIVE FACTORS FOR SOLOPRENEURS:
- Strong technical moat from sophisticated implementation
- High customer value justifying premium pricing
- Product-led growth reducing sales overhead
- Clear path to $50K+ MRR
- Defensible through technical excellence
- Market large enough for meaningful exit
```

### 5.4 Documentation Prompt
**Location**: `packages/core/src/execution-modes/solopreneur/prompts/documentation.ts`

```typescript
For solopreneur ideas, focus on business analysis:

### Technical Defensibility
- Core technical challenges that create moats
- Specific expertise required
- Why competitors can't easily replicate
- Time/cost advantage from AI-assisted development

### Market Opportunity Analysis
- Total addressable market size ($10M-$1B)
- Growth rate and trends
- Underserved segments
- Pricing power from technical superiority

### Competitive Positioning
- Technical advantages over incumbents
- Speed and focus advantages
- Cost structure benefits
- Path to market leadership in segment

### Revenue Projections
- Pricing strategy based on value delivered
- Path to $50K-500K MRR
- Customer acquisition strategy
- Expansion revenue opportunities
```

## 7. Business Logic Updates

### 7.1 Preference Handling
**Location**: `packages/core/src/routes/preferences-routes.ts`

```typescript
// Accept executionMode in preferences
const preferences = {
  ...existingFields,
  executionMode: body.executionMode || 'solopreneur'
};

// Initialize factory
const factory = registry.getFactory(preferences.executionMode);
```

### 7.2 Dependency Injection Setup

```typescript
// Initialize registry at startup
const registry = new ExecutionModeRegistry();
registry.register(new SolopreneurModeFactory());
registry.register(new ClassicStartupModeFactory());

// Pass to orchestrator
const orchestrator = new AgentOrchestrator(registry);
```

## 8. API Changes

### 5.1 Preferences API
**Endpoint**: `POST /api/preferences/generate`

Add to request body:
```json
{
  "executionMode": "solopreneur" | "classic-startup",
  // ... existing fields
}
```

### 5.2 Ideas API
**Endpoint**: `GET /api/ideas`

Add query parameter:
- `executionMode`: Filter by execution mode

## 9. Migration Strategy

### 9.1 Incremental Migration Steps

1. **Phase 1: Factory Infrastructure**
   - Create base interfaces and types
   - Implement registry pattern
   - No breaking changes yet

2. **Phase 2: Solopreneur Factory**
   - Implement SolopreneurModeFactory
   - Test in isolation
   - Keep existing logic intact

3. **Phase 3: Refactor Existing**
   - Extract current logic to ClassicStartupModeFactory
   - Maintain exact same behavior
   - Gradual replacement

4. **Phase 4: Integration**
   - Update agents to use factories
   - Remove old conditional logic
   - Full testing

### 9.2 Database Migration
- Add `executionMode` column with default 'classic-startup' for existing records
- This maintains backward compatibility

### 9.3 UI Migration
- Default to "solopreneur" for new generations
- Existing ideas display as "classic-startup"

## 10. Testing Requirements

### 7.1 Manual Testing Checklist

- [ ] UI shows execution mode dropdown
- [ ] Default is "Solo Entrepreneur"
- [ ] Ideas generated reflect technical sophistication for solopreneur mode
- [ ] Ideas target appropriate market sizes ($10M+ for solopreneur)
- [ ] SmartTable shows execution mode column
- [ ] Filter works correctly for execution modes
- [ ] Existing ideas show as "Classic Startup"
- [ ] Scoring reflects adjusted weights per mode
- [ ] Documentation focuses on business analysis (not execution plans)

## 11. Documentation Updates

### 8.1 README.md
- Add section explaining execution modes
- Update examples with solopreneur ideas

### 8.2 User Guide
- Explain when to use each mode
- Provide examples of typical outputs

## 12. Future Enhancements

### Easy to Add New Modes

With the factory pattern, adding new modes is simple:

```typescript
// New file: enterprise/EnterpriseModeFactory.ts
class EnterpriseModeFactory implements ExecutionModeFactory {
  mode = 'enterprise';
  
  getIdeationPrompt() {
    return enterprisePrompt;
  }
  
  getScoringWeights() {
    return {
      enterpriseReadiness: 0.30,
      compliance: 0.25,
      scalability: 0.25
    };
  }
}

// Register it
registry.register(new EnterpriseModeFactory());
```

### Potential Future Modes

1. **Enterprise Mode**: B2B ideas requiring sales teams
2. **Platform Mode**: Network effects and marketplaces
3. **Deep Tech Mode**: R&D-heavy ideas with long horizons
4. **Agency Mode**: Service businesses with recurring revenue
5. **Micro-SaaS Mode**: Ultra-focused single features

## 13. Success Metrics

### Quantitative

- Ideas generated in solopreneur mode have:
  - Technical complexity scores of 6-8 (not too simple, not too complex)
  - Market sizes of $10M+ TAM (100% above threshold)
  - 80%+ buildable with AI-assisted coding
  - Clear technical moats identified

### Qualitative

- Ideas have defensible technical barriers
- Clear value proposition worth $100-10K/month to customers
- Path to $50K+ MRR is evident
- Technical sophistication creates competitive advantage

## Implementation Order

1. **Week 1: Factory Infrastructure**
   - Day 1-2: Create base interfaces and types
   - Day 3: Implement registry pattern
   - Day 4: Create SolopreneurModeFactory
   - Day 5: Create ClassicStartupModeFactory

2. **Week 2: Integration**
   - Day 1: Update agents to use factories
   - Day 2: Update orchestrator
   - Day 3: API updates
   - Day 4: Frontend changes
   - Day 5: Testing and refinement

3. **Documentation**
   - Update README
   - Create mode comparison guide
   - Document factory pattern usage

## Risk Mitigation

### Technical Risks

1. **Factory Complexity**: More abstraction layers
   - **Mitigation**: Clear documentation and examples
   - **Benefit**: Much cleaner long-term architecture

2. **Migration Bugs**: Refactoring existing logic
   - **Mitigation**: Incremental migration with tests
   - **Benefit**: Can roll back if issues arise

3. **Performance**: Factory overhead
   - **Mitigation**: Factories are lightweight, instantiated once
   - **Benefit**: Negligible performance impact

### Business Risks

1. **User Confusion**: Understanding execution modes
   - **Mitigation**: Clear UI labels and tooltips
   - **Benefit**: Users get tailored ideas for their situation

2. **Mode Selection**: Choosing wrong mode
   - **Mitigation**: Good defaults (solopreneur) and descriptions
   - **Benefit**: Can always regenerate with different mode

## Estimated Timeline

- **Week 1**: Factory infrastructure and implementations
- **Week 2**: Integration and testing
- **Total**: ~2 weeks for complete implementation

Note: The factory pattern adds ~1 week but provides much better architecture for future expansion. This investment pays off immediately when adding the third execution mode.