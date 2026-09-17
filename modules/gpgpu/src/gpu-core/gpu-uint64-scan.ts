// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  createTransientView,
  createTransientVectorView,
  doGraphDataViewsOverlap,
  getGraphDataPrefix,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {GPUScan, type GPUScanInput} from './gpu-scan';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';

const UINT64_SCAN_WORKGROUP_SIZE = 256;

export type GPUScanUint64Props = {
  id?: string;
  inputLow: GPUScanInput;
  inputHigh: GPUScanInput;
  outputLow: GPUScanInput;
  outputHigh: GPUScanInput;
};

/** Inclusive modulo-2^64 scan over split low/high words with independent chunk boundaries. */
export class GPUScanUint64 {
  readonly id: string;
  readonly props: Readonly<GPUScanUint64Props>;

  constructor(props: GPUScanUint64Props) {
    this.id = props.id ?? 'gpu-scan-uint64';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  /** Adds low-word scan, carry classification, and high-word scan nodes. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    const props = this.props;
    for (const view of [props.inputLow, props.inputHigh, props.outputLow, props.outputHigh]) {
      if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.inputLow.length === 0) {
      return nodes;
    }
    const outputLow = getGraphDataPrefix(graph, props.outputLow, props.inputLow.length);
    const outputHigh = getGraphDataPrefix(graph, props.outputHigh, props.inputLow.length);
    nodes.push(
      ...new GPUScan({
        id: `${this.id}-low`,
        input: props.inputLow,
        output: outputLow,
        mode: 'inclusive'
      }).getCommandNodes(graph)
    );
    const adjustedHigh =
      props.inputHigh instanceof GraphVectorView
        ? createTransientVectorView(graph, `${this.id}-adjusted-high`, props.inputHigh)
        : createTransientView(graph, `${this.id}-adjusted-high`, 'uint32', props.inputHigh.length);
    const spans = alignGraphVectorViews(graph, [props.inputHigh, outputLow, adjustedHigh]);
    let previousLow: GraphDataView<'uint32'> | undefined;
    for (const [index, [inputHigh, prefixLow, adjusted]] of spans.entries()) {
      nodes.push(
        ...addCarryPass(
          graph,
          `${this.id}-carry-${index}`,
          inputHigh,
          prefixLow,
          adjusted,
          previousLow
        )
      );
      // Borrow the preceding logical row even when the next span starts in another buffer.
      previousLow = graph.createDataView(prefixLow.buffer, {
        format: 'uint32',
        length: 1,
        byteOffset: prefixLow.byteOffset + (prefixLow.length - 1) * 4
      });
    }
    nodes.push(
      ...new GPUScan({
        id: `${this.id}-high`,
        input: adjustedHigh,
        output: outputHigh,
        mode: 'inclusive'
      }).getCommandNodes(graph)
    );

    return nodes;
  }
}

function addCarryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  inputHigh: GraphDataView<'uint32'>,
  prefixLow: GraphDataView<'uint32'>,
  adjustedHigh: GraphDataView<'uint32'>,
  previousLow?: GraphDataView<'uint32'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const length = inputHigh.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUScanUint64',
    length,
    UINT64_SCAN_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const LENGTH: u32 = ${length}u;
const INPUT_HIGH_OFFSET: u32 = ${getViewElementOffset(inputHigh)}u;
const PREFIX_LOW_OFFSET: u32 = ${getViewElementOffset(prefixLow)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(adjustedHigh)}u;
@group(0) @binding(0) var<storage, read> inputHigh: array<u32>;
@group(0) @binding(1) var<storage, read> prefixLow: array<u32>;
@group(0) @binding(2) var<storage, read_write> adjustedHigh: array<u32>;
${previousLow ? '@group(0) @binding(3) var<storage, read> previousLow: array<u32>;' : ''}
@compute @workgroup_size(${UINT64_SCAN_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, UINT64_SCAN_WORKGROUP_SIZE)}
  if (index >= LENGTH) {
    return;
  }
  var preceding = ${previousLow ? `previousLow[${getViewElementOffset(previousLow)}u]` : '0u'};
  if (index > 0u) {
    preceding = prefixLow[PREFIX_LOW_OFFSET + index - 1u];
  }
  let carry = select(0u, 1u, prefixLow[PREFIX_LOW_OFFSET + index] < preceding);
  adjustedHigh[OUTPUT_OFFSET + index] = inputHigh[INPUT_HIGH_OFFSET + index] + carry;
}`;
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id,
      workload: {
        operation: 'GPUScanUint64',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(length / UINT64_SCAN_WORKGROUP_SIZE),
        maximumInvocationCount:
          Math.ceil(length / UINT64_SCAN_WORKGROUP_SIZE) * UINT64_SCAN_WORKGROUP_SIZE,
        readByteLength: (length * 2 + (previousLow ? 1 : 0)) * Uint32Array.BYTES_PER_ELEMENT,
        writeByteLength: length * Uint32Array.BYTES_PER_ELEMENT
      },
      resources: [
        {buffer: inputHigh, usage: 'storage-read'},
        {buffer: prefixLow, usage: 'storage-read'},
        {buffer: adjustedHigh, usage: 'storage-write'},
        ...(previousLow ? [{buffer: previousLow, usage: 'storage-read' as const}] : [])
      ],
      compile: ({device}) => {
        const kernel = new Kernel(device, {
          id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'inputHigh', type: 'read-only-storage', group: 0, location: 0},
              {name: 'prefixLow', type: 'read-only-storage', group: 0, location: 1},
              {name: 'adjustedHigh', type: 'storage', group: 0, location: 2},
              ...(previousLow
                ? [{name: 'previousLow', type: 'read-only-storage' as const, group: 0, location: 3}]
                : [])
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              inputHigh: getViewBinding(inputHigh, getBuffer),
              prefixLow: getViewBinding(prefixLow, getBuffer),
              adjustedHigh: getViewBinding(adjustedHigh, getBuffer)
            };
            if (previousLow) bindings['previousLow'] = getViewBinding(previousLow, getBuffer);

            kernel.dispatch(computePass, {
              bindings,
              x: dispatchLayout.x,
              y: dispatchLayout.y,
              z: dispatchLayout.z
            });
          },
          destroy: () => kernel.destroy()
        };
      }
    })
  );

  return nodes;
}

function validateConfiguration(props: Readonly<GPUScanUint64Props>): void {
  for (const [name, view] of Object.entries({
    inputLow: props.inputLow,
    inputHigh: props.inputHigh,
    outputLow: props.outputLow,
    outputHigh: props.outputHigh
  })) {
    for (const chunk of getGraphVectorData(view)) {
      validatePackedUint32View(chunk, `${props.id} ${name}`);
    }
  }
  if (
    props.inputHigh.length !== props.inputLow.length ||
    props.outputLow.length < props.inputLow.length ||
    props.outputHigh.length < props.inputLow.length
  ) {
    throw new Error(`${props.id} inputs must match and outputs must cover every input row`);
  }
  const inputLow = getGraphVectorData(props.inputLow);
  const inputHigh = getGraphVectorData(props.inputHigh);
  const outputLow = getGraphVectorData(props.outputLow);
  const outputHigh = getGraphVectorData(props.outputHigh);
  if (
    outputLow.some(output =>
      [...inputLow, ...inputHigh, ...outputHigh].some(view => view.buffer === output.buffer)
    ) ||
    outputHigh.some(output => inputLow.some(view => view.buffer === output.buffer))
  ) {
    throw new Error(`${props.id} split-word outputs must use safe separate buffers`);
  }
  for (const output of [outputLow, outputHigh]) {
    for (const [index, destination] of output.entries()) {
      if (output.slice(0, index).some(view => doGraphDataViewsOverlap(view, destination))) {
        throw new Error(`${props.id} output chunks must not overlap`);
      }
    }
  }
}
