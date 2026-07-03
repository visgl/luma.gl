// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  type GPUScalarFormat,
  validatePackedView
} from './graph-data-view-utils';

const REDUCTION_WORKGROUP_SIZE = 256;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

/** Operation performed by {@link GPUReduction}. */
export type GPUReductionOperation = 'sum' | 'min' | 'max' | 'extent';

/** Properties for a graph-native scalar reduction. */
export type GPUReductionProps<T extends GPUScalarFormat = GPUScalarFormat> = {
  id?: string;
  input: GraphDataView<T>;
  output: GraphDataView<T>;
  operation: GPUReductionOperation;
};

/**
 * Hierarchical reduction over packed 32-bit scalar graph views.
 *
 * @remarks Inputs and outputs are caller-owned. Hierarchical scratch is graph-owned, and adding
 * the reduction to a graph never submits work or reads data back.
 */
export class GPUReduction<T extends GPUScalarFormat = GPUScalarFormat> {
  readonly id: string;
  readonly input: GraphDataView<T>;
  readonly output: GraphDataView<T>;
  readonly operation: GPUReductionOperation;

  constructor(props: GPUReductionProps<T>) {
    this.id = props.id ?? 'gpu-reduction';
    this.input = props.input;
    this.output = props.output;
    this.operation = props.operation;
    validatePackedView(this.input, SCALAR_FORMATS, `${this.id} input`);
    validatePackedView(this.output, SCALAR_FORMATS, `${this.id} output`);
    if (this.input.format !== this.output.format) {
      throw new Error(`${this.id} input and output formats must match`);
    }
    if (!['sum', 'min', 'max', 'extent'].includes(this.operation)) {
      throw new Error(`${this.id} operation must be sum, min, max, or extent`);
    }
    const outputLength = this.operation === 'extent' ? 2 : 1;
    if (this.output.length !== outputLength) {
      throw new Error(`${this.id} ${this.operation} output must contain ${outputLength} row(s)`);
    }
    if (this.input.buffer === this.output.buffer) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
  }

  /** Adds hierarchical reduction passes and hidden scratch to a command graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.input.buffer.graph !== graph || this.output.buffer.graph !== graph) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.input.length === 0) {
      addClearReductionPass(graph, this.id, this.output);
      return;
    }

    const valuesPerRow = this.operation === 'extent' ? 2 : 1;
    const needsValidity =
      this.input.format === 'float32' && ['min', 'max', 'extent'].includes(this.operation);
    let inputValues: GraphDataView<T> = this.input;
    let inputValidity: GraphDataView<'uint32'> | undefined;
    let inputLength = this.input.length;
    let levelIndex = 0;

    while (true) {
      const outputLength = Math.ceil(inputLength / REDUCTION_WORKGROUP_SIZE);
      const outputValues = createTransientView(
        graph,
        `${this.id}-level-${levelIndex}-values`,
        this.input.format,
        outputLength * valuesPerRow
      ) as GraphDataView<T>;
      const outputValidity = needsValidity
        ? createTransientView(
            graph,
            `${this.id}-level-${levelIndex}-validity`,
            'uint32',
            outputLength
          )
        : undefined;
      addReductionLevelPass(graph, {
        id: `${this.id}-level-${levelIndex}`,
        format: this.input.format,
        operation: this.operation,
        inputValues,
        inputValidity,
        outputValues,
        outputValidity,
        inputLength,
        valuesPerRow,
        firstLevel: levelIndex === 0
      });
      inputValues = outputValues;
      inputValidity = outputValidity;
      inputLength = outputLength;
      levelIndex++;
      if (inputLength === 1) {
        break;
      }
    }

    addFinalizeReductionPass(graph, {
      id: `${this.id}-finalize`,
      format: this.input.format,
      inputValues,
      inputValidity,
      output: this.output,
      valuesPerRow
    });
  }
}

function addReductionLevelPass<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    format: T;
    operation: GPUReductionOperation;
    inputValues: GraphDataView<T>;
    inputValidity?: GraphDataView<'uint32'>;
    outputValues: GraphDataView<T>;
    outputValidity?: GraphDataView<'uint32'>;
    inputLength: number;
    valuesPerRow: number;
    firstLevel: boolean;
  }
): void {
  const shaderType = getShaderType(props.format);
  const zero = getZeroLiteral(props.format);
  const isSum = props.operation === 'sum';
  const isExtent = props.operation === 'extent';
  const validityBinding = props.inputValidity
    ? '@group(0) @binding(1) var<storage, read> inputValidity: array<u32>;'
    : '';
  const outputValuesBinding = props.inputValidity ? 2 : 1;
  const outputValidityBinding = outputValuesBinding + 1;
  const finiteExpression =
    props.format === 'float32' ? 'value == value && abs(value) <= 3.402823466e+38' : 'true';
  const readFirst = props.firstLevel
    ? `value = inputValues[INPUT_OFFSET + index];
    secondValue = value;
    valid = select(0u, 1u, ${finiteExpression});`
    : `value = inputValues[INPUT_OFFSET + index * VALUES_PER_ROW];
    secondValue = inputValues[INPUT_OFFSET + index * VALUES_PER_ROW + ${isExtent ? '1u' : '0u'}];
    ${props.inputValidity ? 'valid = inputValidity[VALIDITY_OFFSET + index];' : 'valid = 1u;'}`;
  const combine = isSum
    ? 'firstScratch[lane] = firstScratch[lane] + firstScratch[lane + stride];'
    : `let rightValid = validityScratch[lane + stride];
      if (rightValid != 0u) {
        if (validityScratch[lane] == 0u) {
          firstScratch[lane] = firstScratch[lane + stride];
          secondScratch[lane] = secondScratch[lane + stride];
        } else {
          firstScratch[lane] = ${props.operation === 'max' ? 'max' : 'min'}(firstScratch[lane], firstScratch[lane + stride]);
          secondScratch[lane] = ${isExtent ? 'max' : props.operation === 'max' ? 'max' : 'min'}(secondScratch[lane], secondScratch[lane + stride]);
        }
        validityScratch[lane] = 1u;
      }`;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.inputLength}u;
const VALUES_PER_ROW: u32 = ${props.valuesPerRow}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.inputValues)}u;
${props.inputValidity ? `const VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.inputValidity)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.outputValues)}u;
${props.outputValidity ? `const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.outputValidity)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${validityBinding}
@group(0) @binding(${outputValuesBinding}) var<storage, read_write> outputValues: array<${shaderType}>;
${props.outputValidity ? `@group(0) @binding(${outputValidityBinding}) var<storage, read_write> outputValidity: array<u32>;` : ''}
var<workgroup> firstScratch: array<${shaderType}, ${REDUCTION_WORKGROUP_SIZE}>;
var<workgroup> secondScratch: array<${shaderType}, ${REDUCTION_WORKGROUP_SIZE}>;
var<workgroup> validityScratch: array<u32, ${REDUCTION_WORKGROUP_SIZE}>;

@compute @workgroup_size(${REDUCTION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let index = globalId.x;
  let lane = localId.x;
  var value = ${zero};
  var secondValue = ${zero};
  var valid = 0u;
  if (index < ELEMENT_COUNT) {
    ${readFirst}
  }
  firstScratch[lane] = value;
  secondScratch[lane] = secondValue;
  validityScratch[lane] = valid;
  workgroupBarrier();
  var stride = ${REDUCTION_WORKGROUP_SIZE / 2}u;
  loop {
    if (lane < stride) {
      ${combine}
    }
    workgroupBarrier();
    if (stride == 1u) { break; }
    stride = stride / 2u;
  }
  if (lane == 0u) {
    outputValues[OUTPUT_OFFSET + workgroupId.x * VALUES_PER_ROW] = firstScratch[0];
    ${isExtent ? 'outputValues[OUTPUT_OFFSET + workgroupId.x * VALUES_PER_ROW + 1u] = secondScratch[0];' : ''}
    ${props.outputValidity ? 'outputValidity[OUTPUT_VALIDITY_OFFSET + workgroupId.x] = validityScratch[0];' : ''}
  }
}`;

  const resources: GraphBufferUse[] = [
    {buffer: props.inputValues, usage: 'storage-read'},
    ...(props.inputValidity
      ? ([{buffer: props.inputValidity, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    {buffer: props.outputValues, usage: 'storage-write'},
    ...(props.outputValidity
      ? ([{buffer: props.outputValidity, usage: 'storage-write'}] as GraphBufferUse[])
      : [])
  ];
  const bindings: Record<string, GraphDataView> = {inputValues: props.inputValues};
  if (props.inputValidity) bindings['inputValidity'] = props.inputValidity;
  bindings['outputValues'] = props.outputValues;
  if (props.outputValidity) bindings['outputValidity'] = props.outputValidity;
  addComputationPass(graph, {
    id: props.id,
    source,
    resources,
    bindings,
    dispatchCount: Math.ceil(props.inputLength / REDUCTION_WORKGROUP_SIZE)
  });
}

function addFinalizeReductionPass<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    format: T;
    inputValues: GraphDataView<T>;
    inputValidity?: GraphDataView<'uint32'>;
    output: GraphDataView<T>;
    valuesPerRow: number;
  }
): void {
  const shaderType = getShaderType(props.format);
  const zero = getZeroLiteral(props.format);
  const outputLines = Array.from({length: props.valuesPerRow}, (_, index) => {
    const value = `inputValues[INPUT_OFFSET + ${index}u]`;
    return `outputValues[OUTPUT_OFFSET + ${index}u] = ${props.inputValidity ? `select(${zero}, ${value}, valid)` : value};`;
  }).join('\n  ');
  const source = /* wgsl */ `
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.inputValues)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${props.inputValidity ? `const VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.inputValidity)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${props.inputValidity ? '@group(0) @binding(1) var<storage, read> inputValidity: array<u32>;' : ''}
@group(0) @binding(${props.inputValidity ? 2 : 1}) var<storage, read_write> outputValues: array<${shaderType}>;
@compute @workgroup_size(1) fn main() {
  ${props.inputValidity ? 'let valid = inputValidity[VALIDITY_OFFSET] != 0u;' : ''}
  ${outputLines}
}`;
  addComputationPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.inputValues, usage: 'storage-read'},
      ...(props.inputValidity
        ? ([{buffer: props.inputValidity, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      {buffer: props.output, usage: 'storage-write'}
    ],
    bindings: {
      inputValues: props.inputValues,
      ...(props.inputValidity ? {inputValidity: props.inputValidity} : {}),
      outputValues: props.output
    },
    dispatchCount: 1
  });
}

function addClearReductionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<GPUScalarFormat>
): void {
  const passId = `${id}-clear`;
  const shaderType = getShaderType(output.format);
  const zero = getZeroLiteral(output.format);
  addComputationPass(graph, {
    id: passId,
    source: `const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<${shaderType}>;
@compute @workgroup_size(1) fn main() {
  for (var index = 0u; index < ${output.length}u; index++) { outputValues[OUTPUT_OFFSET + index] = ${zero}; }
}`,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputValues: output},
    dispatchCount: 1
  });
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const bindingNames = Object.keys(props.bindings);
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: bindingNames.map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getShaderType(format: GPUScalarFormat): 'u32' | 'i32' | 'f32' {
  return format === 'uint32' ? 'u32' : format === 'sint32' ? 'i32' : 'f32';
}

function getZeroLiteral(format: GPUScalarFormat): string {
  return format === 'uint32' ? '0u' : format === 'sint32' ? '0' : '0.0';
}
