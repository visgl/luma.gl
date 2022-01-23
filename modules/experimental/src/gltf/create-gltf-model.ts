import {Device, log} from '@luma.gl/api';
import {pbr} from '@luma.gl/shadertools';
import ModelNode from '../scenegraph/model-node';
import GLTFMaterialParser from './gltf-material-parser';

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
    fragmentColor = pbr_filterColor(vec4(0));
  }
`;

export default function createGLTFModel(device: Device, options: any): ModelNode {
  const {id, drawMode, vertexCount, attributes, modelOptions} = options;
  const materialParser = new GLTFMaterialParser(device, options);

  log.info(4, 'createGLTFModel defines: ', materialParser.defines)();

  // Calculate managedResources
  // TODO: Implement resource management logic that will
  // not deallocate resources/textures/buffers that are shared
  const managedResources = [];
  managedResources.push(...materialParser.generatedTextures);
  // @ts-expect-error
  managedResources.push(...Object.values(attributes).map((attribute) => attribute.buffer));

  const model = new ModelNode(
    device,
    {
      id,
      drawMode,
      vertexCount,
      modules: [pbr],
      defines: materialParser.defines,
      parameters: materialParser.parameters,
      vs: addVersionToShader(device, vs),
      fs: addVersionToShader(device, fs),
      managedResources,
      ...modelOptions
    }
  );

  model.setProps({attributes});
  model.setUniforms(materialParser.uniforms);

  return model;
}

function addVersionToShader(device: Device, source: string): string {
  return device.info.type === 'webgl2' ? `#version 300 es\n${source}` : source;
}
