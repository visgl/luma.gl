// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphBufferUsage,
  GraphDataView,
  GraphResourceUse
} from '../gpu-core/gpu-command-graph';
import {GPUScan} from '../gpu-core/gpu-scan';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';

/** Converged sparse representatives, separately valid dense labels, and bounded GPU counts. */
export type GPURasterDenseComponentsProps = {
  id?: string;
  width: number;
  height: number;
  /** One sparse minimum row-major representative plus one for every foreground pixel. */
  input: GraphDataView<'uint32'>;
  /** Independent sparse-label observation validity; valid background remains distinguishable. */
  inputValidity: GraphDataView<'uint32'>;
  /** Upstream GPU scalar; zero clears every dense observation and every published scalar. */
  converged: GraphDataView<'uint32'>;
  /** Caller-owned dense component identifiers, numbered from one in representative order. */
  output: GraphDataView<'uint32'>;
  /** Valid observations preserved inside capacity; truncated foreground becomes invalid. */
  outputValidity: GraphDataView<'uint32'>;
  /** Caller-owned scalar receiving the exact component count clamped to capacity. */
  componentCount: GraphDataView<'uint32'>;
  /** Caller-owned scalar receiving one when the exact count exceeds capacity. */
  overflow: GraphDataView<'uint32'>;
  /** Optional caller-owned scalar receiving the exact, unclamped component count. */
  requiredComponentCount?: GraphDataView<'uint32'>;
  /** Maximum published dense identifier, from zero through pixel count. Defaults to all pixels. */
  capacity?: number;
};

type DenseComponentBinding = {
  name: string;
  view: GraphDataView<'uint32'>;
  usage: Extract<GraphBufferUsage, 'storage-read' | 'storage-write'>;
};

/**
 * Deterministically compacts converged sparse roots into bounded, contiguous component IDs.
 *
 * Representative flags are marked in row-major order, scanned with the existing hierarchical
 * unsigned {@link GPUScan}, and gathered by validated sparse roots. Real background remains
 * valid with identifier zero; missing observations, malformed roots, and components beyond the
 * explicit capacity become invalid. Upstream nonconvergence clears all labels, masks, counts,
 * and overflow on every graph encoding. Scratch is graph-owned; external views stay borrowed.
 */
export class GPURasterDenseComponents implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GraphDataView<'uint32'>;
  readonly inputValidity: GraphDataView<'uint32'>;
  readonly converged: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly componentCount: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly requiredComponentCount?: GraphDataView<'uint32'>;
  readonly capacity: number;

  constructor(props: GPURasterDenseComponentsProps) {
    this.id = props.id ?? 'gpu-raster-dense-components';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.inputValidity = props.inputValidity;
    this.converged = props.converged;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.componentCount = props.componentCount;
    this.overflow = props.overflow;
    this.requiredComponentCount = props.requiredComponentCount;

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
      throw new Error(`${this.id} pixel count and dense component identifiers must fit in uint32`);
    }
    this.capacity = props.capacity ?? pixelCount;
    if (!Number.isSafeInteger(this.capacity) || this.capacity < 0 || this.capacity > pixelCount) {
      throw new Error(
        `${this.id} component capacity must be an integer from zero through pixel count`
      );
    }

    validateRasterScalarView(this.input, 'uint32', pixelCount, `${this.id} sparse labels`);
    validateRasterValidityView(this.inputValidity, pixelCount, `${this.id} sparse validity`);
    validateRasterValidityView(this.converged, 1, `${this.id} convergence state`);
    validateRasterScalarView(this.output, 'uint32', pixelCount, `${this.id} dense labels`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} dense validity`);
    validateRasterValidityView(this.componentCount, 1, `${this.id} component count`);
    validateRasterValidityView(this.overflow, 1, `${this.id} component overflow`);
    if (this.requiredComponentCount) {
      validateRasterValidityView(
        this.requiredComponentCount,
        1,
        `${this.id} required component count`
      );
    }

    const views = this.getBorrowedViews();
    const owner = this.input.buffer.graph;
    for (const [index, view] of views.entries()) {
      if (view.buffer.graph !== owner) {
        throw new Error(
          `${this.id} dense component inputs and outputs must belong to the same graph`
        );
      }
      if (views.slice(index + 1).some(other => other.buffer === view.buffer)) {
        throw new Error(`${this.id} dense component inputs and outputs must use separate buffers`);
      }
    }
  }

  /** Declares representative marking, an exclusive unsigned scan, bounded scatter, and counts. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (graph.device.type !== 'webgpu') {
      throw new Error(`${this.id} dense component relabeling requires a WebGPU device`);
    }
    for (const view of this.getBorrowedViews()) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    if (
      graph.device.limits.maxComputeInvocationsPerWorkgroup < 256 ||
      graph.device.limits.maxComputeWorkgroupSizeX < 256
    ) {
      throw new Error(`${this.id} representative scan exceeds device workgroup limits`);
    }
    const dispatch = getRasterDispatchSize(graph.device, this.width, this.height, this.id);
    const pixelCount = this.width * this.height;
    const rootFlags = createTransientView(graph, `${this.id}-root-flags`, 'uint32', pixelCount);
    const rootOffsets = createTransientView(graph, `${this.id}-root-offsets`, 'uint32', pixelCount);
    assertRasterStorageBindingFits(graph.device, rootFlags, `${this.id} representative flags`);
    assertRasterStorageBindingFits(graph.device, rootOffsets, `${this.id} representative offsets`);

    this.addMarkPass(graph, rootFlags, dispatch);
    new GPUScan({
      id: `${this.id}-scan`,
      input: rootFlags,
      output: rootOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    this.addScatterPass(graph, rootFlags, rootOffsets, dispatch);
    this.addPublicationPass(graph, rootFlags, rootOffsets);
  }

  private addMarkPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    rootFlags: GraphDataView<'uint32'>,
    dispatch: readonly [number, number]
  ): void {
    addDenseComponentPass(
      graph,
      `${this.id}-mark-roots`,
      [
        {name: 'sparseLabels', view: this.input, usage: 'storage-read'},
        {name: 'sparseValidity', view: this.inputValidity, usage: 'storage-read'},
        {name: 'convergenceValues', view: this.converged, usage: 'storage-read'},
        {name: 'rootFlags', view: rootFlags, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(this.input)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.inputValidity)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
const ROOT_OFFSET: u32 = ${getViewElementOffset(rootFlags)}u;
@group(0) @binding(${locations.get('sparseLabels')}) var<storage, read> sparseLabels: array<u32>;
@group(0) @binding(${locations.get('sparseValidity')}) var<storage, read> sparseValidity: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read> convergenceValues: array<u32>;
@group(0) @binding(${locations.get('rootFlags')}) var<storage, read_write> rootFlags: array<u32>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let isRepresentative = convergenceValues[CONVERGENCE_OFFSET] != 0u &&
    sparseValidity[VALIDITY_OFFSET + pixelIndex] != 0u &&
    sparseLabels[INPUT_OFFSET + pixelIndex] == pixelIndex + 1u;
  rootFlags[ROOT_OFFSET + pixelIndex] = select(0u, 1u, isRepresentative);
}`,
      dispatch
    );
  }

  private addScatterPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    rootFlags: GraphDataView<'uint32'>,
    rootOffsets: GraphDataView<'uint32'>,
    dispatch: readonly [number, number]
  ): void {
    addDenseComponentPass(
      graph,
      `${this.id}-scatter`,
      [
        {name: 'sparseLabels', view: this.input, usage: 'storage-read'},
        {name: 'sparseValidity', view: this.inputValidity, usage: 'storage-read'},
        {name: 'convergenceValues', view: this.converged, usage: 'storage-read'},
        {name: 'rootFlags', view: rootFlags, usage: 'storage-read'},
        {name: 'rootOffsets', view: rootOffsets, usage: 'storage-read'},
        {name: 'denseLabels', view: this.output, usage: 'storage-write'},
        {name: 'denseValidity', view: this.outputValidity, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const PIXEL_COUNT: u32 = ${this.width * this.height}u;
const CAPACITY: u32 = ${this.capacity}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(this.input)}u;
const INPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.inputValidity)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
const ROOT_OFFSET: u32 = ${getViewElementOffset(rootFlags)}u;
const SCAN_OFFSET: u32 = ${getViewElementOffset(rootOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(${locations.get('sparseLabels')}) var<storage, read> sparseLabels: array<u32>;
@group(0) @binding(${locations.get('sparseValidity')}) var<storage, read> sparseValidity: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read> convergenceValues: array<u32>;
@group(0) @binding(${locations.get('rootFlags')}) var<storage, read> rootFlags: array<u32>;
@group(0) @binding(${locations.get('rootOffsets')}) var<storage, read> rootOffsets: array<u32>;
@group(0) @binding(${locations.get('denseLabels')}) var<storage, read_write> denseLabels: array<u32>;
@group(0) @binding(${locations.get('denseValidity')}) var<storage, read_write> denseValidity: array<u32>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let sparseLabel = sparseLabels[INPUT_OFFSET + pixelIndex];
  var observationIsValid = convergenceValues[CONVERGENCE_OFFSET] != 0u &&
    sparseValidity[INPUT_VALIDITY_OFFSET + pixelIndex] != 0u;
  var denseLabel = 0u;
  if (observationIsValid && sparseLabel != 0u) {
    if (sparseLabel <= PIXEL_COUNT) {
      let rootIndex = sparseLabel - 1u;
      if (rootFlags[ROOT_OFFSET + rootIndex] != 0u) {
        denseLabel = rootOffsets[SCAN_OFFSET + rootIndex] + 1u;
        observationIsValid = denseLabel <= CAPACITY;
      } else {
        observationIsValid = false;
      }
    } else {
      observationIsValid = false;
    }
  }
  denseLabels[OUTPUT_OFFSET + pixelIndex] = select(0u, denseLabel, observationIsValid);
  denseValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, observationIsValid);
}`,
      dispatch
    );
  }

  private addPublicationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    rootFlags: GraphDataView<'uint32'>,
    rootOffsets: GraphDataView<'uint32'>
  ): void {
    const bindings: DenseComponentBinding[] = [
      {name: 'rootFlags', view: rootFlags, usage: 'storage-read'},
      {name: 'rootOffsets', view: rootOffsets, usage: 'storage-read'},
      {name: 'convergenceValues', view: this.converged, usage: 'storage-read'},
      {name: 'componentCounts', view: this.componentCount, usage: 'storage-write'},
      {name: 'overflowValues', view: this.overflow, usage: 'storage-write'}
    ];
    if (this.requiredComponentCount) {
      bindings.push({
        name: 'requiredComponentCounts',
        view: this.requiredComponentCount,
        usage: 'storage-write'
      });
    }
    addDenseComponentPass(
      graph,
      `${this.id}-publish`,
      bindings,
      locations => {
        const requiredComponentCount = this.requiredComponentCount;
        const requiredDeclaration = requiredComponentCount
          ? `@group(0) @binding(${locations.get('requiredComponentCounts')}) var<storage, read_write> requiredComponentCounts: array<u32>;
const REQUIRED_OFFSET: u32 = ${getViewElementOffset(requiredComponentCount)}u;`
          : '';
        const requiredPublication = requiredComponentCount
          ? 'requiredComponentCounts[REQUIRED_OFFSET] = exactCount;'
          : '';
        return /* wgsl */ `
const LAST_INDEX: u32 = ${this.width * this.height - 1}u;
const CAPACITY: u32 = ${this.capacity}u;
const ROOT_OFFSET: u32 = ${getViewElementOffset(rootFlags)}u;
const SCAN_OFFSET: u32 = ${getViewElementOffset(rootOffsets)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.componentCount)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(this.overflow)}u;
@group(0) @binding(${locations.get('rootFlags')}) var<storage, read> rootFlags: array<u32>;
@group(0) @binding(${locations.get('rootOffsets')}) var<storage, read> rootOffsets: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read> convergenceValues: array<u32>;
@group(0) @binding(${locations.get('componentCounts')}) var<storage, read_write> componentCounts: array<u32>;
@group(0) @binding(${locations.get('overflowValues')}) var<storage, read_write> overflowValues: array<u32>;
${requiredDeclaration}

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x != 0u || globalId.y != 0u) { return; }
  let totalRoots = rootOffsets[SCAN_OFFSET + LAST_INDEX] + rootFlags[ROOT_OFFSET + LAST_INDEX];
  let exactCount = select(0u, totalRoots, convergenceValues[CONVERGENCE_OFFSET] != 0u);
  componentCounts[COUNT_OFFSET] = min(exactCount, CAPACITY);
  overflowValues[OVERFLOW_OFFSET] = select(0u, 1u, exactCount > CAPACITY);
  ${requiredPublication}
}`;
      },
      [1, 1]
    );
  }

  private getBorrowedViews(): GraphDataView<'uint32'>[] {
    return [
      this.input,
      this.inputValidity,
      this.converged,
      this.output,
      this.outputValidity,
      this.componentCount,
      this.overflow,
      ...(this.requiredComponentCount ? [this.requiredComponentCount] : [])
    ];
  }
}

function addDenseComponentPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  bindings: readonly DenseComponentBinding[],
  makeShader: (locations: ReadonlyMap<string, number>) => string,
  dispatch: readonly [number, number]
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
          computation.dispatch(computePass, dispatch[0], dispatch[1]);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
