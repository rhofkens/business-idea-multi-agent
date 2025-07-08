/**
 * Defines the structure for user preferences for business idea generation.
 */
export interface BusinessPreferences {
  /** The industry vertical (e.g., "Media & Entertainment"). */
  vertical: string;
  /** A specific sub-category within the vertical. */
  subVertical: string;
  /** The desired business model (e.g., "B2B SaaS"). */
  businessModel: string;
}

/**
 * Represents a single business idea with all its analyzed attributes.
 */
export interface BusinessIdea {
  title: string;
  description: string;
  businessModel: string;
  disruptionPotential: number;
  marketPotential: number;
  technicalComplexity: number;
  capitalIntensity: number;
  blueOceanScore?: number;
  overallScore?: number;
  reasoning: {
    disruption: string;
    market: string;
    technical: string;
    capital: string;
    blueOcean?: string;
    overall?: string;
  };
  competitorAnalysis?: string;
  criticalAnalysis?: string;
}