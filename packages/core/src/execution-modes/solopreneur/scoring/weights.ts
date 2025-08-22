import { ScoringWeights } from '../../base/ExecutionModeFactory';

export const solopreneurWeights: ScoringWeights = {
  technicalMoat: 0.25,      // Defensibility through technical sophistication
  marketPotential: 0.20,    // $10M+ TAM requirement
  aiLeverage: 0.20,         // How much AI accelerates development
  complexity: 0.15,         // Sweet spot: not too simple, not too complex
  capitalIntensity: 0.10,   // Lower is better
  blueOcean: 0.10          // Competitive differentiation
};