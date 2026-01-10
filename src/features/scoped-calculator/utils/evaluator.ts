import { VariableLine, FunctionDef } from '../state/types';
import { extractDependencies } from './parser';

interface EvalContext {
  [key: string]: any;
}

// Safe evaluator with user functions
export function evaluateLine(
  line: VariableLine,
  context: EvalContext,
  functions: FunctionDef[]
): { value: any; error: string | null } {
  try {
    // Build function context
    const funcContext = { ...context };
    
    functions.forEach(fn => {
      if (fn.isSaved) {
        try {
          // Create function from code
          const funcBody = fn.code.match(/function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*)\}/)?.[1] || fn.code;
          const argMatch = fn.code.match(/function\s+\w+\s*\(([^)]*)\)/);
          const args = argMatch ? argMatch[1].split(',').map(a => a.trim()).filter(Boolean) : [];
          
          funcContext[fn.name] = new Function(...args, funcBody);
        } catch (e) {
          // Skip broken functions
        }
      }
    });
    
    // Evaluate expression
    const func = new Function(...Object.keys(funcContext), `return (${line.expression});`);
    const result = func(...Object.values(funcContext));
    
    return { value: result, error: null };
  } catch (error) {
    return { value: null, error: (error as Error).message };
  }
}

// Batch evaluate with dependency order
export function evaluateAllLines(
  lines: VariableLine[],
  functions: FunctionDef[]
): VariableLine[] {
  const context: EvalContext = {};
  const results: VariableLine[] = [];
  
  for (const line of lines) {
    // Check dependencies exist
    const deps = extractDependencies(line.expression);
    const undefinedDeps = deps.filter(d => !(d in context) && !functions.some(f => f.name === d));
    
    if (undefinedDeps.length > 0) {
      results.push({
        ...line,
        value: null,
        error: `Undefined: ${undefinedDeps.join(', ')}`,
      });
      continue;
    }
    
    const { value, error } = evaluateLine(line, context, functions);
    
    const updatedLine = {
      ...line,
      value,
      error,
    };
    
    results.push(updatedLine);
    
    // Update context if it's an assignment
    if (line.name && !error) {
      context[line.name] = value;
    }
  }
  
  return results;
}
