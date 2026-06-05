// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {getGPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {ArithmeticArgument, ArithmeticOp, ArithmeticOperation} from './arithmetic-operation';

/**
 * Adds corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function add(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('add', args);
}

/**
 * Subtracts corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function subtract(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('subtract', args);
}

/**
 * Multiplies corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function multiply(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('multiply', args);
}

/**
 * Divides corresponding row elements from two or more tables or literals.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function divide(...args: ArithmeticArgument[]): GPUDataEvaluator {
  return reduceArithmetic('divide', args);
}

/**
 * Raises each row element in `base` to the corresponding power in `exponent`.
 */
export function pow(base: ArithmeticArgument, exponent: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('pow', [base, exponent]).output;
}

/**
 * Computes the square root of each row element.
 */
export function sqrt(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('sqrt', [arg]).output;
}

/**
 * Computes the absolute value of each row element.
 */
export function abs(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('abs', [arg]).output;
}

/**
 * Applies sine to each row element.
 */
export function sin(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('sin', [arg]).output;
}

/**
 * Applies cosine to each row element.
 */
export function cos(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('cos', [arg]).output;
}

/**
 * Applies tangent to each row element.
 */
export function tan(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('tan', [arg]).output;
}

/**
 * Applies the natural exponential to each row element.
 */
export function exp(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('exp', [arg]).output;
}

/**
 * Applies the natural logarithm to each row element.
 */
export function log(arg: ArithmeticArgument): GPUDataEvaluator {
  return new ArithmeticOperation('log', [arg]).output;
}

function reduceArithmetic(
  op: Extract<ArithmeticOp, 'add' | 'subtract' | 'multiply' | 'divide'>,
  args: ArithmeticArgument[]
): GPUDataEvaluator {
  let result: GPUDataEvaluator | number | number[] =
    typeof args[0] === 'number' || Array.isArray(args[0]) ? args[0] : getGPUDataEvaluator(args[0]);
  for (let i = 1; i < args.length; i++) {
    result = new ArithmeticOperation(op, [result, args[i]]).output;
  }
  return result instanceof GPUDataEvaluator ? result : GPUDataEvaluator.fromConstant(result);
}
