# ADR-005: Overall Score Calculation Methodology

## Status
Accepted

## Context
The Business Critic Agent is responsible for calculating a final "Overall Score" (0-10) for each business idea. This score represents the ultimate evaluation after considering all dimensions analyzed throughout the agent chain:
- Initial scores from Ideation Agent (disruption, market, technical, capital)
- Blue Ocean Score from Competitor Agent
- Critical analysis and risk assessment from Business Critic Agent

The PRD specifies that the Overall Score should be "based on all available data" with "balanced assessment" and "evidence-based reasoning," but does not provide a specific calculation methodology.

## Decision
We will implement a weighted scoring methodology that considers all previously calculated scores and applies risk adjustment based on the critical analysis:

1. **Base Score Calculation** (weighted average of existing scores):
   - Disruption Potential: 20%
   - Market Potential: 25%
   - Technical Complexity (inverted): 15%
   - Capital Intensity (inverted): 15%
   - Blue Ocean Score: 25%

2. **Risk Adjustment**: The base score will be adjusted based on critical factors identified:
   - Major risks/challenges identified: -0.5 to -2.0 points
   - Minor concerns: -0.1 to -0.5 points
   - Positive mitigating factors: +0.1 to +0.5 points

3. **Final Score**: Clamped between 0 and 10

Formula:
```
baseScore = (0.20 × disruptionPotential) + 
            (0.25 × marketPotential) + 
            (0.15 × (10 - technicalComplexity)) + 
            (0.15 × (10 - capitalIntensity)) + 
            (0.25 × blueOceanScore)

overallScore = clamp(baseScore + riskAdjustment, 0, 10)
```

## Consequences

### Positive
- Provides a systematic, reproducible methodology for final scoring
- Balances multiple dimensions with appropriate weights
- Incorporates risk assessment through adjustment mechanism
- Maintains flexibility through the risk adjustment component
- Inversely weights complexity and capital requirements (lower is better)

### Negative
- Fixed weights may not be optimal for all business types
- Risk adjustment requires subjective assessment by the agent
- May need refinement based on empirical results

### Mitigation
- Clear prompt engineering will guide consistent risk assessment
- Weights can be adjusted in future iterations based on feedback
- The methodology is transparent and explainable