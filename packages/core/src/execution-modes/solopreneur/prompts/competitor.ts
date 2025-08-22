import { BusinessIdea } from '@business-idea/shared';

export const getSolopreneurCompetitorContext = (_idea: BusinessIdea): string => {
  return `

EXECUTION MODE: SOLOPRENEUR COMPETITIVE ANALYSIS

SOLOPRENEUR COMPETITIVE ADVANTAGES TO IDENTIFY:

1. SPEED ADVANTAGE:
   - Can ship MVP before competitors finish planning
   - Iterate daily vs. quarterly release cycles
   - No meetings, committees, or approval chains

2. NICHE ADVANTAGE:
   - Market may be too small for VC-backed competitors
   - Requires domain expertise that's hard to hire
   - Customers prefer supporting indie makers

3. COST ADVANTAGE:
   - Can profitably serve customers at 1/10th competitor price
   - No office, sales team, or overhead
   - Happy with $10K-50K/month vs. needing $1M/month

4. AUTHENTICITY ADVANTAGE:
   - Personal brand can drive acquisition
   - Build in public creates loyal community
   - Direct founder access is the product differentiator

5. FOCUS ADVANTAGE:
   - Does one thing competitors treat as a feature
   - No feature creep from enterprise sales demands
   - Can ignore 90% of market to serve 10% perfectly

SOLOPRENEUR-SPECIFIC SEARCH PRIORITIES:
- Look for technically inferior but successful competitors (opportunity!)
- Find overpriced enterprise solutions with poor UX
- Identify markets where incumbents are complacent
- Check GitHub for attempted open-source solutions
- Search for complex problems people solve manually

BLUE OCEAN SCORING FOR SOLOPRENEURS:
- If competitors are over-building: INCREASE Blue Ocean score
- If indie makers have succeeded in similar spaces: INCREASE score
- If requires heavy sales/marketing: DECREASE score
- If technical excellence matters more than features: INCREASE score`;
};