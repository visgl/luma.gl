// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray16} from '@math.gl/core';
import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {pbrMaterial} from '../pbr-material/pbr-material';

export type PBRSurfaceProps = {
  /** Rigid world-to-view camera transform. Defaults to identity. */
  viewMatrix?: Readonly<NumberArray16>;
  /** Include canonical normal/bump maps instead of geometric normals. Defaults to false. */
  useMaterialNormals?: boolean;
};

export type PBRSurfaceUniforms = {
  viewMatrix: Readonly<NumberArray16>;
  useMaterialNormals: number;
};

/** Encodes view-space PBR normals in RGB; alpha one marks covered surface pixels. */
export const pbrSurface: ShaderModule<PBRSurfaceProps, PBRSurfaceUniforms> = {
  name: 'pbrSurface',
  dependencies: [pbrMaterial],
  bindingLayout: [{name: 'pbrSurface', group: 0}],
  uniformTypes: {viewMatrix: 'mat4x4<f32>', useMaterialNormals: 'i32'},
  defaultUniforms: {
    viewMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    useMaterialNormals: 0
  },
  getUniforms(properties = {}) {
    return {
      ...(properties.viewMatrix ? {viewMatrix: properties.viewMatrix} : {}),
      ...(properties.useMaterialNormals === undefined
        ? {}
        : {useMaterialNormals: Number(properties.useMaterialNormals)})
    };
  },
  source: /* wgsl */ `
struct PBRSurfaceUniforms {
  viewMatrix: mat4x4f,
  useMaterialNormals: i32,
};
@group(0) @binding(auto) var<uniform> pbrSurface: PBRSurfaceUniforms;
fn pbrSurface_getColor() -> vec4f {
#ifdef HAS_NORMALS
  var normal = normalize(fragmentInputs.pbr_vNormal);
#ifdef DOUBLE_SIDED
  if (!pbr_frontFacing) {normal = -normal;}
#endif
#else
  var normal = normalize(cross(dpdy(fragmentInputs.pbr_vPosition), dpdx(fragmentInputs.pbr_vPosition)));
#endif
#ifdef HAS_NORMALMAP
  if (pbrSurface.useMaterialNormals != 0) {
    let coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#else
#ifdef HAS_BUMPMAP
  if (pbrSurface.useMaterialNormals != 0) {
    let coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#endif
#endif
  let viewNormal = normalize((pbrSurface.viewMatrix * vec4f(normal, 0.0)).xyz);
  return vec4f(viewNormal * 0.5 + vec3f(0.5), 1.0);
}`,
  fs: /* glsl */ `
layout(std140) uniform pbrSurfaceUniforms {
  mat4 viewMatrix;
  int useMaterialNormals;
} pbrSurface;
vec4 pbrSurface_getColor() {
#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normal = normalize(pbr_vTBN[2]);
#else
  vec3 normal = normalize(pbr_vNormal);
#endif
#ifdef DOUBLE_SIDED
  if (!gl_FrontFacing) normal = -normal;
#endif
#else
  vec3 normal = normalize(cross(dFdx(pbr_vPosition), dFdy(pbr_vPosition)));
#endif
#ifdef HAS_NORMALMAP
  if (pbrSurface.useMaterialNormals != 0) {
    vec2 coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#else
#ifdef HAS_BUMPMAP
  if (pbrSurface.useMaterialNormals != 0) {
    vec2 coordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
    normal = getNormal(getTBN(coordinates), coordinates);
  }
#endif
#endif
  vec3 viewNormal = normalize((pbrSurface.viewMatrix * vec4(normal, 0.0)).xyz);
  return vec4(viewNormal * 0.5 + 0.5, 1.0);
}`
};
