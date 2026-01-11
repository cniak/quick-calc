import type { VariableLine } from '@/features/scoped-calculator/state/types';
import { extractDependencies } from './parser';

// Build dependency graph and detect cycles
export function buildDependencyGraph(lines: VariableLine[]): Map<number, Set<number>> {
  const graph = new Map<number, Set<number>>();
  const varToLine = new Map<string, number>();
  
  // Map variable names to line indices
  lines.forEach((line, idx) => {
    if (line.name) {
      varToLine.set(line.name, idx);
    }
    graph.set(idx, new Set());
  });
  
  // Build edges
  lines.forEach((line, idx) => {
    const deps = extractDependencies(line.expression);
    deps.forEach(dep => {
      const depIdx = varToLine.get(dep);
      if (depIdx !== undefined) {
        graph.get(idx)!.add(depIdx);
      }
    });
  });
  
  return graph;
}

// Detect circular dependencies
export function detectCycles(graph: Map<number, Set<number>>): number[] | null {
  const visited = new Set<number>();
  const recStack = new Set<number>();
  
  function dfs(node: number): number[] | null {
    visited.add(node);
    recStack.add(node);
    
    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = dfs(neighbor);
        if (cycle) return cycle;
      } else if (recStack.has(neighbor)) {
        return [neighbor, node];
      }
    }
    
    recStack.delete(node);
    return null;
  }
  
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const cycle = dfs(node);
      if (cycle) return cycle;
    }
  }
  
  return null;
}
