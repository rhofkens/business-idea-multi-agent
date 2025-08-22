import { BusinessPreferences, BusinessIdea } from '@business-idea/shared';

export interface ScoringWeights {
  [key: string]: number;
}

export interface ExecutionModeConfig {
  mode: string;
  displayName: string;
  description: string;
  targetTeamSize: string;
  targetMarketSize: string;
  primaryFocus: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export abstract class ExecutionModeFactory {
  abstract readonly mode: string;
  
  // These methods now return content to be inserted into the existing prompts
  abstract getIdeationContext(preferences: BusinessPreferences): string;
  abstract getCompetitorContext(idea: BusinessIdea): string;
  abstract getCriticContext(idea: BusinessIdea): string;
  abstract getDocumentationContext(ideas: BusinessIdea[]): string;
  
  abstract getScoringWeights(): ScoringWeights;
  abstract calculateOverallScore(idea: BusinessIdea): number;
  
  abstract validateIdea(idea: BusinessIdea): ValidationResult;
  
  abstract getConfig(): ExecutionModeConfig;
}