import { useState, useEffect, useRef } from 'react';
import { useCalculatorStore } from '@/state/store';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog/ConfirmationDialog';

export function ScopeList() {
  const { scopes, activeScopeId, createScope, deleteScope, renameScope, setActiveScope, reorderScopes } = useCalculatorStore();
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Create a semi-transparent drag image
    const target = e.currentTarget as HTMLElement;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.opacity = '0.5';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 0, 0);
    setTimeout(() => document.body.removeChild(clone), 0);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderScopes(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      {scopes.map((scope, index) => (
        <div
          key={scope.id}
          draggable={editingId !== scope.id}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`group flex items-center gap-2 px-4 py-2 rounded-t text-xl cursor-move relative transition-all ${
            activeScopeId === scope.id 
              ? 'bg-background' 
              : 'bg-secondary hover:bg-accent'
          } ${
            draggedIndex === index ? 'opacity-50' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index
              ? draggedIndex !== null && draggedIndex < index
                ? 'border-r-2 border-blue-500'
                : 'border-l-2 border-blue-500'
              : ''
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
