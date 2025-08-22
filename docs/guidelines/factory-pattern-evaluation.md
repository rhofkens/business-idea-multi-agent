# Factory Pattern Evaluation for Execution Modes

## Proposed Architecture

### Benefits of Factory Pattern

1. **Separation of Concerns**
   - Each execution mode has its own self-contained configuration
   - Prompts, scoring weights, and validation rules are encapsulated
   - No conditional logic scattered throughout agents

2. **Extensibility**
   - Adding new modes requires creating a new factory class
   - No modification to existing agent code
   - Follows Open/Closed Principle

3. **Testability**
   - Each factory can be unit tested independently
   - Mock factories for testing edge cases
   - Clear interface contract

4. **Maintainability**
   - Changes to one mode don't affect others
   - Easy to understand what each mode does
   - Version control friendly (separate files)

## Proposed Implementation Structure

```typescript
// Base interface for execution mode factories
interface ExecutionModeFactory {
  mode: string;
  
  // Prompt generators for each agent
  getIdeationPrompt(): string;
  getCompetitorPrompt(): string;
  getCriticPrompt(): string;
  getDocumentationPrompt(): string;
  
  // Scoring configuration
  getScoringWeights(): ScoringWeights;
  getScoreAdjustments(): ScoreAdjustments;
  
  // Validation rules
  validateIdea(idea: BusinessIdea): ValidationResult;
  
  // Mode-specific configuration
  getConfig(): ModeConfig;
}

// Concrete implementations
class SolopreneurModeFactory implements ExecutionModeFactory {
  mode = 'solopreneur';
  
  getIdeationPrompt(): string {
    return solopreneurIdeationPrompt;
  }
  
  getScoringWeights(): ScoringWeights {
    return {
      technicalMoat: 0.25,
      marketPotential: 0.20,
      aiLeverage: 0.20,
      complexity: 0.15,
      capitalIntensity: 0.10,
      blueOcean: 0.10
    };
  }
  
  validateIdea(idea: BusinessIdea): ValidationResult {
    // Validate TAM > $10M
    // Validate technical complexity 6-8
    // Validate AI leverage > 70%
  }
}

class ClassicStartupModeFactory implements ExecutionModeFactory {
  mode = 'classic-startup';
  
  getIdeationPrompt(): string {
    return classicStartupIdeationPrompt;
  }
  
  getScoringWeights(): ScoringWeights {
    return {
      marketPotential: 0.30,
      disruption: 0.25,
      scalability: 0.20,
      defensibility: 0.15,
      blueOcean: 0.10
    };
  }
}

// Factory registry
class ExecutionModeRegistry {
  private factories = new Map<string, ExecutionModeFactory>();
  
  register(factory: ExecutionModeFactory) {
    this.factories.set(factory.mode, factory);
  }
  
  getFactory(mode: string): ExecutionModeFactory {
    const factory = this.factories.get(mode);
    if (!factory) {
      throw new Error(`Unknown execution mode: ${mode}`);
    }
    return factory;
  }
  
  listModes(): string[] {
    return Array.from(this.factories.keys());
  }
}
```

## File Structure

```
packages/core/src/
├── execution-modes/
│   ├── base/
│   │   ├── ExecutionModeFactory.ts
│   │   ├── ScoringWeights.ts
│   │   └── ValidationResult.ts
│   ├── solopreneur/
│   │   ├── SolopreneurModeFactory.ts
│   │   ├── prompts/
│   │   │   ├── ideation.ts
│   │   │   ├── competitor.ts
│   │   │   ├── critic.ts
│   │   │   └── documentation.ts
│   │   └── scoring/
│   │       └── weights.ts
│   ├── classic-startup/
│   │   ├── ClassicStartupModeFactory.ts
│   │   ├── prompts/
│   │   │   └── ...
│   │   └── scoring/
│   │       └── weights.ts
│   └── registry/
│       └── ExecutionModeRegistry.ts
```

## Integration Points

### Agent Usage

```typescript
// In ideation-agent.ts
export async function* ideationAgent(
  preferences: BusinessPreferences,
  factory: ExecutionModeFactory
): AsyncGenerator<StreamEvent> {
  const prompt = factory.getIdeationPrompt();
  const agent = new Agent({
    instructions: prompt,
    model: configService.ideationModel,
  });
  // ... rest of implementation
}
```

### Orchestrator Usage

```typescript
// In agent-orchestrator.ts
export class AgentOrchestrator {
  async runWorkflow(preferences: BusinessPreferences) {
    const factory = this.registry.getFactory(preferences.executionMode);
    
    // Pass factory to each agent
    const ideas = await this.ideationStep.execute(preferences, factory);
    // ... etc
  }
}
```

## Advantages Over Current Approach

### Current (Conditional) Approach
```typescript
// Scattered throughout codebase
const prompt = executionMode === 'solopreneur' 
  ? solopreneurPrompt 
  : classicPrompt;

const weights = executionMode === 'solopreneur'
  ? { technical: 0.3, market: 0.2 }
  : { market: 0.4, disruption: 0.3 };
```

### Factory Pattern Approach
```typescript
// Clean, centralized
const factory = registry.getFactory(executionMode);
const prompt = factory.getIdeationPrompt();
const weights = factory.getScoringWeights();
```

## Future Execution Modes

With this pattern, adding new modes becomes trivial:

```typescript
// New file: packages/core/src/execution-modes/enterprise/EnterpriseModeFactory.ts
class EnterpriseModeFactory implements ExecutionModeFactory {
  mode = 'enterprise';
  
  getIdeationPrompt(): string {
    return 'Focus on enterprise B2B solutions...';
  }
  
  getScoringWeights(): ScoringWeights {
    return {
      enterpriseReadiness: 0.30,
      compliance: 0.25,
      scalability: 0.25,
      supportability: 0.20
    };
  }
}

// Register it
registry.register(new EnterpriseModeFactory());
```

## Potential Challenges

1. **Initial Complexity**
   - More files and abstractions upfront
   - Mitigation: Clear documentation and examples

2. **Prompt Duplication**
   - Some prompt sections might be shared
   - Mitigation: Composition pattern for shared components

3. **Type Safety**
   - Need to ensure all factories implement required methods
   - Mitigation: TypeScript interfaces enforce contract

## Recommendation

**Strongly recommend implementing the factory pattern** because:

1. **Clean Architecture**: Follows SOLID principles
2. **Future-Proof**: Easy to add new modes without breaking changes
3. **Testable**: Each mode can be tested in isolation
4. **Maintainable**: Clear separation of concerns
5. **Professional**: Industry-standard pattern for this use case

The initial investment in setting up the pattern will pay dividends as the system grows. It's the right architectural decision for a system that will have multiple execution modes with different behaviors.

## Migration Path

1. Create factory infrastructure first
2. Implement SolopreneurModeFactory
3. Refactor existing code to ClassicStartupModeFactory
4. Update agents to use factories
5. Add registry and dependency injection
6. Test both modes thoroughly

This can be done incrementally without breaking existing functionality.