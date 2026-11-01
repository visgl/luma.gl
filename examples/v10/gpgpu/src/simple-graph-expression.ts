// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUDataEvaluator} from '@luma.gl/graph/gpu-simple-graph';
import {
  GPUSimpleGraph,
  GPUSimpleGraphValue,
  simpleGraphOperations
} from '@luma.gl/graph/gpu-simple-graph';
import {createExpressionEvaluator, type ExpressionInputs} from './expression';

const parseGraphExpression = createExpressionEvaluator(
  simpleGraphOperations,
  GPUSimpleGraphValue.constant,
  (value): value is GPUSimpleGraphValue => value instanceof GPUSimpleGraphValue
);

export async function evaluateSimpleGraphExpression(
  device: Device,
  expression: string,
  inputs: ExpressionInputs
): Promise<{output: GPUDataEvaluator; nodeCount: number; destroy: () => void}> {
  // The shared Arrow table viewer still uses evaluators. Only this adapter reads that metadata;
  // expression authoring and execution use graph values and graph-owned resources.
  const upload = (input: GPUDataEvaluator): GPUSimpleGraphValue => {
    if (!input.value) throw new Error('Showcase inputs must have CPU data');
    return GPUSimpleGraphValue.upload(input.value, {
      type: input.type,
      size: input.size,
      offset: input.offset,
      stride: input.stride,
      normalized: input.normalized
    });
  };
  const values: ExpressionInputs<GPUSimpleGraphValue> = {};
  const graph = new GPUSimpleGraph(device);
  for (const [name, input] of Object.entries(inputs)) {
    if (input instanceof GPUDataEvaluator) {
      values[name] = graph.addValue(name, upload(input));
    } else {
      values[name] = {
        kind: 'segmented',
        values: graph.addValue(`${name}.values`, upload(input.values)),
        startIndices: graph.addValue(`${name}.startIndices`, upload(input.startIndices))
      };
    }
  }
  graph.addValue('output', parseGraphExpression(expression, values));
  const compiled = graph.compile({outputs: ['output']});
  try {
    const results = await compiled.run();
    // Borrow the result for the shared viewer's existing paged readback adapter.
    const source = compiled.outputs.output;
    if (!(source instanceof GPUDataEvaluator))
      throw new Error('Expected a single-chunk expression');
    const output = new GPUDataEvaluator({
      id: expression,
      buffer: results.output.data[0].buffer,
      type: source.type,
      size: source.size,
      length: source.length,
      offset: source.offset,
      stride: source.stride,
      normalized: source.normalized,
      format: source.format
    });
    return {
      output,
      nodeCount: compiled.nodes.length,
      destroy: () => {
        output.destroy();
        compiled.destroy();
      }
    };
  } catch (error) {
    compiled.destroy();
    throw error;
  }
}
