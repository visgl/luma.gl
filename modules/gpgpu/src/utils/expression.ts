// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** JSON-friendly scalar expression tree for elementwise row transforms. */
export type ExpressionLiteral = number | readonly number[];

export type Expression<OpT extends string = string> =
  | {kind: 'input'; name: string}
  | {kind: 'literal'; value: ExpressionLiteral}
  | {kind: 'call'; op: OpT; args: Expression<OpT>[]};

/** Operation metadata used to validate and lower expression nodes to GLSL calls. */
export type ExpressionOperation = {
  arity: number;
  symbol: string;
};

export type ExpressionOperations<OpT extends string = string> = Record<OpT, ExpressionOperation>;

export type CompileExpressionOptions<OpT extends string = string> = {
  /** Operation metadata keyed by expression op. */
  operations: ExpressionOperations<OpT>;
  /** Names that can be referenced by `input` nodes. */
  inputs: Record<string, {size: number}>;
  /** Current output lane index used when reading elementwise inputs. */
  laneIndex: number;
  /** Formats an in-bounds input reference. */
  formatInput: (name: string) => string;
  /** Formats an out-of-bounds input reference. */
  formatOutOfBoundsInput: (name: string) => string;
  /** Formats a numeric literal for the target shading language. */
  formatLiteral: (value: ExpressionLiteral) => string;
  /** Formats a call expression using the target shading language syntax. */
  formatCall: (symbol: string, args: string[]) => string;
};

/**
 * Validates an expression tree against known operations and available inputs.
 *
 * Throws a descriptive error if a node is malformed.
 */
export function validateExpression<OpT extends string>(
  expression: Expression<OpT>,
  {
    operations,
    inputs
  }: {
    operations: ExpressionOperations<OpT>;
    inputs: Record<string, {size: number}>;
  }
): void {
  switch (expression.kind) {
    case 'input':
      if (!(expression.name in inputs)) {
        throw new Error(`Unknown expression input '${expression.name}'`);
      }
      return;

    case 'literal':
      if (Array.isArray(expression.value)) {
        for (const value of expression.value) {
          if (!Number.isFinite(value)) {
            throw new Error(
              `Expression literal array must contain only finite values, got ${value}`
            );
          }
        }
      } else if (!Number.isFinite(expression.value)) {
        throw new Error(`Expression literal must be finite, got ${expression.value}`);
      }
      return;

    case 'call': {
      const operation = operations[expression.op];
      if (!operation) {
        throw new Error(`Unknown expression op '${expression.op}'`);
      }
      if (expression.args.length !== operation.arity) {
        throw new Error(
          `Expression op '${expression.op}' expects ${operation.arity} args, got ${expression.args.length}`
        );
      }
      for (const argument of expression.args) {
        validateExpression(argument, {operations, inputs});
      }
      return;
    }

    default: {
      const unreachable: never = expression;
      throw new Error(`Unsupported expression node ${(unreachable as {kind?: string}).kind}`);
    }
  }
}

/**
 * Compiles an expression tree into a single inline scalar shader expression.
 *
 * The generated expression is side-effect free and intended for use in statements like
 * `result[i] = <expression>;`.
 */
export function compileExpression<OpT extends string>(
  expression: Expression<OpT>,
  options: CompileExpressionOptions<OpT>
): string {
  validateExpression(expression, options);
  return compileExpressionNode(expression, options);
}

function compileExpressionNode<OpT extends string>(
  expression: Expression<OpT>,
  options: CompileExpressionOptions<OpT>
): string {
  switch (expression.kind) {
    case 'input': {
      const input = options.inputs[expression.name];
      if (options.laneIndex < input.size) {
        return options.formatInput(expression.name);
      }
      return options.formatOutOfBoundsInput(expression.name);
    }

    case 'literal':
      return options.formatLiteral(expression.value);

    case 'call': {
      const operation = options.operations[expression.op];
      const argumentsCode = expression.args.map(argument =>
        compileExpressionNode(argument, options)
      );
      return options.formatCall(operation.symbol, argumentsCode);
    }

    default: {
      const unreachable: never = expression;
      throw new Error(`Unsupported expression node ${(unreachable as {kind?: string}).kind}`);
    }
  }
}
