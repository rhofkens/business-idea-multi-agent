/**
 * Hook for processing WebSocket events into business ideas
 */

import { useMemo } from "react";
import { transformBusinessIdea } from "@/utils/idea-transformer";
import type { BusinessIdea } from "@/types/business-idea";
import type { WorkflowEvent } from "@business-idea/shared";
import {
  ideaDataSchema,
  type IdeaWorkflowEvent,
  type CompetitorData,
  type CriticData,
  type DocumentationData,
} from "@/types/smart-table.types";

/**
 * Process WebSocket events and extract business ideas with their analysis data
 */
export function useIdeaEventProcessor(
  events: WorkflowEvent[],
  starredIdeas: Set<string>,
  setConsolidatedReportEnabled: (enabled: boolean) => void,
  setConsolidatedReportPath: (path: string | null) => void
): BusinessIdea[] {
  return useMemo(() => {
    const ideaMap = new Map<string, BusinessIdea>();
    const competitorDataMap = new Map<string, CompetitorData>();
    const criticDataMap = new Map<string, CriticData>();
    const documentationDataMap = new Map<string, DocumentationData>();
    
    // Filter relevant events
    const relevantEvents = events.filter(
      (e): e is IdeaWorkflowEvent => {
        // Accept IdeationAgent result events
        if (e.agentName === "IdeationAgent" && e.type === "result" && e.metadata?.data) {
          const parsed = ideaDataSchema.safeParse(e.metadata.data);
          return parsed.success;
        }
        // Accept CompetitorAgent, CriticAgent, and DocumentationAgent progress/result events
        if (
          (e.agentName === "CompetitorAgent" || 
           e.agentName === "CriticAgent" || 
           e.agentName === "DocumentationAgent") &&
          (e.type === "progress" || e.type === "result") && 
          e.metadata?.data
        ) {
          return true;
        }
        return false;
      }
    );

    // Process events
    for (const event of relevantEvents) {
      if (event.agentName === "IdeationAgent") {
        const ideaData = event.metadata.data.idea;
        const transformedIdea = transformBusinessIdea(ideaData, 0, true);
        ideaMap.set(transformedIdea.id, transformedIdea);
      } else if (event.agentName === "CompetitorAgent" && event.type === "progress") {
        try {
          const data = event.metadata?.data as {
            analysis?: {
              ideaId?: string;
              analysis?: string;
              blueOceanScore?: number;
            };
          };
          
          if (data?.analysis?.ideaId && data?.analysis?.analysis && typeof data?.analysis?.blueOceanScore === "number") {
            competitorDataMap.set(data.analysis.ideaId, {
              competitorAnalysis: data.analysis.analysis,
              blueOceanScore: data.analysis.blueOceanScore
            });
          }
        } catch (error) {
          console.error('Error processing CompetitorAgent event:', error);
        }
      } else if (event.agentName === "CriticAgent" && event.type === "progress") {
        try {
          const criticData = event.metadata?.data as {
            evaluation?: {
              ideaId?: string;
              criticalAnalysis?: string;
              overallScore?: number;
              reasoning?: { [key: string]: string };
            };
          };

          if (
            criticData?.evaluation?.ideaId &&
            criticData?.evaluation?.criticalAnalysis &&
            typeof criticData?.evaluation?.overallScore === "number"
          ) {
            const evaluation = criticData.evaluation;
            const overallReasoning = evaluation.reasoning ?
              Object.entries(evaluation.reasoning)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n\n') :
              undefined;
            
            criticDataMap.set(evaluation.ideaId, {
              criticalAnalysis: evaluation.criticalAnalysis,
              overallScore: evaluation.overallScore,
              reasoning: overallReasoning
            });
          }
        } catch (error) {
          console.error('Error processing CriticAgent event:', error);
        }
      } else if (event.agentName === "DocumentationAgent") {
        try {
          if (event.type === "progress") {
            const progressData = event.metadata?.data as {
              ideaId?: string;
            };
            
            if (progressData?.ideaId) {
              documentationDataMap.set(progressData.ideaId, {
                reportPath: progressData.ideaId
              });
            }
          } else if (event.type === "result") {
            const resultData = event.metadata?.data as {
              reportPath?: string;
            };
            
            if (resultData?.reportPath) {
              setConsolidatedReportEnabled(true);
              const pathWithoutExtension = resultData.reportPath.replace(/\.md$/, '');
              setConsolidatedReportPath(pathWithoutExtension);
            }
          }
        } catch (error) {
          console.error('Error processing DocumentationAgent event:', error);
        }
      }
    }
    
    // Merge competitor data with ideas
    ideaMap.forEach((idea, id) => {
      const competitorData = competitorDataMap.get(id);
      if (competitorData) {
        idea.competitorAnalysis = competitorData.competitorAnalysis;
        idea.scores.blueOcean = competitorData.blueOceanScore;
        if (!idea.reasoning.blueOcean) {
          idea.reasoning.blueOcean = 'Blue Ocean score calculated based on competitor analysis';
        }
      }
    });
    
    // Merge critic data with ideas
    ideaMap.forEach((idea, id) => {
      const criticData = criticDataMap.get(id);
      if (criticData) {
        idea.criticalAnalysis = criticData.criticalAnalysis;
        idea.scores.overall = criticData.overallScore;
        if (criticData.reasoning) {
          idea.reasoning.overall = criticData.reasoning;
        }
      }
    });
    
    // Merge documentation data with ideas
    ideaMap.forEach((idea, id) => {
      const documentationData = documentationDataMap.get(id);
      if (documentationData) {
        idea.reportPath = documentationData.reportPath;
      }
    });
    
    // Add starring status from local state
    const ideasWithStars = Array.from(ideaMap.values()).map(idea => ({
      ...idea,
      starred: starredIdeas.has(idea.id),
    }));

    // Sort by overall score descending, putting null scores last
    return ideasWithStars.sort((a, b) => {
      const scoreA = a.scores.overall ?? -1;
      const scoreB = b.scores.overall ?? -1;
      return scoreB - scoreA;
    });
  }, [events, starredIdeas, setConsolidatedReportEnabled, setConsolidatedReportPath]);
}