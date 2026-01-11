import React, { useState, useRef, useEffect } from 'react';
import { useCalculatorStore } from '@/state/store';
import { Trash2 } from 'lucide-react';
import { tokenize, renderHighlightedTokens } from '@/features/scoped-calculator/utils/syntax-highlighter';
import { Autocomplete, useAutocomplete } from './Autocomplete';
import { FunctionSet, VariableLine } from '@/features/scoped-calculator/state/types';

// Format numbers with thousand separators (space)
function formatNumber(value: number | string | boolean | null): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value;
  
  // Handle numbers
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  // Check if it's an integer
  if (Number.isInteger(num)) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  
  // For decimals, format the integer part only
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

// Format expression with spaces around operators
function formatExpression(value: string): string {
  // Add spaces around operators: + - * / % = (excluding parentheses)
  // Also add space after commas
  return value
    .replace(/([+\-*/%=])/g, ' $1 ')
    .replace(/\*\s+\*/g, '**')  // Fix ** operator
    .replace(/,/g, ', ')         // Add space after commas
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .replace(/\s+\)/g, ')')      // Remove spaces before closing parenthesis
    .replace(/\(\s+/g, '(')      // Remove spaces after opening parenthesis
    .trim();
}

interface LineProps {
  line: VariableLine;
  idx: number;
  scopeId: string;
  functionSets: FunctionSet[];
  onUpdate: (scopeId: string, idx: number, value: string) => void;
  onDelete: (scopeId: string, idx: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  isFirstError: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  availableVariables: string[];
}

function Line({ 
  line, 
  idx, 
  scopeId, 
  functionSets, 
  onUpdate, 
  onDelete, 
  onKeyDown, 
  focused, 
  onFocus, 
  onBlur, 
  isFirstError,
  inputRef,
  availableVariables
}: LineProps) {
  const inputRefObj = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    inputRef(inputRefObj.current);
  }, [inputRef]);
  
  // Check if result is obvious (simple assignment with literal value)
  const isObviousResult = () => {
    if (line.error || line.value === null) return false;
    
    // Check if expression is like "varName = literalValue"
    const assignmentMatch = line.expression.match(/^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (!assignmentMatch) return false;
    
    const rightSide = assignmentMatch[2].trim();
    
    // Check if right side is a simple number literal
    const numericMatch = rightSide.match(/^-?\d+(\.\d+)?$/);
    if (numericMatch) {
      const literalValue = parseFloat(rightSide);
      return Math.abs(literalValue - Number(line.value)) < 0.0001;
    }
    
    return false;
  };
  
  const autocompleteResult = useAutocomplete(
    functionSets,
    inputRefObj,
    line.expression,
    (newValue, _startPos, endPos) => {
      // Format the value and adjust cursor position
      const formatted = formatExpression(newValue);
      const cursorAdjustment = formatted.length - newValue.length;
      
      onUpdate(scopeId, idx, formatted);
      setTimeout(() => {
        if (inputRefObj.current) {
          inputRefObj.current.selectionStart = inputRefObj.current.selectionEnd = endPos + cursorAdjustment;
        }
      }, 0);
    },
    availableVariables
  );

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (autocompleteResult.handleKeyDown(e)) {
      return;
    }
    
    const input = inputRefObj.current;
    if (!input) return;
    
    const cursorPos = input.selectionStart || 0;
    const currentValue = input.value;
    
    // Smart parenthesis handling
    if (e.key === '(') {
      e.preventDefault();
      // Insert () and position cursor between them
      const newValue = currentValue.substring(0, cursorPos) + '()' + currentValue.substring(cursorPos);
      const formatted = formatExpression(newValue);
      const beforeCursor = newValue.substring(0, cursorPos + 1);
      const formattedBeforeCursor = formatExpression(beforeCursor);
      const newCursorPos = formattedBeforeCursor.length;
      
      onUpdate(scopeId, idx, formatted);
      setTimeout(() => {
        if (input) {
          input.selectionStart = input.selectionEnd = newCursorPos;
        }
      }, 0);
      return;
    }
    
    if (e.key === ')') {
      // Check if next character is already )
      if (currentValue[cursorPos] === ')') {
        e.preventDefault();
        // Just move cursor past the existing )
        setTimeout(() => {
          if (input) {
            input.selectionStart = input.selectionEnd = cursorPos + 1;
          }
        }, 0);
        return;
      }
    }
    
    onKeyDown(e, idx);
  };

  return (
    <div className="flex items-center gap-0 py-0.5 hover:bg-secondary/50 group">
      <span className={`select-none w-12 text-right text-base font-medium mr-2 pr-2 ${
        focused 
          ? 'text-blue-500' 
          : 'text-muted-foreground/60'
      }`}>{idx + 1}</span>
      <div className="flex items-center gap-2 flex-1 cursor-text" onClick={() => inputRefObj.current?.focus()}>
        <div className="relative flex items-center min-w-[10ch]">
          <div className="absolute inset-0 pointer-events-none whitespace-pre">
            {line.expression ? renderHighlightedTokens(tokenize(line.expression)) : ''}
          </div>
          <input
            ref={inputRefObj}
            type="text"
            value={line.expression}
            onChange={(e) => {
              const cursorPos = e.target.selectionStart || 0;
              const oldValue = e.target.value;
              const formatted = formatExpression(oldValue);
              
              // Calculate new cursor position after formatting
              const beforeCursor = oldValue.substring(0, cursorPos);
              const formattedBeforeCursor = formatExpression(beforeCursor);
              const newCursorPos = formattedBeforeCursor.length;
              
              onUpdate(scopeId, idx, formatted);
              
              // Restore cursor position after formatting
              setTimeout(() => {
                if (inputRefObj.current) {
                  inputRefObj.current.selectionStart = inputRefObj.current.selectionEnd = newCursorPos;
                }
              }, 0);
            }}
            onKeyDown={handleKeyDownInternal}
            onFocus={onFocus}
            onBlur={onBlur}
            className="bg-transparent border-none outline-none text-transparent caret-foreground relative"
            style={{ width: `${Math.max(line.expression.length, 10)}ch` }}
          />
          {autocompleteResult.autocomplete && (
            <Autocomplete
              show={autocompleteResult.autocomplete.show}
              position={autocompleteResult.autocomplete.position}
              items={autocompleteResult.autocomplete.items}
              selectedIndex={autocompleteResult.autocomplete.selectedIndex}
              onSelect={autocompleteResult.autocomplete.onSelect}
              onClose={autocompleteResult.autocomplete.onClose}
            />
          )}
        </div>
        <span 
          className={`text-lg whitespace-nowrap font-semibold px-2 py-0.5 rounded ${
            line.error 
              ? (isFirstError ? 'text-red-500 bg-red-500/10' : 'text-red-600/80 bg-red-500/5')
              : line.value !== null && !isObviousResult() ? 'text-emerald-500 bg-emerald-500/10' : ''
          }`}
        >
          {line.error ? `// ${line.error}` : (line.value !== null && !isObviousResult()) ? `// ${formatNumber(line.value)}` : ''}
        </span>
      </div>
      <button
        onClick={() => onDelete(scopeId, idx)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive ml-auto transition-opacity"
        title="Delete line (or press Backspace on empty line)"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export function CalculatorLines() {
  const { scopes, activeScopeId, functionSets, addLine, updateLine, deleteLine, undo } = useCalculatorStore();
  const [focusedLineIdx, setFocusedLineIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const activeScope = scopes.find(s => s.id === activeScopeId);
  
  // Find first error index in current scope
  const firstErrorIdx = activeScope?.variables.findIndex(line => line.error) ?? -1;
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && activeScopeId) {
        e.preventDefault();
        undo(activeScopeId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScopeId, undo]);
  
  // Focus last line when scope changes or focus-last-line event is triggered
  useEffect(() => {
    const handleFocusLastLine = () => {
      if (activeScope && inputRefs.current.length > 0) {
        const lastIdx = activeScope.variables.length - 1;
        setTimeout(() => {
          inputRefs.current[lastIdx]?.focus();
        }, 100);
      }
    };
    
    window.addEventListener('focus-last-line', handleFocusLastLine);
    return () => window.removeEventListener('focus-last-line', handleFocusLastLine);
  }, [activeScope]);
  
  if (!activeScope) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No scope selected
      </div>
    );
  }
  
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const currentValue = activeScope.variables[idx].expression;
    
    // Ctrl+Delete: Delete current line
    if (e.ctrlKey && e.key === 'Delete') {
      e.preventDefault();
      deleteLine(activeScope.id, idx);
      // Focus on the same index (which will be the next line after deletion)
      setTimeout(() => {
        if (idx < activeScope.variables.length - 1) {
          // There's a line after this one, focus on current index
          inputRefs.current[idx]?.focus();
        } else if (idx > 0) {
          // This was the last line, focus on previous
          inputRefs.current[idx - 1]?.focus();
        }
        // If this was the only line, do nothing (keep at least one empty line)
      }, 0);
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      // Insert a new line below the current one
      addLine(activeScope.id, '', idx + 1);
      // Focus on the newly added line after a short delay
      setTimeout(() => {
        inputRefs.current[idx + 1]?.focus();
      }, 0);
    } else if ((e.key === 'Backspace' || e.key === 'Delete') && currentValue === '') {
      e.preventDefault();
      // Delete the current line if it's empty
      deleteLine(activeScope.id, idx);
      // Focus on the same index (which will be the next line after deletion)
      setTimeout(() => {
        if (idx < activeScope.variables.length - 1) {
          // There's a line after this one, focus on current index
          inputRefs.current[idx]?.focus();
        } else if (idx > 0) {
          // This was the last line, focus on previous
          inputRefs.current[idx - 1]?.focus();
        }
        // If this was the only line, do nothing (keep at least one empty line)
      }, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < activeScope.variables.length - 1) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };
  
  const hasContent = activeScope.variables.some(line => line.expression.trim());
  
  // Calculate total sum of all line values
  const totalSum = activeScope.variables.reduce((sum, line) => {
    if (line.value !== null && typeof line.value === 'number' && !line.error) {
      return sum + line.value;
    }
    return sum;
  }, 0);
  
  return (
    <div className="flex-1 flex flex-col bg-background font-mono text-xl overflow-hidden">
      <div 
        className="flex-1 overflow-y-auto px-4 py-2 pb-20 relative cursor-text"
        onClick={(e) => {
          // Focus last line if clicking anywhere except on input, button, or interactive elements
          const target = e.target as HTMLElement;
          if (!target.closest('input, button') && activeScope.variables.length > 0) {
            inputRefs.current[activeScope.variables.length - 1]?.focus();
          }
        }}
      >
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-muted-foreground/40 text-base space-y-2 max-w-md">
              <div className="text-center mb-4">
                <p className="text-2xl mb-2">✨ Start calculating</p>
                <p className="text-sm">Type expressions or assign variables</p>
              </div>
              <div className="text-center text-sm mt-4 text-muted-foreground/40 space-y-1">
                <div>⌨️ <kbd className="px-1.5 py-1 bg-secondary/50 rounded text-sm">Enter</kbd> new line</div>
                <div>⌨️ <kbd className="px-1.5 py-1 bg-secondary/50 rounded text-sm">Ctrl+Z</kbd> undo</div>
                <div>⌨️ <kbd className="px-1.5 py-1 bg-secondary/50 rounded text-sm">Ctrl+Space</kbd> quick actions</div>
              </div>
            </div>
          </div>
        )}
        {activeScope.variables.map((line, idx) => {
          // Get available variables from lines above the current line
          const availableVariables = activeScope.variables
            .slice(0, idx)
            .map(l => {
              // Extract variable name from expressions like "varName = ..."
              const match = l.expression.match(/^\s*([a-zA-Z_]\w*)\s*=/);
              return match ? match[1] : null;
            })
            .filter((v): v is string => v !== null);
          
          return (
            <Line
              key={idx}
              line={line}
              idx={idx}
              scopeId={activeScope.id}
              functionSets={functionSets}
              onUpdate={updateLine}
              onDelete={deleteLine}
              onKeyDown={handleKeyDown}
              focused={focusedLineIdx === idx}
              onFocus={() => setFocusedLineIdx(idx)}
              onBlur={() => setFocusedLineIdx(null)}
              isFirstError={idx === firstErrorIdx}
              inputRef={(el) => { inputRefs.current[idx] = el; }}
              availableVariables={availableVariables}
            />
          );
        })}
        
        {/* Summary line showing total sum */}
        {hasContent && (
          <div className="flex items-center gap-2 py-2 mt-4 pl-4 relative z-0">
            <span className="text-muted-foreground/30 font-medium">total =</span>
            <span className="text-sm font-semibold px-2 py-0.5 rounded text-muted-foreground/80 bg-muted/30">
              {formatNumber(totalSum)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
