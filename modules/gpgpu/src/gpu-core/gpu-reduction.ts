// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandNode} from './gpu-command-node';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from './gpu-dispatch-utils';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  type GPUScalarFormat,
  validateMatchingVectorTopology,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';

const REDUCTION_WORKGROUP_SIZE = 256;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

export type GPUReductionStrategy = 'portable' | 'subgroups';

export function getGPUReductionStrategy(device: Device): GPUReductionStrategy {
  return getGPUShaderSubgroupStrategy(device, {requiresSubgroupId: true});
}

export type GPUReductionOperation = 'sum' | 'min' | 'max' | 'extent';

export type GPUReductionInput<T extends GPUScalarFormat = GPUScalarFormat> =
  | GraphDataView<T>
  | GraphVectorView<T>;

export type GPUReductionMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

export type GPUReductionProps<T extends GPUScalarFormat = GPUScalarFormat> = {
  id?: string;
  input: GPUReductionInput<T>;
  mask?: GPUReductionMask;
  output: GraphDataView<T>;
  operation: GPUReductionOperation;
};

/** Hierarchical reduction that expands to concrete command nodes. */
export class GPUReduction<T extends GPUScalarFormat = GPUScalarFormat> {
  readonly id: string;
  readonly input: GPUReductionInput<T>;
  readonly mask?: GPUReductionMask;
  readonly output: GraphDataView<T>;
  readonly operation: GPUReductionOperation;

  constructor(props: GPUReductionProps<T>) {
    this.id = props.id ?? 'gpu-reduction';
    this.input = props.input;
    this.mask = props.mask;
    this.output = props.output;
    this.operation = props.operation;
    for (const [chunkIndex, input] of getReductionInputs(this.input).entries()) {
      const name = this.input instanceof GraphVectorView ? ` input chunk ${chunkIndex}` : ' input';
      validatePackedView(input, SCALAR_FORMATS, `${this.id}${name}`);
      if (input.format !== this.input.format) {
        throw new Error(`${this.id}${name} format must match the input format`);
      }
    }
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
    if (getReductionInputs(this.input).some(input => input.buffer === this.output.buffer)) {
      throw new Error(`${this.id} inputs and output must use separate buffers`);
    }
    if (this.mask) {
      if (this.input instanceof GraphVectorView !== this.mask instanceof GraphVectorView) {
        throw new Error(`${this.id} input and mask must use the same view kind`);
      }
      for (const [chunkIndex, mask] of getReductionMasks(this.mask).entries()) {
        validatePackedUint32View(mask, `${this.id} mask chunk ${chunkIndex}`);
        if (mask.buffer === this.output.buffer) {
          throw new Error(`${this.id} mask and output must use separate buffers`);
        }
      }
      if (this.input instanceof GraphVectorView && this.mask instanceof GraphVectorView) {
        validateMatchingVectorTopology(this.input, this.mask, `${this.id} input and mask`);
      } else if (this.input.length !== this.mask.length) {
        throw new Error(`${this.id} input and mask lengths must match`);
      }
    }
  }

  /** Allocates hierarchical scratch and returns the concrete reduction command sequence. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    const inputs = getReductionInputs(this.input);
    const masks = this.mask ? getReductionMasks(this.mask) : undefined;
    if (
      inputs.some(input => input.buffer.graph !== graph) ||
      masks?.some(mask => mask.buffer.graph !== graph) ||
      this.output.buffer.graph !== graph
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    const nonEmptyInputs = inputs
      .map((input, chunkIndex) => ({input, mask: masks?.[chunkIndex]}))
      .filter(({input}) => input.length > 0);
    if (nonEmptyInputs.length === 0) {
      nodes.push(getClearReductionNode(graph, this.id, this.output));
      return nodes;
    }

    const valuesPerRow = this.operation === 'extent' ? 2 : 1;
    const needsValidity =
      this.operation !== 'sum' && (this.input.format === 'float32' || Boolean(this.mask));
    let reductionResult: ReductionResult<T>;

    if (nonEmptyInputs.length === 1) {
      reductionResult = getReductionLevels(
        graph,
        {
          id: this.id,
          format: this.input.format,
          operation: this.operation,
          inputValues: nonEmptyInputs[0].input,
          inputValidity: nonEmptyInputs[0].mask,
          inputLength: nonEmptyInputs[0].input.length,
          valuesPerRow,
          firstLevel: true,
          needsValidity
        },
        nodes
      );
    } else {
      const partialValues = createTransientView(
        graph,
        `${this.id}-chunk-values`,
        this.input.format,
        nonEmptyInputs.length * valuesPerRow
      ) as GraphDataView<T>;
      const partialValidity = needsValidity
        ? createTransientView(graph, `${this.id}-chunk-validity`, 'uint32', nonEmptyInputs.length)
        : undefined;

      nonEmptyInputs.forEach(({input, mask}, partialIndex) => {
        getReductionLevels(
          graph,
          {
            id: `${this.id}-chunk-${partialIndex}`,
            format: this.input.format,
            operation: this.operation,
            inputValues: input,
            inputValidity: mask,
            inputLength: input.length,
            valuesPerRow,
            firstLevel: true,
            needsValidity,
            finalValues: createPackedSubview(
              graph,
              partialValues,
              partialIndex * valuesPerRow,
              valuesPerRow
            ),
            finalValidity: partialValidity
              ? createPackedSubview(graph, partialValidity, partialIndex, 1)
              : undefined
          },
          nodes
        );
      });

      reductionResult = getReductionLevels(
        graph,
        {
          id: `${this.id}-merge`,
          format: this.input.format,
          operation: this.operation,
          inputValues: partialValues,
          inputValidity: partialValidity,
          inputLength: nonEmptyInputs.length,
          valuesPerRow,
          firstLevel: false,
          needsValidity
        },
        nodes
      );
    }

    nodes.push(
      getFinalizeReductionNode(graph, {
        id: `${this.id}-finalize`,
        format: this.input.format,
        inputValues: reductionResult.values,
        inputValidity: reductionResult.validity,
        output: this.output,
        valuesPerRow
      })
    );
    return nodes;
  }
}

type ReductionResult<T extends GPUScalarFormat> = {
  values: GraphDataView<T>;
  validity?: GraphDataView<'uint32'>;
};

type ReductionLevelsProps<T extends GPUScalarFormat> = {
  id: string;
  format: T;
  operation: GPUReductionOperation;
  inputValues: GraphDataView<T>;
  inputValidity?: GraphDataView<'uint32'>;
  inputLength: number;
  valuesPerRow: number;
  firstLevel: boolean;
  needsValidity: boolean;
  finalValues?: GraphDataView<T>;
  finalValidity?: GraphDataView<'uint32'>;
};

function getReductionLevels<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: ReductionLevelsProps<T>,
  nodes: GPUCommandNode<Parameters>[]
): ReductionResult<T> {
  let currentValues = props.inputValues;
  let currentValidity = props.inputValidity;
  let currentLength = props.inputLength;
  let levelIndex = 0;

  while (currentLength > 1 || levelIndex === 0) {
    const nextLength = Math.ceil(currentLength / REDUCTION_WORKGROUP_SIZE);
    const isLastLevel = nextLength === 1;
    const nextValues =
      isLastLevel && props.finalValues
        ? props.finalValues
        : (createTransientView(
            graph,
            `${props.id}-level-${levelIndex}-values`,
            props.format,
            nextLength * props.valuesPerRow
          ) as GraphDataView<T>);
    const nextValidity = props.needsValidity
      ? isLastLevel && props.finalValidity
        ? props.finalValidity
        : createTransientView(
            graph,
            `${props.id}-level-${levelIndex}-validity`,
            'uint32',
            nextLength
          )
      : undefined;
    nodes.push(
      getReductionLevelNode(graph, {
        id: `${props.id}-level-${levelIndex}`,
        format: props.format,
        operation: props.operation,
        inputValues: currentValues,
        inputValidity: currentValidity,
        outputValues: nextValues,
        outputValidity: nextValidity,
        inputLength: currentLength,
        valuesPerRow: props.valuesPerRow,
        firstLevel: props.firstLevel && levelIndex === 0
      })
    );
    currentValues = nextValues;
    currentValidity = nextValidity;
    currentLength = nextLength;
    levelIndex++;
  }

  return {values: currentValues, validity: currentValidity};
}

function createPackedSubview<T extends GPUScalarFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<T>,
  elementOffset: number,
  length: number
): GraphDataView<T> {
  return graph.createDataView(view.buffer, {
    format: view.format,
    length,
    byteOffset: view.byteOffset + elementOffset * view.rowByteLength
  });
}

function getReductionInputs<T extends GPUScalarFormat>(
  input: GPUReductionInput<T>
): readonly GraphDataView<T>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

function getReductionMasks(mask: GPUReductionMask): readonly GraphDataView<'uint32'>[] {
  return mask instanceof GraphVectorView ? mask.data : [mask];
}

function getReductionLevelNode<Parameters, T extends GPUScalarFormat>(
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
): GPUCommandNode<Parameters> {
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUReduction',
    props.inputLength,
    REDUCTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
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
  const normalizeMaskedFloatSum =
    props.firstLevel && props.inputValidity && props.format === 'float32' && isSum
      ? '\n    if (valid == 0u) { value = 0.0; secondValue = 0.0; }'
      : '';
  const readRawValue = `value = inputValues[INPUT_OFFSET + index];
    secondValue = value;
    valid = select(0u, 1u, ${finiteExpression});${normalizeMaskedFloatSum}`;
  const readFirst = props.firstLevel
    ? props.inputValidity
      ? `if (inputValidity[VALIDITY_OFFSET + index] != 0u) {
      ${readRawValue}
    }`
      : readRawValue
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
  const strategy = getGPUReductionStrategy(graph.device);
  const reductionSource =
    strategy === 'subgroups'
      ? getSubgroupReductionSource({format: props.format, operation: props.operation, combine})
      : getPortableReductionSource(combine);
  const source = /* wgsl */ `
${strategy === 'subgroups' ? 'enable subgroups;\nrequires subgroup_id;' : ''}
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
  @builtin(local_invocation_index) localInvocationIndex: u32,
  ${strategy === 'subgroups' ? '@builtin(subgroup_invocation_id) subgroupInvocationId: u32,\n  @builtin(subgroup_size) subgroupSize: u32,\n  @builtin(subgroup_id) subgroupId: u32,' : ''}
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, REDUCTION_WORKGROUP_SIZE)}
  if (workgroupIndex >= ${Math.ceil(props.inputLength / REDUCTION_WORKGROUP_SIZE)}u) {
    return;
  }
  let lane = localInvocationIndex;
  var value = ${zero};
  var secondValue = ${zero};
  var valid = 0u;
  if (index < ELEMENT_COUNT) {
    ${readFirst}
  }
  ${reductionSource}
  if (lane == 0u) {
    outputValues[OUTPUT_OFFSET + workgroupIndex * VALUES_PER_ROW] = firstScratch[0];
    ${isExtent ? 'outputValues[OUTPUT_OFFSET + workgroupIndex * VALUES_PER_ROW + 1u] = secondScratch[0];' : ''}
    ${props.outputValidity ? 'outputValidity[OUTPUT_VALIDITY_OFFSET + workgroupIndex] = validityScratch[0];' : ''}
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
  return getComputationNode(graph, {
    id: props.id,
    source,
    resources,
    bindings,
    dispatchLayout
  });
}

function getPortableReductionSource(combine: string): string {
  return `firstScratch[lane] = value;
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
  }`;
}

function getSubgroupReductionSource(props: {
  format: GPUScalarFormat;
  operation: GPUReductionOperation;
  combine: string;
}): string {
  const firstCollective = getSubgroupCollective(
    props.format,
    props.operation === 'extent' ? 'min' : props.operation,
    'value',
    'valid'
  );
  const secondCollective = getSubgroupCollective(
    props.format,
    props.operation === 'extent' ? 'max' : props.operation,
    'secondValue',
    'valid'
  );
  return `let subgroupValid = subgroupMax(valid);
  let subgroupFirst = ${firstCollective};
  let subgroupSecond = ${secondCollective};
  if (subgroupInvocationId == 0u) {
    firstScratch[subgroupId] = subgroupFirst;
    secondScratch[subgroupId] = subgroupSecond;
    validityScratch[subgroupId] = subgroupValid;
  }
  workgroupBarrier();
  let subgroupCount = ${REDUCTION_WORKGROUP_SIZE}u / subgroupSize;
  if (subgroupCount > 1u) {
    var stride = subgroupCount / 2u;
    loop {
      if (lane < stride) {
        ${props.combine}
      }
      workgroupBarrier();
      if (stride == 1u) { break; }
      stride = stride / 2u;
    }
  }`;
}

function getSubgroupCollective(
  format: GPUScalarFormat,
  operation: Exclude<GPUReductionOperation, 'extent'>,
  value: string,
  validity: string
): string {
  if (operation === 'sum') return `subgroupAdd(${value})`;
  const identity = getReductionIdentity(format, operation);
  const collective = operation === 'min' ? 'subgroupMin' : 'subgroupMax';
  return `${collective}(select(${identity}, ${value}, ${validity} != 0u))`;
}

function getReductionIdentity(
  format: GPUScalarFormat,
  operation: Exclude<GPUReductionOperation, 'sum' | 'extent'>
): string {
  if (format === 'uint32') return operation === 'min' ? '4294967295u' : '0u';
  if (format === 'sint32') return operation === 'min' ? '2147483647' : '(-2147483647 - 1)';
  return operation === 'min' ? '3.402823466e+38' : '-3.402823466e+38';
}

function getFinalizeReductionNode<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    format: T;
    inputValues: GraphDataView<T>;
    inputValidity?: GraphDataView<'uint32'>;
    output: GraphDataView<T>;
    valuesPerRow: number;
  }
): GPUCommandNode<Parameters> {
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
  return getComputationNode(graph, {
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

function getClearReductionNode<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<GPUScalarFormat>
): GPUCommandNode<Parameters> {
  const shaderType = getShaderType(output.format);
  const zero = getZeroLiteral(output.format);
  return getComputationNode(graph, {
    id: `${id}-clear`,
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

function getComputationNode<Parameters>(
  _graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount?: number;
    dispatchLayout?: GPUBoundedDispatchLayout;
  }
): GPUCommandNode<Parameters> {
  return {
    id: props.id,
    type: 'compute',
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
          if (props.dispatchLayout) {
            computation.dispatch(
              computePass,
              props.dispatchLayout.x,
              props.dispatchLayout.y,
              props.dispatchLayout.z
            );
          } else {
            computation.dispatch(computePass, props.dispatchCount ?? 1);
          }
        },
        destroy: () => computation.destroy()
      };
    }
  };
}

function getShaderType(format: GPUScalarFormat): 'u32' | 'i32' | 'f32' {
  return format === 'uint32' ? 'u32' : format === 'sint32' ? 'i32' : 'f32';
}

function getZeroLiteral(format: GPUScalarFormat): string {
  return format === 'uint32' ? '0u' : format === 'sint32' ? '0' : '0.0';
}
