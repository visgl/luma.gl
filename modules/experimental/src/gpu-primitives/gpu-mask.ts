// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const MASK_WORKGROUP_SIZE = 256;

/** Logical operation used to compose packed GPU selection masks. */
export type GPUMaskOperation = 'and' | 'or' | 'xor' | 'difference' | 'not';

/** One packed mask or an ordered vector of packed mask chunks. */
export type GPUMaskInput = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties for one graph-native, source-order-preserving mask composition. */
export type GPUMaskProps = {
  /** Prefix for generated command-graph node identifiers. */
  id?: string;
  /** Input masks with matching lengths and, for vectors, matching chunk topology. */
  inputs: readonly GPUMaskInput[];
  /** Caller-owned output mask with the same kind and topology as every input. */
  output: GPUMaskInput;
  /** Boolean operation. Defaults to intersection. */
  operation?: GPUMaskOperation;
};

/**
 * Composes GPU-resident visibility and selection masks without CPU synchronization.
 *
 * Nonzero input values are true. Output values are always canonical zero or one. Vector inputs
 * retain their original chunk boundaries and never cause implicit concatenation or repacking.
 */
export class GPUMask {
  /** Prefix for generated command-graph node identifiers. */
  readonly id: string;
  /** Packed source masks. */
  readonly inputs: readonly GPUMaskInput[];
  /** Caller-owned, nonaliasing packed result. */
  readonly output: GPUMaskInput;
  /** Boolean operation applied independently to each row. */
  readonly operation: GPUMaskOperation;

  constructor(props: GPUMaskProps) {
    this.id = props.id ?? 'gpu-mask';
    this.inputs = props.inputs;
    this.output = props.output;
    this.operation = props.operation ?? 'and';

    if (this.inputs.length === 0) {
      throw new Error(`${this.id} requires at least one input mask`);
    }
    if (this.operation === 'not' && this.inputs.length !== 1) {
      throw new Error(`${this.id} not requires exactly one input mask`);
    }

    const outputChunks = getMaskChunks(this.output);
    const outputIsVector = this.output instanceof GraphVectorView;
    for (const chunk of outputChunks) {
      validatePackedUint32View(chunk, `${this.id} output`);
    }
    for (const [inputIndex, input] of this.inputs.entries()) {
      if (input instanceof GraphVectorView !== outputIsVector) {
        throw new Error(`${this.id} inputs and output must use the same view kind`);
      }
      for (const chunk of getMaskChunks(input)) {
        validatePackedUint32View(chunk, `${this.id} input ${inputIndex}`);
      }
      if (input instanceof GraphVectorView && this.output instanceof GraphVectorView) {
        validateMatchingVectorTopology(input, this.output, `${this.id} input ${inputIndex}`);
      } else if (input.length !== this.output.length) {
        throw new Error(`${this.id} input ${inputIndex} length must equal output length`);
      }
      for (const inputChunk of getMaskChunks(input)) {
        if (outputChunks.some(outputChunk => outputChunk.buffer === inputChunk.buffer)) {
          throw new Error(`${this.id} output must use separate buffers from input masks`);
        }
      }
    }
  }

  /**
   * Adds one compute pass per nonempty source chunk.
   *
   * The caller remains responsible for graph compilation, command submission, and readback.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const outputChunks = getMaskChunks(this.output);
    const inputChunks = this.inputs.map(getMaskChunks);
    for (const chunk of [...outputChunks, ...inputChunks.flat()]) {
      if (chunk.buffer.graph !== graph) {
        throw new Error(`${this.id} masks must belong to the target graph`);
      }
    }

    for (const [chunkIndex, output] of outputChunks.entries()) {
      if (output.length === 0) {
        continue;
      }
      const inputs = inputChunks.map(chunks => chunks[chunkIndex]);
      addMaskPass(graph, {
        id: this.output instanceof GraphVectorView ? `${this.id}-chunk-${chunkIndex}` : this.id,
        inputs,
        output,
        operation: this.operation
      });
    }
  }
}

/** Returns the original, ordered source chunks without materializing a packed vector. */
function getMaskChunks(input: GPUMaskInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Adds one independently composable packed-mask compute node. */
function addMaskPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    inputs: readonly GraphDataView<'uint32'>[];
    output: GraphDataView<'uint32'>;
    operation: GPUMaskOperation;
  }
): void {
  const inputDeclarations = props.inputs
    .map(
      (input, inputIndex) =>
        `const INPUT_${inputIndex}_OFFSET: u32 = ${getViewElementOffset(input)}u;
@group(0) @binding(${inputIndex}) var<storage, read> input${inputIndex}: array<u32>;`
    )
    .join('\n');
  const conditions = props.inputs.map(
    (_, inputIndex) => `input${inputIndex}[INPUT_${inputIndex}_OFFSET + index] != 0u`
  );
  const expression = getMaskExpression(props.operation, conditions);
  const outputBinding = props.inputs.length;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${inputDeclarations}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputMask: array<u32>;

@compute @workgroup_size(${MASK_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT) {
    return;
  }
  outputMask[OUTPUT_OFFSET + index] = select(0u, 1u, ${expression});
}`;
  const bindings: Record<string, GraphDataView<'uint32'>> = {};
  const resources: GraphBufferUse[] = [];
  for (const [inputIndex, input] of props.inputs.entries()) {
    bindings[`input${inputIndex}`] = input;
    resources.push({buffer: input, usage: 'storage-read'});
  }
  bindings['outputMask'] = props.output;
  resources.push({buffer: props.output, usage: 'storage-write'});

  graph.addComputePass({
    id: props.id,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolvedBindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, Math.ceil(props.output.length / MASK_WORKGROUP_SIZE));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Constructs a boolean WGSL expression with explicit zero/nonzero mask semantics. */
function getMaskExpression(operation: GPUMaskOperation, conditions: readonly string[]): string {
  switch (operation) {
    case 'and':
      return conditions.map(condition => `(${condition})`).join(' && ');
    case 'or':
      return conditions.map(condition => `(${condition})`).join(' || ');
    case 'xor':
      return `(${conditions.map(condition => `select(0u, 1u, ${condition})`).join(' ^ ')}) != 0u`;
    case 'difference':
      return [
        `(${conditions[0]})`,
        ...conditions.slice(1).map(condition => `!(${condition})`)
      ].join(' && ');
    case 'not':
      return `!(${conditions[0]})`;
  }
}
