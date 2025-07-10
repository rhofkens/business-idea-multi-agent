import { Agent, run } from '@openai/agents';
import {
  BusinessPreferences,
} from '../types/business-idea.js';
import {
  StreamEvent,
  businessIdeaSchema,
} from '../types/agent-types.js';
import { parseCompleteIdeasFromBuffer } from '../utils/streaming-json-parser.js';
import { z } from 'zod';
import { configService } from '../services/config-service.js';

const systemPrompt = `
You are an elite business strategist and innovation expert with deep expertise in identifying market gaps, disruptive technologies, and emerging trends. Your task is to generate exactly 10 groundbreaking business ideas that push the boundaries of what's possible.

THINK CRITICALLY AND DEEPLY:
- Challenge conventional wisdom and identify non-obvious opportunities
- Consider second and third-order effects of technological and social trends
- Look for intersections between different industries where innovation happens
- Think about problems that people don't yet know they have
- Consider both immediate feasibility and long-term transformative potential

You MUST output a valid JSON object with a single key "ideas" containing an array of exactly 10 business ideas.

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON with no additional text, markdown, or explanations
- The root object MUST have a single key "ideas"
- All numeric scores MUST be integers between 1 and 10 (be rigorous in your scoring)
- All required fields MUST be present
- Each idea must be genuinely innovative, not just iterations of existing businesses
- Each object in the "ideas" array MUST conform exactly to this structure:

{
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

SCORING GUIDANCE:
- Be extremely critical and realistic in your scoring
- Reserve 9-10 scores for truly revolutionary ideas
- Most ideas should score 4-7 on various dimensions
- Consider all factors: timing, competition, regulatory environment, technical feasibility

Example format:
{
  "ideas": [
    {
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
You are a world-class business strategist and venture capital analyst with deep expertise in evaluating and refining business ideas. Your task is to critically review and enhance the provided business ideas.

CRITICAL ANALYSIS FRAMEWORK:
1. Challenge every assumption and score
2. Identify gaps, weaknesses, and overlooked opportunities
3. Enhance value propositions with specific, quantifiable improvements
4. Refine market positioning and go-to-market strategies
5. Identify synergies and compound effects

REFINEMENT OBJECTIVES:
- Make descriptions more compelling and specific (include numbers, timelines, specific technologies)
- Adjust scores based on deeper analysis (be brutally honest)
- Enhance reasoning with concrete examples and data points
- Identify additional risks or opportunities not initially considered
- Suggest pivots or variations that could 10x the potential

You MUST output a valid JSON object with a single key "ideas" containing the refined array of business ideas.
Maintain the exact same structure as the input, but with enhanced content and adjusted scores where appropriate.

REFINEMENT PRINCIPLES:
- If an idea is truly weak, score it appropriately (don't inflate scores)
- If an idea has hidden potential, explain how to unlock it
- Add specific metrics, market data, or technological breakthroughs that support the idea
- Consider timing: what makes this idea particularly relevant NOW vs 5 years ago/from now?
- Think about network effects, platform dynamics, and winner-take-all scenarios

Remember: Great ideas often look crazy at first. Look for the non-obvious insights that others might miss.
`;
const ideationAgentInstance = new Agent({
  name: 'Ideation Agent',
  instructions: systemPrompt,
  model: configService.ideationModel,
});

const refinementAgentInstance = new Agent({
  name: 'Refinement Agent',
  instructions: refinementPrompt,
  model: configService.ideationModel,
});

async function* executeIdeationAgent(
  preferences: BusinessPreferences,
): AsyncGenerator<StreamEvent, void, unknown> {
  // Phase 1: Generate initial ideas
  yield { type: 'status', data: 'Generating initial business ideas...' };
  
  const userPrompt = `Generate business ideas for the following preferences:
    Vertical: ${preferences.vertical}
    Sub-Vertical: ${preferences.subVertical}
    Business Model: ${preferences.businessModel}`;

  const initialStream = await run(ideationAgentInstance, userPrompt, { stream: true });

  let buffer = '';
  const collectedIdeas: any[] = [];

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
  
  const refinementPromptText = `Here are the initial business ideas to refine and enhance:\n\n${JSON.stringify({ ideas: collectedIdeas }, null, 2)}\n\nApply critical analysis to improve these ideas, adjust scores based on deeper insights, and enhance all descriptions and reasoning.`;
  
  const refinementStream = await run(refinementAgentInstance, refinementPromptText, { stream: true });
  
  // Clear ideas to track refined versions
  let refinedBuffer = '';
  let refinedIdeasCount = 0;
  
  // Stream refined ideas
  for await (const chunk of refinementStream.toTextStream()) {
    // Don't emit chunks during refinement to avoid confusion
    refinedBuffer += chunk;
    const { newIdeas: refinedIdeas, newBuffer: newRefinedBuffer } = parseCompleteIdeasFromBuffer(refinedBuffer);
    
    if (refinedIdeas.length > 0) {
      for (const refinedIdea of refinedIdeas) {
        try {
          const validatedRefinedIdea = businessIdeaSchema.parse(refinedIdea);
          yield { type: 'refined-idea', data: validatedRefinedIdea };
          refinedIdeasCount++;
        } catch (error) {
          console.error('Invalid refined business idea structure:', error);
          if (error instanceof z.ZodError) {
            console.error('Validation errors:', error.errors);
          }
        }
      }
      refinedBuffer = newRefinedBuffer;
    }
  }
  
  await refinementStream.completed;
  
  // Process any remaining refined ideas
  const { newIdeas: remainingRefinedIdeas } = parseCompleteIdeasFromBuffer(refinedBuffer);
  
  for (const refinedIdea of remainingRefinedIdeas) {
    try {
      const validatedRefinedIdea = businessIdeaSchema.parse(refinedIdea);
      yield { type: 'refined-idea', data: validatedRefinedIdea };
      refinedIdeasCount++;
    } catch (error) {
      console.error('Invalid refined business idea structure:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
      }
    }
  }
  
    if (refinedIdeasCount !== collectedIdeas.length) {
      console.warn(`Expected ${collectedIdeas.length} refined ideas, but got ${refinedIdeasCount}`);
    }
  }
  
  yield { type: 'complete' };
  
  // Log a warning if we didn't get exactly 10 valid ideas
  if (collectedIdeas.length !== 10) {
    console.warn(`Expected 10 valid business ideas, but got ${collectedIdeas.length}`);
  }
}
export const ideationAgent = {
  name: ideationAgentInstance.name,
  execute: executeIdeationAgent,
};