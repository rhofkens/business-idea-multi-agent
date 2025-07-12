import { Agent, run } from '@openai/agents';
import { BusinessIdea } from '../types/business-idea.js';
import { DocumentationAgentOutput } from '../types/agent-types.js';
import {
  DocumentationAgentInputSchema,
  DocumentationAgentInput,
  DocumentationStreamEvent
} from '../schemas/documentation-agent-schemas.js';
import {
  generateReportFilename,
  stitchReportSections,
  getTop3Ideas
} from '../utils/report-utilities.js';
import { ensureOutputDirectory, writeFile } from '../utils/file-system.js';
import { loggingService } from '../services/logging-service.js';

/**
 * System prompt for the Documentation Agent.
 *
 * Defines the behavior and output format for generating comprehensive,
 * investor-ready business idea documentation. The prompt instructs the
 * agent to create detailed markdown reports with structured sections
 * covering all aspects of each business idea.
 *
 * @constant {string}
 */
const documentationPrompt = `
You are a professional business documentation expert. Your task is to transform analyzed business idea data into a well-structured, investor-ready markdown report.

CRITICAL RULES:
1. You MUST ONLY use the data provided in the input - DO NOT create or infer new data
2. You are formatting and presenting existing analysis, NOT generating new analysis
3. Every statement must be directly supported by the input data
4. Use professional language to present the existing findings clearly

Generate a markdown section for the business idea following this structure:

## [Business Title]

### Executive Summary
Create a compelling 2-3 paragraph summary using ONLY:
- The provided title and description
- The business model type
- The calculated scores to highlight strengths
- Key points from the provided reasoning

### Scoring Analysis

Present all provided scores in a clear format:
- Market Potential: X/10
- Disruption Potential: X/10
- Technical Complexity: X/10
- Capital Intensity: X/10
- Blue Ocean Score: X/10 (if provided)
- Overall Score: X/10 (if provided)

### Strategic Reasoning

For each score that has reasoning provided, create a subsection:

#### Market Potential
[Present the market reasoning exactly as provided]

#### Disruption Potential
[Present the disruption reasoning exactly as provided]

#### Technical Complexity
[Present the technical reasoning exactly as provided]

#### Capital Requirements
[Present the capital reasoning exactly as provided]

#### Blue Ocean Strategy (if blue ocean reasoning is provided)
[Present the blue ocean analysis including sub-scores if available]

### Competitive Landscape

If competitor analysis is provided:
[Present the full competitor analysis as given, formatted with proper markdown]

If no competitor analysis is provided, simply state: "Detailed competitor analysis pending."

### Business Model

State the business model type and any implications from the provided reasoning.

### Investment Highlights

Based ONLY on the provided scores and reasoning, summarize:
- The strongest aspects (highest scores)
- Key opportunities mentioned in the reasoning
- Notable strategic advantages from the analysis

FORMAT REQUIREMENTS:
- Use clear markdown formatting
- Present data professionally without embellishment
- Include only information directly from the input
- Maintain analytical objectivity
- Do not add speculative content or unsupported claims
`;

/**
 * Documentation Agent instance for generating business idea reports.
 *
 * This agent specializes in transforming analyzed business ideas into
 * comprehensive, professional markdown documentation suitable for
 * investors and stakeholders.
 *
 * @type {Agent}
 * @property {string} name - Agent identifier
 * @property {string} instructions - System prompt defining agent behavior
 * @property {string} model - Uses 'o3' model as per architecture guidelines
 */
export const documentationAgent = new Agent({
  name: 'Documentation Agent',
  instructions: documentationPrompt,
  model: 'o3',
});

/**
 * Generates a comprehensive markdown report section for a single business idea.
 *
 * Transforms a BusinessIdea object into a detailed markdown section including
 * executive summary, market analysis, competitive landscape, business model,
 * technical implementation, financial projections, risk analysis, and go-to-market
 * strategy.
 *
 * @async
 * @function generateIdeaReport
 * @param {BusinessIdea} idea - The business idea object containing all scores and analyses
 * @param {number} index - The 1-based index used for section numbering in the report
 * @returns {Promise<string>} A complete markdown section documenting the business idea
 * @throws {Error} If the LLM call fails or returns invalid content
 *
 * @example
 * const ideaReport = await generateIdeaReport(businessIdea, 1);
 * // Returns markdown starting with "## [Business Title]"
 */
async function generateIdeaReport(idea: BusinessIdea, _index: number): Promise<string> {
  // Extract Blue Ocean sub-scores from reasoning.blueOcean if available
  let blueOceanDetails = '';
  if (idea.reasoning.blueOcean) {
    blueOceanDetails = `\nBlue Ocean Analysis:\n${idea.reasoning.blueOcean}`;
  }

  const ideaContext = `
Generate a comprehensive markdown report for the following business idea:

Title: ${idea.title}
Description: ${idea.description}
Business Model: ${idea.businessModel}

Scores:
- Market Potential: ${idea.marketPotential}/10
- Disruption Potential: ${idea.disruptionPotential}/10
- Technical Complexity: ${idea.technicalComplexity}/10
- Capital Intensity: ${idea.capitalIntensity}/10
- Blue Ocean Score: ${idea.blueOceanScore ?? 'Not Available'}/10
- Overall Score: ${idea.overallScore ?? 'Not Available'}/10

Detailed Reasoning:
- Disruption: ${idea.reasoning.disruption}
- Market: ${idea.reasoning.market}
- Technical: ${idea.reasoning.technical}
- Capital: ${idea.reasoning.capital}
${blueOceanDetails}

${idea.competitorAnalysis ? `\nCompetitor Analysis:\n${idea.competitorAnalysis}` : ''}
`;

  try {
    const result = await run(documentationAgent, ideaContext);
    return result.finalOutput ?? '';
  } catch (error) {
    loggingService.log({
      level: 'ERROR',
      message: 'Error generating idea report',
      agent: 'Documentation Agent',
      details: JSON.stringify({ error: String(error), ideaTitle: idea.title })
    });
    throw error;
  }
}

/**
 * Generates the introduction section for the business ideas report.
 *
 * Creates a professional introduction including:
 * - Report title and date
 * - Executive summary explaining the evaluation methodology
 * - Overview of the analysis dimensions
 * - Reader expectations
 *
 * @async
 * @function generateIntroduction
 * @param {number} ideaCount - The total number of business ideas in the report
 * @returns {Promise<string>} Markdown content for the report introduction
 * @throws {Error} If the LLM call fails or returns invalid content
 *
 * @example
 * const intro = await generateIntroduction(10);
 * // Returns markdown starting with "# Business Ideas Report"
 */
async function generateIntroduction(ideaCount: number): Promise<string> {
  const introPrompt = `
Generate a professional introduction section for a business ideas report.

Requirements:
- Create a title "# Business Ideas Report"
- Include the current date and time
- Write an executive summary (2-3 paragraphs) that:
  - Explains this report contains ${ideaCount} thoroughly analyzed business ideas
  - Mentions each idea has been evaluated across multiple dimensions (market potential, disruption potential, technical complexity, capital requirements, Blue Ocean strategy)
  - Sets expectations for what the reader will find in the report
  - Maintains a professional, investor-focused tone
- End with a horizontal rule (---)

Format as markdown.
`;

  try {
    const result = await run(documentationAgent, introPrompt);
    return result.finalOutput ?? '';
  } catch (error) {
    loggingService.log({
      level: 'ERROR',
      message: 'Error generating introduction',
      agent: 'Documentation Agent',
      details: JSON.stringify({ error: String(error) })
    });
    throw error;
  }
}

/**
 * Generates the summary and recommendations section for the report.
 *
 * Creates a comprehensive summary including:
 * - Top 3 ideas ranked by overall score
 * - Analysis of why each top idea excels
 * - Key insights and common themes
 * - Strategic opportunities
 * - Actionable next steps
 *
 * @async
 * @function generateSummary
 * @param {BusinessIdea[]} ideas - Array of all business ideas to summarize
 * @returns {Promise<string>} Markdown content for the summary section
 * @throws {Error} If the LLM call fails or returns invalid content
 *
 * @example
 * const summary = await generateSummary(businessIdeas);
 * // Returns markdown starting with "## Summary and Recommendations"
 */
async function generateSummary(ideas: BusinessIdea[]): Promise<string> {
  // Get top 3 ideas
  const top3Ideas = getTop3Ideas(ideas);
  
  const summaryPrompt = `
Generate a professional summary and recommendations section for a business ideas report.

Top 3 Ideas by Overall Score:
${top3Ideas.map((idea, index) => `
${index + 1}. ${idea.title} - Overall Score: ${idea.overallScore}/10
   - ${idea.description}
   - Market Potential: ${idea.marketPotential}/10
   - Disruption Potential: ${idea.disruptionPotential}/10
`).join('\n')}

Requirements:
- Create a section titled "## Summary and Recommendations"
- Include a subsection "### Top 3 Ideas by Overall Score"
- For each of the top 3 ideas:
  - Provide the ranking, title, and overall score
  - Write a brief 2-3 sentence analysis of why this idea ranks highly
  - Highlight its key strengths
- Add a subsection "### Key Insights"
  - Summarize common themes across all ideas
  - Identify market trends
  - Note any strategic opportunities
- Add a subsection "### Next Steps"
  - Recommend 3-5 actionable next steps for pursuing these opportunities
- Maintain a professional, executive-level tone

Format as markdown.
`;

  try {
    const result = await run(documentationAgent, summaryPrompt);
    return result.finalOutput ?? '';
  } catch (error) {
    loggingService.log({
      level: 'ERROR',
      message: 'Error generating summary',
      agent: 'Documentation Agent',
      details: JSON.stringify({ error: String(error) })
    });
    throw error;
  }
}

/**
 * Main orchestration function for the Documentation Agent.
 *
 * Processes business ideas through a multi-step documentation pipeline:
 * 1. Validates input using Zod schema
 * 2. Generates introduction section (1 LLM call)
 * 3. Generates detailed report for each idea (10 LLM calls total)
 * 4. Generates summary with top 3 ideas (1 LLM call)
 * 5. Stitches all sections together into final report
 * 6. Saves report to docs/output directory
 *
 * Total LLM calls: 12 (consistent with ADR 006)
 *
 * @async
 * @function runDocumentationAgent
 * @param {DocumentationAgentInput} input - Input containing array of business ideas
 * @param {BusinessIdea[]} input.ideas - Array of fully-analyzed business ideas
 * @returns {Promise<DocumentationAgentOutput>} Output containing report metadata
 * @returns {string} returns.reportPath - Path to generated markdown report
 * @returns {number} returns.processingTime - Total processing time in seconds
 * @returns {number} returns.ideasProcessed - Number of ideas documented
 *
 * @throws {ZodError} If input validation fails
 * @throws {Error} If file operations or LLM calls fail
 *
 * @example
 * const result = await runDocumentationAgent({
 *   ideas: analyzedBusinessIdeas
 * });
 * console.log(`Report saved to: ${result.reportPath}`);
 */
export async function* runDocumentationAgent(
  input: DocumentationAgentInput
): AsyncGenerator<DocumentationStreamEvent, DocumentationAgentOutput> {
  const startTime = Date.now();
  
  // Log operation start
  loggingService.log({
    level: 'INFO',
    message: 'Starting documentation generation',
    agent: 'Documentation Agent',
    details: JSON.stringify({ ideaCount: input.ideas.length })
  });

  yield { type: 'status', data: 'Starting documentation generation...' };

  try {
    // Validate input
    DocumentationAgentInputSchema.parse(input);
    
    // Ensure output directory exists
    await ensureOutputDirectory();
    
    // 1. Generate introduction (1 LLM call)
    yield { type: 'status', data: 'Generating report introduction...' };
    yield { type: 'chunk', data: '\n📄 Creating professional business report introduction...\n' };
    
    loggingService.log({
      level: 'INFO',
      message: 'Generating introduction',
      agent: 'Documentation Agent',
      details: ''
    });
    const introduction = await generateIntroduction(input.ideas.length);
    
    yield { type: 'section-generated', data: { section: 'introduction', content: introduction } };
    yield { type: 'chunk', data: '✅ Introduction section completed\n' };
    
    // 2. Generate individual idea reports (10 LLM calls, one per idea)
    yield { type: 'status', data: 'Generating individual idea reports...' };
    
    loggingService.log({
      level: 'INFO',
      message: 'Generating individual idea reports',
      agent: 'Documentation Agent',
      details: JSON.stringify({ count: input.ideas.length })
    });
    
    const ideaSections: string[] = [];
    for (let i = 0; i < input.ideas.length; i++) {
      const idea = input.ideas[i];
      
      yield {
        type: 'status',
        data: `Processing idea ${i + 1}/${input.ideas.length}: ${idea.title}`
      };
      
      yield {
        type: 'chunk',
        data: `\n📊 Documenting idea ${i + 1}/${input.ideas.length}: ${idea.title}...\n`
      };
      
      loggingService.log({
        level: 'INFO',
        message: `Processing idea ${i + 1}/${input.ideas.length}`,
        agent: 'Documentation Agent',
        details: JSON.stringify({ title: idea.title })
      });
      
      const ideaReport = await generateIdeaReport(idea, i + 1);
      ideaSections.push(ideaReport);
      
      yield {
        type: 'idea-processed',
        data: {
          title: idea.title,
          index: i + 1,
          total: input.ideas.length
        }
      };
      
      yield {
        type: 'chunk',
        data: `✅ Completed documentation for: ${idea.title}\n`
      };
    }
    
    // 3. Generate summary (1 LLM call)
    yield { type: 'status', data: 'Generating summary and recommendations...' };
    yield { type: 'chunk', data: '\n📋 Creating executive summary and top recommendations...\n' };
    
    loggingService.log({
      level: 'INFO',
      message: 'Generating summary',
      agent: 'Documentation Agent',
      details: ''
    });
    const summary = await generateSummary(input.ideas);
    
    yield { type: 'section-generated', data: { section: 'summary', content: summary } };
    yield { type: 'chunk', data: '✅ Summary section completed\n' };
    
    // 4. Stitch together all sections
    yield { type: 'status', data: 'Assembling final report...' };
    yield { type: 'chunk', data: '\n🔗 Compiling all sections into final report...\n' };
    
    const fullReport = stitchReportSections(introduction, ideaSections, summary);
    
    // 5. Generate filename and write report
    const reportFilename = generateReportFilename();
    const reportPath = `docs/output/${reportFilename}`;
    
    yield { type: 'chunk', data: `💾 Saving report to: ${reportPath}\n` };
    
    await writeFile(reportPath, fullReport);
    
    const processingTime = Date.now() - startTime;
    
    // Log operation completion
    loggingService.log({
      level: 'INFO',
      message: 'Documentation generation completed',
      agent: 'Documentation Agent',
      details: JSON.stringify({
        reportPath,
        processingTime,
        ideasProcessed: input.ideas.length
      })
    });
    
    yield { type: 'status', data: 'Documentation generation complete!' };
    yield { type: 'chunk', data: `\n✨ Report successfully generated!\n📍 Location: ${reportPath}\n⏱️ Processing time: ${(processingTime / 1000).toFixed(2)}s\n\n` };
    yield { type: 'complete' };
    
    return {
      reportPath,
      processingTime,
      ideasProcessed: input.ideas.length
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    loggingService.log({
      level: 'ERROR',
      message: 'Documentation generation failed',
      agent: 'Documentation Agent',
      details: JSON.stringify({
        error: String(error),
        processingTime,
        ideasProcessed: 0
      })
    });
    
    throw error;
  }
}