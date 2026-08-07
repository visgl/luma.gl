// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass} from '@luma.gl/shadertools';

export const MAX_BLOOM_LENS_GHOSTS = 6;
export const MAX_BLOOM_LENS_SPIKES = 8;
const BLOOM_LENS_STREAK_SAMPLES = 8;

/** Optional photographic lens artifacts generated from the extracted HDR highlights. */
export type BloomLensEffectsOptions = {
  /** Brightness of aperture-diffraction streaks. Defaults to zero. */
  starburstIntensity?: number;
  /** Number of diffraction rays. Rounded to an even value between two and eight. */
  starburstSpikes?: number;
  /** Length of each diffraction ray in half-resolution source texels. Defaults to 48. */
  starburstLength?: number;
  /** Rotation of the diffraction pattern, in radians. Defaults to zero. */
  starburstRotation?: number;
  /** Brightness of chromatic lens-element reflections. Defaults to zero. */
  ghostIntensity?: number;
  /** Number of reflected lens ghosts, clamped between one and six. Defaults to three. */
  ghostCount?: number;
  /** Distance between successive lens-element reflections. Defaults to 0.32. */
  ghostSpacing?: number;
  /** Brightness of the radial lens halo. Defaults to zero. */
  haloIntensity?: number;
  /** Radius of the radial lens halo in normalized texture coordinates. Defaults to 0.34. */
  haloRadius?: number;
  /** Spectral separation applied to ghosts and halos. Defaults to zero. */
  chromaticAberration?: number;
  /**
   * Brightness of the sampled lens dirt mask. When positive, provide a sampled texture through
   * `ShaderPassRenderer.renderToTexture({bindings: {lensDirtTexture}})` or `renderToScreen()`.
   */
  dirtIntensity?: number;
};

type BloomLensUniforms = {
  starburstIntensity: number;
  starburstSpikes: number;
  starburstLength: number;
  starburstRotation: number;
  ghostIntensity: number;
  ghostCount: number;
  ghostSpacing: number;
  haloIntensity: number;
  haloRadius: number;
  chromaticAberration: number;
};

type BloomLensBindings = {
  glowTexture?: Texture;
};

export const bloomLensArtifactsPass = {
  name: 'bloomLens',
  source: /* wgsl */ `
const BLOOM_LENS_MAX_GHOSTS = ${MAX_BLOOM_LENS_GHOSTS};
const BLOOM_LENS_MAX_DIRECTIONS = ${MAX_BLOOM_LENS_SPIKES / 2};
const BLOOM_LENS_STREAK_SAMPLES = ${BLOOM_LENS_STREAK_SAMPLES};

struct bloomLensUniforms {
  starburstIntensity: f32,
  starburstSpikes: f32,
  starburstLength: f32,
  starburstRotation: f32,
  ghostIntensity: f32,
  ghostCount: f32,
  ghostSpacing: f32,
  haloIntensity: f32,
  haloRadius: f32,
  chromaticAberration: f32,
};

@group(0) @binding(auto) var<uniform> bloomLens: bloomLensUniforms;
@group(0) @binding(auto) var glowTexture: texture_2d<f32>;
@group(0) @binding(auto) var glowTextureSampler: sampler;

fn bloomLens_sampleSpectralHighlight(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  coordinate: vec2f,
  direction: vec2f
) -> vec3f {
  if (any(coordinate < vec2f(0.0)) || any(coordinate > vec2f(1.0))) {
    return vec3f(0.0);
  }

  if (bloomLens.chromaticAberration <= 0.0) {
    return textureSampleLevel(sourceTexture, sourceTextureSampler, coordinate, 0.0).rgb;
  }

  let spectralOffset = direction * bloomLens.chromaticAberration * 0.018;
  return vec3f(
    textureSampleLevel(sourceTexture, sourceTextureSampler, coordinate + spectralOffset, 0.0).r,
    textureSampleLevel(sourceTexture, sourceTextureSampler, coordinate, 0.0).g,
    textureSampleLevel(sourceTexture, sourceTextureSampler, coordinate - spectralOffset, 0.0).b
  );
}

fn bloomLens_sampleStarburst(texCoord: vec2f) -> vec3f {
  let directionCount = max(bloomLens.starburstSpikes * 0.5, 1.0);
  let glowDimensions = vec2f(textureDimensions(glowTexture));
  var streakColor = vec3f(0.0);
  var totalWeight = 0.0;

  for (var directionIndex = 0; directionIndex < BLOOM_LENS_MAX_DIRECTIONS; directionIndex += 1) {
    if (f32(directionIndex) >= directionCount) {
      continue;
    }

    let angle = bloomLens.starburstRotation + f32(directionIndex) * 3.14159265359 / directionCount;
    let direction = vec2f(cos(angle), sin(angle));
    for (var sampleIndex = 1; sampleIndex <= BLOOM_LENS_STREAK_SAMPLES; sampleIndex += 1) {
      let sampleDistance = f32(sampleIndex) / f32(BLOOM_LENS_STREAK_SAMPLES);
      let offset = direction * bloomLens.starburstLength * sampleDistance / glowDimensions;
      let sampleWeight = exp(-sampleDistance * 2.4);
      let positiveColor = textureSampleLevel(
        glowTexture,
        glowTextureSampler,
        clamp(texCoord + offset, vec2f(0.0), vec2f(1.0)),
        0.0
      ).rgb;
      let negativeColor = textureSampleLevel(
        glowTexture,
        glowTextureSampler,
        clamp(texCoord - offset, vec2f(0.0), vec2f(1.0)),
        0.0
      ).rgb;
      streakColor += (positiveColor + negativeColor) * sampleWeight;
      totalWeight += sampleWeight * 2.0;
    }
  }

  return streakColor / max(totalWeight, 0.00001);
}

fn bloomLens_sampleGhosts(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texCoord: vec2f,
  radialDirection: vec2f
) -> vec3f {
  let centeredCoordinate = texCoord - vec2f(0.5);
  let reflectedCoordinate = vec2f(1.0) - texCoord;
  var ghostColor = vec3f(0.0);
  var totalWeight = 0.0;

  for (var ghostIndex = 0; ghostIndex < BLOOM_LENS_MAX_GHOSTS; ghostIndex += 1) {
    if (f32(ghostIndex) >= bloomLens.ghostCount) {
      continue;
    }

    let ghostCoordinate = reflectedCoordinate +
      centeredCoordinate * f32(ghostIndex) * bloomLens.ghostSpacing;
    let radialFalloff = max(1.0 - length(ghostCoordinate - vec2f(0.5)) * 1.41421356, 0.0);
    let ghostWeight = radialFalloff * (1.0 - f32(ghostIndex) / (bloomLens.ghostCount + 1.0));
    ghostColor += bloomLens_sampleSpectralHighlight(
      sourceTexture,
      sourceTextureSampler,
      ghostCoordinate,
      radialDirection
    ) * ghostWeight;
    totalWeight += ghostWeight;
  }

  return ghostColor / max(totalWeight, 0.00001);
}

fn bloomLens_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let centeredCoordinate = texCoord - vec2f(0.5);
  let radialDirection = centeredCoordinate / max(length(centeredCoordinate), 0.00001);
  var lensColor = vec3f(0.0);

  if (bloomLens.starburstIntensity > 0.0) {
    lensColor += bloomLens_sampleStarburst(texCoord) * bloomLens.starburstIntensity;
  }
  if (bloomLens.ghostIntensity > 0.0) {
    lensColor += bloomLens_sampleGhosts(
      sourceTexture,
      sourceTextureSampler,
      texCoord,
      radialDirection
    ) * bloomLens.ghostIntensity;
  }
  if (bloomLens.haloIntensity > 0.0) {
    let haloCoordinate = texCoord - radialDirection * bloomLens.haloRadius;
    let haloFalloff = max(1.0 - length(centeredCoordinate) * 1.41421356, 0.0);
    lensColor += bloomLens_sampleSpectralHighlight(
      sourceTexture,
      sourceTextureSampler,
      haloCoordinate,
      radialDirection
    ) * bloomLens.haloIntensity * haloFalloff;
  }

  return vec4f(lensColor, 1.0);
}
`,
  fs: /* glsl */ `
#define BLOOM_LENS_MAX_GHOSTS ${MAX_BLOOM_LENS_GHOSTS}
#define BLOOM_LENS_MAX_DIRECTIONS ${MAX_BLOOM_LENS_SPIKES / 2}
#define BLOOM_LENS_STREAK_SAMPLES ${BLOOM_LENS_STREAK_SAMPLES}

layout(std140) uniform bloomLensUniforms {
  float starburstIntensity;
  float starburstSpikes;
  float starburstLength;
  float starburstRotation;
  float ghostIntensity;
  float ghostCount;
  float ghostSpacing;
  float haloIntensity;
  float haloRadius;
  float chromaticAberration;
} bloomLens;

uniform sampler2D glowTexture;

vec3 bloomLens_sampleSpectralHighlight(
  sampler2D sourceTexture,
  vec2 coordinate,
  vec2 direction
) {
  if (any(lessThan(coordinate, vec2(0.0))) || any(greaterThan(coordinate, vec2(1.0)))) {
    return vec3(0.0);
  }

  if (bloomLens.chromaticAberration <= 0.0) {
    return textureLod(sourceTexture, coordinate, 0.0).rgb;
  }

  vec2 spectralOffset = direction * bloomLens.chromaticAberration * 0.018;
  return vec3(
    textureLod(sourceTexture, coordinate + spectralOffset, 0.0).r,
    textureLod(sourceTexture, coordinate, 0.0).g,
    textureLod(sourceTexture, coordinate - spectralOffset, 0.0).b
  );
}

vec3 bloomLens_sampleStarburst(vec2 texCoord) {
  float directionCount = max(bloomLens.starburstSpikes * 0.5, 1.0);
  vec2 glowDimensions = vec2(textureSize(glowTexture, 0));
  vec3 streakColor = vec3(0.0);
  float totalWeight = 0.0;

  for (int directionIndex = 0; directionIndex < BLOOM_LENS_MAX_DIRECTIONS; directionIndex++) {
    if (float(directionIndex) >= directionCount) {
      continue;
    }

    float angle = bloomLens.starburstRotation + float(directionIndex) * 3.14159265359 / directionCount;
    vec2 direction = vec2(cos(angle), sin(angle));
    for (int sampleIndex = 1; sampleIndex <= BLOOM_LENS_STREAK_SAMPLES; sampleIndex++) {
      float sampleDistance = float(sampleIndex) / float(BLOOM_LENS_STREAK_SAMPLES);
      vec2 offset = direction * bloomLens.starburstLength * sampleDistance / glowDimensions;
      float sampleWeight = exp(-sampleDistance * 2.4);
      vec3 positiveColor = textureLod(
        glowTexture,
        clamp(texCoord + offset, vec2(0.0), vec2(1.0)),
        0.0
      ).rgb;
      vec3 negativeColor = textureLod(
        glowTexture,
        clamp(texCoord - offset, vec2(0.0), vec2(1.0)),
        0.0
      ).rgb;
      streakColor += (positiveColor + negativeColor) * sampleWeight;
      totalWeight += sampleWeight * 2.0;
    }
  }

  return streakColor / max(totalWeight, 0.00001);
}

vec3 bloomLens_sampleGhosts(
  sampler2D sourceTexture,
  vec2 texCoord,
  vec2 radialDirection
) {
  vec2 centeredCoordinate = texCoord - vec2(0.5);
  vec2 reflectedCoordinate = vec2(1.0) - texCoord;
  vec3 ghostColor = vec3(0.0);
  float totalWeight = 0.0;

  for (int ghostIndex = 0; ghostIndex < BLOOM_LENS_MAX_GHOSTS; ghostIndex++) {
    if (float(ghostIndex) >= bloomLens.ghostCount) {
      continue;
    }

    vec2 ghostCoordinate = reflectedCoordinate +
      centeredCoordinate * float(ghostIndex) * bloomLens.ghostSpacing;
    float radialFalloff = max(1.0 - length(ghostCoordinate - vec2(0.5)) * 1.41421356, 0.0);
    float ghostWeight = radialFalloff * (1.0 - float(ghostIndex) / (bloomLens.ghostCount + 1.0));
    ghostColor += bloomLens_sampleSpectralHighlight(
      sourceTexture,
      ghostCoordinate,
      radialDirection
    ) * ghostWeight;
    totalWeight += ghostWeight;
  }

  return ghostColor / max(totalWeight, 0.00001);
}

vec4 bloomLens_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec2 centeredCoordinate = texCoord - vec2(0.5);
  vec2 radialDirection = centeredCoordinate / max(length(centeredCoordinate), 0.00001);
  vec3 lensColor = vec3(0.0);

  if (bloomLens.starburstIntensity > 0.0) {
    lensColor += bloomLens_sampleStarburst(texCoord) * bloomLens.starburstIntensity;
  }
  if (bloomLens.ghostIntensity > 0.0) {
    lensColor += bloomLens_sampleGhosts(
      sourceTexture,
      texCoord,
      radialDirection
    ) * bloomLens.ghostIntensity;
  }
  if (bloomLens.haloIntensity > 0.0) {
    vec2 haloCoordinate = texCoord - radialDirection * bloomLens.haloRadius;
    float haloFalloff = max(1.0 - length(centeredCoordinate) * 1.41421356, 0.0);
    lensColor += bloomLens_sampleSpectralHighlight(
      sourceTexture,
      haloCoordinate,
      radialDirection
    ) * bloomLens.haloIntensity * haloFalloff;
  }

  return vec4(lensColor, 1.0);
}
`,
  bindingLayout: [{name: 'glowTexture', group: 0}],
  uniforms: {} as BloomLensUniforms,
  bindings: {} as BloomLensBindings,
  uniformTypes: {
    starburstIntensity: 'f32',
    starburstSpikes: 'f32',
    starburstLength: 'f32',
    starburstRotation: 'f32',
    ghostIntensity: 'f32',
    ghostCount: 'f32',
    ghostSpacing: 'f32',
    haloIntensity: 'f32',
    haloRadius: 'f32',
    chromaticAberration: 'f32'
  },
  defaultUniforms: {
    starburstIntensity: 0,
    starburstSpikes: 4,
    starburstLength: 48,
    starburstRotation: 0,
    ghostIntensity: 0,
    ghostCount: 3,
    ghostSpacing: 0.32,
    haloIntensity: 0,
    haloRadius: 0.34,
    chromaticAberration: 0
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<BloomLensUniforms> & BloomLensBindings,
  BloomLensUniforms,
  BloomLensBindings
>;

type BloomTemporalBindings = {
  historyTexture?: Texture;
};

export const bloomTemporalPass = {
  name: 'bloomTemporal',
  source: /* wgsl */ `
struct bloomTemporalUniforms {
  stability: f32,
};

@group(0) @binding(auto) var<uniform> bloomTemporal: bloomTemporalUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;

fn bloomTemporal_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  let current = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0.0).rgb;
  let left = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord - vec2f(texel.x, 0.0), 0.0).rgb;
  let right = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord + vec2f(texel.x, 0.0), 0.0).rgb;
  let top = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord - vec2f(0.0, texel.y), 0.0).rgb;
  let bottom = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord + vec2f(0.0, texel.y), 0.0).rgb;
  let minimumColor = min(current, min(min(left, right), min(top, bottom)));
  let maximumColor = max(current, max(max(left, right), max(top, bottom)));
  let history = textureSampleLevel(historyTexture, historyTextureSampler, texCoord, 0.0);
  let clampedHistory = clamp(history.rgb, minimumColor, maximumColor);
  let historyWeight = select(0.0, clamp(bloomTemporal.stability, 0.0, 0.95), history.a > 0.5);
  return vec4f(mix(current, clampedHistory, historyWeight), 1.0);
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomTemporalUniforms {
  float stability;
} bloomTemporal;

uniform sampler2D historyTexture;

vec4 bloomTemporal_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec2 texel = 1.0 / vec2(textureSize(sourceTexture, 0));
  vec3 current = textureLod(sourceTexture, texCoord, 0.0).rgb;
  vec3 left = textureLod(sourceTexture, texCoord - vec2(texel.x, 0.0), 0.0).rgb;
  vec3 right = textureLod(sourceTexture, texCoord + vec2(texel.x, 0.0), 0.0).rgb;
  vec3 top = textureLod(sourceTexture, texCoord - vec2(0.0, texel.y), 0.0).rgb;
  vec3 bottom = textureLod(sourceTexture, texCoord + vec2(0.0, texel.y), 0.0).rgb;
  vec3 minimumColor = min(current, min(min(left, right), min(top, bottom)));
  vec3 maximumColor = max(current, max(max(left, right), max(top, bottom)));
  vec4 history = textureLod(historyTexture, texCoord, 0.0);
  vec3 clampedHistory = clamp(history.rgb, minimumColor, maximumColor);
  float historyWeight = history.a > 0.5 ? clamp(bloomTemporal.stability, 0.0, 0.95) : 0.0;
  return vec4(mix(current, clampedHistory, historyWeight), 1.0);
}
`,
  bindingLayout: [{name: 'historyTexture', group: 0}],
  uniforms: {} as {stability: number},
  bindings: {} as BloomTemporalBindings,
  uniformTypes: {stability: 'f32'},
  defaultUniforms: {stability: 0},
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  {stability?: number} & BloomTemporalBindings,
  {stability: number},
  BloomTemporalBindings
>;

type BloomLensCompositeUniforms = {
  tint: [number, number, number];
  intensity: number;
  dirtIntensity: number;
};

type BloomLensCompositeBindings = {
  glowTexture?: Texture;
  lensTexture?: Texture;
  lensDirtTexture?: Texture;
};

export function createBloomLensCompositePass(
  includeLensArtifacts: boolean,
  includeLensDirt: boolean
): ShaderPass<
  Partial<BloomLensCompositeUniforms> & BloomLensCompositeBindings,
  BloomLensCompositeUniforms,
  BloomLensCompositeBindings
> {
  const lensBindingsWGSL = includeLensArtifacts
    ? `\n@group(0) @binding(auto) var lensTexture: texture_2d<f32>;
@group(0) @binding(auto) var lensTextureSampler: sampler;`
    : '';
  const dirtBindingsWGSL = includeLensDirt
    ? `\n@group(0) @binding(auto) var lensDirtTexture: texture_2d<f32>;
@group(0) @binding(auto) var lensDirtTextureSampler: sampler;`
    : '';
  const lensSampleWGSL = includeLensArtifacts
    ? 'textureSample(lensTexture, lensTextureSampler, texCoord).rgb'
    : 'vec3f(0.0)';
  const dirtSampleWGSL = includeLensDirt
    ? 'textureSample(lensDirtTexture, lensDirtTextureSampler, texCoord).rgb'
    : 'vec3f(0.0)';
  const lensBindingsGLSL = includeLensArtifacts ? '\nuniform sampler2D lensTexture;' : '';
  const dirtBindingsGLSL = includeLensDirt ? '\nuniform sampler2D lensDirtTexture;' : '';
  const lensSampleGLSL = includeLensArtifacts ? 'texture(lensTexture, texCoord).rgb' : 'vec3(0.0)';
  const dirtSampleGLSL = includeLensDirt
    ? 'texture(lensDirtTexture, texCoord).rgb'
    : 'vec3(0.0)';

  return {
    name: 'bloomComposite',
    source: /* wgsl */ `
struct bloomCompositeUniforms {
  tint: vec3f,
  intensity: f32,
  dirtIntensity: f32,
};

@group(0) @binding(auto) var<uniform> bloomComposite: bloomCompositeUniforms;
@group(0) @binding(auto) var glowTexture: texture_2d<f32>;
@group(0) @binding(auto) var glowTextureSampler: sampler;${lensBindingsWGSL}${dirtBindingsWGSL}

fn bloomComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let glowColor = textureSample(glowTexture, glowTextureSampler, texCoord).rgb;
  let lensColor = ${lensSampleWGSL};
  let dirtMask = ${dirtSampleWGSL};
  let cinematicGlow = (glowColor + lensColor) * (vec3f(1.0) + dirtMask * bloomComposite.dirtIntensity);
  return vec4f(
    sourceColor.rgb + cinematicGlow * bloomComposite.tint * bloomComposite.intensity,
    sourceColor.a
  );
}
`,
    fs: /* glsl */ `
layout(std140) uniform bloomCompositeUniforms {
  vec3 tint;
  float intensity;
  float dirtIntensity;
} bloomComposite;

uniform sampler2D glowTexture;${lensBindingsGLSL}${dirtBindingsGLSL}

vec4 bloomComposite_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec3 glowColor = texture(glowTexture, texCoord).rgb;
  vec3 lensColor = ${lensSampleGLSL};
  vec3 dirtMask = ${dirtSampleGLSL};
  vec3 cinematicGlow = (glowColor + lensColor) * (vec3(1.0) + dirtMask * bloomComposite.dirtIntensity);
  return vec4(
    sourceColor.rgb + cinematicGlow * bloomComposite.tint * bloomComposite.intensity,
    sourceColor.a
  );
}
`,
    bindingLayout: [
      {name: 'glowTexture', group: 0},
      ...(includeLensArtifacts ? [{name: 'lensTexture', group: 0}] : []),
      ...(includeLensDirt ? [{name: 'lensDirtTexture', group: 0}] : [])
    ],
    uniforms: {} as BloomLensCompositeUniforms,
    bindings: {} as BloomLensCompositeBindings,
    uniformTypes: {
      tint: 'vec3<f32>',
      intensity: 'f32',
      dirtIntensity: 'f32'
    },
    defaultUniforms: {
      tint: [1, 1, 1],
      intensity: 1,
      dirtIntensity: 0
    },
    passes: [{sampler: true}]
  };
}
