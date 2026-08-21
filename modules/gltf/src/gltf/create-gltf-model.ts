// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type Binding,
  Buffer,
  type BufferLayout,
  Device,
  log,
  type RenderPipelineParameters,
  Sampler,
  Texture,
  TextureView
} from '@luma.gl/core';
import {
  DynamicTexture,
  Geometry,
  Material,
  MaterialFactory,
  Model,
  ModelNode,
  type ModelProps,
  type MorphTargetAttributes,
  type ScenegraphBounds
} from '@luma.gl/engine';
import {gpuAnimation, pbrMaterial, skin} from '@luma.gl/shadertools';
import type {NumericArray} from '@math.gl/core';
import {type ParsedPBRMaterial} from '../pbr/pbr-material';
import type {GLTFCrowdGPUAnimationLayout} from './gltf-gpu-animation';

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
#ifdef HAS_SKIN_1
  @location(7) JOINTS_1: vec4u,
  @location(8) WEIGHTS_1: vec4f,
#endif
#ifdef HAS_GLTF_INSTANCING
  @location(9) instanceModelMatrixCol0: vec4f,
  @location(10) instanceModelMatrixCol1: vec4f,
  @location(11) instanceModelMatrixCol2: vec4f,
  @location(12) instanceModelMatrixCol3: vec4f,
  @builtin(instance_index) instanceIndex: u32,
#endif
#ifdef HAS_GPU_CROWD_ANIMATION
  @location(13) instanceAnimationFrames: vec4f,
  @location(14) instanceAnimationBlend: vec4f,
#endif
#ifdef HAS_INSTANCED_MORPH
  @builtin(vertex_index) vertexIndex: u32,
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

#ifdef HAS_GLTF_INSTANCING
fn getGLTFInstanceNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}
#endif

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

#ifdef HAS_INSTANCED_MORPH
  var animationFrames = vec4f(0.0);
  var animationBlend = vec4f(0.0);
#ifdef HAS_GPU_CROWD_ANIMATION
  animationFrames = inputs.instanceAnimationFrames;
  animationBlend = inputs.instanceAnimationBlend;
#endif
  position = vec4f(
    position.xyz + getGPUCrowdMorphDelta(
      inputs.instanceIndex,
      inputs.vertexIndex,
      0u,
      u32(CROWD_MORPH_VERTEX_COUNT),
      u32(CROWD_MORPH_TARGET_COUNT),
      u32(CROWD_ANIMATION_JOINT_COUNT),
      animationFrames,
      animationBlend,
      u32(CROWD_ANIMATION_FRAME_STRIDE)
    ),
    1.0
  );
#ifdef HAS_NORMALS
  normal = normalize(normal + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    1u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  ));
#endif
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize(tangent.xyz + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    2u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  )), tangent.w);
#endif
#endif

#ifdef HAS_SKIN
#ifdef HAS_GPU_CROWD_ANIMATION
  var skinMatrix = getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  var skinMatrix = getInstancedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  var skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
#endif
#endif
#ifdef HAS_SKIN_1
#ifdef HAS_GPU_CROWD_ANIMATION
  skinMatrix += getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_1,
    inputs.JOINTS_1,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  skinMatrix += getInstancedSkinMatrix(
    inputs.WEIGHTS_1,
    inputs.JOINTS_1,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  skinMatrix += getSkinMatrix(inputs.WEIGHTS_1, inputs.JOINTS_1);
#endif
#endif
#endif
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_GLTF_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
#ifdef HAS_GPU_CROWD_ANIMATION
  instanceMatrix *= sampleGPUAnimationMatrix(
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    0u,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#endif
  position = instanceMatrix * position;
  normal = normalize(getGLTFInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  )) * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
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

  #ifdef HAS_SKIN_1
    in uvec4 JOINTS_1;
    in vec4 WEIGHTS_1;
  #endif

  #ifdef HAS_GLTF_INSTANCING
    in vec4 instanceModelMatrixCol0;
    in vec4 instanceModelMatrixCol1;
    in vec4 instanceModelMatrixCol2;
    in vec4 instanceModelMatrixCol3;
  #endif

  #ifdef HAS_GPU_CROWD_ANIMATION
    in vec4 instanceAnimationFrames;
    in vec4 instanceAnimationBlend;
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

    #ifdef HAS_INSTANCED_MORPH
      vec4 animationFrames = vec4(0.0);
      vec4 animationBlend = vec4(0.0);
      #ifdef HAS_GPU_CROWD_ANIMATION
        animationFrames = instanceAnimationFrames;
        animationBlend = instanceAnimationBlend;
      #endif
      pos.xyz += getGPUCrowdMorphDelta(
        uint(gl_InstanceID),
        uint(gl_VertexID),
        0u,
        uint(CROWD_MORPH_TARGET_COUNT),
        uint(CROWD_ANIMATION_JOINT_COUNT),
        animationFrames,
        animationBlend
      );
      #ifdef HAS_NORMALS
        _NORMAL.xyz = normalize(_NORMAL.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          1u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
      #ifdef HAS_TANGENTS
        _TANGENT.xyz = normalize(_TANGENT.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          2u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
    #endif

    #ifdef HAS_SKIN
      #ifdef HAS_GPU_CROWD_ANIMATION
        mat4 skinMat = getGPUAnimatedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          instanceAnimationFrames,
          instanceAnimationBlend
        );
      #else
      #ifdef HAS_INSTANCED_SKIN
        mat4 skinMat = getInstancedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          uint(gl_InstanceID),
          uint(CROWD_JOINTS_PER_INSTANCE)
        );
      #else
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      #endif
      #endif
      #ifdef HAS_SKIN_1
        #ifdef HAS_GPU_CROWD_ANIMATION
          skinMat += getGPUAnimatedSkinMatrix(
            WEIGHTS_1,
            JOINTS_1,
            instanceAnimationFrames,
            instanceAnimationBlend
          );
        #else
        #ifdef HAS_INSTANCED_SKIN
          skinMat += getInstancedSkinMatrix(
            WEIGHTS_1,
            JOINTS_1,
            uint(gl_InstanceID),
            uint(CROWD_JOINTS_PER_INSTANCE)
          );
        #else
          skinMat += getSkinMatrix(WEIGHTS_1, JOINTS_1);
        #endif
        #endif
      #endif
      pos = skinMat * pos;
      _NORMAL = skinMat * _NORMAL;
      _TANGENT = vec4((skinMat * vec4(_TANGENT.xyz, 0.)).xyz, _TANGENT.w);
    #endif

    #ifdef HAS_GLTF_INSTANCING
      mat4 instanceMatrix = mat4(
        instanceModelMatrixCol0,
        instanceModelMatrixCol1,
        instanceModelMatrixCol2,
        instanceModelMatrixCol3
      );
      #ifdef HAS_GPU_CROWD_ANIMATION
        instanceMatrix *= sampleGPUAnimationMatrix(
          instanceAnimationFrames,
          instanceAnimationBlend,
          0
        );
      #endif
      pos = instanceMatrix * pos;
      _NORMAL = vec4(normalize(transpose(inverse(mat3(instanceMatrix))) * _NORMAL.xyz), 0.0);
      _TANGENT = vec4(normalize(mat3(instanceMatrix) * _TANGENT.xyz), _TANGENT.w);
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
  /** Source primitive bounds before node and optional instance transforms. */
  bounds?: ScenegraphBounds;
  /** Source-authored local transforms for `EXT_mesh_gpu_instancing`. */
  instanceMatrices?: readonly NumericArray[];
  /** Primitive joint indices exceed the portable uniform skin palette size. */
  usesLargeSkinPalette?: boolean;
  /** Immutable source POSITION/NORMAL/TANGENT deltas for GPU crowd morph deformation. */
  morphTargets?: readonly MorphTargetAttributes[];
};

export type CreateGLTFMaterialOptions = {
  id?: string;
  parsedPPBRMaterial: ParsedPBRMaterial;
  materialFactory?: MaterialFactory;
};

/** Internal shared primitive configuration supplied by the glTF crowd adapter. */
export type GLTFCrowdModelConfiguration = {
  capacity: number;
  jointsPerInstance: number;
  gpuAnimation?: GLTFCrowdGPUAnimationLayout;
};

/** Internal instance resources owned by exactly one canonical glTF primitive model. */
export type GLTFCrowdModelResources = {
  transformBuffers: readonly Buffer[];
  transformColumns: readonly Float32Array[];
  skinJointMatrices?: Buffer | Texture;
  jointMatrices?: Float32Array;
  jointsPerInstance: number;
  morphTargetCount: number;
  morphTargetData?: Buffer | Texture;
  morphWeights?: Float32Array;
  morphWeightData?: Buffer | Texture;
  animationFrames?: Buffer | Texture;
  animationFrameValues?: Float32Array;
  animationFrameStride?: number;
  animationJointCount: number;
  animationParameters?: Float32Array;
  animationParameterBuffer?: Buffer;
  animationBlend?: Float32Array;
  animationBlendBuffer?: Buffer;
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
  const {
    id,
    geometry,
    parsedPPBRMaterial,
    vertexCount,
    modelOptions = {},
    instanceMatrices,
    usesLargeSkinPalette = false,
    morphTargets = []
  } = options;
  const crowd = modelOptions.userData?.['gltfAnimatedCrowd'] as
    | GLTFCrowdModelConfiguration
    | undefined;
  if (crowd && instanceMatrices) {
    throw new Error('Nested glTF crowd instancing is unsupported');
  }

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

  const instanceAttributes: Record<string, Buffer> = {};
  const instanceBufferLayout: BufferLayout[] = [];
  const transformBuffers: Buffer[] = [];
  const transformColumns: Float32Array[] = [];
  const hasGPUAnimation = Boolean(crowd?.gpuAnimation);
  if (instanceMatrices || crowd) {
    for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
      const values = new Float32Array((crowd?.capacity || instanceMatrices?.length || 0) * 4);
      instanceMatrices?.forEach((matrix, instanceIndex) => {
        for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
          values[instanceIndex * 4 + rowIndex] = matrix[columnIndex * 4 + rowIndex];
        }
      });
      const attributeName = `instanceModelMatrixCol${columnIndex}`;
      const buffer = device.createBuffer({
        id: `${id || 'gltf'}-${attributeName}`,
        data: values,
        usage: Buffer.VERTEX | Buffer.COPY_DST
      });
      instanceAttributes[attributeName] = buffer;
      instanceBufferLayout.push({name: attributeName, format: 'float32x4', stepMode: 'instance'});
      managedResources.push(buffer);
      transformBuffers.push(buffer);
      transformColumns.push(values);
    }
  }

  let animationParameters: Float32Array | undefined;
  let animationParameterBuffer: Buffer | undefined;
  let animationBlend: Float32Array | undefined;
  let animationBlendBuffer: Buffer | undefined;
  if (crowd && hasGPUAnimation) {
    animationParameters = new Float32Array(crowd.capacity * 4);
    animationBlend = new Float32Array(crowd.capacity * 4);
    for (const [attributeName, values] of [
      ['instanceAnimationFrames', animationParameters],
      ['instanceAnimationBlend', animationBlend]
    ] as const) {
      const buffer = device.createBuffer({
        id: `${id || 'gltf'}-${attributeName}`,
        data: values,
        usage: Buffer.VERTEX | Buffer.COPY_DST
      });
      instanceAttributes[attributeName] = buffer;
      instanceBufferLayout.push({name: attributeName, format: 'float32x4', stepMode: 'instance'});
      managedResources.push(buffer);
      if (attributeName === 'instanceAnimationFrames') {
        animationParameterBuffer = buffer;
      } else {
        animationBlendBuffer = buffer;
      }
    }
  }

  const hasSkin = Boolean(parsedPPBRMaterial.defines['HAS_SKIN']);
  const hasLargeSkinPalette = Boolean(usesLargeSkinPalette && hasSkin && !crowd);
  const hasInstancedSkin = Boolean(crowd && hasSkin && !hasGPUAnimation);
  let skinJointMatrices: Buffer | Texture | undefined;
  let jointMatrices: Float32Array | undefined;
  if (crowd && hasInstancedSkin) {
    jointMatrices = new Float32Array(crowd.capacity * crowd.jointsPerInstance * 16);
    skinJointMatrices =
      device.type === 'webgpu'
        ? device.createBuffer({
            id: `${id || 'gltf'}-crowd-joint-matrices`,
            byteLength: jointMatrices.byteLength,
            usage: Buffer.STORAGE | Buffer.COPY_DST
          })
        : device.createTexture({
            id: `${id || 'gltf'}-crowd-joint-matrices`,
            format: 'rgba32float',
            width: crowd.jointsPerInstance * 4,
            height: crowd.capacity,
            usage: Texture.SAMPLE | Texture.COPY_DST,
            sampler: {minFilter: 'nearest', magFilter: 'nearest', mipmapFilter: 'nearest'}
          });
    managedResources.push(skinJointMatrices);
  }

  const morphTargetCount = crowd ? morphTargets.length : 0;
  const morphVertexCount = Math.floor((geometry.attributes['POSITION']?.value.length || 0) / 3);
  let morphTargetData: Buffer | Texture | undefined;
  let morphWeights: Float32Array | undefined;
  let morphWeightData: Buffer | Texture | undefined;
  if (crowd && morphTargetCount > 0 && morphVertexCount > 0) {
    const targetValues = new Float32Array(morphTargetCount * 3 * morphVertexCount * 4);
    for (const [targetIndex, target] of morphTargets.entries()) {
      for (const [attributeIndex, attributeName] of ['POSITION', 'NORMAL', 'TANGENT'].entries()) {
        const values = target[attributeName as keyof MorphTargetAttributes];
        if (!values) {
          continue;
        }
        const componentCount =
          attributeName === 'TANGENT' && values.length === morphVertexCount * 4 ? 4 : 3;
        for (let vertexIndex = 0; vertexIndex < morphVertexCount; vertexIndex++) {
          const destinationOffset =
            ((targetIndex * 3 + attributeIndex) * morphVertexCount + vertexIndex) * 4;
          const sourceOffset = vertexIndex * componentCount;
          targetValues[destinationOffset] = values[sourceOffset] || 0;
          targetValues[destinationOffset + 1] = values[sourceOffset + 1] || 0;
          targetValues[destinationOffset + 2] = values[sourceOffset + 2] || 0;
        }
      }
    }

    morphTargetData = createGPUAnimationResource(
      device,
      `${id || 'gltf'}-crowd-morph-targets`,
      targetValues,
      morphVertexCount,
      morphTargetCount * 3
    );
    managedResources.push(morphTargetData);

    if (!hasGPUAnimation) {
      const packedTargetCount = Math.ceil(morphTargetCount / 4);
      morphWeights = new Float32Array(crowd.capacity * packedTargetCount * 4);
      morphWeightData = createGPUAnimationResource(
        device,
        `${id || 'gltf'}-crowd-morph-weights`,
        morphWeights,
        packedTargetCount,
        crowd.capacity
      );
      managedResources.push(morphWeightData);
    }
  }

  const animationJointCount = hasSkin && crowd ? crowd.jointsPerInstance : 0;
  const animationFrameStride = 4 + animationJointCount * 4 + morphTargetCount;
  let animationFrames: Buffer | Texture | undefined;
  let animationFrameValues: Float32Array | undefined;
  if (crowd?.gpuAnimation) {
    animationFrameValues = new Float32Array(
      crowd.gpuAnimation.frameCount * animationFrameStride * 4
    );
    animationFrames = createGPUAnimationResource(
      device,
      `${id || 'gltf'}-crowd-animation-frames`,
      animationFrameValues,
      animationFrameStride,
      crowd.gpuAnimation.frameCount
    );
    managedResources.push(animationFrames);
  }

  let source = SHADER;
  for (const [name, value] of [
    ['CROWD_JOINTS_PER_INSTANCE', crowd?.jointsPerInstance || 0],
    ['CROWD_MORPH_VERTEX_COUNT', morphVertexCount],
    ['CROWD_MORPH_TARGET_COUNT', morphTargetCount],
    ['CROWD_ANIMATION_JOINT_COUNT', animationJointCount],
    ['CROWD_ANIMATION_FRAME_STRIDE', animationFrameStride]
  ] as const) {
    source = source.replaceAll(`u32(${name})`, `u32(${value})`);
  }

  const modelProps: ModelProps = {
    id,
    source,
    vs,
    fs,
    geometry,
    topology: geometry.topology,
    vertexCount,
    modules: [pbrMaterial, skin, ...(crowd ? [gpuAnimation] : [])],
    ...modelOptions,

    ...(instanceMatrices || crowd
      ? {
          attributes: {...modelOptions.attributes, ...instanceAttributes},
          bufferLayout: [...(modelOptions.bufferLayout || []), ...instanceBufferLayout],
          instanceCount: instanceMatrices?.length || 0,
          isInstanced: true
        }
      : {}),
    defines: {
      ...parsedPPBRMaterial.defines,
      ...modelOptions.defines,
      ...(instanceMatrices || crowd ? {HAS_GLTF_INSTANCING: true} : {}),
      ...(hasInstancedSkin
        ? {HAS_INSTANCED_SKIN: true, CROWD_JOINTS_PER_INSTANCE: crowd!.jointsPerInstance}
        : {}),
      ...(hasLargeSkinPalette ? {HAS_LARGE_SKIN: true} : {}),
      ...(hasGPUAnimation
        ? {HAS_GPU_CROWD_ANIMATION: true, CROWD_ANIMATION_FRAME_STRIDE: animationFrameStride}
        : {}),
      ...(morphTargetData
        ? {HAS_INSTANCED_MORPH: true, CROWD_MORPH_TARGET_COUNT: morphTargetCount}
        : {}),
      ...(crowd ? {CROWD_ANIMATION_JOINT_COUNT: animationJointCount} : {})
    },
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
  if (skinJointMatrices) {
    model.shaderInputs.setProps({skin: {jointMatrices: [], skinJointMatrices}});
  }
  if (animationFrames || morphTargetData || morphWeightData) {
    model.shaderInputs.setProps({
      gpuAnimation: {
        ...(animationFrames ? {gpuAnimationFrames: animationFrames} : {}),
        ...(morphTargetData ? {gpuMorphTargets: morphTargetData} : {}),
        ...(morphWeightData ? {gpuMorphWeights: morphWeightData} : {})
      }
    });
  }
  const modelNode = new ModelNode({
    managedResources,
    model,
    bounds: options.bounds,
    instanceMatrices
  });
  modelNode.userData['gltfLargeSkinPalette'] = hasLargeSkinPalette;
  if (crowd) {
    modelNode.userData['gltfAnimatedCrowd'] = {
      transformBuffers,
      transformColumns,
      skinJointMatrices,
      jointMatrices,
      jointsPerInstance: crowd.jointsPerInstance,
      morphTargetCount,
      morphTargetData,
      morphWeights,
      morphWeightData,
      animationFrames,
      animationFrameValues,
      animationFrameStride,
      animationJointCount,
      animationParameters,
      animationParameterBuffer,
      animationBlend,
      animationBlendBuffer
    } satisfies GLTFCrowdModelResources;
  }
  return modelNode;
}

function createGPUAnimationResource(
  device: Device,
  id: string,
  values: Float32Array,
  width: number,
  height: number
): Buffer | Texture {
  if (device.type === 'webgpu') {
    return device.createBuffer({
      id,
      data: values,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  const texture = device.createTexture({
    id,
    format: 'rgba32float',
    width,
    height,
    usage: Texture.SAMPLE | Texture.COPY_DST,
    sampler: {minFilter: 'nearest', magFilter: 'nearest', mipmapFilter: 'nearest'}
  });
  texture.writeData(values, {width, height});
  return texture;
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
