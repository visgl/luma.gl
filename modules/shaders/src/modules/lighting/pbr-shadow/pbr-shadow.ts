// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray16} from '@math.gl/core';
import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {pbrMaterial} from '../pbr-material/pbr-material';
import {shadow} from '../shadow/shadow';

export type PBRShadowProps = {
  /** Receiver camera view matrix, used for directional cascade selection. */
  viewMatrix?: Readonly<NumberArray16>;
  /** Toggle receiving while retaining allocated maps and bindings. Defaults to true. */
  enabled?: boolean;
};

export type PBRShadowUniforms = {
  viewMatrix: Readonly<NumberArray16>;
  enabled: number;
};

/** Applies shadow visibility to matching direct-light slots in the canonical PBR shader. */
export const pbrShadow: ShaderModule<PBRShadowProps, PBRShadowUniforms> = {
  name: 'pbrShadow',
  dependencies: [pbrMaterial, shadow],
  bindingLayout: [{name: 'pbrShadow', group: 0}],
  uniformTypes: {viewMatrix: 'mat4x4<f32>', enabled: 'i32'},
  defaultUniforms: {
    viewMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    enabled: 1
  },
  getUniforms(properties = {}) {
    return {
      ...(properties.viewMatrix ? {viewMatrix: properties.viewMatrix} : {}),
      ...(properties.enabled === undefined ? {} : {enabled: Number(properties.enabled)})
    };
  },
  source: /* wgsl */ `
struct PBRShadowUniforms {
  viewMatrix: mat4x4f,
  enabled: i32,
};
@group(0) @binding(auto) var<uniform> pbrShadow: PBRShadowUniforms;
fn pbrShadow_filterColorWithDirectionalContact(vertexColor: vec4f, worldPosition: vec3f, worldNormal: vec3f, contactVisibility: f32) -> vec4f {
  var directionalVisibility = 1.0;
  var pointVisibility = vec4f(1.0);
  var spotVisibility = vec4f(1.0);
  if (pbrShadow.enabled != 0) {
    let normal = normalize(worldNormal);
    let viewDepth = -(pbrShadow.viewMatrix * vec4f(worldPosition, 1.0)).z;
    directionalVisibility = shadow_getDirectionalFactor(worldPosition, normal, viewDepth);
    for (var index = 0; index < 4; index++) {
      pointVisibility[index] = shadow_getPointFactor(index, worldPosition, normal);
      spotVisibility[index] = shadow_getSpotFactor(index, worldPosition, normal);
    }
  }
  return pbr_filterColorWithShadows(vertexColor, min(directionalVisibility, contactVisibility), pointVisibility, spotVisibility);
}
fn pbrShadow_filterColor(vertexColor: vec4f, worldPosition: vec3f, worldNormal: vec3f) -> vec4f {
  return pbrShadow_filterColorWithDirectionalContact(vertexColor, worldPosition, worldNormal, 1.0);
}`,

  fs: /* glsl */ `
layout(std140) uniform pbrShadowUniforms {
  mat4 viewMatrix;
  int enabled;
} pbrShadow;
vec4 pbrShadow_filterColorWithDirectionalContact(vec4 vertexColor, vec3 worldPosition, vec3 worldNormal, float contactVisibility) {
  float directionalVisibility = 1.0;
  vec4 pointVisibility = vec4(1.0);
  vec4 spotVisibility = vec4(1.0);
  if (pbrShadow.enabled != 0) {
    vec3 normal = normalize(worldNormal);
    float viewDepth = -(pbrShadow.viewMatrix * vec4(worldPosition, 1.0)).z;
    directionalVisibility = shadow_getDirectionalFactor(worldPosition, normal, viewDepth);
    for (int index = 0; index < 4; index++) {
      pointVisibility[index] = shadow_getPointFactor(index, worldPosition, normal);
      spotVisibility[index] = shadow_getSpotFactor(index, worldPosition, normal);
    }
  }
  return pbr_filterColorWithShadows(vertexColor, min(directionalVisibility, contactVisibility), pointVisibility, spotVisibility);
 }
vec4 pbrShadow_filterColor(vec4 vertexColor, vec3 worldPosition, vec3 worldNormal) {
  return pbrShadow_filterColorWithDirectionalContact(vertexColor, worldPosition, worldNormal, 1.0);
}`
};
