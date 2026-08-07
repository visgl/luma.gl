// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding, type BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphBufferUsage,
  GraphDataView,
  GraphResourceUse
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterScalarLiteral,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Orthogonal neighbors only, or orthogonal and diagonal foreground neighbors. */
export type GPURasterConnectivity = 4 | 8;

/** Caller-owned binary observations, sparse root labels, validity, and convergence state. */
export type GPURasterConnectedComponentsProps = {
  id?: string;
  width: number;
  height: number;
  /** Nonzero native uint32 values are foreground; masks and raw nodata remain independent. */
  input: GPURasterBufferBand<'uint32'>;
  /** Sparse deterministic minimum row-major root plus one; zero means background or invalid. */
  output: GraphDataView<'uint32'>;
  /** Separate observation validity; every flag becomes zero when the round budget fails. */
  outputValidity: GraphDataView<'uint32'>;
  /** One caller-owned uint32: one only after a completed no-change stabilization round. */
  converged: GraphDataView<'uint32'>;
  /** Optional caller-owned number of executed active rounds, including stabilization. */
  iterationCount?: GraphDataView<'uint32'>;
  /** Defaults to orthogonal four-connectivity; eight also connects touching diagonals. */
  connectivity?: GPURasterConnectivity;
  /** Explicit round budget from one through 64; defaults to ceil(log2(pixel count)) + 2. */
  maximumIterations?: number;
};

type ComponentBinding = {
  name: string;
  view: GraphDataView;
  usage: Extract<GraphBufferUsage, 'storage-read' | 'storage-write' | 'storage-read-write'>;
};

const MAXIMUM_COMPONENT_ITERATIONS = 64;
const MAXIMUM_ROOT_POINTER_STEPS = 32;

/**
 * Labels valid foreground components without CPU polling, hidden submission, or dense remapping.
 *
 * Graph-owned atomic parent pointers converge by deterministic minimum-root hooking and bounded
 * path compression. Each round publishes GPU-owned indirect work counts; remaining hook and
 * compression dispatches automatically become zero after a no-change stabilization round.
 * Outputs remain caller-owned. An insufficient round budget globally clears all labels and
 * validity so downstream passes cannot consume plausible-looking partial segmentation.
 */
export class GPURasterConnectedComponents implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly converged: GraphDataView<'uint32'>;
  readonly iterationCount?: GraphDataView<'uint32'>;
  readonly connectivity: GPURasterConnectivity;
  readonly maximumIterations: number;

  constructor(props: GPURasterConnectedComponentsProps) {
    this.id = props.id ?? 'gpu-raster-connected-components';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.converged = props.converged;
    this.iterationCount = props.iterationCount;
    this.connectivity = props.connectivity ?? 4;

    if (
      !Number.isSafeInteger(this.width) ||
      this.width <= 0 ||
      !Number.isSafeInteger(this.height) ||
      this.height <= 0
    ) {
      throw new Error(`${this.id} dimensions must be positive safe integers`);
    }
    const pixelCount = this.width * this.height;
    if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
      throw new Error(`${this.id} pixel count and sparse component roots must fit in uint32`);
    }
    this.maximumIterations =
      props.maximumIterations ?? Math.max(1, Math.ceil(Math.log2(pixelCount)) + 2);

    if (this.connectivity !== 4 && this.connectivity !== 8) {
      throw new Error(`${this.id} connectivity must be four or eight`);
    }
    if (
      !Number.isSafeInteger(this.maximumIterations) ||
      this.maximumIterations < 1 ||
      this.maximumIterations > MAXIMUM_COMPONENT_ITERATIONS
    ) {
      throw new Error(`${this.id} maximum iterations must be an integer from one through 64`);
    }
    if (this.input.storage.kind !== 'buffer' || this.input.format !== 'uint32') {
      throw new Error(`${this.id} requires a buffer-backed uint32 foreground band`);
    }
    if (
      (this.input.scale !== undefined && this.input.scale !== 1) ||
      (this.input.offset !== undefined && this.input.offset !== 0)
    ) {
      throw new Error(`${this.id} foreground masks require identity input calibration`);
    }

    const owner = validateRasterBand(this.input, this, `${this.id} input`);
    validateRasterScalarView(this.output, 'uint32', pixelCount, `${this.id} output labels`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    validateRasterValidityView(this.converged, 1, `${this.id} convergence state`);
    if (this.iterationCount) {
      validateRasterValidityView(this.iterationCount, 1, `${this.id} iteration count`);
    }

    const views = this.getBorrowedViews();
    for (const [index, view] of views.entries()) {
      if (view.buffer.graph !== owner) {
        throw new Error(`${this.id} component inputs and outputs must belong to the same graph`);
      }
      if (views.slice(index + 1).some(other => other.buffer === view.buffer)) {
        throw new Error(`${this.id} component inputs and outputs must use separate buffers`);
      }
    }
  }

  /** Declares initialization, bounded indirect union/compression rounds, and gated publication. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (graph.device.type !== 'webgpu') {
      throw new Error(`${this.id} connected-component labeling requires a WebGPU device`);
    }
    for (const view of this.getBorrowedViews()) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    const dispatch = getRasterDispatchSize(graph.device, this.width, this.height, this.id);
    const pixelCount = this.width * this.height;
    const parents = createTransientView(graph, `${this.id}-parents`, 'uint32', pixelCount);
    const changed = createTransientView(graph, `${this.id}-changed`, 'uint32', 1);
    const commands = createTransientView(
      graph,
      `${this.id}-active-dispatch`,
      'uint32',
      3,
      Buffer.STORAGE | Buffer.INDIRECT
    );
    assertRasterStorageBindingFits(graph.device, parents, `${this.id} atomic component parents`);
    assertRasterStorageBindingFits(graph.device, changed, `${this.id} change state`);
    assertRasterStorageBindingFits(graph.device, commands, `${this.id} indirect command`);

    this.addInitializationPass(graph, parents, changed, commands, dispatch);
    for (let iteration = 0; iteration < this.maximumIterations; iteration++) {
      this.addHookPass(graph, parents, changed, commands, iteration);
      this.addCompressionPass(graph, parents, changed, commands, iteration);
      this.addConvergencePass(graph, changed, commands, iteration);
    }
    this.addPublicationPass(graph, parents, dispatch);
  }

  private addInitializationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    parents: GraphDataView<'uint32'>,
    changed: GraphDataView<'uint32'>,
    commands: GraphDataView<'uint32'>,
    dispatch: readonly [number, number]
  ): void {
    const bindings: ComponentBinding[] = [
      {name: 'sourceValues', view: this.input.storage.values, usage: 'storage-read'},
      {name: 'parentValues', view: parents, usage: 'storage-write'},
      {name: 'outputValidity', view: this.outputValidity, usage: 'storage-write'},
      {name: 'convergenceValues', view: this.converged, usage: 'storage-write'},
      {name: 'changeValues', view: changed, usage: 'storage-write'},
      {name: 'dispatchValues', view: commands, usage: 'storage-write'}
    ];
    if (this.input.validity) {
      bindings.push({name: 'sourceValidity', view: this.input.validity, usage: 'storage-read'});
    }
    if (this.iterationCount) {
      bindings.push({name: 'iterationValues', view: this.iterationCount, usage: 'storage-write'});
    }
    addComponentPass(
      graph,
      `${this.id}-initialize`,
      bindings,
      locations => {
        const sourceValidity = this.input.validity;
        const iterationCount = this.iterationCount;
        const validityDeclaration = sourceValidity
          ? `@group(0) @binding(${locations.get('sourceValidity')}) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
          : '';
        const validityCondition = sourceValidity
          ? ' && sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u'
          : '';
        const noDataCondition =
          this.input.noDataValue !== undefined
            ? ` && rawSample != ${getRasterScalarLiteral(this.input.noDataValue, 'uint32')}`
            : '';
        const iterationDeclaration = iterationCount
          ? `@group(0) @binding(${locations.get('iterationValues')}) var<storage, read_write> iterationValues: array<u32>;
const ITERATION_OFFSET: u32 = ${getViewElementOffset(iterationCount)}u;`
          : '';
        const iterationInitialization = iterationCount
          ? 'iterationValues[ITERATION_OFFSET] = 0u;'
          : '';
        return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parents)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
const DISPATCH_OFFSET: u32 = ${getViewElementOffset(commands)}u;
@group(0) @binding(${locations.get('sourceValues')}) var<storage, read> sourceValues: array<u32>;
@group(0) @binding(${locations.get('parentValues')}) var<storage, read_write> parentValues: array<atomic<u32>>;
@group(0) @binding(${locations.get('outputValidity')}) var<storage, read_write> outputValidity: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read_write> convergenceValues: array<u32>;
@group(0) @binding(${locations.get('changeValues')}) var<storage, read_write> changeValues: array<atomic<u32>>;
@group(0) @binding(${locations.get('dispatchValues')}) var<storage, read_write> dispatchValues: array<u32>;
${validityDeclaration}
${iterationDeclaration}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = sourceValues[SOURCE_OFFSET + pixelIndex];
  let observed = true${validityCondition}${noDataCondition};
  let foreground = observed && rawSample != 0u;
  atomicStore(&parentValues[PARENT_OFFSET + pixelIndex], select(0u, pixelIndex + 1u, foreground));
  outputValidity[VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, observed);
  if (pixelIndex == 0u) {
    convergenceValues[CONVERGENCE_OFFSET] = 0u;
    atomicStore(&changeValues[CHANGED_OFFSET], 0u);
    dispatchValues[DISPATCH_OFFSET] = ${dispatch[0]}u;
    dispatchValues[DISPATCH_OFFSET + 1u] = ${dispatch[1]}u;
    dispatchValues[DISPATCH_OFFSET + 2u] = 1u;
    ${iterationInitialization}
  }
}`;
      },
      dispatch
    );
  }

  private addHookPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    parents: GraphDataView<'uint32'>,
    changed: GraphDataView<'uint32'>,
    commands: GraphDataView<'uint32'>,
    iteration: number
  ): void {
    addComponentPass(
      graph,
      `${this.id}-hook-${iteration}`,
      [
        {name: 'parentValues', view: parents, usage: 'storage-read-write'},
        {name: 'changeValues', view: changed, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parents)}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
@group(0) @binding(${locations.get('parentValues')}) var<storage, read_write> parentValues: array<atomic<u32>>;
@group(0) @binding(${locations.get('changeValues')}) var<storage, read_write> changeValues: array<atomic<u32>>;

fn followRoot(label: u32) -> u32 {
  var root = label;
  for (var depth = 0u; depth < ${MAXIMUM_ROOT_POINTER_STEPS}u; depth++) {
    let parent = atomicLoad(&parentValues[PARENT_OFFSET + root - 1u]);
    if (parent == root) { break; }
    root = parent;
  }
  return root;
}

fn connectPixels(firstIndex: u32, secondIndex: u32) {
  let firstLabel = atomicLoad(&parentValues[PARENT_OFFSET + firstIndex]);
  let secondLabel = atomicLoad(&parentValues[PARENT_OFFSET + secondIndex]);
  if (firstLabel == 0u || secondLabel == 0u) { return; }
  let firstRoot = followRoot(firstLabel);
  let secondRoot = followRoot(secondLabel);
  if (firstRoot == secondRoot) { return; }
  let lowerRoot = min(firstRoot, secondRoot);
  let higherRoot = max(firstRoot, secondRoot);
  let previousRoot = atomicMin(&parentValues[PARENT_OFFSET + higherRoot - 1u], lowerRoot);
  if (previousRoot > lowerRoot) {
    atomicOr(&changeValues[CHANGED_OFFSET], 1u);
  }
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  if (atomicLoad(&parentValues[PARENT_OFFSET + pixelIndex]) == 0u) { return; }
  if (globalId.x > 0u) { connectPixels(pixelIndex, pixelIndex - 1u); }
  if (globalId.y > 0u) {
    connectPixels(pixelIndex, pixelIndex - WIDTH);
    ${this.connectivity === 8 ? 'if (globalId.x > 0u) { connectPixels(pixelIndex, pixelIndex - WIDTH - 1u); }' : ''}
    ${this.connectivity === 8 ? 'if (globalId.x + 1u < WIDTH) { connectPixels(pixelIndex, pixelIndex - WIDTH + 1u); }' : ''}
  }
}`,
      undefined,
      commands
    );
  }

  private addCompressionPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    parents: GraphDataView<'uint32'>,
    changed: GraphDataView<'uint32'>,
    commands: GraphDataView<'uint32'>,
    iteration: number
  ): void {
    addComponentPass(
      graph,
      `${this.id}-compress-${iteration}`,
      [
        {name: 'parentValues', view: parents, usage: 'storage-read-write'},
        {name: 'changeValues', view: changed, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parents)}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
@group(0) @binding(${locations.get('parentValues')}) var<storage, read_write> parentValues: array<atomic<u32>>;
@group(0) @binding(${locations.get('changeValues')}) var<storage, read_write> changeValues: array<atomic<u32>>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let initialParent = atomicLoad(&parentValues[PARENT_OFFSET + pixelIndex]);
  if (initialParent == 0u) { return; }
  var root = initialParent;
  for (var depth = 0u; depth < ${MAXIMUM_ROOT_POINTER_STEPS}u; depth++) {
    let parent = atomicLoad(&parentValues[PARENT_OFFSET + root - 1u]);
    if (parent == root) { break; }
    root = parent;
  }
  if (root < initialParent) {
    let previousRoot = atomicMin(&parentValues[PARENT_OFFSET + pixelIndex], root);
    if (previousRoot > root) {
      atomicOr(&changeValues[CHANGED_OFFSET], 1u);
    }
  }
}`,
      undefined,
      commands
    );
  }

  private addConvergencePass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    changed: GraphDataView<'uint32'>,
    commands: GraphDataView<'uint32'>,
    iteration: number
  ): void {
    const bindings: ComponentBinding[] = [
      {name: 'changeValues', view: changed, usage: 'storage-read-write'},
      {name: 'dispatchValues', view: commands, usage: 'storage-read-write'},
      {name: 'convergenceValues', view: this.converged, usage: 'storage-read-write'}
    ];
    if (this.iterationCount) {
      bindings.push({
        name: 'iterationValues',
        view: this.iterationCount,
        usage: 'storage-read-write'
      });
    }
    addComponentPass(
      graph,
      `${this.id}-convergence-${iteration}`,
      bindings,
      locations => {
        const iterationCount = this.iterationCount;
        const iterationDeclaration = iterationCount
          ? `@group(0) @binding(${locations.get('iterationValues')}) var<storage, read_write> iterationValues: array<u32>;
const ITERATION_OFFSET: u32 = ${getViewElementOffset(iterationCount)}u;`
          : '';
        const iterationIncrement = iterationCount ? 'iterationValues[ITERATION_OFFSET] += 1u;' : '';
        return /* wgsl */ `
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
const DISPATCH_OFFSET: u32 = ${getViewElementOffset(commands)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
@group(0) @binding(${locations.get('changeValues')}) var<storage, read_write> changeValues: array<atomic<u32>>;
@group(0) @binding(${locations.get('dispatchValues')}) var<storage, read_write> dispatchValues: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read_write> convergenceValues: array<u32>;
${iterationDeclaration}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x != 0u || globalId.y != 0u || dispatchValues[DISPATCH_OFFSET] == 0u) {
    return;
  }
  ${iterationIncrement}
  if (atomicLoad(&changeValues[CHANGED_OFFSET]) == 0u) {
    convergenceValues[CONVERGENCE_OFFSET] = 1u;
    dispatchValues[DISPATCH_OFFSET] = 0u;
    dispatchValues[DISPATCH_OFFSET + 1u] = 0u;
    dispatchValues[DISPATCH_OFFSET + 2u] = 0u;
  } else {
    atomicStore(&changeValues[CHANGED_OFFSET], 0u);
  }
}`;
      },
      [1, 1]
    );
  }

  private addPublicationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    parents: GraphDataView<'uint32'>,
    dispatch: readonly [number, number]
  ): void {
    addComponentPass(
      graph,
      `${this.id}-publish`,
      [
        {name: 'parentValues', view: parents, usage: 'storage-read'},
        {name: 'convergenceValues', view: this.converged, usage: 'storage-read'},
        {name: 'outputLabels', view: this.output, usage: 'storage-write'},
        {name: 'outputValidity', view: this.outputValidity, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parents)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(${locations.get('parentValues')}) var<storage, read> parentValues: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read> convergenceValues: array<u32>;
@group(0) @binding(${locations.get('outputLabels')}) var<storage, read_write> outputLabels: array<u32>;
@group(0) @binding(${locations.get('outputValidity')}) var<storage, read_write> outputValidity: array<u32>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let accepted = convergenceValues[CONVERGENCE_OFFSET] != 0u;
  outputLabels[OUTPUT_OFFSET + pixelIndex] =
    select(0u, parentValues[PARENT_OFFSET + pixelIndex], accepted);
  outputValidity[VALIDITY_OFFSET + pixelIndex] =
    select(0u, outputValidity[VALIDITY_OFFSET + pixelIndex], accepted);
}`,
      dispatch
    );
  }

  private getBorrowedViews(): GraphDataView[] {
    return [
      this.input.storage.values,
      ...(this.input.validity ? [this.input.validity] : []),
      this.output,
      this.outputValidity,
      this.converged,
      ...(this.iterationCount ? [this.iterationCount] : [])
    ];
  }
}

function addComponentPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  bindings: readonly ComponentBinding[],
  makeShader: (locations: ReadonlyMap<string, number>) => string,
  directDispatch?: readonly [number, number],
  indirectDispatch?: GraphDataView<'uint32'>
): void {
  if (bindings.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${id} exceeds the device storage binding count`);
  }
  const resources: GraphResourceUse[] = [];
  const declarations: BindingDeclaration[] = [];
  const locations = new Map<string, number>();
  for (const [index, binding] of bindings.entries()) {
    if (binding.view.buffer.graph !== graph) {
      throw new Error(`${id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, binding.view, `${id} ${binding.view.buffer.id}`);
    resources.push({buffer: binding.view, usage: binding.usage});
    declarations.push({
      name: binding.name,
      type: binding.usage === 'storage-read' ? 'read-only-storage' : 'storage',
      group: 0,
      location: index
    });
    locations.set(binding.name, index);
  }
  if (indirectDispatch) {
    resources.push({buffer: indirectDispatch.buffer, usage: 'indirect'});
  }
  graph.addComputePass({
    id,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
        source: makeShader(locations),
        shaderLayout: {bindings: declarations}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const binding of bindings) {
            resolved[binding.name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(resolved);
          if (indirectDispatch) {
            computation.dispatchIndirect(
              computePass,
              getBuffer(indirectDispatch.buffer),
              indirectDispatch.byteOffset
            );
          } else if (directDispatch) {
            computation.dispatch(computePass, directDispatch[0], directDispatch[1]);
          }
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
