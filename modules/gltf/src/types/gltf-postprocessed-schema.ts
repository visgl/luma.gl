// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Types forked from https://github.com/bwasty/gltf-loader-ts under MIT license
// Generated from official JSON schema using `npm run generate-type` = on 2018-02-24

import type {GLTFTypedArray} from './gltf-types';

export type GlTfId = number;

// GLTF attributes (possibly overridden)

/**
 * Indices of those attributes that deviate from their initialization value.
 */
export type AccessorSparseIndices = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the bufferView with sparse indices. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GlTfId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  /**
   * The indices data type.
   */
  componentType: 5121 | 5123 | 5125 | number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Array of size `accessor.sparse.count` times number of components storing the displaced accessor attributes pointed by `accessor.sparse.indices`.
 */
export type AccessorSparseValues = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the bufferView with sparse values. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GlTfId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Sparse storage of attributes that deviate from their initialization value.
 */
export type AccessorSparse = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * Number of entries stored in the sparse array.
   */
  count: number;
  /**
   * Index array of size `count` that points to those accessor attributes that deviate from their initialization value. Indices must strictly increase.
   */
  indices: AccessorSparseIndices;
  /**
   * Array of size `count` times number of components, storing the displaced accessor attributes pointed by `indices`. Substituted values must have the same `componentType` and number of components as the base accessor.
   */
  values: AccessorSparseValues;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A typed view into a bufferView.  A bufferView contains raw binary data.  An accessor provides a typed view into a bufferView or a subset of a bufferView similar to how WebGL's `vertexAttribPointer()` defines an attribute in a buffer.
 */
export type GLTFAccessorPostprocessed = {
  id: string;
  components: number;
  bytesPerComponent: number;
  bytesPerElement: number;
  value: GLTFTypedArray;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the bufferView.
   */
  bufferView?: GLTFBufferViewPostprocessed;
  /**
   * The offset relative to the start of the bufferView in bytes.
   */
  byteOffset?: number;
  /**
   * The datatype of components in the attribute.
   */
  componentType:
    | 5120
    | 5121
    | 5122
    | 5123
    | 5124
    | 5125
    | 5126
    | 5130
    | 5131
    | 5134
    | 5135
    | number;
  /**
   * Specifies whether integer data values should be normalized.
   */
  normalized?: boolean;
  /**
   * The number of attributes referenced by this accessor.
   */
  count: number;
  /**
   * Specifies if the attribute is a scalar, vector, or matrix.
   */
  type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4' | string;
  /**
   * Maximum value of each component in this attribute.
   */
  max?: number[];
  /**
   * Minimum value of each component in this attribute.
   */
  min?: number[];
  /**
   * Sparse storage of attributes that deviate from their initialization value.
   */
  sparse?: AccessorSparse;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * The index of the node and TRS property that an animation channel targets.
 */
export type AnimationChannelTarget = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the node to target.
   */
  node?: GlTfId;
  /**
   * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates. For the "translation" property, the values that are provided by the sampler are the translation along the x, y, and z axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the "scale" property, the values are the scaling factors along the x, y, and z axes.
   */
  path: 'translation' | 'rotation' | 'scale' | 'weights' | string;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Targets an animation's sampler at a node's property.
 */
export type AnimationChannel = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GlTfId;
  /**
   * The index of the node and TRS property to target.
   */
  target: AnimationChannelTarget;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 */
export type AnimationSampler = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of an accessor containing keyframe input values, e.g., time.
   */
  input: GlTfId;
  /**
   * Interpolation algorithm.
   */
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE' | string;
  /**
   * The index of an accessor, containing keyframe output values.
   */
  output: GlTfId;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A keyframe animation.
 */
export type GLTFAnimationPostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /** An array of channels, each of which targets an animation's sampler at a node's property. Different channels of the same animation can't have equal targets. */
  channels: AnimationChannel[];
  /** An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target). */
  samplers: AnimationSampler[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Metadata about the glTF asset.
 */
export type Asset = {
  // GLTF attributes (possibly overridden)
  /**
   * A copyright message suitable for display to credit the content creator.
   */
  copyright?: string;
  /**
   * Tool that generated this glTF model.  Useful for debugging.
   */
  generator?: string;
  /**
   * The glTF version that this asset targets.
   */
  version: string;
  /**
   * The minimum glTF version that this asset targets.
   */
  minVersion?: string;
  /**
   * The image that provides a preview of this glTF asset.
   * Draft glTF 2.1.
   */
  thumbnail?: GLTFImagePostprocessed;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export type GLTFBufferPostprocessed = {
  id?: string;
  arrayBuffer: ArrayBuffer;
  byteOffset: number;

  // GLTF attributes (possibly overridden)
  /** The length of the buffer in bytes. */
  byteLength: number;

  /** The uri of the buffer. */
  uri?: string;
  /** The zero-based GLB v3 chunk index selected by this buffer. */
  chunk?: number;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export type GLTFBufferViewPostprocessed = {
  id: string;
  data: Uint8Array;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the buffer.
   */
  buffer: GLTFBufferPostprocessed;
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number;
  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number;
  /**
   * The stride, in bytes.
   */
  byteStride?: number;
  /**
   * The target that the GPU buffer should be bound to.
   */
  target?: 34962 | 34963 | number;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export type CameraOrthographic = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The floating-point horizontal magnification of the view. Must not be zero.
   */
  xmag: number;
  /**
   * The floating-point vertical magnification of the view. Must not be zero.
   */
  ymag: number;
  /**
   * The floating-point distance to the far clipping plane. `zfar` must be greater than `znear`.
   */
  zfar: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export type CameraPerspective = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The floating-point aspect ratio of the field of view.
   */
  aspectRatio?: number;
  /**
   * The floating-point vertical field of view in radians.
   */
  yfov: number;
  /**
   * The floating-point distance to the far clipping plane.
   */
  zfar?: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A camera's projection.  A node can reference a camera to apply a transform to place the camera in the scene.
 */
export type GLTFCameraPostprocessed = {
  // GLTF attributes (possibly overridden)
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix.
   */
  orthographic?: CameraOrthographic;
  /**
   * A perspective camera containing properties to create a perspective projection matrix.
   */
  perspective?: CameraPerspective;
  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: 'perspective' | 'orthographic' | string;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * GLTFImagePostprocessed data used to create a texture.
 * GLTFImagePostprocessed can be referenced by URI or `bufferView` index.
 * `mimeType` is required in the latter case.
 * @todo GLTF image postprocessing
 */
export type GLTFImagePostprocessed = {
  id: string;
  // TODO - extend
  image: {
    data: Uint8Array;
    compressed?: boolean;
    height?: number;
    width?: number;
    components?: number;
    mimeType?: string;
  };

  compressed?: boolean;

  // GLTF attributes (possibly overridden)
  /**
   * The uri of the image.
   */
  uri?: string;
  /**
   * The image's MIME type.
   */
  mimeType?: 'image/jpeg' | 'image/png' | string;
  /**
   * The index of the bufferView that contains the image. Use this instead of the image's uri property.
   */
  bufferView?: GLTFBufferViewPostprocessed;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Reference to a texture.
 */
export type GLTFTextureInfoPostprocessed = {
  id: string;
  texture: GLTFTexturePostprocessed;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the texture.
   */
  index: GlTfId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   */
  texCoord?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export type MaterialPbrMetallicRoughnessPostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The material's base color factor.
   */
  baseColorFactor?: number[];
  /**
   * The base color texture.
   */
  baseColorTexture?: GLTFTextureInfoPostprocessed;
  /**
   * The metalness of the material.
   */
  metallicFactor?: number;
  /**
   * The roughness of the material.
   */
  roughnessFactor?: number;
  /**
   * The metallic-roughness texture.
   */
  metallicRoughnessTexture?: GLTFTextureInfoPostprocessed;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

export type MaterialNormalTextureInfoPostprocessed = {
  id: string;
  texture: GLTFTexturePostprocessed;

  // GLTF attributes (possibly overridden)
  index?: any;
  texCoord?: any;
  /**
   * The scalar multiplier applied to each normal vector of the normal texture.
   */
  scale?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

export type MaterialOcclusionTextureInfoPostprocessed = {
  id: string;
  texture: GLTFTexturePostprocessed;

  // GLTF attributes (possibly overridden)
  index?: any;
  texCoord?: any;
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * The material appearance of a primitive.
 */
export type GLTFMaterialPostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  name?: any;
  extensions?: any;
  extras?: any;
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.
   */
  pbrMetallicRoughness?: MaterialPbrMetallicRoughnessPostprocessed;
  /**
   * The normal map texture.
   */
  normalTexture?: MaterialNormalTextureInfoPostprocessed;
  /**
   * The occlusion map texture.
   */
  occlusionTexture?: MaterialOcclusionTextureInfoPostprocessed;
  /**
   * The emissive map texture.
   */
  emissiveTexture?: GLTFTextureInfoPostprocessed;
  /**
   * The emissive color of the material.
   */
  emissiveFactor?: number[];
  /**
   * The alpha rendering mode of the material.
   */
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND' | string;
  /**
   * The alpha cutoff value of the material.
   */
  alphaCutoff?: number;
  /**
   * Specifies whether the material is double sided.
   */
  doubleSided?: boolean;
  // [k: string]: any;
};

/**
 * Geometry to be rendered with the given material.
 */
export type GLTFMeshPrimitivePostprocessed = {
  // GLTF attributes (possibly overridden)
  /**
   * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GLTFAccessorPostprocessed;
  };
  /**
   * The index of the accessor that contains the indices.
   */
  indices?: GLTFAccessorPostprocessed;
  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: GLTFMaterialPostprocessed;
  /**
   * The type of primitives to render.
   */
  mode?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | number;
  /** An array of Morph Targets, each  Morph Target is a dictionary mapping attributes (only `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target. */
  targets?: {
    [k: string]: GlTfId;
  }[];
  extensions?: any;
  extras?: any;
  /** Loader-derived primitive-restart topology. */
  primitiveRestart?: import('./gltf-types').GLTFPrimitiveRestartData;
  // [k: string]: any;
};

/**
 * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform places the mesh in the scene.
 */
export type GLTFMeshPostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /** An array of primitives, each defining geometry to be rendered with a material. */
  primitives: GLTFMeshPrimitivePostprocessed[];
  /**
   * Array of weights to be applied to the Morph Targets.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` must contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), only TRS properties may be present; `matrix` will not be present.
 */
export type GLTFNodePostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the camera referenced by this node.
   */
  camera?: GLTFCameraPostprocessed;
  /**
   * The indices of this node's children.
   */
  children?: GLTFNodePostprocessed[];
  /**
   * The index of the skin referenced by this node.
   */
  skin?: GLTFSkinPostprocessed;
  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[];
  /**
   * The index of the mesh in this node.
   */
  mesh?: GLTFMeshPostprocessed;
  /** Index of the draft glTF 2.1 external asset instantiated by this node. */
  externalAsset?: GlTfId;
  /**
   * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
   */
  rotation?: number[];
  /**
   * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
   */
  scale?: number[];
  /**
   * The node's translation along the x, y, and z axes.
   */
  translation?: number[];
  /**
   * The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * GLTFTexturePostprocessed sampler properties for filtering and wrapping modes.
 */
export type GLTFSamplerPostprocessed = {
  id: string;
  /** WebGL parameters */
  parameters: Record<string, number>;

  // GLTF attributes (possibly overridden)
  /** Magnification filter. */
  magFilter?: 9728 | 9729 | number;
  /** Minification filter. */
  minFilter?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987 | number;
  /** s wrapping mode. */
  wrapS?: 33071 | 33648 | 10497 | number;
  /** t wrapping mode. */
  wrapT?: 33071 | 33648 | 10497 | number;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * The root nodes of a scene.
 */
export type GLTFScenePostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /** The indices of each root node. */
  nodes?: GLTFNodePostprocessed[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * Joints and matrices defining a skin.
 */
export type GLTFSkinPostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.  The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
   */
  inverseBindMatrices?: GLTFAccessorPostprocessed;
  /**
   * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
   */
  skeleton?: GlTfId;
  /**
   * Indices of skeleton nodes, used as joints in this skin.
   */
  joints: GlTfId[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * A texture and its sampler.
 */
export type GLTFTexturePostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /**
   * The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering should be used.
   */
  sampler?: GLTFSamplerPostprocessed;
  /**
   * The index of the image used by this texture.
   */
  source?: GLTFImagePostprocessed;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
};

/**
 * The root object for a glTF asset.
 */
export type GLTFPostprocessed = {
  id: string;

  // GLTF attributes (possibly overridden)
  /** Names of glTF extensions used somewhere in this asset. */
  extensionsUsed: string[];
  /** Names of glTF extensions required to properly load this asset. */
  extensionsRequired: string[];
  /** An array of accessors. */
  accessors: GLTFAccessorPostprocessed[];
  /** An array of keyframe animations. */
  animations: GLTFAnimationPostprocessed[];
  /** Metadata about the glTF asset. */
  asset: Asset;
  /** An array of buffers. */
  buffers: GLTFBufferPostprocessed[];
  /** An array of bufferViews. */
  bufferViews: GLTFBufferViewPostprocessed[];
  /** An array of cameras. */
  cameras: GLTFCameraPostprocessed[];
  /** An array of images. */
  images: GLTFImagePostprocessed[];
  /** An array of materials. */
  materials: GLTFMaterialPostprocessed[];
  /** An array of meshes. */
  meshes: GLTFMeshPostprocessed[];
  /** An array of nodes. */
  nodes: GLTFNodePostprocessed[];
  /** An array of samplers. */
  samplers: GLTFSamplerPostprocessed[];
  /** The index of the default scene. */
  scene?: GLTFScenePostprocessed;
  /** An array of scenes. */
  scenes: GLTFScenePostprocessed[];
  /** An array of skins. */
  skins: GLTFSkinPostprocessed[];
  /** An array of textures. */
  textures: GLTFTexturePostprocessed[];
  extensions?: Record<string, Record<string, any>>;
  extras?: any;
  // [k: string]: any;
};
