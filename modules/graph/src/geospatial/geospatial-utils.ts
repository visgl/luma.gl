// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuSpatial.

import {UniformStore, type Binding, type Buffer, type Device} from '@luma.gl/core';
import {assembleComputeKernel} from '../utils/assemble-compute-kernel';
import {Kernel, getPlatformInfo} from '@luma.gl/gpgpu';
import {DynamicBuffer} from '@luma.gl/core/dynamic';
import {fp64arithmetic, WGSLShaderAssembler, type ShaderModule} from '@luma.gl/shaders';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUCommandGraph,
  type GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from '@luma.gl/graph/gpu-core';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedView
} from '@luma.gl/graph/gpu-core';

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

/**
 * fp64 arithmetic requested for a precise geospatial kernel. @internal
 * - `integer`: always use the integer-controlled implementation.
 * - `classic`: always use classic double-single, with the fp64arithmetic uniforms bound.
 * - `platform`: choose per device with `getPlatformFP64Arithmetic()`.
 */
export type GeospatialFP64Arithmetic = 'integer' | 'classic' | 'platform';

/**
 * Chooses fp64 arithmetic for precise kernels on a device. @internal
 *
 * Metal reassociates the floating-point transforms classic double-single arithmetic relies on,
 * so Metal keeps the integer-controlled implementation. D3D12 inlines every function call into
 * DXIL, where the integer-controlled shaders grow too large to compile in practical time, so
 * D3D11, D3D12 and Vulkan use classic double-single. Browsers rarely report the backend; then a
 * host known not to be Apple selects classic, and an Apple or unidentified host keeps the
 * integer-controlled implementation: it is correct everywhere, only slow to compile.
 */
export function getPlatformFP64Arithmetic(device: Device): 'integer' | 'classic' {
  const {type, gpu, gpuType, gpuBackend, fallback} = device.info;
  if (type !== 'webgpu' || gpu === 'apple' || gpu === 'software' || gpuType === 'cpu' || fallback) {
    return 'integer';
  }
  if (gpuBackend === 'metal') {
    return 'integer';
  }
  if (gpuBackend === 'd3d12' || gpuBackend === 'd3d11' || gpuBackend === 'vulkan') {
    return 'classic';
  }
  // Browsers rarely report the backend; WebGPU uses Metal on every Apple operating system.
  return getHostOperatingSystem() === 'non-apple' ? 'classic' : 'integer';
}

/** Classifies the host operating system from the navigator, or `unknown` without one. */
function getHostOperatingSystem(): 'apple' | 'non-apple' | 'unknown' {
  const navigator = (
    globalThis as {
      navigator?: {userAgentData?: {platform?: string}; platform?: string; userAgent?: string};
    }
  ).navigator;
  const platform = `${navigator?.userAgentData?.platform ?? ''} ${navigator?.platform ?? ''} ${
    navigator?.userAgent ?? ''
  }`;
  if (/mac|darwin|iphone|ipad|ipod|\bios\b/i.test(platform)) {
    return 'apple';
  }
  if (/win|linux|android|cros|x11/i.test(platform)) {
    return 'non-apple';
  }
  return 'unknown';
}

/**
 * Defines for classic double-single arithmetic. WGSL assembly does not emit the GLSL platform
 * defines, so the same per-vendor fp64 workarounds are applied here. @internal
 */
export function getClassicFP64Defines(gpu: string): Record<string, boolean> {
  switch (gpu.toLowerCase()) {
    case 'nvidia':
      return {LUMA_FP64_INTEGER_ARITHMETIC: false, LUMA_FP64_CODE_ELIMINATION_WORKAROUND: true};
    case 'amd':
      return {LUMA_FP64_INTEGER_ARITHMETIC: false};
    case 'intel':
      // Intel gets both workarounds, as in the GLSL platform defines.
      return {
        LUMA_FP64_INTEGER_ARITHMETIC: false,
        LUMA_FP64_CODE_ELIMINATION_WORKAROUND: true,
        LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND: true
      };
    default:
      // Unidentified GPUs (e.g. Firefox WebGPU, which reports no vendor) skip the high-bits
      // workaround: its re-split costs about 2^-36 relative precision in every product.
      return {LUMA_FP64_INTEGER_ARITHMETIC: false, LUMA_FP64_CODE_ELIMINATION_WORKAROUND: true};
  }
}

export type GPURowView<T extends GPUVectorFormat> = GraphDataView<T> | GraphVectorView<T>;

export type GeospatialDispatchLayout = {
  x: number;
  y: number;
  z: number;
};

/** Internal fp64 source specialization for precise geospatial kernels. @internal */
export type GeospatialFP64Profile = 'full' | 'predicate-f32' | 'predicate-raw';

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
  let scaledX = fp64_scale_fp64(normalizedX, -scaleExponent);
  let scaledY = fp64_scale_fp64(normalizedY, -scaleExponent);
  let scaledLength = sqrt_fp64(
    sum_fp64(mul_fp64(scaledX, scaledX), mul_fp64(scaledY, scaledY))
  );
  return fp64_scale_fp64(scaledLength, scaleExponent);
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
    operation?: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchLayout: GeospatialDispatchLayout;
    precise?: boolean;
    fp64Profile?: GeospatialFP64Profile;
    /**
     * fp64 arithmetic for precise kernels. Default `integer`. The predicate profiles support only
     * `integer`.
     */
    fp64Arithmetic?: GeospatialFP64Arithmetic;
  }
): void {
  if (!props.precise && props.fp64Profile !== undefined) {
    throw new Error('geospatial fp64 profiles require precise arithmetic');
  }
  // The predicate profiles omit fp64 helpers that classic arithmetic calls, so the assembled WGSL
  // would not compile. 'platform' is rejected too: it selects classic arithmetic on some devices.
  if (
    props.fp64Profile !== undefined &&
    props.fp64Profile !== 'full' &&
    props.fp64Arithmetic !== undefined &&
    props.fp64Arithmetic !== 'integer'
  ) {
    throw new Error(
      `geospatial fp64Profile '${props.fp64Profile}' requires fp64Arithmetic 'integer', not '${props.fp64Arithmetic}'`
    );
  }
  graph.addComputePass({
    id: props.id,
    ...(props.operation ? {workload: {operation: props.operation}} : {}),
    resources: props.resources,
    compile: ({device}) => {
      const classic =
        props.precise &&
        (props.fp64Arithmetic === 'classic' ||
          (props.fp64Arithmetic === 'platform' && getPlatformFP64Arithmetic(device) === 'classic'));
      const modules: ShaderModule[] = props.precise
        ? [classic ? (fp64arithmetic as ShaderModule) : GEOSPATIAL_INTEGER_FP64_ARITHMETIC_MODULE]
        : [];
      const fp64Profile = props.fp64Profile ?? 'full';
      const defines: Record<string, boolean | number> = props.precise
        ? {
            ...(classic
              ? getClassicFP64Defines(device.info.gpu)
              : {LUMA_FP64_INTEGER_ARITHMETIC: true}),
            ...(fp64Profile === 'full' ? {} : {LUMA_FP64_PREDICATE_ONLY: true}),
            ...(fp64Profile === 'predicate-f32' ? {LUMA_FP64_F32_INPUT_ONLY: true} : {})
          }
        : {};
      // Classic arithmetic reads the fp64arithmetic uniforms. The entry point uses them
      // statically, so the automatic pipeline layout always includes the uniform binding.
      const source = classic ? addFP64UniformUse(props.source) : props.source;
      const shaderAssembler = new WGSLShaderAssembler();
      const kernel = new Kernel(
        device,
        assembleComputeKernel(device, {
          id: props.id,
          source,
          modules,
          defines,
          shaderAssembler,
          shaderLayout: {
            bindings: [
              ...Object.keys(props.bindings).map((name, location) => ({
                name,
                type: 'storage' as const,
                group: 0,
                location
              })),
              ...(classic
                ? [getFP64UniformBinding(device, shaderAssembler, source, modules, defines)]
                : [])
            ]
          }
        })
      );
      const uniforms = classic ? new UniformStore(device, {fp64arithmetic}) : null;
      const uniformBindings: Record<string, Binding> = uniforms
        ? {[fp64arithmetic.name]: uniforms.getManagedUniformBuffer(fp64arithmetic.name)}
        : {};
      // Allocate the managed buffer before uploading the arithmetic constants.
      uniforms?.setUniforms({fp64arithmetic: fp64arithmetic.defaultUniforms!});
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          const kernelBindings = {...uniformBindings, ...bindings};
          kernel.dispatch(computePass, {
            bindings: kernelBindings,
            x: props.dispatchLayout.x,
            y: props.dispatchLayout.y,
            z: props.dispatchLayout.z
          });
        },
        destroy: () => {
          kernel.destroy();
          uniforms?.destroy();
        }
      };
    }
  });
}

/**
 * Returns the fp64arithmetic uniform binding of a kernel, as assigned by the shader assembler. The binding location comes from that assembler's registry, so it matches.
 */
function getFP64UniformBinding(
  device: Device,
  shaderAssembler: WGSLShaderAssembler,
  source: string,
  modules: ShaderModule[],
  defines: Record<string, boolean | number>
): {name: string; type: 'uniform'; group: number; location: number} {
  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: getPlatformInfo(device),
    source,
    modules,
    defines,
    shaderStage: 'compute',
    scanVertexAttributes: false
  }).source;
  const match = new RegExp(
    `@group\\((\\d+)\\)\\s*@binding\\((\\d+)\\)\\s*var<uniform>\\s*${fp64arithmetic.name}\\b`
  ).exec(assembled);
  if (!match) {
    throw new Error('classic fp64 arithmetic requires the fp64arithmetic uniform binding');
  }
  return {
    name: fp64arithmetic.name,
    type: 'uniform',
    group: Number(match[1]),
    location: Number(match[2])
  };
}

/**
 * Adds a static use of the fp64arithmetic uniforms at the start of the compute entry point, so
 * the uniform binding is part of the automatic pipeline layout whatever the kernel computes.
 * @internal
 */
export function addFP64UniformUse(source: string): string {
  // Search a copy with comments blanked out, so positions still match the original source.
  const searchable = source.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, comment =>
    comment.replace(/[^\n]/g, ' ')
  );
  const entryPoints = [
    ...searchable.matchAll(/@compute\b[^;{]*?\bfn\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/g)
  ];
  if (entryPoints.length !== 1) {
    throw new Error(`expected one compute entry point, found ${entryPoints.length}`);
  }
  // Skip the parameter list, whose attributes contain parentheses, then the return type.
  let index = entryPoints[0].index! + entryPoints[0][0].length;
  for (let depth = 1; depth > 0 && index < searchable.length; index++) {
    if (searchable[index] === '(') depth++;
    else if (searchable[index] === ')') depth--;
  }
  const bodyStart = searchable.indexOf('{', index);
  if (bodyStart < 0) {
    throw new Error('compute entry point has no body');
  }
  return `${source.slice(0, bodyStart + 1)}
  _ = ${fp64arithmetic.name}.ONE;${source.slice(bodyStart + 1)}`;
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
