# Business Idea Generator POC - Architecture Documentation

## Document Overview

This document defines the technical architecture for the Business Idea Generator POC, a sequential multi-agent AI system that generates and evaluates business ideas. The architecture is designed for rapid iteration and experimentation, prioritizing simplicity and development speed over production-ready complexity.

## System Overview

### Purpose
The Business Idea Generator POC is a command-line application that demonstrates a sequential multi-agent pattern using the OpenAI Agents SDK for TypeScript. The system processes hardcoded business preferences through four specialized agents to produce ranked business ideas with comprehensive analysis.

### Key Characteristics
- **Architecture Pattern**: Deterministic multi-agent orchestration
- **Execution Model**: Command-line interface (CLI)
- **Agent Flow**: Orchestrated sequence of 4 specialized agents
- **Iteration Focus**: Rapid prototyping and experimentation
- **Output Format**: Structured Markdown reports

## Technology Stack

### Core Technologies
- **Runtime**: Node.js LTS (v22.x) - Latest stable version for modern JavaScript features
- **Language**: TypeScript 5.x - Type safety and modern language features
- **AI Framework**: OpenAI Agents SDK for TypeScript (latest) - Core agent capabilities
- **Model**: OpenAI o3 - High-capability language model for complex reasoning
- **Logging**: Comma-separated value (CSV) format for simple, structured logging

### Package Management & CI/CD
- **Package Manager**: npm with latest stable versions
- **CI/CD Pipeline**: GitHub Actions
- **Version Strategy**: Latest stable versions for all dependencies

### Development Tools
- **TypeScript Compiler**: Latest with strict type checking
- **Node.js**: LTS version for stability and long-term support

## Architectural Patterns

### Deterministic Multi-Agent Pattern
The system implements a deterministic, code-orchestrated multi-agent pattern. The `AgentOrchestrator` is not an agent, but a TypeScript module that calls the specialized agents in a predefined sequence. It passes strongly-typed data objects between them, ensuring predictable execution flow and type safety without relying on agent-to-agent handoffs.

Each agent is a stateless function or class that receives input, performs its specialized task, and returns a structured output. The orchestrator is responsible for invoking each agent in the correct order and managing the overall state.

This pattern is based on the [deterministic agent example](https://github.com/openai/openai-agents-js/blob/main/examples/agent-patterns/deterministic.ts) from the OpenAI Agents SDK documentation.

## System Architecture

### High-Level Architecture
```mermaid
graph TD
    subgraph "CLI Application"
        A[CLI Entry Point] --> B{Agent Orchestrator};
        B --> C[Ideation Agent];
        B --> D[Competitor Agent];
        B --> E[Business Critic Agent];
        B --> F[Documentation Agent];
    end

    subgraph "External Services"
        G[OpenAI API]
        H[Web Search Service]
        I[File System]
    end

    C --> G;
    D --> H;
    E --> H;
    F --> I;

    style B fill:#f9f,stroke:#333,stroke-width:2px
```

### Component Architecture

#### Core Components
1. **CLI Entry Point** - Application bootstrap and configuration
2. **Agent Orchestrator** - A TypeScript module that calls agents in sequence and manages data flow. It is not an AI agent.
3. **Agent Modules** - Specialized agents with distinct responsibilities
4. **Service Layer** - Logging, configuration, and external API management
5. **Output Handler** - Markdown report generation and file management

#### Agent Specifications

**Ideation Agent**
- **Purpose**: Generate creative business ideas
- **Tools**: None (pure reasoning)
- **Input**: Business preferences (vertical, sub-vertical, business model)
- **Output**: 10 business ideas with initial scoring, as an `IdeationAgentOutput[]`
- **Integration Pattern**: The agent is invoked by the `AgentOrchestrator`, which passes the required `BusinessPreferences`. The agent returns a structured `IdeationAgentOutput[]` object.
- **Data Flow**: The output is passed back to the orchestrator, which then calls the `CompetitorAgent`.

**Competitor Agent**
- **Purpose**: Market research and competitive analysis
- **Tools**: OpenAI built-in `web_search` tool
- **Input**: Business ideas from Ideation Agent
- **Output**: Enhanced ideas with competitive analysis and Blue Ocean scores

**Business Critic Agent**
- **Purpose**: Critical evaluation and risk assessment
- **Tools**: OpenAI built-in `web_search` tool
- **Input**: Business ideas with competitive analysis
- **Output**: Final evaluation with Overall scores

**Documentation Agent**
- **Purpose**: Report synthesis and formatting
- **Tools**: None (document generation)
- **Input**: Fully analyzed business ideas
- **Output**: Structured Markdown report

## Application Structure

### Folder Structure
```
business-idea-multi-agent/
├── src/
│   ├── agents/
│   │   ├── ideation-agent.ts
│   │   ├── competitor-agent.ts
│   │   ├── critic-agent.ts
│   │   └── documentation-agent.ts
│   ├── orchestrator/
│   │   └── agent-orchestrator.ts
│   ├── services/
│   │   ├── logging-service.ts
│   │   └── config-service.ts
│   ├── types/
│   │   ├── agent-types.ts
│   │   └── business-idea.ts
│   ├── utils/
│   │   └── errors.ts
│   └── main.ts
├── docs/
│   ├── PRD/
│   ├── guidelines/
│   │   └── architecture.md
│   └── output/
│       └── [generated-reports]
├── package.json
├── tsconfig.json
└── README.md
```

### Module Organization

#### Agent-Based Modules
Each agent is organized as a self-contained module with:
- **Agent Implementation**: Core agent logic and instructions
- **Type Definitions**: Agent-specific TypeScript interfaces
- **Configuration**: Agent-specific settings and parameters

#### Service Layer
- **Logging Service**: Simple CSV-based logger
- **Configuration Service**: Environment variable management
- **External APIs**: Web search and OpenAI API integration

#### Type System
- **Business Idea Types**: Core data structures for business ideas
- **Preference Types**: Input preference definitions
- **Agent Types**: Agent-specific interfaces and structured outputs

## Data Flow Architecture

### Sequential Processing Flow
```mermaid
sequenceDiagram
    participant CLI as CLI Entry Point
    participant Orch as Agent Orchestrator
    participant I as Ideation Agent
    participant C as Competitor Agent
    participant B as Business Critic Agent
    participant D as Documentation Agent
    participant FS as File System

    CLI->>Orch: Start with hardcoded preferences
    Orch->>I: Generate ideas
    I-->>Orch: Return business ideas
    Orch->>C: Analyze competitors for ideas
    C-->>Orch: Return ideas with competitor analysis
    Orch->>B: Critically evaluate ideas
    B-->>Orch: Return ideas with critical analysis
    Orch->>D: Generate report from final ideas
    D-->>FS: Write Markdown report
    FS-->>CLI: Notify completion
```

### Data Models

#### Business Idea Data Structure
```typescript
interface BusinessIdea {
  title: string;
  description: string;
  businessModel: string;
  disruptionPotential: number; // 0-10
  marketPotential: number; // 0-10
  technicalComplexity: number; // 0-10
  capitalIntensity: number; // 0-10
  blueOceanScore: number; // 0-10
  overallScore: number; // 0-10
  reasoning: {
    disruption: string;
    market: string;
    technical: string;
    capital: string;
    blueOcean: string;
    overall: string;
  };
  competitorAnalysis: string;
  criticalAnalysis: string;
}
```

#### Preference Configuration
```typescript
interface BusinessPreferences {
  vertical: string;
  subVertical: string;
  businessModel: string;
}
```

## Security Guidelines

### Minimal Security Approach
Given the POC nature and CLI execution environment, security measures are intentionally minimal:

#### API Key Management
- **OpenAI API Key**: Stored in environment variables (`OPENAI_API_KEY`)
- **Environment File**: `.env` file for local development (excluded from version control)
- **Production**: Environment variables set in CI/CD pipeline

#### Error Handling
- **Basic Error Handling**: Graceful failure with informative error messages
- **API Failures**: Retry logic with exponential backoff
- **Input Validation**: Basic validation of hardcoded preferences

#### Security Considerations for Future Enhancement
- Input sanitization for dynamic preferences
- Rate limiting for external API calls
- Secure credential management for production deployment
- Audit logging for security events

## Testing Strategy

### Current Approach (POC Phase)
- **No Automated Tests**: Manual testing only for rapid iteration
- **Manual Testing**: End-to-end execution validation
- **Error Scenario Testing**: Manual verification of error handling

### Manual Testing Checklist
1. **Successful Execution**: Complete agent workflow execution
2. **Error Handling**: API failures, network issues, invalid configurations
3. **Output Validation**: Markdown report generation and formatting
4. **Performance**: Execution time and resource usage monitoring

## Monitoring and Observability

### Logging Strategy
A simple, comma-separated value (CSV) format is used for logging to ensure readability and easy parsing.

#### Log Levels
- **ERROR**: System failures, API errors, unhandled exceptions
- **WARN**: Recoverable errors, performance warnings
- **INFO**: Major workflow events, completion status
- **DEBUG**: Detailed execution flow, API request/response details

#### Log Format
Logs are written in a CSV format with a header row.

**Header:**
`"timestamp","level","message","agent","details"`

**Example Log Entry:**
`"2025-01-07T18:00:00.000Z","info","Agent execution complete","ideation","ideasGenerated=10,executionTime=45.2s"`

### Error Tracking
- **Agent Failures**: Capture and log agent execution errors.
- **API Failures**: Track external service failures and retry attempts.
- **Data Validation**: Log data integrity issues and validation failures.

## Deployment Architecture

### Development Environment
- **Local Development**: Direct Node.js execution
- **Configuration**: `.env` file with development settings
- **Output**: Local file system for generated reports

### CI/CD Pipeline (GitHub Actions)
```yaml
# Simplified pipeline structure
name: Business Idea Generator POC
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      # Manual testing only - no automated tests
```

### Production Considerations (Future)
- **Containerization**: Docker for consistent deployment
- **Environment Management**: Separate configurations for different environments
- **Secret Management**: Secure API key storage and rotation

## Conclusion

This architecture provides a solid foundation for the Business Idea Generator POC, emphasizing simplicity, rapid iteration, and clear separation of concerns. The deterministic, code-orchestrated multi-agent pattern enables sophisticated business idea analysis while maintaining development velocity and predictability.

The minimal approach to security and testing aligns with POC objectives, providing a clear path for evolution into a production-ready system.

---

*This architecture document serves as the technical blueprint for the Business Idea Generator POC implementation. It should be reviewed and updated as the system evolves through the development process.*