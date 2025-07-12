# Business Idea Generator POC

This project is a Proof of Concept for a multi-agent AI system that generates and evaluates business ideas.

## How It Works

The system operates as a chain of specialized AI agents, orchestrated to perform a sequence of tasks:

1.  **Ideation Agent**: Receives user preferences (e.g., industry, business model) and generates a list of 10 initial business ideas. It scores each idea based on criteria like market potential and technical complexity.
2.  **Competitor Agent**: Takes the top ideas and performs a competitive analysis using Blue Ocean Strategy principles. It evaluates market saturation, identifies competitors, and calculates a Blue Ocean Score for each idea.
3.  **Business Critic Agent**: Critically evaluates ideas using web search capabilities for competitive intelligence. It performs risk assessment, validates assumptions, and calculates an Overall Score based on multiple weighted factors.
4.  **Documentation Agent**: Generates comprehensive markdown reports for the validated business ideas, including detailed analysis, insights, and recommendations.

## Ideation Agent

The Ideation Agent is responsible for generating innovative business ideas based on market trends and consumer needs. It:

### Key Features

- **Multi-Industry Focus**: Generates ideas across healthcare, education, sustainability, fintech, retail/e-commerce, and lifestyle
- **Two-Pass Generation Process**: Uses the 'o3' model to generate 10 high-quality ideas per industry, then selects the top 10 overall
- **Comprehensive Idea Details**: Each idea includes name, description, problem statement, solution, target market, and more
- **Initial Scoring**: Provides preliminary scores for disruption potential, market potential, technical complexity, and capital intensity
- **Event Streaming**: Provides real-time progress updates during the generation process

### Output Format

Each idea contains:
- Name and description
- Industry classification
- Problem solved and proposed solution
- Target market definition
- Initial viability scores (0-10 scale)

## Competitor Analysis Agent

The Competitor Analysis Agent evaluates the competitive landscape for each business idea using Blue Ocean Strategy principles. It:

### Key Features

- **Competitor Identification**: Finds and analyzes 4-6 relevant competitors for each idea
- **Market Saturation Analysis**: Evaluates how crowded the competitive space is
- **Blue Ocean Scoring**: Implements ADR-003 methodology to calculate innovation potential
- **Differentiation Factors**: Identifies unique aspects that set the idea apart from competitors
- **Event Streaming**: Provides real-time progress updates during analysis

### Blue Ocean Score Calculation

The score (0-10 scale) is based on:
- **Market Saturation** (40% weight): Lower saturation = higher score
- **Innovation Level** (35% weight): More innovative = higher score  
- **Differentiation Clarity** (25% weight): Clearer unique value = higher score

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

### Command Line Options

```bash
# Run with test cache enabled (for development)
npm run start -- --test-cache
```

**Note**: Individual agent execution is not currently supported via npm scripts. The system is designed to run as a complete chain through the orchestrator.

### Development Mode with Test Cache

The test cache feature helps speed up development by caching agent outputs:

```bash
# Run with test cache enabled
npm run start -- --test-cache
```

When enabled, the system will:
- Cache agent outputs in `tests/cache/` directory
- Reuse cached results on subsequent runs
- Display a message: "🧪 Test cache mode enabled"

This is particularly useful during development to avoid waiting for AI responses when testing downstream agents.

### Code Quality Commands

```bash
# Run linting
npm run lint

# Run type checking (builds the project)
npm run build
```

### Output

All generated reports are saved in the `docs/output/` directory with timestamped filenames:
- Format: `business-ideas-report-YYYYMMDD-HHMMSS.md`
- Example: `business-ideas-report-20241207-084532.md`

## Configuration

### Environment Variables

Create a `.env` file with the following:

```env
OPENAI_API_KEY=your-api-key-here
```

### Command Line Options

- `--test-cache`: Enable test caching for development. Caches agent outputs in `tests/cache/` to speed up repeated runs.

Example:
```bash
npm run start -- --test-cache
```

## Architecture

The project follows a deterministic multi-agent architecture:
- Each agent has a specific responsibility and output format
- Agents are orchestrated sequentially by the AgentOrchestrator
- All inputs and outputs are validated using Zod schemas
- Comprehensive logging is provided via CSV format

For detailed architecture information, see `docs/guidelines/architecture.md`.