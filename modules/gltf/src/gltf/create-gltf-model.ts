import {BufferLayout, CullMode, Device, PrimitiveTopology, RenderPipelineParameters, TypedArray, log} from '@luma.gl/core';
import {pbr} from '@luma.gl/shadertools';
import {CubeGeometry, Geometry, Model, ModelNode} from '@luma.gl/engine';
import {ParsePBRMaterialOptions, parsePBRMaterial} from '../pbr/parse-pbr-material';
// import {parseGLTFMaterial} from './gltf-material-parser';

const vs = `
#pragma vscode_glsllint_stage: vert
#if (__VERSION__ < 300)
  #define _attr attribute
#else
  #define _attr in
#endif

  _attr vec4 POSITION;

  #ifdef HAS_NORMALS
    _attr vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    _attr vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    _attr vec2 TEXCOORD_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = NORMAL;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = TEXCOORD_0;
    #endif

    pbr_setPositionNormalTangentUV(POSITION, _NORMAL, _TANGENT, _TEXCOORD_0);
     gl_Position = u_MVPMatrix * POSITION;
    // gl_Position = POSITION;
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
    // fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
    // fragmentColor = vec4(pos, 1.0);
  }
`;

export type CreateGLTFModelOptions = {
  id?: string;
  vertexCount?: number;
  geometry: Geometry;
  material: any;
  materialOptions: ParsePBRMaterialOptions;
  modelOptions?: Record<string, any>;
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
  }

  const modelProps = {
    id,
    geometry,
    topology: geometry.topology,
    vertexCount,
    modules: [pbr],
    defines: parsedMaterial.defines,
    // parameters: parsedMaterial.parameters,
    parameters, // TODO use/merge parsedMaterial
    vs: addVersionToShader(device, vs),
    fs: addVersionToShader(device, fs),
    bindings: parsedMaterial.bindings,
    uniforms: parsedMaterial.uniforms,
    ...modelOptions
  }

  // debugger;
  const model = new Model(device, modelProps);
  return new ModelNode({ managedResources, model});
}

function addVersionToShader(device: Device, source: string): string {
  return device.info.type === 'webgl2' ? `#version 300 es\n${source}` : source;
}
