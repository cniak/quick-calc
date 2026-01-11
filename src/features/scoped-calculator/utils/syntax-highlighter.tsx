import React from 'react';

export interface Token {
  type: 'number' | 'variable' | 'operator' | 'assignment' | 'function' | 'functionSet' | 'paren' | 'comma' | 'whitespace';
  value: string;
}

export function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0
  
  while (i < expression.length) {
    const char = expression[i];
    
    // Whitespace
    if (/\s/.test(char)) {
      tokens.push({ type: 'whitespace', value: char });
      i++;
      continue;
    }
    
    // Numbers (including decimals)
    if (/\d/.test(char)) {
      let num = '';
      while (i < expression.length && /[\d.]/.test(expression[i])) {
        num += expression[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // Assignment operator
    if (char === '=') {
      tokens.push({ type: 'assignment', value: char });
      i++;
      continue;
    }
    
    // Operators
    if (/[+\-*\/^%]/.test(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }
    
    // Parentheses
    if (/[(){}]/.test(char)) {
      tokens.push({ type: 'paren', value: char });
      i++;
      continue;
    }
    
    // Comma
    if (char === ',') {
      tokens.push({ type: 'comma', value: char });
      i++;
      continue;
    }
    
    // @ symbol for function sets
    if (char === '@') {
      let name = '@';
      i++;
      // Capture the function set name after @
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        name += expression[i];
        i++;
      }
      tokens.push({ type: 'functionSet', value: name });
      continue;
    }
    
    // Variables and functions (must start with letter or underscore)
    if (/[a-zA-Z_]/.test(char)) {
      let name = '';
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        name += expression[i];
        i++;
      }
      
      // Check if followed by '(' to determine if it's a function
      const nextNonSpace = expression.slice(i).match(/^\s*\(/);
      const type = nextNonSpace ? 'function' : 'variable';
      
      tokens.push({ type, value: name });
      continue;
    }
    
    // Unknown character, treat as operator
    tokens.push({ type: 'operator', value: char });
    i++;
  }
  
  return tokens;
}

export function renderHighlightedTokens(tokens: Token[]): React.ReactNode {
  return tokens.map((token, idx) => {
    let className = '';
    
    switch (token.type) {
      case 'number':
        className = 'text-emerald-400';
        break;
      case 'variable':
        className = 'text-blue-300';
        break;
      case 'operator':
        className = 'text-foreground';
        break;
      case 'assignment':
        className = 'text-pink-400';
        break;
      case 'function':
        className = 'text-yellow-300';
        break;
      case 'functionSet':
        className = 'text-purple-400 font-semibold';
        break;
      case 'paren':
        className = 'text-gray-400';
        break;
      case 'comma':
        className = 'text-gray-400';
        break;
      case 'whitespace':
        return <span key={idx}>{token.value}</span>;
    }
    
    return (
      <span key={idx} className={className}>
        {token.value}
      </span>
    );
  });
}
