// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {Material} from '../material/material';
import {Model, type ModelProps} from '../model/model';
import {
  pbrMaterial,
  pbrScene,
  pbrShadow,
  pbrSurface,
  pbrContactShadow,
  pbrAmbientOcclusion,
  skin
} from '@luma.gl/shaders';

/** Optional WGSL extensions for adapters building specialized mesh passes. */
export type PBRModelShaderHooks = {
  vertexInputs?: string;
  fragmentInputs?: string;
  instanceTransform?: string;
  vertexOutput?: string;
  fragmentDeclarations?: string;
  fragmentReturnType?: string;
  fragmentBody?: string;
};

/** Builds mesh entry points; default source has no scene-specific resources or identifiers. */
export function getPBRModelWGSL(hooks: PBRModelShaderHooks = {}): string {
  return /* wgsl */ `
struct PBRModelVertexInputs {
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
${hooks.vertexInputs ?? ''}
#ifdef HAS_INSTANCING
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
#endif
};

struct PBRModelFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
  @location(4) pbrColor: vec4f,
${hooks.fragmentInputs ?? ''}
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
fn vertexMain(inputs: PBRModelVertexInputs) -> PBRModelFragmentInputs {
  var outputs: PBRModelFragmentInputs;
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
  normal = normalize(getPBRInstanceNormalMatrix(mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz)) * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w * sign(determinant(mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz))));
#endif
#endif

#ifdef HAS_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
${hooks.instanceTransform ?? ''}  position = instanceMatrix * position;
  let instanceNormalMatrix = getPBRInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz, instanceMatrix[1].xyz, instanceMatrix[2].xyz
  ));
  normal = normalize(instanceNormalMatrix * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w * sign(determinant(mat3x3f(instanceMatrix[0].xyz, instanceMatrix[1].xyz, instanceMatrix[2].xyz))));
#endif
#endif
  let worldPosition = pbrProjection.modelMatrix * position;
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w * sign(determinant(mat3x3f(pbrProjection.modelMatrix[0].xyz, pbrProjection.modelMatrix[1].xyz, pbrProjection.modelMatrix[2].xyz))));
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
${hooks.vertexOutput ?? ''}
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

${hooks.fragmentDeclarations ?? ''}
@fragment
fn fragmentMain(inputs: PBRModelFragmentInputs, @builtin(front_facing) frontFacing: bool)
${
  hooks.fragmentReturnType ??
  `#ifndef PBR_SHADOW_PASS
-> @location(0) vec4f
#endif`
}
{
#ifdef DOUBLE_SIDED
  pbr_frontFacing = frontFacing;
#endif
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
${
  hooks.fragmentBody ??
  `
#ifdef PBR_SHADOW_PASS
  pbr_discardMaskedFragment(inputs.pbrColor);
#else
#ifdef PBR_SURFACE_PASS
  pbr_discardMaskedFragment(inputs.pbrColor);
  return pbrSurface_getColor();
#else
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#else
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#else
#ifdef PBR_RECEIVE_AMBIENT_OCCLUSION
  pbrAmbientOcclusion_setFactor(inputs.position.xy);
#endif
#ifdef PBR_RECEIVE_SHADOWS
#ifdef HAS_NORMALS
  let shadowNormal = inputs.pbrNormal;
#else
  let shadowNormal = normalize(cross(dpdy(inputs.pbrPosition), dpdx(inputs.pbrPosition)));
#endif
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  return pbrShadow_filterColorWithDirectionalContact(inputs.pbrColor, inputs.pbrPosition, shadowNormal, pbrContactShadow_getFactor(inputs.position.xy));
#else
  return pbrShadow_filterColor(inputs.pbrColor, inputs.pbrPosition, shadowNormal);
#endif
#else
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  return pbrContactShadow_filterColor(inputs.pbrColor, inputs.position.xy);
#else
  return pbr_filterColor(inputs.pbrColor);
#endif
#endif
#endif
#endif
#endif
#endif
`
}
}
`;
}

export const PBR_MODEL_WGSL_SHADER = /* @__PURE__ */ getPBRModelWGSL();

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
  normal = vec4(transpose(inverse(mat3(skinMatrix))) * normal.xyz, 0.0);
  tangent = vec4((skinMatrix * vec4(tangent.xyz, 0.0)).xyz, tangent.w * sign(determinant(mat3(skinMatrix))));
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
  tangent = vec4(normalize(mat3(instanceMatrix) * tangent.xyz), tangent.w * sign(determinant(mat3(instanceMatrix))));
#endif

  tangent.w *= sign(determinant(mat3(pbrProjection.modelMatrix)));
  pbr_setPositionNormalTangentUV(
    position,
    normal,
    tangent,
    textureCoordinates,
    secondTextureCoordinates
  );
  gl_Position = pbrProjection.modelViewProjectionMatrix * position;
#ifdef PBR_SHADOW_PASS
  // ShadowMapRenderer light projections use [0, 1] depth on both backends.
  gl_Position.z = gl_Position.z * 2.0 - gl_Position.w;
#endif
}
`;

const PBR_FRAGMENT_SHADER = /* glsl */ `#version 300 es
in vec4 sceneVertexColor;
#ifndef PBR_SHADOW_PASS
out vec4 fragmentColor;
#endif

void main(void) {
#ifdef PBR_SHADOW_PASS
  pbr_discardMaskedFragment(sceneVertexColor);
#else
#ifdef PBR_SURFACE_PASS
  pbr_discardMaskedFragment(sceneVertexColor);
  fragmentColor = pbrSurface_getColor();
#else
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
#ifdef PBR_RECEIVE_AMBIENT_OCCLUSION
  pbrAmbientOcclusion_setFactor(gl_FragCoord.xy);
#endif
#ifdef PBR_RECEIVE_SHADOWS
#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 shadowNormal = pbr_vTBN[2];
#else
  vec3 shadowNormal = pbr_vNormal;
#endif
#else
  vec3 shadowNormal = normalize(cross(dFdx(pbr_vPosition), dFdy(pbr_vPosition)));
#endif
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  fragmentColor = pbrShadow_filterColorWithDirectionalContact(sceneVertexColor, pbr_vPosition, shadowNormal, pbrContactShadow_getFactor(gl_FragCoord.xy));
#else
  fragmentColor = pbrShadow_filterColor(sceneVertexColor, pbr_vPosition, shadowNormal);
#endif
#else
#ifdef PBR_RECEIVE_CONTACT_SHADOWS
  fragmentColor = pbrContactShadow_filterColor(sceneVertexColor, gl_FragCoord.xy);
#else
  fragmentColor = pbr_filterColor(sceneVertexColor);
#endif
#endif
#endif
#endif
#endif
#endif
}
`;

/** Model properties accepted by the shared physically based model factory. */
export type CreatePBRModelOptions = ModelProps & {
  /** Shared PBR material that owns the canonical material binding group. */
  material: Material;
  /** Include shadow sampling for directional, point and spot direct lights. */
  receiveShadows?: boolean;
  /** Include screen-space visibility for the first directional light. */
  receiveContactShadows?: boolean;
  /** Attenuate indirect lighting using screen-space ambient visibility. */
  receiveAmbientOcclusion?: boolean;
};

/** Creates a standalone WebGPU/WebGL PBR model with a borrowed material. */
export function createPBRModel(device: Device, options: CreatePBRModelOptions): Model {
  const {
    receiveShadows = false,
    receiveContactShadows = false,
    receiveAmbientOcclusion = false,
    ...modelOptions
  } = options;
  const shaderModules = [
    pbrScene,
    pbrMaterial,
    ...(receiveShadows ? [pbrShadow] : []),
    ...(receiveContactShadows ? [pbrContactShadow] : []),
    ...(receiveAmbientOcclusion ? [pbrAmbientOcclusion] : []),
    ...(options.defines?.['PBR_SURFACE_PASS'] ? [pbrSurface] : []),
    ...(options.modules || [])
  ];
  const modules = shaderModules.filter(
    (module, moduleIndex) =>
      shaderModules.findIndex(candidate => candidate.name === module.name) === moduleIndex
  );
  const geometryDefines = getPBRGeometryDefines(options.geometry);
  const hasSkin = Boolean(options.defines?.['HAS_SKIN'] ?? geometryDefines['HAS_SKIN']);
  if (hasSkin && !modules.some(module => module.name === skin.name)) {
    modules.push(skin);
  }

  const model = new Model(device, {
    source: PBR_MODEL_WGSL_SHADER,
    vs: PBR_VERTEX_SHADER,
    fs: PBR_FRAGMENT_SHADER,
    ...modelOptions,
    modules,
    defines: {
      USE_SCENE_COLOR_MANAGEMENT: true,
      PBR_RECEIVE_SHADOWS: receiveShadows,
      PBR_RECEIVE_CONTACT_SHADOWS: receiveContactShadows,
      PBR_RECEIVE_AMBIENT_OCCLUSION: receiveAmbientOcclusion,
      ...geometryDefines,
      ...getPBRTextureDefines(options.material.getResourceBindings()),
      ...options.defines
    }
  });
  if (!options.shaderInputs) {
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    model.shaderInputs.setProps({
      pbrProjection: {
        modelMatrix: identity.slice(),
        modelViewProjectionMatrix: identity.slice(),
        normalMatrix: identity.slice(),
        camera: [0, 0, 1]
      },
      pbrScene: {toneMapMode: 0, outputEncoding: 0}
    });
  }
  return model;
}

/** Creates a depth-only caster sharing PBR geometry, transforms, skinning and alpha cutouts.
 * Supply the zero-to-one light projection returned by ShadowMapRenderer on both backends.
 * The material is borrowed; caster and visible models may share it.
 */
export function createPBRShadowModel(device: Device, options: CreatePBRModelOptions): Model {
  return createPBRModel(device, {
    colorAttachmentFormats: [],
    depthStencilAttachmentFormat: 'depth32float',
    ...options,
    receiveShadows: false,
    receiveContactShadows: false,
    receiveAmbientOcclusion: false,
    defines: {...options.defines, PBR_SHADOW_PASS: true},
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', ...options.parameters}
  });
}

/** Creates a camera-space depth/normal model with the shared PBR vertex and alpha-cutout paths. */
export function createPBRSurfaceModel(device: Device, options: CreatePBRModelOptions): Model {
  return createPBRModel(device, {
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth32float',
    ...options,
    receiveShadows: false,
    receiveContactShadows: false,
    receiveAmbientOcclusion: false,
    defines: {...options.defines, PBR_SHADOW_PASS: false, PBR_SURFACE_PASS: true},
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', ...options.parameters}
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
    HAS_ANISOTROPYMAP: Boolean(bindings['pbr_anisotropySampler']),
    HAS_BUMPMAP: Boolean(bindings['pbr_bumpSampler']),
    HAS_DIFFUSETRANSMISSIONMAP: Boolean(bindings['pbr_diffuseTransmissionSampler']),
    HAS_DIFFUSETRANSMISSIONCOLORMAP: Boolean(bindings['pbr_diffuseTransmissionColorSampler']),
    HAS_MULTISCATTERCOLORMAP: Boolean(bindings['pbr_multiscatterColorSampler'])
  };
}
