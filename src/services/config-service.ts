import dotenv from 'dotenv';

dotenv.config();

/**
 * A service to manage application configuration and environment variables.
 */
class ConfigService {
  public readonly openAIApiKey: string;

  constructor() {
    this.openAIApiKey = this.getEnvVariable('OPENAI_API_KEY');
  }

  private getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }
}

export const configService = new ConfigService();