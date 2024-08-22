// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, RenderPipelineParameters, log} from '@luma.gl/core';
import {pbrMaterial, ShaderModule} from '@luma.gl/shadertools';
import {Geometry, Model, ModelNode, ModelProps} from '@luma.gl/engine';
import {ParsePBRMaterialOptions, parsePBRMaterial} from '../pbr/parse-pbr-material';

const SHADER = /* WGSL */ `
layout(0) positions: vec4; // in vec4 POSITION;

  #ifdef HAS_NORMALS
    in vec4 normals; // in vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

@vertex
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

    pbr_setPositionNormalTangentUV(positions, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = u_MVPMatrix * positions;
  }

@fragment
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
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

    pbr_setPositionNormalTangentUV(positions, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = pbrProjection.modelViewProjectionMatrix * positions;
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
  material: any;
  materialOptions: ParsePBRMaterialOptions;
  modelOptions?: Partial<ModelProps>;
};

export function createGLTFModel(device: Device, options: CreateGLTFModelOptions): ModelNode {
  const {id, geometry, material, vertexCount, materialOptions, modelOptions} = options;

  const parsedMaterial = parsePBRMaterial(device, material, geometry.attributes, materialOptions);
  log.info(4, 'createGLTFModel defines: ', parsedMaterial.defines)();

  // Calculate managedResources
  // TODO: Implement resource management logic that will
  // not deallocate resources/textures/buffers that are shared
  const managedResources = [];
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
    modules: [pbrMaterial as unknown as ShaderModule],
    ...modelOptions,

    defines: {...parsedMaterial.defines, ...modelOptions.defines},
    parameters: {...parameters, ...parsedMaterial.parameters, ...modelOptions.parameters}
  };

  const model = new Model(device, modelProps);

  const {camera, ...pbrMaterialProps} = {
    ...parsedMaterial.uniforms,
    ...modelOptions.uniforms,
    ...parsedMaterial.bindings,
    ...modelOptions.bindings
  };

  model.shaderInputs.setProps({pbrMaterial: pbrMaterialProps, pbrProjection: {camera}});
  return new ModelNode({managedResources, model});
}
