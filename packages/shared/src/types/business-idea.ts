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
  /** The execution mode for idea generation (e.g., "solopreneur", "classic-startup", or custom team composition). */
  executionMode?: string;
  /** Additional context or constraints provided by the user. */
  additionalContext?: string;
}

/**
 * Represents a single business idea with all its analyzed attributes.
 */
export interface BusinessIdea {
  /** Unique identifier for the business idea (ULID format) */
  id: string;
  title: string;
  description: string;
  businessModel: string;
  /** The execution mode or team composition this idea was generated for */
  executionMode?: string;
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
  starred?: boolean;
}