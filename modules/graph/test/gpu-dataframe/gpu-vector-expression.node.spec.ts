// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseSQLExpression} from '@math.gl/core/sql';
import {
  column,
  literal,
  vector,
  cast,
  makeGPUExpressionFromPortableAST
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
