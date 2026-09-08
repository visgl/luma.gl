// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture, TextureFormatColor} from '@luma.gl/core';
import {clusteredDeferredLighting} from '@luma.gl/experimental';
import type {ShaderPass, CompositeShaderPass} from '@luma.gl/shadertools';
import type {NumberArray16} from '@math.gl/core';
import {
  LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS,
  LIGHTSTORM_LIGHTNING_RETURN_STROKE_SCALE,
  LIGHTSTORM_LIGHTNING_RETURN_STROKE_WIDTH_SECONDS,
  LIGHTSTORM_LIGHTNING_STRIKE_WIDTH_SECONDS
} from './lightstorm-lightning';

type LightstormDeferredCompositeProps = {
  forwardColorFloor?: number;
  fogColor?: [number, number, number];
  forwardColorTexture?: Texture;
  depthTexture?: Texture;
  inverseProjectionMatrix?: Readonly<NumberArray16>;
};

type LightstormDeferredCompositeUniforms = {
  inverseProjectionMatrix: Readonly<NumberArray16>;
  fogColor: [number, number, number];
  forwardColorFloor: number;
};

type LightstormDeferredCompositeBindings = {
  forwardColorTexture?: Texture;
  depthTexture?: Texture;
};

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const lightstormDeferredComposite = {
  name: 'lightstormDeferredComposite',
  source: /* wgsl */ `
struct LightstormDeferredCompositeUniforms {
  inverseProjectionMatrix: mat4x4f,
  fogColor: vec3f,
  forwardColorFloor: f32,
};

@group(0) @binding(auto) var<uniform> lightstormDeferredComposite: LightstormDeferredCompositeUniforms;
@group(0) @binding(auto) var forwardColorTexture: texture_2d<f32>;
@group(0) @binding(auto) var forwardColorTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn lightstormDeferredComposite_reconstructViewDepth(texCoord: vec2f, depth: f32) -> f32 {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = lightstormDeferredComposite.inverseProjectionMatrix * clip;
  return abs(viewPosition.z / max(abs(viewPosition.w), 0.00001));
}

fn lightstormDeferredComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let deferredColor = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let forwardColor = textureSampleLevel(
    forwardColorTexture,
    forwardColorTextureSampler,
    texCoord,
    0
  );
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  let viewDepth = lightstormDeferredComposite_reconstructViewDepth(texCoord, depth);
  let fogAmount = clamp(1.0 - exp(-viewDepth * 0.00165), 0.0, 0.96);
  let foggedDeferredColor = mix(
    deferredColor.rgb,
    lightstormDeferredComposite.fogColor,
    fogAmount
  );
  let authoredColorFloor = forwardColor.rgb * lightstormDeferredComposite.forwardColorFloor;
  return vec4f(max(foggedDeferredColor, authoredColorFloor), forwardColor.a);
}
`,
  bindingLayout: [
    {name: 'forwardColorTexture', group: 0},
    {name: 'depthTexture', group: 0}
  ],
  uniforms: {} as LightstormDeferredCompositeUniforms,
  bindings: {} as LightstormDeferredCompositeBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    fogColor: 'vec3<f32>',
    forwardColorFloor: 'f32'
  },
  defaultUniforms: {
    inverseProjectionMatrix: IDENTITY_MATRIX,
    fogColor: [0.008, 0.018, 0.055],
    forwardColorFloor: 0.82
  },
  propTypes: {
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    fogColor: {value: [0.008, 0.018, 0.055], private: true},
    forwardColorFloor: {value: 0.82, min: 0, max: 1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  LightstormDeferredCompositeProps,
  LightstormDeferredCompositeUniforms,
  LightstormDeferredCompositeBindings
>;

/** Preserves Lightstorm's authored HDR fog and emissive energy under clustered deferred light. */
export function createLightstormDeferredLightingCompositeShaderPass(
  colorFormat: TextureFormatColor
): CompositeShaderPass<'deferredLighting'> {
  return {
    name: 'lightstormDeferredLightingCompositeShaderPass',
    renderTargets: {
      deferredLighting: {format: colorFormat}
    },
    steps: [
      {
        shaderPass: clusteredDeferredLighting,
        inputs: {sourceTexture: 'original'},
        output: 'deferredLighting'
      },
      {
        shaderPass: lightstormDeferredComposite,
        inputs: {
          sourceTexture: 'deferredLighting',
          forwardColorTexture: 'original'
        },
        output: 'previous'
      }
    ]
  };
}

export const LIGHTSTORM_RENDER_SHADER = /* wgsl */ `
struct LightstormInstance {
  positionRadius: vec4<f32>,
  halfExtentsSeed: vec4<f32>,
  colorAndKind: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
  previousViewProjectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<storage, read> instances: array<LightstormInstance>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: LightstormUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) worldPosition: vec3<f32>,
  @location(2) localPosition: vec3<f32>,
  @location(3) baseColor: vec3<f32>,
  @location(4) seedAndKind: vec2<f32>,
  @location(5) viewDepth: f32,
  @location(6) @interpolate(flat) sourceIndex: u32,
  @location(7) currentClip: vec4<f32>,
  @location(8) previousClip: vec4<f32>,
};

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) normalRoughness: vec4<f32>,
  @location(2) velocity: vec2<f32>,
  @location(3) baseColorMetallic: vec4<f32>,
  @location(4) emissiveOcclusion: vec4<u32>,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let instance = instances[sourceIndex];
  let localPosition = inputs.positions * instance.halfExtentsSeed.xyz;
  let worldPosition = localPosition + instance.positionRadius.xyz;
  let viewPosition = uniforms.viewMatrix * vec4<f32>(worldPosition, 1.0);
  let currentClip = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  let previousClip = uniforms.previousViewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  var output: VertexOutput;
  output.position = currentClip;
  output.normal = inputs.normals;
  output.worldPosition = worldPosition;
  output.localPosition = localPosition;
  output.baseColor = instance.colorAndKind.rgb;
  output.seedAndKind = vec2<f32>(instance.halfExtentsSeed.w, instance.colorAndKind.w);
  output.viewDepth = -viewPosition.z;
  output.sourceIndex = sourceIndex;
  output.currentClip = currentClip;
  output.previousClip = previousClip;
  return output;
}

fn hashWindow(value: vec2<f32>) -> f32 {
  return fract(sin(dot(value, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
  let normal = normalize(input.normal);
  let seed = input.seedAndKind.x;
  let isTransit = input.seedAndKind.y > 0.5;
  let time = uniforms.scene.x;
  let lightDirection = normalize(vec3<f32>(0.36, 0.82, 0.44));
  let diffuse = max(dot(normal, lightDirection), 0.0);
  let rim = pow(1.0 - abs(normal.z), 3.0);
  var color = input.baseColor * (0.22 + diffuse * 0.72 + rim * 0.08);
  var surfaceBaseColor = input.baseColor;
  var emissive = vec3<f32>(0.0);

  let radialDistance = length(input.worldPosition.xz);
  let travelingWave = pow(
    0.5 + 0.5 * cos(radialDistance * 0.035 - time * 2.5 + seed * 6.28318),
    10.0
  );
  let lightstormEnabled = uniforms.options.w > 0.5;
  let skyPulse = select(0.0, clamp(uniforms.scene.w, 0.0, 1.0), lightstormEnabled);

  if (isTransit) {
    let laneCoordinate = min(abs(input.localPosition.x), abs(input.localPosition.z));
    let laneLine = 1.0 - smoothstep(0.025, 0.16, laneCoordinate);
    let pavementColor = vec3<f32>(0.008, 0.012, 0.02) + input.baseColor * 0.12;
    let pavementLighting = 0.68 + diffuse * 0.22;
    let laneEnergy = laneLine * select(0.32, 0.3 + travelingWave * 3.8, lightstormEnabled);
    color = pavementColor * pavementLighting + input.baseColor * laneEnergy;
    surfaceBaseColor = pavementColor;
    emissive = input.baseColor * laneEnergy;
  } else if (abs(normal.y) < 0.5) {
    var facadePosition = vec2<f32>(input.worldPosition.x, input.worldPosition.y);
    if (abs(normal.x) > 0.5) {
      facadePosition = vec2<f32>(input.worldPosition.z, input.worldPosition.y);
    }
    let facadeCoordinate = facadePosition * vec2<f32>(0.74, 0.24);
    let windowCell = floor(facadeCoordinate);
    let windowCoordinate = fract(facadeCoordinate);
    let windowShape =
      step(0.16, windowCoordinate.x) *
      step(windowCoordinate.x, 0.78) *
      step(0.2, windowCoordinate.y) *
      step(windowCoordinate.y, 0.72);
    let occupied = step(0.3, hashWindow(windowCell + vec2<f32>(seed * 73.0, seed * 19.0)));
    let windowMask = windowShape * occupied;
    let warmWindow = mix(vec3<f32>(0.28, 0.72, 1.35), vec3<f32>(1.35, 0.48, 0.2), seed);
    let windowEnergy = select(0.42, 0.55 + travelingWave * 5.2, lightstormEnabled);
    color += warmWindow * windowMask * windowEnergy;
    emissive += warmWindow * windowMask * windowEnergy;
  } else {
    let roofBeacon = pow(max(0.0, 1.0 - length(input.localPosition.xz) * 0.65), 8.0);
    let roofEnergy = select(0.35, 0.35 + travelingWave * 2.0, lightstormEnabled);
    color += vec3<f32>(0.3, 0.75, 1.5) * roofBeacon * roofEnergy;
    emissive += vec3<f32>(0.3, 0.75, 1.5) * roofBeacon * roofEnergy;
  }

  let highlighted =
    uniforms.options.y > 0.5 && input.sourceIndex == u32(uniforms.options.y - 1.0);
  color = select(color, vec3<f32>(3.5, 1.35, 0.12), highlighted);
  emissive = select(emissive, vec3<f32>(3.5, 1.35, 0.12), highlighted);

  let fogAmount = 1.0 - exp(-max(input.viewDepth, 0.0) * 0.00165);
  let fogColor =
    vec3<f32>(0.008, 0.018, 0.055) + vec3<f32>(0.1, 0.16, 0.34) * skyPulse;
  color = mix(color, fogColor, clamp(fogAmount, 0.0, 0.96));
  color *= uniforms.scene.y;

  let viewNormal = normalize((uniforms.viewMatrix * vec4<f32>(normal, 0.0)).xyz);
  let roughness = select(0.52, 0.24, isTransit);
  let metallic = select(0.12, 0.58, isTransit);
  let currentUv =
    input.currentClip.xy / max(input.currentClip.w, 0.00001) * vec2<f32>(0.5, -0.5) + 0.5;
  let previousUv =
    input.previousClip.xy / max(input.previousClip.w, 0.00001) * vec2<f32>(0.5, -0.5) + 0.5;

  var output: FragmentOutput;
  output.color = vec4<f32>(color, 1.0);
  output.normalRoughness = vec4<f32>(viewNormal * 0.5 + 0.5, roughness);
  output.velocity = currentUv - previousUv;
  output.baseColorMetallic = vec4<f32>(surfaceBaseColor, metallic);
  output.emissiveOcclusion = vec4<u32>(
    round(clamp(vec4<f32>(emissive, 1.0), vec4<f32>(0.0), vec4<f32>(1.0)) * 255.0)
  );
  return output;
}`;

/** Draws curb-mounted beacon masts and heads at the exact world-space clustered-light positions. */
export const LIGHTSTORM_LIGHT_MARKER_SHADER = /* wgsl */ `
struct LightstormLightMarker {
  positionRange: vec4<f32>,
  colorIntensity: vec4<f32>,
  pulse: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
  previousViewProjectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<storage, read> lightMarkers: array<LightstormLightMarker>;
@group(0) @binding(1) var<uniform> uniforms: LightstormUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) viewNormal: vec3<f32>,
  @location(1) viewDepth: f32,
  @location(2) currentClip: vec4<f32>,
  @location(3) previousClip: vec4<f32>,
  @location(4) color: vec3<f32>,
  @location(5) authoredEnergy: f32,
  @location(6) pulse: vec2<f32>,
};

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) normalRoughness: vec4<f32>,
  @location(2) velocity: vec2<f32>,
  @location(3) baseColorMetallic: vec4<f32>,
  @location(4) emissiveOcclusion: vec4<u32>,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let marker = lightMarkers[instanceIndex / 2u];
  let isBeaconHead = instanceIndex % 2u == 0u;
  let transitSurfaceY = 0.01;
  let markerViewDepth = max(
    -(uniforms.viewMatrix * vec4<f32>(marker.positionRange.xyz, 1.0)).z,
    0.0
  );
  let markerRadius = max(0.24 + marker.positionRange.w * 0.006, markerViewDepth * 0.0024);
  let beaconHalfExtents = vec3<f32>(markerRadius, markerRadius * 1.25, markerRadius);
  let postHalfExtents = vec3<f32>(0.075, (marker.positionRange.y - transitSurfaceY) * 0.5, 0.075);
  let postCenter = vec3<f32>(
    marker.positionRange.x,
    transitSurfaceY + postHalfExtents.y,
    marker.positionRange.z
  );
  let markerCenter = select(postCenter, marker.positionRange.xyz, isBeaconHead);
  let halfExtents = select(postHalfExtents, beaconHalfExtents, isBeaconHead);
  let worldPosition = markerCenter + inputs.positions * halfExtents;
  let viewPosition = uniforms.viewMatrix * vec4<f32>(worldPosition, 1.0);
  let currentClip = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  let previousClip = uniforms.previousViewProjectionMatrix * vec4<f32>(worldPosition, 1.0);

  var output: VertexOutput;
  output.position = currentClip;
  output.viewNormal = normalize((uniforms.viewMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  output.viewDepth = -viewPosition.z;
  output.currentClip = currentClip;
  output.previousClip = previousClip;
  let headColor = mix(marker.colorIntensity.rgb, vec3<f32>(1.0), 0.32);
  output.color = select(marker.colorIntensity.rgb, headColor, isBeaconHead);
  output.authoredEnergy = select(
    0.32,
    3.4 + marker.colorIntensity.w * 0.18,
    isBeaconHead
  );
  output.pulse = marker.pulse.xy;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
  let lightstormEnabled = uniforms.options.w > 0.5;
  let pulse = select(
    1.0,
    1.0 + sin(input.pulse.x + uniforms.scene.x * input.pulse.y) * 0.07,
    lightstormEnabled
  );
  let energy = input.authoredEnergy * pulse;
  let emissive = input.color * energy;
  let fogAmount = 1.0 - exp(-max(input.viewDepth, 0.0) * 0.00165);
  let fogColor = vec3<f32>(0.008, 0.018, 0.055);
  let fogFactor = clamp(fogAmount * 0.65, 0.0, 0.88);
  let color = mix(emissive, fogColor, fogFactor);
  let currentUv =
    input.currentClip.xy / max(input.currentClip.w, 0.00001) * vec2<f32>(0.5, -0.5) + 0.5;
  let previousUv =
    input.previousClip.xy / max(input.previousClip.w, 0.00001) * vec2<f32>(0.5, -0.5) + 0.5;

  var output: FragmentOutput;
  output.color = vec4<f32>(color, 1.0);
  output.normalRoughness = vec4<f32>(input.viewNormal * 0.5 + 0.5, 0.18);
  output.velocity = currentUv - previousUv;
  output.baseColorMetallic = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  output.emissiveOcclusion = vec4<u32>(
    round(clamp(vec4<f32>(emissive, 1.0), vec4<f32>(0.0), vec4<f32>(1.0)) * 255.0)
  );
  return output;
}`;

/** Draws sparse world-space HDR lightning as connected cuboid segments. */
export const LIGHTSTORM_LIGHTNING_SHADER = /* wgsl */ `
struct LightstormLightningSegment {
  startWidth: vec4<f32>,
  endSeed: vec4<f32>,
  colorIntensity: vec4<f32>,
  timing: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
  previousViewProjectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<storage, read> lightningSegments: array<LightstormLightningSegment>;
@group(0) @binding(1) var<uniform> uniforms: LightstormUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) viewNormal: vec3<f32>,
  @location(1) viewDepth: f32,
  @location(2) currentClip: vec4<f32>,
  @location(3) previousClip: vec4<f32>,
  @location(4) color: vec3<f32>,
  @location(5) intensity: f32,
  @location(6) timing: vec4<f32>,
  @location(7) seed: f32,
};

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) normalRoughness: vec4<f32>,
  @location(2) velocity: vec2<f32>,
  @location(3) baseColorMetallic: vec4<f32>,
  @location(4) emissiveOcclusion: vec4<u32>,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let segment = lightningSegments[instanceIndex];
  let segmentVector = segment.endSeed.xyz - segment.startWidth.xyz;
  let segmentLength = max(length(segmentVector), 0.0001);
  let tangent = segmentVector / segmentLength;
  var referenceAxis = vec3<f32>(0.0, 1.0, 0.0);
  if (abs(dot(tangent, referenceAxis)) > 0.94) {
    referenceAxis = vec3<f32>(1.0, 0.0, 0.0);
  }
  let across = normalize(cross(referenceAxis, tangent));
  let forward = normalize(cross(tangent, across));
  let center = (segment.startWidth.xyz + segment.endSeed.xyz) * 0.5;
  let worldPosition =
    center +
    across * inputs.positions.x * segment.startWidth.w +
    tangent * inputs.positions.y * segmentLength * 0.5 +
    forward * inputs.positions.z * segment.startWidth.w;
  let worldNormal = normalize(
    across * inputs.normals.x + tangent * inputs.normals.y + forward * inputs.normals.z
  );
  let viewPosition = uniforms.viewMatrix * vec4<f32>(worldPosition, 1.0);
  let currentClip = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  let previousClip = uniforms.previousViewProjectionMatrix * vec4<f32>(worldPosition, 1.0);

  var output: VertexOutput;
  output.position = currentClip;
  output.viewNormal = normalize((uniforms.viewMatrix * vec4<f32>(worldNormal, 0.0)).xyz);
  output.viewDepth = -viewPosition.z;
  output.currentClip = currentClip;
  output.previousClip = previousClip;
  output.color = segment.colorIntensity.rgb;
  output.intensity = segment.colorIntensity.w;
  output.timing = segment.timing;
  output.seed = segment.endSeed.w;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
  let cycleTime = fract(
    (uniforms.scene.z - input.timing.x) / max(input.timing.y, 0.001)
  ) * input.timing.y;
  let firstStrike = exp(-pow(cycleTime / ${LIGHTSTORM_LIGHTNING_STRIKE_WIDTH_SECONDS}, 2.0));
  let returnStroke = exp(-pow(
    (cycleTime - ${LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS}) /
      ${LIGHTSTORM_LIGHTNING_RETURN_STROKE_WIDTH_SECONDS},
    2.0
  )) * ${LIGHTSTORM_LIGHTNING_RETURN_STROKE_SCALE};
  let branchScale = select(1.0, 0.72, input.timing.z > 0.5);
  let segmentFlicker = 0.88 + 0.12 * sin(uniforms.scene.z * 94.0 + input.seed * 53.0);
  let strike = max(firstStrike, returnStroke) * branchScale * segmentFlicker;
  if (uniforms.options.w < 0.5 || strike < 0.012) {
    discard;
  }

  let emissive = input.color * input.intensity * strike;
  let fogAmount = 1.0 - exp(-max(input.viewDepth, 0.0) * 0.00165);
  let fogColor = vec3<f32>(0.008, 0.018, 0.055);
  let color = mix(emissive, fogColor, clamp(fogAmount * 0.42, 0.0, 0.72));
  let currentUv =
    input.currentClip.xy / max(input.currentClip.w, 0.00001) * vec2<f32>(0.5, -0.5) + 0.5;
  let previousUv =
    input.previousClip.xy / max(input.previousClip.w, 0.00001) * vec2<f32>(0.5, -0.5) + 0.5;

  var output: FragmentOutput;
  output.color = vec4<f32>(color, 1.0);
  output.normalRoughness = vec4<f32>(input.viewNormal * 0.5 + 0.5, 0.08);
  output.velocity = currentUv - previousUv;
  output.baseColorMetallic = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  output.emissiveOcclusion = vec4<u32>(
    round(clamp(vec4<f32>(emissive, 1.0), vec4<f32>(0.0), vec4<f32>(1.0)) * 255.0)
  );
  return output;
}`;

export const LIGHTSTORM_PICKING_SHADER = /* wgsl */ `
struct LightstormInstance {
  positionRadius: vec4<f32>,
  halfExtentsSeed: vec4<f32>,
  colorAndKind: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> instances: array<LightstormInstance>;
@group(0) @binding(1) var<storage, read> visibleIds: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: LightstormUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) sourceIndex: u32,
};

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) indices: vec2<i32>,
};

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sourceIndex = visibleIds[instanceIndex];
  let instance = instances[sourceIndex];
  let worldPosition =
    inputs.positions * instance.halfExtentsSeed.xyz + instance.positionRadius.xyz;
  var output: VertexOutput;
  output.position = uniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  output.sourceIndex = sourceIndex;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
  var output: FragmentOutput;
  output.color = vec4<f32>(0.0);
  output.indices = vec2<i32>(i32(input.sourceIndex), 0);
  return output;
}`;

export function getLightstormVisibilityShader(instanceCount: number): string {
  return /* wgsl */ `
struct LightstormInstance {
  positionRadius: vec4<f32>,
  halfExtentsSeed: vec4<f32>,
  colorAndKind: vec4<f32>,
};

struct LightstormUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  frustum: vec4<f32>,
  options: vec4<f32>,
  scene: vec4<f32>,
};

const INSTANCE_COUNT: u32 = ${instanceCount}u;

@group(0) @binding(0) var<storage, read> instances: array<LightstormInstance>;
@group(0) @binding(1) var<uniform> uniforms: LightstormUniforms;
@group(0) @binding(2) var<storage, read_write> flags: array<u32>;

fn isVisible(instance: LightstormInstance) -> bool {
  let layerMode = uniforms.options.z;
  let isTransit = instance.colorAndKind.w > 0.5;
  if ((layerMode > 0.5 && layerMode < 1.5 && isTransit) || (layerMode > 1.5 && !isTransit)) {
    return false;
  }
  if (uniforms.options.x < 0.5) {
    return true;
  }
  let viewPosition = uniforms.viewMatrix * vec4<f32>(instance.positionRadius.xyz, 1.0);
  let radius = instance.positionRadius.w;
  let depth = -viewPosition.z;
  let tangentHalfFieldOfView = uniforms.frustum.x;
  let aspect = uniforms.frustum.y;
  let near = uniforms.frustum.z;
  let far = uniforms.frustum.w;
  if (depth + radius < near || depth - radius > far) {
    return false;
  }
  let halfHeight = max(depth, 0.0) * tangentHalfFieldOfView;
  let halfWidth = halfHeight * aspect;
  let horizontalSlope = tangentHalfFieldOfView * aspect;
  let horizontalRadius = radius * sqrt(1.0 + horizontalSlope * horizontalSlope);
  let verticalRadius = radius * sqrt(1.0 + tangentHalfFieldOfView * tangentHalfFieldOfView);
  return abs(viewPosition.x) <= halfWidth + horizontalRadius &&
    abs(viewPosition.y) <= halfHeight + verticalRadius;
}

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalIdentifier: vec3<u32>) {
  let instanceIndex = globalIdentifier.x;
  if (instanceIndex >= INSTANCE_COUNT) {
    return;
  }
  flags[instanceIndex] = select(0u, 1u, isVisible(instances[instanceIndex]));
}`;
}
