import { create } from 'zustand';
import type { Scope, VariableLine, FunctionSet } from '@/features/scoped-calculator/state/types';
import { storage } from '@/utils/storage';
import { parseLine, extractDependencies } from '@/features/scoped-calculator/utils/parser';
import { evaluateAllLines } from '@/features/scoped-calculator/utils/evaluator';

interface CalculatorState {
  scopes: Scope[];
  activeScopeId: string | null;
  functionSets: FunctionSet[]; // Global function sets
  history: Record<string, VariableLine[][]>; // scope id -> array of historical states
  
  // Actions
  loadScopes: () => void;
  createScope: (name: string) => void;
  renameScope: (id: string, name: string) => void;
  deleteScope: (id: string) => void;
  setActiveScope: (id: string) => void;
  reorderScopes: (fromIndex: number, toIndex: number) => void;
  undo: (scopeId: string) => void;
  
  // Lines
  addLine: (scopeId: string, expression: string, index?: number) => void;
  updateLine: (scopeId: string, lineIndex: number, expression: string) => void;
  updateLinePriority: (scopeId: string, lineIndex: number, priority: number) => void;
  deleteLine: (scopeId: string, lineIndex: number) => void;
  
  // Function Sets (Global)
  addFunctionSet: (name: string) => string;
  updateFunctionSet: (setId: string, code: string) => void;
  saveFunctionSet: (setId: string) => void;
  renameFunctionSet: (setId: string, newName: string) => void;
  deleteFunctionSet: (setId: string) => void;
  
  // Recompute
  recomputeScope: (scopeId: string) => void;
}

const colorTags = ['blue', 'green', 'purple', 'orange', 'pink'];

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  scopes: [],
  activeScopeId: null,
  functionSets: [],
  history: {},
  
  loadScopes: () => {
    const scopes = storage.getScopes();
    const functionSets = storage.getFunctionSets();
    set({ scopes, functionSets, activeScopeId: scopes.length > 0 ? scopes[0].id : null });
  },
  
  createScope: (name) => {
    const newScope: Scope = {
      id: `scope-${Date.now()}-${Math.random()}`,
      name,
      variables: [{
        lineIndex: 0,
        name: null,
        expression: '',
        value: null,
        error: null,
        dependsOn: [],
        priority: 3,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const scopes = [...get().scopes, newScope];
    storage.saveScopes(scopes);
    set({ scopes, activeScopeId: newScope.id });
  },
  
  renameScope: (id, name) => {
    const scopes = get().scopes.map(s =>
      s.id === id ? { ...s, name, updatedAt: new Date().toISOString() } : s
    );
    storage.saveScopes(scopes);
    set({ scopes });
  },
  
  deleteScope: (id) => {
    const scopes = get().scopes.filter(s => s.id !== id);
    const activeScopeId = get().activeScopeId === id
      ? (scopes.length > 0 ? scopes[0].id : null)
      : get().activeScopeId;
    
    storage.saveScopes(scopes);
    set({ scopes, activeScopeId });
  },
  
  setActiveScope: (id) => {
    set({ activeScopeId: id });
  },
  
  reorderScopes: (fromIndex, toIndex) => {
    const scopes = [...get().scopes];
    const [movedScope] = scopes.splice(fromIndex, 1);
    scopes.splice(toIndex, 0, movedScope);
    
    storage.saveScopes(scopes);
    set({ scopes });
  },
  
  undo: (scopeId) => {
    const history = get().history[scopeId];
    if (!history || history.length === 0) return;
    
    const previousState = history[history.length - 1];
    const newHistory = { ...get().history };
    newHistory[scopeId] = history.slice(0, -1);
    
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      return {
        ...scope,
        variables: previousState,
        updatedAt: new Date().toISOString(),
      };
    });
    
    storage.saveScopes(scopes);
    set({ scopes, history: newHistory });
    get().recomputeScope(scopeId);
  },
  
  addLine: (scopeId, expression, index) => {
    // Save current state to history
    const currentScope = get().scopes.find(s => s.id === scopeId);
    if (currentScope) {
      const history = get().history[scopeId] || [];
      const newHistory = { ...get().history };
      newHistory[scopeId] = [...history, currentScope.variables];
      set({ history: newHistory });
    }
    
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const { name, expr } = parseLine(expression);
      const newLine: VariableLine = {
        lineIndex: 0, // Will be updated below
        name,
        expression: expression.trim(), // Store full expression for display
        value: null,
        error: null,
        priority: 3,
        dependsOn: extractDependencies(expr),
      };
      
      // Insert at specified index, or append to end if not specified
      const insertIndex = index !== undefined ? index : scope.variables.length;
      const variables = [
        ...scope.variables.slice(0, insertIndex),
        newLine,
        ...scope.variables.slice(insertIndex)
      ].map((line, idx) => ({ ...line, lineIndex: idx }));
      
      return {
        ...scope,
        variables,
        updatedAt: new Date().toISOString(),
      };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    if (expression.trim()) {
      get().recomputeScope(scopeId);
    }
  },
  
  updateLine: (scopeId, lineIndex, expression) => {
    // Save current state to history
    const currentScope = get().scopes.find(s => s.id === scopeId);
    if (currentScope) {
      const history = get().history[scopeId] || [];
      const newHistory = { ...get().history };
      newHistory[scopeId] = [...history, currentScope.variables];
      set({ history: newHistory });
    }
    
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const { name, expr } = parseLine(expression);
      const variables = scope.variables.map((line, idx) =>
        idx === lineIndex
          ? { ...line, name, expression: expression.trim(), dependsOn: extractDependencies(expr) }
          : line
      );
      
      return { ...scope, variables, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    
    // Recompute with updated scopes (not from stale get())
    const updatedScope = scopes.find(s => s.id === scopeId);
    if (updatedScope) {
      const allFunctionSets = get().functionSets;
      const evaluatedLines = evaluateAllLines(updatedScope.variables, allFunctionSets);
      
      const finalScopes = scopes.map(scope =>
        scope.id === scopeId
          ? { ...scope, variables: evaluatedLines, updatedAt: new Date().toISOString() }
          : scope
      );
      
      storage.saveScopes(finalScopes);
      set({ scopes: finalScopes });
    }
  },
  
  deleteLine: (scopeId, lineIndex) => {
    // Save current state to history
    const currentScope = get().scopes.find(s => s.id === scopeId);
    if (currentScope) {
      const history = get().history[scopeId] || [];
      const newHistory = { ...get().history };
      newHistory[scopeId] = [...history, currentScope.variables];
      set({ history: newHistory });
    }
    
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      let variables = scope.variables.filter((_, idx) => idx !== lineIndex);
      
      // Ensure at least one empty line remains
      if (variables.length === 0) {
        variables = [{
          lineIndex: 0,
          name: null,
          expression: '',
          value: null,
          error: null,
          priority: 3,
          dependsOn: [],
        }];
      } else {
        variables = variables.map((line, idx) => ({ ...line, lineIndex: idx }));
      }
      
      return { ...scope, variables, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    get().recomputeScope(scopeId);
  },
  
  updateLinePriority: (scopeId, lineIndex, priority) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const variables = scope.variables.map((line, idx) =>
        idx === lineIndex ? { ...line, priority } : line
      );
      
      return { ...scope, variables, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
  },
  
  addFunctionSet: (name) => {
    const setId = `set-${Date.now()}-${Math.random()}`;
    const functionSets = get().functionSets;
    const colorTag = colorTags[functionSets.length % colorTags.length];
    
    const newSet: FunctionSet = {
      id: setId,
      name,
      code: `// Define your functions here\n// They will be accessible as ${name}.functionName()\n\nfunction min(a, b) {\n  return a < b ? a : b;\n}\n\nfunction max(a, b) {\n  return a > b ? a : b;\n}`,
      isSaved: false,
      colorTag,
      createdAt: new Date().toISOString(),
    };
    
    const updatedFunctionSets = [...functionSets, newSet];
    storage.saveFunctionSets(updatedFunctionSets);
    set({ functionSets: updatedFunctionSets });
    
    // Recompute all scopes
    get().scopes.forEach(scope => get().recomputeScope(scope.id));
    
    return setId;
  },
  
  updateFunctionSet: (setId, code) => {
    const functionSets = get().functionSets.map(set =>
      set.id === setId ? { ...set, code, isSaved: false } : set
    );
    
    storage.saveFunctionSets(functionSets);
    set({ functionSets });
    
    // Recompute all scopes
    get().scopes.forEach(scope => get().recomputeScope(scope.id));
  },
  
  saveFunctionSet: (setId) => {
    const functionSets = get().functionSets.map(set =>
      set.id === setId ? { ...set, isSaved: true } : set
    );
    
    storage.saveFunctionSets(functionSets);
    set({ functionSets });
  },
  
  renameFunctionSet: (setId, newName) => {
    const functionSets = get().functionSets.map(set =>
      set.id === setId ? { ...set, name: newName, isSaved: false } : set
    );
    
    storage.saveFunctionSets(functionSets);
    set({ functionSets });
  },
  
  deleteFunctionSet: (setId) => {
    const functionSets = get().functionSets.filter(set => set.id !== setId);
    
    storage.saveFunctionSets(functionSets);
    set({ functionSets });
    
    // Recompute all scopes
    get().scopes.forEach(scope => get().recomputeScope(scope.id));
  },
  
  recomputeScope: (scopeId) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const allFunctionSets = get().functionSets;
      const evaluatedLines = evaluateAllLines(scope.variables, allFunctionSets);
      
      return {
        ...scope,
        variables: evaluatedLines,
        updatedAt: new Date().toISOString(),
      };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
  },
}));
