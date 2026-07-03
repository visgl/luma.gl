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
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {GPUReduction} from './gpu-reduction';

const HISTOGRAM_WORKGROUP_SIZE = 256;
const MAXIMUM_LOCAL_BIN_COUNT = 256;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

/** Domain accepted by {@link GPUHistogram}. */
export type GPUHistogramDomain<T extends GPUScalarFormat = GPUScalarFormat> =
  | readonly [number, number]
  | GraphDataView<T>
  | 'auto';

/** Properties for graph-native scalar histogram counting. */
export type GPUHistogramProps<T extends GPUScalarFormat = GPUScalarFormat> = {
  id?: string;
  input: GraphDataView<T>;
  output: GraphDataView<'uint32'>;
  domain: GPUHistogramDomain<T>;
};

/** Graph-native histogram counting for packed 32-bit scalar values. */
export class GPUHistogram<T extends GPUScalarFormat = GPUScalarFormat> {
  readonly id: string;
  readonly input: GraphDataView<T>;
  readonly output: GraphDataView<'uint32'>;
  readonly domain: GPUHistogramDomain<T>;

  constructor(props: GPUHistogramProps<T>) {
    this.id = props.id ?? 'gpu-histogram';
    this.input = props.input;
    this.output = props.output;
    this.domain = props.domain;
    validatePackedView(this.input, SCALAR_FORMATS, `${this.id} input`);
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.output.length === 0) {
      throw new Error(`${this.id} output must contain at least one bin`);
    }
    if (this.input.buffer === this.output.buffer) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
    if (isGPUHistogramDomainView(this.domain)) {
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

  /** Adds domain inference, output clearing, and accumulation nodes to a graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.input.buffer.graph !== graph || this.output.buffer.graph !== graph) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    let domain = this.domain;
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
    addClearHistogramPass(graph, this.id, this.output);
    if (this.input.length > 0) {
      addHistogramPass(graph, {
        id: `${this.id}-${this.output.length <= MAXIMUM_LOCAL_BIN_COUNT ? 'local' : 'global'}`,
        input: this.input,
        output: this.output,
        domain
      });
    }
  }
}

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

function addHistogramPass<Parameters, T extends GPUScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<T>;
    output: GraphDataView<'uint32'>;
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
  const outputBinding = gpuDomain ? 2 : 1;
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
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${domainBinding}
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
  if (index < ELEMENT_COUNT && maximum >= minimum) {
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
    {buffer: props.output, usage: 'storage-read-write'}
  ];
  addComputationPass(graph, {
    id: props.id,
    source,
    resources,
    bindings: {
      inputValues: props.input,
      ...(gpuDomain ? {domainValues: props.domain as GraphDataView} : {}),
      outputCounts: props.output
    },
    dispatchCount: Math.ceil(props.input.length / HISTOGRAM_WORKGROUP_SIZE)
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

function isGPUHistogramDomainView<T extends GPUScalarFormat>(
  domain: GPUHistogramDomain<T>
): domain is GraphDataView<T> {
  return domain !== 'auto' && !Array.isArray(domain);
}

function getShaderType(format: GPUScalarFormat): 'u32' | 'i32' | 'f32' {
  return format === 'uint32' ? 'u32' : format === 'sint32' ? 'i32' : 'f32';
}

function getLiteral(value: number, format: GPUScalarFormat): string {
  if (format === 'uint32') return `${value}u`;
  if (format === 'sint32') return `${value}`;
  return Number.isInteger(value) ? `${value}.0` : `${value}`;
}
