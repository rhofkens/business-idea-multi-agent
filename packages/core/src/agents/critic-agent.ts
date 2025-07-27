import { Agent, run, webSearchTool } from '@openai/agents';
import { BusinessIdea } from '@business-idea/shared';
import {
  CriticAgentInput,
  CriticStreamEvent
} from '../schemas/critic-agent-schemas.js';
import { TestCacheService } from '../services/test-cache-service.js';

/**
 * System prompt for critical evaluation and Overall Score calculation
 * Implements ADR-005 methodology for final scoring
 */
const criticalEvaluationPrompt = `
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

Return your analysis as a JSON object with these fields:
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
 * @returns A configured Agent instance with web search capabilities
 */
function createCriticAgent(): Agent {
  return new Agent({
    name: 'Business Critic Agent',
    model: 'o3',
    tools: [webSearchTool()],
    instructions: criticalEvaluationPrompt
  });
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

  // Clean the content - remove markdown code fences if present
  let cleanedContent = content.trim();
  
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

  // Parse JSON response
  const evaluationData = JSON.parse(cleanedContent);
  
  // Calculate the overall score based on ADR-005
  const baseScore =
    (0.20 * idea.disruptionPotential) +
    (0.25 * idea.marketPotential) +
    (0.15 * (10 - idea.technicalComplexity)) +
    (0.15 * (10 - idea.capitalIntensity)) +
    (0.25 * (idea.blueOceanScore || 5)); // Default to 5 if not present
    
  // Extract risk adjustment from evaluation
  const riskAdjustment = evaluationData.riskAdjustment || 0;
  const overallScore = Math.max(0, Math.min(10, baseScore + riskAdjustment));
  
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
   input: CriticAgentInput
 ): AsyncGenerator<CriticStreamEvent> {
   yield { type: 'status', data: 'Starting critical evaluation and risk assessment...' };
 
   const agent = createCriticAgent();
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
   useTestCache = false
 ): Promise<BusinessIdea[]> {
   return TestCacheService.loadOrExecute(
     {
       enabled: useTestCache,
       fileName: 'critic-ideas.json'
     },
     async () => {
       const analyzedIdeas: BusinessIdea[] = [];
       
       // Iterate through the generator
       const generator = runCriticAgent(input);
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