// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  StructuredVolumeScalarSource,
  StructuredVolumeVectorSource
} from './structured-volume-renderer';

export const STRUCTURED_VOLUME_UNIFORM_FLOAT_COUNT = 88;
export const STRUCTURED_VOLUME_UNIFORM_BYTE_LENGTH =
  STRUCTURED_VOLUME_UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;
export const STRUCTURED_VOLUME_MAX_SAMPLE_COUNT = 256;

export const STRUCTURED_VOLUME_UNIFORM_OFFSETS = {
  inverseViewProjectionMatrix: 0,
  worldToVolumeMatrix: 16,
  cameraAndSamples: 32,
  viewport: 36,
  dimensionsAndMode: 40,
  boundsMinimum: 44,
  boundsMaximum: 48,
  scalarScales: 52,
  scalarLowColor: 56,
  scalarNeutralColor: 60,
  scalarHighColor: 64,
  vectorScales: 68,
  glyphGrid: 72,
  glyphShape: 76,
  glyphStyle: 80,
  vectorColor: 84
} as const;

export function getStructuredVolumeShaderSource(options: {
  scalar?: StructuredVolumeScalarSource;
  vector?: StructuredVolumeVectorSource;
}): string {
  const scalarDeclaration = getSourceDeclaration('scalarVolume', options.scalar, 0);
  const vectorDeclaration = getSourceDeclaration('vectorVolume', options.vector, 1);
  const scalarSample = getScalarSampleSource(options.scalar);
  const vectorSample = getVectorSampleSource(options.vector);

  return /* wgsl */ `
struct StructuredVolumeUniforms {
  inverseViewProjectionMatrix: mat4x4f,
  worldToVolumeMatrix: mat4x4f,
  cameraAndSamples: vec4f,
  viewport: vec4f,
  dimensionsAndMode: vec4f,
  boundsMinimum: vec4f,
  boundsMaximum: vec4f,
  scalarScales: vec4f,
  scalarLowColor: vec4f,
  scalarNeutralColor: vec4f,
  scalarHighColor: vec4f,
  vectorScales: vec4f,
  glyphGrid: vec4f,
  glyphShape: vec4f,
  glyphStyle: vec4f,
  vectorColor: vec4f,
};

${scalarDeclaration}
${vectorDeclaration}
@group(0) @binding(2) var<uniform> structuredVolume: StructuredVolumeUniforms;

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) clipPosition: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> FragmentInputs {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: FragmentInputs;
  output.clipPosition = positions[vertexIndex];
  output.position = vec4f(output.clipPosition, 0.0, 1.0);
  return output;
}

fn volumeDimensions() -> vec3u {
  return vec3u(structuredVolume.dimensionsAndMode.xyz);
}

fn volumeIndex(coordinate: vec3u) -> u32 {
  let dimensions = volumeDimensions();
  return (coordinate.z * dimensions.y + coordinate.y) * dimensions.x + coordinate.x;
}

fn volumeCoordinates(position: vec3f) -> vec3f {
  let minimum = structuredVolume.boundsMinimum.xyz;
  let maximum = structuredVolume.boundsMaximum.xyz;
  return clamp((position - minimum) / (maximum - minimum), vec3f(0.0), vec3f(1.0));
}

fn volumeCornerCoordinates(base: vec3u, next: vec3u) -> array<vec3u, 8> {
  return array<vec3u, 8>(
    base,
    vec3u(next.x, base.y, base.z),
    vec3u(base.x, next.y, base.z),
    vec3u(next.x, next.y, base.z),
    vec3u(base.x, base.y, next.z),
    vec3u(next.x, base.y, next.z),
    vec3u(base.x, next.y, next.z),
    next
  );
}

fn sampleScalarVolume(position: vec3f) -> f32 {
  ${scalarSample}
}

fn sampleVectorVolume(position: vec3f) -> vec3f {
  ${vectorSample}
}

fn unproject(uv: vec2f, depth: f32) -> vec3f {
  let world = structuredVolume.inverseViewProjectionMatrix * vec4f(uv * 2.0 - 1.0, depth, 1.0);
  return world.xyz / world.w;
}

fn transformPoint(matrix: mat4x4f, point: vec3f) -> vec3f {
  let transformed = matrix * vec4f(point, 1.0);
  return transformed.xyz / transformed.w;
}

fn hash(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn sampleTransfer(position: vec3f) -> vec4f {
  let mode = u32(structuredVolume.dimensionsAndMode.w + 0.5);
  let scalarValue = sampleScalarVolume(position);
  let vectorValue = sampleVectorVolume(position);
  let scaledScalar = scalarValue * structuredVolume.scalarScales.x;
  let scalarTransfer = u32(structuredVolume.scalarScales.w + 0.5);
  let scalarColor = select(
    volumeRaymarch_sequentialColor(
      scaledScalar,
      structuredVolume.scalarLowColor.xyz,
      structuredVolume.scalarHighColor.xyz
    ),
    volumeRaymarch_signedColor(
      scaledScalar,
      structuredVolume.scalarLowColor.xyz,
      structuredVolume.scalarNeutralColor.xyz,
      structuredVolume.scalarHighColor.xyz
    ),
    scalarTransfer == 1u
  );
  let scalarDensity = abs(scaledScalar) * structuredVolume.scalarScales.y * structuredVolume.scalarScales.z;
  let vectorMagnitude = length(vectorValue) * structuredVolume.vectorScales.x;
  let directionColor = volumeRaymarch_directionColor(vectorValue);
  let vectorColor = select(directionColor, structuredVolume.vectorColor.xyz, structuredVolume.vectorScales.w > 0.5);
  let vectorDensity = vectorMagnitude * structuredVolume.vectorScales.y * structuredVolume.vectorScales.z;

  if (mode == 0u) { return vec4f(scalarColor, scalarDensity); }
  if (mode == 1u) { return vec4f(vectorColor, vectorDensity); }
  let totalDensity = scalarDensity + vectorDensity;
  let color = (scalarColor * scalarDensity + vectorColor * vectorDensity) / max(totalDensity, 0.000001);
  return vec4f(color, totalDensity);
}

fn sampleGlyph(position: vec3f) -> vec4f {
  if (structuredVolume.glyphGrid.w < 0.5) { return vec4f(0.0); }
  let grid = max(structuredVolume.glyphGrid.xyz, vec3f(2.0));
  let minimum = structuredVolume.boundsMinimum.xyz;
  let maximum = structuredVolume.boundsMaximum.xyz;
  let normalized = volumeCoordinates(position);
  let glyphCoordinate = clamp(round(normalized * (grid - 1.0)), vec3f(0.0), grid - 1.0);
  let center = mix(minimum, maximum, glyphCoordinate / (grid - 1.0));
  let vector = sampleVectorVolume(center);
  let magnitude = length(vector) * structuredVolume.vectorScales.x;
  if (magnitude < 0.001) { return vec4f(0.0); }
  let direction = vector / length(vector);
  let arrowLength = mix(
    structuredVolume.glyphShape.x,
    structuredVolume.glyphShape.y,
    1.0 - exp(-magnitude * 0.7)
  );
  let distances = volumeRaymarch_arrowDistance(
    position,
    center,
    direction,
    arrowLength,
    structuredVolume.glyphShape.z,
    structuredVolume.glyphShape.w
  );
  let coverage = 1.0 - smoothstep(0.0, structuredVolume.glyphStyle.y, distances.x);
  let headHighlight = 1.0 - smoothstep(-0.006, 0.012, distances.y);
  let directionColor = volumeRaymarch_directionColor(vector);
  let baseColor = select(directionColor, structuredVolume.vectorColor.xyz, structuredVolume.glyphStyle.z > 0.5);
  let color = mix(baseColor * 1.15, vec3f(1.0, 0.92, 0.62), headHighlight * 0.45);
  return vec4f(color, coverage * structuredVolume.glyphStyle.x);
}

@fragment fn fragmentMain(input: FragmentInputs) -> @location(0) vec4f {
  let localPixel = input.position.xy - structuredVolume.viewport.xy;
  let screenUV = localPixel / structuredVolume.viewport.zw;
  let cameraUV = vec2f(screenUV.x, 1.0 - screenUV.y);
  let nearWorld = unproject(cameraUV, 0.0);
  let farWorld = unproject(cameraUV, 1.0);
  let rayOrigin = transformPoint(structuredVolume.worldToVolumeMatrix, structuredVolume.cameraAndSamples.xyz);
  let rayTarget = transformPoint(structuredVolume.worldToVolumeMatrix, farWorld);
  let rayDirection = normalize(rayTarget - rayOrigin);
  let hit = volumeRaymarch_intersectBox(
    rayOrigin,
    rayDirection,
    structuredVolume.boundsMinimum.xyz,
    structuredVolume.boundsMaximum.xyz
  );
  var accumulated = vec4f(0.0);
  if (hit.y > max(hit.x, 0.0)) {
    let start = max(hit.x, 0.0);
    let sampleCount = max(structuredVolume.cameraAndSamples.w, 1.0);
    let stepLength = (hit.y - start) / sampleCount;
    let jitter = select(0.5, hash(input.position.xy), structuredVolume.boundsMaximum.w > 0.5);
    var distance = start + jitter * stepLength;
    for (var step = 0u; step < ${STRUCTURED_VOLUME_MAX_SAMPLE_COUNT}u; step++) {
      if (f32(step) >= sampleCount || accumulated.a > 0.985) { break; }
      let position = rayOrigin + rayDirection * distance;
      var sample = sampleTransfer(position);
      let glyph = sampleGlyph(position);
      if (glyph.a > 0.0) {
        let combinedDensity = sample.a + glyph.a;
        let combinedColor = mix(sample.rgb, glyph.rgb, glyph.a / max(combinedDensity, 0.000001));
        sample = vec4f(combinedColor, combinedDensity);
      }
      let alpha = 1.0 - exp(-sample.a * stepLength * 2.2);
      accumulated = volumeRaymarch_composite(accumulated, sample.rgb, alpha);
      distance += stepLength;
    }
    if (structuredVolume.boundsMinimum.w > 0.5) {
      let entry = rayOrigin + rayDirection * start;
      let edgeDistance = min(abs(entry - structuredVolume.boundsMinimum.xyz), abs(entry - structuredVolume.boundsMaximum.xyz));
      let edgeCount = dot(vec3f(edgeDistance < vec3f(0.018)), vec3f(1.0));
      if (edgeCount >= 2.0) {
        accumulated = volumeRaymarch_composite(accumulated, vec3f(0.1, 0.65, 0.9), 0.65);
      }
    }
  }
  return accumulated;
}`;
}

function getSourceDeclaration(
  name: string,
  source: StructuredVolumeScalarSource | StructuredVolumeVectorSource | undefined,
  location: number
): string {
  if (!source) return '';
  if (source.type === 'texture') {
    return `@group(0) @binding(${location}) var ${name}: texture_3d<f32>;`;
  }
  const valueType = source.format === 'float32' ? 'f32' : 'vec4f';
  return `@group(0) @binding(${location}) var<storage, read> ${name}: array<${valueType}>;`;
}

function getScalarSampleSource(source: StructuredVolumeScalarSource | undefined): string {
  if (!source) return 'return 0.0;';
  return getTrilinearSampleSource(source.type, 'scalarVolume', 'f32', '.x');
}

function getVectorSampleSource(source: StructuredVolumeVectorSource | undefined): string {
  if (!source) return 'return vec3f(0.0);';
  return getTrilinearSampleSource(source.type, 'vectorVolume', 'vec3f', '.xyz');
}

function getTrilinearSampleSource(
  sourceType: 'buffer' | 'texture',
  bindingName: string,
  valueType: 'f32' | 'vec3f',
  textureSwizzle: '.x' | '.xyz'
): string {
  const readExpression =
    sourceType === 'buffer'
      ? `${bindingName}[volumeIndex(coordinates[corner])]${valueType === 'vec3f' ? '.xyz' : ''}`
      : `textureLoad(${bindingName}, vec3i(coordinates[corner]), 0)${textureSwizzle}`;
  const mixFunction = valueType === 'f32' ? 'volumeRaymarch_mixScalar' : 'volumeRaymarch_mixVector';
  return `let samplePosition = volumeCoordinates(position) * vec3f(volumeDimensions() - vec3u(1u));
  let base = vec3u(floor(samplePosition));
  let next = min(base + vec3u(1u), volumeDimensions() - vec3u(1u));
  let coordinates = volumeCornerCoordinates(base, next);
  var corners: array<${valueType}, 8>;
  for (var corner = 0u; corner < 8u; corner++) {
    corners[corner] = ${readExpression};
  }
  return ${mixFunction}(corners, fract(samplePosition));`;
}
