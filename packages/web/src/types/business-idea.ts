/**
 * Frontend-specific types for business ideas.
 * This file defines the display models used in the UI components.
 */

// Re-export shared types that are used directly in the frontend
export type { BusinessPreferences } from '@business-idea/shared';

/**
 * Frontend representation of a business idea with UI-specific fields.
 * This interface is used by the SmartTable component and other UI elements.
 */
export interface BusinessIdea {
  /** ULID-based unique identifier for the business idea */
  id: string;
  /** Whether the idea is starred/favorited by the user */
  starred: boolean;
  /** The main title of the business idea */
  title: string;
  /** A suggested name for the business */
  name: string;
  /** Detailed description of the business idea */
  description: string;
  /** The business model type (e.g., "B2B SaaS", "Marketplace") */
  businessModel: string;
  /** Execution mode for the business idea (solopreneur or classic-startup) */
  executionMode?: string;
  /** Aggregated scores for different evaluation criteria */
  scores: {
    /** Overall calculated score */
    overall: number | null;
    /** Disruption potential score (0-10) */
    disruption: number;
    /** Market potential score (0-10) */
    market: number;
    /** Technical complexity score (0-10) */
    technical: number;
    /** Capital intensity score (0-10) */
    capital: number;
    /** Blue ocean strategy score (0-10) */
    blueOcean: number | null;
  };
  /** Detailed reasoning for each score */
  reasoning: {
    /** Reasoning for overall score */
    overall: string;
    /** Reasoning for disruption potential */
    disruption: string;
    /** Reasoning for market potential */
    market: string;
    /** Reasoning for technical complexity */
    technical: string;
    /** Reasoning for capital intensity */
    capital: string;
    /** Reasoning for blue ocean score */
    blueOcean: string;
  };
  /** Competitor analysis from the Competitor Agent */
  competitorAnalysis: string | null;
  /** Critical analysis from the Critic Agent */
  criticalAnalysis: string | null;
  /** Path to the full report file */
  reportPath: string | null;
  /** ISO timestamp of when the idea was last updated */
  lastUpdated: string;
  /** Whether this idea is from the current generation run */
  isCurrentRun: boolean;
}

/**
 * Form data structure for idea generation
 */
export interface IdeaGenerationFormData {
  vertical: string;
  subVertical: string;
  businessModel: string;
  additionalContext?: string;
}

/**
 * Agent status for progress tracking
 */
export interface AgentStatus {
  id: string;
  name: string;
  progress: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask: string;
  icon: () => React.ReactNode | null;
}

/**
 * Terminal event for displaying agent output
 */
export interface TerminalEvent {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  level: 'info' | 'error' | 'warning';
}