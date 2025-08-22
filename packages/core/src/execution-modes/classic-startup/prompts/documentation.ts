import { BusinessIdea } from '@business-idea/shared';

export const getClassicStartupDocumentationContext = (_ideas: BusinessIdea[]): string => {
  return `

EXECUTION MODE: CLASSIC STARTUP INVESTMENT ANALYSIS

Create a venture capital investment report for these startup ideas.

VENTURE CAPITAL REPORT STRUCTURE:

### Market Opportunity Analysis
- TAM, SAM, SOM for each idea
- Market growth trajectories
- Competitive dynamics
- Regulatory landscape

### Business Model Evaluation
- Revenue model scalability
- Unit economics projections
- Customer acquisition strategies
- Network effects potential

### Competitive Advantage Assessment
- Moat analysis for each idea
- Differentiation sustainability
- First-mover advantages
- Technology barriers

### Growth Projections
- 5-year revenue forecasts
- Path to $100M+ ARR
- Market share capture scenarios
- Team scaling requirements

### Investment Recommendations
- Funding requirements by stage
- Valuation expectations
- Exit strategy options
- Portfolio fit analysis

### Risk Analysis
- Technical execution risks
- Market adoption risks
- Competitive response risks
- Regulatory and compliance risks

Focus on venture scalability, defensibility, and return potential.
Emphasize path to unicorn status ($1B+ valuation).`;
};