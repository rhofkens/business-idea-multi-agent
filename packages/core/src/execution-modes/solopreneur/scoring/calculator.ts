import { BusinessIdea } from '@business-idea/shared';
import { solopreneurWeights } from './weights';

export function calculateSolopreneurScore(idea: BusinessIdea): number {
  // Map existing scores to solopreneur-specific weights
  const scores = {
    technicalMoat: idea.technicalComplexity || 0,
    marketPotential: idea.marketPotential || 0,
    aiLeverage: estimateAILeverage(idea),
    complexity: calculateComplexityScore(idea),
    capitalIntensity: 10 - (idea.capitalIntensity || 5), // Invert: lower capital is better
    blueOcean: idea.blueOceanScore || 0
  };
  
  // Calculate weighted average
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [key, weight] of Object.entries(solopreneurWeights)) {
    const score = scores[key as keyof typeof scores] || 0;
    totalScore += score * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

function estimateAILeverage(idea: BusinessIdea): number {
  // Estimate based on technical complexity and description
  const description = idea.description.toLowerCase();
  
  let score = 5; // Base score
  
  // Keywords that suggest high AI leverage
  const highLeverageKeywords = ['api', 'integration', 'dashboard', 'analytics', 'automation', 'workflow', 'saas'];
  const lowLeverageKeywords = ['hardware', 'embedded', 'real-time', 'low-level', 'kernel', 'driver'];
  
  for (const keyword of highLeverageKeywords) {
    if (description.includes(keyword)) score += 0.5;
  }
  
  for (const keyword of lowLeverageKeywords) {
    if (description.includes(keyword)) score -= 0.5;
  }
  
  // Cap between 3 and 9
  return Math.max(3, Math.min(9, score));
}

function calculateComplexityScore(idea: BusinessIdea): number {
  // Sweet spot is 6-8 complexity (not too simple, not too complex)
  const technical = idea.technicalComplexity || 5;
  
  if (technical >= 6 && technical <= 8) {
    return 9; // Perfect complexity
  } else if (technical >= 5 && technical <= 9) {
    return 7; // Good complexity
  } else if (technical < 5) {
    return 4; // Too simple
  } else {
    return 3; // Too complex
  }
}