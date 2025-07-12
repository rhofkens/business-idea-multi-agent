# Business Idea Generator POC

This project is a Proof of Concept for a multi-agent AI system that generates and evaluates business ideas.

## How It Works

The system operates as a chain of specialized AI agents, orchestrated to perform a sequence of tasks:

1.  **Ideation Agent**: Receives user preferences (e.g., industry, business model) and generates a list of 10 initial business ideas. It scores each idea based on criteria like market potential and technical complexity.
2.  **Competitor Agent**: Takes the top ideas and performs a competitive analysis using Blue Ocean Strategy principles. It evaluates market saturation, identifies competitors, and calculates a Blue Ocean Score for each idea.
3.  **Business Critic Agent**: Critically evaluates ideas using web search capabilities for competitive intelligence. It performs risk assessment, validates assumptions, and calculates an Overall Score based on multiple weighted factors.
4.  **Documentation Agent**: Generates comprehensive markdown reports for the validated business ideas, including detailed analysis, insights, and recommendations.

## Business Critic Agent

The Business Critic Agent is responsible for the critical evaluation and risk assessment of business ideas. It:

### Key Features

- **Critical Evaluation**: Provides skeptical analysis of each business idea, identifying potential flaws and challenges
- **Risk Assessment**: Identifies major risks (technical, market, financial, competitive, operational) that could impact success
- **Web Search Integration**: Uses the OpenAI web search tool to gather competitive intelligence and validate market assumptions
- **Overall Score Calculation**: Implements the ADR-005 methodology for comprehensive scoring

### Overall Score Methodology

The Overall Score is calculated using a two-step process:

1. **Base Score** (weighted average):
   - Disruption Potential: 20%
   - Market Potential: 25%
   - Technical Complexity (inverted): 15%
   - Capital Intensity (inverted): 15%
   - Blue Ocean Score: 25%

2. **Risk Adjustments**:
   - For each major risk identified, the score is reduced by 0.5 to 2.0 points
   - Maximum total reduction: 5.0 points

### Usage

```typescript
import { runCriticAgent, runCriticAgentWithCache } from './src/agents/critic-agent';

// For production use
const results = await runCriticAgent(ideas);

// For development with caching
const cachedResults = await runCriticAgentWithCache(ideas);
```

## Documentation Agent

The Documentation Agent is responsible for generating comprehensive business reports from the analyzed ideas. It:

### Key Features

- **Single-Idea Iterative Processing**: Generates detailed documentation for each idea independently (per ADR-006)
- **Comprehensive Report Generation**: Creates structured markdown reports with introduction, detailed idea sections, and summary
- **Top 3 Ideas Highlighting**: Identifies and features the top-performing ideas based on Overall Score
- **Timestamp-Based File Management**: Saves reports with timestamped filenames for versioning
- **Performance Tracking**: Logs processing time and number of ideas processed

### Report Structure

The generated reports follow this structure:

1. **Introduction**: Overview of the business idea generation process and methodology
2. **Individual Idea Sections** (10 sections): Each idea gets a detailed section including:
   - Executive Summary
   - Market Analysis
   - Technical Analysis
   - Competitive Landscape
   - Key Metrics (scores and ratings)
   - Risk Assessment
   - Implementation Roadmap
   - Funding Considerations
3. **Summary and Recommendations**: Highlights top 3 ideas with strategic insights and next steps

### Usage

```typescript
import { runDocumentationAgent, runDocumentationAgentWithCache } from './src/agents/documentation-agent';

// For production use
const result = await runDocumentationAgent({
  ideas: analyzedBusinessIdeas
});
console.log(`Report saved to: ${result.reportPath}`);

// For development with caching
const cachedResult = await runDocumentationAgentWithCache({
  ideas: analyzedBusinessIdeas
});
```

## Installation

1. **Prerequisites**:
   - Node.js 18.x or higher
   - npm 9.x or higher
   - Git

2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd business-idea-multi-agent
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

## Usage

### Running the Complete System

To run the full multi-agent workflow:

```bash
npm run start
```

This will:
1. Generate 10 business ideas based on default preferences
2. Perform competitor analysis on each idea
3. Critically evaluate each idea with risk assessment
4. Generate a comprehensive markdown report in `docs/output/`

### Running Individual Agents

You can also run agents independently:

```bash
# Run only the ideation agent
npm run start:ideation

# Run only the competitor analysis
npm run start:competitor

# Run only the business critic
npm run start:critic

# Run only the documentation agent
npm run start:documentation
```

### Development Mode

For development with test caching enabled:

```bash
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Output

All generated reports are saved in the `docs/output/` directory with timestamped filenames:
- Format: `business-ideas-report-YYYYMMDD-HHMMSS.md`
- Example: `business-ideas-report-20241207-084532.md`

## Configuration

The system can be configured through environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `LOG_LEVEL`: Logging level (default: 'INFO')
- `USE_TEST_CACHE`: Enable test caching for development (default: false)

## Architecture

The project follows a deterministic multi-agent architecture:
- Each agent has a specific responsibility and output format
- Agents are orchestrated sequentially by the AgentOrchestrator
- All inputs and outputs are validated using Zod schemas
- Comprehensive logging is provided via CSV format

For detailed architecture information, see `docs/guidelines/architecture.md`.