import dotenv from 'dotenv';

dotenv.config();

/**
 * A service to manage application configuration and environment variables.
 */
class ConfigService {
  public readonly openAIApiKey: string;
  public readonly llmModel: string;
  public readonly ideationModel: string;
  public readonly competitorModel: string;
  public readonly criticModel: string;
  public readonly documentationModel: string;
  public readonly useRefinement: boolean;

  constructor() {
    this.openAIApiKey = this.getEnvVariable('OPENAI_API_KEY');
    
    // Global LLM model configuration (fallback for all agents)
    this.llmModel = this.getOptionalEnvVariable('LLM_MODEL', 'o3');
    
    // Per-agent model configuration with fallback chain:
    // 1. Agent-specific env var (e.g., IDEATION_MODEL)
    // 2. Global LLM_MODEL
    // 3. Legacy IDEATION_MODEL for backward compatibility
    // 4. Default to 'o3'
    const legacyIdeationModel = this.getOptionalEnvVariable('IDEATION_MODEL', '');
    this.ideationModel = this.getOptionalEnvVariable('IDEATION_MODEL', '') || this.llmModel || legacyIdeationModel || 'o3';
    this.competitorModel = this.getOptionalEnvVariable('COMPETITOR_MODEL', '') || this.llmModel || 'o3';
    this.criticModel = this.getOptionalEnvVariable('CRITIC_MODEL', '') || this.llmModel || 'o3';
    this.documentationModel = this.getOptionalEnvVariable('DOCUMENTATION_MODEL', '') || this.llmModel || 'o3';
    
    this.useRefinement = this.getOptionalEnvVariable('USE_REFINEMENT', 'true') === 'true';
  }

  private getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }

  private getOptionalEnvVariable(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
}

export const configService = new ConfigService();