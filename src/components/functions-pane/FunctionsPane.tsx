import { useState, useEffect, useRef } from 'react';
import { useCalculatorStore } from '@/state/store';
import { Trash2, Terminal, FileText } from 'lucide-react';
import { CodeEditor } from '@/components/code-editor/CodeEditor';
import { ConfirmationDialog } from '@/components/confirmation-dialog/ConfirmationDialog';

const NAVIGATOR_WIDTH_KEY = 'calculator-v2-navigator-width';

export function FunctionsPane() {
  const { scopes, activeScopeId, functionSets, addFunctionSet, updateFunctionSet, saveFunctionSet, renameFunctionSet, deleteFunctionSet } = useCalculatorStore();
  const [newSetName, setNewSetName] = useState('');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const [navigatorWidth, setNavigatorWidth] = useState(() => {
    const saved = localStorage.getItem(NAVIGATOR_WIDTH_KEY);
    return saved ? parseInt(saved) : 240;
  }); // pixels
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeScope = scopes.find(s => s.id === activeScopeId);
  
  // Listen for custom event to open a specific set
  useEffect(() => {
    const handleOpenSet = (e: Event) => {
      const customEvent = e as CustomEvent<{ setId: string }>;
      setActiveSetId(customEvent.detail.setId);
    };
    
    const handleFocusFirstSet = () => {
      if (functionSets.length > 0) {
        setActiveSetId(functionSets[0].id);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'ArrowUp' && activeSetId) {
        e.preventDefault();
        
        const currentIndex = functionSets.findIndex(s => s.id === activeSetId);
        if (currentIndex === -1) return;
        
        if (currentIndex === 0) {
          // First set - trigger focus on active scope
          window.dispatchEvent(new CustomEvent('focus-active-scope'));
        } else {
          // Move to previous set
          setActiveSetId(functionSets[currentIndex - 1].id);
        }
      }
    };
    
    window.addEventListener('open-function-set', handleOpenSet);
    window.addEventListener('focus-first-function-set', handleFocusFirstSet);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-function-set', handleOpenSet);
      window.removeEventListener('focus-first-function-set', handleFocusFirstSet);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [functionSets, activeSetId]);
  
  // Auto-save function set after 500ms of inactivity
  useEffect(() => {
    if (!activeSetId) return;
    
    const activeSet = functionSets.find(set => set.id === activeSetId);
    if (!activeSet || activeSet.isSaved) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      saveFunctionSet(activeSet.id);
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [functionSets, activeSetId, saveFunctionSet]);
  
  // Save navigator width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(NAVIGATOR_WIDTH_KEY, navigatorWidth.toString());
  }, [navigatorWidth]);
  
  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      
      // Clamp between 150px and 500px
      setNavigatorWidth(Math.max(150, Math.min(500, newWidth)));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);
  
  if (!activeScope) return null;
  
  const allFunctionSets = functionSets;
  
  const handleAddFunctionSet = () => {
    const trimmedName = newSetName.trim();
    if (!trimmedName) return;
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      alert('Function set name must be a valid JavaScript identifier (letters, numbers, underscore).');
      return;
    }
    
    // Validate unique name
    if (functionSets.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert(`A function set named "${trimmedName}" already exists. Please choose a different name.`);
      return;
    }
    
    const setId = addFunctionSet(trimmedName);
    setNewSetName('');
    setActiveSetId(setId);
  };
  
  const handleRename = (setId: string) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      alert('Function set name must be a valid JavaScript identifier (letters, numbers, underscore).');
      return;
    }
    
    // Validate unique name (excluding current set)
    if (functionSets.some(s => s.id !== setId && s.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert(`A function set named "${trimmedName}" already exists. Please choose a different name.`);
      setEditingSetId(null);
      setEditingName('');
      return;
    }
    
    renameFunctionSet(setId, trimmedName);
    setEditingSetId(null);
    setEditingName('');
  };
  
  const activeSetData = allFunctionSets.find(set => set.id === activeSetId);
  
  // Helper function to extract function signatures with parameters from code
  const extractFunctions = (code: string): Array<{ name: string; signature: string }> => {
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    const matches = [...code.matchAll(functionRegex)];
    return matches.map(m => ({
      name: m[1],
      signature: `${m[1]}(${m[2]})`
    }));
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
      <div className="border-t border-border bg-secondary/50 flex flex-col h-full">
      {/* Terminal-style header */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-secondary flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={20} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Function Sets (JavaScript)</h3>
        </div>
      </div>
      
      {/* Main content area with directory and functions */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden min-h-0">
        {/* Left directory/navigator */}
        <div className="border-r border-border bg-secondary/30 overflow-y-auto flex flex-col" style={{ width: `${navigatorWidth}px` }}>
          {/* Add function set input at top */}
          <div className="p-2 border-b border-border bg-secondary/50">
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFunctionSet()}
              placeholder="set name..."
              title="Function set name (e.g., 'math', 'utils') - Press Enter to add"
              className="w-full px-2 py-1 text-xs border border-input rounded bg-background text-foreground"
            />
          </div>
          
          {/* Function set list */}
          <div className="p-2 space-y-2 flex-1">
            {allFunctionSets.length === 0 ? (
              <div className="text-xs text-muted-foreground italic p-2">No function sets</div>
            ) : (
              allFunctionSets.map(set => {
                const functions = extractFunctions(set.code);
                return (
                  <div key={set.id}>
                    <div
                      className={`flex items-center gap-1 rounded group relative ${
                        activeSetId === set.id 
                          ? 'bg-blue-500/15 border border-blue-500/30' 
                          : 'hover:bg-accent border border-transparent'
                      }`}
                    >
                      {activeSetId === set.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l" />
                      )}
                      {editingSetId === set.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(set.id);
                            if (e.key === 'Escape') {
                              setEditingSetId(null);
                              setEditingName('');
                            }
                          }}
                          onBlur={() => handleRename(set.id)}
                          autoFocus
                          className="flex-1 px-2 py-1 text-xs border border-input rounded bg-background text-foreground font-mono"
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveSetId(set.id)}
                            onDoubleClick={() => {
                              setEditingSetId(set.id);
                              setEditingName(set.name);
                            }}
                            className={`flex-1 text-left px-2 py-1.5 text-xs font-mono flex items-center gap-1.5 ${
                              activeSetId === set.id ? 'font-semibold text-blue-600 dark:text-blue-400' : 'font-medium'
                            }`}
                            title="Click to edit code, double-click to rename"
                          >
                            <FileText size={16} className="flex-shrink-0" />
                            <span className="truncate">@{set.name}</span>
                          </button>
                          <div className={`flex items-center gap-0.5 pr-1 ${
                            activeSetId === set.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Function Set',
                                  message: `Delete function set "@${set.name}"? This cannot be undone.`,
                                  onConfirm: () => {
                                    deleteFunctionSet(set.id);
                                    if (activeSetId === set.id) {
                                      setActiveSetId(null);
                                    }
                                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                                  },
                                });
                              }}
                              className="p-0.5 hover:bg-accent rounded hover:text-destructive"
                              title="Delete function set"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Function list below set */}
                    {functions.length > 0 && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {functions.map(func => (
                          <button 
                            key={func.name}
                            onClick={() => setActiveSetId(set.id)}
                            className="text-xs font-mono text-foreground/80 px-2 py-1 hover:text-foreground hover:bg-accent/60 rounded w-full text-left transition-all cursor-pointer bg-accent/20 border border-border/50 hover:border-border shadow-sm"
                            title={`Use as @${set.name}.${func.signature}`}
                          >
                            • {func.signature}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Resize handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="w-1 bg-border hover:bg-blue-500 cursor-col-resize flex items-center justify-center group relative transition-colors"
        >
          <div className="absolute h-16 w-1 bg-blue-500/30 group-hover:bg-blue-500/70 rounded-full transition-colors" />
        </div>
        
        {/* Right editor pane - single function set view */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeSetData ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {allFunctionSets.length === 0 
                ? 'No function sets defined. Add one to get started.' 
                : 'Select a function set from the list to edit'}
            </div>
          ) : (
            <>
              {/* Code editor */}
              <div className="flex-1 overflow-auto">
                <CodeEditor
                  value={activeSetData.code}
                  onChange={(code) => updateFunctionSet(activeSetData.id, code)}
                  className="w-full h-full"
                  placeholder={`// Define functions for @${activeSetData.name}\n// They will be accessible as @${activeSetData.name}.functionName()\n\nfunction example(a, b) {\n  return a + b;\n}`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}