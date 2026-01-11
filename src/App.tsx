import { useEffect, useRef, useState } from 'react';
import { useCalculatorStore } from '@/state/store';
import { ScopeList } from '@/components/scope-list/ScopeList';
import { CalculatorLines } from '@/components/calculator-lines/Lines';
import { FunctionsPane } from '@/components/functions-pane/FunctionsPane';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

const FUNCTIONS_HEIGHT_KEY = 'calculator-v2-functions-height';

function App() {
  const { scopes, activeScopeId, loadScopes, createScope } = useCalculatorStore();
  const initialized = useRef(false);
  const [functionsHeight, setFunctionsHeight] = useState(() => {
    const saved = localStorage.getItem(FUNCTIONS_HEIGHT_KEY);
    return saved ? parseFloat(saved) : 30;
  }); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update document title based on active scope
  useEffect(() => {
    const activeScope = scopes.find(s => s.id === activeScopeId);
    if (activeScope) {
      document.title = `@calc / ${activeScope.name}`;
    } else {
      document.title = 'Quick Calculator';
    }
  }, [scopes, activeScopeId]);
  
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadScopes();
      
      // Check after a tick to allow loadScopes to complete
      setTimeout(() => {
        const currentScopes = useCalculatorStore.getState().scopes;
        if (currentScopes.length === 0) {
          createScope('Default');
        }
      }, 0);
    }
  }, []);
  
  // Save functionsHeight to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(FUNCTIONS_HEIGHT_KEY, functionsHeight.toString());
  }, [functionsHeight]);
  
  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ' ') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newHeight = ((containerRect.bottom - e.clientY) / containerRect.height) * 100;
      
      // Clamp between 10% and 70%
      setFunctionsHeight(Math.max(10, Math.min(70, newHeight)));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      <ScopeList />
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden relative">
        <div style={{ height: `${100 - functionsHeight}%` }} className="overflow-hidden">
          <CalculatorLines />
        </div>
        
        {/* Resize handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="h-1 bg-border hover:bg-blue-500 cursor-row-resize flex items-center justify-center group relative"
        >
          <div className="absolute w-12 h-1 bg-blue-500/0 group-hover:bg-blue-500/50 rounded-full transition-colors" />
        </div>
        
        <div style={{ height: `${functionsHeight}%` }} className="overflow-hidden">
          <FunctionsPane />
        </div>
      </div>
    </div>
  );
}

export default App;
