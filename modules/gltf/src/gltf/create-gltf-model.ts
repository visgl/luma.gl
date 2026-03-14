// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type RenderPipelineParameters, log} from '@luma.gl/core';
import {pbrMaterial, skin} from '@luma.gl/shadertools';
import {Geometry, Model, ModelNode, type ModelProps} from '@luma.gl/engine';
import {type ParsedPBRMaterial} from '../pbr/pbr-material';

const SHADER = /* WGSL */ `
struct VertexInputs {
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
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV: vec2f,
  @location(2) pbrNormal: vec3f,
#ifdef HAS_TANGENTS
  @location(3) pbrTangent: vec4f,
#endif
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  var normal = vec3f(0.0, 0.0, 1.0);
  var uv = vec2f(0.0, 0.0);
  let worldPosition = pbrProjection.modelMatrix * vec4f(inputs.positions, 1.0);

#ifdef HAS_NORMALS
  normal = normalize((pbrProjection.normalMatrix * vec4f(inputs.normals, 0.0)).xyz);
#endif
#ifdef HAS_UV
  uv = inputs.texCoords;
#endif
#ifdef HAS_TANGENTS
  let tangent = normalize((pbrProjection.modelMatrix * vec4f(inputs.TANGENT.xyz, 0.0)).xyz);
  outputs.pbrTangent = vec4f(tangent, inputs.TANGENT.w);
#endif

  outputs.position = pbrProjection.modelViewProjectionMatrix * vec4f(inputs.positions, 1.0);
  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV = uv;
  outputs.pbrNormal = normal;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV = inputs.pbrUV;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
  return pbr_filterColor(vec4f(1.0));
}
`;

// TODO rename attributes to POSITION/NORMAL etc
// See gpu-geometry.ts: getAttributeBuffersFromGeometry()
const vs = /* glsl */ `\
#version 300 es

  // in vec4 POSITION;
  in vec4 positions;

  #ifdef HAS_NORMALS
    // in vec4 NORMAL;
    in vec4 normals;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

  #ifdef HAS_SKIN
    in uvec4 JOINTS_0;
    in vec4 WEIGHTS_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    vec4 pos = positions;

    #ifdef HAS_SKIN
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      pos = skinMat * pos;
    #endif

    pbr_setPositionNormalTangentUV(positions, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = pbrProjection.modelViewProjectionMatrix * pos;
  }
`;

const fs = /* glsl */ `\
#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;

export type CreateGLTFModelOptions = {
  id?: string;
  vertexCount?: number;
  geometry: Geometry;
  parsedPPBRMaterial: ParsedPBRMaterial;
  modelOptions?: Partial<ModelProps>;
};

/** Creates a luma.gl Model from GLTF data*/
export function createGLTFModel(device: Device, options: CreateGLTFModelOptions): ModelNode {
  const {id, geometry, parsedPPBRMaterial, vertexCount, modelOptions = {}} = options;

  log.info(4, 'createGLTFModel defines: ', parsedPPBRMaterial.defines)();

  // Calculate managedResources
  // TODO: Implement resource management logic that will
  // not deallocate resources/textures/buffers that are shared
  const managedResources: any[] = [];
  // managedResources.push(...parsedMaterial.generatedTextures);
  // managedResources.push(...Object.values(attributes).map((attribute) => attribute.buffer));

  const parameters: RenderPipelineParameters = {
    depthWriteEnabled: true,
    depthCompare: 'less',
    depthFormat: 'depth24plus',
    cullMode: 'back'
  };

  const modelProps: ModelProps = {
    id,
    source: SHADER,
    vs,
    fs,
    geometry,
    topology: geometry.topology,
    vertexCount,
    modules: [pbrMaterial, skin],
    ...modelOptions,

    defines: {...parsedPPBRMaterial.defines, ...modelOptions.defines},
    parameters: {...parameters, ...parsedPPBRMaterial.parameters, ...modelOptions.parameters}
  };

  const model = new Model(device, modelProps);

  const {camera, ...pbrMaterialProps} = {
    ...parsedPPBRMaterial.uniforms,
    ...modelOptions.uniforms,
    ...parsedPPBRMaterial.bindings,
    ...modelOptions.bindings
  };

  model.shaderInputs.setProps({pbrMaterial: pbrMaterialProps, pbrProjection: {camera}});
  return new ModelNode({managedResources, model});
}
