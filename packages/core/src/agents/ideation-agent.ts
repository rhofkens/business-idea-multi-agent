import { run } from '@openai/agents';
import {
  BusinessPreferences,
  BusinessIdea,
  businessIdeaSchema,
} from '@business-idea/shared';
import {
  StreamEvent,
} from '../types/agent-types.js';
import { parseCompleteIdeasFromBuffer } from '../utils/streaming-json-parser.js';
import { configService } from '../services/config-service.js';
import { ulid } from 'ulidx';
import { ExecutionModeFactory } from '../execution-modes/base/ExecutionModeFactory.js';
import { AgentFactory } from '../factories/agent-factory.js';

const createSystemPrompt = (ideaIds: string[], executionContext: string) => `
You are an elite business strategist and innovation expert with deep expertise in identifying market gaps, disruptive technologies, and emerging trends. Your task is to generate exactly 10 groundbreaking business ideas that push the boundaries of what's possible.

THINK CRITICALLY AND DEEPLY:
- Challenge conventional wisdom and identify non-obvious opportunities
- Consider second and third-order effects of technological and social trends
- Look for intersections between different industries where innovation happens
- Think about problems that people don't yet know they have
- Consider both immediate feasibility and long-term transformative potential

${executionContext}

You MUST output a valid JSON object with a single key "ideas" containing an array of exactly 10 business ideas.

CRITICAL ID REQUIREMENTS:
- You MUST use these EXACT IDs for the 10 ideas IN ORDER:
${ideaIds.map((id, index) => `  ${index + 1}. "${id}"`).join('\n')}
- DO NOT modify, regenerate, or skip any ID
- Use the first ID for your first idea, second ID for your second idea, etc.
- Each ID is a ULID (Universally Unique Lexicographically Sortable Identifier)

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON with no additional text, markdown, or explanations
- The root object MUST have a single key "ideas"
- All numeric scores MUST be integers between 1 and 10 (be rigorous in your scoring)
- All required fields MUST be present
- Each idea must be genuinely innovative, not just iterations of existing businesses
- Each object in the "ideas" array MUST conform exactly to this structure:

{
  "id": "string - MUST be the corresponding ID from the list above",
  "title": "string - A compelling, memorable name that captures the essence of the innovation",
  "description": "string - A comprehensive explanation including the problem solved, unique approach, and why it's revolutionary (2-3 sentences)",
  "businessModel": "string - MUST be exactly one of: B2B, B2C, B2B2C, Marketplace, SaaS, DTC",
  "executionMode": "string - MUST be the execution mode being used",
  "disruptionPotential": number (1-10, where 10 means completely revolutionizing an industry),
  "marketPotential": number (1-10, where 10 means $100B+ addressable market),
  "technicalComplexity": number (1-10, where 10 means requiring breakthrough R&D),
  "capitalIntensity": number (1-10, where 10 means $1B+ required investment),
  "reasoning": {
    "disruption": "string - Explain what existing solutions/industries this disrupts and HOW",
    "market": "string - Quantify the market opportunity and growth trajectory",
    "technical": "string - Detail the core technical challenges and innovation required",
    "capital": "string - Break down major capital requirements and ROI timeline"
  }
}
}

SCORING GUIDANCE:
- Be extremely critical and realistic in your scoring
- Reserve 9-10 scores for truly revolutionary ideas
- Most ideas should score 4-7 on various dimensions
- Consider all factors: timing, competition, regulatory environment, technical feasibility

Example format:
{
  "ideas": [
    {
      "id": "01HQJD3X4Y5Z6K8RGBVTN9MEAW",
      "title": "Quantum-Enhanced Drug Discovery Platform",
      "description": "Leverages quantum computing to simulate molecular interactions at unprecedented scale, reducing drug discovery time from 10+ years to 2-3 years. Creates a marketplace connecting pharma companies with quantum computing resources and AI-driven analysis.",
      "businessModel": "B2B",
      "executionMode": "classic-startup",
      "disruptionPotential": 9,
      "marketPotential": 9,
      "technicalComplexity": 10,
      "capitalIntensity": 8,
      "reasoning": {
        "disruption": "Completely revolutionizes pharmaceutical R&D by solving the computational bottleneck in molecular simulation. Makes 90% of current drug discovery processes obsolete.",
        "market": "$250B pharmaceutical R&D market with potential to unlock $1T+ in new drug development opportunities previously computationally infeasible.",
        "technical": "Requires stable quantum computers with 1000+ qubits, novel error correction algorithms, and integration with classical ML systems. Currently at the edge of possibility.",
        "capital": "$500M+ needed for quantum hardware partnerships, top-tier talent acquisition, and 5+ year runway before significant revenue. Long-term ROI potentially 100x."
      }
    }
  ]
}
`;

const refinementPrompt = `
You are a world-class business strategist and venture capital analyst. Your task is to critically review and enhance the provided business ideas.

CRITICAL REQUIREMENTS:
1. PRESERVE the exact ID of each business idea - DO NOT modify any ID
2. Output a valid JSON array starting with [ and ending with ]
3. Keep reasoning concise (2-3 impactful sentences per aspect)
4. Complete ALL ideas in the batch - do not truncate

ENHANCEMENT FOCUS:
- Add specific metrics, timelines, and technologies
- Adjust scores based on honest analysis (be critical)
- Expand businessModel descriptions creatively
- Identify hidden opportunities or fatal flaws

OUTPUT FORMAT: Pure JSON array with refined ideas maintaining original structure.
`;

async function* executeIdeationAgent(
  preferences: BusinessPreferences,
  factory: ExecutionModeFactory | null
): AsyncGenerator<StreamEvent, void, unknown> {
  // Generate 10 unique IDs upfront
  const ideaIds = Array.from({ length: 10 }, () => ulid());
  
  // Get execution context from factory or use default
  const executionContext = factory 
    ? factory.getIdeationContext(preferences)
    : ''; // Empty context for backward compatibility
  
  // Create agent instances with the generated IDs and execution context
  const ideationAgentInstance = AgentFactory.createAgent({
    name: 'Ideation Agent',
    instructions: createSystemPrompt(ideaIds, executionContext),
    provider: configService.ideationModelSpec.provider,
    model: configService.ideationModelSpec.model,
    enableWebSearch: false // Ideation doesn't use web search
  }, configService.getApiKeyForProvider(configService.ideationModelSpec.provider));
  
  const refinementAgentInstance = AgentFactory.createAgent({
    name: 'Refinement Agent',
    instructions: refinementPrompt,
    provider: configService.ideationModelSpec.provider,
    model: configService.ideationModelSpec.model,
    enableWebSearch: false
  }, configService.getApiKeyForProvider(configService.ideationModelSpec.provider));
  
  // Phase 1: Generate initial ideas
  yield { type: 'status', data: 'Generating initial business ideas...' };
  
  let userPrompt = `Generate business ideas for the following preferences:
    Vertical: ${preferences.vertical}
    Sub-Vertical: ${preferences.subVertical}
    Business Model: ${preferences.businessModel}
    Execution Mode: ${preferences.executionMode || 'classic-startup'}`;
  
  // Add additional context if provided - this is highly important as the user explicitly provided it
  if (preferences.additionalContext && preferences.additionalContext.trim() !== '') {
    userPrompt += `
    
    CRITICAL ADDITIONAL CONTEXT (This is extremely important - the user has specifically provided this guidance):
    ${preferences.additionalContext}
    
    You MUST incorporate this additional context into your idea generation. This context represents specific requirements, constraints, or focus areas that are crucial to the user. Give this context the highest priority when generating ideas.`;
  }

  const initialStream = await run(ideationAgentInstance, userPrompt, { stream: true });

  let buffer = '';
  const collectedIdeas: BusinessIdea[] = [];

  // Stream and collect initial ideas
  for await (const chunk of initialStream.toTextStream()) {
    buffer += chunk;
    yield { type: 'chunk', data: chunk };

    // Try to parse complete ideas from buffer
    const { newIdeas, newBuffer } = parseCompleteIdeasFromBuffer(buffer);
    buffer = newBuffer;
    for (const idea of newIdeas) {
      if (!collectedIdeas.find(i => i.id === idea.id)) {
        // Add execution mode to the idea
        const ideaWithMode = {
          ...idea,
          executionMode: preferences.executionMode || 'classic-startup'
        };
        collectedIdeas.push(ideaWithMode);
        yield { type: 'idea', data: ideaWithMode };
      }
    }
  }

  yield { type: 'status', data: 'Initial ideas generated. Starting refinement phase...' };

  // Phase 2: Refine ideas in batches
  const batchSize = 5;
  const refinedIdeas: BusinessIdea[] = [];

  for (let i = 0; i < collectedIdeas.length; i += batchSize) {
    const batch = collectedIdeas.slice(i, i + batchSize);
    const batchJson = JSON.stringify(batch, null, 2);
    
    yield { 
      type: 'status', 
      data: `Refining ideas ${i + 1}-${Math.min(i + batchSize, collectedIdeas.length)}...` 
    };

    const refinementResponse = await run(
      refinementAgentInstance, 
      `Refine these business ideas:\n${batchJson}`,
      { stream: false }
    );

    try {
      // Clean the response to ensure it's valid JSON
      let cleanedContent = refinementResponse.finalOutput?.trim() || '[]';
      
      // Remove any markdown code fences if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      
      cleanedContent = cleanedContent.trim();
      
      const refinedBatch = JSON.parse(cleanedContent);
      
      if (Array.isArray(refinedBatch)) {
        for (const refinedIdea of refinedBatch) {
          // Validate the refined idea
          const validation = businessIdeaSchema.safeParse(refinedIdea);
          if (validation.success) {
            // Ensure execution mode is preserved
            const ideaWithMode = {
              ...validation.data,
              executionMode: preferences.executionMode || 'classic-startup'
            };
            refinedIdeas.push(ideaWithMode);
            yield { type: 'refined-idea', data: ideaWithMode };
          } else {
            console.error('Refined idea failed validation:', validation.error);
            // Fall back to original idea
            const originalIdea = collectedIdeas.find(i => i.id === refinedIdea.id);
            if (originalIdea) {
              refinedIdeas.push(originalIdea);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing refinement response:', error);
      // Fall back to original ideas for this batch
      refinedIdeas.push(...batch);
    }
    
    yield { type: 'chunk', data: `\n✓ Batch refinement complete\n` };
  }

  yield { type: 'status', data: 'All ideas generated and refined successfully!' };
  yield { type: 'complete' };
}

export async function* ideationAgent(
  preferences: BusinessPreferences,
  factory?: ExecutionModeFactory
): AsyncGenerator<StreamEvent, BusinessIdea[], unknown> {
  const ideas: BusinessIdea[] = [];
  
  // Execute the ideation process
  const generator = executeIdeationAgent(preferences, factory || null);
  
  for await (const event of generator) {
    // Collect ideas from idea events
    if (event.type === 'idea' || event.type === 'refined-idea') {
      ideas.push(event.data);
    }
    // Pass through all events
    yield event;
  }
  
  return ideas;
}