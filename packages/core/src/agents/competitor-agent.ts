import { Agent, run, webSearchTool } from '@openai/agents';
import { BusinessIdea } from '@business-idea/shared';
import {
  CompetitorAgentInput,
  CompetitorAgentOutputSchema,
  CompetitorStreamEvent
} from '../schemas/competitor-agent-schemas.js';

/**
 * System prompt for competitor analysis
 */
const competitorAnalysisPrompt = `
You are a market research expert specializing in competitive analysis and Blue Ocean strategy.

Your task is to analyze a single business idea and provide:
1. A comprehensive competitor analysis
2. A Blue Ocean score based on the methodology

For the web search, perform searches for:
- Direct competitors offering similar solutions
- Market size and growth projections
- Existing solutions in the industry
- Technology trends relevant to the idea

Blue Ocean Scoring Methodology:
- competitorScore (1-10): Lower score = more competitors, Higher score = fewer competitors
- saturationScore (1-10): Lower score = saturated market, Higher score = open market
- innovationScore (1-10): Based on technical/business model innovation
- Final score = (0.4×competitorScore) + (0.3×saturationScore) + (0.3×innovationScore)

Return your analysis as a JSON object with these fields:
{
  "title": "Original title",
  "description": "Original description",
  "businessModel": "Original businessModel",
  "disruptionPotential": original number,
  "marketPotential": original number,
  "technicalComplexity": original number,
  "capitalIntensity": original number,
  "reasoning": { ...original reasoning object... },
  "competitorAnalysis": "Your detailed competitor analysis here",
  "blueOceanScore": calculated score,
  "blueOceanDetails": {
    "competitorScore": number,
    "saturationScore": number,
    "innovationScore": number,
    "calculation": "Show the calculation"
  }
}
`;

/**
 * Creates the competitor analysis agent
 */
const createCompetitorAgent = () => new Agent({
  name: 'Competitor Analysis Agent',
  instructions: competitorAnalysisPrompt,
  model: 'o3',
  tools: [webSearchTool()],
});

/**
 * Analyzes a single business idea
 */
async function analyzeSingleIdea(idea: BusinessIdea): Promise<BusinessIdea> {
  const agent = createCompetitorAgent();
  
  const promptText = `
Analyze this business idea for competitors and calculate the Blue Ocean score:

${JSON.stringify(idea, null, 2)}

Perform web searches to gather competitive intelligence, then provide your analysis.
`;

  try {
    const result = await run(agent, promptText, { stream: false });
    const output = result.finalOutput || '';
    
    // Parse the result
    const parsed = JSON.parse(output);
    
    // Ensure all required fields are present
    return {
      ...idea,
      competitorAnalysis: parsed.competitorAnalysis || 'Analysis not available',
      blueOceanScore: parsed.blueOceanScore || 5.0,
      reasoning: {
        ...idea.reasoning,
        blueOcean: parsed.blueOceanDetails ? 
          `Competitor Score: ${parsed.blueOceanDetails.competitorScore}/10, ` +
          `Saturation Score: ${parsed.blueOceanDetails.saturationScore}/10, ` +
          `Innovation Score: ${parsed.blueOceanDetails.innovationScore}/10. ` +
          `Calculation: ${parsed.blueOceanDetails.calculation}`
          : 'Blue Ocean analysis not available'
      }
    };
  } catch (error) {
    console.error(`Error analyzing idea "${idea.title}":`, error);
    
    // Return idea with default values on error
    return {
      ...idea,
      competitorAnalysis: 'Unable to perform competitor analysis due to technical issues.',
      blueOceanScore: 5.0,
      reasoning: {
        ...idea.reasoning,
        blueOcean: 'Default score assigned due to analysis failure.'
      }
    };
  }
}

/**
 * Executes the competitor analysis agent with streaming support
 * @param input - The input containing business ideas to analyze
 * @returns An async generator yielding stream events
 */
export async function* runCompetitorAgent(
  input: CompetitorAgentInput
): AsyncGenerator<CompetitorStreamEvent> {
  yield { type: 'status', data: 'Starting competitor analysis...' };

  const analyzedIdeas: BusinessIdea[] = [];
  const totalIdeas = input.businessIdeas.length;

  // Process each idea sequentially
  for (let i = 0; i < totalIdeas; i++) {
    const idea = input.businessIdeas[i];
    
    yield { 
      type: 'status', 
      data: `Analyzing idea ${i + 1}/${totalIdeas}: ${idea.title}` 
    };
    
    yield {
      type: 'chunk',
      data: `\n🔍 Searching for competitors for: ${idea.title}...\n`
    };
    
    const analyzedIdea = await analyzeSingleIdea(idea);
    analyzedIdeas.push(analyzedIdea);
    
    // Emit the analysis result
    yield {
      type: 'competitor-analysis',
      data: {
        ideaTitle: analyzedIdea.title,
        analysis: analyzedIdea.competitorAnalysis || '',
        blueOceanScore: analyzedIdea.blueOceanScore || 5.0
      }
    };
    
    yield {
      type: 'chunk',
      data: `\n✅ Completed analysis for: ${idea.title}\n` +
            `   Blue Ocean Score: ${analyzedIdea.blueOceanScore}/10\n`
    };
  }

  yield { type: 'status', data: 'Competitor analysis complete!' };
  
  // Validate final output
  try {
    const validatedOutput = CompetitorAgentOutputSchema.parse(analyzedIdeas);
    yield { type: 'complete' };
    return validatedOutput;
  } catch (error) {
    console.error('Output validation failed:', error);
    yield { type: 'complete' };
    return analyzedIdeas; // Return even if validation fails
  }
}