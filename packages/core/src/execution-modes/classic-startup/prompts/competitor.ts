import { BusinessIdea } from '@business-idea/shared';

export const getClassicStartupCompetitorContext = (_idea: BusinessIdea): string => {
  return `

EXECUTION MODE: CLASSIC STARTUP COMPETITIVE ANALYSIS

COMPREHENSIVE COMPETITOR ANALYSIS FOR VENTURE-SCALE STARTUPS:

1. DIRECT COMPETITORS:
   - Identify 3-5 companies solving the same problem
   - Their funding, valuation, and market share
   - Strengths and weaknesses analysis
   - Why they haven't captured the entire market

2. INDIRECT COMPETITORS:
   - Alternative solutions customers use today
   - Substitute products or services
   - DIY or manual approaches
   - Adjacent market players who could pivot

3. MARKET DYNAMICS:
   - Total addressable market size and growth rate
   - Market maturity and adoption curve position
   - Regulatory barriers or advantages
   - Network effects and winner-take-all dynamics

4. COMPETITIVE ADVANTAGES:
   - Technical superiority possibilities
   - Go-to-market advantages
   - Cost structure advantages
   - Team or timing advantages

5. DEFENSIBILITY ASSESSMENT:
   - Barriers to entry for new competitors
   - Switching costs for customers
   - Economies of scale potential
   - Intellectual property opportunities

BLUE OCEAN SCORING FOR STARTUPS:
- Large untapped market: INCREASE score
- Heavy competition from funded startups: DECREASE score
- Opportunity for platform play: INCREASE score
- Winner-take-all dynamics: Consider carefully`;
};