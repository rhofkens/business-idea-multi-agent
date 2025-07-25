const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const documentationApi = {
  async getDocumentation(ideaId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documentation/${ideaId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch documentation');
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching documentation:', error);
      throw error;
    }
  },
  
  async checkDocumentationExists(ideaId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documentation/${ideaId}/status`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking documentation status:', error);
      return false;
    }
  }
};