// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {type Material, Model, type ModelProps} from '@luma.gl/engine';
import {pbrMaterial, pbrScene, skin} from '@luma.gl/shadertools';

/** WGSL mesh entry points composed with canonical PBR shader modules by {@link createPBRModel}. */
export const PBR_MODEL_WGSL_SHADER = /* wgsl */ `
struct ScenePBRVertexInputs {
  @location(0) positions: vec3f,
#ifdef HAS_NORMALS
  @location(1) normals: vec3f,
#endif
#ifdef HAS_TANGENTS
  @location(2) TANGENT: vec4f,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2f,
#endif
#ifdef HAS_UV_1
  @location(4) texCoords1: vec2f,
#endif
#ifdef HAS_SKIN
  @location(5) JOINTS_0: vec4u,
  @location(6) WEIGHTS_0: vec4f,
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  @location(7) colors: vec4f,
#else
  @location(7) colors: vec3f,
#endif
#endif
#ifdef HAS_INSTANCING
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
#endif
};

struct ScenePBRFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
  @location(4) pbrColor: vec4f,
#ifdef HAS_TANGENTS
  @location(5) pbrTangent: vec4f,
#endif
};

fn getPBRInstanceNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}

@vertex
fn vertexMain(inputs: ScenePBRVertexInputs) -> ScenePBRFragmentInputs {
  var outputs: ScenePBRFragmentInputs;
  var position = vec4f(inputs.positions, 1.0);
  var normal = vec3f(0.0, 0.0, 1.0);
  var tangent = vec4f(1.0, 0.0, 0.0, 1.0);
  var textureCoordinates = vec2f(0.0);
  var secondTextureCoordinates = vec2f(0.0);
  var vertexColor = vec4f(1.0);

#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV
  textureCoordinates = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  secondTextureCoordinates = inputs.texCoords1;
#endif
#ifdef HAS_TANGENTS
  tangent = inputs.TANGENT;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  vertexColor = inputs.colors;
#else
  vertexColor = vec4f(inputs.colors, 1.0);
#endif
#endif

#ifdef HAS_SKIN
  let skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_INSTANCING
  let instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = instanceMatrix * position;
  let normalMatrix = getPBRInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  ));
  normal = normalize(normalMatrix * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * worldPosition;
#else
  let worldPosition = pbrProjection.modelMatrix * position;
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(
    normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz),
    tangent.w
  );
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
#endif

  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV0 = textureCoordinates;
  outputs.pbrUV1 = secondTextureCoordinates;
  outputs.pbrNormal = normal;
  outputs.pbrColor = vertexColor;
#ifdef HAS_TANGENTS
  outputs.pbrTangent = tangent;
#endif
  return outputs;
}

@fragment
fn fragmentMain(inputs: ScenePBRFragmentInputs) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#endif
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#endif
  return pbr_filterColor(inputs.pbrColor);
}
`;

const PBR_VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 positions;
#ifdef HAS_NORMALS
in vec3 normals;
#endif
#ifdef HAS_TANGENTS
in vec4 TANGENT;
#endif
#ifdef HAS_UV
in vec2 texCoords;
#endif
#ifdef HAS_UV_1
in vec2 texCoords1;
#endif
#ifdef HAS_SKIN
in uvec4 JOINTS_0;
in vec4 WEIGHTS_0;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
in vec4 colors;
#else
in vec3 colors;
#endif
#endif
#ifdef HAS_INSTANCING
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;
#endif
out vec4 sceneVertexColor;

void main(void) {
  vec4 position = vec4(positions, 1.0);
  vec4 normal = vec4(0.0, 0.0, 1.0, 0.0);
  vec4 tangent = vec4(1.0, 0.0, 0.0, 1.0);
  vec2 textureCoordinates = vec2(0.0);
  vec2 secondTextureCoordinates = vec2(0.0);
  sceneVertexColor = vec4(1.0);

#ifdef HAS_NORMALS
  normal = vec4(normals, 0.0);
#endif
#ifdef HAS_TANGENTS
  tangent = TANGENT;
#endif
#ifdef HAS_UV
  textureCoordinates = texCoords;
#endif
#ifdef HAS_UV_1
  secondTextureCoordinates = texCoords1;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  sceneVertexColor = colors;
#else
  sceneVertexColor = vec4(colors, 1.0);
#endif
#endif

#ifdef HAS_SKIN
  mat4 skinMatrix = getSkinMatrix(WEIGHTS_0, JOINTS_0);
  position = skinMatrix * position;
  normal = skinMatrix * normal;
  tangent = vec4((skinMatrix * vec4(tangent.xyz, 0.0)).xyz, tangent.w);
#endif

#ifdef HAS_INSTANCING
  mat4 instanceMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );
  position = instanceMatrix * position;
  normal = vec4(normalize(transpose(inverse(mat3(instanceMatrix))) * normal.xyz), 0.0);
  tangent = vec4(normalize(mat3(instanceMatrix) * tangent.xyz), tangent.w);
#endif

  pbr_setPositionNormalTangentUV(
    position,
    normal,
    tangent,
    textureCoordinates,
    secondTextureCoordinates
  );
  gl_Position = pbrProjection.modelViewProjectionMatrix * position;
}
`;

const PBR_FRAGMENT_SHADER = /* glsl */ `#version 300 es
in vec4 sceneVertexColor;
out vec4 fragmentColor;

void main(void) {
#ifdef DEBUG_NORMALS
#ifdef HAS_TANGENTS
  fragmentColor = vec4(normalize(pbr_vTBN[2]) * 0.5 + 0.5, 1.0);
#else
#ifdef HAS_NORMALS
  fragmentColor = vec4(normalize(pbr_vNormal) * 0.5 + 0.5, 1.0);
#else
  fragmentColor = vec4(0.5, 0.5, 1.0, 1.0);
#endif
#endif
#else
#ifdef DEBUG_DEPTH
  fragmentColor = vec4(vec3(gl_FragCoord.z), 1.0);
#else
  fragmentColor = pbr_filterColor(sceneVertexColor);
#endif
#endif
}
`;

/** Model properties accepted by the shared physically based model factory. */
export type CreatePBRModelOptions = ModelProps & {
  /** Shared PBR material that owns the canonical material binding group. */
  material: Material;
};

/** Creates a WebGPU/WebGL PBR model shared by retained scenes and format adapters. */
export function createPBRModel(device: Device, options: CreatePBRModelOptions): Model {
  const shaderModules = [pbrScene, pbrMaterial, ...(options.modules || [])];
  const modules = shaderModules.filter(
    (module, moduleIndex) =>
      shaderModules.findIndex(candidate => candidate.name === module.name) === moduleIndex
  );
  const geometryDefines = getPBRGeometryDefines(options.geometry);
  if (geometryDefines['HAS_SKIN'] && !modules.some(module => module.name === skin.name)) {
    modules.push(skin);
  }

  return new Model(device, {
    source: PBR_MODEL_WGSL_SHADER,
    vs: PBR_VERTEX_SHADER,
    fs: PBR_FRAGMENT_SHADER,
    ...options,
    modules,
    defines: {
      ...geometryDefines,
      ...getPBRTextureDefines(options.material.getResourceBindings()),
      ...options.defines
    }
  });
}

/** Returns shader features implied by canonical CPU geometry attributes. */
export function getPBRGeometryDefines(geometry: ModelProps['geometry']): Record<string, boolean> {
  const attributes = geometry && 'attributes' in geometry ? geometry.attributes : {};
  const colors = attributes['COLOR_0'] || attributes['colors'];

  return {
    HAS_NORMALS: Boolean(attributes['NORMAL'] || attributes['normals']),
    HAS_TANGENTS: Boolean(attributes['TANGENT'] || attributes['tangents']),
    HAS_UV: Boolean(attributes['TEXCOORD_0'] || attributes['texCoords']),
    HAS_UV_1: Boolean(attributes['TEXCOORD_1'] || attributes['texCoords1']),
    HAS_SKIN: Boolean(attributes['JOINTS_0'] && attributes['WEIGHTS_0']),
    HAS_COLORS: Boolean(colors),
    HAS_RGBA_COLORS: Boolean(colors && 'size' in colors && colors.size === 4)
  };
}

/** Returns feature-specialized shader defines for texture bindings present on one PBR material. */
export function getPBRTextureDefines(bindings: Record<string, unknown>): Record<string, boolean> {
  return {
    HAS_BASECOLORMAP: Boolean(bindings['pbr_baseColorSampler']),
    HAS_NORMALMAP: Boolean(bindings['pbr_normalSampler']),
    HAS_EMISSIVEMAP: Boolean(bindings['pbr_emissiveSampler']),
    HAS_METALROUGHNESSMAP: Boolean(bindings['pbr_metallicRoughnessSampler']),
    HAS_OCCLUSIONMAP: Boolean(bindings['pbr_occlusionSampler']),
    HAS_SPECULARCOLORMAP: Boolean(bindings['pbr_specularColorSampler']),
    HAS_SPECULARINTENSITYMAP: Boolean(bindings['pbr_specularIntensitySampler']),
    HAS_TRANSMISSIONMAP: Boolean(bindings['pbr_transmissionSampler']),
    HAS_THICKNESSMAP: Boolean(bindings['pbr_thicknessSampler']),
    HAS_CLEARCOATMAP: Boolean(bindings['pbr_clearcoatSampler']),
    HAS_CLEARCOATROUGHNESSMAP: Boolean(bindings['pbr_clearcoatRoughnessSampler']),
    HAS_CLEARCOATNORMALMAP: Boolean(bindings['pbr_clearcoatNormalSampler']),
    HAS_SHEENCOLORMAP: Boolean(bindings['pbr_sheenColorSampler']),
    HAS_SHEENROUGHNESSMAP: Boolean(bindings['pbr_sheenRoughnessSampler']),
    HAS_IRIDESCENCEMAP: Boolean(bindings['pbr_iridescenceSampler']),
    HAS_IRIDESCENCETHICKNESSMAP: Boolean(bindings['pbr_iridescenceThicknessSampler']),
    HAS_ANISOTROPYMAP: Boolean(bindings['pbr_anisotropySampler'])
  };
}
