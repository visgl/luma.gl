// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {compileExpression} from '../../utils/expression';
import {ARITHMETIC_OPERATIONS, ArithmeticOperationInputs} from '../arithmetic-operation';
import {runRowComputation} from './common/row-transform';
import {formatLiteralValue, getWGSLType, getZeroValue} from './common/helper';

/** This is a port of @luma.gl/shadertools fp32 module */
const tanFP32WGSL = `const TWO_PI: f32 = 6.2831854820251465;
const PI_2: f32 = 1.5707963705062866;
const PI_16: f32 = 0.1963495463132858;

const SIN_TABLE_0: f32 = 0.19509032368659973;
const SIN_TABLE_1: f32 = 0.3826834261417389;
const SIN_TABLE_2: f32 = 0.5555702447891235;
const SIN_TABLE_3: f32 = 0.7071067690849304;

const COS_TABLE_0: f32 = 0.9807852506637573;
const COS_TABLE_1: f32 = 0.9238795042037964;
const COS_TABLE_2: f32 = 0.8314695954322815;
const COS_TABLE_3: f32 = 0.7071067690849304;

const INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var s = a;
  var r = a;

  r = r * x;
  s = s + r * INVERSE_FACTORIAL_3;

  r = r * x;
  s = s + r * INVERSE_FACTORIAL_5;

  r = r * x;
  s = s + r * INVERSE_FACTORIAL_7;

  r = r * x;
  s = s + r * INVERSE_FACTORIAL_9;

  return s;
}

fn sincos_taylor_fp32(a: f32) -> vec2<f32> {
  if (a == 0.0) {
    return vec2<f32>(0.0, 1.0);
  }

  let sin_t = sin_taylor_fp32(a);
  let cos_t = sqrt(1.0 - sin_t * sin_t);
  return vec2<f32>(sin_t, cos_t);
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / TWO_PI);
  let r = a - TWO_PI * z;

  var q = floor(r / PI_2 + 0.5);
  let j = i32(q);

  if (j < -2 || j > 2) {
    return 1.0 / 0.0;
  }

  var t = r - PI_2 * q;

  q = floor(t / PI_16 + 0.5);
  let k = i32(q);
  let abs_k = abs(k);

  if (abs_k > 4) {
    return 1.0 / 0.0;
  }

  t = t - PI_16 * q;

  let sincos_t = sincos_taylor_fp32(t);
  let sin_t = sincos_t.x;
  let cos_t = sincos_t.y;

  var u = 0.0;
  var v = 0.0;

  if (abs_k == 1) {
    u = COS_TABLE_0;
    v = SIN_TABLE_0;
  } else if (abs_k == 2) {
    u = COS_TABLE_1;
    v = SIN_TABLE_1;
  } else if (abs_k == 3) {
    u = COS_TABLE_2;
    v = SIN_TABLE_2;
  } else if (abs_k == 4) {
    u = COS_TABLE_3;
    v = SIN_TABLE_3;
  }

  var s = sin_t;
  var c = cos_t;

  if (k > 0) {
    s = u * sin_t + v * cos_t;
    c = u * cos_t - v * sin_t;
  } else if (k < 0) {
    s = u * sin_t - v * cos_t;
    c = u * cos_t + v * sin_t;
  }

  var sin_a = 0.0;
  var cos_a = 0.0;

  if (j == 0) {
    sin_a = s;
    cos_a = c;
  } else if (j == 1) {
    sin_a = c;
    cos_a = -s;
  } else if (j == -1) {
    sin_a = -c;
    cos_a = s;
  } else {
    sin_a = -s;
    cos_a = -c;
  }

  return sin_a / cos_a;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
`;

const arithmeticSource = `fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}

fn arithmetic_subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}

fn arithmetic_multiply(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x * y;
}

fn arithmetic_divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}

fn arithmetic_tan(x: f32) -> f32 {
  return {TAN_IMPL}(x);
}
`;

function getArithmeticSource(useFp32TanPrecisionWorkaround: boolean): string {
  return `${
    useFp32TanPrecisionWorkaround
      ? `${tanFP32WGSL}
`
      : ''
  }${arithmeticSource}`;
}

export const arithmetic: OperationHandler<ArithmeticOperationInputs> = async ({
  device,
  inputs,
  output,
  target
}) => {
  const operationType = output.type;
  const scalarType = getWGSLType(operationType);
  const zeroLiteral = getZeroValue(operationType);
  const namedInputs = inputs.namedInputs;
  const useFp32TanPrecisionWorkaround = device.info.gpu === 'intel';
  const source = getArithmeticSource(useFp32TanPrecisionWorkaround).replace(
    '{TAN_IMPL}',
    useFp32TanPrecisionWorkaround ? 'tan_fp32' : 'tan'
  );

  runRowComputation({
    module: {name: 'arithmetic', source},
    inputs: namedInputs,
    output,
    operationType,
    outputBuffer: target,
    expression: laneIndex =>
      compileExpression(inputs.expression, {
        operations: ARITHMETIC_OPERATIONS,
        inputs: namedInputs,
        laneIndex,
        formatInput: name => `${name}[${laneIndex}]`,
        formatOutOfBoundsInput: name => (namedInputs[name].size === 1 ? `${name}[0]` : zeroLiteral),
        formatLiteral: value => {
          const v = Array.isArray(value) ? (value[laneIndex] ?? 0) : value;
          return `${scalarType}(${formatLiteralValue(operationType, v)})`;
        },
        formatCall: (symbol, args) => `${symbol}(${args.join(', ')})`
      })
  });
  return {success: true};
};
