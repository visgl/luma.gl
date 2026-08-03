// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

export type KineticSceneProps = {
  /** Elapsed animation time in seconds. */
  time?: number;
  /** Controls the scene's motion and luminous accents. */
  energy?: number;
};

export type KineticSceneUniforms = KineticSceneProps;

const source = /* wgsl */ `\
struct kineticSceneUniforms {
  time: f32,
  energy: f32,
};

@group(0) @binding(auto) var<uniform> kineticScene: kineticSceneUniforms;

fn kineticScene_hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453);
}

fn kineticScene_rotate(point: vec2f, angle: f32) -> vec2f {
  let sineAngle = sin(angle);
  let cosineAngle = cos(angle);
  return mat2x2f(cosineAngle, sineAngle, -sineAngle, cosineAngle) * point;
}

fn kineticScene_palette(value: f32) -> vec3f {
  let phase = vec3f(0.04, 0.29, 0.58);
  return 0.52 + 0.48 * cos(6.2831853 * (value + phase));
}

fn kineticScene_line(distanceToLine: f32, width: f32, softness: f32) -> f32 {
  return 1.0 - smoothstep(width, width + softness, abs(distanceToLine));
}

fn kineticScene_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let aspect = texSize.x / max(texSize.y, 1.0);
  // Full-screen texture coordinates use opposite vertical origins in the two backends.
  let sceneTexCoord = vec2f(texCoord.x, 1.0 - texCoord.y);
  var point = sceneTexCoord * 2.0 - 1.0;
  point.x *= aspect;

  let energy = clamp(kineticScene.energy, 0.0, 1.5);
  let animatedTime = kineticScene.time * (0.32 + energy * 0.24);
  let radialDistance = length(point);

  let skyAmount = clamp(sceneTexCoord.y, 0.0, 1.0);
  var color = mix(vec3f(0.006, 0.009, 0.026), vec3f(0.025, 0.035, 0.085), skyAmount);
  color += vec3f(0.018, 0.008, 0.038) * (1.0 - radialDistance * 0.35);

  // A sparse, slowly drifting star field keeps the upper background alive without adding noise
  // to filters that react strongly to high-frequency detail.
  let starPoint = vec2f(point.x + animatedTime * 0.018, point.y) * vec2f(42.0, 30.0);
  let starCell = floor(starPoint);
  let starHash = kineticScene_hash21(starCell);
  let starPosition = fract(starPoint) - 0.5;
  let starShape = 1.0 - smoothstep(0.018, 0.075, length(starPosition));
  let starMask = step(0.965, starHash) * smoothstep(-0.05, 0.4, point.y);
  let starTwinkle = 0.55 + 0.45 * sin(animatedTime * 2.2 + starHash * 38.0);
  color += vec3f(0.38, 0.62, 1.0) * starShape * starMask * starTwinkle * 0.38;

  // Perspective floor grid. The line spacing tightens towards the horizon, giving blur,
  // distortion and edge filters useful structured detail to work with.
  let floorHeight = -(point.y + 0.12);
  if (floorHeight > 0.0) {
    let floorDepth = 0.32 / max(floorHeight, 0.018);
    let floorCoordinate = vec2f(point.x * floorDepth * 1.8, floorDepth + animatedTime * 0.9);
    let gridCell = abs(fract(floorCoordinate) - 0.5);
    let gridLines = max(
      smoothstep(0.465, 0.5, gridCell.x),
      smoothstep(0.465, 0.5, gridCell.y)
    );
    let majorCell = abs(fract(floorCoordinate * 0.2) - 0.5);
    let majorLines = max(
      smoothstep(0.475, 0.5, majorCell.x),
      smoothstep(0.475, 0.5, majorCell.y)
    );
    let horizonFade = smoothstep(0.0, 0.16, floorHeight) * exp(-floorDepth * 0.055);
    color += vec3f(0.02, 0.18, 0.31) * gridLines * horizonFade * 0.48;
    color += vec3f(0.08, 0.46, 0.62) * majorLines * horizonFade * 0.34;
  }

  // Two broad chromatic ribbons move behind the central sculpture. Their gradients and clean
  // edges make color, halftone and warp effects visibly distinct at a glance.
  let ribbonEnvelope = 1.0 - smoothstep(0.25, 1.65, abs(point.x));
  let cyanRibbonY = 0.21 * sin(point.x * 2.6 + animatedTime * 1.2) - 0.03;
  let magentaRibbonY = 0.17 * sin(point.x * 3.1 - animatedTime * 0.86 + 2.1) + 0.08;
  let cyanRibbon = kineticScene_line(point.y - cyanRibbonY, 0.025, 0.05) * ribbonEnvelope;
  let magentaRibbon =
    kineticScene_line(point.y - magentaRibbonY, 0.018, 0.045) * ribbonEnvelope;
  color += vec3f(0.015, 0.38, 0.52) * cyanRibbon * (0.5 + energy * 0.25);
  color += vec3f(0.42, 0.04, 0.34) * magentaRibbon * (0.45 + energy * 0.24);

  let orbCenter = vec2f(0.0, 0.09 + sin(animatedTime * 0.75) * 0.018);
  let orbPoint = point - orbCenter;
  let orbRadius = 0.255 + sin(animatedTime * 1.35) * 0.008 * energy;
  let normalizedOrbDistance = length(orbPoint) / orbRadius;
  let orbMask = 1.0 - smoothstep(0.985, 1.015, normalizedOrbDistance);

  if (normalizedOrbDistance < 1.02) {
    let sphereZ = sqrt(max(0.0, 1.0 - normalizedOrbDistance * normalizedOrbDistance));
    let sphereNormal = normalize(vec3f(orbPoint / orbRadius, sphereZ));
    let lightDirection = normalize(
      vec3f(cos(animatedTime * 0.85), 0.72, 0.72 + sin(animatedTime * 0.85) * 0.18)
    );
    let diffuse = max(dot(sphereNormal, lightDirection), 0.0);
    let fresnel = pow(1.0 - sphereZ, 2.6);
    let latitude = sphereNormal.y * 0.34 + animatedTime * 0.11;
    let orbColor = kineticScene_palette(latitude) * (0.16 + diffuse * 0.52);
    let innerBand =
      kineticScene_line(sin((sphereNormal.x + sphereNormal.y) * 15.0 + animatedTime * 2.0), 0.0, 0.22);
    color = mix(color, orbColor + innerBand * vec3f(0.08, 0.23, 0.34), orbMask);
    color += vec3f(0.16, 0.56, 0.72) * fresnel * orbMask * (0.42 + energy * 0.3);
  }

  let orbEdgeDistance = abs(length(orbPoint) - orbRadius);
  let orbHalo = exp(-orbEdgeDistance * 25.0) * (1.0 - orbMask * 0.6);
  color += vec3f(0.05, 0.34, 0.55) * orbHalo * (0.38 + energy * 0.34);

  // Elliptical orbital rings turn at different rates and include a dashed technical scale.
  let ringPointA = kineticScene_rotate(orbPoint, animatedTime * 0.43);
  let ringPointB = kineticScene_rotate(orbPoint, -animatedTime * 0.31 + 0.8);
  let ringDistanceA = length(vec2f(ringPointA.x, ringPointA.y * 2.45));
  let ringDistanceB = length(vec2f(ringPointB.x, ringPointB.y * 1.8));
  let ringA = kineticScene_line(ringDistanceA - 0.43, 0.003, 0.012);
  let ringB = kineticScene_line(ringDistanceB - 0.56, 0.003, 0.014);
  let ringAngle = atan2(ringPointB.y, ringPointB.x);
  let dash = step(0.38, fract(ringAngle * 2.55 + animatedTime * 0.38));
  color += vec3f(0.10, 0.64, 0.82) * ringA * (0.42 + energy * 0.25);
  color += vec3f(0.72, 0.16, 0.58) * ringB * dash * (0.32 + energy * 0.22);

  // Fine radial ticks deliberately retain high-frequency information for denoise, ink and
  // pixelation effects while fading away from the focal sculpture.
  let tickAngle = atan2(orbPoint.y, orbPoint.x);
  let tickPattern = step(0.54, fract(tickAngle * 7.65 + animatedTime * 0.08));
  let tickRadius = length(orbPoint);
  let tickBand = (1.0 - smoothstep(0.59, 0.62, tickRadius)) *
    smoothstep(0.49, 0.52, tickRadius) * tickPattern;
  color += vec3f(0.16, 0.32, 0.5) * tickBand * 0.45;

  let horizonGlow = exp(-abs(point.y + 0.12) * 24.0);
  color += vec3f(0.03, 0.16, 0.29) * horizonGlow * (0.36 + energy * 0.18);

  let vignette = clamp(1.12 - dot(point / vec2f(max(aspect, 1.0), 1.0), point / vec2f(max(aspect, 1.0), 1.0)) * 0.3, 0.25, 1.0);
  color *= vignette;

  // A compact filmic curve guarantees every output channel remains in the SDR-safe 0..1 range.
  color = vec3f(1.0) - exp(-max(color, vec3f(0.0)) * 1.35);
  color = pow(clamp(color, vec3f(0.0), vec3f(1.0)), vec3f(0.92));
  return vec4f(color, 1.0);
}
`;

const fs = /* glsl */ `\
layout(std140) uniform kineticSceneUniforms {
  float time;
  float energy;
} kineticScene;

float kineticScene_hash21(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 kineticScene_rotate(vec2 point, float angle) {
  float sineAngle = sin(angle);
  float cosineAngle = cos(angle);
  return mat2(cosineAngle, sineAngle, -sineAngle, cosineAngle) * point;
}

vec3 kineticScene_palette(float value) {
  vec3 phase = vec3(0.04, 0.29, 0.58);
  return 0.52 + 0.48 * cos(6.2831853 * (value + phase));
}

float kineticScene_line(float distanceToLine, float width, float softness) {
  return 1.0 - smoothstep(width, width + softness, abs(distanceToLine));
}

vec4 kineticScene_sampleColor(
  sampler2D sourceTexture,
  vec2 texSize,
  vec2 texCoord
) {
  float aspect = texSize.x / max(texSize.y, 1.0);
  vec2 sceneTexCoord = texCoord;
  vec2 point = sceneTexCoord * 2.0 - 1.0;
  point.x *= aspect;

  float energy = clamp(kineticScene.energy, 0.0, 1.5);
  float animatedTime = kineticScene.time * (0.32 + energy * 0.24);
  float radialDistance = length(point);

  float skyAmount = clamp(sceneTexCoord.y, 0.0, 1.0);
  vec3 color = mix(vec3(0.006, 0.009, 0.026), vec3(0.025, 0.035, 0.085), skyAmount);
  color += vec3(0.018, 0.008, 0.038) * (1.0 - radialDistance * 0.35);

  vec2 starPoint = vec2(point.x + animatedTime * 0.018, point.y) * vec2(42.0, 30.0);
  vec2 starCell = floor(starPoint);
  float starHash = kineticScene_hash21(starCell);
  vec2 starPosition = fract(starPoint) - 0.5;
  float starShape = 1.0 - smoothstep(0.018, 0.075, length(starPosition));
  float starMask = step(0.965, starHash) * smoothstep(-0.05, 0.4, point.y);
  float starTwinkle = 0.55 + 0.45 * sin(animatedTime * 2.2 + starHash * 38.0);
  color += vec3(0.38, 0.62, 1.0) * starShape * starMask * starTwinkle * 0.38;

  float floorHeight = -(point.y + 0.12);
  if (floorHeight > 0.0) {
    float floorDepth = 0.32 / max(floorHeight, 0.018);
    vec2 floorCoordinate = vec2(point.x * floorDepth * 1.8, floorDepth + animatedTime * 0.9);
    vec2 gridCell = abs(fract(floorCoordinate) - 0.5);
    float gridLines = max(
      smoothstep(0.465, 0.5, gridCell.x),
      smoothstep(0.465, 0.5, gridCell.y)
    );
    vec2 majorCell = abs(fract(floorCoordinate * 0.2) - 0.5);
    float majorLines = max(
      smoothstep(0.475, 0.5, majorCell.x),
      smoothstep(0.475, 0.5, majorCell.y)
    );
    float horizonFade = smoothstep(0.0, 0.16, floorHeight) * exp(-floorDepth * 0.055);
    color += vec3(0.02, 0.18, 0.31) * gridLines * horizonFade * 0.48;
    color += vec3(0.08, 0.46, 0.62) * majorLines * horizonFade * 0.34;
  }

  float ribbonEnvelope = 1.0 - smoothstep(0.25, 1.65, abs(point.x));
  float cyanRibbonY = 0.21 * sin(point.x * 2.6 + animatedTime * 1.2) - 0.03;
  float magentaRibbonY = 0.17 * sin(point.x * 3.1 - animatedTime * 0.86 + 2.1) + 0.08;
  float cyanRibbon = kineticScene_line(point.y - cyanRibbonY, 0.025, 0.05) * ribbonEnvelope;
  float magentaRibbon =
    kineticScene_line(point.y - magentaRibbonY, 0.018, 0.045) * ribbonEnvelope;
  color += vec3(0.015, 0.38, 0.52) * cyanRibbon * (0.5 + energy * 0.25);
  color += vec3(0.42, 0.04, 0.34) * magentaRibbon * (0.45 + energy * 0.24);

  vec2 orbCenter = vec2(0.0, 0.09 + sin(animatedTime * 0.75) * 0.018);
  vec2 orbPoint = point - orbCenter;
  float orbRadius = 0.255 + sin(animatedTime * 1.35) * 0.008 * energy;
  float normalizedOrbDistance = length(orbPoint) / orbRadius;
  float orbMask = 1.0 - smoothstep(0.985, 1.015, normalizedOrbDistance);

  if (normalizedOrbDistance < 1.02) {
    float sphereZ = sqrt(max(0.0, 1.0 - normalizedOrbDistance * normalizedOrbDistance));
    vec3 sphereNormal = normalize(vec3(orbPoint / orbRadius, sphereZ));
    vec3 lightDirection = normalize(
      vec3(cos(animatedTime * 0.85), 0.72, 0.72 + sin(animatedTime * 0.85) * 0.18)
    );
    float diffuse = max(dot(sphereNormal, lightDirection), 0.0);
    float fresnel = pow(1.0 - sphereZ, 2.6);
    float latitude = sphereNormal.y * 0.34 + animatedTime * 0.11;
    vec3 orbColor = kineticScene_palette(latitude) * (0.16 + diffuse * 0.52);
    float innerBand =
      kineticScene_line(sin((sphereNormal.x + sphereNormal.y) * 15.0 + animatedTime * 2.0), 0.0, 0.22);
    color = mix(color, orbColor + innerBand * vec3(0.08, 0.23, 0.34), orbMask);
    color += vec3(0.16, 0.56, 0.72) * fresnel * orbMask * (0.42 + energy * 0.3);
  }

  float orbEdgeDistance = abs(length(orbPoint) - orbRadius);
  float orbHalo = exp(-orbEdgeDistance * 25.0) * (1.0 - orbMask * 0.6);
  color += vec3(0.05, 0.34, 0.55) * orbHalo * (0.38 + energy * 0.34);

  vec2 ringPointA = kineticScene_rotate(orbPoint, animatedTime * 0.43);
  vec2 ringPointB = kineticScene_rotate(orbPoint, -animatedTime * 0.31 + 0.8);
  float ringDistanceA = length(vec2(ringPointA.x, ringPointA.y * 2.45));
  float ringDistanceB = length(vec2(ringPointB.x, ringPointB.y * 1.8));
  float ringA = kineticScene_line(ringDistanceA - 0.43, 0.003, 0.012);
  float ringB = kineticScene_line(ringDistanceB - 0.56, 0.003, 0.014);
  float ringAngle = atan(ringPointB.y, ringPointB.x);
  float dash = step(0.38, fract(ringAngle * 2.55 + animatedTime * 0.38));
  color += vec3(0.10, 0.64, 0.82) * ringA * (0.42 + energy * 0.25);
  color += vec3(0.72, 0.16, 0.58) * ringB * dash * (0.32 + energy * 0.22);

  float tickAngle = atan(orbPoint.y, orbPoint.x);
  float tickPattern = step(0.54, fract(tickAngle * 7.65 + animatedTime * 0.08));
  float tickRadius = length(orbPoint);
  float tickBand = (1.0 - smoothstep(0.59, 0.62, tickRadius)) *
    smoothstep(0.49, 0.52, tickRadius) * tickPattern;
  color += vec3(0.16, 0.32, 0.5) * tickBand * 0.45;

  float horizonGlow = exp(-abs(point.y + 0.12) * 24.0);
  color += vec3(0.03, 0.16, 0.29) * horizonGlow * (0.36 + energy * 0.18);

  vec2 vignettePoint = point / vec2(max(aspect, 1.0), 1.0);
  float vignette = clamp(1.12 - dot(vignettePoint, vignettePoint) * 0.3, 0.25, 1.0);
  color *= vignette;

  color = vec3(1.0) - exp(-max(color, vec3(0.0)) * 1.35);
  color = pow(clamp(color, vec3(0.0), vec3(1.0)), vec3(0.92));
  return vec4(color, 1.0);
}
`;

/** Animated procedural source used to exercise reusable image-processing effects. */
export const kineticScenePass = {
  name: 'kineticScene',
  source,
  fs,

  props: {} as KineticSceneProps,
  uniforms: {} as KineticSceneUniforms,
  uniformTypes: {
    time: 'f32',
    energy: 'f32'
  },
  propTypes: {
    time: {value: 0, private: true},
    energy: {value: 0.9, private: true}
  },

  passes: [{sampler: true}]
} as const satisfies ShaderPass<KineticSceneProps, KineticSceneUniforms>;
