import React, { useState, useEffect } from 'react';
import { useCalculatorStore } from '../../../state/store';
import { Plus, Trash2 } from 'lucide-react';

export function ScopeList() {
  const { scopes, activeScopeId, createScope, deleteScope, renameScope, setActiveScope } = useCalculatorStore();
  const [newScopeName, setNewScopeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const handleCreate = () => {
    if (newScopeName.trim()) {
      createScope(newScopeName.trim());
      setNewScopeName('');
    }
  };
  
  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameScope(id, editName.trim());
    }
    setEditingId(null);
  };
  
  return (
    <div className="w-64 bg-secondary border-r border-border p-4 flex flex-col h-screen">
      <h2 className="text-lg font-semibold mb-4">Scopes</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newScopeName}
          onChange={(e) => setNewScopeName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New scope..."
          className="flex-1 px-2 py-1 text-sm border border-input rounded"
        />
        <button
          onClick={handleCreate}
          className="p-1 bg-primary text-primary-foreground rounded hover:opacity-90"
          title="Create scope"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto space-y-1">
        {scopes.map(scope => (
          <div
            key={scope.id}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
              activeScopeId === scope.id ? 'bg-accent' : ''
            }`}
            onClick={() => setActiveScope(scope.id)}
          >
            {editingId === scope.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRename(scope.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(scope.id)}
                className="flex-1 px-1 text-sm border border-input rounded"
                autoFocus
              />
            ) : (
              <>
                <span
                  className="flex-1 text-sm truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(scope.id);
                    setEditName(scope.name);
                  }}
                >
                  {scope.name}
                </span>
                {scopes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete scope "${scope.name}"?`)) {
                        deleteScope(scope.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                    title="Delete scope"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
