import { useState, useEffect, useRef } from 'react';
import { useCalculatorStore } from '@/state/store';
import { Search, FolderOpen, Plus, FileText, Trash2, FolderPlus } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog/ConfirmationDialog';

interface CommandItem {
  id: string;
  type: 'scope' | 'set' | 'delete-scope' | 'delete-set' | 'add-scope' | 'add-set';
  action: 'open' | 'delete' | 'add';
  label: string;
  description?: string;
  scopeId?: string;
  setId?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { scopes, activeScopeId, functionSets, setActiveScope, createScope, deleteScope, addFunctionSet, deleteFunctionSet } = useCalculatorStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<'scope' | 'set'>('scope');
  const [newName, setNewName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setIsCreating(false);
      setNewName('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Parse query for prefix commands
  const getCommandMode = (q: string): { mode: 'open' | 'delete' | 'add' | null; searchTerm: string } => {
    if (q.startsWith('@')) return { mode: 'open', searchTerm: q.slice(1) };
    if (q.startsWith('-')) return { mode: 'delete', searchTerm: q.slice(1) };
    if (q.startsWith('+')) return { mode: 'add', searchTerm: q.slice(1) };
    return { mode: 'open', searchTerm: q }; // default to open
  };

  const { mode, searchTerm } = getCommandMode(query);

  // Build command items
  const commandItems: CommandItem[] = [];

  if (!isCreating) {
    if (mode === 'add') {
      // Show add commands
      commandItems.push({
        id: 'add-scope',
        type: 'add-scope',
        action: 'add',
        label: '+ Add new scope',
        description: 'Create a new calculation scope',
      });
      commandItems.push({
        id: 'add-set',
        type: 'add-set',
        action: 'add',
        label: '+ Add new function set',
        description: 'Create a new function set',
      });
    } else if (mode === 'delete') {
      // Show delete commands for scopes
      scopes.forEach(scope => {
        commandItems.push({
          id: `delete-scope-${scope.id}`,
          type: 'delete-scope',
          action: 'delete',
          label: `- Delete "${scope.name}"`,
          description: `Remove scope with ${scope.variables.length} lines`,
          scopeId: scope.id,
        });
      });
      // Show delete commands for function sets
      functionSets.forEach(set => {
        commandItems.push({
          id: `delete-set-${set.id}`,
          type: 'delete-set',
          action: 'delete',
          label: `- Delete "@${set.name}"`,
          description: 'Remove function set',
          setId: set.id,
        });
      });
    } else {
      // mode === 'open' - default view
      // Add scope navigation commands
      scopes.forEach(scope => {
        commandItems.push({
          id: `scope-${scope.id}`,
          type: 'scope',
          action: 'open',
          label: scope.name,
          description: `${scope.variables.length} lines`,
          scopeId: scope.id,
        });
      });

      // Add function set commands (global)
      functionSets.forEach(set => {
        commandItems.push({
          id: `set-${set.id}`,
          type: 'set',
          action: 'open',
          label: `@${set.name}`,
          description: 'Function set',
          setId: set.id,
        });
      });
    }
  }

  // Filter items based on search term
  const filteredItems = isCreating 
    ? []
    : commandItems.filter(item => 
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredItems.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, filteredItems.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCreating) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsCreating(false);
        setNewName('');
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item: CommandItem | undefined) => {
    if (!item) return;

    if (item.type === 'add-scope') {
      setIsCreating(true);
      setCreateType('scope');
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (item.type === 'add-set') {
      setIsCreating(true);
      setCreateType('set');
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (item.type === 'delete-scope' && item.scopeId) {
      const scopeName = scopes.find(s => s.id === item.scopeId)?.name;
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Scope',
        message: `Delete scope "${scopeName}"? This cannot be undone.`,
        onConfirm: () => {
          deleteScope(item.scopeId!);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          onClose();
        },
      });
    } else if (item.type === 'delete-set' && item.setId) {
      const setName = functionSets.find(s => s.id === item.setId)?.name;
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Function Set',
        message: `Delete function set "@${setName}"? This cannot be undone.`,
        onConfirm: () => {
          deleteFunctionSet(item.setId!);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          onClose();
        },
      });
    } else if (item.type === 'scope' && item.scopeId) {
      setActiveScope(item.scopeId);
      onClose();
      // Focus on last line after switching scope
      setTimeout(() => {
        window.dispatchEvent(new Event('focus-last-line'));
      }, 100);
    } else if (item.type === 'set' && item.setId) {
      // Open the function set
      onClose();
      // Dispatch custom event to open the set
      window.dispatchEvent(new CustomEvent('open-function-set', { 
        detail: { setId: item.setId } 
      }));
    }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;

    if (createType === 'scope') {
      // Validate unique scope name
      if (scopes.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert(`A scope named "${name}" already exists. Please choose a different name.`);
        return;
      }
      createScope(name);
      onClose();
      // Focus on last line after creating scope
      setTimeout(() => {
        window.dispatchEvent(new Event('focus-last-line'));
      }, 150);
    } else if (createType === 'set') {
      if (!(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name))) {
        alert('Function set name must be a valid JavaScript identifier (letters, numbers, underscore).');
        return;
      }
      // Validate unique set name
      if (functionSets.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert(`A function set named "${name}" already exists. Please choose a different name.`);
        return;
      }
      const setId = addFunctionSet(name);
      onClose();
      // Dispatch event to open the newly created set
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-function-set', { 
          detail: { setId } 
        }));
      }, 100);
    }
  };

  if (!isOpen) return null;

  const getPlaceholder = () => {
    if (isCreating) {
      return createType === 'scope' ? "Enter scope name..." : "Enter function set name...";
    }
    return "@ open  |  - delete  |  + add  |  Type to search...";
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => {
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }}
        variant="danger"
        confirmLabel="Delete"
      />
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50" 
        onClick={onClose}
        style={{ display: confirmDialog.isOpen ? 'none' : 'flex' }}
      >
      <div 
        className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={20} className="text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={isCreating ? newName : query}
            onChange={e => isCreating ? setNewName(e.target.value) : setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <kbd className="px-2 py-1 text-xs bg-secondary rounded border border-border">
            {isCreating ? 'Enter' : 'Esc'}
          </kbd>
        </div>

        {/* Command list */}
        {!isCreating && (
          <div 
            ref={listRef}
            className="max-h-96 overflow-y-auto"
          >
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {searchTerm ? 'No results found' : (
                  <div className="space-y-2">
                    <div>Start typing or use a prefix:</div>
                    <div className="text-xs space-y-1">
                      <div><kbd className="px-1 py-0.5 bg-secondary rounded">@</kbd> Open scope or set</div>
                      <div><kbd className="px-1 py-0.5 bg-secondary rounded">-</kbd> Delete scope or set</div>
                      <div><kbd className="px-1 py-0.5 bg-secondary rounded">+</kbd> Add scope or set</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                    idx === selectedIndex 
                      ? 'bg-blue-500/20 border-blue-500' 
                      : 'hover:bg-accent/50 border-transparent'
                  }`}
                >
                  {item.type === 'scope' && <FolderOpen size={18} className="text-blue-500 flex-shrink-0" />}
                  {item.type === 'set' && <FileText size={18} className="text-purple-500 flex-shrink-0" />}
                  {item.type === 'add-scope' && <FolderPlus size={18} className="text-green-500 flex-shrink-0" />}
                  {item.type === 'add-set' && <Plus size={18} className="text-green-500 flex-shrink-0" />}
                  {item.type === 'delete-scope' && <Trash2 size={18} className="text-red-500 flex-shrink-0" />}
                  {item.type === 'delete-set' && <Trash2 size={18} className="text-red-500 flex-shrink-0" />}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {idx === selectedIndex && (
                      <kbd className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-500 rounded border border-blue-500/30">
                        ↵ Enter
                      </kbd>
                    )}
                    {item.scopeId === activeScopeId && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        active
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {isCreating && (
          <div className="px-4 py-8 text-center">
            <div className="text-sm text-muted-foreground mb-4">
              {createType === 'scope' 
                ? 'Enter a name for the new scope' 
                : 'Function set name must be a valid JavaScript identifier'
              }
            </div>
            <div className="text-xs text-muted-foreground/70">
              Press Enter to create, Escape to cancel
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
