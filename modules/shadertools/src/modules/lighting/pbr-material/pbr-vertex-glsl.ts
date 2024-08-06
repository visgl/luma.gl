// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {glsl} from '../../../lib/glsl-utils/highlight';

export const vs = glsl`\
uniform projection {
  mat4 u_MVPMatrix;
  mat4 u_ModelMatrix;
  mat4 u_NormalMatrix;
  // Projection
  vec3 u_Camera;
} proj;

out vec3 pbr_vPosition;
out vec2 pbr_vUV;

#ifdef HAS_NORMALS
# ifdef HAS_TANGENTS
out mat3 pbr_vTBN;
# else
out vec3 pbr_vNormal;
# endif
#endif

void pbr_setPositionNormalTangentUV(vec4 position, vec4 normal, vec4 tangent, vec2 uv)
{
  vec4 pos = proj.u_ModelMatrix * position;
  pbr_vPosition = vec3(pos.xyz) / pos.w;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(proj.u_NormalMatrix * vec4(normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(proj.u_ModelMatrix * vec4(tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
  pbr_vTBN = mat3(tangentW, bitangentW, normalW);
#else // HAS_TANGENTS != 1
  pbr_vNormal = normalize(vec3(proj.u_ModelMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV = uv;
#else
  pbr_vUV = vec2(0.,0.);
#endif
}
`;
