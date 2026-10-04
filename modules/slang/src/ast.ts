// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type SourceLocation = {offset: number; line: number; column: number};
export type Token = SourceLocation & {
  text: string;
  kind: 'identifier' | 'number' | 'string' | 'symbol' | 'end';
};
export type SlangType = {name: string; element?: SlangType; length?: number};
export type Attribute = {name: string; arguments: string[]; location: SourceLocation};
export type Variable = {
  kind: 'variable';
  name: string;
  type: SlangType;
  modifiers: string[];
  attributes: Attribute[];
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
  semantic?: string;
  body: Statement;
  location: SourceLocation;
};
export type Program = {declarations: (Structure | ShaderFunction | Variable)[]};
export type Expression = SourceLocation &
  (
    | {kind: 'identifier' | 'number' | 'boolean'; value: string}
    | {kind: 'unary'; operator: string; operand: Expression; postfix: boolean}
    | {kind: 'binary'; operator: string; left: Expression; right: Expression}
    | {kind: 'call'; callee: Expression; arguments: Expression[]}
    | {kind: 'member'; object: Expression; member: string}
    | {kind: 'index'; object: Expression; index: Expression}
    | {kind: 'conditional'; condition: Expression; consequent: Expression; alternate: Expression}
    | {kind: 'cast'; type: SlangType; operand: Expression}
  );
export type Statement = SourceLocation &
  (
    | {kind: 'block'; statements: Statement[]}
    | {kind: 'variable'; variable: Variable}
    | {kind: 'expression'; expression: Expression}
    | {kind: 'return'; expression?: Expression}
    | {kind: 'if'; condition: Expression; consequent: Statement; alternate?: Statement}
    | {kind: 'while'; condition: Expression; body: Statement}
    | {
        kind: 'for';
        initializer?: Statement;
        condition?: Expression;
        update?: Expression;
        body: Statement;
      }
    | {kind: 'break' | 'continue' | 'discard' | 'empty'}
  );
