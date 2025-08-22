import { BusinessIdea } from '@business-idea/shared';
import { ValidationResult } from '../../base/ExecutionModeFactory';

export function validateSolopreneurIdea(idea: BusinessIdea): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check TAM is large enough
  const description = idea.description.toLowerCase();
  if (description.includes('micro-niche') || description.includes('very small market')) {
    errors.push('Market size appears too small (must be $10M+ TAM)');
  }
  
  // Check for technical moat
  if (!description.includes('technical') && !description.includes('algorithm') && 
      !description.includes('ai') && !description.includes('ml') && 
      !description.includes('complex')) {
    warnings.push('Idea may lack technical defensibility');
  }
  
  // Check for no-code simplicity (bad for solopreneurs)
  if (description.includes('no-code') || description.includes('drag-and-drop') || 
      description.includes('simple')) {
    errors.push('Idea appears too simple - no technical moat');
  }
  
  // Check for high support burden
  if (description.includes('consulting') || description.includes('custom') || 
      description.includes('enterprise sales')) {
    warnings.push('May require too much customer support for solopreneur');
  }
  
  // Check for platform dependency
  if (description.includes('plugin') || description.includes('extension') || 
      description.includes('addon')) {
    warnings.push('High platform dependency risk');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}