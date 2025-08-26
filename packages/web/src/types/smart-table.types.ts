import { z } from "zod";
import { businessIdeaSchema, type WorkflowEvent } from "@business-idea/shared";
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  Waves,
  Target,
  Cpu,
  DollarSign,
  Building,
} from "lucide-react";

// Schema for idea data within events
export const ideaDataSchema = z.object({
  idea: businessIdeaSchema,
});

// Event type for results containing an idea
export type IdeaWorkflowEvent = Omit<WorkflowEvent, 'metadata'> & {
  metadata: {
    data: z.infer<typeof ideaDataSchema>;
  }
};

// Data structures for event processing
export interface CompetitorData {
  competitorAnalysis: string;
  blueOceanScore: number;
}

export interface CriticData {
  criticalAnalysis: string;
  overallScore: number;
  reasoning?: string;
}

export interface DocumentationData {
  reportPath: string;
}

// Score icon mapping
export const ScoreIcon: Record<string, LucideIcon> = {
  overall: TrendingUp,
  disruption: Waves,
  market: Target,
  technical: Cpu,
  capital: DollarSign,
  blueOcean: Building,
};

// Filter types
export type ExecutionModeFilter = 'all' | 'solopreneur' | 'classic-startup';

// Component props
export interface SmartTableProps {
  className?: string;
  isActive: boolean;
}