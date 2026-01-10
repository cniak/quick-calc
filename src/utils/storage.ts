const STORAGE_KEY = 'calculator-v2-scopes';

export const storage = {
  getScopes: (): any[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load scopes:', error);
      return [];
    }
  },

  saveScopes: (scopes: any[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scopes));
    } catch (error) {
      console.error('Failed to save scopes:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },
};
