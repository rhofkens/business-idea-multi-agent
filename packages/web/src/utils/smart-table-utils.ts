/**
 * Utility functions for SmartTable component
 */

/**
 * Get text color class based on score value
 */
export const getScoreColor = (score: number | null): string => {
  if (score === null) return "text-muted-foreground";
  if (score >= 7) return "text-score-high";
  if (score >= 4) return "text-score-medium";
  return "text-score-low";
};

/**
 * Get background color class based on score value
 */
export const getScoreBg = (score: number | null): string => {
  if (score === null) return "bg-muted";
  if (score >= 7) return "bg-success/10";
  if (score >= 4) return "bg-warning/10";
  return "bg-destructive/10";
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, length: number = 100): string => {
  if (!text) return "Not available";
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Get execution mode display label
 */
export const getExecutionModeLabel = (executionMode: string | undefined): string => {
  const mode = executionMode?.toLowerCase() || '';
  if (mode === 'solopreneur' || mode.includes('solo')) return 'Solo';
  if (mode === 'classic-startup') return 'Startup';
  if (mode.includes('1-') || mode.includes('2-') || mode.includes('3-')) return 'Small Team';
  return 'Startup';
};

/**
 * Check if execution mode is solopreneur type
 */
export const isSolopreneurMode = (executionMode: string | undefined): boolean => {
  const mode = executionMode?.toLowerCase() || '';
  return mode === 'solopreneur' || 
         mode.includes('solo') || 
         mode.includes('1-') || 
         mode.includes('2-') || 
         mode.includes('3-');
};