// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {
  GPURenderOperation,
  GPUCompositeOperation,
  GPUGraph,
  composite
} from '@luma.gl/graph/gpu-core';
declare const device: Device;
const operation = new GPURenderOperation<{dirty: boolean}>({
  id: 'typed',
  createNodes: () => [
    {
      type: 'render',
      id: 'pass',
      condition: {id: 'dirty', source: 'cpu', evaluate: parameters => parameters.dirty},
      compile: () => ({
        encode: context => {
          const dirty: boolean = context.parameters.dirty;
          void dirty;
        }
      })
    }
  ]
});
const graph = new GPUSimpleGraph<{dirty: boolean}>(device);
graph.add(operation);
graph.add([operation, [composite([operation])]]);
graph.add(new GPUCompositeOperation([operation]));
new GPUGraph<{dirty: boolean}>(device).add(operation);
const compiled = graph.compile();
compiled.run({parameters: {dirty: true}});
compiled.runSync({parameters: {dirty: false}});
// @ts-expect-error Required render parameters cannot disappear through add().
new GPUSimpleGraph(device).add(operation);
// @ts-expect-error Required render parameters cannot disappear through nested arrays.
new GPUSimpleGraph(device).add([[operation]]);
const stateless = new GPURenderOperation({id: 'stateless', createNodes: () => []});
graph.add(stateless);
graph.addRenderOperation(stateless);
graph.add(composite([stateless, operation]));
graph.add([stateless, [composite([operation, stateless])]]);
new GPUGraph<{dirty: boolean}>(device).add(stateless);
// @ts-expect-error A compatible sibling must not hide an incompatible operation.
new GPUSimpleGraph(device).add([stateless, operation]);
// @ts-expect-error Mixed composite children preserve every parameter requirement.
new GPUSimpleGraph(device).add(composite([stateless, operation]));
// @ts-expect-error Shared composite factories preserve child parameter requirements.
new GPUSimpleGraph(device).add(composite([operation]));
// @ts-expect-error Shared composite constructors preserve child parameter requirements.
new GPUSimpleGraph(device).add(new GPUCompositeOperation({operations: [composite([operation])]}));
// @ts-expect-error Different required parameter shapes are incompatible.
new GPUSimpleGraph<{other: number}>(device).add(operation);
// @ts-expect-error Non-void graph parameters are required.
compiled.run();
// @ts-expect-error Non-void graph parameters are required.
compiled.runSync();
// @ts-expect-error Parameter values must have the declared shape.
compiled.run({parameters: {missing: true}});
new GPUSimpleGraph(device).compile().run();
