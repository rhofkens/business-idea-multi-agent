import ApiClient from './api-client';
import type {
  BusinessVertical,
  BusinessPreferences
} from '@business-idea/shared';

/**
 * Business model structure
 */
export interface BusinessModel {
  id: string;
  name: string;
  description: string;
}

/**
 * Business options response from the API
 */
export interface BusinessOptionsResponse {
  verticals: Array<BusinessVertical & { subverticals: Array<{ id: string; name: string; description: string }> }>;
  businessModels: BusinessModel[];
}

/**
 * Business preferences submission response
 */
export interface PreferencesSubmissionResponse {
  processId: string;
  status: string;
  message: string;
}

/**
 * Business Preferences API service for handling business preferences-related API calls.
 *
 * This service provides a clean interface for all business preferences
 * operations, wrapping the ApiClient with preferences-specific methods.
 * All methods handle errors consistently by throwing with meaningful
 * messages for the UI to display.
 *
 * Features:
 * - Fetch business options (verticals, subverticals, business models)
 * - Submit business preferences for idea generation
 * - Automatic session handling via ApiClient
 *
 * @class BusinessPreferencesApi
 */
export class BusinessPreferencesApi {
  private client: ApiClient;

  constructor(baseURL?: string) {
    this.client = new ApiClient(baseURL ? { baseURL } : {});
  }

  /**
   * Get business options for the preferences form.
   *
   * Retrieves all available business verticals with their subverticals
   * and business models that can be selected by the user.
   *
   * @returns {Promise<BusinessOptionsResponse>} Business options data
   * @throws {Error} If request fails due to server error
   *
   * @example
   * ```typescript
   * try {
   *   const options = await businessPreferencesApi.getOptions();
   *   console.log('Available verticals:', options.verticals.length);
   * } catch (error) {
   *   console.error('Failed to load options:', error.message);
   * }
   * ```
   */
  async getOptions(): Promise<BusinessOptionsResponse> {
    const response = await this.client.get<BusinessOptionsResponse>('/api/preferences/options');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch business options');
    }
    
    return response.data!;
  }

  /**
   * Submit business preferences for idea generation.
   *
   * Sends the user's selected business preferences to the backend
   * which triggers the AI agent workflow for idea generation.
   *
   * @param {BusinessPreferences} preferences - User's business preferences
   * @param {string} preferences.vertical - Selected business vertical ID
   * @param {string} preferences.subVertical - Selected sub-vertical ID  
   * @param {string} preferences.businessModel - Selected business model ID
   * @param {string} preferences.additionalContext - Optional additional context
   * @returns {Promise<PreferencesSubmissionResponse>} Submission response with process ID
   * @throws {Error} If submission fails due to validation or server error
   *
   * @example
   * ```typescript
   * try {
   *   const response = await businessPreferencesApi.submit({
   *     vertical: 'technology',
   *     subVertical: 'fintech',
   *     businessModel: 'saas',
   *     additionalContext: 'Focus on B2B solutions'
   *   });
   *   console.log('Process started:', response.processId);
   * } catch (error) {
   *   console.error('Submission failed:', error.message);
   * }
   * ```
   */
  async submit(preferences: BusinessPreferences): Promise<PreferencesSubmissionResponse> {
    const response = await this.client.post<PreferencesSubmissionResponse>(
      '/api/preferences', 
      preferences
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit preferences');
    }
    
    return response.data!;
  }
}

/**
 * Default BusinessPreferencesApi instance for use throughout the application.
 * Uses the default API base URL configured in ApiClient.
 *
 * @example
 * ```typescript
 * import { businessPreferencesApi } from './services/business-preferences-api';
 *
 * // Use the singleton instance
 * const options = await businessPreferencesApi.getOptions();
 * ```
 */
export const businessPreferencesApi = new BusinessPreferencesApi();

/**
 * Convenience function to get business options.
 * @see {@link BusinessPreferencesApi.getOptions}
 */
export const getBusinessOptions = () => businessPreferencesApi.getOptions();

/**
 * Convenience function to submit business preferences.
 * @see {@link BusinessPreferencesApi.submit}
 */
export const submitBusinessPreferences = (preferences: BusinessPreferences) => 
  businessPreferencesApi.submit(preferences);