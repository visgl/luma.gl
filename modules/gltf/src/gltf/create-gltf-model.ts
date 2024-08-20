import {Device, RenderPipelineParameters, log} from '@luma.gl/core';
import {pbrMaterial} from '@luma.gl/shadertools';
import {Geometry, Model, ModelNode, ModelProps} from '@luma.gl/engine';
import {ParsePBRMaterialOptions, parsePBRMaterial} from '../pbr/parse-pbr-material';
import {ShaderModule} from '@luma.gl/shadertools';

// TODO rename attributes to POSITION/NORMAL etc
// See gpu-geometry.ts: getAttributeBuffersFromGeometry()
const vs = `
#pragma vscode_glsllint_stage: vert
#if (__VERSION__ < 300)
  #define _attr attribute
#else
  #define _attr in
#endif

  // _attr vec4 POSITION;
  _attr vec4 positions;

  #ifdef HAS_NORMALS
    // _attr vec4 NORMAL;
    _attr vec4 normals;
  #endif

  #ifdef HAS_TANGENTS
    _attr vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // _attr vec2 TEXCOORD_0;
    _attr vec2 texCoords;
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

const fs = `
#pragma vscode_glsllint_stage: frag
#if (__VERSION__ < 300)
  #define fragmentColor gl_FragColor
#else
  out vec4 fragmentColor;
#endif

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
    geometry,
    topology: geometry.topology,
    vertexCount,
    modules: [pbrMaterial as unknown as ShaderModule],
    vs: addVersionToShader(device, vs),
    fs: addVersionToShader(device, fs),
    // TODO can this be removed? Does deck need it?
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

function addVersionToShader(device: Device, source: string): string {
  return `#version 300 es\n${source}`;
}
