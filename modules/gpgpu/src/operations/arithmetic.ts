// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {getGPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {
  ArithmeticArgument,
  ArithmeticOp,
  ArithmeticOperation,
  type ArithmeticOutputFormat
} from './arithmetic-operation';

type ArithmeticArguments = readonly [ArithmeticArgument, ...ArithmeticArgument[]];

/**
 * Adds corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function add<const ArgumentsT extends ArithmeticArguments>(
  ...args: ArgumentsT
): GPUDataEvaluator<ArithmeticOutputFormat<'add', ArgumentsT>>;
export function add(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('add', args);
}

/**
 * Subtracts corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function subtract<const ArgumentsT extends ArithmeticArguments>(
  ...args: ArgumentsT
): GPUDataEvaluator<ArithmeticOutputFormat<'subtract', ArgumentsT>>;
export function subtract(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('subtract', args);
}

/**
 * Multiplies corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function multiply<const ArgumentsT extends ArithmeticArguments>(
  ...args: ArgumentsT
): GPUDataEvaluator<ArithmeticOutputFormat<'multiply', ArgumentsT>>;
export function multiply(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('multiply', args);
}

/**
 * Divides corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function divide<const ArgumentsT extends ArithmeticArguments>(
  ...args: ArgumentsT
): GPUDataEvaluator<ArithmeticOutputFormat<'divide', ArgumentsT>>;
export function divide(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('divide', args);
}

/**
 * Raises each row element in `base` to the corresponding power in `exponent`.
 */
export function pow<
  const BaseT extends ArithmeticArgument,
  const ExponentT extends ArithmeticArgument
>(
  base: BaseT,
  exponent: ExponentT
): GPUDataEvaluator<ArithmeticOutputFormat<'pow', [BaseT, ExponentT]>>;
export function pow(base: ArithmeticArgument, exponent: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('pow', [base, exponent]).output;
}

/**
 * Computes the square root of each row element.
 */
export function sqrt<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'sqrt', [ArgumentT]>>;
export function sqrt(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('sqrt', [arg]).output;
}

/**
 * Computes the absolute value of each row element.
 */
export function abs<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'abs', [ArgumentT]>>;
export function abs(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('abs', [arg]).output;
}

/**
 * Applies sine to each row element.
 */
export function sin<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'sin', [ArgumentT]>>;
export function sin(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('sin', [arg]).output;
}

/**
 * Applies cosine to each row element.
 */
export function cos<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'cos', [ArgumentT]>>;
export function cos(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('cos', [arg]).output;
}

/**
 * Applies tangent to each row element.
 */
export function tan<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'tan', [ArgumentT]>>;
export function tan(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('tan', [arg]).output;
}

/**
 * Applies the natural exponential to each row element.
 */
export function exp<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'exp', [ArgumentT]>>;
export function exp(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('exp', [arg]).output;
}

/**
 * Applies the natural logarithm to each row element.
 */
export function log<const ArgumentT extends ArithmeticArgument>(
  arg: ArgumentT
): GPUDataEvaluator<ArithmeticOutputFormat<'log', [ArgumentT]>>;
export function log(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('log', [arg]).output;
}

function reduceArithmetic(
  op: Extract<ArithmeticOp, 'add' | 'subtract' | 'multiply' | 'divide'>,
  args: ArithmeticArgument[]
): GPUDataEvaluator {
  if (args.length === 0) {
    throw new Error(`${op} requires at least one argument`);
  }
  const firstArgument = args[0];
  let result: GPUDataEvaluator | number | readonly number[] = isArithmeticLiteral(firstArgument)
    ? firstArgument
    : getGPUDataEvaluator(firstArgument);
  for (let i = 1; i < args.length; i++) {
    result = new ArithmeticOperation(op, [result, args[i]]).output;
  }
  if (result instanceof GPUDataEvaluator) {
    return result;
  }
  return Array.isArray(result)
    ? GPUDataEvaluator.fromConstant(result)
    : GPUDataEvaluator.fromConstant(result as number);
}

function isArithmeticLiteral(argument: ArithmeticArgument): argument is number | readonly number[] {
  return typeof argument === 'number' || Array.isArray(argument);
}
