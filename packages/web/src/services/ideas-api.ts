/**
 * Ideas API service for managing business ideas in the frontend.
 * 
 * This service provides methods to:
 * - Fetch all ideas for the current user
 * - Fetch a single idea by ID
 * - Update the starred status of ideas
 * 
 * It handles the transformation between backend API responses and frontend models.
 */

import { apiClient } from './api-client';
import type { BusinessIdea } from '../types/business-idea';

// Response types matching the backend API
export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  businessModel: string;
  executionMode?: string;
  disruptionPotential: number;
  marketPotential: number;
  technicalComplexity: number;
  capitalIntensity: number;
  blueOceanScore: number | null;
  overallScore: number | null;
  reasoning: string;
  domain?: string;
  targetAudience?: string;
  problemStatement?: string;
  proposedSolution?: string;
  keyFeatures?: string;
  revenueModel?: string;
  competitiveLandscape?: string;
  competitorAnalysis: string | null;
  criticalAnalysis: string | null;
  stage: 'ideation' | 'competitor' | 'critic' | 'documented';
  documentPath: string | null;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdeasListResponse {
  ideas: IdeaResponse[];
  total: number;
}

export interface IdeaDetailResponse {
  idea: IdeaResponse;
}

/**
 * Transforms an IdeaResponse from the API into a BusinessIdea for the UI
 */
function transformIdeaResponse(idea: IdeaResponse): BusinessIdea {
  return {
    id: idea.id,
    starred: idea.starred,
    title: idea.title,
    name: idea.title, // For backward compatibility
    description: idea.description,
    businessModel: idea.businessModel,
    executionMode: idea.executionMode,
    scores: {
      overall: idea.overallScore,
      disruption: idea.disruptionPotential,
      market: idea.marketPotential,
      technical: idea.technicalComplexity,
      capital: idea.capitalIntensity,
      blueOcean: idea.blueOceanScore,
    },
    reasoning: idea.reasoning ? (typeof idea.reasoning === 'string' ? JSON.parse(idea.reasoning) : idea.reasoning) : null,
    competitorAnalysis: idea.competitorAnalysis,
    criticalAnalysis: idea.criticalAnalysis,
    reportPath: idea.documentPath,
    lastUpdated: idea.updatedAt,
    isCurrentRun: false, // Database ideas are not from current run
  };
}

/**
 * Ideas API service for frontend-backend communication
 */
export const ideasApi = {
  /**
   * Fetches all ideas for the current user
   * @param starred - Optional filter to get only starred ideas
   * @returns Promise with ideas list and total count
   */
  async getIdeas(starred?: boolean): Promise<{ ideas: BusinessIdea[]; total: number }> {
    const params = new URLSearchParams();
    if (starred !== undefined) {
      params.append('starred', starred.toString());
    }

    const response = await apiClient.get<IdeasListResponse>(`/api/ideas${params.toString() ? `?${params.toString()}` : ''}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch ideas');
    }
    
    return {
      ideas: response.data.ideas.map(transformIdeaResponse),
      total: response.data.total,
    };
  },

  /**
   * Fetches a single idea by ID
   * @param id - The idea ID
   * @returns Promise with the idea details
   */
  async getIdea(id: string): Promise<BusinessIdea> {
    const response = await apiClient.get<IdeaDetailResponse>(`/api/ideas/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch idea');
    }
    
    return transformIdeaResponse(response.data.idea);
  },

  /**
   * Updates the starred status of an idea
   * @param id - The idea ID
   * @param starred - The new starred status
   * @returns Promise with void (backend doesn't return updated idea)
   */
  async updateStarred(id: string, starred: boolean): Promise<void> {
    const response = await apiClient.patch<{ success: boolean }>(`/api/ideas/${id}/star`, { starred });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update starred status');
    }
  },
};