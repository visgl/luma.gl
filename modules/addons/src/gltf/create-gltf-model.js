import {isWebGL2, ModelNode, log, pbr} from '@luma.gl/core';
import GLTFMaterialParser from './gltf-material-parser';

const vs = `
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
#if (__VERSION__ < 300)
  #define fragmentColor gl_FragColor
#else
  out vec4 fragmentColor;
#endif

  void main(void) {
    fragmentColor = pbr_filterColor(vec4(0));
  }
`;

function addVersionToShader(gl, source) {
  if (isWebGL2(gl)) {
    return `#version 300 es\n${source}`;
  }

  return source;
}

export default function createGLTFModel(gl, options) {
  const {id, drawMode, vertexCount, attributes, modelOptions} = options;
  const materialParser = new GLTFMaterialParser(gl, options);

  log.info(4, 'createGLTFModel defines: ', materialParser.defines)();

  // Calculate managedResources
  // TODO: Implement resource management logic that will
  // not deallocate resources/textures/buffers that are shared
  const managedResources = [];
  managedResources.push(...materialParser.generatedTextures);
  managedResources.push(...Object.values(attributes).map(attribute => attribute.buffer));

  const model = new ModelNode(
    gl,
    Object.assign(
      {
        id,
        drawMode,
        vertexCount,
        modules: [pbr],
        defines: materialParser.defines,
        parameters: materialParser.parameters,
        vs: addVersionToShader(gl, vs),
        fs: addVersionToShader(gl, fs),
        managedResources
      },
      modelOptions
    )
  );

  model.setProps({attributes});
  model.setUniforms(materialParser.uniforms);

  return model;
}
