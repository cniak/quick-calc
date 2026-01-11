import type { VariableLine, FunctionSet } from '@/features/scoped-calculator/state/types';
import { extractDependencies } from './parser';

interface EvalContext {
  [key: string]: any;
}

// Extract functions from function set code
function extractFunctionsFromSet(code: string): { [name: string]: Function } {
  const functions: { [name: string]: Function } = {};
  
  // Match function definitions with improved regex
  const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
  let match;
  
  while ((match = functionRegex.exec(code)) !== null) {
    const [, name, params, body] = match;
    try {
      const args = params.split(',').map(a => a.trim()).filter(Boolean);
      const cleanBody = body.trim();
      functions[name] = new Function(...args, cleanBody);
    } catch (e) {
      console.error(`Failed to parse function ${name}:`, e);
    }
  }
  
  return functions;
}

// Safe evaluator with user function sets
export function evaluateLine(
  line: VariableLine,
  context: EvalContext,
  functionSets: FunctionSet[]
): { value: any; error: string | null } {
  console.log('========================================');
  console.log('🔍 EVALUATING:', line.expression);
  console.log('📦 Function sets count:', functionSets.length);
  
  try {
    const funcContext = { ...context };
    
    if (functionSets.length === 0) {
      console.warn('⚠️ NO FUNCTION SETS AVAILABLE!');
    }
    
    functionSets.forEach((set, i) => {
      console.log(`\n--- Processing set ${i + 1}: "${set.name}" ---`);
      console.log('Code preview:', set.code.substring(0, 80) + '...');
      
      try {
        const functions = extractFunctionsFromSet(set.code);
        console.log('Extracted functions:', Object.keys(functions));
        
        if (Object.keys(functions).length > 0) {
          funcContext[set.name] = functions;
          console.log(`✅ Added "${set.name}" to context`);
        } else {
          console.warn(`⚠️ No functions extracted from "${set.name}"`);
        }
      } catch (e) {
        console.error(`❌ Error in set "${set.name}":`, e);
      }
    });
    
    console.log('\n📋 Final context keys:', Object.keys(funcContext));
    
    let exprToEval = line.name ? line.expression.split('=')[1].trim() : line.expression.trim();
    console.log('📝 Original:', exprToEval);
    
    exprToEval = exprToEval.replace(/@/g, '');
    console.log('📝 After @ removal:', exprToEval);
    
    const func = new Function(...Object.keys(funcContext), `return (${exprToEval});`);
    console.log('🚀 Calling function with context:', Object.keys(funcContext));
    
    const result = func(...Object.values(funcContext));
    console.log('✅ SUCCESS! Result:', result);
    console.log('========================================\n');
    
    return { value: result, error: null };
  } catch (error) {
    console.error('❌ EVALUATION ERROR:', error);
    console.log('========================================\n');
    return { value: null, error: (error as Error).message };
  }
}

// Batch evaluate with dependency order
export function evaluateAllLines(
  lines: VariableLine[],
  functionSets: FunctionSet[]
): VariableLine[] {
  const context: EvalContext = {};
  const results: VariableLine[] = [];
  
  // Build set names for dependency checking
  const setNames = functionSets.map(s => s.name);
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.expression.trim()) {
      results.push({
        ...line,
        value: null,
        error: null,
      });
      continue;
    }
    
    // Extract just the right-hand side for dependency checking
    const exprToCheck = line.name ? line.expression.split('=')[1]?.trim() || line.expression : line.expression;
    
    // Check dependencies exist
    const deps = extractDependencies(exprToCheck);
    const undefinedDeps = deps.filter(d => !(d in context) && !setNames.includes(d));
    
    if (undefinedDeps.length > 0) {
      results.push({
        ...line,
        value: null,
        error: `Undefined: ${undefinedDeps.join(', ')}`,
      });
      continue;
    }
    
    const { value, error } = evaluateLine(line, context, functionSets);
    
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
