// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression, SlangType, SourceLocation} from './ast';
import type {ShaderOperation} from './ir';

type Resolve = (expression: Expression, expected?: SlangType) => SlangType;
type Fail = (message: string, location: SourceLocation) => never;
const UNARY_FLOAT = new Set([
  'acos',
  'asin',
  'atan',
  'ceil',
  'cos',
  'cosh',
  'degrees',
  'exp',
  'exp2',
  'floor',
  'fract',
  'inverseSqrt',
  'log',
  'log2',
  'radians',
  'round',
  'sin',
  'sinh',
  'sqrt',
  'tan',
  'tanh',
  'trunc',
  'dpdx',
  'dpdy',
  'fwidth'
]);
const OPERATIONS: Record<string, ShaderOperation> = {
  mix: 'mix',
  fract: 'fract',
  inverseSqrt: 'inverse-sqrt',
  dpdx: 'derivative-x',
  dpdy: 'derivative-y',
  atan2: 'atan2'
};
const SPELLINGS: Record<string, string> = {
  mix: 'lerp',
  inverseSqrt: 'rsqrt',
  dpdx: 'ddx',
  dpdy: 'ddy'
};

/** Resolve supported WGSL overloads before the shared backend sees canonical operations. */
export function resolveWGSLBuiltin(
  expression: Expression & {kind: 'call'},
  resolve: Resolve,
  fail: Fail
): SlangType | undefined {
  if (expression.callee.kind !== 'identifier') return undefined;
  const name = expression.callee.value;
  const count =
    UNARY_FLOAT.has(name) || ['abs', 'sign', 'all', 'any', 'length', 'normalize'].includes(name)
      ? 1
      : ['min', 'max', 'pow', 'atan2', 'dot', 'distance', 'cross', 'step', 'reflect'].includes(name)
        ? 2
        : ['clamp', 'mix', 'smoothstep', 'refract', 'select'].includes(name)
          ? 3
          : 0;
  if (!count) return undefined;
  if (expression.arguments.length !== count) fail('Builtin argument count mismatch', expression);
  const abstract = (value: Expression): boolean =>
    value.kind === 'number'
      ? !/[iuf]$/.test(value.value)
      : value.kind === 'unary'
        ? abstract(value.operand)
        : value.kind === 'binary'
          ? abstract(value.left) && abstract(value.right)
          : false;
  const values = name === 'select' ? expression.arguments.slice(0, 2) : expression.arguments;
  const concrete = values.find(argument => !abstract(argument));
  const floating = (value: Expression): boolean =>
    value.kind === 'number'
      ? /[.eEf]/.test(value.value)
      : value.kind === 'unary'
        ? floating(value.operand)
        : value.kind === 'binary'
          ? floating(value.left) || floating(value.right)
          : false;
  const context = concrete
    ? resolve(concrete)
    : values.some(floating)
      ? {name: 'float'}
      : undefined;
  const types: SlangType[] = expression.arguments.map((argument, index) =>
    resolve(
      argument,
      abstract(argument) && !(name === 'select' && index === 2)
        ? context
          ? {name: context.name.replace(/[2-4]$/, '')}
          : {
              name: ['abs', 'sign', 'min', 'max', 'clamp', 'select'].includes(name)
                ? 'int'
                : 'float'
            }
        : undefined
    )
  );
  const first = types[0];
  const numeric = /^(float|int|uint)([2-4])?$/.exec(first.name);
  const float = /^float([2-4])?$/.test(first.name);
  const scalar = {name: first.name.replace(/[2-4]$/, '')};
  const same = (left: SlangType, right: SlangType) => left.name === right.name;
  if (name === 'select') {
    if (
      !/^(float|int|uint|bool)[2-4]?$/.test(first.name) ||
      !same(first, types[1]) ||
      !['bool', 'bool' + (/[2-4]$/.exec(first.name)?.[0] || '')].includes(types[2].name)
    )
      fail('select requires matching values and a boolean condition', expression);
    Object.assign(expression, {kind: 'select', arguments: expression.arguments});
    return first;
  }
  if (['all', 'any'].includes(name)) {
    if (!/^bool[2-4]?$/.test(first.name)) fail('all/any require boolean values', expression);
    return {name: 'bool'};
  }
  if (!numeric) fail('Builtin requires numeric values', expression);
  if (['abs', 'sign'].includes(name) && numeric[1] === 'uint')
    fail('abs/sign require signed integer or floating values', expression);
  if (!['abs', 'sign', 'min', 'max', 'clamp'].includes(name) && !float)
    fail('Builtin requires f32 values', expression);
  for (let index = 1; index < types.length; index++) {
    const allowScalar = (name === 'mix' && index === 2) || (name === 'refract' && index === 2);
    if (!same(types[index], first) && !(allowScalar && same(types[index], scalar)))
      fail('Builtin argument types do not match', expression.arguments[index]);
  }
  if (
    ['dot', 'length', 'distance', 'normalize', 'reflect', 'refract'].includes(name) &&
    !/^float[2-4]$/.test(first.name)
  )
    fail('Vector builtin requires f32 vectors', expression);
  if (name === 'cross' && first.name !== 'float3') fail('cross requires vec3f', expression);
  if (name === 'refract' && types[2].name !== 'float')
    fail('refract requires a scalar ratio', expression);
  if (Object.hasOwn(OPERATIONS, name)) expression.operation = OPERATIONS[name];
  if (Object.hasOwn(SPELLINGS, name)) expression.callee.value = SPELLINGS[name];
  return ['dot', 'length', 'distance'].includes(name) ? {name: 'float'} : first;
}
