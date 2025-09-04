import { run } from '@openai/agents';
import { BusinessIdea } from '@business-idea/shared';
import {
  CompetitorAgentInput,
  CompetitorAgentOutputSchema,
  CompetitorStreamEvent
} from '../schemas/competitor-agent-schemas.js';
import { configService } from '../services/config-service.js';
import { ExecutionModeFactory } from '../execution-modes/base/ExecutionModeFactory.js';
import { OpenAIDirectFactory } from '../factories/openai-direct-factory.js';

/**
 * System prompt for competitor analysis
 */
const createCompetitorAnalysisPrompt = (executionContext: string) => `
You are a market research expert specializing in competitive analysis and Blue Ocean strategy.

Your task is to analyze a single business idea and provide:
1. A comprehensive competitor analysis
2. A Blue Ocean score based on the methodology

CRITICAL ID PRESERVATION REQUIREMENT:
- The business idea has a unique ID that MUST be preserved exactly as provided
- DO NOT modify, regenerate, or remove the ID
- You MUST include the exact same ID in your output

For the web search, perform searches for:
- Direct competitors offering similar solutions
- Market size and growth projections
- Existing solutions in the industry
- Technology trends relevant to the idea

${executionContext}

IMPORTANT FORMATTING REQUIREMENTS:
1. When mentioning competitors or companies, include their website URLs as hyperlinks
2. Format links as markdown: [Company Name](https://www.example.com)
3. Include at least 3-5 competitor links with their actual websites
4. Example: "Major competitors include [Salesforce](https://www.salesforce.com) in the CRM space..."

Blue Ocean Scoring Methodology:
- competitorScore (1-10): Lower score = more competitors, Higher score = fewer competitors
- saturationScore (1-10): Lower score = saturated market, Higher score = open market
- innovationScore (1-10): Based on technical/business model innovation
- Final score = (0.4×competitorScore) + (0.3×saturationScore) + (0.3×innovationScore)

CRITICAL JSON FORMAT REQUIREMENTS:
- Return ONLY valid JSON, no markdown formatting
- Do NOT wrap the JSON in \`\`\`json tags
- Ensure all strings are properly escaped
- Use double quotes for all property names and string values
- Do not include trailing commas

Return your analysis as a PURE JSON object with these fields:
{
  "id": "EXACT ID from the input - DO NOT CHANGE",
  "title": "Original title",
  "description": "Original description",
  "businessModel": "Original businessModel",
  "disruptionPotential": original number,
  "marketPotential": original number,
  "technicalComplexity": original number,
  "capitalIntensity": original number,
  "reasoning": { ...original reasoning object... },
  "competitorAnalysis": "Your detailed competitor analysis here (MUST include hyperlinks to competitor websites)",
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
 * Always uses OpenAI for web search capability
 * @param executionContext - The execution mode specific context
 */
const createCompetitorAgent = (executionContext: string) => {
  // Always use OpenAI for competitor agent (web search requirement)
  const openAIModel = configService.getOpenAIModelForWebSearchAgent('competitor');
  
  return OpenAIDirectFactory.createAgent({
    name: 'Competitor Analysis Agent',
    instructions: createCompetitorAnalysisPrompt(executionContext),
    model: openAIModel,
    enableWebSearch: configService.enableWebSearch
  }, OpenAIDirectFactory.validateApiKey());
}

/**
 * Analyzes a single business idea
 * @param idea - The business idea to analyze
 * @param executionContext - The execution mode specific context
 */
async function analyzeSingleIdea(idea: BusinessIdea, executionContext: string): Promise<BusinessIdea> {
  const agent = createCompetitorAgent(executionContext);
  
  const promptText = `
Analyze this business idea for competitors and calculate the Blue Ocean score:

${JSON.stringify(idea, null, 2)}

Perform web searches to gather competitive intelligence, then provide your analysis.
`;

  try {
    const result = await run(agent, promptText, { stream: false });
    const output = result.finalOutput || '';
    
    console.log(`[Competitor Agent] Raw response length for "${idea.title}": ${output.length} characters`);
    
    // Clean up the JSON output from any markdown formatting
    let cleanedContent = output.trim();
    
    // Log if markdown fences are detected
    if (cleanedContent.startsWith('```json') || cleanedContent.startsWith('```')) {
      console.log(`[Competitor Agent] Detected markdown code fences in response for "${idea.title}"`);
    }
    
    // Remove markdown code fences
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    
    cleanedContent = cleanedContent.trim();
    
    // Log first 200 chars of cleaned content for debugging
    console.log(`[Competitor Agent] First 200 chars of cleaned content: ${cleanedContent.substring(0, 200)}...`);
    
    // More robust JSON parsing with fallback
    let parsed: {
      competitorAnalysis?: string;
      blueOceanScore?: number;
      blueOceanDetails?: {
        competitorScore: number;
        saturationScore: number;
        innovationScore: number;
        calculation: string;
      };
      [key: string]: unknown;
    };
    try {
      parsed = JSON.parse(cleanedContent);
      console.log(`[Competitor Agent] Successfully parsed JSON for "${idea.title}"`);
    } catch (parseError) {
      console.error(`[Competitor Agent] Initial JSON parse failed for "${idea.title}":`, parseError instanceof Error ? parseError.message : 'Unknown error');
      console.log(`[Competitor Agent] Attempting fallback parsing...`);
      
      // Try to extract JSON from partial or malformed response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log(`[Competitor Agent] Found JSON-like structure, attempting to clean and parse...`);
        try {
          // Clean up common issues: trailing commas
          let jsonStr = jsonMatch[0];
          const originalLength = jsonStr.length;
          jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          if (originalLength !== jsonStr.length) {
            console.log(`[Competitor Agent] Removed ${originalLength - jsonStr.length} characters (likely trailing commas)`);
          }
          parsed = JSON.parse(jsonStr);
          console.log(`[Competitor Agent] Fallback parsing successful for "${idea.title}"`);
        } catch (secondError) {
          console.error(`[Competitor Agent] Fallback parsing also failed for "${idea.title}":`, secondError instanceof Error ? secondError.message : 'Unknown error');
          console.log(`[Competitor Agent] Last 200 chars before failure: ...${jsonMatch[0].substring(Math.max(0, jsonMatch[0].length - 200))}`);
          
          // If still failing, create a default response
          console.warn(`[Competitor Agent] Using default values for "${idea.title}"`);
          parsed = {
            ...idea,
            competitorAnalysis: 'Analysis could not be completed due to response formatting issues.',
            blueOceanScore: 5.0,
            blueOceanDetails: {
              competitorScore: 5,
              saturationScore: 5,
              innovationScore: 5,
              calculation: 'Default scores applied due to parsing error'
            }
          };
        }
      } else {
        // No JSON found, use defaults
        console.error(`[Competitor Agent] No JSON structure found in response for "${idea.title}"`);
        console.log(`[Competitor Agent] Response preview: ${cleanedContent.substring(0, 500)}...`);
        console.warn(`[Competitor Agent] Using default values for "${idea.title}"`);
        parsed = {
          ...idea,
          competitorAnalysis: 'Analysis could not be completed due to response formatting issues.',
          blueOceanScore: 5.0,
          blueOceanDetails: {
            competitorScore: 5,
            saturationScore: 5,
            innovationScore: 5,
            calculation: 'Default scores applied due to parsing error'
          }
        };
      }
    }
    
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
  input: CompetitorAgentInput,
  factory?: ExecutionModeFactory
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
    
    // Get execution context from factory or use empty string for backward compatibility
    const executionContext = factory
      ? factory.getCompetitorContext(idea)
      : '';
    
    const analyzedIdea = await analyzeSingleIdea(idea, executionContext);
    analyzedIdeas.push(analyzedIdea);
    
    // Emit the analysis result
    yield {
      type: 'competitor-analysis',
      data: {
        ideaId: analyzedIdea.id,
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