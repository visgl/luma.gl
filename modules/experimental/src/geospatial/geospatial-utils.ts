// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding, type Buffer} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {fp64arithmetic, type ShaderModule} from '@luma.gl/shadertools';
import type {GPUVectorFormat} from '@luma.gl/tables';
import {
  GPUCommandGraph,
  type GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';

export const GEOSPATIAL_WORKGROUP_SIZE = 256;
export const POSITION_FORMATS = ['float32x2', 'uint32x4'] as const;

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_LINEAR_WORKGROUP_COUNT = Math.floor(MAXIMUM_UINT32 / GEOSPATIAL_WORKGROUP_SIZE) + 1;
/** Integer-controlled fp64 module configuration for geospatial kernels. @internal */
export const GEOSPATIAL_INTEGER_FP64_ARITHMETIC_MODULE: ShaderModule = {
  // Precise kernels use only the integer-controlled functions, so omit the classic-path uniforms.
  name: fp64arithmetic.name,
  source: fp64arithmetic.source
};

export type GPURowView<T extends GPUVectorFormat> = GraphDataView<T> | GraphVectorView<T>;

export type GeospatialDispatchLayout = {
  x: number;
  y: number;
  z: number;
};

/** Recognizes vector views structurally across independently bundled package entry points. */
export function isGraphVectorView<T extends GPUVectorFormat>(
  rows: GPURowView<T>
): rows is GraphVectorView<T> {
  return Array.isArray((rows as GraphVectorView<T>).data);
}

export function getRowChunks<T extends GPUVectorFormat>(
  rows: GPURowView<T>
): readonly GraphDataView<T>[] {
  return isGraphVectorView(rows) ? rows.data : [rows];
}

export function validateRowView<T extends GPUVectorFormat>(
  rows: GPURowView<T>,
  formats: readonly T[],
  name: string
): void {
  for (const chunk of getRowChunks(rows)) {
    validatePackedView(chunk, formats, name);
    if (chunk.byteOffset % chunk.rowByteLength !== 0) {
      throw new Error(`${name} must be naturally aligned to its row format`);
    }
    if (chunk.format !== rows.format) {
      throw new Error(`${name} chunks must use the declared vector format`);
    }
  }
}

export function validateMatchingRows(
  first: GPURowView<GPUVectorFormat>,
  second: GPURowView<GPUVectorFormat>,
  name: string
): void {
  if (isGraphVectorView(first) !== isGraphVectorView(second)) {
    throw new Error(`${name} must use the same view kind`);
  }
  if (isGraphVectorView(first) && isGraphVectorView(second)) {
    validateMatchingVectorTopology(first, second, name);
  } else if (first.length !== second.length) {
    throw new Error(`${name} must contain the same number of rows`);
  }
}

export function validateSeparateBuffers(
  output: GPURowView<GPUVectorFormat>,
  inputs: readonly GPURowView<GPUVectorFormat>[],
  name: string
): void {
  const outputBuffers = getRowChunks(output).map(chunk => chunk.buffer);
  for (const input of inputs) {
    if (getRowChunks(input).some(chunk => outputBuffers.includes(chunk.buffer))) {
      throw new Error(`${name} output must use separate buffers from its inputs`);
    }
  }
}

type NamedGeospatialView = readonly [name: string, view: GPURowView<GPUVectorFormat>];

/**
 * Validates that writable geospatial views cannot alias live inputs or earlier outputs.
 *
 * Storage bindings expose the 256-byte-aligned prefix before a logical view, including one row
 * for a zero-length view. Distinct graph handles that have the same known physical default are
 * also rejected because the command graph cannot infer hazards between those handles.
 *
 * @internal
 */
export function validateDisjointGeospatialViews(
  id: string,
  inputs: readonly NamedGeospatialView[],
  outputs: readonly NamedGeospatialView[]
): void {
  const inputChunks = inputs.flatMap(([name, view]) =>
    getRowChunks(view).map(chunk => [name, chunk] as const)
  );
  const previousOutputChunks: (readonly [name: string, view: GraphDataView])[] = [];

  for (const [outputName, output] of outputs) {
    const outputChunks = getRowChunks(output);
    for (const outputChunk of outputChunks) {
      for (const [inputName, inputChunk] of inputChunks) {
        if (doGeospatialBindingFootprintsOverlap(outputChunk, inputChunk)) {
          throw new Error(`${id} output ${outputName} and ${inputName} must not overlap`);
        }
      }
      for (const [previousOutputName, previousOutputChunk] of previousOutputChunks) {
        if (doGeospatialBindingFootprintsOverlap(outputChunk, previousOutputChunk)) {
          throw new Error(
            `${id} output ${outputName} and output ${previousOutputName} must not overlap`
          );
        }
      }
    }
    previousOutputChunks.push(...outputChunks.map(chunk => [outputName, chunk] as const));
  }
}

function doGeospatialBindingFootprintsOverlap(
  first: GraphDataView,
  second: GraphDataView
): boolean {
  if (doGraphDataViewsOverlap(first, second)) {
    return true;
  }

  const firstDefaultBuffer = getDefaultCoreBuffer(first);
  const secondDefaultBuffer = getDefaultCoreBuffer(second);
  if (
    first.buffer !== second.buffer &&
    firstDefaultBuffer !== undefined &&
    firstDefaultBuffer === secondDefaultBuffer
  ) {
    // Separate logical handles cannot safely describe hazards on one physical allocation.
    return true;
  }
  if (first.buffer !== second.buffer) {
    return false;
  }

  const firstRange = getViewBindingRange(first);
  const secondRange = getViewBindingRange(second);
  const firstEnd = firstRange.offset + firstRange.size;
  const secondEnd = secondRange.offset + secondRange.size;
  return firstRange.offset < secondEnd && secondRange.offset < firstEnd;
}

function getDefaultCoreBuffer(view: GraphDataView): Buffer | undefined {
  const defaultBuffer = view.buffer.defaultBuffer;
  return defaultBuffer instanceof DynamicBuffer ? defaultBuffer.buffer : defaultBuffer;
}

export function assertGraphOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  views: readonly GPURowView<GPUVectorFormat>[],
  name: string
): void {
  if (views.some(view => getRowChunks(view).some(chunk => chunk.buffer.graph !== graph))) {
    throw new Error(`${name} views must belong to the target graph`);
  }
}

export function getPositionReadSource(
  name: string,
  view: GraphDataView<'float32x2' | 'uint32x4'>
): {declaration: string; read: (index: string) => string; precise: boolean} {
  const offset = getViewElementOffset(view);
  if (view.format === 'float32x2') {
    return {
      declaration: `const ${name.toUpperCase()}_OFFSET: u32 = ${offset}u;\n@group(0) @binding(auto) var<storage, read> ${name}: array<vec2f>;`,
      read: index => `${name}[${name.toUpperCase()}_OFFSET / 2u + (${index})]`,
      precise: false
    };
  }
  return {
    declaration: `const ${name.toUpperCase()}_OFFSET: u32 = ${offset}u;\n@group(0) @binding(auto) var<storage, read> ${name}: array<u32>;`,
    read: index => {
      const rowOffset = `${name.toUpperCase()}_OFFSET + (${index}) * 4u`;
      return `makeRawPoint(${name}[${rowOffset}], ${name}[${rowOffset} + 1u], ${name}[${rowOffset} + 2u], ${name}[${rowOffset} + 3u])`;
    },
    precise: true
  };
}

export const RAW_POINT_WGSL = /* wgsl */ `
struct RawPoint { x: vec2u, y: vec2u }

fn makeRawPoint(xLow: u32, xHigh: u32, yLow: u32, yHigh: u32) -> RawPoint {
  // Browser Float64Array words are low/high; fp64 helpers consume high/low.
  return RawPoint(
    vec2u(xHigh, xLow),
    vec2u(yHigh, yLow)
  );
}

fn rawScalarIsFinite(value: vec2u) -> bool {
  return ((value.x >> 20u) & 0x7ffu) != 0x7ffu;
}

fn rawPointIsFinite(point: RawPoint) -> bool {
  return rawScalarIsFinite(point.x) && rawScalarIsFinite(point.y);
}

fn rawPointToF32(point: RawPoint) -> vec2f {
  let zero = vec2u(0u, 0u);
  return vec2f(
    sub_fp64u32_to_f32(point.x, zero),
    sub_fp64u32_to_f32(point.y, zero)
  );
}
`;

/** Overflow-safe helpers shared by raw-binary64 planar distance kernels. @internal */
export const PRECISE_DISTANCE_WGSL = /* wgsl */ `
fn geospatial_nan_fp64(seed: f32) -> vec2f {
  return vec2f(fp64_nan(seed), 0.0);
}

fn geospatial_max_abs_fp64(first: vec2f, second: vec2f) -> f32 {
  let normalizedFirst = normalize_fp64(first);
  let normalizedSecond = normalize_fp64(second);
  return max(abs(normalizedFirst.x), abs(normalizedSecond.x));
}

fn geospatial_div_fp64_f32(value: vec2f, divisor: f32) -> vec2f {
  return normalize_fp64(vec2f(value.x / divisor, value.y / divisor));
}

fn geospatial_mul_fp64_f32(value: vec2f, multiplier: f32) -> vec2f {
  return normalize_fp64(vec2f(value.x * multiplier, value.y * multiplier));
}

fn geospatial_abs_fp64(value: vec2f) -> vec2f {
  let normalized = normalize_fp64(value);
  return select(sub_fp64(vec2f(0.0, 0.0), normalized), normalized, sign_fp64(normalized) >= 0);
}

fn geospatial_hypot_fp64(x: vec2f, y: vec2f) -> vec2f {
  let normalizedX = normalize_fp64(x);
  let normalizedY = normalize_fp64(y);
  if (!is_finite_fp64(normalizedX) || !is_finite_fp64(normalizedY)) {
    return geospatial_nan_fp64(normalizedX.x + normalizedY.x);
  }
  let scaleValue = geospatial_max_abs_fp64(normalizedX, normalizedY);
  if (scaleValue == 0.0) {
    return vec2f(0.0, 0.0);
  }
  let scaleExponent = frexp(scaleValue).exp;
  let scaledX = fp64_scale_fp64_integer(normalizedX, -scaleExponent);
  let scaledY = fp64_scale_fp64_integer(normalizedY, -scaleExponent);
  let scaledLength = sqrt_fp64(
    sum_fp64(mul_fp64(scaledX, scaledX), mul_fp64(scaledY, scaledY))
  );
  return fp64_scale_fp64_integer(scaledLength, scaleExponent);
}
`;

/** Plans a bounded three-dimensional dispatch for one packed row chunk. @internal */
export function getGeospatialDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GeospatialDispatchLayout {
  if (!Number.isSafeInteger(elementCount) || elementCount < 0 || elementCount > MAXIMUM_UINT32) {
    throw new Error('geospatial element count must be a non-negative uint32');
  }
  const maximum = Math.floor(maxComputeWorkgroupsPerDimension);
  if (!Number.isSafeInteger(maximum) || maximum < 1) {
    throw new Error('maxComputeWorkgroupsPerDimension must be a positive integer');
  }
  const workgroupCount = Math.max(1, Math.ceil(elementCount / GEOSPATIAL_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) {
    throw new Error(
      `geospatial operation requires ${workgroupCount} workgroups, exceeding the 3D dispatch limit of ${maximum} per dimension`
    );
  }
  return {x, y, z};
}

/** Returns WGSL that maps a bounded 3D dispatch back to one linear row index. @internal */
export function getGeospatialInvocationIndexSource(layout: GeospatialDispatchLayout): string {
  return `let workgroupIndex = (workgroupId.z * ${layout.y}u + workgroupId.y) * ${layout.x}u + workgroupId.x;
  if (workgroupIndex >= ${MAXIMUM_LINEAR_WORKGROUP_COUNT}u) { return; }
  let index = workgroupIndex * ${GEOSPATIAL_WORKGROUP_SIZE}u + localId.x;`;
}

/** Adds one independently composable geospatial compute node. */
export function addGeospatialPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchLayout: GeospatialDispatchLayout;
    precise?: boolean;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const modules: ShaderModule[] = props.precise
        ? [GEOSPATIAL_INTEGER_FP64_ARITHMETIC_MODULE]
        : [];
      const defines: Record<string, boolean | number> = props.precise
        ? {LUMA_FP64_INTEGER_ARITHMETIC: true}
        : {};
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        modules,
        defines,
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

/** Formats a finite f32 value as valid WGSL without malformed exponent suffixes. */
export function getFloat32Literal(value: number): string {
  const float32Value = Math.fround(value);
  if (!Number.isFinite(float32Value)) {
    throw new Error('geospatial numeric properties must be representable as finite float32 values');
  }
  if (Object.is(float32Value, -0)) {
    return '-0.0';
  }
  const literal = String(float32Value);
  return literal.includes('.') || /e/i.test(literal) ? literal : `${literal}.0`;
}

/** Returns canonical high/low hexadecimal words for a raw binary64 WGSL value. @internal */
export function getRawBinary64Literal(value: number): string {
  const bytes = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT);
  const dataView = new DataView(bytes);
  dataView.setFloat64(0, value, false);
  const highWord = dataView.getUint32(0, false);
  const lowWord = dataView.getUint32(4, false);
  return `vec2u(0x${highWord.toString(16)}u, 0x${lowWord.toString(16)}u)`;
}
