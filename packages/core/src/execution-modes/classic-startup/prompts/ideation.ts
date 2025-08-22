import { BusinessPreferences } from '@business-idea/shared';

export const getClassicStartupIdeationContext = (preferences: BusinessPreferences): string => {
  return `

EXECUTION MODE: CLASSIC STARTUP (Venture-scalable businesses)

FOCUS ON VENTURE-SCALABLE OPPORTUNITIES:
- Ideas that can scale to $100M+ ARR
- Network effects or economies of scale
- Defensible through technology, data, or network
- Can support a team of 50+ eventually
- Venture-fundable growth trajectory

PRIORITIZE IDEAS WITH:
- Disruption Potential: Completely revolutionizing industries
- Market Potential: $1B+ TAM with clear growth trajectory
- Technical Innovation: Breakthrough technology or novel approach
- Scalability: Can grow exponentially with marginal cost decrease
- Defensibility: Strong moats through technology, network effects, or data

USER CONTEXT:
Vertical: ${preferences.vertical}
Sub-vertical: ${preferences.subVertical}
Business Model: ${preferences.businessModel}
Additional Context: ${preferences.additionalContext || 'None provided'}

Generate revolutionary business ideas that could become unicorn startups, emphasizing disruption and massive scale.`;
};