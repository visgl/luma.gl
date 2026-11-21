// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseSQLExpression} from '@math.gl/sql/parser';
import {
  caseWhen,
  coalesce,
  nullIf,
  scalarFunction,
  column,
  literal,
  not,
  vector,
  cast,
  makeGPUExpressionFromPortableAST,
  makeGPUPredicateFromPortableAST
} from '@luma.gl/graph/gpu-dataframe';
import {getGPUExpressionColumnNames} from '../../src/gpu-dataframe/gpu-expression';

describe('GPU dataframe vector syntax', () => {
  test('bridges actual SQL arrays and freezes every component', () => {
    const expression = makeGPUExpressionFromPortableAST(
      parseSQLExpression('ARRAY[x,y,z]::REAL[3]')
    );
    expect(expression.node).toEqual(
      vector('float32x3', [column('x'), column('y'), column('z')]).node
    );
    expect(getGPUExpressionColumnNames(expression)).toEqual(['x', 'y', 'z']);
    expect(Object.isFrozen(expression.node)).toBe(true);
    if (expression.node.kind === 'vector') {
      expect(Object.isFrozen(expression.node.components)).toBe(true);
      expect(expression.node.components.every(Object.isFrozen)).toBe(true);
    }
    expect(cast(column('x'), 'sint32').node.kind).toBe('cast');
    expect(() => vector('float32x3', [literal(1), literal(2)])).toThrow();
  });
  test('converts SQL comparisons into composable predicates', () => {
    const predicate = makeGPUPredicateFromPortableAST(parseSQLExpression('x > 0'));
    expect(not(predicate).node).toEqual(not(column('x').greaterThan(literal(0))).node);
    expect(() => makeGPUPredicateFromPortableAST(parseSQLExpression('x + 1'))).toThrow(/boolean/);
  });

  test('rejects casts that change a known vector width', () => {
    const position = vector('float32x2', [column('x'), column('y')]);
    expect(() => cast(position, 'sint32')).toThrow(/width/);
    expect(cast(position, 'sint32x2').node).toMatchObject({format: 'sint32x2'});
    expect(() =>
      makeGPUExpressionFromPortableAST(parseSQLExpression('CAST(ARRAY[x,y]::REAL[2] AS INTEGER)'))
    ).toThrow(/width/);
    for (const operand of ['1 + ARRAY[x,y]::REAL[2]', 'ARRAY[x,y]::REAL[2] + 1']) {
      expect(() =>
        makeGPUExpressionFromPortableAST(parseSQLExpression(`CAST(${operand} AS INTEGER)`))
      ).toThrow(/matching widths/);
    }
  });

  test('rejects unsupported SQL widths, precision, strings and callbacks', () => {
    for (const sql of [
      'ARRAY[x]::REAL[1]',
      'ARRAY[x,y]::DOUBLE[2]',
      'CAST(x AS VARCHAR)',
      'sqrt(x)'
    ]) {
      expect(() => makeGPUExpressionFromPortableAST(parseSQLExpression(sql))).toThrow();
    }
  });
});

test('rejects scalar formats in vector constructors', () => {
  for (const format of ['float32', 'sint32', 'uint32'] as const) {
    expect(() => vector(format, [literal(1), literal(2)])).toThrow(/width/);
  }
});

test('lowers scalar SQL CASE into the typed DataFrame expression', () => {
  const expression = makeGPUExpressionFromPortableAST(
    parseSQLExpression('CASE WHEN x > 0 THEN x ELSE NULL END')
  );
  expect(expression.node).toEqual(
    caseWhen(column('x').greaterThan(literal(0)), column('x'), literal(null)).node
  );
  expect(getGPUExpressionColumnNames(expression)).toEqual(['x']);
});

test('shares numeric SQL functions with typed DataFrame expressions', () => {
  expect(makeGPUExpressionFromPortableAST(parseSQLExpression('CeIlInG(x)')).node).toEqual(
    scalarFunction('ceiling', column('x')).node
  );
  expect(() => makeGPUExpressionFromPortableAST(parseSQLExpression('ROUND(x, 2)'))).toThrow(
    /one argument/
  );
});

test('shares SQL null-handling syntax with typed DataFrame expressions', () => {
  const expression = makeGPUExpressionFromPortableAST(
    parseSQLExpression('COALESCE(NULLIF(x, 0), y, 99)')
  );
  expect(expression.node).toEqual(
    coalesce(nullIf(column('x'), literal(0)), coalesce(column('y'), literal(99))).node
  );
  expect(getGPUExpressionColumnNames(expression)).toEqual(['x', 'y']);
  expect(() => makeGPUExpressionFromPortableAST(parseSQLExpression('NULLIF(x)'))).toThrow(
    /two arguments/
  );
});
