// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getCompatibleGPUDataEvaluatorFormat,
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';
import type {SignedDataType} from '@luma.gl/core';
import type {GPUVectorFormat} from '@luma.gl/tables';
import type {
  GPUVectorFormatComponentCount,
  GPUVectorFormatFromTypeAndSize,
  GPUVectorFormatIsNormalized,
  GPUVectorFormatSignedDataType,
  JoinSignedDataTypes,
  MaxComponentCount
} from '../operation/gpu-table-format-types';
import {
  compileExpression,
  type ExpressionLiteral,
  Expression,
  ExpressionOperations
} from '../utils/expression';
import {deduceOutputProps} from '../utils/output-props';

export type ArithmeticOp =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'pow'
  | 'sqrt'
  | 'abs'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'exp'
  | 'log';

export type ArithmeticOperationInputs = {
  expression: Expression<ArithmeticOp>;
  namedInputs: Record<string, GPUDataEvaluator>;
};

export type ArithmeticArgument = GPUDataEvaluatorInput | number | readonly number[];
type NormalizedArithmeticArgument = GPUDataEvaluator | number | readonly number[];

export const ARITHMETIC_OPERATIONS: ExpressionOperations<ArithmeticOp> = {
  add: {arity: 2, symbol: 'arithmetic_add'},
  subtract: {arity: 2, symbol: 'arithmetic_subtract'},
  multiply: {arity: 2, symbol: 'arithmetic_multiply'},
  divide: {arity: 2, symbol: 'arithmetic_divide'},
  pow: {arity: 2, symbol: 'pow'},
  sqrt: {arity: 1, symbol: 'sqrt'},
  abs: {arity: 1, symbol: 'abs'},
  sin: {arity: 1, symbol: 'sin'},
  cos: {arity: 1, symbol: 'cos'},
  tan: {arity: 1, symbol: 'arithmetic_tan'},
  exp: {arity: 1, symbol: 'exp'},
  log: {arity: 1, symbol: 'log'}
};

const FLOAT_OUTPUT_OPS = new Set<ArithmeticOp>(['pow', 'sqrt', 'sin', 'cos', 'tan', 'exp', 'log']);
type FloatOutputArithmeticOp = 'pow' | 'sqrt' | 'sin' | 'cos' | 'tan' | 'exp' | 'log';

type ArithmeticArgumentFormat<ArgumentT> =
  ArgumentT extends GPUDataEvaluatorInput<infer FormatT> ? FormatT : never;

type ArithmeticArgumentComponentCount<ArgumentT> = ArgumentT extends number
  ? 1
  : ArgumentT extends readonly number[]
    ? number extends ArgumentT['length']
      ? number
      : ArgumentT['length']
    : ArithmeticArgumentFormat<ArgumentT> extends GPUVectorFormat
      ? GPUVectorFormatComponentCount<ArithmeticArgumentFormat<ArgumentT>>
      : 1;

type MaxArithmeticArgumentComponentCount<
  ArgumentsT extends readonly unknown[],
  CurrentSizeT extends number = 1
> = ArgumentsT extends readonly [infer FirstT, ...infer RestT]
  ? MaxArithmeticArgumentComponentCount<
      RestT,
      MaxComponentCount<CurrentSizeT, ArithmeticArgumentComponentCount<FirstT>>
    >
  : CurrentSizeT;

type JoinArithmeticArgumentDataTypes<
  ArgumentsT extends readonly unknown[],
  CurrentTypeT extends SignedDataType | null = null
> = ArgumentsT extends readonly [infer FirstT, ...infer RestT]
  ? ArithmeticArgumentFormat<FirstT> extends infer FormatT extends GPUVectorFormat
    ? [FormatT] extends [never]
      ? JoinArithmeticArgumentDataTypes<RestT, CurrentTypeT>
      : JoinArithmeticArgumentDataTypes<
          RestT,
          CurrentTypeT extends SignedDataType
            ? JoinSignedDataTypes<CurrentTypeT, GPUVectorFormatSignedDataType<FormatT>>
            : GPUVectorFormatSignedDataType<FormatT>
        >
    : JoinArithmeticArgumentDataTypes<RestT, CurrentTypeT>
  : CurrentTypeT extends SignedDataType
    ? CurrentTypeT
    : 'float32';

type HasNormalizedArithmeticArgument<ArgumentsT extends readonly unknown[]> =
  ArgumentsT extends readonly [infer FirstT, ...infer RestT]
    ? ArithmeticArgumentFormat<FirstT> extends infer FormatT extends GPUVectorFormat
      ? [FormatT] extends [never]
        ? HasNormalizedArithmeticArgument<RestT>
        : GPUVectorFormatIsNormalized<FormatT> extends true
          ? true
          : HasNormalizedArithmeticArgument<RestT>
      : HasNormalizedArithmeticArgument<RestT>
    : false;

type PromoteNormalizedArithmeticDataType<
  TypeT extends SignedDataType,
  HasNormalizedT extends boolean
> = TypeT extends `float${string}` ? TypeT : HasNormalizedT extends true ? 'float32' : TypeT;

export type ArithmeticOutputFormat<
  OpT extends ArithmeticOp,
  ArgumentsT extends readonly unknown[]
> = GPUVectorFormatFromTypeAndSize<
  OpT extends FloatOutputArithmeticOp
    ? 'float32'
    : PromoteNormalizedArithmeticDataType<
        JoinArithmeticArgumentDataTypes<ArgumentsT>,
        HasNormalizedArithmeticArgument<ArgumentsT>
      >,
  MaxArithmeticArgumentComponentCount<ArgumentsT>
>;

export class ArithmeticOperation extends Operation<ArithmeticOperationInputs> {
  name = 'arithmetic';

  output: GPUDataEvaluator;

  constructor(op: ArithmeticOp, args: ArithmeticArgument[]) {
    const evaluatorArgs = args.map(arg =>
      isLiteralArgument(arg) ? arg : getGPUDataEvaluator(arg)
    );
    const {expression, namedInputs, dependencies} = getMergedExpressionAndInputs(op, evaluatorArgs);
    super({
      expression,
      namedInputs
    });
    this.dependencies = dependencies;

    const {isConstant, type, size, length} = deduceArithmeticOutputProps(op, evaluatorArgs);
    const firstInput = evaluatorArgs.find(
      (arg): arg is GPUDataEvaluator => arg instanceof GPUDataEvaluator
    );
    this.output = new GPUDataEvaluator({
      isConstant,
      type,
      size,
      length,
      format: firstInput
        ? getCompatibleGPUDataEvaluatorFormat(firstInput, type, size, firstInput.normalized)
        : undefined,
      source: this
    });
  }

  toString(): string {
    const expressionString = compileExpression(this.inputs.expression, {
      operations: ARITHMETIC_OPERATIONS,
      inputs: this.inputs.namedInputs,
      laneIndex: 0,
      formatInput: name => this.inputs.namedInputs[name].toString(),
      formatOutOfBoundsInput: () => '0',
      formatLiteral: value => (Array.isArray(value) ? `[${value.join(',')}]` : String(value)),
      formatCall: (symbol, args) => formatHumanReadableCall(symbol, args)
    });
    return unwrapOuterParentheses(expressionString);
  }

  protected override shouldExecuteOnCPU(): boolean {
    return (
      this.output.length <= 1 &&
      Object.values(this.inputs.namedInputs).every(table => Boolean(table.value))
    );
  }
}

function getMergedExpressionAndInputs(
  op: ArithmeticOp,
  args: NormalizedArithmeticArgument[]
): {
  expression: Expression<ArithmeticOp>;
  namedInputs: Record<string, GPUDataEvaluator>;
  dependencies: GPUDataEvaluator[];
} {
  const argExpressions: Expression<ArithmeticOp>[] = [];
  const namedInputs: Record<string, GPUDataEvaluator> = {};
  const dependencies = new Set<GPUDataEvaluator>();
  let nextInputIndex = 0;

  for (const arg of args) {
    if (isLiteralArgument(arg)) {
      argExpressions.push({
        kind: 'literal',
        value: arg
      });
      continue;
    }

    const source = arg.source;
    if (source instanceof ArithmeticOperation) {
      const inputNameMap = getRemappedInputNames(source.inputs.namedInputs, nextInputIndex);
      argExpressions.push(remapExpressionInputs(source.inputs.expression, inputNameMap));
      for (const [oldName, newName] of Object.entries(inputNameMap)) {
        namedInputs[newName] = source.inputs.namedInputs[oldName];
        nextInputIndex++;
      }
      for (const dependency of source.dependencies) {
        dependencies.add(dependency);
      }
      continue;
    }

    const inputName = `arg${nextInputIndex++}`;
    argExpressions.push({kind: 'input', name: inputName});
    namedInputs[inputName] = arg;
    dependencies.add(arg);
  }

  return {
    expression: {
      kind: 'call',
      op,
      args: argExpressions
    },
    namedInputs,
    dependencies: Array.from(dependencies)
  };
}

function deduceArithmeticOutputProps(op: ArithmeticOp, args: NormalizedArithmeticArgument[]) {
  const evaluatorArgs = args.filter(
    (arg): arg is GPUDataEvaluator => arg instanceof GPUDataEvaluator
  );
  const literalArgs = args.filter(isLiteralArgument);

  const baseProps =
    evaluatorArgs.length > 0
      ? deduceOutputProps(...evaluatorArgs)
      : {
          isConstant: true,
          type: 'float32' as const,
          size: 1,
          length: 1
        };

  const literalSize = literalArgs.reduce((size: number, arg: number | readonly number[]) => {
    if (Array.isArray(arg)) {
      return Math.max(size, arg.length);
    }
    return Math.max(size, 1);
  }, 1);

  return {
    ...baseProps,
    type: FLOAT_OUTPUT_OPS.has(op) ? ('float32' as const) : baseProps.type,
    size: Math.max(baseProps.size, literalSize)
  };
}

function isLiteralArgument(
  arg: ArithmeticArgument | NormalizedArithmeticArgument
): arg is ExpressionLiteral {
  return typeof arg === 'number' || Array.isArray(arg);
}

function getRemappedInputNames(
  namedInputs: Record<string, GPUDataEvaluator>,
  startIndex: number
): Record<string, string> {
  const inputNameMap: Record<string, string> = {};
  let index = startIndex;
  for (const name of Object.keys(namedInputs)) {
    inputNameMap[name] = `arg${index++}`;
  }
  return inputNameMap;
}

function remapExpressionInputs(
  expression: Expression<ArithmeticOp>,
  inputNameMap: Record<string, string>
): Expression<ArithmeticOp> {
  switch (expression.kind) {
    case 'input':
      return {
        kind: 'input',
        name: inputNameMap[expression.name] || expression.name
      };

    case 'literal':
      return expression;

    case 'call':
      return {
        kind: 'call',
        op: expression.op,
        args: expression.args.map(argument => remapExpressionInputs(argument, inputNameMap))
      };

    default: {
      const unreachable: never = expression;
      throw new Error(
        `Unsupported arithmetic expression node ${(unreachable as {kind?: string}).kind}`
      );
    }
  }
}

function formatHumanReadableCall(symbol: string, args: string[]): string {
  switch (symbol) {
    case 'arithmetic_add':
      return `(${args[0]} + ${args[1]})`;
    case 'arithmetic_subtract':
      return `(${args[0]} - ${args[1]})`;
    case 'arithmetic_multiply':
      return `(${args[0]} * ${args[1]})`;
    case 'arithmetic_divide':
      return `(${args[0]} / ${args[1]})`;
    case 'arithmetic_tan':
      return `tan(${unwrapOuterParentheses(args[0])})`;
    case 'pow':
      return `pow(${unwrapOuterParentheses(args[0])}, ${unwrapOuterParentheses(args[1])})`;
    case 'sqrt':
    case 'abs':
    case 'sin':
    case 'cos':
    case 'exp':
    case 'log':
      return `${symbol}(${unwrapOuterParentheses(args[0])})`;
    default:
      return `${symbol}(${args.join(', ')})`;
  }
}

function unwrapOuterParentheses(expression: string): string {
  if (!(expression.startsWith('(') && expression.endsWith(')'))) {
    return expression;
  }

  let depth = 0;
  for (let index = 0; index < expression.length; index++) {
    const char = expression[index];
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0 && index < expression.length - 1) {
        return expression;
      }
    }
  }

  return expression.slice(1, -1);
}
