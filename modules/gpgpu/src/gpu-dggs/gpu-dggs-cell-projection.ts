// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {dggs} from '@luma.gl/shadertools';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphDataView
} from '../gpu-core/gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-core/graph-data-view-utils';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';

const DGGS_CELL_PROJECTION_WORKGROUP_SIZE = 256;

export type DGGSCellProjectionKind = 'lnglat' | 'unit-vector';
export type DGGSCellWordOrder = 'little-endian' | 'high-low';
export type DGGSCellProjectionOutputFormat = 'float32x2' | 'float32x3';

/** DGGS index families implemented by the shared cell projection kernel. */
export type DGGSCellFamily = 'h3' | 'a5';

/** Properties for the family-neutral split-uint64 DGGS projection primitive. */
export type GPUDGGSCellProjectionProps = {
  id?: string;
  family: 'h3' | 'a5';
  cells: GraphDataView<'uint32x2'>;
  output: GraphDataView<DGGSCellProjectionOutputFormat>;
  validity?: GraphDataView<'uint32'>;
  projection?: DGGSCellProjectionKind;
  wordOrder?: DGGSCellWordOrder;
};

type NormalizedDGGSCellProjectionProps = Required<
  Pick<GPUDGGSCellProjectionProps, 'id' | 'family' | 'projection' | 'wordOrder'>
> &
  Pick<GPUDGGSCellProjectionProps, 'cells' | 'output' | 'validity'>;

/**
 * Family-neutral command-graph primitive for projecting packed DGGS cell indexes.
 *
 * Prefer the H3 and A5 subclasses when the family is known statically. This class is useful for
 * planners, benchmarks, and applications that select a supported grid at runtime.
 */
export class GPUDGGSCellProjection implements GPUCommandGraphContributor {
  readonly id: string;
  readonly family: DGGSCellFamily;
  readonly cells: GraphDataView<'uint32x2'>;
  readonly output: GraphDataView<DGGSCellProjectionOutputFormat>;
  readonly validity?: GraphDataView<'uint32'>;
  readonly projection: DGGSCellProjectionKind;
  readonly wordOrder: DGGSCellWordOrder;

  constructor(props: GPUDGGSCellProjectionProps) {
    this.id = props.id ?? `gpu-${props.family}-cell-projection`;
    this.family = props.family;
    this.cells = props.cells;
    this.output = props.output;
    this.validity = props.validity;
    this.projection = props.projection ?? 'lnglat';
    this.wordOrder = props.wordOrder ?? 'little-endian';
    validateDGGSCellProjection(this);
  }

  /** Adds one source-aligned projection pass without submitting or reading data back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addDGGSCellProjectionToGraph(graph, this);
  }
}

function validateDGGSCellProjection(props: NormalizedDGGSCellProjectionProps): void {
  validatePackedView(props.cells, ['uint32x2'], `${props.id} cells`);
  validatePackedView(props.output, ['float32x2', 'float32x3'], `${props.id} output`);
  if (props.validity) {
    validatePackedUint32View(props.validity, `${props.id} validity`);
  }
  const expectedFormat = props.projection === 'lnglat' ? 'float32x2' : 'float32x3';
  if (props.output.format !== expectedFormat) {
    throw new Error(`${props.id} ${props.projection} output must use ${expectedFormat}`);
  }
  if (
    props.output.length !== props.cells.length ||
    (props.validity && props.validity.length !== props.cells.length)
  ) {
    throw new Error(`${props.id} cells, output, and validity must have matching lengths`);
  }
  if (
    props.output.buffer === props.cells.buffer ||
    props.validity?.buffer === props.cells.buffer ||
    props.validity?.buffer === props.output.buffer
  ) {
    throw new Error(`${props.id} cells, output, and validity must use separate buffers`);
  }
}

function addDGGSCellProjectionToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: NormalizedDGGSCellProjectionProps
): void {
  for (const view of [props.cells, props.output, props.validity]) {
    if (view && view.buffer.graph !== graph) {
      throw new Error(`${props.id} views must belong to the target graph`);
    }
  }
  if (props.cells.length === 0) {
    return;
  }

  const dispatchLayout = getBoundedDispatchLayout(
    props.id,
    props.cells.length,
    DGGS_CELL_PROJECTION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getDGGSCellProjectionShaderSource(props, dispatchLayout);
  const views = {
    cells: props.cells,
    projectedValues: props.output,
    ...(props.validity ? {validity: props.validity} : {})
  };
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: `${props.family.toUpperCase()}CellProjection`,
      commandCount: 1,
      maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
      maximumInvocationCount:
        dispatchLayout.x *
        dispatchLayout.y *
        dispatchLayout.z *
        DGGS_CELL_PROJECTION_WORKGROUP_SIZE,
      readByteLength: props.cells.length * 2 * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength:
        props.output.length * props.output.rowByteLength +
        (props.validity?.length ?? 0) * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: props.cells, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'},
      ...(props.validity ? [{buffer: props.validity, usage: 'storage-write'} as const] : [])
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: Object.keys(views).map((name, location) => ({
            name,
            type: name === 'cells' ? ('read-only-storage' as const) : ('storage' as const),
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(views)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getDGGSCellProjectionShaderSource(
  props: NormalizedDGGSCellProjectionProps,
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const componentCount = props.projection === 'lnglat' ? 2 : 3;
  const projectionFunction = `dggs_${props.family}_get_center_${
    props.projection === 'lnglat' ? 'lnglat' : 'unit_vector'
  }`;
  const validityExpression =
    props.family === 'h3'
      ? 'dggs_h3_is_valid_cell_id(cell)'
      : 'dggs_a5_deserialize(cell).valid != 0u && !dggs_u64_is_zero(cell)';
  const canonicalCell =
    props.wordOrder === 'little-endian' ? 'dggs_u64_from_little_endian_words(words)' : 'words';
  const validityBinding = props.validity
    ? '@group(0) @binding(2) var<storage, read_write> validity: array<u32>;'
    : '';
  const validityWrite = props.validity
    ? `validity[${getViewElementOffset(props.validity)}u + index] = select(0u, 1u, isValid);`
    : '';

  return /* wgsl */ `${dggs.source}
const CELL_COUNT: u32 = ${props.cells.length}u;
const CELLS_OFFSET: u32 = ${getViewElementOffset(props.cells)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;

@group(0) @binding(0) var<storage, read> cells: array<u32>;
@group(0) @binding(1) var<storage, read_write> projectedValues: array<f32>;
${validityBinding}

@compute @workgroup_size(${DGGS_CELL_PROJECTION_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, DGGS_CELL_PROJECTION_WORKGROUP_SIZE)}
  if (index >= CELL_COUNT) {
    return;
  }
  let wordOffset = CELLS_OFFSET + index * 2u;
  let words = vec2u(cells[wordOffset], cells[wordOffset + 1u]);
  let cell = ${canonicalCell};
  let isValid = ${validityExpression};
  let projected = select(${props.projection === 'lnglat' ? 'vec2f(0.0)' : 'vec3f(0.0)'}, ${projectionFunction}(cell), isValid);
  let outputOffset = OUTPUT_OFFSET + index * ${componentCount}u;
  ${Array.from(
    {length: componentCount},
    (_, componentIndex) =>
      `projectedValues[outputOffset + ${componentIndex}u] = projected[${componentIndex}u];`
  ).join('\n  ')}
  ${validityWrite}
}`;
}
