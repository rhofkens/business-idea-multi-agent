# 003: Blue Ocean Scoring Methodology

## Status
Accepted

## Context
The Competitor Analysis Agent needs to calculate a "Blue Ocean Score" (0-10) for each business idea to indicate market whitespace. The PRD and architecture documents mention this requirement but don't specify the calculation methodology. We need a consistent, transparent approach to scoring that reflects the degree of market saturation and competitive intensity.

## Decision
We will implement a multi-factor Blue Ocean scoring algorithm that evaluates:

1. **Direct Competitor Count** (40% weight)
   - 0-2 competitors: 9-10 points
   - 3-5 competitors: 6-8 points
   - 6-10 competitors: 3-5 points
   - 10+ competitors: 0-2 points

2. **Market Saturation** (30% weight)
   - Assess if existing solutions fully address the market need
   - Look for unserved or underserved segments
   - Evaluate differentiation potential

3. **Innovation Uniqueness** (30% weight)
   - How novel is the approach compared to existing solutions
   - Presence of unique value propositions
   - Technological or business model innovations

The final score will be calculated as a weighted average, rounded to one decimal place.

## Consequences
- **Positive**: Provides consistent, explainable scores across all business ideas
- **Positive**: Balances multiple factors for a comprehensive assessment
- **Positive**: Allows for transparent reasoning in the competitorAnalysis field
- **Negative**: Requires multiple web searches per idea to gather sufficient data
- **Negative**: Some subjectivity in assessing market saturation and innovation uniqueness

## Implementation Notes
- The agent should perform at least 5 web searches per business idea
- Search queries should target: direct competitors, market analysis, existing solutions, industry trends, and market size
- The competitorAnalysis string should include the reasoning behind the score
- Edge cases (no search results, API failures) should default to a neutral score (5.0) with explanation