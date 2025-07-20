# Sub-tasks for Step 1: Foundation and Deterministic Agent Chain

This document provides a detailed, sequential list of tasks for the implementation coder to complete Step 1. Follow each task in order.

## Phase 1: Project Initialization and Setup

### Task 1.1: Initialize Node.js Project
- **Action**: Run `npm init -y` in the project root to create a `package.json` file.

### Task 1.2: Install Development Dependencies
- **Action**: Install all necessary development dependencies.
- **Command**: 
```bash
npm install -D typescript @types/node ts-node nodemon eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier
```

### Task 1.3: Install Application Dependencies
- **Action**: Install all core application dependencies. We are including `dotenv` for environment variable management and `zod` for robust type validation, which is a best practice seen in the OpenAI Agents SDK examples.
- **Command**:
```bash
npm install @openai/agents zod dotenv
```

### Task 1.4: Create Project Directory Structure
- **Action**: Create the complete folder structure as defined in `docs/guidelines/architecture.md`.
- **Command**:
```bash
mkdir -p src/agents src/orchestrator src/services src/types src/utils docs/output
```

### Task 1.5: Configure TypeScript (`tsconfig.json`)
- **Action**: Create a `tsconfig.json` file in the project root with strict type checking enabled.
- **File**: `tsconfig.json`
- **Content**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Task 1.6: Configure ESLint (`eslint.config.js`)
- **Action**: Create an `eslint.config.js` file for code linting and formatting, integrating Prettier.
- **File**: `eslint.config.js`
- **Content**:
```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
);
```

### Task 1.7: Create `.gitignore`
- **Action**: Create a `.gitignore` file to exclude unnecessary files from version control.
- **File**: `.gitignore`
- **Content**:
```
# Dependencies
/node_modules
/dist

# Env
.env

# Logs
*.log
logs/
*.csv

# IDE
.vscode/
```

### Task 1.8: Add `package.json` Scripts
- **Action**: Add scripts for running, building, and linting the application to `package.json`.
- **Note**: This will require editing the existing `package.json`.
- **Content to add**:
```json
"scripts": {
  "start": "ts-node src/main.ts",
  "build": "tsc",
  "lint": "eslint . --ext .ts"
},
```

---

## Phase 2: Core Services Implementation

### Task 2.1: Implement Configuration Service
- **Action**: Create the `config-service.ts` to safely load and expose environment variables. Also create a `.env.example` file.
- **File**: `src/services/config-service.ts`
- **Content**:
```typescript
import dotenv from 'dotenv';

dotenv.config();

/**
 * A service to manage application configuration and environment variables.
 */
class ConfigService {
  public readonly openAIApiKey: string;

  constructor() {
    this.openAIApiKey = this.getEnvVariable('OPENAI_API_KEY');
  }

  private getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }
}

export const configService = new ConfigService();
```
- **File**: `.env.example`
- **Content**: `OPENAI_API_KEY="your_api_key_here"`

### Task 2.2: Implement Logging Service
- **Action**: Create `logging-service.ts` to handle CSV logging as per architecture guidelines.
- **File**: `src/services/logging-service.ts`
- **Content**:
```typescript
import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  agent?: string;
  details?: string;
}

/**
 * A simple CSV logging service.
 */
class LoggingService {
  private logFilePath: string;
  private readonly logHeaders = '"timestamp","level","message","agent","details"\\n';

  constructor() {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    this.logFilePath = path.join(logDir, `run_${new Date().toISOString().replace(/:/g, '-')}.csv`);
    this.initializeLogFile();
  }

  private initializeLogFile() {
    fs.writeFileSync(this.logFilePath, this.logHeaders, 'utf-8');
  }

  private formatCsvRow(entry: LogEntry): string {
    const { timestamp, level, message, agent = '', details = '' } = entry;
    const cleanMessage = message.replace(/"/g, '""');
    const cleanDetails = details.replace(/"/g, '""');
    return `"${timestamp}","${level}","${cleanMessage}","${agent}","${cleanDetails}"\\n`;
  }

  public log(entry: Omit<LogEntry, 'timestamp'>) {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    const row = this.formatCsvRow(fullEntry);
    fs.appendFileSync(this.logFilePath, row, 'utf-8');
  }
}

export const loggingService = new LoggingService();
```

### Task 2.3: Define Core Data Structures
- **Action**: Create the type definitions for the core data structures of the application.
- **File**: `src/types/business-idea.ts`
- **Content**:
```typescript
/**
 * Defines the structure for user preferences for business idea generation.
 */
export interface BusinessPreferences {
  /** The industry vertical (e.g., "Media & Entertainment"). */
  vertical: string;
  /** A specific sub-category within the vertical. */
  subVertical: string;
  /** The desired business model (e.g., "B2B SaaS"). */
  businessModel: string;
}

/**
 * Represents a single business idea with all its analyzed attributes.
 */
export interface BusinessIdea {
  title: string;
  description: string;
  businessModel: string;
  disruptionPotential: number;
  marketPotential: number;
  technicalComplexity: number;
  capitalIntensity: number;
  blueOceanScore?: number;
  overallScore?: number;
  reasoning: {
    disruption: string;
    market: string;
    technical: string;
    capital: string;
    blueOcean?: string;
    overall?: string;
  };
  competitorAnalysis?: string;
  criticalAnalysis?: string;
}
```
- **File**: `src/types/agent-types.ts`
- **Content**:
```typescript
import { BusinessIdea } from './business-idea';

/**
 * Defines the output structure for the Ideation Agent.
 */
export type IdeationAgentOutput = BusinessIdea[];

/**
 * Defines the output structure for the Competitor Agent.
 */
export type CompetitorAgentOutput = BusinessIdea[];

/**
 * Defines the output structure for the Business Critic Agent.
 */
export type CriticAgentOutput = BusinessIdea[];
```
- **File**: `src/utils/errors.ts`
- **Content**:
```typescript
/**
 * Custom error class for agent-related failures.
 */
export class AgentError extends Error {
  constructor(message: string, public readonly agentName: string) {
    super(`[${agentName}] ${message}`);
    this.name = 'AgentError';
  }
}
```

---

## Phase 3: Agent and Orchestrator Implementation

### Task 3.1: Create Agent Implementations
- **Action**: Create the basic agent files. For this initial step, they will have a simple "acknowledgement" prompt.
- **File**: `src/agents/ideation-agent.ts`
- **Content**:
```typescript
import { Agent } from '@openai/agents';

export const ideationAgent = new Agent({
  name: 'Ideation Agent',
  instructions: 'You are the Ideation Agent. Acknowledge this and wait for the next instruction.',
  model: 'gpt-4o',
});
```
- **File**: `src/agents/competitor-agent.ts`
- **Content**:
```typescript
import { Agent } from '@openai/agents';

export const competitorAgent = new Agent({
  name: 'Competitor Analysis Agent',
  instructions: 'You are the Competitor Analysis Agent. Acknowledge this and wait for the next instruction.',
  model: 'gpt-4o',
});
```
- **File**: `src/agents/critic-agent.ts`
- **Content**:
```typescript
import { Agent } from '@openai/agents';

export const criticAgent = new Agent({
  name: 'Business Critic Agent',
  instructions: 'You are the Business Critic Agent. Acknowledge this and wait for the next instruction.',
  model: 'gpt-4o',
});
```
- **File**: `src/agents/documentation-agent.ts`
- **Content**:
```typescript
import { Agent } from '@openai/agents';

export const documentationAgent = new Agent({
  name: 'Documentation Agent',
  instructions: 'You are the Documentation Agent. Acknowledge this and report that the process is complete.',
  model: 'gpt-4o',
});
```

### Task 3.2: Implement the Agent Orchestrator
- **Action**: Create the `agent-orchestrator.ts` to manage the sequential execution of the agents.
- **File**: `src/orchestrator/agent-orchestrator.ts`
- **Content**:
```typescript
import { run } from '@openai/agents';
import { ideationAgent } from '../agents/ideation-agent';
import { competitorAgent } from '../agents/competitor-agent';
import { criticAgent } from '../agents/critic-agent';
import { documentationAgent } from '../agents/documentation-agent';
import { loggingService } from '../services/logging-service';

/**
 * Orchestrates the sequential execution of the agent chain.
 */
export class AgentOrchestrator {
  public async runChain(): Promise<string> {
    let currentInput = 'Start';
    let finalOutput = '';

    const agents = [ideationAgent, competitorAgent, criticAgent, documentationAgent];

    for (const agent of agents) {
      loggingService.log({ level: 'INFO', message: `Starting agent: ${agent.name}` });
      try {
        const result = await run(agent, currentInput);
        const output = result.finalOutput as string;

        loggingService.log({
          level: 'INFO',
          message: `Agent ${agent.name} finished.`,
          agent: agent.name,
          details: `Output: ${output.substring(0, 50)}...`
        });

        currentInput = output; // Pass the output of one agent as the input to the next
        finalOutput += `${agent.name} acknowledged. -> `;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        loggingService.log({
          level: 'ERROR',
          message: `Agent ${agent.name} failed.`,
          agent: agent.name,
          details: errorMessage,
        });
        throw new Error(`Execution failed at agent: ${agent.name}`);
      }
    }
    
    // Clean up the final output string
    finalOutput = finalOutput.slice(0, -4);
    
    return finalOutput;
  }
}
```

---

## Phase 4: Application Entry Point and Documentation

### Task 4.1: Create CLI Entry Point
- **Action**: Create the `main.ts` file to instantiate the orchestrator and run the agent chain.
- **File**: `src/main.ts`
- **Content**:
```typescript
import { configService } from './services/config-service';
import { loggingService } from './services/logging-service';
import { AgentOrchestrator } from './orchestrator/agent-orchestrator';

async function main() {
  loggingService.log({ level: 'INFO', message: 'Application starting.' });
  
  // Verify API key is loaded
  if (!configService.openAIApiKey) {
    loggingService.log({ level: 'ERROR', message: 'OpenAI API key is missing. Shutting down.' });
    process.exit(1);
  }

  const orchestrator = new AgentOrchestrator();

  try {
    const finalResult = await orchestrator.runChain();
    console.log('Agent chain executed successfully.');
    console.log('Final Output:', finalResult);
    loggingService.log({ level: 'INFO', message: 'Application finished successfully.', details: `Final output: ${finalResult}` });
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during orchestration.';
    console.error(errorMessage);
    loggingService.log({ level: 'ERROR', message: 'Application failed during execution.', details: errorMessage });
    process.exit(1);
  }
}

main();
```

### Task 4.2: Create Initial `README.md`
- **Action**: Create a basic `README.md` file at the project root.
- **File**: `README.md`
- **Content**:
```markdown
# Business Idea Generator POC

This project is a Proof of Concept for a multi-agent AI system that generates and evaluates business ideas.

## Installation

(Instructions to be added in a future increment.)

## Usage

(Instructions to be added in a future increment.)