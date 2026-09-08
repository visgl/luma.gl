// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {GPUScan} from './gpu-scan';

const UINT64_SCAN_WORKGROUP_SIZE = 256;

export type GPUScanUint64Props = {
  id?: string;
  inputLow: GraphDataView<'uint32'>;
  inputHigh: GraphDataView<'uint32'>;
  outputLow: GraphDataView<'uint32'>;
  outputHigh: GraphDataView<'uint32'>;
};

/** Inclusive modulo-2^64 scan over split low/high uint32 words. */
export class GPUScanUint64 {
  readonly id: string;
  readonly props: Readonly<GPUScanUint64Props>;

  constructor(props: GPUScanUint64Props) {
    this.id = props.id ?? 'gpu-scan-uint64';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  /** Adds low-word scan, carry classification, and high-word scan nodes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of [props.inputLow, props.inputHigh, props.outputLow, props.outputHigh]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.inputLow.length === 0) {
      return;
    }
    new GPUScan({
      id: `${this.id}-low`,
      input: props.inputLow,
      output: props.outputLow,
      mode: 'inclusive'
    }).addToGraph(graph);
    const adjustedHigh = createTransientView(
      graph,
      `${this.id}-adjusted-high`,
      'uint32',
      props.inputLow.length
    );
    addCarryPass(graph, props, adjustedHigh);
    new GPUScan({
      id: `${this.id}-high`,
      input: adjustedHigh,
      output: props.outputHigh,
      mode: 'inclusive'
    }).addToGraph(graph);
  }
}

function addCarryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUScanUint64Props>,
  adjustedHigh: GraphDataView<'uint32'>
): void {
  const length = props.inputLow.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUScanUint64',
    length,
    UINT64_SCAN_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const LENGTH: u32 = ${length}u;
const INPUT_HIGH_OFFSET: u32 = ${getViewElementOffset(props.inputHigh)}u;
const PREFIX_LOW_OFFSET: u32 = ${getViewElementOffset(props.outputLow)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(adjustedHigh)}u;
@group(0) @binding(0) var<storage, read> inputHigh: array<u32>;
@group(0) @binding(1) var<storage, read> prefixLow: array<u32>;
@group(0) @binding(2) var<storage, read_write> adjustedHigh: array<u32>;
@compute @workgroup_size(${UINT64_SCAN_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, UINT64_SCAN_WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  var carry = 0u;
  if (index > 0u && prefixLow[PREFIX_LOW_OFFSET + index] < prefixLow[PREFIX_LOW_OFFSET + index - 1u]) {
    carry = 1u;
  }
  adjustedHigh[OUTPUT_OFFSET + index] = inputHigh[INPUT_HIGH_OFFSET + index] + carry;
}`;
  graph.addComputePass({
    id: `${props.id}-carry`,
    workload: {
      operation: 'GPUScanUint64',
      commandCount: 1,
      maximumWorkgroupCount: Math.ceil(length / UINT64_SCAN_WORKGROUP_SIZE),
      maximumInvocationCount:
        Math.ceil(length / UINT64_SCAN_WORKGROUP_SIZE) * UINT64_SCAN_WORKGROUP_SIZE,
      readByteLength: length * 2 * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: length * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: props.inputHigh, usage: 'storage-read'},
      {buffer: props.outputLow, usage: 'storage-read'},
      {buffer: adjustedHigh, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${props.id}-carry`,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputHigh', type: 'read-only-storage', group: 0, location: 0},
            {name: 'prefixLow', type: 'read-only-storage', group: 0, location: 1},
            {name: 'adjustedHigh', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputHigh: getViewBinding(props.inputHigh, getBuffer),
            prefixLow: getViewBinding(props.outputLow, getBuffer),
            adjustedHigh: getViewBinding(adjustedHigh, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(props: Readonly<GPUScanUint64Props>): void {
  for (const [name, view] of Object.entries({
    inputLow: props.inputLow,
    inputHigh: props.inputHigh,
    outputLow: props.outputLow,
    outputHigh: props.outputHigh
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  if (
    props.inputHigh.length !== props.inputLow.length ||
    props.outputLow.length < props.inputLow.length ||
    props.outputHigh.length < props.inputLow.length
  ) {
    throw new Error(`${props.id} inputs must match and outputs must cover every input row`);
  }
  if (
    props.outputLow.buffer === props.inputHigh.buffer ||
    props.outputHigh.buffer === props.inputLow.buffer ||
    props.outputLow.buffer === props.outputHigh.buffer
  ) {
    throw new Error(`${props.id} split-word outputs must use safe separate buffers`);
  }
}
