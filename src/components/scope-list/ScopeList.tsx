import { useState, useEffect, useRef } from 'react';
import { useCalculatorStore } from '@/state/store';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog/ConfirmationDialog';

export function ScopeList() {
  const { scopes, activeScopeId, createScope, deleteScope, renameScope, setActiveScope } = useCalculatorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Listen for focus event from function sets
  useEffect(() => {
    const handleFocusActiveScope = () => {
      containerRef.current?.focus();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        // Trigger focus on first function set
        window.dispatchEvent(new CustomEvent('focus-first-function-set'));
      }
    };
    
    window.addEventListener('focus-active-scope', handleFocusActiveScope);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('focus-active-scope', handleFocusActiveScope);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Check if a scope has errors
  const hasErrors = (scopeId: string) => {
    const scope = scopes.find(s => s.id === scopeId);
    return scope?.variables.some(line => line.error) ?? false;
  };
  const [newScopeName, setNewScopeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const handleCreate = () => {
    if (newScopeName.trim()) {
      createScope(newScopeName.trim());
      setNewScopeName('');
      setShowNewInput(false);
    }
  };
  
  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameScope(id, editName.trim());
    }
    setEditingId(null);
  };
  
  return (
    <>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        variant="danger"
        confirmLabel="Delete"
      />
      <div 
        ref={containerRef}
        className="flex items-center gap-1 bg-secondary border-b border-border px-2 py-1"
        tabIndex={0}
      >
      {scopes.map(scope => (
        <div
          key={scope.id}
          className={`group flex items-center gap-2 px-4 py-2 rounded-t text-xl cursor-pointer relative ${
            activeScopeId === scope.id 
              ? 'bg-background' 
              : 'bg-secondary hover:bg-accent'
          }`}
          onClick={() => setActiveScope(scope.id)}
        >
          {activeScopeId === scope.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
          {editingId === scope.id ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleRename(scope.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(scope.id)}
              className="w-32 px-2 py-0.5 text-sm border border-input rounded bg-background"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span
                className={`truncate font-medium ${
                  hasErrors(scope.id) ? 'text-red-500' : 'text-green-500'
                }`}
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
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Delete Scope',
                      message: `Delete scope "${scope.name}"? This cannot be undone.`,
                      onConfirm: () => {
                        deleteScope(scope.id);
                        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                      },
                    });
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                  title="Delete scope"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      
      {showNewInput ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            type="text"
            value={newScopeName}
            onChange={(e) => setNewScopeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowNewInput(false); setNewScopeName(''); }
            }}
            onBlur={() => { 
              if (!newScopeName.trim()) setShowNewInput(false);
            }}
            placeholder="Scope name..."
            className="w-32 px-2 py-1 text-xs border border-input rounded bg-background"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="p-0.5 bg-primary text-primary-foreground rounded hover:opacity-90"
            title="Create scope"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewInput(true)}
          className="p-1 hover:bg-accent rounded"
          title="New scope"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
    </>
  );
}
