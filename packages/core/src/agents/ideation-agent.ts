import { Agent, run } from '@openai/agents';
import {
  BusinessPreferences,
  BusinessIdea,
  businessIdeaSchema,
} from '@business-idea/shared';
import {
  StreamEvent,
} from '../types/agent-types.js';
import { parseCompleteIdeasFromBuffer } from '../utils/streaming-json-parser.js';
import { z } from 'zod';
import { configService } from '../services/config-service.js';
import { ulid } from 'ulidx';
const createSystemPrompt = (ideaIds: string[]) => `
You are an elite business strategist and innovation expert with deep expertise in identifying market gaps, disruptive technologies, and emerging trends. Your task is to generate exactly 10 groundbreaking business ideas that push the boundaries of what's possible.

THINK CRITICALLY AND DEEPLY:
- Challenge conventional wisdom and identify non-obvious opportunities
- Consider second and third-order effects of technological and social trends
- Look for intersections between different industries where innovation happens
- Think about problems that people don't yet know they have
- Consider both immediate feasibility and long-term transformative potential

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
// Agent instances will be created dynamically with generated IDs

async function* executeIdeationAgent(
  preferences: BusinessPreferences,
): AsyncGenerator<StreamEvent, void, unknown> {
  // Generate 10 unique IDs upfront
  const ideaIds = Array.from({ length: 10 }, () => ulid());
  
  // Create agent instances with the generated IDs
  const ideationAgentInstance = new Agent({
    name: 'Ideation Agent',
    instructions: createSystemPrompt(ideaIds),
    model: configService.ideationModel,
  });
  
  const refinementAgentInstance = new Agent({
    name: 'Refinement Agent',
    instructions: refinementPrompt,
    model: configService.ideationModel,
  });
  
  // Phase 1: Generate initial ideas
  yield { type: 'status', data: 'Generating initial business ideas...' };
  
  let userPrompt = `Generate business ideas for the following preferences:
    Vertical: ${preferences.vertical}
    Sub-Vertical: ${preferences.subVertical}
    Business Model: ${preferences.businessModel}`;
  
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
    yield { type: 'chunk', data: chunk };

    buffer += chunk;
    const { newIdeas, newBuffer } = parseCompleteIdeasFromBuffer(buffer);

    if (newIdeas.length > 0) {
      for (const idea of newIdeas) {
        try {
          // Validate the idea using Zod schema
          const validatedIdea = businessIdeaSchema.parse(idea);
          collectedIdeas.push(validatedIdea);
          yield { type: 'idea', data: validatedIdea };
        } catch (error) {
          // Log validation error and skip invalid idea
          console.error('Invalid business idea structure:', error);
          if (error instanceof z.ZodError) {
            console.error('Validation errors:', error.errors);
          }
        }
      }
      buffer = newBuffer;
    }
  }

  await initialStream.completed;
  
  // Process any remaining ideas in the buffer
  const { newIdeas: remainingIdeas } = parseCompleteIdeasFromBuffer(buffer);
  
  for (const idea of remainingIdeas) {
    try {
      const validatedIdea = businessIdeaSchema.parse(idea);
      collectedIdeas.push(validatedIdea);
      yield { type: 'idea', data: validatedIdea };
    } catch (error) {
      console.error('Invalid business idea structure:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
      }
    }
  }
  
  // Phase 2: Refine ideas (if enabled)
  if (configService.useRefinement && collectedIdeas.length > 0) {
    yield { type: 'status', data: 'Refining and enhancing business ideas...' };
    
    // Process ideas in batches to avoid truncation with GPT-4o
    const BATCH_SIZE = 3;
    const allRefinedIdeas: BusinessIdea[] = [];
    
    for (let i = 0; i < collectedIdeas.length; i += BATCH_SIZE) {
      const batch = collectedIdeas.slice(i, Math.min(i + BATCH_SIZE, collectedIdeas.length));
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(collectedIdeas.length / BATCH_SIZE);
      
      console.log(`[REFINEMENT] Processing batch ${batchNumber} of ${totalBatches} (${batch.length} ideas)`);
      yield { type: 'status', data: `Refining ideas batch ${batchNumber} of ${totalBatches}...` };
      
      const batchPromptText = `Here are ${batch.length} business ideas to refine and enhance:\n\n${JSON.stringify(batch, null, 2)}\n\nApply critical analysis to improve these ${batch.length} ideas. Output a JSON array with exactly ${batch.length} refined ideas.`;
      
      const refinementStream = await run(refinementAgentInstance, batchPromptText, { stream: true });
      
      let batchBuffer = '';
      let batchRefinedCount = 0;
      
      // Stream refined ideas for this batch
      for await (const chunk of refinementStream.toTextStream()) {
        batchBuffer += chunk;
        
        const { newIdeas: refinedIdeas, newBuffer: newBatchBuffer } = parseCompleteIdeasFromBuffer(batchBuffer);
        
        if (refinedIdeas.length > 0) {
          for (const refinedIdea of refinedIdeas) {
            try {
              const validatedRefinedIdea = businessIdeaSchema.parse(refinedIdea);
              allRefinedIdeas.push(validatedRefinedIdea);
              yield { type: 'refined-idea', data: validatedRefinedIdea };
              batchRefinedCount++;
            } catch (error) {
              console.error(`[REFINEMENT BATCH ${batchNumber}] Validation error:`, error);
              if (error instanceof z.ZodError) {
                console.error('[REFINEMENT VALIDATION] Errors:', error.errors.map(e => ({
                  path: e.path.join('.'),
                  message: e.message
                })));
              }
            }
          }
          batchBuffer = newBatchBuffer;
        }
      }
      
      await refinementStream.completed;
      
      // Process any remaining ideas in batch buffer
      const { newIdeas: remainingBatchIdeas } = parseCompleteIdeasFromBuffer(batchBuffer);
      
      for (const refinedIdea of remainingBatchIdeas) {
        try {
          const validatedRefinedIdea = businessIdeaSchema.parse(refinedIdea);
          allRefinedIdeas.push(validatedRefinedIdea);
          yield { type: 'refined-idea', data: validatedRefinedIdea };
          batchRefinedCount++;
        } catch (error) {
          console.error(`[REFINEMENT BATCH ${batchNumber}] Failed to validate remaining idea:`, error);
        }
      }
      
      console.log(`[REFINEMENT] Batch ${batchNumber} completed: ${batchRefinedCount}/${batch.length} ideas refined`);
    }
    
    console.log(`[REFINEMENT] Total refined ideas: ${allRefinedIdeas.length} out of ${collectedIdeas.length} original ideas`);
    
    if (allRefinedIdeas.length !== collectedIdeas.length) {
      console.error(`[REFINEMENT ERROR] Mismatch in idea count: ${allRefinedIdeas.length} refined vs ${collectedIdeas.length} original`);
    }
  }
  
  yield { type: 'complete' };
  
  // Log a warning if we didn't get exactly 10 valid ideas
  if (collectedIdeas.length !== 10) {
    console.warn(`Expected 10 valid business ideas, but got ${collectedIdeas.length}`);
  }
}
export const ideationAgent = {
  name: 'Ideation Agent',
  execute: executeIdeationAgent,
};