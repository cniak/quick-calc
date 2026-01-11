import React, { useEffect, useRef } from 'react';
import type { FunctionSet } from '@/features/scoped-calculator/state/types';

interface AutocompleteProps {
  show: boolean;
  position: { top: number; left: number };
  items: string[];
  selectedIndex: number;
  onSelect: (item: string) => void;
  onClose: () => void;
}

export function Autocomplete({ show, position, items, selectedIndex, onSelect, onClose }: AutocompleteProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!show) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose]);
  
  if (!show || items.length === 0) return null;
  
  return (
    <div
      ref={ref}
      className="fixed z-50 border border-border rounded shadow-lg max-h-48 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '200px',
        backgroundColor: 'hsl(217 19% 11%)', // Solid background matching app background
      }}
    >
      {items.map((item, idx) => (
        <div
          key={item}
          className={`px-3 py-1.5 cursor-pointer font-mono text-sm ${
            idx === selectedIndex 
              ? 'bg-blue-500 text-white font-semibold' 
              : 'hover:bg-accent text-foreground'
          }`}
          style={idx !== selectedIndex ? { backgroundColor: 'hsl(217 19% 11%)' } : undefined}
          onClick={() => onSelect(item)}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

interface AutocompleteState {
  show: boolean;
  mode: 'sets' | 'methods' | 'variables';
  selectedSet: string | null;
  items: string[];
  selectedIndex: number;
  position: { top: number; left: number };
  triggerPos: number; // Position in the input where @ was typed
  userClosed: boolean; // Track if user explicitly closed with ESC
}

export function useAutocomplete(
  functionSets: FunctionSet[],
  inputRef: { current: HTMLInputElement | null },
  value: string,
  onInsert: (text: string, startPos: number, endPos: number) => void,
  availableVariables: string[] = []
) {
  const [state, setState] = React.useState<AutocompleteState>({
    show: false,
    mode: 'sets',
    selectedSet: null,
    items: [],
    selectedIndex: 0,
    position: { top: 0, left: 0 },
    triggerPos: 0,
    userClosed: false,
  });
  
  // Extract functions from a function set code
  const extractFunctions = (code: string): string[] => {
    const functionRegex = /function\s+(\w+)\s*\(/g;
    const functions: string[] = [];
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    return functions;
  };
  
  // Update autocomplete when value changes
  useEffect(() => {
    if (!inputRef.current) return;
    
    const cursorPos = inputRef.current.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    
    // Close autocomplete if input is empty
    if (!textBeforeCursor.trim()) {
      if (state.show) {
        setState(prev => ({ ...prev, show: false }));
      }
      return;
    }
    
    // Don't show autocomplete if user explicitly closed it
    if (state.userClosed) {
      return;
    }
    
    // Check if we just typed @
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const setPrefix = atMatch[1];
      const availableSets = functionSets
        .map(s => s.name)
        .filter(name => name.startsWith(setPrefix));
      
      // Calculate position for dropdown
      const rect = inputRef.current.getBoundingClientRect();
      const position = {
        top: rect.bottom + window.scrollY + 2,
        left: rect.left + window.scrollX,
      };
      
      setState({
        show: availableSets.length > 0,
        mode: 'sets',
        selectedSet: null,
        items: availableSets,
        selectedIndex: 0,
        position,
        triggerPos: cursorPos - atMatch[0].length,
        userClosed: false,
      });
      return;
    }
    
    // Check if we're after a set name and dot
    const setMethodMatch = textBeforeCursor.match(/@(\w+)\.(\w*)$/);
    
    if (setMethodMatch) {
      const setName = setMethodMatch[1];
      const methodPrefix = setMethodMatch[2];
      const functionSet = functionSets.find(s => s.name === setName);
      
      if (functionSet) {
        const methods = extractFunctions(functionSet.code)
          .filter(m => m.startsWith(methodPrefix));
        
        // Calculate position for dropdown
        const rect = inputRef.current.getBoundingClientRect();
        const position = {
          top: rect.bottom + window.scrollY + 2,
          left: rect.left + window.scrollX,
        };
        
        setState({
          show: methods.length > 0,
          mode: 'methods',
          selectedSet: setName,
          items: methods,
          selectedIndex: 0,
          position,
          triggerPos: cursorPos - setMethodMatch[0].length,
          userClosed: false,
        });
        return;
      }
    }
    
    // Check for variable autocomplete - trigger when typing a letter that's not after @ or after an operator
    // Only trigger if we're at the start of a word and not in a function set context
    const variableMatch = textBeforeCursor.match(/(?:^|[+\-*/%=(\s])([a-zA-Z_]\w*)$/);
    
    if (variableMatch && availableVariables.length > 0) {
      const prefix = variableMatch[1];
      const matchingVars = availableVariables.filter(v => v.startsWith(prefix));
      
      // Only show autocomplete if:
      // 1. There are matching variables
      // 2. The prefix is not an exact match to any variable (smart behavior)
      const hasExactMatch = matchingVars.some(v => v === prefix);
      
      if (matchingVars.length > 0 && !hasExactMatch) {
        // Calculate position for dropdown
        const rect = inputRef.current.getBoundingClientRect();
        const position = {
          top: rect.bottom + window.scrollY + 2,
          left: rect.left + window.scrollX,
        };
        
        setState({
          show: true,
          mode: 'variables',
          selectedSet: null,
          items: matchingVars,
          selectedIndex: 0,
          position,
          triggerPos: cursorPos - prefix.length,
          userClosed: false,
        });
        return;
      }
    }
    
    // Close autocomplete if no match
    if (state.show) {
      setState(prev => ({ ...prev, show: false }));
    }
  }, [value, inputRef, functionSets, availableVariables]);
  
  const handleSelect = (item: string) => {
    if (!inputRef.current) return;
    
    // Get current value and cursor position from the input directly
    const currentValue = inputRef.current.value;
    const cursorPos = inputRef.current.selectionStart || 0;
    const textBeforeCursor = currentValue.substring(0, cursorPos);
    
    if (state.mode === 'sets') {
      // Find where @ starts
      const atMatch = textBeforeCursor.match(/@(\w*)$/);
      if (!atMatch) return;
      
      const startPos = cursorPos - atMatch[0].length;
      
      // Insert set name and dot
      const newValue = 
        currentValue.substring(0, startPos) + 
        `@${item}.` + 
        currentValue.substring(cursorPos);
      
      const newCursorPos = startPos + 1 + item.length + 1; // After the dot
      onInsert(newValue, startPos, newCursorPos);
      
      // Don't close, let it transition to methods mode
    } else if (state.mode === 'methods') {
      // Find where @setName.method starts
      const setMethodMatch = textBeforeCursor.match(/@(\w+)\.(\w*)$/);
      if (!setMethodMatch) return;
      
      const startPos = cursorPos - setMethodMatch[0].length;
      const setName = setMethodMatch[1];
      
      // Insert full @setName.method() syntax
      const newValue = 
        currentValue.substring(0, startPos) + 
        `@${setName}.${item}()` + 
        currentValue.substring(cursorPos);
      
      // Position cursor inside the parentheses: @setName.method(|)
      const newCursorPos = startPos + 1 + setName.length + 1 + item.length + 1;
      onInsert(newValue, startPos, newCursorPos);
      
      setState(prev => ({ ...prev, show: false }));
    } else if (state.mode === 'variables') {
      // Find where the variable name starts
      const variableMatch = textBeforeCursor.match(/(?:^|[+\-*/%=(\s])([a-zA-Z_]\w*)$/);
      if (!variableMatch) return;
      
      const startPos = cursorPos - variableMatch[1].length;
      
      // Insert variable name
      const newValue = 
        currentValue.substring(0, startPos) + 
        item + 
        currentValue.substring(cursorPos);
      
      const newCursorPos = startPos + item.length;
      onInsert(newValue, startPos, newCursorPos);
      
      setState(prev => ({ ...prev, show: false }));
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!state.show) return false;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % prev.items.length,
      }));
      return true;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        selectedIndex: (prev.selectedIndex - 1 + prev.items.length) % prev.items.length,
      }));
      return true;
    }
    
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleSelect(state.items[state.selectedIndex]);
      return true;
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setState(prev => ({ ...prev, show: false, userClosed: true }));
      // Keep focus on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return true;
    }
    
    return false;
  };
  
  const handleClose = () => {
    setState(prev => ({ ...prev, show: false }));
  };
  
  return {
    autocomplete: {
      show: state.show,
      items: state.items,
      selectedIndex: state.selectedIndex,
      position: state.position,
      onSelect: handleSelect,
      onClose: handleClose,
    },
    handleKeyDown,
  };
}
