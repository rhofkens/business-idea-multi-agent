/**
 * Hook for filtering business ideas based on various criteria
 */

import { useMemo } from "react";
import type { BusinessIdea } from "@/types/business-idea";
import type { ExecutionModeFilter } from "@/types/smart-table.types";

/**
 * Filter ideas based on current run, starred status, and execution mode
 */
export function useIdeaFiltering(
  displayIdeas: BusinessIdea[],
  showCurrentRun: boolean,
  showStarredOnly: boolean,
  executionModeFilter: ExecutionModeFilter,
  starredIdeas: Set<string>
): BusinessIdea[] {
  return useMemo(() => {
    return displayIdeas.filter(idea => {
      // Apply current run filter if in current run mode
      if (showCurrentRun && !idea.isCurrentRun) return false;
      
      // Apply starred filter if enabled and in current run mode (database mode already filtered by API)
      if (showStarredOnly && showCurrentRun && !starredIdeas.has(idea.id)) return false;
      
      // Apply execution mode filter
      if (executionModeFilter !== 'all') {
        const ideaMode = idea.executionMode?.toLowerCase() || '';
        
        if (executionModeFilter === 'solopreneur') {
          // Check if it's solopreneur mode or similar (1-3 person team)
          if (!ideaMode.includes('solo') && 
              !ideaMode.includes('1-') && 
              !ideaMode.includes('2-') && 
              !ideaMode.includes('3-') && 
              ideaMode !== 'solopreneur') {
            return false;
          }
        } else if (executionModeFilter === 'classic-startup') {
          // Check if it's classic startup mode or larger team
          if (ideaMode.includes('solo') || 
              ideaMode.includes('1-') || 
              ideaMode.includes('2-') || 
              ideaMode.includes('3-') || 
              ideaMode === 'solopreneur') {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [displayIdeas, showCurrentRun, showStarredOnly, executionModeFilter, starredIdeas]);
}