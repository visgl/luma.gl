// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseSQLExpression} from '@math.gl/expressions/sql';
import {
  column,
  literal,
  parameter,
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

import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
import {GPUTable} from '@luma.gl/graph/gpu-tables';
import {
  encodeGPUQueryExpressionControls,
  makeGPUQueryExpressionShaderPlan
} from '../../src/gpu-dataframe/gpu-expression-shader';

test('plans typed vector execution and rejects incompatible widths before allocation', () => {
  const table = new GPUTable({
    schema: {
      fields: [
        {name: 'x', format: 'float32'},
        {name: 'y', format: 'sint32'},
        {name: 'position', format: 'float32x3'}
      ],
      metadata: new Map()
    }
  });
  const frame = new GPUDataFrame({table});
  try {
    const expression = vector('float32x3', [column('x'), column('y'), literal(null)]);
    const query = frame.withColumn('result', expression, {format: 'float32x3'});
    const plan = makeGPUQueryExpressionShaderPlan(frame, [], query.derivedColumns, ['result']);
    expect(plan.outputs[0].format).toBe('float32x3');
    expect(plan.outputs[0].nullable).toBe(true);
    expect(plan.statements.join('\n')).toContain('vec3<f32>');
    expect(plan.statements.join('\n')).toContain('f32(');
    expect(() =>
      frame.withColumn('bad', cast(column('position'), 'float32x2'), {format: 'float32x2'})
    ).toThrow(/width/);
    const ordered = column('position').lessThan(column('position'));
    expect(() => makeGPUQueryExpressionShaderPlan(frame, [ordered])).toThrow(/ordering/);
    const equal = makeGPUQueryExpressionShaderPlan(frame, [
      column('position').equal(column('position'))
    ]);
    expect(equal.statements.join('\n')).toContain('all(');
    const mismatched = frame.withColumn('bad', column('position').add(literal(1)), {
      format: 'float32x3'
    });
    expect(() =>
      makeGPUQueryExpressionShaderPlan(frame, [], mismatched.derivedColumns, ['bad'])
    ).toThrow(/broadcast/);
    expect(() =>
      makeGPUQueryExpressionShaderPlan(
        frame,
        [],
        [{name: 'bad', expression: cast(literal(true) as any, 'sint32')}],
        ['bad']
      )
    ).toThrow(/numeric/i);
  } finally {
    frame.destroy();
    table.destroy();
  }
});

test('rejects scalar formats in vector constructors', () => {
  for (const format of ['float32', 'sint32', 'uint32'] as const) {
    expect(() => vector(format, [literal(1), literal(2)])).toThrow(/width/);
  }
});

test('integer vector literals saturate, truncate and retain full integer precision', () => {
  const table = new GPUTable({schema: {fields: [], metadata: new Map()}});
  const frame = new GPUDataFrame({table});
  try {
    const expression = vector('uint32x3', [
      literal(-1),
      parameter('component', 1.5),
      literal(4294967294)
    ]);
    const plan = makeGPUQueryExpressionShaderPlan(
      frame,
      [],
      [{name: 'value', expression}],
      ['value']
    );
    expect(Array.from(encodeGPUQueryExpressionControls(plan.controls, {}))).toEqual([
      0, 1, 1, 1, 4294967294, 1
    ]);
  } finally {
    frame.destroy();
    table.destroy();
  }
});

test('retains cast formats in subsequent scalar analytics', () => {
  const table = new GPUTable<{x: 'uint32'}>({
    schema: {fields: [{name: 'x', format: 'uint32'}], metadata: new Map()}
  });
  const frame = new GPUDataFrame({table});
  try {
    const query = frame.withColumn('fractional', cast(column('x'), 'float32'));
    expect(query.derivedColumns[0].format).toBe('float32');
    expect(() => query.histogram('fractional', {edges: [0, 0.5, 1]})).not.toThrow();
    const chained = frame
      .withColumn('copy', column('x'))
      .withColumn('fractional', cast(column('copy'), 'float32'));
    expect(chained.derivedColumns[1].format).toBe('float32');
  } finally {
    frame.destroy();
    table.destroy();
  }
});
