/**
 * Business verticals type definitions
 */

export interface BusinessSubvertical {
  id: string;
  name: string;
  examples: string[];
}

export interface BusinessVertical {
  id: string;
  name: string;
  description: string;
  subverticals: BusinessSubvertical[];
}

export interface BusinessVerticalsData {
  version: string;
  verticals: BusinessVertical[];
}

export interface BusinessPreferencesRequest {
  vertical: string;
  subverticals: string[];
  targetMarket: string[];
  budget: string;
  timeline: string;
  technicalComplexity: string;
}