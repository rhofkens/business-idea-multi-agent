import { BusinessIdea } from '../types/business-idea.js';

/**
 * Generates a timestamp-based filename for the business idea report.
 * Format: business-idea-report-YYYYMMDD-HHMMSS.md
 * @returns The formatted filename string
 */
export function generateReportFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `business-idea-report-${year}${month}${day}-${hours}${minutes}${seconds}.md`;
}

/**
 * Stitches together report sections into a complete markdown document.
 * @param introduction The introduction section of the report
 * @param ideaSections Array of markdown sections for each business idea
 * @param summary The summary section with top 3 ideas
 * @returns The complete markdown report as a string
 */
export function stitchReportSections(
  introduction: string,
  ideaSections: string[],
  summary: string
): string {
  const sections = [
    introduction,
    ...ideaSections,
    summary
  ];
  
  // Join sections with double newline for proper markdown spacing
  return sections.join('\n\n');
}

/**
 * Identifies the top 3 business ideas by overall score.
 * @param ideas Array of business ideas to analyze
 * @returns The top 3 ideas sorted by overallScore in descending order
 * @throws Error if no ideas have an overallScore
 */
export function getTop3Ideas(ideas: BusinessIdea[]): BusinessIdea[] {
  // Filter ideas that have an overallScore
  const ideasWithScore = ideas.filter(idea => idea.overallScore !== undefined);
  
  if (ideasWithScore.length === 0) {
    throw new Error('No ideas have an overall score');
  }
  
  // Sort by overallScore in descending order and take top 3
  return ideasWithScore
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))
    .slice(0, 3);
}