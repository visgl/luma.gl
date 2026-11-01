// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUGraph, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

/** Compile once, then call run({positions, scale, offset}) for each batch of GPUVectors. */
export function compilePositionExpression(device: Device, useSimpleGraph = true) {
  const graph = useSimpleGraph ? new GPUSimpleGraph() : new GPUGraph();
  graph.vector('positions', 'float32');
  graph.scalar('scale', 'float32');
  graph.vector('offset', 'float32');
  graph.vector('transformed', 'float32');
  graph.add(
    new GPUExpressionOperation({
      output: 'transformed',
      expression: 'positions * scale + offset'
    })
  );
  return graph.compile(device, {outputs: ['transformed']});
}
