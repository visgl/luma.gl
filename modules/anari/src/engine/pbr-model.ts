// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  createPBRModel as createStandalonePBRModel,
  getPBRModelWGSL,
  type CreatePBRModelOptions
} from '@luma.gl/engine/lighting';
export {getPBRGeometryDefines, getPBRTextureDefines} from '@luma.gl/engine/lighting';
export type {CreatePBRModelOptions} from '@luma.gl/engine/lighting';

/** Scene transform, picking and shadow extensions composed with shared mesh entry points. */
export const PBR_MODEL_WGSL_SHADER = /* @__PURE__ */ getPBRModelWGSL({
  vertexInputs: /* wgsl */ `#ifdef USE_SCENE_INSTANCES
  @location(12) instanceMetadata: vec4u,
#endif`,
  fragmentInputs: /* wgsl */ `#ifdef USE_SCENE_INSTANCES
  @location(6) @interpolate(flat) instanceIdentifier: u32,
#endif`,
  instanceTransform: /* wgsl */ `#ifdef HAS_GPU_TRANSFORMS
  let metadata = inputs.instanceMetadata;
  if (metadata.y != 0xffffffffu) {
    let first = sceneWorldMatrices[metadata.x][3].xyz;
    let second = sceneWorldMatrices[metadata.y][3].xyz;
    let displacement = second - first;
    let direction = select(displacement / max(length(displacement), 0.000001), vec3f(0, 0, 1), length(displacement) < 0.000001);
    let reference = select(vec3f(0, 1, 0), vec3f(1, 0, 0), abs(direction.y) > 0.9);
    let tangent = normalize(cross(direction, reference));
    let radius = bitcast<f32>(metadata.w);
    instanceMatrix = mat4x4f(vec4f(tangent * radius, 0),
      vec4f(cross(direction, tangent) * radius, 0),
      vec4f(direction * max(length(displacement), 0.000001) * 0.5, 0), vec4f((first + second) * 0.5, 1));
  } else {
    instanceMatrix = sceneWorldMatrices[metadata.x] * instanceMatrix;
  }
#endif
`,
  vertexOutput: /* wgsl */ `#ifdef USE_SCENE_INSTANCES
  outputs.instanceIdentifier = inputs.instanceMetadata.z;
#endif`,
  fragmentDeclarations: /* wgsl */ `// Depth, shadow and picking must use the visible material's alpha cutoff and UV transform.
fn sceneDiscardMaskedFragment(inputs: PBRModelFragmentInputs) {
#ifdef ALPHA_CUTOFF
  var alpha = pbrMaterial.baseColorFactor.a * inputs.pbrColor.a;
#ifdef HAS_BASECOLORMAP
  let coordinates = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  alpha *= textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, coordinates).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}
`,
  fragmentReturnType: /* wgsl */ `#ifdef SCENE_DEPTH_PASS
#else
 -> @location(0) vec4f
#endif`,
  fragmentBody: /* wgsl */ `#ifndef SCENE_DEPTH_PASS
#ifndef SCENE_PICK_PASS
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#endif
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#endif
#endif
#endif
#ifdef SCENE_DEPTH_PASS
  sceneDiscardMaskedFragment(inputs);
#else
#ifdef SCENE_PICK_PASS
  sceneDiscardMaskedFragment(inputs);
  let identifier = inputs.instanceIdentifier;
  return vec4f(f32(identifier & 255u), f32((identifier >> 8u) & 255u),
    f32((identifier >> 16u) & 255u), 255.0) / 255.0;
#else
#ifdef USE_SCENE_SHADOWS
  let normal = normalize(inputs.pbrNormal);
  let visibility = vec4f(
    shadow_getSpotFactor(0, inputs.pbrPosition, normal),
    shadow_getSpotFactor(1, inputs.pbrPosition, normal),
    shadow_getSpotFactor(2, inputs.pbrPosition, normal),
    shadow_getSpotFactor(3, inputs.pbrPosition, normal));
  return pbr_filterColorWithSpotShadows(inputs.pbrColor, visibility);
#else
  return pbr_filterColor(inputs.pbrColor);
#endif
#endif
#endif`
});

/** Retains scene-specific default shaders while sharing model construction and specialization. */
export function createPBRModel(device: Device, options: CreatePBRModelOptions) {
  return createStandalonePBRModel(device, {source: PBR_MODEL_WGSL_SHADER, ...options});
}
