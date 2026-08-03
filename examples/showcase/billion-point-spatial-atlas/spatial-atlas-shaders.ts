// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const SPATIAL_ATLAS_SHADER_HEADER = /* wgsl */ `
struct SpatialAtlasUniforms {
  view: vec4f,
  display: vec4f,
  query: vec4f,
  color: vec4f,
  selection: vec4f,
  camera: vec4f,
};

@group(0) @binding(0) var<storage, read> pointPositions: array<f32>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<storage, read> pointAttributes: array<u32>;
@group(0) @binding(3) var<uniform> uniforms: SpatialAtlasUniforms;

struct AtlasProjection {
  clipCenter: vec2f,
  clipDepth: f32,
  perspective: f32,
};

fn projectAtlasPoint(source: vec3f) -> AtlasProjection {
  let mode = u32(uniforms.display.w);
  let cosineYaw = uniforms.view.x;
  let sineYaw = uniforms.view.y;
  let cosinePitch = uniforms.view.z;
  let sinePitch = uniforms.view.w;
  let rotatedX = source.x * cosineYaw - source.y * sineYaw;
  let rotatedY = source.x * sineYaw + source.y * cosineYaw;
  let projectedY = rotatedY * cosinePitch - source.z * sinePitch;
  let depth = rotatedY * sinePitch + source.z * cosinePitch;
  let perspective = 1.0 / max(0.55, 1.0 + depth * 0.28);
  let projected = select(source.xy, vec2f(rotatedX, projectedY) * perspective, mode == 1u);
  let viewportAspect = max(uniforms.display.x / max(uniforms.display.y, 1.0), 0.0001);
  let cameraZoom = max(uniforms.camera.z, 0.0001);
  let cameraRelative = projected - uniforms.camera.xy;

  var result: AtlasProjection;
  result.clipCenter = vec2f(
    cameraRelative.x * cameraZoom / viewportAspect,
    cameraRelative.y * cameraZoom
  );
  result.clipDepth = select(
    0.4,
    clamp(0.45 + depth * 0.08, 0.05, 0.95),
    mode == 1u
  );
  result.perspective = perspective;
  return result;
}

fn atlasPointSize(projection: AtlasProjection, scale: f32) -> f32 {
  let mode = u32(uniforms.display.w);
  return uniforms.display.z * mix(1.0, projection.perspective, f32(mode)) * scale;
}

fn atlasPointCorner(vertexIndex: u32) -> vec2f {
  let corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  return corners[vertexIndex];
}

fn isAtlasPointHighlighted(sourceIndex: u32) -> bool {
  return uniforms.selection.x > 0.5 && sourceIndex == u32(uniforms.selection.x - 1.0);
}
`;

const SPATIAL_ATLAS_RENDER_SHADER_BODY = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) pointCoordinate: vec2f,
  @location(1) color: vec4f,
};

fn hash(value: u32) -> f32 {
  var bits = value * 747796405u + 2891336453u;
  bits = ((bits >> ((bits >> 28u) + 4u)) ^ bits) * 277803737u;
  bits = (bits >> 22u) ^ bits;
  return f32(bits & 0x00ffffffu) / 16777215.0;
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = getAtlasSourceIndex(instanceIndex);
  let sourceOffset = sourceIndex * 3u;
  let source = vec3f(
    pointPositions[sourceOffset],
    pointPositions[sourceOffset + 1u],
    pointPositions[sourceOffset + 2u]
  );
  let projection = projectAtlasPoint(source);
  let pointCorner = atlasPointCorner(vertexIndex);
  let pixelScale = vec2f(2.0 / uniforms.display.x, 2.0 / uniforms.display.y);
  let highlighted = atlasLayerSupportsHighlight() && isAtlasPointHighlighted(sourceIndex);
  let layerStyle = getAtlasLayerStyle();
  let selectionLayer = atlasLayerSupportsHighlight();
  let zoom = clamp(uniforms.camera.z, 1.0, 32.0);
  let contextSizeGain = sqrt(zoom);
  let contextOpacityGain = sqrt(zoom);
  let selectedSizeGain = pow(zoom, 0.35);
  let selectedOpacityGain = pow(zoom, 0.2);
  let sizeGain = select(contextSizeGain, selectedSizeGain, selectionLayer);
  let opacityGain = select(contextOpacityGain, selectedOpacityGain, selectionLayer);
  let pointScale = select(layerStyle.z * sizeGain, 1.7 * selectedSizeGain, highlighted);
  let pointSize = atlasPointSize(projection, pointScale);
  let random = hash(sourceIndex);
  let contextTaxiColor = mix(vec3f(0.13, 0.18, 0.22), vec3f(0.24, 0.27, 0.29), random);
  let selectedTaxiColor = vec3f(0.05, 0.82, 1.0) * (0.86 + random * 0.14);
  let taxiColor = select(contextTaxiColor, selectedTaxiColor, selectionLayer);
  let heightColor = mix(
    vec3f(0.08, 0.44, 0.92),
    vec3f(0.94, 0.67, 0.16),
    clamp(source.z * 0.7, 0.0, 1.0)
  );
  let packedAttributes = pointAttributes[sourceIndex];
  let classification = clamp(f32(packedAttributes & 0xffu) / 18.0, 0.0, 1.0);
  let classificationColor = mix(
    vec3f(0.12, 0.72, 0.32),
    vec3f(0.9, 0.18, 0.5),
    classification
  );
  let intensity = f32((packedAttributes >> 8u) & 0xffffu) / 65535.0;
  let intensityColor = mix(vec3f(0.08, 0.3, 0.82), vec3f(0.94, 0.74, 0.2), intensity);
  let lidarColor = select(heightColor, classificationColor, uniforms.query.z > 0.5);
  let selectedLidarColor = select(lidarColor, intensityColor, uniforms.query.z > 1.5);
  let contextLidarColor = mix(vec3f(0.16, 0.2, 0.24), selectedLidarColor, 0.38);
  let lidarLayerColor = select(contextLidarColor, selectedLidarColor, selectionLayer);
  let baseColor = select(taxiColor, lidarLayerColor, u32(uniforms.display.w) == 1u);
  let exposedBaseColor = clamp(
    baseColor * layerStyle.x * uniforms.color.rgb,
    vec3f(0.0),
    vec3f(1.0)
  );
  let finalColor = select(exposedBaseColor, vec3f(1.0, 0.58, 0.12), highlighted);
  let pulse = select(1.0, 0.92 + 0.08 * sin(uniforms.query.w), highlighted);
  let layerOpacity = min(
    layerStyle.y * opacityGain,
    select(0.12, 0.68, selectionLayer)
  );

  var output: VertexOutput;
  output.position = vec4f(
    projection.clipCenter + pointCorner * pixelScale * pointSize,
    projection.clipDepth,
    1.0
  );
  output.pointCoordinate = pointCorner;
  output.color = vec4f(finalColor * pulse, select(layerOpacity, 0.98, highlighted));
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let radiusSquared = dot(input.pointCoordinate, input.pointCoordinate);
  if (radiusSquared > 1.0) {
    discard;
  }
  let coverage = 1.0 - smoothstep(0.08, 1.0, radiusSquared);
  let core = exp(-radiusSquared * 3.5);
  let luminanceProfile = 0.55 + core * 0.45;
  return vec4f(input.color.rgb * luminanceProfile, input.color.a * coverage);
}
`;

/** Subdued full-resident backdrop. Draw directly with `instanceCount === pointCount`. */
export const SPATIAL_ATLAS_CONTEXT_SHADER = /* wgsl */ `${SPATIAL_ATLAS_SHADER_HEADER}
fn getAtlasSourceIndex(instanceIndex: u32) -> u32 {
  return instanceIndex;
}

fn getAtlasLayerStyle() -> vec3f {
  return vec3f(0.32, 0.018, 0.72);
}

fn atlasLayerSupportsHighlight() -> bool {
  return false;
}
${SPATIAL_ATLAS_RENDER_SHADER_BODY}`;

/** Foreground query results. Draw indirectly with IDs from `visibleIds`. */
export const SPATIAL_ATLAS_SELECTED_RESULTS_SHADER = /* wgsl */ `${SPATIAL_ATLAS_SHADER_HEADER}
fn getAtlasSourceIndex(instanceIndex: u32) -> u32 {
  return visibleIds[instanceIndex];
}

fn getAtlasLayerStyle() -> vec3f {
  return vec3f(0.9, 0.34, 1.0);
}

fn atlasLayerSupportsHighlight() -> bool {
  return true;
}
${SPATIAL_ATLAS_RENDER_SHADER_BODY}`;

/** Backwards-compatible name for the selected-results shader. */
export const SPATIAL_ATLAS_RENDER_SHADER = SPATIAL_ATLAS_SELECTED_RESULTS_SHADER;

export const SPATIAL_ATLAS_PICKING_SHADER = /* wgsl */ `${SPATIAL_ATLAS_SHADER_HEADER}
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) pointCoordinate: vec2f,
  @location(1) @interpolate(flat) sourceIndex: u32,
};

struct FragmentOutput {
  @location(0) color: vec4f,
  @location(1) indices: vec2<i32>,
};

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let sourceOffset = sourceIndex * 3u;
  let source = vec3f(
    pointPositions[sourceOffset],
    pointPositions[sourceOffset + 1u],
    pointPositions[sourceOffset + 2u]
  );
  let projection = projectAtlasPoint(source);
  let pointCorner = atlasPointCorner(vertexIndex);
  let pixelScale = vec2f(2.0 / uniforms.display.x, 2.0 / uniforms.display.y);
  let highlighted = isAtlasPointHighlighted(sourceIndex);
  let pointSize = atlasPointSize(projection, select(1.0, 1.7, highlighted));

  var output: VertexOutput;
  output.position = vec4f(
    projection.clipCenter + pointCorner * pixelScale * pointSize,
    projection.clipDepth,
    1.0
  );
  output.pointCoordinate = pointCorner;
  output.sourceIndex = sourceIndex;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
  if (dot(input.pointCoordinate, input.pointCoordinate) > 1.0) {
    discard;
  }
  var output: FragmentOutput;
  output.color = vec4f(0.0);
  output.indices = vec2<i32>(i32(input.sourceIndex), 0);
  return output;
}
`;
