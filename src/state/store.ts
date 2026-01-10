import { create } from 'zustand';
import { Scope, VariableLine, FunctionDef } from '../features/scoped-calculator/state/types';
import { storage } from '../utils/storage';
import { parseLine, extractDependencies } from '../features/scoped-calculator/utils/parser';
import { evaluateAllLines } from '../features/scoped-calculator/utils/evaluator';

interface CalculatorState {
  scopes: Scope[];
  activeScopeId: string | null;
  
  // Actions
  loadScopes: () => void;
  createScope: (name: string) => void;
  renameScope: (id: string, name: string) => void;
  deleteScope: (id: string) => void;
  setActiveScope: (id: string) => void;
  
  // Lines
  addLine: (scopeId: string, expression: string) => void;
  updateLine: (scopeId: string, lineIndex: number, expression: string) => void;
  deleteLine: (scopeId: string, lineIndex: number) => void;
  
  // Functions
  addFunction: (scopeId: string, name: string) => void;
  updateFunction: (scopeId: string, name: string, code: string) => void;
  saveFunction: (scopeId: string, name: string) => void;
  toggleFunctionCollapse: (scopeId: string, name: string) => void;
  deleteFunction: (scopeId: string, name: string) => void;
  
  // Recompute
  recomputeScope: (scopeId: string) => void;
}

const colorTags = ['blue', 'green', 'purple', 'orange', 'pink'];

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  scopes: [],
  activeScopeId: null,
  
  loadScopes: () => {
    const scopes = storage.getScopes();
    set({ scopes, activeScopeId: scopes.length > 0 ? scopes[0].id : null });
  },
  
  createScope: (name) => {
    const newScope: Scope = {
      id: `scope-${Date.now()}-${Math.random()}`,
      name,
      variables: [],
      functions: [],
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
  
  addLine: (scopeId, expression) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const { name, expr } = parseLine(expression);
      const newLine: VariableLine = {
        lineIndex: scope.variables.length,
        name,
        expression: expr,
        value: null,
        error: null,
        dependsOn: extractDependencies(expr),
      };
      
      return {
        ...scope,
        variables: [...scope.variables, newLine],
        updatedAt: new Date().toISOString(),
      };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    get().recomputeScope(scopeId);
  },
  
  updateLine: (scopeId, lineIndex, expression) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const { name, expr } = parseLine(expression);
      const variables = scope.variables.map((line, idx) =>
        idx === lineIndex
          ? { ...line, name, expression: expr, dependsOn: extractDependencies(expr) }
          : line
      );
      
      return { ...scope, variables, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    get().recomputeScope(scopeId);
  },
  
  deleteLine: (scopeId, lineIndex) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const variables = scope.variables
        .filter((_, idx) => idx !== lineIndex)
        .map((line, idx) => ({ ...line, lineIndex: idx }));
      
      return { ...scope, variables, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    get().recomputeScope(scopeId);
  },
  
  addFunction: (scopeId, name) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const colorTag = colorTags[scope.functions.length % colorTags.length];
      const newFunc: FunctionDef = {
        name,
        code: `function ${name}(a, b) {\n  return a + b;\n}`,
        isSaved: false,
        isCollapsed: false,
        colorTag,
      };
      
      return {
        ...scope,
        functions: [...scope.functions, newFunc],
        updatedAt: new Date().toISOString(),
      };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
  },
  
  updateFunction: (scopeId, name, code) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const functions = scope.functions.map(fn =>
        fn.name === name ? { ...fn, code, isSaved: false } : fn
      );
      
      return { ...scope, functions, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
  },
  
  saveFunction: (scopeId, name) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const functions = scope.functions.map(fn =>
        fn.name === name ? { ...fn, isSaved: true } : fn
      );
      
      return { ...scope, functions, updatedAt: new Date().toISOString() };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    get().recomputeScope(scopeId);
  },
  
  toggleFunctionCollapse: (scopeId, name) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const functions = scope.functions.map(fn =>
        fn.name === name ? { ...fn, isCollapsed: !fn.isCollapsed } : fn
      );
      
      return { ...scope, functions };
    });
    
    set({ scopes });
  },
  
  deleteFunction: (scopeId, name) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      return {
        ...scope,
        functions: scope.functions.filter(fn => fn.name !== name),
        updatedAt: new Date().toISOString(),
      };
    });
    
    storage.saveScopes(scopes);
    set({ scopes });
    get().recomputeScope(scopeId);
  },
  
  recomputeScope: (scopeId) => {
    const scopes = get().scopes.map(scope => {
      if (scope.id !== scopeId) return scope;
      
      const evaluatedLines = evaluateAllLines(scope.variables, scope.functions);
      
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
