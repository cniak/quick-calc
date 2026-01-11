import type { Scope, FunctionSet } from '@/features/scoped-calculator/state/types';

const STORAGE_KEY = 'calculator-v2-scopes';
const FUNCTION_SETS_KEY = 'calculator-v2-function-sets';

export const storage = {
  getScopes: (): Scope[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      
      // Migration: move functionSets to global storage
      let migrationNeeded = false;
      const migratedFunctionSets: FunctionSet[] = [];
      
      const cleanedScopes = parsed.map((scope: any) => {
        // Old format migration: 'functions' -> 'functionSets'
        if (scope.functions && !scope.functionSets) {
          scope.functionSets = scope.functions.map((fn: any, idx: number) => ({
            id: `set-migrated-${Date.now()}-${idx}`,
            name: fn.name,
            code: fn.code,
            isSaved: fn.isSaved,
            colorTag: fn.colorTag || 'blue',
            createdAt: new Date().toISOString(),
          }));
        }
        
        // New migration: extract functionSets to global
        if (scope.functionSets && scope.functionSets.length > 0) {
          migrationNeeded = true;
          migratedFunctionSets.push(...scope.functionSets);
        }
        
        // Remove functionSets from scope
        const { functionSets, functions, ...cleanScope } = scope;
        return cleanScope;
      });
      
      // Save migrated function sets if needed
      if (migrationNeeded && migratedFunctionSets.length > 0) {
        // Deduplicate by id
        const existingSets = storage.getFunctionSets();
        const existingIds = new Set(existingSets.map(s => s.id));
        const newSets = migratedFunctionSets.filter(s => !existingIds.has(s.id));
        if (newSets.length > 0) {
          storage.saveFunctionSets([...existingSets, ...newSets]);
        }
      }
      
      return cleanedScopes;
    } catch (error) {
      console.error('Failed to load scopes:', error);
      return [];
    }
  },

  saveScopes: (scopes: Scope[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scopes));
    } catch (error) {
      console.error('Failed to save scopes:', error);
    }
  },

  getFunctionSets: (): FunctionSet[] => {
    try {
      const data = localStorage.getItem(FUNCTION_SETS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load function sets:', error);
      return [];
    }
  },

  saveFunctionSets: (functionSets: FunctionSet[]): void => {
    try {
      localStorage.setItem(FUNCTION_SETS_KEY, JSON.stringify(functionSets));
    } catch (error) {
      console.error('Failed to save function sets:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FUNCTION_SETS_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },
};
