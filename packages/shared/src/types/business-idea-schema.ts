import { z } from 'zod';

export const businessIdeaSchema = z.object({
  id: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid ULID format'),
  title: z.string(),
  description: z.string(),
  businessModel: z.enum(['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'DTC']),
  disruptionPotential: z.number().min(1).max(10),
  marketPotential: z.number().min(1).max(10),
  technicalComplexity: z.number().min(1).max(10),
  capitalIntensity: z.number().min(1).max(10),
  blueOceanScore: z.number().min(1).max(10).optional(),
  overallScore: z.number().min(1).max(10).optional(),
  reasoning: z.object({
    disruption: z.string(),
    market: z.string(),
    technical: z.string(),
    capital: z.string(),
    blueOcean: z.string().optional(),
    overall: z.string().optional(),
  }),
  competitorAnalysis: z.string().optional(),
  criticalAnalysis: z.string().optional(),
});