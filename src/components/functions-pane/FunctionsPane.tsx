import React, { useState } from 'react';
import { useCalculatorStore } from '../../../state/store';
import { ChevronDown, ChevronRight, Save, Plus, Trash2 } from 'lucide-react';

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  purple: 'bg-purple-100 border-purple-300',
  orange: 'bg-orange-100 border-orange-300',
  pink: 'bg-pink-100 border-pink-300',
};

export function FunctionsPane() {
  const { scopes, activeScopeId, addFunction, updateFunction, saveFunction, toggleFunctionCollapse, deleteFunction } = useCalculatorStore();
  const [newFuncName, setNewFuncName] = useState('');
  
  const activeScope = scopes.find(s => s.id === activeScopeId);
  
  if (!activeScope) return null;
  
  const handleAddFunction = () => {
    if (newFuncName.trim() && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newFuncName.trim())) {
      addFunction(activeScope.id, newFuncName.trim());
      setNewFuncName('');
    }
  };
  
  return (
    <div className="w-96 border-l border-border p-4 overflow-auto">
      <h3 className="text-lg font-semibold mb-4">Functions</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newFuncName}
          onChange={(e) => setNewFuncName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddFunction()}
          placeholder="Function name..."
          className="flex-1 px-2 py-1 text-sm border border-input rounded"
        />
        <button
          onClick={handleAddFunction}
          className="p-1 bg-primary text-primary-foreground rounded hover:opacity-90"
          title="Add function"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        {activeScope.functions.map(fn => (
          <div
            key={fn.name}
            className={`border-2 rounded p-2 ${colorMap[fn.colorTag] || 'bg-gray-100 border-gray-300'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleFunctionCollapse(activeScope.id, fn.name)}
                className="flex items-center gap-1 flex-1 text-left font-mono text-sm font-semibold"
              >
                {fn.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                {fn.name}
                {!fn.isSaved && <span className="text-destructive">*</span>}
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => saveFunction(activeScope.id, fn.name)}
                  className="p-1 hover:bg-white/50 rounded"
                  title="Save function"
                  disabled={fn.isSaved}
                >
                  <Save size={14} className={fn.isSaved ? 'text-muted-foreground' : ''} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete function "${fn.name}"?`)) {
                      deleteFunction(activeScope.id, fn.name);
                    }
                  }}
                  className="p-1 hover:bg-white/50 rounded hover:text-destructive"
                  title="Delete function"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {!fn.isCollapsed && (
              <textarea
                value={fn.code}
                onChange={(e) => updateFunction(activeScope.id, fn.name, e.target.value)}
                className="w-full px-2 py-1 font-mono text-xs border border-input rounded bg-white"
                rows={6}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
