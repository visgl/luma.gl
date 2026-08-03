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
  validateMatchingVectorTopology,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {GPUReduction} from './gpu-reduction';

const HISTOGRAM_WORKGROUP_SIZE = 256;
const MAXIMUM_LOCAL_BIN_COUNT = 256;
const MAXIMUM_LITERAL_EDGE_COUNT = 257;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

/**
 * Domain accepted by {@link GPUHistogram}: a literal pair, a two-row GPU view, or an automatically
 * inferred extent.
 */
export type GPUHistogramDomain<T extends GPUScalarFormat = GPUScalarFormat> =
  | readonly [number, number]
  | GraphDataView<T>
  | 'auto';

/** One scalar chunk or an ordered scalar vector counted by {@link GPUHistogram}. */
export type GPUHistogramInput<T extends GPUScalarFormat = GPUScalarFormat> =
  | GraphDataView<T>
  | GraphVectorView<T>;

/** Optional nonzero/zero row selection with the same topology as histogram input. */
export type GPUHistogramMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Ordered bin boundaries accepted by {@link GPUHistogram}. */
export type GPUHistogramEdges<T extends GPUScalarFormat = GPUScalarFormat> =
  | readonly number[]
  | GraphDataView<T>;

/** Properties for graph-native scalar histogram counting. */
type GPUHistogramBaseProps<T extends GPUScalarFormat> = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** Packed scalar chunk or ordered vector of packed scalar chunks. */
  input: GPUHistogramInput<T>;
  /** Caller-owned `uint32` counts; its length defines the bin count. */
  output: GraphDataView<'uint32'>;
  /** Optional nonzero/zero selection with the same view kind and chunk topology as `input`. */
  mask?: GPUHistogramMask;
};

/** Properties for graph-native scalar histogram counting. */
export type GPUHistogramProps<T extends GPUScalarFormat = GPUScalarFormat> =
  GPUHistogramBaseProps<T> &
    (
      | {
          /** Inclusive input domain or `'auto'` for a graph-native extent reduction. */
          domain: GPUHistogramDomain<T>;
          /** Equal-width histograms do not accept explicit edges. */
          edges?: never;
        }
      | {
          /** Strictly increasing boundaries; length must equal `output.length + 1`. */
          edges: GPUHistogramEdges<T>;
          /** Irregular-edge histograms do not infer an equal-width domain. */
          domain?: never;
        }
    );

/**
 * Graph-native equal-width or irregular-edge histogram counting for packed 32-bit scalar values.
 *
 * Output is cleared on every encoding. Up to 256 bins use workgroup-local atomics before merging;
 * larger outputs accumulate directly with global atomics. Values rejected by an optional
 * source-aligned GPU mask, outside the inclusive domain or edge range, and non-finite
 * floating-point values are ignored. Automatic domains are inferred from the complete input.
 */
export class GPUHistogram<T extends GPUScalarFormat = GPUScalarFormat> {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Packed scalar chunk or ordered vector of packed scalar chunks. */
  readonly input: GPUHistogramInput<T>;
  /** Caller-owned bin counts. */
  readonly output: GraphDataView<'uint32'>;
  /** Optional source-aligned row selection. */
  readonly mask?: GPUHistogramMask;
  /** Literal, GPU-resident, or automatically inferred domain. */
  readonly domain?: GPUHistogramDomain<T>;
  /** Literal or GPU-resident irregular bin boundaries. */
  readonly edges?: GPUHistogramEdges<T>;

  /**
   * Creates and validates a scalar histogram description.
   *
   * @throws If views are not packed supported formats, output is empty, formats mismatch, buffers
   * alias unsafely, or a literal/GPU domain or edge description is invalid.
   */
  constructor(props: GPUHistogramProps<T>) {
    this.id = props.id ?? 'gpu-histogram';
    this.input = props.input;
    this.output = props.output;
    this.mask = props.mask;
    this.domain = props.domain;
    this.edges = props.edges;
    for (const [chunkIndex, input] of getHistogramInputs(this.input).entries()) {
      const name = this.input instanceof GraphVectorView ? ` input chunk ${chunkIndex}` : ' input';
      validatePackedView(input, SCALAR_FORMATS, `${this.id}${name}`);
      if (input.format !== this.input.format) {
        throw new Error(`${this.id}${name} format must match the input format`);
      }
    }
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.output.length === 0) {
      throw new Error(`${this.id} output must contain at least one bin`);
    }
    if (getHistogramInputs(this.input).some(input => input.buffer === this.output.buffer)) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
    if (this.mask) {
      if (this.input instanceof GraphVectorView !== this.mask instanceof GraphVectorView) {
        throw new Error(`${this.id} input and mask must use the same view kind`);
      }
      for (const [chunkIndex, mask] of getHistogramMasks(this.mask).entries()) {
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
    if (this.edges !== undefined) {
      validateHistogramEdges(this.edges, this.input.format, this.output, this.id);
    } else if (isGPUHistogramDomainView(this.domain)) {
      validatePackedView(this.domain, SCALAR_FORMATS, `${this.id} domain`);
      if (this.domain.format !== this.input.format || this.domain.length !== 2) {
        throw new Error(`${this.id} GPU domain must contain two ${this.input.format} rows`);
      }
      if (this.domain.buffer === this.output.buffer) {
        throw new Error(`${this.id} domain and output must use separate buffers`);
      }
    } else if (Array.isArray(this.domain)) {
      validateLiteralDomain(this.domain, this.input.format, this.id);
    }
  }

  /**
   * Adds optional domain inference, one output-clear pass, and one accumulation pass per non-empty
   * input chunk to a graph.
   *
   * Automatic domains compose a {@link GPUReduction} extent. Empty inputs still clear output but
   * add no accumulation pass.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const inputs = getHistogramInputs(this.input);
    const masks = this.mask ? getHistogramMasks(this.mask) : undefined;
    if (
      inputs.some(input => input.buffer.graph !== graph) ||
      masks?.some(mask => mask.buffer.graph !== graph) ||
      this.output.buffer.graph !== graph
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    let domain = this.domain;
    const edges = this.edges;
    if (isGPUHistogramEdgesView(edges) && edges.buffer.graph !== graph) {
      throw new Error(`${this.id} edges must belong to the target graph`);
    }
    if (edges !== undefined) {
      const edgeValidity = isGPUHistogramEdgesView(edges)
        ? createTransientView(graph, `${this.id}-edge-validity`, 'uint32', 1)
        : undefined;
      if (isGPUHistogramEdgesView(edges) && edgeValidity) {
        addValidateHistogramEdgesPass(graph, this.id, edges, edgeValidity);
      }
      addClearHistogramPass(graph, this.id, this.output);
      const accumulationPath = this.output.length <= MAXIMUM_LOCAL_BIN_COUNT ? 'local' : 'global';
      inputs.forEach((input, chunkIndex) => {
        if (input.length === 0) return;
        addIrregularHistogramPass(graph, {
          id:
            this.input instanceof GraphVectorView
              ? `${this.id}-chunk-${chunkIndex}-edges-${accumulationPath}`
              : `${this.id}-edges-${accumulationPath}`,
          input,
          output: this.output,
          mask: masks?.[chunkIndex],
          edges,
          edgeValidity
        });
      });
      return;
    }
    if (isGPUHistogramDomainView(domain) && domain.buffer.graph !== graph) {
      throw new Error(`${this.id} domain must belong to the target graph`);
    }
    if (domain === 'auto') {
      const inferredDomain = createTransientView(
        graph,
        `${this.id}-auto-domain`,
        this.input.format,
        2
      ) as GraphDataView<T>;
      new GPUReduction({
        id: `${this.id}-extent`,
        input: this.input,
        output: inferredDomain,
        operation: 'extent'
      }).addToGraph(graph);
      domain = inferredDomain;
    }
    if (domain === undefined) {
      throw new Error(`${this.id} requires either domain or edges`);
    }
    addClearHistogramPass(graph, this.id, this.output);
    const accumulationPath = this.output.length <= MAXIMUM_LOCAL_BIN_COUNT ? 'local' : 'global';
    inputs.forEach((input, chunkIndex) => {
      if (input.length === 0) {
        return;
      }
      addHistogramPass(graph, {
        id:
          this.input instanceof GraphVectorView
            ? `${this.id}-chunk-${chunkIndex}-${accumulationPath}`
            : `${this.id}-${accumulationPath}`,
        input,
        output: this.output,
        mask: masks?.[chunkIndex],
        domain
      });
    });
  }
}

/** Normalizes a scalar data view or vector view into its ordered chunk list. */
function getHistogramInputs<T extends GPUScalarFormat>(
  input: GPUHistogramInput<T>
): readonly GraphDataView<T>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Normalizes a source-aligned selection into its original ordered chunk list. */
function getHistogramMasks(mask: GPUHistogramMask): readonly GraphDataView<'uint32'>[] {
  return mask instanceof GraphVectorView ? mask.data : [mask];
}

/** Clears every output bin before accumulation for the current graph encoding. */
function addClearHistogramPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
  const passId = `${id}-clear`;
  const source = /* wgsl */ `
const BIN_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputCounts: array<atomic<u32>>;
@compute @workgroup_size(${HISTOGRAM_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x < BIN_COUNT) { atomicStore(&outputCounts[OUTPUT_OFFSET + globalId.x], 0u); }
}`;
  addComputationPass(graph, {
    id: passId,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputCounts: output},
    dispatchCount: Math.ceil(output.length / HISTOGRAM_WORKGROUP_SIZE)
  });
}

/** Validates GPU-resident edge ordering into one graph-owned flag without readback. */
function addValidateHistogramEdgesPass<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  edges: GraphDataView<T>,
  validity: GraphDataView<'uint32'>
): void {
  const shaderType = getShaderType(edges.format);
  const finiteCondition =
    edges.format === 'float32'
      ? 'left == left && right == right && abs(left) <= 3.402823466e+38 && abs(right) <= 3.402823466e+38'
      : 'true';
  const source = /* wgsl */ `
const EDGE_COUNT: u32 = ${edges.length}u;
const EDGE_OFFSET: u32 = ${getViewElementOffset(edges)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(validity)}u;
@group(0) @binding(0) var<storage, read> edgeValues: array<${shaderType}>;
@group(0) @binding(1) var<storage, read_write> edgeValidity: array<atomic<u32>>;
@compute @workgroup_size(${HISTOGRAM_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let lane = localId.x;
  if (lane == 0u) { atomicStore(&edgeValidity[VALIDITY_OFFSET], 1u); }
  storageBarrier();
  var edgeIndex = lane;
  loop {
    if (edgeIndex + 1u >= EDGE_COUNT) { break; }
    let left = edgeValues[EDGE_OFFSET + edgeIndex];
    let right = edgeValues[EDGE_OFFSET + edgeIndex + 1u];
    if (!(${finiteCondition}) || left >= right) {
      atomicStore(&edgeValidity[VALIDITY_OFFSET], 0u);
    }
    edgeIndex = edgeIndex + ${HISTOGRAM_WORKGROUP_SIZE}u;
  }
}`;
  addComputationPass(graph, {
    id: `${id}-validate-edges`,
    source,
    resources: [
      {buffer: edges, usage: 'storage-read'},
      {buffer: validity, usage: 'storage-write'}
    ],
    bindings: {edgeValues: edges, edgeValidity: validity},
    dispatchCount: 1
  });
}

/** Adds one binary-search irregular-edge accumulation pass. */
function addIrregularHistogramPass<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<T>;
    output: GraphDataView<'uint32'>;
    mask?: GraphDataView<'uint32'>;
    edges: GPUHistogramEdges<T>;
    edgeValidity?: GraphDataView<'uint32'>;
  }
): void {
  const local = props.output.length <= MAXIMUM_LOCAL_BIN_COUNT;
  const shaderType = getShaderType(props.input.format);
  const gpuEdges = isGPUHistogramEdgesView(props.edges);
  const edgeBinding = gpuEdges
    ? `@group(0) @binding(1) var<storage, read> edgeValues: array<${shaderType}>;`
    : '';
  const validityBinding = props.edgeValidity
    ? '@group(0) @binding(2) var<storage, read> edgeValidity: array<u32>;'
    : '';
  const maskBindingIndex = gpuEdges ? 3 : 1;
  const maskBinding = props.mask
    ? `@group(0) @binding(${maskBindingIndex}) var<storage, read> selectionMask: array<u32>;`
    : '';
  const outputBinding = maskBindingIndex + Number(Boolean(props.mask));
  const literalEdges = props.edges as readonly number[];
  const edgeAccessor = gpuEdges
    ? `fn getEdge(index: u32) -> ${shaderType} {
  return edgeValues[EDGE_OFFSET + index];
}`
    : `const EDGES: array<${shaderType}, ${literalEdges.length}> = array<${shaderType}, ${literalEdges.length}>(
  ${literalEdges.map(value => getLiteral(value, props.input.format)).join(', ')}
);
fn getEdge(index: u32) -> ${shaderType} { return EDGES[index]; }`;
  const validityCondition = props.edgeValidity
    ? `edgeValidity[${getViewElementOffset(props.edgeValidity)}u] != 0u`
    : 'true';
  const finiteCondition =
    props.input.format === 'float32' ? 'value == value && abs(value) <= 3.402823466e+38' : 'true';
  const accumulation = local
    ? `if (accepted) { atomicAdd(&localCounts[binIndex], 1u); }
  workgroupBarrier();
  if (lane < BIN_COUNT) {
    atomicAdd(&outputCounts[OUTPUT_OFFSET + lane], atomicLoad(&localCounts[lane]));
  }`
    : 'if (accepted) { atomicAdd(&outputCounts[OUTPUT_OFFSET + binIndex], 1u); }';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.input.length}u;
const BIN_COUNT: u32 = ${props.output.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
${gpuEdges ? `const EDGE_OFFSET: u32 = ${getViewElementOffset(props.edges as GraphDataView)}u;` : ''}
${props.mask ? `const MASK_OFFSET: u32 = ${getViewElementOffset(props.mask)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${edgeBinding}
${validityBinding}
${maskBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputCounts: array<atomic<u32>>;
${local ? `var<workgroup> localCounts: array<atomic<u32>, ${props.output.length}>;` : ''}
${edgeAccessor}

@compute @workgroup_size(${HISTOGRAM_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let index = globalId.x;
  let lane = localId.x;
  ${local ? 'if (lane < BIN_COUNT) { atomicStore(&localCounts[lane], 0u); }\n  workgroupBarrier();' : ''}
  var accepted = false;
  var binIndex = 0u;
  if (index < ELEMENT_COUNT && ${validityCondition}${
    props.mask ? ' && selectionMask[MASK_OFFSET + index] != 0u' : ''
  }) {
    let value = inputValues[INPUT_OFFSET + index];
    let minimum = getEdge(0u);
    let maximum = getEdge(BIN_COUNT);
    if (${finiteCondition} && value >= minimum && value <= maximum) {
      accepted = true;
      var lower = 0u;
      var upper = BIN_COUNT;
      loop {
        if (lower >= upper) { break; }
        let middle = lower + (upper - lower) / 2u;
        if (value < getEdge(middle + 1u)) {
          upper = middle;
        } else {
          lower = middle + 1u;
        }
      }
      binIndex = min(lower, BIN_COUNT - 1u);
    }
  }
  ${accumulation}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.input, usage: 'storage-read'},
    ...(gpuEdges
      ? ([{buffer: props.edges as GraphDataView, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    ...(props.edgeValidity
      ? ([{buffer: props.edgeValidity, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    ...(props.mask ? ([{buffer: props.mask, usage: 'storage-read'}] as GraphBufferUse[]) : []),
    {buffer: props.output, usage: 'storage-read-write'}
  ];
  addComputationPass(graph, {
    id: props.id,
    source,
    resources,
    bindings: {
      inputValues: props.input,
      ...(gpuEdges ? {edgeValues: props.edges as GraphDataView} : {}),
      ...(props.edgeValidity ? {edgeValidity: props.edgeValidity} : {}),
      ...(props.mask ? {selectionMask: props.mask} : {}),
      outputCounts: props.output
    },
    dispatchCount: Math.ceil(props.input.length / HISTOGRAM_WORKGROUP_SIZE)
  });
}

/** Adds the local- or global-atomic histogram accumulation pass. */
function addHistogramPass<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<T>;
    output: GraphDataView<'uint32'>;
    mask?: GraphDataView<'uint32'>;
    domain: readonly [number, number] | GraphDataView<T>;
  }
): void {
  const local = props.output.length <= MAXIMUM_LOCAL_BIN_COUNT;
  const shaderType = getShaderType(props.input.format);
  const gpuDomain = isGPUHistogramDomainView(props.domain);
  const literalDomain = props.domain as readonly [number, number];
  const domainBinding = gpuDomain
    ? '@group(0) @binding(1) var<storage, read> domainValues: array<' + shaderType + '>;'
    : '';
  const maskBindingIndex = gpuDomain ? 2 : 1;
  const maskBinding = props.mask
    ? `@group(0) @binding(${maskBindingIndex}) var<storage, read> selectionMask: array<u32>;`
    : '';
  const outputBinding = maskBindingIndex + Number(Boolean(props.mask));
  const domainInitialization = gpuDomain
    ? `let minimum: ${shaderType} = domainValues[DOMAIN_OFFSET];
  let maximum: ${shaderType} = domainValues[DOMAIN_OFFSET + 1u];`
    : `let minimum: ${shaderType} = ${getLiteral(literalDomain[0], props.input.format)};
  let maximum: ${shaderType} = ${getLiteral(literalDomain[1], props.input.format)};`;
  const finiteCondition =
    props.input.format === 'float32' ? 'value == value && abs(value) <= 3.402823466e+38' : 'true';
  const integerMultiplierBitCount = 32 - Math.clz32(props.output.length);
  const integerBinningFunction =
    props.input.format === 'float32'
      ? ''
      : `fn multiplyDivideFloor(numerator: u32, multiplier: u32, denominator: u32) -> u32 {
  var quotient = 0u;
  var remainder = 0u;
  var bitIndex = ${integerMultiplierBitCount}u;
  loop {
    bitIndex = bitIndex - 1u;
    // Double and add modulo denominator without overflowing u32.
    let doubledThreshold = denominator - remainder;
    if (remainder >= doubledThreshold) {
      remainder = remainder - doubledThreshold;
      quotient = quotient * 2u + 1u;
    } else {
      remainder = remainder * 2u;
      quotient = quotient * 2u;
    }
    if (((multiplier >> bitIndex) & 1u) != 0u) {
      let additionThreshold = denominator - numerator;
      if (remainder >= additionThreshold) {
        remainder = remainder - additionThreshold;
        quotient = quotient + 1u;
      } else {
        remainder = remainder + numerator;
      }
    }
    if (bitIndex == 0u) { break; }
  }
  return quotient;
}`;
  const binCalculation =
    props.input.format === 'float32'
      ? `let ratio = (value - minimum) / (maximum - minimum);
          binIndex = min(u32(ratio * f32(BIN_COUNT)), BIN_COUNT - 1u);`
      : props.input.format === 'uint32'
        ? 'binIndex = multiplyDivideFloor(value - minimum, BIN_COUNT, maximum - minimum);'
        : `let orderedValue = bitcast<u32>(value) ^ 0x80000000u;
          let orderedMinimum = bitcast<u32>(minimum) ^ 0x80000000u;
          let orderedMaximum = bitcast<u32>(maximum) ^ 0x80000000u;
          binIndex = multiplyDivideFloor(
            orderedValue - orderedMinimum,
            BIN_COUNT,
            orderedMaximum - orderedMinimum
          );`;
  const accumulation = local
    ? `if (accepted) { atomicAdd(&localCounts[binIndex], 1u); }
  workgroupBarrier();
  if (lane < BIN_COUNT) {
    atomicAdd(&outputCounts[OUTPUT_OFFSET + lane], atomicLoad(&localCounts[lane]));
  }`
    : 'if (accepted) { atomicAdd(&outputCounts[OUTPUT_OFFSET + binIndex], 1u); }';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.input.length}u;
const BIN_COUNT: u32 = ${props.output.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
${gpuDomain ? `const DOMAIN_OFFSET: u32 = ${getViewElementOffset(props.domain as GraphDataView)}u;` : ''}
${props.mask ? `const MASK_OFFSET: u32 = ${getViewElementOffset(props.mask)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${domainBinding}
${maskBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputCounts: array<atomic<u32>>;
${local ? `var<workgroup> localCounts: array<atomic<u32>, ${props.output.length}>;` : ''}
${integerBinningFunction}

@compute @workgroup_size(${HISTOGRAM_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let index = globalId.x;
  let lane = localId.x;
  ${domainInitialization}
  ${local ? 'if (lane < BIN_COUNT) { atomicStore(&localCounts[lane], 0u); }\n  workgroupBarrier();' : ''}
  var accepted = false;
  var binIndex = 0u;
  if (index < ELEMENT_COUNT && maximum >= minimum${
    props.mask ? ' && selectionMask[MASK_OFFSET + index] != 0u' : ''
  }) {
    let value = inputValues[INPUT_OFFSET + index];
    if (${finiteCondition} && value >= minimum && value <= maximum) {
      if (maximum == minimum) {
        accepted = value == minimum;
      } else {
        accepted = true;
        if (value == maximum) {
          binIndex = BIN_COUNT - 1u;
        } else {
          ${binCalculation}
        }
      }
    }
  }
  ${accumulation}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.input, usage: 'storage-read'},
    ...(gpuDomain
      ? ([{buffer: props.domain as GraphDataView, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    ...(props.mask ? ([{buffer: props.mask, usage: 'storage-read'}] as GraphBufferUse[]) : []),
    {buffer: props.output, usage: 'storage-read-write'}
  ];
  addComputationPass(graph, {
    id: props.id,
    source,
    resources,
    bindings: {
      inputValues: props.input,
      ...(gpuDomain ? {domainValues: props.domain as GraphDataView} : {}),
      ...(props.mask ? {selectionMask: props.mask} : {}),
      outputCounts: props.output
    },
    dispatchCount: Math.ceil(props.input.length / HISTOGRAM_WORKGROUP_SIZE)
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
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
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

/** Validates literal or GPU-resident irregular histogram boundaries. */
function validateHistogramEdges<T extends GPUScalarFormat>(
  edges: GPUHistogramEdges<T>,
  format: T,
  output: GraphDataView<'uint32'>,
  id: string
): void {
  if (isGPUHistogramEdgesView(edges)) {
    validatePackedView(edges, SCALAR_FORMATS, `${id} edges`);
    if (edges.format !== format || edges.length !== output.length + 1) {
      throw new Error(`${id} GPU edges must contain output.length + 1 ${format} rows`);
    }
    if (edges.buffer === output.buffer) {
      throw new Error(`${id} edges and output must use separate buffers`);
    }
    return;
  }
  if (edges.length !== output.length + 1) {
    throw new Error(`${id} literal edges must contain output.length + 1 values`);
  }
  if (edges.length > MAXIMUM_LITERAL_EDGE_COUNT) {
    throw new Error(`${id} literal edges support at most ${MAXIMUM_LITERAL_EDGE_COUNT} values`);
  }
  const minimum = format === 'uint32' ? 0 : -0x80000000;
  const maximum = format === 'uint32' ? 0xffffffff : 0x7fffffff;
  const representableEdges = format === 'float32' ? edges.map(Math.fround) : edges;
  const invalidValue =
    format === 'float32'
      ? representableEdges.some(value => !Number.isFinite(value))
      : edges.some(value => !Number.isInteger(value) || value < minimum || value > maximum);
  if (
    invalidValue ||
    representableEdges.some((value, index) => index > 0 && value <= representableEdges[index - 1])
  ) {
    throw new Error(`${id} literal edges must be finite, representable, and strictly increasing`);
  }
}

/** Validates a finite ordered literal domain and the selected scalar format's numeric range. */
function validateLiteralDomain(
  domain: readonly number[],
  format: GPUScalarFormat,
  id: string
): void {
  if (domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] > domain[1]) {
    throw new Error(`${id} literal domain must be a finite [min, max] pair`);
  }
  if (format !== 'float32') {
    const minimum = format === 'uint32' ? 0 : -0x80000000;
    const maximum = format === 'uint32' ? 0xffffffff : 0x7fffffff;
    if (!domain.every(value => Number.isInteger(value) && value >= minimum && value <= maximum)) {
      throw new Error(`${id} literal domain values must fit ${format}`);
    }
  }
}

/** Narrows a histogram domain to its GPU-resident two-row view form. */
function isGPUHistogramDomainView<T extends GPUScalarFormat>(
  domain: GPUHistogramDomain<T> | undefined
): domain is GraphDataView<T> {
  return domain !== undefined && domain !== 'auto' && !Array.isArray(domain);
}

/** Narrows irregular edges to their GPU-resident view form. */
function isGPUHistogramEdgesView<T extends GPUScalarFormat>(
  edges: GPUHistogramEdges<T> | undefined
): edges is GraphDataView<T> {
  return edges !== undefined && !Array.isArray(edges);
}

/** Returns the WGSL scalar type corresponding to a supported GPU storage format. */
function getShaderType(format: GPUScalarFormat): 'u32' | 'i32' | 'f32' {
  return format === 'uint32' ? 'u32' : format === 'sint32' ? 'i32' : 'f32';
}

/** Formats a JavaScript number as a type-correct WGSL scalar literal. */
function getLiteral(value: number, format: GPUScalarFormat): string {
  if (format === 'uint32') return `${value}u`;
  if (format === 'sint32') return `${value}`;
  const literal = `${Math.fround(value)}`;
  return literal.includes('.') || literal.includes('e') ? literal : `${literal}.0`;
}
