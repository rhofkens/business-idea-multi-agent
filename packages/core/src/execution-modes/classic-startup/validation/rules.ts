import { BusinessIdea } from '@business-idea/shared';
import { ValidationResult } from '../../base/ExecutionModeFactory';

export function validateClassicStartupIdea(idea: BusinessIdea): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for venture scale potential
  const description = idea.description.toLowerCase();
  
  if (description.includes('lifestyle business') || description.includes('small business')) {
    errors.push('Not suitable for venture funding - appears to be lifestyle business');
  }
  
  if (description.includes('local') || description.includes('regional')) {
    warnings.push('May lack global scalability required for venture returns');
  }
  
  if (description.includes('consulting') || description.includes('agency')) {
    warnings.push('Service businesses typically have limited scalability');
  }
  
  if (!description.includes('technology') && !description.includes('platform') && 
      !description.includes('software') && !description.includes('ai')) {
    warnings.push('May lack technology component needed for venture scale');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}