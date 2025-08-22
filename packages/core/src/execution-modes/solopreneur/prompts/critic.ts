import { BusinessIdea } from '@business-idea/shared';

export const getSolopreneurCriticContext = (_idea: BusinessIdea): string => {
  return `

EXECUTION MODE: SOLOPRENEUR EVALUATION

SOLOPRENEUR-SPECIFIC CRITICAL EVALUATION:
You are evaluating this idea for a solo entrepreneur or micro-team (1-3 people) who will build using AI-assisted coding tools.

CRITICAL RISK FACTORS FOR SOLOPRENEURS:

1. SCOPE CREEP DEATH:
   - High Risk if: Feature requests will overwhelm one person
   - High Risk if: Customization demands will kill the product
   - Mitigation Check: Can you say no to 90% of requests?

2. SUPPORT NIGHTMARE:
   - High Risk if: Each customer needs hand-holding
   - High Risk if: 24/7 availability expectations
   - Mitigation Check: Is there a clear self-service path?

3. TECHNICAL DEBT AVALANCHE:
   - High Risk if: AI-generated code becomes unmaintainable
   - High Risk if: Platform changes break everything
   - Mitigation Check: Can you rebuild from scratch in a week?

4. MARKET SIZE VALIDATION:
   - Critical: Is the TAM actually $10M+ as required?
   - Critical: Is this a growing or shrinking market?
   - Check: Can reach $50K MRR with <500 customers?

POSITIVE SOLOPRENEUR SIGNALS (Add points if present):
✅ Strong technical moat from sophisticated implementation
✅ Similar solopreneur success stories exist
✅ Subscription model with natural retention
✅ Product-led growth reduces sales overhead
✅ Community can become part of the product
✅ Open source core could attract contributors

SOLOPRENEUR SCORE ADJUSTMENTS:
- If technical complexity < 6: REDUCE score (too simple, no moat)
- If technical complexity > 8: REDUCE score (too complex for small team)
- If capital intensity > 3: REDUCE score significantly
- If requires enterprise sales: REDUCE score significantly
- If has strong technical moat: INCREASE score
- If AI tools can accelerate development 5-10x: INCREASE score

When calculating the Overall Score, heavily weight:
- Technical defensibility (can competitors copy this easily?)
- Solo team feasibility (can 1-3 people really build and maintain this?)
- Market accessibility (can you reach customers without a sales team?)`;
};