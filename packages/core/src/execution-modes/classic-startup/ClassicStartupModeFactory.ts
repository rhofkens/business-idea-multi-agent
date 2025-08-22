import { BusinessPreferences, BusinessIdea } from '@business-idea/shared';
import { 
  ExecutionModeFactory, 
  ScoringWeights, 
  ExecutionModeConfig, 
  ValidationResult 
} from '../base/ExecutionModeFactory';
import { getClassicStartupIdeationContext } from './prompts/ideation';
import { getClassicStartupCompetitorContext } from './prompts/competitor';
import { getClassicStartupCriticContext } from './prompts/critic';
import { getClassicStartupDocumentationContext } from './prompts/documentation';
import { classicStartupWeights } from './scoring/weights';
import { calculateClassicStartupScore } from './scoring/calculator';
import { validateClassicStartupIdea } from './validation/rules';

export class ClassicStartupModeFactory extends ExecutionModeFactory {
  readonly mode = 'classic-startup';
  
  getIdeationContext(preferences: BusinessPreferences): string {
    return getClassicStartupIdeationContext(preferences);
  }
  
  getCompetitorContext(idea: BusinessIdea): string {
    return getClassicStartupCompetitorContext(idea);
  }
  
  getCriticContext(idea: BusinessIdea): string {
    return getClassicStartupCriticContext(idea);
  }
  
  getDocumentationContext(ideas: BusinessIdea[]): string {
    return getClassicStartupDocumentationContext(ideas);
  }
  
  getScoringWeights(): ScoringWeights {
    return classicStartupWeights;
  }
  
  calculateOverallScore(idea: BusinessIdea): number {
    return calculateClassicStartupScore(idea);
  }
  
  validateIdea(idea: BusinessIdea): ValidationResult {
    return validateClassicStartupIdea(idea);
  }
  
  getConfig(): ExecutionModeConfig {
    return {
      mode: 'classic-startup',
      displayName: 'Classic Startup',
      description: 'Venture-scalable ideas for funded startups targeting unicorn status',
      targetTeamSize: '50+ people',
      targetMarketSize: '$1B+ TAM',
      primaryFocus: 'Disruption and massive scale'
    };
  }
}