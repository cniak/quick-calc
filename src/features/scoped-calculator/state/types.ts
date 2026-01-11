// Storage types
export type Scope = {
  id: string;
  name: string;
  variables: VariableLine[];
  createdAt: string;
  updatedAt: string;
}

export type VariableLine = {
  lineIndex: number;
  name: string | null;
  expression: string;
  value: number | string | boolean | null;
  error: string | null;
  dependsOn: string[];
}

export type FunctionSet = {
  id: string;
  name: string; // The namespace/set name (e.g., 'f', 'math', 'utils')
  code: string; // Contains multiple function definitions
  isSaved: boolean;
  colorTag: string;
  createdAt: string;
}

export type FunctionDef = {
  name: string;
  code: string;
  isSaved: boolean;
  isCollapsed: boolean;
  colorTag: string;
  scope: 'global' | string; // 'global' or specific scope ID
}

export type EvaluationResult = {
  lineIndex: number;
  output: number | string | boolean | null;
  error: string | null;
}
