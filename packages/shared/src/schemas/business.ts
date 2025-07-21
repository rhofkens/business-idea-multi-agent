/**
 * JSON Schema validation for business preferences
 */

import businessVerticalsData from '../data/business-verticals.json';
import businessModelsData from '../data/business-models.json';
import type { BusinessVerticalsData } from '../types/business.js';

const data = businessVerticalsData as BusinessVerticalsData;
const businessModels = businessModelsData.businessModels;

// Generate enum values from the business verticals data
const verticalIds = data.verticals.map(v => v.id);
const allSubverticalIds = data.verticals.flatMap(v => v.subverticals.map(s => s.id));

/**
 * JSON Schema for validating business preferences request
 */
export const businessPreferencesRequestSchema = {
  type: 'object',
  properties: {
    vertical: {
      type: 'string',
      enum: verticalIds,
      description: 'The selected business vertical ID'
    },
    subverticals: {
      type: 'array',
      items: {
        type: 'string',
        enum: allSubverticalIds
      },
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
      description: 'Selected subvertical IDs (1-3 items)'
    },
    targetMarket: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['B2B', 'B2C', 'B2B2C', 'Marketplace']
      },
      minItems: 1,
      uniqueItems: true,
      description: 'Target market preferences'
    },
    budget: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Budget range for the business idea'
    },
    timeline: {
      type: 'string',
      enum: ['short', 'medium', 'long'],
      description: 'Timeline preference for implementation'
    },
    technicalComplexity: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Preferred technical complexity level'
    }
  },
  required: ['vertical', 'subverticals', 'targetMarket', 'budget', 'timeline', 'technicalComplexity'],
  additionalProperties: false
} as const;

/**
 * Helper function to validate that selected subverticals belong to the selected vertical
 */
export function validateSubverticalsForVertical(vertical: string, subverticals: string[]): boolean {
  const selectedVertical = data.verticals.find(v => v.id === vertical);
  if (!selectedVertical) return false;
  
  const validSubverticalIds = selectedVertical.subverticals.map(s => s.id);
  return subverticals.every(id => validSubverticalIds.includes(id));
}

/**
 * Get all vertical options for UI
 */
export function getVerticalOptions() {
  return data.verticals.map(v => ({
    id: v.id,
    name: v.name,
    description: v.description
  }));
}

/**
 * Get subvertical options for a specific vertical
 */
export function getSubverticalOptions(verticalId: string) {
  const vertical = data.verticals.find(v => v.id === verticalId);
  if (!vertical) return [];
  
  return vertical.subverticals.map(s => ({
    id: s.id,
    name: s.name,
    examples: s.examples
  }));
}

/**
 * Get all business model options for UI
 */
export function getBusinessModelOptions() {
  return businessModels.map(model => ({
    id: model.id,
    name: model.name,
    description: model.description
  }));
}