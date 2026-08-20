// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView, GraphVectorView} from './gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from './gpu-dispatch-utils';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';

const SCAN_WORKGROUP_SIZE = 256;
const MAXIMUM_SCAN_SUBGROUP_COUNT = 64;

/** Compute strategy selected for an unsegmented scan block. @internal */
export type GPUScanStrategy = 'portable' | 'subgroups';

/** Selects the subgroup path only when both device and WGSL language capabilities are present. */
export function getGPUScanStrategy(device: Device, segmented: boolean = false): GPUScanStrategy {
  return segmented ? 'portable' : getGPUShaderSubgroupStrategy(device, {requiresSubgroupId: true});
}

/** Packed uint32 graph data accepted by {@link GPUScan}. */
export type GPUScanInput = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties for one graph-native prefix sum. */
export type GPUScanProps = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** One packed unsigned data view or an ordered vector of packed chunks. */
  input: GPUScanInput;
  /** Caller-owned destination with matching view kind and sufficient capacity or topology. */
  output: GPUScanInput;
  /** Prefix convention. Defaults to `exclusive`. */
  mode?: 'exclusive' | 'inclusive';
  /** Optional nonzero flags that start new segments. Row zero is always a segment start. */
  segmentFlags?: GPUScanInput;
};

/**
 * Hierarchical prefix sum over packed `uint32` graph data.
 *
 * Each 256-thread block writes local prefixes and, when necessary, one block summary. Higher
 * levels scan those summaries before reverse-order offset passes add parent offsets back into every
 * lower level. Optional nonzero flags restart the prefix without treating vector chunks as segment
 * boundaries. Arithmetic wraps modulo 2^32.
 */
export class GPUScan {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Packed unsigned source data or ordered source vector. */
  readonly input: GPUScanInput;
  /** Caller-owned prefix destination with matching view kind. */
  readonly output: GPUScanInput;
  /** Whether output rows exclude or include their corresponding input rows. */
  readonly mode: 'exclusive' | 'inclusive';
  /** Optional nonzero flags that start new segments. */
  readonly segmentFlags?: GPUScanInput;

  /**
   * Creates and validates a scan description.
   *
   * @throws If either view is not packed `uint32` data or the output is shorter than the input.
   */
  constructor(props: GPUScanProps) {
    this.id = props.id ?? 'gpu-scan';
    this.input = props.input;
    this.output = props.output;
    this.mode = props.mode ?? 'exclusive';
    this.segmentFlags = props.segmentFlags;
    validateScanInput(this.input, `${this.id} input`);
    validateScanInput(this.output, `${this.id} output`);
    const inputIsVector = this.input instanceof GraphVectorView;
    const outputIsVector = this.output instanceof GraphVectorView;
    if (inputIsVector !== outputIsVector) {
      throw new Error(`${this.id} input and output must both be data views or vector views`);
    }
    if (this.input instanceof GraphVectorView && this.output instanceof GraphVectorView) {
      validateMatchingVectorTopology(this.input, this.output, `${this.id} output`);
    } else if (this.output.length < this.input.length) {
      throw new Error(`${this.id} output must contain at least input.length rows`);
    }
    if (this.segmentFlags) {
      validateScanInput(this.segmentFlags, `${this.id} segmentFlags`);
      const flagsAreVector = this.segmentFlags instanceof GraphVectorView;
      if (inputIsVector !== flagsAreVector) {
        throw new Error(
          `${this.id} input and segmentFlags must both be data views or vector views`
        );
      }
      if (this.input instanceof GraphVectorView && this.segmentFlags instanceof GraphVectorView) {
        validateMatchingVectorTopology(this.input, this.segmentFlags, `${this.id} segmentFlags`);
      } else if (this.segmentFlags.length < this.input.length) {
        throw new Error(`${this.id} segmentFlags must contain at least input.length rows`);
      }
      const outputBuffers = new Set(getScanChunks(this.output).map(chunk => chunk.buffer));
      if (getScanChunks(this.segmentFlags).some(chunk => outputBuffers.has(chunk.buffer))) {
        throw new Error(`${this.id} segmentFlags and output must use separate buffers`);
      }
    }
  }

  /**
   * Adds local scan hierarchies, vector carry propagation, and graph-owned scratch.
   *
   * Empty inputs add no nodes. This method declares work only; it does not compile, encode, submit,
   * or read data back.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addGPUScanToGraphWithDispatchLimit(
      this,
      graph,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Adds a scan using an explicit per-dimension dispatch limit. @internal */
export function addGPUScanToGraphWithDispatchLimit<Parameters>(
  scan: GPUScan,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  validateScanOwnership(graph, scan.input, scan.id);
  validateScanOwnership(graph, scan.output, scan.id);
  if (scan.segmentFlags) {
    validateScanOwnership(graph, scan.segmentFlags, scan.id);
  }
  addChunkedScan(
    graph,
    {
      id: scan.id,
      input: scan.input,
      output: scan.output,
      mode: scan.mode,
      segmentFlags: scan.segmentFlags
    },
    maxComputeWorkgroupsPerDimension
  );
}

/** Normalizes atomic and vector inputs and adds the required local scans and vector carries. */
function addChunkedScan<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GPUScanInput;
    output: GPUScanInput;
    mode: 'exclusive' | 'inclusive';
    segmentFlags?: GPUScanInput;
  },
  maxComputeWorkgroupsPerDimension: number
): void {
  const inputChunks = getScanChunks(props.input);
  const outputChunks = getScanChunks(props.output);
  const segmentFlagChunks = props.segmentFlags ? getScanChunks(props.segmentFlags) : undefined;
  const nonEmptyChunks = inputChunks
    .map((inputChunk, chunkIndex) => ({
      chunkIndex,
      input: inputChunk,
      output: outputChunks[chunkIndex],
      segmentFlags: segmentFlagChunks?.[chunkIndex]
    }))
    .filter(chunk => chunk.input.length > 0);
  if (nonEmptyChunks.length === 0) {
    return;
  }
  const isVector = props.input instanceof GraphVectorView;
  if (nonEmptyChunks.length === 1) {
    const chunk = nonEmptyChunks[0];
    addScanLevels(graph, {
      id: isVector ? `${props.id}-chunk-${chunk.chunkIndex}` : props.id,
      input: chunk.input,
      output: chunk.output,
      mode: props.mode,
      segmentFlags: chunk.segmentFlags,
      maxComputeWorkgroupsPerDimension
    });
    return;
  }

  const chunkTotals = createTransientView(
    graph,
    `${props.id}-chunk-totals`,
    'uint32',
    nonEmptyChunks.length
  );
  const chunkOffsets = createTransientView(
    graph,
    `${props.id}-chunk-offsets`,
    'uint32',
    nonEmptyChunks.length
  );
  const chunkSegmentFlags = props.segmentFlags
    ? createTransientView(graph, `${props.id}-chunk-segment-flags`, 'uint32', nonEmptyChunks.length)
    : undefined;
  const chunkSegmentPrefixes = props.segmentFlags
    ? nonEmptyChunks.map(chunk =>
        createTransientView(
          graph,
          `${props.id}-chunk-${chunk.chunkIndex}-segment-prefixes`,
          'uint32',
          chunk.input.length
        )
      )
    : undefined;
  for (const [partialIndex, chunk] of nonEmptyChunks.entries()) {
    addScanLevels(graph, {
      id: `${props.id}-chunk-${chunk.chunkIndex}`,
      input: chunk.input,
      output: chunk.output,
      mode: props.mode,
      segmentFlags: chunk.segmentFlags,
      outputSegmentPrefixes: chunkSegmentPrefixes?.[partialIndex],
      finalSum: createPackedSubview(graph, chunkTotals, partialIndex),
      finalSegmentFlag: chunkSegmentFlags
        ? createPackedSubview(graph, chunkSegmentFlags, partialIndex)
        : undefined,
      maxComputeWorkgroupsPerDimension
    });
  }
  addScanLevels(graph, {
    id: `${props.id}-chunk-carries`,
    input: chunkTotals,
    output: chunkOffsets,
    mode: 'exclusive',
    segmentFlags: chunkSegmentFlags,
    segmentSummaryInput: Boolean(chunkSegmentFlags),
    maxComputeWorkgroupsPerDimension
  });
  for (const [partialIndex, chunk] of nonEmptyChunks.entries()) {
    addOffsetPass(graph, {
      id: `${props.id}-chunk-${chunk.chunkIndex}-add-carry`,
      output: chunk.output,
      offsets: chunkOffsets,
      length: chunk.output.length,
      offsetIndex: partialIndex,
      segmentPrefixes: chunkSegmentPrefixes?.[partialIndex],
      dispatchLayout: getGPUScanDispatchLayout(
        chunk.output.length,
        maxComputeWorkgroupsPerDimension
      )
    });
  }
}

/** Adds every hierarchical level required to scan one non-empty packed data view. */
function addScanLevels<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    mode: 'exclusive' | 'inclusive';
    segmentFlags?: GraphDataView<'uint32'>;
    outputSegmentPrefixes?: GraphDataView<'uint32'>;
    finalSum?: GraphDataView<'uint32'>;
    finalSegmentFlag?: GraphDataView<'uint32'>;
    /** Summary flags report a start anywhere in one lower-level block, not at its first row. */
    segmentSummaryInput?: boolean;
    maxComputeWorkgroupsPerDimension: number;
  }
): void {
  if (props.input.length === 0) {
    return;
  }

  const levels: Array<{
    output: GraphDataView<'uint32'>;
    length: number;
    blockOffsets?: GraphDataView<'uint32'>;
    segmentPrefixes?: GraphDataView<'uint32'>;
  }> = [];
  let levelInput = props.input;
  let levelOutput = props.output;
  let levelSegmentFlags = props.segmentFlags;
  let levelLength = props.input.length;
  let levelIndex = 0;

  while (true) {
    const blockCount = Math.ceil(levelLength / SCAN_WORKGROUP_SIZE);
    let blockSums: GraphDataView<'uint32'> | undefined;
    let blockSegmentFlags: GraphDataView<'uint32'> | undefined;
    if (blockCount > 1) {
      blockSums = createTransientView(
        graph,
        `${props.id}-level-${levelIndex}-block-sums`,
        'uint32',
        blockCount
      );
      if (levelSegmentFlags) {
        blockSegmentFlags = createTransientView(
          graph,
          `${props.id}-level-${levelIndex}-block-segment-flags`,
          'uint32',
          blockCount
        );
      }
    }
    const segmentPrefixes = levelSegmentFlags
      ? levelIndex === 0 && props.outputSegmentPrefixes
        ? props.outputSegmentPrefixes
        : blockCount > 1 || levelIndex > 0
          ? createTransientView(
              graph,
              `${props.id}-level-${levelIndex}-segment-prefixes`,
              'uint32',
              levelLength
            )
          : undefined
      : undefined;

    addBlockScanPass(graph, {
      id: `${props.id}-level-${levelIndex}-scan`,
      input: levelInput,
      output: levelOutput,
      mode: levelIndex === 0 ? props.mode : 'exclusive',
      segmentFlags: levelSegmentFlags,
      segmentSummaryInput:
        Boolean(levelSegmentFlags) && (levelIndex > 0 || props.segmentSummaryInput),
      segmentPrefixes,
      blockSums,
      blockSegmentFlags,
      finalSum: blockSums ? undefined : props.finalSum,
      finalSegmentFlag: blockSums ? undefined : props.finalSegmentFlag,
      length: levelLength,
      blockCount,
      dispatchLayout: getGPUScanDispatchLayout(levelLength, props.maxComputeWorkgroupsPerDimension)
    });
    levels.push({output: levelOutput, length: levelLength, segmentPrefixes});

    if (!blockSums) {
      break;
    }
    const blockOffsets = createTransientView(
      graph,
      `${props.id}-level-${levelIndex}-block-offsets`,
      'uint32',
      blockCount
    );
    levels[levels.length - 1].blockOffsets = blockOffsets;
    levelInput = blockSums;
    levelOutput = blockOffsets;
    levelSegmentFlags = blockSegmentFlags;
    levelLength = blockCount;
    levelIndex++;
  }

  for (let index = levels.length - 2; index >= 0; index--) {
    const level = levels[index];
    const parentLevel = levels[index + 1];
    addOffsetPass(graph, {
      id: `${props.id}-level-${index}-add-offsets`,
      output: level.output,
      offsets: level.blockOffsets!,
      length: level.length,
      segmentPrefixes: level.segmentPrefixes,
      offsetSegmentPrefixes: parentLevel.segmentPrefixes,
      dispatchLayout: getGPUScanDispatchLayout(level.length, props.maxComputeWorkgroupsPerDimension)
    });
  }
}

/** Returns one packed row within a transient view without allocating another buffer. */
function createPackedSubview<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<'uint32'>,
  index: number
): GraphDataView<'uint32'> {
  return graph.createDataView(view.buffer, {
    format: 'uint32',
    length: 1,
    byteOffset: view.byteOffset + index * view.rowByteLength
  });
}

/** Validates every atomic chunk accepted by a scan input. */
function validateScanInput(input: GPUScanInput, name: string): void {
  const chunks = input instanceof GraphVectorView ? input.data : [input];
  for (const chunk of chunks) {
    validatePackedUint32View(chunk, name);
  }
}

/** Normalizes one data view or vector into its ordered atomic chunks. */
function getScanChunks(input: GPUScanInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Verifies that every scan chunk belongs to the graph receiving the operation. */
function validateScanOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  input: GPUScanInput,
  id: string
): void {
  const chunks = input instanceof GraphVectorView ? input.data : [input];
  if (chunks.some(chunk => chunk.buffer.graph !== graph)) {
    throw new Error(`${id} views must belong to the target graph`);
  }
}

/** Adds one block-local scan level and optionally writes one summary pair per block. */
function addBlockScanPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    mode: 'exclusive' | 'inclusive';
    segmentFlags?: GraphDataView<'uint32'>;
    /** Preserve carry into the current summary even when that summary contains a later start. */
    segmentSummaryInput?: boolean;
    segmentPrefixes?: GraphDataView<'uint32'>;
    blockSums?: GraphDataView<'uint32'>;
    blockSegmentFlags?: GraphDataView<'uint32'>;
    finalSum?: GraphDataView<'uint32'>;
    finalSegmentFlag?: GraphDataView<'uint32'>;
    length: number;
    blockCount: number;
    dispatchLayout: GPUScanDispatchLayout;
  }
): void {
  const sumOutput = props.blockSums ?? props.finalSum;
  const segmentFlagOutput = props.blockSegmentFlags ?? props.finalSegmentFlag;
  const sumBinding = sumOutput
    ? '@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;'
    : '';
  const segmentFlagsBinding = props.segmentFlags
    ? '@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;'
    : '';
  const segmentPrefixesBinding = props.segmentPrefixes
    ? '@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;'
    : '';
  const segmentFlagOutputBinding = segmentFlagOutput
    ? '@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;'
    : '';
  const sumWrite = props.blockSums
    ? 'sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];'
    : props.finalSum
      ? 'sumValues[SUM_OFFSET] = scratch[255u];'
      : '';
  const segmentFlagWrite = props.blockSegmentFlags
    ? 'summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];'
    : props.finalSegmentFlag
      ? 'summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];'
      : '';
  const inputSegmentFlag = props.segmentFlags ? 'segmentFlags[SEGMENT_FLAGS_OFFSET + index]' : '0u';
  const scanUpdate = props.segmentFlags
    ? `if (lane >= stride) {
      scratch[lane] = select(addend + scratch[lane], scratch[lane], segmentScratch[lane] != 0u);
      segmentScratch[lane] = addendSegment | segmentScratch[lane];
    }`
    : `if (lane >= stride) {
      scratch[lane] = scratch[lane] + addend;
    }`;
  const outputValue = props.mode === 'inclusive' ? 'scratch[lane]' : 'scratch[lane] - inputValue';
  const segmentedOutput =
    props.segmentFlags && props.mode === 'exclusive'
      ? `var scannedOutput = 0u;
    if (lane > 0u) {
      scannedOutput = scratch[lane - 1u];
    }
    ${props.segmentSummaryInput ? '' : 'if (inputSegmentFlag != 0u) { scannedOutput = 0u; }'}
    outputValues[OUTPUT_OFFSET + index] = scannedOutput;`
      : `outputValues[OUTPUT_OFFSET + index] = ${outputValue};`;
  const segmentPrefixWrite = props.segmentPrefixes
    ? props.segmentSummaryInput
      ? `var segmentPrefix = 0u;
    if (lane > 0u) {
      segmentPrefix = segmentScratch[lane - 1u];
    }
    segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix;`
      : 'segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentScratch[lane];'
    : '';
  const portableSource = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.length}u;
const BLOCK_COUNT: u32 = ${props.blockCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${sumOutput ? `const SUM_OFFSET: u32 = ${getViewElementOffset(sumOutput)}u;` : ''}
${props.segmentFlags ? `const SEGMENT_FLAGS_OFFSET: u32 = ${getViewElementOffset(props.segmentFlags)}u;` : ''}
${props.segmentPrefixes ? `const SEGMENT_PREFIXES_OFFSET: u32 = ${getViewElementOffset(props.segmentPrefixes)}u;` : ''}
${segmentFlagOutput ? `const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${getViewElementOffset(segmentFlagOutput)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${sumBinding}
${segmentFlagsBinding}
${segmentPrefixesBinding}
${segmentFlagOutputBinding}
var<workgroup> scratch: array<u32, ${SCAN_WORKGROUP_SIZE}>;
${props.segmentFlags ? `var<workgroup> segmentScratch: array<u32, ${SCAN_WORKGROUP_SIZE}>;` : ''}

@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUScanInvocationIndexSource(props.dispatchLayout)}
  if (workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = localInvocationIndex;
  var inputValue = 0u;
  var inputSegmentFlag = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
    inputSegmentFlag = ${inputSegmentFlag};
  }
  scratch[lane] = inputValue;
  ${props.segmentFlags ? 'segmentScratch[lane] = inputSegmentFlag;' : ''}
  workgroupBarrier();

  for (var stride = 1u; stride < ${SCAN_WORKGROUP_SIZE}u; stride = stride * 2u) {
    var addend = 0u;
    ${props.segmentFlags ? 'var addendSegment = 0u;' : ''}
    if (lane >= stride) {
      addend = scratch[lane - stride];
      ${props.segmentFlags ? 'addendSegment = segmentScratch[lane - stride];' : ''}
    }
    workgroupBarrier();
    ${scanUpdate}
    workgroupBarrier();
  }

  if (lane == ${SCAN_WORKGROUP_SIZE - 1}u) {
    ${sumWrite}
    ${segmentFlagWrite}
  }
  if (index < ELEMENT_COUNT) {
    ${segmentedOutput}
    ${segmentPrefixWrite}
  }
}`;
  const strategy = getGPUScanStrategyForGraph(graph, Boolean(props.segmentFlags), props.length);
  const source =
    strategy === 'subgroups'
      ? getSubgroupBlockScanSource(props, sumOutput, sumBinding)
      : portableSource;

  graph.addComputePass({
    id: props.id,
    workload: {
      operation: 'GPUScan',
      variant: strategy,
      commandCount: 1,
      maximumWorkgroupCount:
        props.dispatchLayout.x * props.dispatchLayout.y * props.dispatchLayout.z,
      maximumInvocationCount:
        props.dispatchLayout.x *
        props.dispatchLayout.y *
        props.dispatchLayout.z *
        SCAN_WORKGROUP_SIZE,
      readByteLength: props.length * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength:
        props.length * Uint32Array.BYTES_PER_ELEMENT +
        props.blockCount * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'},
      ...(sumOutput ? [{buffer: sumOutput, usage: 'storage-write'} as const] : []),
      ...(props.segmentFlags ? [{buffer: props.segmentFlags, usage: 'storage-read'} as const] : []),
      ...(props.segmentPrefixes
        ? [{buffer: props.segmentPrefixes, usage: 'storage-write'} as const]
        : []),
      ...(segmentFlagOutput ? [{buffer: segmentFlagOutput, usage: 'storage-write'} as const] : [])
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputValues', type: 'storage', group: 0, location: 0},
            {name: 'outputValues', type: 'storage', group: 0, location: 1},
            ...(sumOutput
              ? [{name: 'sumValues', type: 'storage' as const, group: 0, location: 2}]
              : []),
            ...(props.segmentFlags
              ? [{name: 'segmentFlags', type: 'storage' as const, group: 0, location: 3}]
              : []),
            ...(props.segmentPrefixes
              ? [{name: 'segmentPrefixes', type: 'storage' as const, group: 0, location: 4}]
              : []),
            ...(segmentFlagOutput
              ? [
                  {
                    name: 'summarySegmentFlags',
                    type: 'storage' as const,
                    group: 0,
                    location: 5
                  }
                ]
              : [])
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputValues: getViewBinding(props.input, getBuffer),
            outputValues: getViewBinding(props.output, getBuffer)
          };
          if (sumOutput) {
            bindings['sumValues'] = getViewBinding(sumOutput, getBuffer);
          }
          if (props.segmentFlags) {
            bindings['segmentFlags'] = getViewBinding(props.segmentFlags, getBuffer);
          }
          if (props.segmentPrefixes) {
            bindings['segmentPrefixes'] = getViewBinding(props.segmentPrefixes, getBuffer);
          }
          if (segmentFlagOutput) {
            bindings['summarySegmentFlags'] = getViewBinding(segmentFlagOutput, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Uses empirical adapter calibration when supplied, otherwise preserves capability selection. */
function getGPUScanStrategyForGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  segmented: boolean,
  workloadSize: number
): GPUScanStrategy {
  const preferredStrategy = getGPUScanStrategy(graph.device, segmented);
  if (!graph.autotuner || segmented) return preferredStrategy;
  const alternateStrategy: GPUScanStrategy =
    preferredStrategy === 'subgroups' ? 'portable' : 'subgroups';
  return graph.autotuner.selectKernel({
    operation: 'GPUScan',
    workloadSize,
    candidates: [
      {id: preferredStrategy},
      {
        id: alternateStrategy,
        supported:
          alternateStrategy === 'portable' ||
          getGPUScanStrategy(graph.device, false) === 'subgroups'
      }
    ]
  }).variant as GPUScanStrategy;
}

/** Builds an ordered scan over virtual lanes derived from subgroup ID and invocation ID. */
function getSubgroupBlockScanSource(
  props: {
    input: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    mode: 'exclusive' | 'inclusive';
    blockSums?: GraphDataView<'uint32'>;
    finalSum?: GraphDataView<'uint32'>;
    length: number;
    blockCount: number;
    dispatchLayout: GPUScanDispatchLayout;
  },
  sumOutput: GraphDataView<'uint32'> | undefined,
  sumBinding: string
): string {
  const outputValue = props.mode === 'inclusive' ? 'blockPrefix' : 'blockPrefix - inputValue';
  const sumWrite = props.blockSums
    ? 'sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;'
    : props.finalSum
      ? 'sumValues[SUM_OFFSET] = blockPrefix;'
      : '';
  const maximumLinearWorkgroupCount = Math.floor(0xffffffff / SCAN_WORKGROUP_SIZE) + 1;

  return /* wgsl */ `
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${props.length}u;
const BLOCK_COUNT: u32 = ${props.blockCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${sumOutput ? `const SUM_OFFSET: u32 = ${getViewElementOffset(sumOutput)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${sumBinding}
var<workgroup> subgroupOffsets: array<u32, ${MAXIMUM_SCAN_SUBGROUP_COUNT}>;

@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${props.dispatchLayout.y}u + workgroupId.y) * ${props.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${maximumLinearWorkgroupCount}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${SCAN_WORKGROUP_SIZE}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${SCAN_WORKGROUP_SIZE}u / subgroupSize;
  if (lane == 0u) {
    var runningOffset = 0u;
    for (var subgroupIndex = 0u; subgroupIndex < subgroupCount; subgroupIndex++) {
      let subgroupSum = subgroupOffsets[subgroupIndex];
      subgroupOffsets[subgroupIndex] = runningOffset;
      runningOffset = runningOffset + subgroupSum;
    }
  }
  workgroupBarrier();

  let blockPrefix = subgroupOffsets[subgroupId] + subgroupPrefix;
  if (lane == ${SCAN_WORKGROUP_SIZE - 1}u) {
    ${sumWrite}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${outputValue};
  }
}`;
}

/** Adds a scanned block offset or one vector carry into an output view. */
function addOffsetPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    output: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    length: number;
    offsetIndex?: number;
    segmentPrefixes?: GraphDataView<'uint32'>;
    offsetSegmentPrefixes?: GraphDataView<'uint32'>;
    dispatchLayout: GPUScanDispatchLayout;
  }
): void {
  const offsetIndex =
    props.offsetIndex === undefined ? `index / ${SCAN_WORKGROUP_SIZE}u` : `${props.offsetIndex}u`;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
${props.segmentPrefixes ? `const SEGMENT_PREFIXES_OFFSET: u32 = ${getViewElementOffset(props.segmentPrefixes)}u;` : ''}
${props.offsetSegmentPrefixes ? `const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${getViewElementOffset(props.offsetSegmentPrefixes)}u;` : ''}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${props.segmentPrefixes ? `@group(0) @binding(2) var<storage, ${props.offsetSegmentPrefixes ? 'read_write' : 'read'}> segmentPrefixes: array<u32>;` : ''}
${props.offsetSegmentPrefixes ? '@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;' : ''}

@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUScanInvocationIndexSource(props.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${props.offsetSegmentPrefixes ? `let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${offsetIndex}];` : ''}
    ${
      props.segmentPrefixes
        ? `let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`
        : ''
    }
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${offsetIndex}];
    ${props.segmentPrefixes ? '}' : ''}
    ${props.segmentPrefixes && props.offsetSegmentPrefixes ? 'segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;' : ''}
  }
}`;
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: 'GPUScan',
      commandCount: 1,
      maximumWorkgroupCount:
        props.dispatchLayout.x * props.dispatchLayout.y * props.dispatchLayout.z,
      maximumInvocationCount:
        props.dispatchLayout.x *
        props.dispatchLayout.y *
        props.dispatchLayout.z *
        SCAN_WORKGROUP_SIZE,
      readByteLength: props.length * Uint32Array.BYTES_PER_ELEMENT * 2,
      writeByteLength: props.length * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: props.output, usage: 'storage-read-write'},
      {buffer: props.offsets, usage: 'storage-read'},
      ...(props.segmentPrefixes
        ? [
            {
              buffer: props.segmentPrefixes,
              usage: props.offsetSegmentPrefixes ? 'storage-read-write' : 'storage-read'
            } as const
          ]
        : []),
      ...(props.offsetSegmentPrefixes
        ? [{buffer: props.offsetSegmentPrefixes, usage: 'storage-read'} as const]
        : [])
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'outputValues', type: 'storage', group: 0, location: 0},
            {name: 'offsets', type: 'storage', group: 0, location: 1},
            ...(props.segmentPrefixes
              ? [{name: 'segmentPrefixes', type: 'storage' as const, group: 0, location: 2}]
              : []),
            ...(props.offsetSegmentPrefixes
              ? [
                  {
                    name: 'offsetSegmentPrefixes',
                    type: 'storage' as const,
                    group: 0,
                    location: 3
                  }
                ]
              : [])
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            outputValues: getViewBinding(props.output, getBuffer),
            offsets: getViewBinding(props.offsets, getBuffer)
          };
          if (props.segmentPrefixes) {
            bindings['segmentPrefixes'] = getViewBinding(props.segmentPrefixes, getBuffer);
          }
          if (props.offsetSegmentPrefixes) {
            bindings['offsetSegmentPrefixes'] = getViewBinding(
              props.offsetSegmentPrefixes,
              getBuffer
            );
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

type GPUScanDispatchLayout = GPUBoundedDispatchLayout;

/** Plans a bounded three-dimensional dispatch for one scan pass. @internal */
export function getGPUScanDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUScanDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUScan',
    elementCount,
    SCAN_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

/** Returns WGSL that maps a bounded 3D scan dispatch to one linear element index. @internal */
export function getGPUScanInvocationIndexSource(layout: GPUScanDispatchLayout): string {
  return getBoundedInvocationIndexSource(layout, SCAN_WORKGROUP_SIZE);
}
