import dotenv from 'dotenv';

dotenv.config();

/**
 * A service to manage application configuration and environment variables.
 */
class ConfigService {
  public readonly openAIApiKey: string;
  public readonly ideationModel: string;
  public readonly useRefinement: boolean;

  constructor() {
    this.openAIApiKey = this.getEnvVariable('OPENAI_API_KEY');
    this.ideationModel = this.getOptionalEnvVariable('IDEATION_MODEL', 'o3');
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