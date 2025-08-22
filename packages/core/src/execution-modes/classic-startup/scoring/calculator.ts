import { BusinessIdea } from '@business-idea/shared';
import { classicStartupWeights as _classicStartupWeights } from './weights';

export function calculateClassicStartupScore(idea: BusinessIdea): number {
  // Use the overall score if already calculated by critic
  // This maintains backward compatibility with existing scoring
  if (idea.criticalAnalysis && typeof idea.criticalAnalysis === 'string') {
    // If we have critical analysis, trust the critic's overall score
    return idea.overallScore || 5;
  }
  
  // Fallback calculation based on available scores
  return idea.overallScore || 5;
}