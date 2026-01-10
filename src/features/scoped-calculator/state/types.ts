// Storage types
export interface Scope {
  id: string;
  name: string;
  variables: VariableLine[];
  functions: FunctionDef[];
  createdAt: string;
  updatedAt: string;
}

export interface VariableLine {
  lineIndex: number;
  name: string | null;
  expression: string;
  value: number | string | boolean | null;
  error: string | null;
  dependsOn: string[];
}

export interface FunctionDef {
  name: string;
  code: string;
  isSaved: boolean;
  isCollapsed: boolean;
  colorTag: string;
}

export interface EvaluationResult {
  lineIndex: number;
  output: number | string | boolean | null;
  error: string | null;
}
