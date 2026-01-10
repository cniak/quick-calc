import { VariableLine } from '../features/scoped-calculator/state/types';

// Parse a line: detect assignments vs expressions
export function parseLine(expression: string): { name: string | null; expr: string } {
  const trimmed = expression.trim();
  const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  
  if (assignMatch) {
    return { name: assignMatch[1], expr: assignMatch[2] };
  }
  
  return { name: null, expr: trimmed };
}

// Extract variable names from an expression
export function extractDependencies(expr: string): string[] {
  const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const matches = expr.match(identifierRegex) || [];
  
  // Filter out JS keywords
  const keywords = new Set(['if', 'else', 'for', 'while', 'function', 'return', 'true', 'false', 'null', 'undefined', 'const', 'let', 'var']);
  
  return Array.from(new Set(matches.filter(m => !keywords.has(m))));
}

// Validate variable name
export function isValidVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
