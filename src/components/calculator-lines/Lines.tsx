import React, { useState, useRef, useEffect } from 'react';
import { useCalculatorStore } from '../../../state/store';
import { Plus, Trash2 } from 'lucide-react';

export function CalculatorLines() {
  const { scopes, activeScopeId, addLine, updateLine, deleteLine } = useCalculatorStore();
  const [newLine, setNewLine] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const activeScope = scopes.find(s => s.id === activeScopeId);
  
  if (!activeScope) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No scope selected
      </div>
    );
  }
  
  const handleAddLine = () => {
    if (newLine.trim()) {
      addLine(activeScope.id, newLine);
      setNewLine('');
      inputRef.current?.focus();
    }
  };
  
  return (
    <div className="flex-1 p-6">
      <h2 className="text-xl font-semibold mb-4">{activeScope.name}</h2>
      
      <div className="space-y-2 mb-4">
        {activeScope.variables.map((line, idx) => (
          <div key={idx} className="flex items-start gap-2 group">
            <input
              type="text"
              value={line.expression}
              onChange={(e) => updateLine(activeScope.id, idx, e.target.value)}
              className="flex-1 px-3 py-2 border border-input rounded font-mono text-sm"
              placeholder="Enter expression..."
            />
            <div className={`px-3 py-2 border rounded text-sm w-32 ${
              line.error ? 'border-destructive text-destructive bg-destructive/10' : 'border-border bg-secondary'
            }`}>
              {line.error ? '⚠ ' + line.error : line.value !== null ? String(line.value) : '—'}
            </div>
            <button
              onClick={() => deleteLine(activeScope.id, idx)}
              className="opacity-0 group-hover:opacity-100 p-2 hover:text-destructive"
              title="Delete line"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newLine}
          onChange={(e) => setNewLine(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddLine()}
          placeholder="1+1 or a = 5"
          className="flex-1 px-3 py-2 border border-input rounded font-mono text-sm"
        />
        <button
          onClick={handleAddLine}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Line
        </button>
      </div>
    </div>
  );
}
