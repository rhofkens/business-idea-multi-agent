import { db } from '../db.js';
import { ideas, type Idea, type NewIdea, type IdeaStage } from '../schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { BusinessIdea } from '@business-idea/shared';

export interface IdeaRepository {
  createIdea(runId: string, userId: string, idea: BusinessIdea): Promise<void>;
  updateIdeaStage(ideaId: string, stage: IdeaStage, data: Partial<BusinessIdea>): Promise<void>;
  updateIdeaDocumentPath(ideaId: string, documentPath: string): Promise<void>;
  getIdeasByRun(runId: string): Promise<BusinessIdea[]>;
  getIdeasByUser(userId: string, starred?: boolean): Promise<BusinessIdea[]>;
  getIdeaById(ideaId: string): Promise<BusinessIdea | null>;
  setStarred(ideaId: string, starred: boolean): Promise<void>;
}

export class IdeaRepositoryImpl implements IdeaRepository {
  async createIdea(runId: string, userId: string, idea: BusinessIdea): Promise<void> {
    const now = new Date();
    const newIdea: NewIdea = {
      id: idea.id, // Use existing ULID from BusinessIdea
      runId,
      userId,
      title: idea.title,
      description: idea.description,
      businessModel: idea.businessModel,
      disruptionPotential: idea.disruptionPotential,
      marketPotential: idea.marketPotential,
      technicalComplexity: idea.technicalComplexity,
      capitalIntensity: idea.capitalIntensity,
      blueOceanScore: idea.blueOceanScore || null,
      overallScore: idea.overallScore || null,
      reasoning: JSON.stringify(idea.reasoning),
      competitorAnalysis: idea.competitorAnalysis || null,
      criticalAnalysis: idea.criticalAnalysis || null,
      stage: 'ideation',
      starred: false,
      documentPath: null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert without transaction per ADR-009
    await db.insert(ideas).values(newIdea);
  }

  async updateIdeaStage(ideaId: string, stage: IdeaStage, data: Partial<BusinessIdea>): Promise<void> {
    // Define proper type for update data
    interface UpdateData {
      stage: IdeaStage;
      updatedAt: Date;
      blueOceanScore?: number | null;
      overallScore?: number | null;
      competitorAnalysis?: string | null;
      criticalAnalysis?: string | null;
      reasoning?: string;
      documentPath?: string | null;
    }
    
    const updateData: UpdateData = {
      stage,
      updatedAt: new Date(),
    };

    // Add any provided data fields
    if (data.blueOceanScore !== undefined) updateData.blueOceanScore = data.blueOceanScore;
    if (data.overallScore !== undefined) updateData.overallScore = data.overallScore;
    if (data.competitorAnalysis !== undefined) updateData.competitorAnalysis = data.competitorAnalysis;
    if (data.criticalAnalysis !== undefined) updateData.criticalAnalysis = data.criticalAnalysis;
    if (data.reasoning !== undefined) updateData.reasoning = JSON.stringify(data.reasoning);
    if ('documentPath' in data) updateData.documentPath = typeof data.documentPath === 'string' ? data.documentPath : null;

    await db
      .update(ideas)
      .set(updateData)
      .where(eq(ideas.id, ideaId));
  }

  async updateIdeaDocumentPath(ideaId: string, documentPath: string): Promise<void> {
    await db
      .update(ideas)
      .set({
        documentPath,
        updatedAt: new Date(),
      })
      .where(eq(ideas.id, ideaId));
  }

  async getIdeasByRun(runId: string): Promise<BusinessIdea[]> {
    const ideaRows = await db
      .select()
      .from(ideas)
      .where(eq(ideas.runId, runId))
      .orderBy(desc(ideas.overallScore));

    return ideaRows.map(row => this.rowToBusinessIdea(row));
  }

  async getIdeasByUser(userId: string, starred?: boolean): Promise<BusinessIdea[]> {
    // Build where conditions based on parameters
    const whereConditions = starred !== undefined
      ? and(eq(ideas.userId, userId), eq(ideas.starred, starred))
      : eq(ideas.userId, userId);

    const ideaRows = await db
      .select()
      .from(ideas)
      .where(whereConditions)
      .orderBy(desc(ideas.createdAt));
      
    return ideaRows.map(row => this.rowToBusinessIdea(row));
  }

  async getIdeaById(ideaId: string): Promise<BusinessIdea | null> {
    const [ideaRow] = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, ideaId));

    return ideaRow ? this.rowToBusinessIdea(ideaRow) : null;
  }

  async setStarred(ideaId: string, starred: boolean): Promise<void> {
    await db
      .update(ideas)
      .set({
        starred,
        updatedAt: new Date(),
      })
      .where(eq(ideas.id, ideaId));
  }

  private rowToBusinessIdea(row: Idea): BusinessIdea {
    // Debug logging to check starred value
    console.log(`[IdeaRepository] rowToBusinessIdea - id: ${row.id}, starred raw value: ${row.starred}, type: ${typeof row.starred}`);
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      businessModel: row.businessModel,
      disruptionPotential: row.disruptionPotential,
      marketPotential: row.marketPotential,
      technicalComplexity: row.technicalComplexity,
      capitalIntensity: row.capitalIntensity,
      blueOceanScore: row.blueOceanScore || undefined,
      overallScore: row.overallScore || undefined,
      reasoning: JSON.parse(row.reasoning),
      competitorAnalysis: row.competitorAnalysis || undefined,
      criticalAnalysis: row.criticalAnalysis || undefined,
      starred: Boolean(row.starred), // Explicitly convert to boolean
    };
  }
}

// Export singleton instance
export const ideaRepository = new IdeaRepositoryImpl();