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
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  type GPUScalarFormat,
  validatePackedView
} from './graph-data-view-utils';

const REDUCTION_WORKGROUP_SIZE = 256;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

/**
 * Operation performed by {@link GPUReduction}.
 *
 * `sum`, `min`, and `max` produce one row. `extent` produces two rows containing the minimum and
 * maximum respectively.
 */
export type GPUReductionOperation = 'sum' | 'min' | 'max' | 'extent';

/**
 * One packed scalar chunk or an ordered, fixed-width scalar vector reduced by
 * {@link GPUReduction}.
 */
export type GPUReductionInput<T extends GPUScalarFormat = GPUScalarFormat> =
  | GraphDataView<T>
  | GraphVectorView<T>;

/** Properties for a graph-native scalar reduction. */
export type GPUReductionProps<T extends GPUScalarFormat = GPUScalarFormat> = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** Packed scalar data view or ordered vector of packed scalar chunks. */
  input: GPUReductionInput<T>;
  /** Caller-owned result view: one row, or two rows for `extent`. */
  output: GraphDataView<T>;
  /** Aggregate to compute. */
  operation: GPUReductionOperation;
};

/**
 * Hierarchical reduction over packed 32-bit scalar graph data views and vectors.
 *
 * Each 256-thread workgroup reduces at most 256 input rows to one partial row. Additional levels
 * repeat that process until one row remains. Multi-chunk vectors first produce one partial per
 * non-empty chunk, then reduce those partials to one global result.
 *
 * @remarks Inputs and outputs are caller-owned. Hierarchical scratch is graph-owned. Adding the
 * reduction to a graph only declares nodes and resources; it does not compile, encode, submit,
 * map, or read data back.
 */
export class GPUReduction<T extends GPUScalarFormat = GPUScalarFormat> {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Scalar input chunk or vector. */
  readonly input: GPUReductionInput<T>;
  /** Caller-owned result view. */
  readonly output: GraphDataView<T>;
  /** Aggregate computed by this reduction. */
  readonly operation: GPUReductionOperation;

  /**
   * Creates and validates a graph-native reduction description.
   *
   * @throws If views are not packed 32-bit scalar data, formats differ, the output has the wrong
   * length, or input and output use the same physical graph buffer.
   */
  constructor(props: GPUReductionProps<T>) {
    this.id = props.id ?? 'gpu-reduction';
    this.input = props.input;
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
  }

  /**
   * Adds hierarchical reduction passes and graph-owned scratch to a command graph.
   *
   * Empty inputs add a one-thread clear pass. A single non-empty chunk is reduced directly.
   * Multiple non-empty chunks are reduced independently, then their partial rows are merged. A
   * final pass converts an invalid floating-point min/max/extent result to zero and writes the
   * caller-owned output.
   *
   * @param graph Mutable graph that owns all input/output handles and generated scratch.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const inputs = getReductionInputs(this.input);
    if (inputs.some(input => input.buffer.graph !== graph) || this.output.buffer.graph !== graph) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    const nonEmptyInputs = inputs.filter(input => input.length > 0);
    if (nonEmptyInputs.length === 0) {
      addClearReductionPass(graph, this.id, this.output);
      return;
    }

    const valuesPerRow = this.operation === 'extent' ? 2 : 1;
    const needsValidity =
      this.input.format === 'float32' && ['min', 'max', 'extent'].includes(this.operation);
    let reductionResult: ReductionResult<T>;

    if (nonEmptyInputs.length === 1) {
      reductionResult = addReductionLevels(graph, {
        id: this.id,
        format: this.input.format,
        operation: this.operation,
        inputValues: nonEmptyInputs[0],
        inputLength: nonEmptyInputs[0].length,
        valuesPerRow,
        firstLevel: true,
        needsValidity
      });
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

      nonEmptyInputs.forEach((input, partialIndex) => {
        addReductionLevels(graph, {
          id: `${this.id}-chunk-${partialIndex}`,
          format: this.input.format,
          operation: this.operation,
          inputValues: input,
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
        });
      });

      reductionResult = addReductionLevels(graph, {
        id: `${this.id}-merge`,
        format: this.input.format,
        operation: this.operation,
        inputValues: partialValues,
        inputValidity: partialValidity,
        inputLength: nonEmptyInputs.length,
        valuesPerRow,
        firstLevel: false,
        needsValidity
      });
    }

    addFinalizeReductionPass(graph, {
      id: `${this.id}-finalize`,
      format: this.input.format,
      inputValues: reductionResult.values,
      inputValidity: reductionResult.validity,
      output: this.output,
      valuesPerRow
    });
  }
}

type ReductionResult<T extends GPUScalarFormat> = {
  /** One packed row for sum/min/max, or two packed components for extent. */
  values: GraphDataView<T>;
  /** One row indicating whether a finite min/max/extent value was observed. */
  validity?: GraphDataView<'uint32'>;
};

type ReductionLevelsProps<T extends GPUScalarFormat> = {
  /** Prefix for generated level node and resource IDs. */
  id: string;
  /** Scalar format of all value views. */
  format: T;
  /** Aggregate computed at every level. */
  operation: GPUReductionOperation;
  /** Packed values consumed by the first generated level. */
  inputValues: GraphDataView<T>;
  /** Optional validity rows paired with already-reduced input rows. */
  inputValidity?: GraphDataView<'uint32'>;
  /** Number of logical rows consumed by the first generated level. */
  inputLength: number;
  /** Components in each partial row: two for extent, otherwise one. */
  valuesPerRow: number;
  /** Whether the first level reads raw scalar rows instead of partial rows. */
  firstLevel: boolean;
  /** Whether levels must preserve finite-value validity. */
  needsValidity: boolean;
  /** Optional destination for the last level's value row. */
  finalValues?: GraphDataView<T>;
  /** Optional destination for the last level's validity row. */
  finalValidity?: GraphDataView<'uint32'>;
};

/**
 * Adds a complete hierarchy that reduces `inputLength` rows to one partial row.
 *
 * Level `n` consumes the views produced by level `n - 1`. Each level emits
 * `ceil(currentLength / 256)` rows, so the hierarchy always converges. Intermediate levels allocate
 * graph-owned views. When supplied, `finalValues` and `finalValidity` replace only the last
 * allocation; multi-chunk reduction uses that facility to write each chunk's partial directly into
 * its slot in the shared merge input.
 */
function addReductionLevels<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: ReductionLevelsProps<T>
): ReductionResult<T> {
  let currentValues = props.inputValues;
  let currentValidity = props.inputValidity;
  let currentLength = props.inputLength;
  let levelIndex = 0;

  // One workgroup produces one next-level row. The last level is therefore the first level whose
  // output contains exactly one row.
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
    addReductionLevelPass(graph, {
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
    });
    currentValues = nextValues;
    currentValidity = nextValidity;
    currentLength = nextLength;
    levelIndex++;
  }

  return {values: currentValues, validity: currentValidity};
}

/** Creates a packed logical slice without allocating or changing hazard granularity. */
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

/** Normalizes a single data view or vector view into its ordered chunk list. */
function getReductionInputs<T extends GPUScalarFormat>(
  input: GPUReductionInput<T>
): readonly GraphDataView<T>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Adds one 256-way reduction level from raw or already-reduced rows. */
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

/** Copies the single partial row to caller output and maps an invalid aggregate to zero. */
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

/** Writes the documented zero result for an input with no rows. */
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

/** Wraps generated WGSL in a graph compute node with deferred physical buffer resolution. */
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

/** Returns the WGSL scalar type corresponding to a supported GPU storage format. */
function getShaderType(format: GPUScalarFormat): 'u32' | 'i32' | 'f32' {
  return format === 'uint32' ? 'u32' : format === 'sint32' ? 'i32' : 'f32';
}

/** Returns a type-correct WGSL zero literal for a supported GPU storage format. */
function getZeroLiteral(format: GPUScalarFormat): string {
  return format === 'uint32' ? '0u' : format === 'sint32' ? '0' : '0.0';
}
