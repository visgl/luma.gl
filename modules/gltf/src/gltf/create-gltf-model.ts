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

  _attr vec4 positions;
  // _attr vec4 POSITION;

  #ifdef HAS_NORMALS
    _attr vec4 normals;
    // _attr vec4 NORMAL;
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
      _NORMAL = normals;
      // _NORMAL = NORMAL;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = TEXCOORD_0;
    #endif

    pbr_setPositionNormalTangentUV(positions, _NORMAL, _TANGENT, _TEXCOORD_0);
     gl_Position = u_MVPMatrix * positions;
    // gl_Position = positions;
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
  topology?: PrimitiveTopology;
  vertexCount?: number;
  attributes?: Record<string, any>;
  indices?: TypedArray;
  material: any;
  materialOptions: ParsePBRMaterialOptions;
  modelOptions?: Record<string, any>;
};

// function normalizeGeometryAttributes(attributes) {
// 	const positionAttribute = attributes.positions || attributes.POSITION;
// 	log.assert(positionAttribute, 'no "postions" or "POSITION" attribute in mesh');
// 
// 	// const vertexCount = positionAttribute.value.length / positionAttribute.size;
// 	const vertexCount = positionAttribute.buffer.byteLength / positionAttribute.BYTES_PER_VERTEX;
// 	let colorAttribute = attributes.COLOR_0 || attributes.colors;
// 	if (!colorAttribute) {
// 		colorAttribute = {size: 3, value: new Float32Array(vertexCount * 3).fill(1)};
// 	}
// 	let normalAttribute = attributes.NORMAL || attributes.normals;
// 	if (!normalAttribute) {
// 		normalAttribute = {size: 3, value: new Float32Array(vertexCount * 3).fill(0)};
// 	}
// 	let texCoordAttribute = attributes.TEXCOORD_0 || attributes.texCoords;
// 	if (!texCoordAttribute) {
// 		texCoordAttribute = {size: 2, value: new Float32Array(vertexCount * 2).fill(0)};
// 	}
// 
// 	return {
// 		positions: positionAttribute,
// 		colors: colorAttribute,
// 		normals: normalAttribute,
// 		texCoords: texCoordAttribute
// 	};
// }


export function createGLTFModel(device: Device, options: CreateGLTFModelOptions): ModelNode {
  const {id, indices, attributes, material, topology, vertexCount, materialOptions, modelOptions} = options;

  const parsedMaterial = parsePBRMaterial(device, material, attributes, materialOptions);

  log.info(4, 'createGLTFModel defines: ', parsedMaterial.defines)();

  // Calculate managedResources
  // TODO: Implement resource management logic that will
  // not deallocate resources/textures/buffers that are shared
  const managedResources = [];
  // managedResources.push(...parsedMaterial.generatedTextures);
  // managedResources.push(...Object.values(attributes).map((attribute) => attribute.buffer));

  // @ts-ignore
  // const bufferLayout = window.bufferLayout;
  // const shaderLayout = {
  //   attributes: [{
  //     name: 'instancePositions', location: 2, stepMode: 'instance' as const, type: 'vec3<f32>' as ShaderAttributeType
  //   }],
  //   bindings: []
  // }
  //

  const cube = new CubeGeometry(); // HACK in for now

  const parameters: RenderPipelineParameters = {
    // Enable depth testing so that the fragment closest to the camera
    // is rendered in front.
    depthWriteEnabled: true,
    depthCompare: 'less',
    depthFormat: 'depth24plus',

    // Backface culling since the cube is solid piece of geometry.
    // Faces pointing away from the camera will be occluded by faces
    // pointing toward the camera.
    cullMode: 'back'
  }

  const modelProps = {
    id,
    topology,
    vertexCount,
    modules: [pbr],
    defines: parsedMaterial.defines,
    // parameters: parsedMaterial.parameters,
    parameters, // TODO use/merge parsedMaterial
    vs: addVersionToShader(device, vs),
    fs: addVersionToShader(device, fs),
    // attributes: {POSITION: attributes.POSITION, NORMAL: attributes.NORMAL},
    // indexBuffer,
    bindings: parsedMaterial.bindings,
    uniforms: parsedMaterial.uniforms,
    ...modelOptions
  }
  const model = new Model(device, {
    ...modelProps,
    geometry: cube,
  });

  const _attributes = {}
  Object.keys(attributes).forEach(attributeName => {
    const {components: size, value} = attributes[attributeName];
    _attributes[attributeName] = {size, value};
  });

  const geometry = new Geometry({
    id: 'test',
    topology,
    indices,
    attributes: _attributes
  });

  const model2 = new Model(device, {
    ...modelProps,
    geometry
    // attributes,
    // bufferLayout: [
    //   {name: 'positions', format: 'float32x3'},
    //   {name: 'normals', format: 'float32x3'},
    //   {name: 'texCoords', format: 'float32x3'}
    // ]
  });

  return new ModelNode({ managedResources, model: model2 });
}

function addVersionToShader(device: Device, source: string): string {
  return device.info.type === 'webgl2' ? `#version 300 es\n${source}` : source;
}
