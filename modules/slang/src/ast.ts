// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SourceLocation} from './ir';
export type {SourceLocation} from './ir';
export type Token = SourceLocation & {
  text: string;
  kind: 'identifier' | 'number' | 'string' | 'symbol' | 'end';
};
export type SlangType = {name: string; element?: SlangType; length?: number; lengthName?: string};
export type Attribute = {name: string; arguments: string[]; location: SourceLocation};
export type Variable = {
  kind: 'variable';
  name: string;
  type: SlangType;
  modifiers: string[];
  attributes: Attribute[];
  interface?: import('./ir').ShaderInterface;
  semantic?: string;
  binding?: {group: number; binding: number};
  initializer?: Expression;
  location: SourceLocation;
};
export type Structure = {
  kind: 'struct';
  name: string;
  fields: Variable[];
  location: SourceLocation;
};
export type ShaderFunction = {
  kind: 'function';
  name: string;
  type: SlangType;
  parameters: Variable[];
  attributes: Attribute[];
  interface?: import('./ir').ShaderInterface;
  semantic?: string;
  body: Statement;
  /** A typed native function declaration, supplied through the registry. */
  prototype?: boolean;
  location: SourceLocation;
};
export type Program = {
  declarations: (Structure | ShaderFunction | Variable)[];
  /** Source clip-space convention, independent of target syntax. */
  clipSpace?: 'webgpu';
  evaluationOrder?: 'left-to-right';
  publicNames?: ReadonlyMap<string, string>;
  nativeModules?: {
    name: string;
    code: string;
    sourceName: string;
    functions: string[];
    imports: string[];
  }[];
};
export type Expression = SourceLocation & {
  operation?: import('./ir').ShaderOperation;
  /** A materialized abstract constant, computed before target emission. */
  constantValue?: string;
  valueType?: SlangType;
  resolvedType?: import('./ir').ShaderType;
  resolvedCall?:
    | {kind: 'function'; declaration: ShaderFunction}
    | {kind: 'constructor'; type: SlangType};
} & (
    | {kind: 'identifier' | 'number' | 'boolean'; value: string}
    | {kind: 'unary'; operator: string; operand: Expression; postfix: boolean}
    | {kind: 'binary'; operator: string; left: Expression; right: Expression}
    | {kind: 'call'; callee: Expression; arguments: Expression[]}
    | {kind: 'member'; object: Expression; member: string}
    | {kind: 'index'; object: Expression; index: Expression}
    | {kind: 'conditional'; condition: Expression; consequent: Expression; alternate: Expression}
    | {kind: 'initializer'; elements: Expression[]}
    | {kind: 'cast'; type: SlangType; operand: Expression}
    | {kind: 'bitcast'; type: SlangType; operand: Expression}
    | {kind: 'construct'; type: SlangType; elements: Expression[]}
    | {kind: 'select'; arguments: Expression[]}
    | {kind: 'texture-dimensions'; texture: Expression; level: Expression}
  );
export type SwitchClause = SourceLocation & {
  labels: (Expression | null)[];
  statements: Statement[];
};
export type Statement = SourceLocation &
  (
    | {kind: 'block'; statements: Statement[]}
    | {kind: 'variable'; variable: Variable}
    | {kind: 'expression'; expression: Expression}
    | {kind: 'return'; expression?: Expression}
    | {kind: 'if'; condition: Expression; consequent: Statement; alternate?: Statement}
    | {kind: 'while' | 'do'; condition: Expression; body: Statement}
    | {kind: 'switch'; selector: Expression; clauses: SwitchClause[]}
    | {
        kind: 'for';
        initializer?: Statement;
        condition?: Expression;
        update?: Expression;
        body: Statement;
      }
    | {kind: 'break' | 'continue' | 'discard' | 'empty'}
  );
