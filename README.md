# Business Idea Generator

A monorepo containing a multi-agent AI system that generates and evaluates business ideas, featuring a **modern web application with authentication** and a CLI tool for business idea generation.

## 🏗️ Monorepo Structure

This project is organized as a monorepo using npm workspaces:

```
business-idea-multi-agent/
├── packages/
│   ├── core/          # Backend server with authentication + AI agents
│   ├── shared/        # Shared types and utilities
│   └── web/           # React web application with authentication
├── docs/              # Documentation and reports
└── package.json       # Root workspace configuration
```

### Packages

- **@business-idea/core**: Backend server with Fastify-based authentication system, plus AI agents and orchestration logic for business idea generation
- **@business-idea/shared**: Shared TypeScript types, interfaces, and schemas used across packages
- **@business-idea/web**: Modern React web application with authentication, session management, and user interface for the business idea generator

## 🔐 Authentication System

The application now features a complete authentication system:

### Test Users

For development and testing, use these pre-configured users:

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `Adm!nP@ss2024` | Administrator |
| `user@test.com` | `Us3r$ecure#24` | Regular User |
| `guest@test.com` | `Gu3st!Pass@24` | Guest User |

### Features

- **Session-based authentication** with secure cookie management
- **Password hashing** using bcrypt
- **CORS configuration** for frontend-backend communication
- **Protected routes** and authentication middleware
- **In-memory user store** for development (easily replaceable with database)
- **Comprehensive logging** and debug utilities

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

3. **Install dependencies** (this will install all workspace packages):
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

5. **Build all packages**:
   ```bash
   npm run build
   ```

## Usage

### 🚀 Quick Start (Recommended)

**Start the full application with authentication:**

1. **Start the backend server** (in one terminal):
   ```bash
   cd packages/core && npm run dev:server
   ```
   This starts the Fastify authentication server on `http://localhost:3001`

2. **Start the frontend** (in another terminal):
   ```bash
   cd packages/web && npm run dev
   ```
   This starts the React app on `http://localhost:5173`

3. **Access the application**:
   - Open `http://localhost:5173` in your browser
   - Login with any test user (see Authentication System section above)
   - You'll be redirected to the main application after successful login

### CLI Application (Legacy Mode)

To run the original multi-agent workflow via CLI (without web interface):

```bash
cd packages/core && npm run start:cli
```

This will:
1. Generate 10 business ideas based on default preferences
2. Perform competitor analysis on each idea
3. Critically evaluate each idea with risk assessment
4. Generate a comprehensive markdown report in `docs/output/`

### Web Application (Production)

To build and run the web application for production:

```bash
# Build all packages
npm run build

# Start backend server in production
cd packages/core && npm run start:server

# Serve frontend (you'll need a static file server)
npm run build:web
```

### Command Line Options (CLI)

```bash
# Run with test cache enabled (for development)
npm run start:core -- --test-cache
```

### Development Mode with Test Cache

The test cache feature helps speed up development by caching agent outputs:

```bash
# Run with test cache enabled
npm run start:core -- --test-cache
```

When enabled, the system will:
- Cache agent outputs in `tests/cache/` directory
- Reuse cached results on subsequent runs
- Display a message: "🧪 Test cache mode enabled"

This is particularly useful during development to avoid waiting for AI responses when testing downstream agents.

## Development

### Monorepo Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:shared
npm run build:web

# Run linting across all packages
npm run lint

# Development mode
npm run dev:web    # Start web app dev server
```

### Working with Individual Packages

Each package can be developed independently:

```bash
# Work on core package
cd packages/core
npm run build
npm run lint

# Work on web package
cd packages/web
npm run dev
npm run build
```

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

Create a `.env` file in the root directory with the following:

```env
# Required for AI business idea generation
OPENAI_API_KEY=your-api-key-here

# Optional: Backend server configuration
PORT=3001
HOST=0.0.0.0

# Optional: Session configuration
SESSION_SECRET=your-secure-session-secret-here
```

The core package will automatically load this configuration for both the authentication server and AI agents.

### Backend Server Configuration

The authentication server runs on:
- **Default URL**: `http://localhost:3001`
- **API Base**: `http://localhost:3001/api`
- **Auth endpoints**: `http://localhost:3001/api/auth/*`

Key endpoints:
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check authentication status
- `GET /api/auth/me` - Get current user info

### Command Line Options

- `--test-cache`: Enable test caching for development. Caches agent outputs in `tests/cache/` to speed up repeated runs.

Example:
```bash
npm run start:core -- --test-cache
```

## Architecture

The project follows a modular monorepo architecture:

- **Separation of Concerns**: Core business logic is separated from UI and shared utilities
- **Type Safety**: Shared types ensure consistency across packages
- **Deterministic Agent Chain**: Each agent has a specific responsibility and output format
- **Schema Validation**: All inputs and outputs are validated using Zod schemas
- **Event Streaming**: Real-time progress updates during agent processing
- **Comprehensive Logging**: Detailed logging in CSV format for debugging

### Package Dependencies

```
@business-idea/web → @business-idea/shared
@business-idea/core → @business-idea/shared
```

For detailed architecture information, see `docs/guidelines/architecture.md`.

## Contributing

This is a proof of concept project. For contributions:

1. Follow the existing code structure and patterns
2. Ensure all TypeScript types are properly defined
3. Add appropriate validation using Zod schemas
4. Update documentation as needed
5. Run linting and type checking before submitting changes

## 🗄️ Database Persistence

The application now includes a persistence layer using **SQLite and Drizzle ORM**, allowing all generated ideas and agent runs to be saved and retrieved.

### Key Features

- **SQLite Database**: A local `business-ideas.db` file stores all data.
- **Drizzle ORM**: Provides a type-safe query builder for database interactions.
- **Data Repositories**: `RunRepository` and `IdeaRepository` in `packages/core` handle all database operations.
- **API Endpoints**: New routes in `packages/core/src/routes/ideas-routes.ts` expose database content.
- **Frontend Integration**: The `SmartTable` component can now display historical data from the database.

### How to Use

1.  **Database Generation**: The database file is created automatically.
2.  **Migrations**: To generate and apply database migrations, use the following commands in the `packages/core` directory:
    ```bash
    # Generate migration files based on schema changes
    npm run db:generate

    # Apply migrations to the database
    npm run db:migrate
    ```

## Future Enhancements

- API package for RESTful endpoints
- Real-time WebSocket support for streaming updates
- User authentication and multi-tenancy
- Enhanced web UI with visualization components
- Mobile application support