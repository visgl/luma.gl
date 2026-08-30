// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as experimentalModule from '@luma.gl/experimental';
import {
  and,
  column,
  literal,
  GPUDataFrame,
  GPUExpression,
  not,
  or,
  parameter,
  type GPUExpressionNode
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUTable} from '@luma.gl/experimental/gpu-tables';
import {describe, expect, expectTypeOf, test} from 'vitest';

describe('luDF immutable expression construction', () => {
  test('keeps expression helpers on the optional dataframe entry point', () => {
    expect(typeof column).toBe('function');
    expect(typeof literal).toBe('function');
    expect(typeof parameter).toBe('function');
    expect(typeof and).toBe('function');
    expect(typeof or).toBe('function');
    expect(typeof not).toBe('function');
    expect(typeof GPUExpression).toBe('function');
    expect('GPUExpression' in experimentalModule).toBe(false);
    expect('column' in experimentalModule).toBe(false);
  });

  test('builds immutable column, literal, and reusable parameter nodes', () => {
    const fare = column('fare');
    const minimumFare = literal(10);
    const threshold = parameter('minimum-fare', 12);
    const missingValue = literal(null);
    const enabled = parameter('enabled', true);

    expect(fare.node).toEqual({kind: 'column', name: 'fare'});
    expect(minimumFare.node).toEqual({kind: 'literal', value: 10});
    expect(threshold.node).toEqual({kind: 'parameter', name: 'minimum-fare', value: 12});
    expect(missingValue.node).toEqual({kind: 'literal', value: null});
    expect(enabled.node).toEqual({kind: 'parameter', name: 'enabled', value: true});
    expect(Object.isFrozen(fare)).toBe(true);
    expect(Object.isFrozen(fare.node)).toBe(true);
    expect(Object.isFrozen(threshold.node)).toBe(true);

    expectTypeOf(fare).toEqualTypeOf<GPUExpression<number | null, 'fare'>>();
    expectTypeOf(minimumFare).toEqualTypeOf<GPUExpression<10, never>>();
    expectTypeOf(enabled).toEqualTypeOf<GPUExpression<true, never>>();
  });

  test('deep-clones and freezes direct constructor inputs before immutable query planning', () => {
    const mutableColumn = {kind: 'column' as const, name: 'fare'};
    const mutableThreshold = {kind: 'literal' as const, value: 10};
    const mutableComparison = {
      kind: 'binary' as const,
      operator: 'greater-than' as const,
      left: mutableColumn,
      right: mutableThreshold
    };
    const mutableRoot = {
      kind: 'unary' as const,
      operator: 'not' as const,
      operand: mutableComparison
    };
    const predicate = new GPUExpression<boolean, 'fare'>(mutableRoot);
    const table = new GPUTable<{fare: 'float32'; category: 'uint32'}>({
      schema: {
        fields: [
          {name: 'fare', format: 'float32'},
          {name: 'category', format: 'uint32'}
        ],
        metadata: new Map()
      },
      bufferLayout: [
        {name: 'fare', format: 'float32'},
        {name: 'category', format: 'uint32'}
      ]
    });
    const source = new GPUDataFrame({table});
    const planned = source.filter(predicate).select(['category']);

    mutableColumn.name = 'unknown-after-validation';
    mutableThreshold.value = 1000;

    expect(planned.predicates[0].node).toEqual({
      kind: 'unary',
      operator: 'not',
      operand: {
        kind: 'binary',
        operator: 'greater-than',
        left: {kind: 'column', name: 'fare'},
        right: {kind: 'literal', value: 10}
      }
    });
    expect(Object.isFrozen(predicate.node)).toBe(true);
    if (predicate.node.kind !== 'unary' || predicate.node.operand.kind !== 'binary') {
      throw new Error('Expected a nested unary and binary expression');
    }
    expect(Object.isFrozen(predicate.node.operand)).toBe(true);
    expect(Object.isFrozen(predicate.node.operand.left)).toBe(true);
    expect(Object.isFrozen(predicate.node.operand.right)).toBe(true);
    expect(Object.isFrozen(mutableColumn)).toBe(false);
    expect(Object.isFrozen(mutableThreshold)).toBe(false);
    expect(() => source.filter(predicate)).not.toThrow();

    source.destroy();
    table.destroy();
  });

  test('preserves sibling arithmetic expressions and exact referenced-column unions', () => {
    const fare = column('fare');
    const distance = column('distance');
    const summed = fare.add(distance);
    const difference = fare.subtract(literal(2));
    const product = fare.multiply(literal(3));
    const quotient = fare.divide(literal(4));
    const negative = fare.negate();

    expect(summed.node).toEqual({
      kind: 'binary',
      operator: 'add',
      left: {kind: 'column', name: 'fare'},
      right: {kind: 'column', name: 'distance'}
    });
    expect(getBinaryOperator(difference.node)).toBe('subtract');
    expect(getBinaryOperator(product.node)).toBe('multiply');
    expect(getBinaryOperator(quotient.node)).toBe('divide');
    expect(negative.node).toEqual({
      kind: 'unary',
      operator: 'negate',
      operand: {kind: 'column', name: 'fare'}
    });
    expect(fare.node).toEqual({kind: 'column', name: 'fare'});
    expectTypeOf(summed).toEqualTypeOf<GPUExpression<number | null, 'fare' | 'distance'>>();
  });

  test('creates every closed comparison operator without interpolating source values', () => {
    const fare = column('fare');
    const minimumFare = literal(10);
    const comparisons = [
      [fare.equal(minimumFare), 'equal'],
      [fare.notEqual(minimumFare), 'not-equal'],
      [fare.greaterThan(minimumFare), 'greater-than'],
      [fare.greaterThanOrEqual(minimumFare), 'greater-than-or-equal'],
      [fare.lessThan(minimumFare), 'less-than'],
      [fare.lessThanOrEqual(minimumFare), 'less-than-or-equal']
    ] as const;

    for (const [comparison, operation] of comparisons) {
      expect(getBinaryOperator(comparison.node)).toBe(operation);
      expectTypeOf(comparison).toMatchTypeOf<GPUExpression<boolean, 'fare'>>();
    }
  });

  test('builds composable boolean expressions with explicit nullable checks', () => {
    const fareAccepted = column('fare').greaterThan(literal(10));
    const categoryPresent = column('category').isValid();
    const categoryMissing = column('category').isNull();
    const accepted = and(fareAccepted, or(categoryPresent, not(categoryMissing)));
    const fluentAccepted = fareAccepted.and(categoryPresent).or(categoryMissing.not());

    expect(getBinaryOperator(accepted.node)).toBe('and');
    expect(getBinaryOperator(fluentAccepted.node)).toBe('or');
    expect(categoryPresent.node).toEqual({
      kind: 'unary',
      operator: 'is-valid',
      operand: {kind: 'column', name: 'category'}
    });
    expect(categoryMissing.node).toEqual({
      kind: 'unary',
      operator: 'is-null',
      operand: {kind: 'column', name: 'category'}
    });
    expectTypeOf(accepted).toEqualTypeOf<GPUExpression<boolean, 'fare' | 'category'>>();
    expect(Object.isFrozen(accepted.node)).toBe(true);
    expect(Object.isFrozen(fareAccepted.node)).toBe(true);
  });

  test('treats application-provided names as opaque metadata, not shader source', () => {
    const unsafeName = 'fare); @compute fn injected() {';
    const unsafeParameter = 'threshold; } var<private> injected: u32;';
    const expression = column(unsafeName).greaterThan(parameter(unsafeParameter, 4));

    expect(expression.node).toEqual({
      kind: 'binary',
      operator: 'greater-than',
      left: {kind: 'column', name: unsafeName},
      right: {kind: 'parameter', name: unsafeParameter, value: 4}
    });
  });

  test('rejects empty identifiers, nonfinite numbers, and unsupported runtime literal types', () => {
    expect(() => column('')).toThrow(/column|name/i);
    expect(() => parameter('', 1)).toThrow(/parameter|name/i);
    expect(() => literal(Number.NaN)).toThrow(/finite|number/i);
    expect(() => literal(Number.POSITIVE_INFINITY)).toThrow(/finite|number/i);
    expect(() => parameter('threshold', Number.NEGATIVE_INFINITY)).toThrow(/finite|number/i);
    expect(() =>
      // @ts-expect-error The portable expression API intentionally excludes arbitrary strings.
      literal('premium')
    ).toThrow(/number|boolean|null/i);
  });
});

function getBinaryOperator(node: GPUExpressionNode): string {
  if (node.kind !== 'binary') {
    throw new Error('Expected a binary luDF expression');
  }
  return node.operator;
}
