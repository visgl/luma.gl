// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedView,
  type GPUScalarFormat
} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

export type GPUElementwiseOperation = 'copy' | 'add' | 'subtract' | 'multiply' | 'min' | 'max';

export type GPUElementwiseProps<T extends GPUScalarFormat = GPUScalarFormat> = {
  id?: string;
  /** First packed scalar input. */
  input: GraphDataView<T>;
  /** Second packed scalar input required by binary operations. */
  inputB?: GraphDataView<T>;
  /** Caller-owned packed scalar output. */
  output: GraphDataView<T>;
  /** Operation applied independently to every row. */
  operation: GPUElementwiseOperation;
};

/**
 * Applies one scalar operation independently to each packed GPU row.
 *
 * `copy` is unary. `add`, `subtract`, `multiply`, `min`, and `max` are binary and require `inputB`.
 * All inputs and output must have identical format and logical length.
 */
export class GPUElementwise<T extends GPUScalarFormat = GPUScalarFormat> {
  readonly id: string;
  readonly input: GraphDataView<T>;
  readonly inputB?: GraphDataView<T>;
  readonly output: GraphDataView<T>;
  readonly operation: GPUElementwiseOperation;

  constructor(props: GPUElementwiseProps<T>) {
    this.id = props.id ?? 'gpu-elementwise';
    this.input = props.input;
    this.inputB = props.inputB;
    this.output = props.output;
    this.operation = props.operation;

    validatePackedView(this.input, SCALAR_FORMATS, `${this.id} input`);
    validatePackedView(this.output, SCALAR_FORMATS, `${this.id} output`);
    if (this.input.format !== this.output.format || this.input.length !== this.output.length) {
      throw new Error(`${this.id} input and output must have matching format and length`);
    }
    const isBinary = this.operation !== 'copy';
    if (isBinary && !this.inputB) {
      throw new Error(`${this.id} ${this.operation} requires inputB`);
    }
    if (this.inputB) {
      validatePackedView(this.inputB, SCALAR_FORMATS, `${this.id} inputB`);
      if (this.inputB.format !== this.input.format || this.inputB.length !== this.input.length) {
        throw new Error(`${this.id} inputB must match input format and length`);
      }
    }
    if (!['copy', 'add', 'subtract', 'multiply', 'min', 'max'].includes(this.operation)) {
      throw new Error(`${this.id} unsupported operation ${this.operation}`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = this.inputB ? [this.input, this.inputB, this.output] : [this.input, this.output];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.output.length === 0) return;

    const dispatchLayout = getBoundedDispatchLayout(
      'GPUElementwise',
      this.output.length,
      WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = makeShaderSource(this, dispatchLayout);
    const resources = this.inputB
      ? [
          {name: 'inputValues', view: this.input, usage: 'storage-read' as const},
          {name: 'inputBValues', view: this.inputB, usage: 'storage-read' as const},
          {name: 'outputValues', view: this.output, usage: 'storage-write' as const}
        ]
      : [
          {name: 'inputValues', view: this.input, usage: 'storage-read' as const},
          {name: 'outputValues', view: this.output, usage: 'storage-write' as const}
        ];

    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUElementwise',
        commandCount: 1,
        maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
        maximumInvocationCount:
          dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * WORKGROUP_SIZE,
        readByteLength: this.input.length * 4 * (this.inputB ? 2 : 1),
        writeByteLength: this.output.length * 4
      },
      resources: resources.map(resource => ({buffer: resource.view, usage: resource.usage})),
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {
            bindings: resources.map((resource, location) => ({
              name: resource.name,
              type: resource.usage === 'storage-read' ? 'read-only-storage' : 'storage',
              group: 0,
              location
            }))
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {};
            for (const resource of resources) {
              bindings[resource.name] = getViewBinding(resource.view, getBuffer);
            }
            computation.setBindings(bindings);
            computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}

function makeShaderSource(
  elementwise: GPUElementwise,
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): string {
  const shaderType =
    elementwise.input.format === 'uint32'
      ? 'u32'
      : elementwise.input.format === 'sint32'
        ? 'i32'
        : 'f32';
  const expression = getExpression(elementwise.operation);
  const inputB = elementwise.inputB
    ? `const INPUT_B_OFFSET: u32 = ${getViewElementOffset(elementwise.inputB)}u;\n@group(0) @binding(1) var<storage, read> inputBValues: array<${shaderType}>;`
    : '';
  const outputBinding = elementwise.inputB ? 2 : 1;
  const bLoad = elementwise.inputB ? 'let b = inputBValues[INPUT_B_OFFSET + index];' : '';

  return `const LENGTH: u32 = ${elementwise.output.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(elementwise.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(elementwise.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${inputB}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputValues: array<${shaderType}>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  let a = inputValues[INPUT_OFFSET + index];
  ${bLoad}
  outputValues[OUTPUT_OFFSET + index] = ${expression};
}`;
}

function getExpression(operation: GPUElementwiseOperation): string {
  switch (operation) {
    case 'copy': return 'a';
    case 'add': return 'a + b';
    case 'subtract': return 'a - b';
    case 'multiply': return 'a * b';
    case 'min': return 'min(a, b)';
    case 'max': return 'max(a, b)';
  }
}
