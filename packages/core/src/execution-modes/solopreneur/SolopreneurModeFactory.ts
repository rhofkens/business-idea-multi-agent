import { BusinessPreferences, BusinessIdea } from '@business-idea/shared';
import { 
  ExecutionModeFactory, 
  ScoringWeights, 
  ExecutionModeConfig, 
  ValidationResult 
} from '../base/ExecutionModeFactory';
import { getSolopreneurIdeationContext } from './prompts/ideation';
import { getSolopreneurCompetitorContext } from './prompts/competitor';
import { getSolopreneurCriticContext } from './prompts/critic';
import { getSolopreneurDocumentationContext } from './prompts/documentation';
import { solopreneurWeights } from './scoring/weights';
import { calculateSolopreneurScore } from './scoring/calculator';
import { validateSolopreneurIdea } from './validation/rules';

export class SolopreneurModeFactory extends ExecutionModeFactory {
  readonly mode = 'solopreneur';
  
  getIdeationContext(preferences: BusinessPreferences): string {
    return getSolopreneurIdeationContext(preferences);
  }
  
  getCompetitorContext(idea: BusinessIdea): string {
    return getSolopreneurCompetitorContext(idea);
  }
  
  getCriticContext(idea: BusinessIdea): string {
    return getSolopreneurCriticContext(idea);
  }
  
  getDocumentationContext(ideas: BusinessIdea[]): string {
    return getSolopreneurDocumentationContext(ideas);
  }
  
  getScoringWeights(): ScoringWeights {
    return solopreneurWeights;
  }
  
  calculateOverallScore(idea: BusinessIdea): number {
    return calculateSolopreneurScore(idea);
  }
  
  validateIdea(idea: BusinessIdea): ValidationResult {
    return validateSolopreneurIdea(idea);
  }
  
  getConfig(): ExecutionModeConfig {
    return {
      mode: 'solopreneur',
      displayName: 'Solo Entrepreneur',
      description: 'Technical ideas for 1-3 person teams using AI-assisted coding',
      targetTeamSize: '1-3 people',
      targetMarketSize: '$10M-$1B TAM',
      primaryFocus: 'Technical moats and AI leverage'
    };
  }
}