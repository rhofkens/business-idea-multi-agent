import { run, Agent } from '@openai/agents';
import { BusinessIdea } from '@business-idea/shared';
import {
  CriticAgentInput,
  CriticStreamEvent
} from '../schemas/critic-agent-schemas.js';
import { TestCacheService } from '../services/test-cache-service.js';
import { configService } from '../services/config-service.js';
import { ExecutionModeFactory } from '../execution-modes/base/ExecutionModeFactory.js';
import { OpenAIDirectFactory } from '../factories/openai-direct-factory.js';

/**
 * System prompt for critical evaluation and Overall Score calculation
 * Implements ADR-005 methodology for final scoring
 */
const createCriticalEvaluationPrompt = (executionContext: string) => `
You are a business critic expert specializing in risk assessment and critical evaluation of business ideas.

Your task is to analyze a single business idea and provide:
1. A critical evaluation identifying risks, challenges, and weaknesses
2. A balanced assessment considering both positive and negative aspects
3. An Overall Score (0-10) calculated according to ADR-005 methodology

For the web search, perform searches for:
- Known failures or challenges in similar business models
- Regulatory hurdles and compliance requirements
- Technical challenges and implementation difficulties
- Market risks and competitive threats
- Capital requirements and funding challenges

${executionContext}

Overall Score Calculation (ADR-005):
1. Calculate base score using weighted average:
   - Disruption Potential: 20%
   - Market Potential: 25%
   - Technical Complexity (inverted): 15%
   - Capital Intensity (inverted): 15%
   - Blue Ocean Score: 25%

   baseScore = (0.20 × disruptionPotential) +
               (0.25 × marketPotential) +
               (0.15 × (10 - technicalComplexity)) +
               (0.15 × (10 - capitalIntensity)) +
               (0.25 × blueOceanScore)

2. Apply risk adjustment based on your critical analysis:
   - Major risks/challenges identified: -0.5 to -2.0 points
   - Minor concerns: -0.1 to -0.5 points
   - Positive mitigating factors: +0.1 to +0.5 points

3. Final score: clamp(baseScore + riskAdjustment, 0, 10)

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code fences, or explanatory text.
Your response must start with { and end with }

CRITICAL JSON FORMAT REQUIREMENTS:
- Return ONLY valid JSON, no markdown formatting
- Do NOT wrap the JSON in \`\`\`json tags
- Ensure all strings are properly escaped
- IMPORTANT: Keep total response under 12000 characters to avoid truncation
- If analysis is long, prioritize key points and summarize secondary details
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
  "blueOceanScore": original number,
  "competitorAnalysis": "Original competitorAnalysis",
  "reasoning": {
    ...original reasoning object...,
    "overall": "Comprehensive reasoning for the overall score, including risk factors"
  },
  "criticalAnalysis": "Your detailed critical evaluation here",
  "overallScore": calculated score,
  "overallScoreDetails": {
    "baseScore": number,
    "riskAdjustment": number,
    "calculation": "Show the detailed calculation"
  }
}

CRITICAL: You MUST preserve the EXACT ID from each business idea. The ID field is required and must be copied exactly as provided.`;

/**
 * Creates a new instance of the Business Critic Agent
 * Always uses OpenAI for web search capability
 * @param executionContext - The execution mode specific context
 * @returns A configured Agent instance with web search capabilities
 */
function createCriticAgent(executionContext: string) {
  // Always use OpenAI for critic agent (web search requirement)
  const openAIModel = configService.getOpenAIModelForWebSearchAgent('critic');
  
  return OpenAIDirectFactory.createAgent({
    name: 'Business Critic Agent',
    instructions: createCriticalEvaluationPrompt(executionContext),
    model: openAIModel,
    enableWebSearch: configService.enableWebSearch
  }, OpenAIDirectFactory.validateApiKey());
}
/**
 * Analyzes a single business idea and generates critical evaluation.
 * @param idea - The business idea to analyze
 * @param agent - The OpenAI agent instance
 * @returns Promise with the critical evaluation
 */
async function analyzeSingleIdea(
  idea: BusinessIdea,
  agent: Agent
): Promise<BusinessIdea> {
  const ideaContext = `
ID: ${idea.id}
Business Idea: ${idea.title}
Description: ${idea.description}
Business Model: ${idea.businessModel}
Disruption Potential: ${idea.disruptionPotential}/10
Market Potential: ${idea.marketPotential}/10
Technical Complexity: ${idea.technicalComplexity}/10
Capital Intensity: ${idea.capitalIntensity}/10
${idea.blueOceanScore ? `Blue Ocean Score: ${idea.blueOceanScore}/10` : ''}
${idea.competitorAnalysis ? `\nCompetitor Analysis:\n${idea.competitorAnalysis}` : ''}

Reasoning:
- Disruption: ${idea.reasoning.disruption}
- Market: ${idea.reasoning.market}
- Technical: ${idea.reasoning.technical}
- Capital: ${idea.reasoning.capital}
${idea.reasoning.blueOcean ? `- Blue Ocean: ${idea.reasoning.blueOcean}` : ''}
`.trim();

  const response = await run(agent, ideaContext, { stream: false });

  // Get the content from the response
  const content = response.finalOutput;
  if (!content) {
    throw new Error('No response from critic agent');
  }

  console.log(`[Critic Agent] Raw response length for "${idea.title}": ${content.length} characters`);

  // Clean the content - remove markdown code fences if present
  let cleanedContent = content.trim();
  
  // Log if markdown fences are detected
  if (cleanedContent.startsWith('```json') || cleanedContent.startsWith('```')) {
    console.log(`[Critic Agent] Detected markdown code fences in response for "${idea.title}"`);
  }
  
  // Remove markdown code fences
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.slice(7); // Remove ```json
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.slice(3); // Remove ```
  }
  
  if (cleanedContent.endsWith('```')) {
    cleanedContent = cleanedContent.slice(0, -3); // Remove trailing ```
  }
  
  cleanedContent = cleanedContent.trim();
  
  // Log first 200 chars of cleaned content for debugging
  console.log(`[Critic Agent] First 200 chars of cleaned content: ${cleanedContent.substring(0, 200)}...`);

  // More robust JSON parsing with fallback
  let evaluationData: {
    criticalAnalysis: string;
    riskAdjustment: number;
    overallReasoning: string;
    overallScore?: number;
  };
  try {
    evaluationData = JSON.parse(cleanedContent);
    console.log(`[Critic Agent] Successfully parsed JSON for "${idea.title}"`);
  } catch (parseError) {
    console.error(`[Critic Agent] Initial JSON parse failed for "${idea.title}":`, parseError instanceof Error ? parseError.message : 'Unknown error');
    console.log(`[Critic Agent] Response length: ${cleanedContent.length} chars`);
    
    // Check if response appears truncated
    const openBraces = (cleanedContent.match(/\{/g) || []).length;
    const closeBraces = (cleanedContent.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      console.warn(`[Critic Agent] JSON appears truncated - missing ${openBraces - closeBraces} closing brace(s)`);
      if (cleanedContent.length > 12000) {
        console.error(`[Critic Agent] WARNING: Response is ${cleanedContent.length} chars - likely hit token limit!`);
      }
    }
    
    console.log(`[Critic Agent] Attempting fallback parsing...`);
    // Try to extract JSON from partial or malformed response
    // More aggressive JSON extraction - look for opening brace to end of string
    const jsonMatch = cleanedContent.match(/\{[\s\S]*$/);
    if (jsonMatch) {
      console.log(`[Critic Agent] Found JSON-like structure, attempting to clean and parse...`);
      try {
        // Clean up common issues: trailing commas, unescaped quotes
        let jsonStr = jsonMatch[0];
        
        // Remove trailing commas before } or ]
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // Check if we're in the middle of a string value and close it
        // Look for unclosed quotes
        const quoteCount = (jsonStr.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          // Odd number of quotes means we have an unclosed string
          // Find the last quote and close the string properly
          jsonStr = jsonStr + '"';
          console.log(`[Critic Agent] Fixed unclosed string by adding closing quote`);
        }
        
        // Fix incomplete property values at the end
        // If the JSON ends with : or , it's incomplete
        if (jsonStr.match(/[,:]\s*$/)) {
          jsonStr = jsonStr.replace(/[,:]\s*$/, '');
          console.log(`[Critic Agent] Removed trailing colon or comma`);
        }
        
        // Fix truncated JSON by adding missing closing braces and brackets
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;
        
        // Add missing brackets first (inner structures)
        if (openBrackets > closeBrackets) {
          jsonStr = jsonStr + ']'.repeat(openBrackets - closeBrackets);
          console.log(`[Critic Agent] Added ${openBrackets - closeBrackets} missing closing bracket(s)`);
        }
        
        // Then add missing braces (outer structures)
        if (openBraces > closeBraces) {
          jsonStr = jsonStr + '}'.repeat(openBraces - closeBraces);
          console.log(`[Critic Agent] Added ${openBraces - closeBraces} missing closing brace(s)`);
        }
        
        // Try parsing again
        evaluationData = JSON.parse(jsonStr);
        console.log(`[Critic Agent] Fallback parsing successful for "${idea.title}"`);
      } catch (secondError) {
        console.error(`[Critic Agent] Fallback parsing also failed for "${idea.title}":`, secondError instanceof Error ? secondError.message : 'Unknown error');
        console.log(`[Critic Agent] Last 500 chars of JSON: ...${jsonMatch[0].substring(Math.max(0, jsonMatch[0].length - 500))}`);
        
        // Try one more time with more aggressive extraction
        // Extract just the essential fields we need
        try {
          console.log(`[Critic Agent] Attempting field extraction as last resort...`);
          
          // Extract critical analysis
          const criticalAnalysisMatch = cleanedContent.match(/"criticalAnalysis"\s*:\s*"([^"]*)"/);
          const criticalAnalysis = criticalAnalysisMatch ? criticalAnalysisMatch[1] : "Analysis could not be completed due to response formatting issues.";
          
          // Extract overall score
          const overallScoreMatch = cleanedContent.match(/"overallScore"\s*:\s*([\d.]+)/);
          const overallScore = overallScoreMatch ? parseFloat(overallScoreMatch[1]) : null;
          
          // Extract risk adjustment
          const riskAdjustmentMatch = cleanedContent.match(/"riskAdjustment"\s*:\s*(-?[\d.]+)/);
          const riskAdjustment = riskAdjustmentMatch ? parseFloat(riskAdjustmentMatch[1]) : 0;
          
          // Extract overall reasoning
          const overallReasoningMatch = cleanedContent.match(/"overall"\s*:\s*"([^"]*)"/);
          const overallReasoning = overallReasoningMatch ? overallReasoningMatch[1] : "Default assessment applied due to parsing errors.";
          
          evaluationData = {
            criticalAnalysis,
            riskAdjustment,
            overallReasoning,
            overallScore: overallScore || undefined
          };
          
          console.log(`[Critic Agent] Field extraction successful for "${idea.title}"`);
        } catch (_extractError) {
          console.error(`[Critic Agent] Field extraction also failed for "${idea.title}"`);
          // Final fallback to defaults
          evaluationData = {
            criticalAnalysis: "Analysis could not be completed due to response formatting issues.",
            riskAdjustment: 0,
            overallReasoning: "Default assessment applied due to parsing errors."
          };
        }
      }
    } else {
      // No JSON found, use defaults
      console.error(`[Critic Agent] No JSON structure found in response for "${idea.title}"`);
      console.log(`[Critic Agent] Response preview: ${cleanedContent.substring(0, 500)}...`);
      console.warn(`[Critic Agent] Using default values for "${idea.title}"`);
      evaluationData = {
        criticalAnalysis: "Analysis could not be completed due to response formatting issues.",
        riskAdjustment: 0,
        overallReasoning: "Default assessment applied due to parsing errors."
      };
    }
  }
  
  // Calculate the overall score based on ADR-005
  // Use the extracted overallScore if available, otherwise calculate it
  let overallScore: number;
  
  if ('overallScore' in evaluationData && evaluationData.overallScore !== null && evaluationData.overallScore !== undefined) {
    // Use the extracted overall score from the response
    overallScore = evaluationData.overallScore;
    console.log(`[Critic Agent] Using extracted overallScore: ${overallScore}`);
  } else {
    // Calculate it manually as fallback
    const baseScore =
      (0.20 * idea.disruptionPotential) +
      (0.25 * idea.marketPotential) +
      (0.15 * (10 - idea.technicalComplexity)) +
      (0.15 * (10 - idea.capitalIntensity)) +
      (0.25 * (idea.blueOceanScore || 5)); // Default to 5 if not present
      
    // Extract risk adjustment from evaluation
    const riskAdjustment = evaluationData.riskAdjustment || 0;
    overallScore = Math.max(0, Math.min(10, baseScore + riskAdjustment));
    console.log(`[Critic Agent] Calculated overallScore: ${overallScore} (base: ${baseScore}, risk: ${riskAdjustment})`);
  }
  
  // Return the enhanced business idea with critical analysis
  return {
    ...idea,
    criticalAnalysis: evaluationData.criticalAnalysis,
    overallScore: Number(overallScore.toFixed(1)),
    reasoning: {
      ...idea.reasoning,
      overall: evaluationData.overallReasoning
    }
  };
}

/**
 /**
  * Executes the Business Critic Agent with streaming support
  * @param input - The input containing business ideas to critically evaluate
  * @returns An async generator yielding stream events
  */
 export async function* runCriticAgent(
   input: CriticAgentInput,
   factory?: ExecutionModeFactory
 ): AsyncGenerator<CriticStreamEvent> {
   yield { type: 'status', data: 'Starting critical evaluation and risk assessment...' };
 
   // Get execution context from factory or use empty string for backward compatibility
   const executionContext = factory && input.businessIdeas[0]
     ? factory.getCriticContext(input.businessIdeas[0])
     : '';
   
   const agent = createCriticAgent(executionContext);
   const analyzedIdeas: BusinessIdea[] = [];
   const totalIdeas = input.businessIdeas.length;
 
   // Process each idea sequentially
   for (let i = 0; i < totalIdeas; i++) {
     const idea = input.businessIdeas[i];
     
     yield {
       type: 'status',
       data: `Evaluating idea ${i + 1}/${totalIdeas}: ${idea.title}`
     };
     
     yield {
       type: 'chunk',
       data: `\n🔍 Performing critical analysis for: ${idea.title}...\n`
     };
     
     try {
       const analyzedIdea = await analyzeSingleIdea(idea, agent);
       analyzedIdeas.push(analyzedIdea);
       
       // Emit the critical analysis result
       yield {
         type: 'critical-analysis',
         data: {
           ideaId: analyzedIdea.id,
           ideaTitle: analyzedIdea.title,
           analysis: analyzedIdea.criticalAnalysis || '',
           overallScore: analyzedIdea.overallScore || 0
         }
       };
       
       yield {
         type: 'chunk',
         data: `\n✅ Completed critical evaluation for "${analyzedIdea.title}"\n`
       };
       yield {
         type: 'chunk',
         data: `   Overall Score: ${analyzedIdea.overallScore}/10\n`
       };
       
     } catch (error) {
       console.error(`Error analyzing idea "${idea.title}":`, error);
       yield {
         type: 'chunk',
         data: `\n❌ Error evaluating "${idea.title}": ${error instanceof Error ? error.message : 'Unknown error'}\n`
       };
       
       // Add idea with error state
       analyzedIdeas.push({
         ...idea,
         criticalAnalysis: 'Critical evaluation failed due to technical issues.',
         overallScore: 5.0, // Default middle score
         reasoning: {
           ...idea.reasoning,
           overall: 'Default score assigned due to evaluation failure.'
         }
       });
     }
   }
 
   yield {
     type: 'status',
     data: `Completed critical evaluation of ${totalIdeas} ideas`
   };
   
   yield { type: 'complete' };
   
   return analyzedIdeas;
 }
 
 /**
  * Executes the Business Critic Agent with test cache support
  * @param input - The input containing business ideas to critically evaluate
  * @param useTestCache - Whether to use test cache for development
  * @returns A promise resolving to the critically analyzed business ideas
  */
 export async function runCriticAgentWithCache(
   input: CriticAgentInput,
   useTestCache = false,
   factory?: ExecutionModeFactory
 ): Promise<BusinessIdea[]> {
   return TestCacheService.loadOrExecute(
     {
       enabled: useTestCache,
       fileName: 'critic-ideas.json'
     },
     async () => {
       const analyzedIdeas: BusinessIdea[] = [];
       
       // Iterate through the generator
       const generator = runCriticAgent(input, factory);
       let iterResult = await generator.next();
       
       while (!iterResult.done) {
         const event = iterResult.value;
         
         // Log status and chunk events
         if (event.type === 'status' || event.type === 'chunk') {
           console.log(event.data);
         }
         
         iterResult = await generator.next();
       }
       
       // Get the final result
       if (iterResult.value) {
         return iterResult.value;
       }
       
       return analyzedIdeas;
     }
   );
 }