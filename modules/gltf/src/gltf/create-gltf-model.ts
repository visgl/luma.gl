// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  Sampler,
  Texture,
  TextureView,
  type Binding,
  type RenderPipelineParameters,
  log
} from '@luma.gl/core';
import {DynamicTexture} from '@luma.gl/engine';
import {pbrMaterial, skin} from '@luma.gl/shadertools';
import {
  Geometry,
  Material,
  MaterialFactory,
  Model,
  ModelNode,
  type ModelProps
} from '@luma.gl/engine';
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
#ifdef HAS_UV_1
  @location(4) texCoords1: vec2f,
#endif
#ifdef HAS_SKIN
  @location(5) JOINTS_0: vec4u,
  @location(6) WEIGHTS_0: vec4f,
#endif
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
#ifdef HAS_TANGENTS
  @location(4) pbrTangent: vec4f,
#endif
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  var position = vec4f(inputs.positions, 1.0);
  var normal = vec3f(0.0, 0.0, 1.0);
  var tangent = vec4f(1.0, 0.0, 0.0, 1.0);
  var uv0 = vec2f(0.0, 0.0);
  var uv1 = vec2f(0.0, 0.0);

#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV
  uv0 = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  uv1 = inputs.texCoords1;
#endif
#ifdef HAS_TANGENTS
  tangent = inputs.TANGENT;
#endif
#ifdef HAS_SKIN
  let skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

  let worldPosition = pbrProjection.modelMatrix * position;

#ifdef HAS_NORMALS
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#endif
#ifdef HAS_TANGENTS
  let worldTangent = normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  outputs.pbrTangent = vec4f(worldTangent, tangent.w);
#endif

  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV0 = uv0;
  outputs.pbrUV1 = uv1;
  outputs.pbrNormal = normal;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
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

  #ifdef HAS_UV_1
    in vec2 texCoords1;
  #endif

  #ifdef HAS_SKIN
    in uvec4 JOINTS_0;
    in vec4 WEIGHTS_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);
    vec2 _TEXCOORD_1 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    #ifdef HAS_UV_1
      _TEXCOORD_1 = texCoords1;
    #endif

    vec4 pos = positions;

    #ifdef HAS_SKIN
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      pos = skinMat * pos;
      _NORMAL = skinMat * _NORMAL;
      _TANGENT = vec4((skinMat * vec4(_TANGENT.xyz, 0.)).xyz, _TANGENT.w);
    #endif

    pbr_setPositionNormalTangentUV(pos, _NORMAL, _TANGENT, _TEXCOORD_0, _TEXCOORD_1);
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

/** Options used to instantiate a `ModelNode` for one glTF primitive. */
export type CreateGLTFModelOptions = {
  /** Optional id assigned to the generated model. */
  id?: string;
  /** Vertex count override for non-indexed primitives. */
  vertexCount?: number;
  /** Geometry converted from the glTF primitive. */
  geometry: Geometry;
  /** Parsed PBR material state for the primitive. */
  parsedPPBRMaterial: ParsedPBRMaterial;
  /** Pre-created material aligned with the source glTF material entry, when available. */
  material?: Material | null;
  /** Additional model props merged into the generated model. */
  modelOptions?: Partial<ModelProps>;
};

export type CreateGLTFMaterialOptions = {
  id?: string;
  parsedPPBRMaterial: ParsedPBRMaterial;
  materialFactory?: MaterialFactory;
};

export function createGLTFMaterial(device: Device, options: CreateGLTFMaterialOptions): Material {
  const materialFactory =
    options.materialFactory || new MaterialFactory(device, {modules: [pbrMaterial]});

  const pbrMaterialProps = {...options.parsedPPBRMaterial.uniforms};
  delete pbrMaterialProps.camera;
  const materialBindings = Object.fromEntries(
    Object.entries({
      ...pbrMaterialProps,
      ...options.parsedPPBRMaterial.bindings
    }).filter(
      ([name, value]) => materialFactory.ownsBinding(name) && isMaterialBindingResource(value)
    )
  ) as Record<string, Binding | DynamicTexture>;

  const material = materialFactory.createMaterial({
    id: options.id,
    bindings: materialBindings
  });
  material.setProps({pbrMaterial: pbrMaterialProps});

  return material;
}

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

  const material =
    options.material ||
    createGLTFMaterial(device, {
      id: id ? `${id}-material` : undefined,
      parsedPPBRMaterial
    });
  modelProps.material = material;

  const model = new Model(device, modelProps);

  const sceneShaderInputValues = {
    ...parsedPPBRMaterial.uniforms,
    ...modelOptions.uniforms,
    ...parsedPPBRMaterial.bindings,
    ...modelOptions.bindings
  };
  const sceneShaderInputProps = getSceneShaderInputProps(
    model.shaderInputs.getModules(),
    material,
    sceneShaderInputValues
  );
  model.shaderInputs.setProps(sceneShaderInputProps);
  return new ModelNode({managedResources, model});
}

function isMaterialBindingResource(value: unknown): boolean {
  return (
    value instanceof Buffer ||
    value instanceof DynamicTexture ||
    value instanceof Sampler ||
    value instanceof Texture ||
    value instanceof TextureView
  );
}

function getSceneShaderInputProps(
  modules: Array<{
    name: string;
    uniformTypes?: Readonly<Record<string, unknown>>;
    bindingLayout?: ReadonlyArray<{name: string}>;
  }>,
  material: Material,
  shaderInputValues: Record<string, unknown>
): Record<string, Record<string, unknown>> {
  const propertyToModuleNameMap = new Map<string, string>();
  for (const module of modules) {
    for (const uniformName of Object.keys(module.uniformTypes || {})) {
      propertyToModuleNameMap.set(uniformName, module.name);
    }
    for (const binding of module.bindingLayout || []) {
      propertyToModuleNameMap.set(binding.name, module.name);
    }
  }

  const sceneShaderInputProps: Record<string, Record<string, unknown>> = {};
  for (const [propertyName, value] of Object.entries(shaderInputValues)) {
    if (value === undefined) {
      continue;
    }

    const moduleName = propertyToModuleNameMap.get(propertyName);
    if (!moduleName || material.ownsModule(moduleName)) {
      continue;
    }

    sceneShaderInputProps[moduleName] ||= {};
    sceneShaderInputProps[moduleName][propertyName] = value;
  }

  return sceneShaderInputProps;
}
