import { BusinessIdea } from '@business-idea/shared';

export const getClassicStartupCriticContext = (_idea: BusinessIdea): string => {
  return `

EXECUTION MODE: CLASSIC STARTUP EVALUATION

VENTURE CAPITAL EVALUATION FRAMEWORK:

Evaluate this idea as a venture capital analyst looking for unicorn potential.

KEY EVALUATION CRITERIA:

1. MARKET ASSESSMENT:
   - Is the TAM really $1B+?
   - Is the market growing or shrinking?
   - Are there regulatory headwinds?
   - Is timing right (not too early, not too late)?

2. PRODUCT-MARKET FIT:
   - Is this a vitamin or painkiller?
   - How strong is the value proposition?
   - Will customers actually pay?
   - Is there evidence of demand?

3. BUSINESS MODEL VIABILITY:
   - Unit economics analysis
   - Customer acquisition cost vs lifetime value
   - Gross margin potential
   - Path to profitability

4. COMPETITIVE POSITION:
   - Why will this win vs established players?
   - What's the unfair advantage?
   - How defensible is the moat?
   - Network effects potential?

5. SCALABILITY:
   - Can this reach $100M ARR?
   - Does it have exponential growth potential?
   - Are there economies of scale?

VENTURE SCORE ADJUSTMENTS:
- If TAM < $1B: REDUCE score significantly
- If no clear path to $100M ARR: REDUCE score
- If no defensible moat: REDUCE score
- If strong network effects: INCREASE score
- If proven founder-market fit: INCREASE score`;
};