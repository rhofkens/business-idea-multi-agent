import { ScoringWeights } from '../../base/ExecutionModeFactory';

export const classicStartupWeights: ScoringWeights = {
  marketPotential: 0.30,    // Large TAM critical
  disruption: 0.25,         // Innovation potential
  scalability: 0.20,        // Growth potential
  defensibility: 0.15,      // Moats and barriers
  blueOcean: 0.10          // Market opportunity
};