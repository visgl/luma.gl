// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass} from '@luma.gl/shadertools';

const BLUR_SAMPLE_LIMIT = 20;

/** Bindings consumed by {@link dof}. */
type DofBindings = {
  /** Depth texture sampled to reconstruct per-pixel view-space depth. */
  depthTexture?: Texture;
};

/** Internal uniforms consumed by the shader implementation. */
type InternalDofUniforms = {
  depthRange?: [number, number];
  focusDistance?: number;
  blurCoefficient?: number;
  pixelsPerMillimeter?: number;
  texelOffset?: [number, number];
};

/**
 * Depth of field
 * Applies a depth-driven blur using the provided scene depth texture.
 */
export type DofProps = {
  /** Near and far clip distances used to reconstruct linear depth. */
  depthRange?: [number, number];
  /** View-space focal-plane distance that should stay sharp. */
  focusDistance?: number;
  /** Lens blur coefficient derived from focal length and aperture. */
  blurCoefficient?: number;
  /** Pixel density factor used to convert millimeters to texels. */
  pixelsPerMillimeter?: number;
};

/**
 * Public uniforms exposed by {@link dof}.
 *
 * `texelOffset` is intentionally excluded because the reusable pipeline controls the blur axis.
 */
export type DofUniforms = DofProps;

const source = /* wgsl */ `\
const DEPTH_OF_FIELD_MAX_BLUR: i32 = ${BLUR_SAMPLE_LIMIT};

struct dofUniforms {
  depthRange: vec2<f32>,
  focusDistance: f32,
  blurCoefficient: f32,
  pixelsPerMillimeter: f32,
  texelOffset: vec2<f32>,
};

@group(0) @binding(auto) var<uniform> dof: dofUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;

fn dof_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let resolution = vec2<i32>(textureDimensions(sourceTexture, 0));
  let maxCoordinate = resolution - vec2<i32>(1, 1);
  let fragmentCoordinate = min(vec2<i32>(vec2<f32>(resolution) * texCoord), maxCoordinate);

  let depthSample = textureLoad(depthTexture, fragmentCoordinate, 0);
  let linearDepth =
    (dof.depthRange.x * dof.depthRange.y) /
    (dof.depthRange.y -
      depthSample * (dof.depthRange.y - dof.depthRange.x));

  let deltaDepth = abs(dof.focusDistance - linearDepth);
  let foregroundCompensation = select(
    abs(dof.focusDistance + deltaDepth),
    abs(dof.focusDistance - deltaDepth),
    linearDepth < dof.focusDistance
  );
  let blurRadius = min(
    floor(
      dof.blurCoefficient *
        (deltaDepth / max(foregroundCompensation, 0.0001)) *
        dof.pixelsPerMillimeter
    ),
    f32(DEPTH_OF_FIELD_MAX_BLUR)
  );

  var color = vec4f(0.0);

  if (blurRadius > 1.0) {
    let halfBlur = blurRadius * 0.5;
    var sampleCount = 0.0;

    for (var sampleIndex: i32 = 0; sampleIndex <= DEPTH_OF_FIELD_MAX_BLUR; sampleIndex++) {
      if (f32(sampleIndex) > blurRadius) {
        break;
      }

      let sampleOffset = round((f32(sampleIndex) - halfBlur) * dof.texelOffset);
      let sampleCoordinate = clamp(
        fragmentCoordinate + vec2<i32>(sampleOffset),
        vec2<i32>(0, 0),
        maxCoordinate
      );
      color += textureLoad(sourceTexture, sampleCoordinate, 0);
      sampleCount += 1.0;
    }

    color /= sampleCount;
  } else {
    color = textureLoad(sourceTexture, fragmentCoordinate, 0);
  }

  return color;
}
`;

const fs = /* glsl */ `\
#define DEPTH_OF_FIELD_MAX_BLUR ${BLUR_SAMPLE_LIMIT}.0

uniform sampler2D depthTexture;

layout(std140) uniform dofUniforms {
  vec2 depthRange;
  float focusDistance;
  float blurCoefficient;
  float pixelsPerMillimeter;
  vec2 texelOffset;
} dof;

vec4 dof_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 resolution = textureSize(sourceTexture, 0);
  ivec2 maxCoordinate = resolution - 1;
  ivec2 fragmentCoordinate = min(ivec2(texCoord * vec2(resolution)), maxCoordinate);

  float depthSample = texelFetch(depthTexture, fragmentCoordinate, 0).r;
  float ndcDepth = depthSample * 2.0 - 1.0;
  float linearDepth = -(2.0 * dof.depthRange.y * dof.depthRange.x) /
    (ndcDepth * (dof.depthRange.y - dof.depthRange.x) -
      dof.depthRange.y -
      dof.depthRange.x);

  float deltaDepth = abs(dof.focusDistance - linearDepth);
  float foregroundCompensation =
    linearDepth < dof.focusDistance
      ? abs(dof.focusDistance - deltaDepth)
      : abs(dof.focusDistance + deltaDepth);
  float blurRadius = min(
    floor(
      dof.blurCoefficient *
        (deltaDepth / max(foregroundCompensation, 0.0001)) *
        dof.pixelsPerMillimeter
    ),
    DEPTH_OF_FIELD_MAX_BLUR
  );

  vec4 color = vec4(0.0);

  if (blurRadius > 1.0) {
    float halfBlur = blurRadius * 0.5;
    float sampleCount = 0.0;

    for (float sampleIndex = 0.0; sampleIndex <= DEPTH_OF_FIELD_MAX_BLUR; sampleIndex++) {
      if (sampleIndex > blurRadius) {
        break;
      }

      ivec2 sampleCoordinate = clamp(
        fragmentCoordinate + ivec2((sampleIndex - halfBlur) * dof.texelOffset),
        ivec2(0),
        maxCoordinate
      );
      color += texelFetch(sourceTexture, sampleCoordinate, 0);
      sampleCount += 1.0;
    }

    color /= sampleCount;
  } else {
    color = texelFetch(sourceTexture, fragmentCoordinate, 0);
  }

  return color;
}
`;

/**
 * Depth-of-field postprocessing pass.
 *
 * This pass samples scene color from `sourceTexture` and scene depth from `depthTexture`, then
 * computes a blur radius from reconstructed linear depth. It is designed to be driven by
 * {@link dofShaderPassPipeline}, which runs the pass twice with different internal
 * `texelOffset` values for horizontal and vertical blur.
 *
 * Callers are expected to provide:
 * - `sourceTexture`: the resolved scene color texture
 * - `depthTexture`: a matching sampled depth texture
 * - uniforms describing the camera or lens state used to derive the circle of confusion
 */
export const dof = {
  name: 'dof',
  source,
  fs,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  props: {} as DofProps & DofBindings,
  uniforms: {} as InternalDofUniforms,
  bindings: {} as DofBindings,
  uniformTypes: {
    depthRange: 'vec2<f32>',
    focusDistance: 'f32',
    blurCoefficient: 'f32',
    pixelsPerMillimeter: 'f32',
    texelOffset: 'vec2<f32>'
  },
  propTypes: {
    depthRange: {value: [0.1, 100]},
    focusDistance: {value: 1, min: 0.0001},
    blurCoefficient: {value: 1, min: 0},
    pixelsPerMillimeter: {value: 1, min: 0},
    texelOffset: {value: [1, 0], private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<DofProps & DofBindings, InternalDofUniforms, DofBindings>;
