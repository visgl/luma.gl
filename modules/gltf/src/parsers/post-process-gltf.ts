// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';

import type {
  GLTF,
  GLTFAccessor,
  GLTFAsset,
  GLTFBufferView,
  GLTFCamera,
  GLTFImage,
  GLTFMaterial,
  GLTFMesh,
  GLTFNode,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture
} from '../types/gltf-json-schema';

import type {
  GLTFPostprocessed,
  Asset,
  GLTFAccessorPostprocessed,
  GLTFBufferPostprocessed,
  GLTFBufferViewPostprocessed,
  GLTFCameraPostprocessed,
  GLTFImagePostprocessed,
  GLTFMaterialPostprocessed,
  GLTFMeshPostprocessed,
  GLTFNodePostprocessed,
  GLTFSamplerPostprocessed,
  GLTFScenePostprocessed,
  GLTFSkinPostprocessed,
  GLTFTexturePostprocessed,
  GLTFMeshPrimitivePostprocessed
} from '../types/gltf-postprocessed-schema';

import {assert, type BigTypedArrayConstructor} from '@luma.gl/core';
import {
  getAccessorArrayTypeAndLength,
  readAccessorValues,
  copyToArrayBuffer
} from './gltf-accessor-utils';
import type {GLTFTypedArray} from '../types/gltf-types';

// Resolve indexed references, materialize accessor values, and attach caller-supplied images.

// ENUM LOOKUP

const COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const BYTES: Record<number, number> = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5124: 4, // INT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
  5130: 8, // DOUBLE
  5131: 2, // HALF_FLOAT
  5134: 8, // INT64
  5135: 8 // UNSIGNED_INT64
};

const GL_SAMPLER = {
  // Sampler parameters
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,

  // Sampler default values
  REPEAT: 0x2901,
  LINEAR: 0x2601,
  NEAREST_MIPMAP_LINEAR: 0x2702
};

const SAMPLER_PARAMETER_GLTF_TO_GL = {
  magFilter: GL_SAMPLER.TEXTURE_MAG_FILTER,
  minFilter: GL_SAMPLER.TEXTURE_MIN_FILTER,
  wrapS: GL_SAMPLER.TEXTURE_WRAP_S,
  wrapT: GL_SAMPLER.TEXTURE_WRAP_T
};

// When undefined, a sampler with repeat wrapping and auto filtering should be used.
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#texture
const DEFAULT_SAMPLER_PARAMETERS = {
  [GL_SAMPLER.TEXTURE_MAG_FILTER]: GL_SAMPLER.LINEAR,
  [GL_SAMPLER.TEXTURE_MIN_FILTER]: GL_SAMPLER.NEAREST_MIPMAP_LINEAR,
  [GL_SAMPLER.TEXTURE_WRAP_S]: GL_SAMPLER.REPEAT,
  [GL_SAMPLER.TEXTURE_WRAP_T]: GL_SAMPLER.REPEAT
};

function makeDefaultSampler(): GLTFSamplerPostprocessed {
  return {
    id: 'default-sampler',
    parameters: DEFAULT_SAMPLER_PARAMETERS
  };
}

function getBytesFromComponentType(componentType: number) {
  return BYTES[componentType];
}

function getSizeFromAccessorType(type: string) {
  return COMPONENTS[type];
}

class GLTFPostProcessor {
  /** Resolved document under construction. */
  json!: GLTFPostprocessed;
  buffers: {
    arrayBuffer: ArrayBuffer;
    byteOffset: number;
    byteLength: number;
  }[] = [];
  images: any[] = [];

  postProcess(gltf: GLTFWithBuffers) {
    const {json, buffers = [], images = []} = gltf;
    assert(json);

    const bufferCount = Math.max(json.buffers?.length || 0, buffers.length);
    this.buffers = Array.from({length: bufferCount}, (_, index) => ({
      ...(json.buffers?.[index] || {}),
      ...(buffers[index] || {})
    }));
    this.images = images;

    this.json = this._resolveTree(gltf.json);
    this.json.buffers = this.buffers;

    return this.json;
  }

  // Convert indexed glTF structure into tree structure
  // cross-link index resolution, enum lookup, convenience calculations
  // eslint-disable-next-line complexity, max-statements
  _resolveTree(gltf: GLTF): GLTFPostprocessed {
    // References are replaced below in dependency order.
    const json = {
      accessors: [],
      animations: [],
      buffers: [],
      bufferViews: [],
      cameras: [],
      images: [],
      materials: [],
      meshes: [],
      nodes: [],
      samplers: [],
      scenes: [],
      skins: [],
      textures: [],
      extensionsUsed: [],
      extensionsRequired: [],
      ...gltf
    } as unknown as GLTFPostprocessed;
    this.json = json;

    if (gltf.bufferViews) {
      json.bufferViews = gltf.bufferViews.map((object, index) =>
        this._resolveBufferView(object, index)
      );
    }
    if (gltf.cameras) {
      json.cameras = gltf.cameras.map((camera, index) => this._resolveCamera(camera, index));
    }
    if (gltf.images) {
      json.images = gltf.images.map((object, index) => this._resolveImage(object, index));
    }
    json.asset = this._resolveAsset(gltf.asset);
    if (gltf.samplers) {
      json.samplers = gltf.samplers.map((object, index) => this._resolveSampler(object, index));
    }
    if (gltf.textures) {
      json.textures = gltf.textures.map((object, index) => this._resolveTexture(object, index));
    }
    if (gltf.accessors) {
      json.accessors = gltf.accessors.map((object, index) => this._resolveAccessor(object, index));
    }
    if (gltf.materials) {
      json.materials = gltf.materials.map((object, index) => this._resolveMaterial(object, index));
    }
    if (gltf.meshes) {
      json.meshes = gltf.meshes.map((object, index) => this._resolveMesh(object, index));
    }
    if (gltf.nodes) {
      json.nodes = gltf.nodes.map((object, index) => this._resolveNode(object, index));
      json.nodes = json.nodes.map(node => this._resolveNodeChildren(node));
    }
    if (gltf.skins) {
      json.skins = gltf.skins.map((object, index) => this._resolveSkin(object, index));
      gltf.nodes?.forEach((node, index) => {
        if (node.skin !== undefined) {
          json.nodes[index].skin = this.getSkin(node.skin);
        }
      });
    }
    if (gltf.scenes) {
      json.scenes = gltf.scenes.map((object, index) => this._resolveScene(object, index));
    }
    if (typeof this.json.scene === 'number' && json.scenes) {
      json.scene = json.scenes[this.json.scene];
    }

    return json;
  }

  getScene(index: number): GLTFScenePostprocessed {
    return this._get(this.json.scenes, index);
  }

  getNode(index: number): GLTFNodePostprocessed {
    return this._get(this.json.nodes, index);
  }

  getSkin(index: number): GLTFSkinPostprocessed {
    return this._get(this.json.skins, index);
  }

  getMesh(index: number): GLTFMeshPostprocessed {
    return this._get(this.json.meshes, index);
  }

  getMaterial(index: number): GLTFMaterialPostprocessed {
    return this._get(this.json.materials, index);
  }

  /** Resolves referenced or extension-decoded accessors with consistent component layout metadata. */
  getAccessor(index: number): GLTFAccessorPostprocessed {
    const accessor = this._get(this.json.accessors, index);
    if (typeof index === 'object') {
      const components = getSizeFromAccessorType(accessor.type);
      const bytesPerComponent = getBytesFromComponentType(accessor.componentType);
      return {
        ...accessor,
        components,
        bytesPerComponent,
        bytesPerElement: components * bytesPerComponent
      };
    }
    return accessor;
  }

  getCamera(index: number): GLTFCameraPostprocessed {
    return this._get(this.json.cameras, index);
  }

  getTexture(index: number): GLTFTexturePostprocessed {
    return this._get(this.json.textures, index);
  }

  getSampler(index: number): GLTFSamplerPostprocessed {
    return this._get(this.json.samplers, index);
  }

  getImage(index: number): GLTFImagePostprocessed {
    return this._get(this.json.images, index);
  }

  getBufferView(index: number): GLTFBufferViewPostprocessed {
    return this._get(this.json.bufferViews, index);
  }

  getBuffer(index: number): GLTFBufferPostprocessed {
    return this._get(this.json.buffers, index);
  }

  _get<T>(array: T[] | undefined, index: number): T {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = array && array[index];
    // Every reference must resolve to an object in the referenced collection.
    assert(object);
    return object;
  }

  // PARSING HELPERS

  /** Resolve the draft glTF 2.1 thumbnail image reference in asset metadata. */
  _resolveAsset(gltfAsset: GLTFAsset): Asset {
    return {
      ...gltfAsset,
      thumbnail: gltfAsset.thumbnail !== undefined ? this.getImage(gltfAsset.thumbnail) : undefined
    };
  }

  _resolveScene(scene: GLTFScene, index: number): GLTFScenePostprocessed {
    return {
      ...scene,
      // @ts-ignore
      id: scene.id || `scene-${index}`,
      nodes: (scene.nodes || []).map(node => this.getNode(node))
    };
  }

  _resolveNode(gltfNode: GLTFNode, index: number): GLTFNodePostprocessed {
    // @ts-expect-error
    const node: GLTFNodePostprocessed = {
      ...gltfNode,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfNode?.id || `node-${index}`
    };
    if (gltfNode.mesh !== undefined) {
      node.mesh = this.getMesh(gltfNode.mesh);
    }
    if (gltfNode.camera !== undefined) {
      node.camera = this.getCamera(gltfNode.camera);
    }
    if (gltfNode.skin !== undefined) {
      node.skin = this.getSkin(gltfNode.skin);
    }

    return node;
  }

  _resolveNodeChildren(node: GLTFNodePostprocessed): GLTFNodePostprocessed {
    if (node.children) {
      // @ts-expect-error node.children are numbers at this stage
      node.children = node.children.map(child => this.getNode(child));
    }
    return node;
  }

  _resolveSkin(gltfSkin: GLTFSkin, index: number): GLTFSkinPostprocessed {
    const inverseBindMatrices =
      typeof gltfSkin.inverseBindMatrices === 'number'
        ? this.getAccessor(gltfSkin.inverseBindMatrices)
        : undefined;

    return {
      ...gltfSkin,
      id: gltfSkin.id || `skin-${index}`,
      inverseBindMatrices
    };
  }

  _resolveMesh(gltfMesh: GLTFMesh, index: number): GLTFMeshPostprocessed {
    const mesh: GLTFMeshPostprocessed = {
      ...gltfMesh,
      id: gltfMesh.id || `mesh-${index}`,
      primitives: []
    };
    if (gltfMesh.primitives) {
      mesh.primitives = gltfMesh.primitives.map((gltfPrimitive, primitiveIndex) => {
        const primitive: GLTFMeshPrimitivePostprocessed = {
          ...gltfPrimitive,
          attributes: {},
          indices: undefined,
          material: undefined
        };
        const attributes = gltfPrimitive.attributes;
        for (const attribute in attributes) {
          primitive.attributes[attribute] = this.getAccessor(attributes[attribute]);
        }
        if (gltfPrimitive.indices !== undefined) {
          primitive.indices = this.getAccessor(gltfPrimitive.indices);
        }
        if (gltfPrimitive.material !== undefined) {
          primitive.material = this.getMaterial(gltfPrimitive.material);
        }
        return normalizePrimitiveTopology(primitive, mesh.id, primitiveIndex);
      });
    }
    return mesh;
  }

  _resolveMaterial(gltfMaterial: GLTFMaterial, index: number): GLTFMaterialPostprocessed {
    // @ts-expect-error
    const material: GLTFMaterialPostprocessed = {
      ...gltfMaterial,
      // @ts-expect-error
      id: gltfMaterial.id || `material-${index}`
    };
    if (material.normalTexture) {
      material.normalTexture = {...material.normalTexture};
      material.normalTexture.texture = this.getTexture(material.normalTexture.index);
    }
    if (material.occlusionTexture) {
      material.occlusionTexture = {...material.occlusionTexture};
      material.occlusionTexture.texture = this.getTexture(material.occlusionTexture.index);
    }
    if (material.emissiveTexture) {
      material.emissiveTexture = {...material.emissiveTexture};
      material.emissiveTexture.texture = this.getTexture(material.emissiveTexture.index);
    }
    if (!material.emissiveFactor) {
      material.emissiveFactor = material.emissiveTexture ? [1, 1, 1] : [0, 0, 0];
    }

    if (material.pbrMetallicRoughness) {
      material.pbrMetallicRoughness = {...material.pbrMetallicRoughness};
      const metallicRoughness = material.pbrMetallicRoughness;
      if (metallicRoughness.baseColorTexture) {
        metallicRoughness.baseColorTexture = {...metallicRoughness.baseColorTexture};
        metallicRoughness.baseColorTexture.texture = this.getTexture(
          metallicRoughness.baseColorTexture.index
        );
      }
      if (metallicRoughness.metallicRoughnessTexture) {
        metallicRoughness.metallicRoughnessTexture = {
          ...metallicRoughness.metallicRoughnessTexture
        };
        metallicRoughness.metallicRoughnessTexture.texture = this.getTexture(
          metallicRoughness.metallicRoughnessTexture.index
        );
      }
    }
    return material;
  }

  _resolveAccessor(gltfAccessor: GLTFAccessor, index: number): GLTFAccessorPostprocessed {
    // Look up enums
    const bytesPerComponent = getBytesFromComponentType(gltfAccessor.componentType);
    const components = getSizeFromAccessorType(gltfAccessor.type);
    const bytesPerElement = bytesPerComponent * components;

    const accessor: GLTFAccessorPostprocessed = {
      ...gltfAccessor,
      // @ts-expect-error
      id: gltfAccessor.id || `accessor-${index}`,
      bytesPerComponent,
      components,
      bytesPerElement,
      value: undefined!,
      bufferView: undefined!,
      sparse: undefined!
    };
    if (gltfAccessor.bufferView !== undefined) {
      // Draco encoded meshes don't have bufferView
      accessor.bufferView = this.getBufferView(gltfAccessor.bufferView);
    }

    // Create TypedArray for the accessor
    // Note: The canonical way to instantiate is to ignore this array and create
    // WebGLBuffer's using the bufferViews.
    if (accessor.bufferView) {
      accessor.value = readAccessorValues(accessor, accessor.bufferView);
    } else {
      const {ArrayType} = getAccessorArrayTypeAndLength(accessor, {
        byteLength: accessor.count * accessor.bytesPerElement
      });
      accessor.value = new ArrayType(accessor.count * accessor.components);
    }

    if (gltfAccessor.sparse) {
      this._applySparseAccessor(accessor, gltfAccessor.sparse);
    }

    return accessor;
  }

  /** Applies sparse accessor replacements to an accessor's materialized values. */
  _applySparseAccessor(
    accessor: GLTFAccessorPostprocessed,
    sparse: NonNullable<GLTFAccessor['sparse']>
  ): void {
    const SparseIndexArray = getSparseIndexArrayType(sparse.indices.componentType);
    const sparseIndices = this._getTypedArrayFromBufferView(
      SparseIndexArray,
      this.getBufferView(sparse.indices.bufferView),
      sparse.indices.byteOffset || 0,
      sparse.count
    );
    const sparseValues = readAccessorValues(
      {...accessor, count: sparse.count},
      this.getBufferView(sparse.values.bufferView),
      sparse.values.byteOffset || 0,
      sparse.count
    );

    for (let sparseValueIndex = 0; sparseValueIndex < sparse.count; sparseValueIndex++) {
      const accessorIndex = Number(sparseIndices[sparseValueIndex]);
      // Sparse indices must address an element in the accessor.
      assert(
        Number.isInteger(accessorIndex) && accessorIndex >= 0 && accessorIndex < accessor.count
      );
      for (let componentIndex = 0; componentIndex < accessor.components; componentIndex++) {
        const targetIndex = accessorIndex * accessor.components + componentIndex;
        const sourceIndex = sparseValueIndex * accessor.components + componentIndex;
        Reflect.set(accessor.value, targetIndex, sparseValues[sourceIndex]);
      }
    }
  }

  /** Creates a typed array from a byte range within a resolved buffer view. */
  _getTypedArrayFromBufferView(
    ArrayType: BigTypedArrayConstructor,
    bufferView: GLTFBufferViewPostprocessed,
    byteOffset: number,
    length: number
  ): GLTFTypedArray {
    const byteLength = length * ArrayType.BYTES_PER_ELEMENT;
    // Sparse data must fit within its buffer view.
    assert(byteOffset + byteLength <= bufferView.byteLength);
    const buffer = bufferView.buffer;
    const absoluteByteOffset = buffer.byteOffset + (bufferView.byteOffset || 0) + byteOffset;
    const arrayBuffer = copyToArrayBuffer(buffer.arrayBuffer, absoluteByteOffset, byteLength);
    return new ArrayType(arrayBuffer);
  }

  _resolveTexture(gltfTexture: GLTFTexture, index: number): GLTFTexturePostprocessed {
    return {
      ...gltfTexture,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfTexture.id || `texture-${index}`,
      sampler:
        typeof gltfTexture.sampler === 'number'
          ? this.getSampler(gltfTexture.sampler)
          : makeDefaultSampler(),
      source: typeof gltfTexture.source === 'number' ? this.getImage(gltfTexture.source) : undefined
    };
  }

  _resolveSampler(gltfSampler: GLTFSampler, index: number): GLTFSamplerPostprocessed {
    const sampler: GLTFSamplerPostprocessed = {
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfSampler.id || `sampler-${index}`,
      ...gltfSampler,
      parameters: {}
    };
    // Map textual parameters to GL parameter values
    for (const key of Object.keys(
      SAMPLER_PARAMETER_GLTF_TO_GL
    ) as (keyof typeof SAMPLER_PARAMETER_GLTF_TO_GL)[]) {
      const value = gltfSampler[key];
      if (value !== undefined) {
        sampler.parameters[SAMPLER_PARAMETER_GLTF_TO_GL[key]] = value;
      }
    }
    return sampler;
  }

  _resolveImage(gltfImage: GLTFImage, index: number): GLTFImagePostprocessed {
    const image: GLTFImagePostprocessed = {
      ...gltfImage,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfImage.id || `image-${index}`,
      image: null!,
      bufferView:
        gltfImage.bufferView !== undefined ? this.getBufferView(gltfImage.bufferView) : undefined
    };

    // Keep the decoded image borrowed from the caller.
    const preloadedImage = this.images[index];
    if (preloadedImage) {
      image.image = preloadedImage;
    }

    return image;
  }

  _resolveBufferView(gltfBufferView: GLTFBufferView, index: number): GLTFBufferViewPostprocessed {
    const bufferIndex = gltfBufferView.buffer;
    const arrayBuffer = this.buffers[bufferIndex].arrayBuffer;
    // Add offset of buffer, then offset of buffer view
    let byteOffset = this.buffers[bufferIndex].byteOffset || 0;
    if (gltfBufferView.byteOffset) {
      byteOffset += gltfBufferView.byteOffset;
    }

    const bufferView: GLTFBufferViewPostprocessed = {
      id: `bufferView-${index}`,
      ...gltfBufferView,
      buffer: this.buffers[bufferIndex],
      data: new Uint8Array(arrayBuffer, byteOffset, gltfBufferView.byteLength)
    };

    return bufferView;
  }

  _resolveCamera(gltfCamera: GLTFCamera, index: number): GLTFCameraPostprocessed {
    const camera: GLTFCameraPostprocessed = {
      ...gltfCamera,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfCamera.id || `camera-${index}`
    };

    return camera;
  }
}

/**
 * Expands WebGL-only primitive topologies into portable indexed topologies.
 *
 * WebGPU does not support `LINE_LOOP` or `TRIANGLE_FAN`. The returned primitive uses a generated
 * index accessor and leaves the source glTF primitive, accessor, and buffer data unchanged.
 *
 * @param primitive Resolved glTF primitive.
 * @param meshId Identifier of the primitive's containing mesh.
 * @param primitiveIndex Position of the primitive in its containing mesh.
 * @returns The resolved primitive, normalized when it uses a WebGL-only topology.
 * @throws If an indexed primitive is postprocessed without its index buffer data.
 */
function normalizePrimitiveTopology(
  primitive: GLTFMeshPrimitivePostprocessed,
  meshId: string,
  primitiveIndex: number
): GLTFMeshPrimitivePostprocessed {
  if (primitive.mode !== 2 && primitive.mode !== 6) {
    return primitive;
  }

  const sourceIndices = primitive.indices?.value;
  const sourceIndexCount = primitive.indices?.count ?? getPrimitiveVertexCount(primitive);
  const maximumIndex = getMaximumIndex(sourceIndices, sourceIndexCount);
  const IndexArray = maximumIndex <= 65535 ? Uint16Array : Uint32Array;
  const generatedIndices =
    primitive.mode === 2
      ? createLineLoopIndices(sourceIndices, sourceIndexCount, IndexArray)
      : createTriangleFanIndices(sourceIndices, sourceIndexCount, IndexArray);

  primitive.mode = primitive.mode === 2 ? 1 : 4;
  primitive.indices = {
    id: `${meshId}-primitive-${primitiveIndex}-portable-indices`,
    components: 1,
    bytesPerComponent: IndexArray.BYTES_PER_ELEMENT,
    bytesPerElement: IndexArray.BYTES_PER_ELEMENT,
    componentType: IndexArray === Uint16Array ? 5123 : 5125,
    normalized: false,
    count: generatedIndices.length,
    type: 'SCALAR',
    min: generatedIndices.length ? [getMinimumIndex(generatedIndices)] : undefined,
    max: generatedIndices.length ? [maximumIndex] : undefined,
    value: generatedIndices
  };

  return primitive;
}

/** Returns the typed-array constructor for valid sparse accessor index component types. */
function getSparseIndexArrayType(
  componentType: number
): Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor {
  switch (componentType) {
    case 5121:
      return Uint8Array;
    case 5123:
      return Uint16Array;
    case 5125:
      return Uint32Array;
    default:
      throw new Error(`Invalid glTF sparse index component type ${componentType}`);
  }
}

/** Returns the vertex count shared by a non-indexed primitive's attributes. */
function getPrimitiveVertexCount(primitive: GLTFMeshPrimitivePostprocessed): number {
  const attribute = Object.values(primitive.attributes)[0];
  // A primitive must define at least one attribute.
  assert(attribute);
  return attribute.count;
}

/** Returns the largest referenced vertex index. */
function getMaximumIndex(
  indices: ArrayLike<number | bigint> | undefined,
  indexCount: number
): number {
  if (!indices) {
    return Math.max(0, indexCount - 1);
  }

  let maximumIndex = 0;
  for (let index = 0; index < indexCount; index++) {
    maximumIndex = Math.max(maximumIndex, Number(indices[index]));
  }
  return maximumIndex;
}

/** Returns the smallest generated vertex index. */
function getMinimumIndex(indices: Uint16Array | Uint32Array): number {
  let minimumIndex = Infinity;
  for (const index of indices) {
    minimumIndex = Math.min(minimumIndex, index);
  }
  return minimumIndex;
}

/** Reads an authored index or generates the equivalent sequential index. */
function getSourceIndex(indices: ArrayLike<number | bigint> | undefined, index: number): number {
  return indices ? Number(indices[index]) : index;
}

/** Expands a line loop into a portable line list. */
function createLineLoopIndices(
  sourceIndices: ArrayLike<number | bigint> | undefined,
  sourceIndexCount: number,
  IndexArray: Uint16ArrayConstructor | Uint32ArrayConstructor
): Uint16Array | Uint32Array {
  if (sourceIndexCount < 2) {
    return new IndexArray(0);
  }

  const generatedIndices = new IndexArray(sourceIndexCount * 2);
  for (let sourceIndex = 0; sourceIndex < sourceIndexCount; sourceIndex++) {
    generatedIndices[sourceIndex * 2] = getSourceIndex(sourceIndices, sourceIndex);
    generatedIndices[sourceIndex * 2 + 1] = getSourceIndex(
      sourceIndices,
      (sourceIndex + 1) % sourceIndexCount
    );
  }
  return generatedIndices;
}

/** Expands a triangle fan into a portable triangle list while preserving winding. */
function createTriangleFanIndices(
  sourceIndices: ArrayLike<number | bigint> | undefined,
  sourceIndexCount: number,
  IndexArray: Uint16ArrayConstructor | Uint32ArrayConstructor
): Uint16Array | Uint32Array {
  const triangleCount = Math.max(0, sourceIndexCount - 2);
  const generatedIndices = new IndexArray(triangleCount * 3);
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
    generatedIndices[triangleIndex * 3] = getSourceIndex(sourceIndices, 0);
    generatedIndices[triangleIndex * 3 + 1] = getSourceIndex(sourceIndices, triangleIndex + 1);
    generatedIndices[triangleIndex * 3 + 2] = getSourceIndex(sourceIndices, triangleIndex + 2);
  }
  return generatedIndices;
}

/** Resolves caller-supplied glTF resources without loading files or registering codecs.
 * The JSON document and borrowed resource bytes remain unchanged.
 * Results remain structurally compatible with loaders.gl postProcessGLTF results.
 */
export function postProcessGLTF(gltf: GLTFWithBuffers): GLTFPostprocessed {
  return new GLTFPostProcessor().postProcess(gltf);
}
