// Parse a line: detect assignments vs expressions
export function parseLine(expression: string): { name: string | null; expr: string } {
  const trimmed = expression.trim();
  const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  
  if (assignMatch) {
    return { name: assignMatch[1], expr: assignMatch[2] };
  }
  
  return { name: null, expr: trimmed };
}

// Extract variable names and function set names from an expression
export function extractDependencies(expr: string): string[] {
  // Remove @setName.method() patterns and extract just the set names
  const setMatches = expr.match(/@(\w+)\.\w+/g) || [];
  const setNames = setMatches.map(m => m.match(/@(\w+)\./)?.[1]).filter(Boolean) as string[];
  
  // Create a cleaned expression by removing @setName.method() patterns entirely
  // This prevents extracting method names (like "max" from "@test.max") as dependencies
  let cleanedExpr = expr;
  setMatches.forEach(match => {
    // Replace @setName.method with a placeholder to avoid extracting "method" as a dependency
    cleanedExpr = cleanedExpr.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  });
  
  // Extract regular identifiers from the cleaned expression
  const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const matches = cleanedExpr.match(identifierRegex) || [];
  
  // Filter out JS keywords
  const keywords = new Set(['if', 'else', 'for', 'while', 'function', 'return', 'true', 'false', 'null', 'undefined', 'const', 'let', 'var']);
  
  const regularDeps = matches.filter(m => !keywords.has(m));
  
  return Array.from(new Set([...setNames, ...regularDeps]));
}

// Validate variable name
export function isValidVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
