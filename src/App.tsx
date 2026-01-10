import { useEffect } from 'react';
import { useCalculatorStore } from './state/store';
import { ScopeList } from './components/scope-list/ScopeList';
import { CalculatorLines } from './components/calculator-lines/Lines';
import { FunctionsPane } from './components/functions-pane/FunctionsPane';

function App() {
  const { loadScopes, scopes, createScope } = useCalculatorStore();
  
  useEffect(() => {
    loadScopes();
    
    // Create default scope if none exist
    if (scopes.length === 0) {
      createScope('Default');
    }
  }, []);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <ScopeList />
      <CalculatorLines />
      <FunctionsPane />
    </div>
  );
}

export default App;
