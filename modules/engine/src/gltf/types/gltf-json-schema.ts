// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) 2018 Benjamin Wasty

// Types forked from https://github.com/bwasty/gltf-loader-ts under MIT license
// Generated from official JSON schema using `npm run generate-interface` on 2018-02-24

import type {GLTFBoundingVolume, GLTFShape} from './gltf-shape-schema';

export type GLTFId = number;

/**
 * Indices of those attributes that deviate from their initialization value.
 */
export type GLTFAccessorSparseIndices = {
  /**
   * The index of the bufferView with sparse indices. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  /**
   * The indices data type.
   */
  componentType: 5121 | 5123 | 5125 | number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Array of size `accessor.sparse.count` times number of components storing the displaced accessor attributes pointed by `accessor.sparse.indices`.
 */
export type GLTFAccessorSparseValues = {
  /**
   * The index of the bufferView with sparse values. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Sparse storage of attributes that deviate from their initialization value.
 */
export type GLTFAccessorSparse = {
  /**
   * Number of entries stored in the sparse array.
   */
  count: number;
  /**
   * Index array of size `count` that points to those accessor attributes that deviate from their initialization value. Indices must strictly increase.
   */
  indices: GLTFAccessorSparseIndices;
  /**
   * Array of size `count` times number of components, storing the displaced accessor attributes pointed by `indices`. Substituted values must have the same `componentType` and number of components as the base accessor.
   */
  values: GLTFAccessorSparseValues;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A typed view into a bufferView.  A bufferView contains raw binary data.  An accessor provides a typed view into a bufferView or a subset of a bufferView similar to how WebGL's `vertexAttribPointer()` defines an attribute in a buffer.
 */
export type GLTFAccessor = {
  /**
   * The index of the bufferView.
   */
  bufferView?: GLTFId;
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
  sparse?: GLTFAccessorSparse;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The index of the node and TRS property that an animation channel targets.
 */
export type GLTFAnimationChannelTarget = {
  /**
   * The index of the node to target.
   */
  node?: GLTFId;
  /**
   * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates. For the "translation" property, the values that are provided by the sampler are the translation along the x, y, and z axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the "scale" property, the values are the scaling factors along the x, y, and z axes.
   */
  path: 'translation' | 'rotation' | 'scale' | 'weights' | string;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Targets an animation's sampler at a node's property.
 */
export type GLTFAnimationChannel = {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GLTFId;
  /**
   * The index of the node and TRS property to target.
   */
  target: GLTFAnimationChannelTarget;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 */
export type GLTFAnimationSampler = {
  /**
   * The index of an accessor containing keyframe input values, e.g., time.
   */
  input: GLTFId;
  /**
   * Interpolation algorithm.
   */
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE' | string;
  /**
   * The index of an accessor, containing keyframe output values.
   */
  output: GLTFId;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A keyframe animation.
 */
export type GLTFAnimation = {
  /**
   * An array of channels, each of which targets an animation's sampler at a node's property. Different channels of the same animation can't have equal targets.
   */
  channels: GLTFAnimationChannel[];
  /**
   * An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
   */
  samplers: GLTFAnimationSampler[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Metadata about the glTF asset.
 */
export type GLTFAsset = {
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
   * The index of an image that provides a preview of this glTF asset.
   * Draft glTF 2.1.
   */
  thumbnail?: GLTFId;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export type GLTFBuffer = {
  /**
   * The uri of the buffer.
   */
  uri?: string;
  /**
   * The zero-based index of the GLB v3 chunk containing the buffer.
   * Draft glTF 2.1 property; mutually exclusive with `uri`.
   */
  chunk?: number;
  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export type GLTFBufferView = {
  /**
   * The index of the buffer.
   */
  buffer: GLTFId;
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export type GLTFCameraOrthographic = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export type GLTFCameraPerspective = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A camera's projection.  A node can reference a camera to apply a transform to place the camera in the scene.
 */
export type GLTFCamera = {
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix.
   */
  orthographic?: GLTFCameraOrthographic;
  /**
   * A perspective camera containing properties to create a perspective projection matrix.
   */
  perspective?: GLTFCameraPerspective;
  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: 'perspective' | 'orthographic' | string;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Image data used to create a texture. Image can be referenced by URI or `bufferView` index. `mimeType` is required in the latter case.
 */
export type GLTFImage = {
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
  bufferView?: GLTFId;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A draft glTF 2.1 reference to a file stored at a URI or in a buffer view.
 */
export type GLTFFile = {
  /** URI of the file. Mutually exclusive with `bufferView`. */
  uri?: string;
  /** Index of the buffer view containing the file. Mutually exclusive with `uri`. */
  bufferView?: GLTFId;
  /** MIME type of the referenced file. */
  mimeType: string;
  /** Name used to resolve references from embedded packaged assets. */
  name?: string;
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * A draft glTF 2.1 model dependency sourced from the top-level `files` array.
 */
export type GLTFExternalAsset = {
  /** Index of the file containing the external glTF asset. */
  file: GLTFId;
  /** Optional application-facing name for this external asset. */
  name?: string;
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * Reference to a texture.
 */
export type GLTFTextureInfo = {
  /**
   * The index of the texture.
   */
  index: GLTFId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   * Default is 0
   * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/specification/2.0/schema/textureInfo.schema.json
   */
  texCoord?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Extended GLTFTextureInfo that is used in EXT_structural_metadata and EXT_mesh_features
 * https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata
 * https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
 */
export type GLTFTextureInfoMetadata = GLTFTextureInfo & {
  /**
   * For EXT_structural_metadata and Ext_mesh_features the channels default is [0]
   * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/featureIdTexture.schema.json
   * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTexture.property.schema.json
   */
  channels: number[] | string;
  /** For internal usage */
  data?: unknown;
};

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export type GLTFMaterialPbrMetallicRoughness = {
  /**
   * The material's base color factor.
   */
  baseColorFactor?: number[];
  /**
   * The base color texture.
   */
  baseColorTexture?: GLTFTextureInfo;
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
  metallicRoughnessTexture?: GLTFTextureInfo;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};
export type GLTFMaterialNormalTextureInfo = {
  index: any;
  texCoord?: any;
  /**
   * The scalar multiplier applied to each normal vector of the normal texture.
   */
  scale?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};
export type GLTFMaterialOcclusionTextureInfo = {
  index: any;
  texCoord?: any;
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The material appearance of a primitive.
 */
export type GLTFMaterial = {
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.
   */
  pbrMetallicRoughness?: GLTFMaterialPbrMetallicRoughness;
  /**
   * The normal map texture.
   */
  normalTexture?: GLTFMaterialNormalTextureInfo;
  /**
   * The occlusion map texture.
   */
  occlusionTexture?: GLTFMaterialOcclusionTextureInfo;
  /**
   * The emissive map texture.
   */
  emissiveTexture?: GLTFTextureInfo;
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
export type GLTFMeshPrimitive = {
  /**
   * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GLTFId;
  };
  /**
   * The index of the accessor that contains the indices.
   */
  indices?: GLTFId;
  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: GLTFId;
  /**
   * The type of primitives to render.
   */
  mode?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | number;
  /**
   * An array of Morph Targets, each  Morph Target is a dictionary mapping attributes (only `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target.
   */
  targets?: {
    [k: string]: GLTFId;
  }[];
  extensions?: Record<string, unknown>;
  extras?: any;
  /** Loader-derived primitive-restart topology. This property is not serialized by glTF. */
  primitiveRestart?: import('./gltf-types').GLTFPrimitiveRestartData;
  // [k: string]: any;
};

/**
 * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform places the mesh in the scene.
 */

export type GLTFMesh = {
  id?: string;
  /**
   * An array of primitives, each defining geometry to be rendered with a material.
   */
  primitives: GLTFMeshPrimitive[];
  /**
   * Array of weights to be applied to the Morph Targets.
   */
  weights?: number[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` must contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), only TRS properties may be present; `matrix` will not be present.
 */
export type GLTFNode = {
  /**
   * The index of the camera referenced by this node.
   */
  camera?: GLTFId;
  /**
   * The indices of this node's children.
   */
  children?: GLTFId[];
  /**
   * The index of the skin referenced by this node.
   */
  skin?: GLTFId;
  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[];
  /**
   * The index of the mesh in this node.
   */
  mesh?: GLTFId;
  /** Index of the draft glTF 2.1 external asset instantiated by this node. */
  externalAsset?: GLTFId;
  /** Draft glTF 2.1 bounding-volume shape reference. */
  boundingVolume?: GLTFBoundingVolume;
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export type GLTFSampler = {
  /**
   * Magnification filter.
   */
  magFilter?: 9728 | 9729 | number;
  /**
   * Minification filter.
   */
  minFilter?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987 | number;
  /**
   * s wrapping mode.
   */
  wrapS?: 33071 | 33648 | 10497 | number;
  /**
   * t wrapping mode.
   */
  wrapT?: 33071 | 33648 | 10497 | number;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The root nodes of a scene.
 */
export type GLTFScene = {
  /**
   * The indices of each root node.
   */
  nodes?: GLTFId[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Joints and matrices defining a skin.
 */
export type GLTFSkin = {
  id?: string;
  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.  The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
   */
  inverseBindMatrices?: GLTFId;
  /**
   * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
   */
  skeleton?: GLTFId;
  /** Indices of skeleton nodes, used as joints in this skin. */
  joints: GLTFId[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A texture and its sampler.
 */
export type GLTFTexture = {
  /** The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering should be used. */
  sampler?: GLTFId;
  /** The index of the image used by this texture. */
  source?: GLTFId;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The root object for a glTF asset.
 */
export type GLTF = {
  /**
   * Names of glTF extensions used somewhere in this asset.
   */
  extensionsUsed?: string[];
  /**
   * Names of glTF extensions required to properly load this asset.
   */
  extensionsRequired?: string[];
  /**
   * An array of accessors.
   */
  accessors?: GLTFAccessor[];
  /**
   * An array of keyframe animations.
   */
  animations?: GLTFAnimation[];
  /**
   * Metadata about the glTF asset.
   */
  asset: GLTFAsset;
  /**
   * An array of buffers.
   */
  buffers?: GLTFBuffer[];
  /**
   * An array of bufferViews.
   */
  bufferViews?: GLTFBufferView[];
  /**
   * An array of cameras.
   */
  cameras?: GLTFCamera[];
  /**
   * An array of images.
   */
  images?: GLTFImage[];
  /**
   * Draft glTF 2.1 unified file references.
   */
  files?: GLTFFile[];
  /**
   * Draft glTF 2.1 external glTF assets.
   */
  externalAssets?: GLTFExternalAsset[];
  /** Draft glTF 2.1 implicit shape definitions. */
  shapes?: GLTFShape[];
  /**
   * An array of materials.
   */
  materials?: GLTFMaterial[];
  /**
   * An array of meshes.
   */
  meshes?: GLTFMesh[];
  /**
   * An array of nodes.
   */
  nodes?: GLTFNode[];
  /**
   * An array of samplers.
   */
  samplers?: GLTFSampler[];
  /**
   * The index of the default scene.
   */
  scene?: GLTFId;
  /**
   * An array of scenes.
   */
  scenes?: GLTFScene[];
  /**
   * An array of skins.
   */
  skins?: GLTFSkin[];
  /**
   * An array of textures.
   */
  textures?: GLTFTexture[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
  [k: string]: unknown;
};

export type GLTFObject =
  | GLTFAccessor
  | GLTFBuffer
  | GLTFBufferView
  | GLTFMeshPrimitive
  | GLTFMesh
  | GLTFNode
  | GLTFMaterial
  | GLTFSampler
  | GLTFScene
  | GLTFSkin
  | GLTFTexture
  | GLTFImage
  | GLTFFile
  | GLTFExternalAsset;

// GLTF Extensions
/* eslint-disable camelcase */

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
 * TODO - this can be used on both images and shaders
 */
export type GLTF_KHR_binary_glTF = {
  bufferView: number;
  // required for images but not shaders
  mimeType?: string;
  height?: number;
  width?: number;
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
export type GLTF_KHR_draco_mesh_compression = {
  bufferView: GLTFId;
  attributes: {[name: string]: number};
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export type GLTF_KHR_texture_basisu = {
  source: GLTFId;
  extras?: any;
};

/**
 * Ratified vendor meshopt buffer-view compression extension.
 *
 * The extension object describes compressed source bytes. Its parent `GLTFBufferView` describes
 * the uncompressed destination, whose `byteLength` is `count * byteStride`.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_meshopt_compression
 */
export type GLTF_EXT_meshopt_compression = {
  /** Index of the buffer containing the compressed source bytes. */
  buffer: number;
  /** Byte offset of the compressed data within `buffer`; defaults to `0`. */
  byteOffset?: number;
  /** Length of the compressed source range in bytes. */
  byteLength: number;
  /** Stride of each decompressed element in bytes. */
  byteStride: number;
  /** Number of fixed-stride elements in the decompressed parent buffer view. */
  count: number;
  /** Meshopt bitstream mode used for the compressed source range. */
  mode: 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';
  /** EXT post-decode filter; defaults to `NONE` and is valid only for `ATTRIBUTES` mode. */
  filter?: 'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL';
  /** Application-specific extension data. */
  extras?: any;
};

/**
 * Khronos meshopt buffer-view compression extension.
 *
 * The KHR extension preserves the EXT JSON layout and version 0 bitstream compatibility while
 * adding version 1 attribute encoding and the `COLOR` post-decode filter. Its extension object
 * describes compressed source bytes; the parent `GLTFBufferView` describes the uncompressed
 * destination, whose `byteLength` is `count * byteStride`.
 *
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_meshopt_compression
 */
export type GLTF_KHR_meshopt_compression = {
  /** Index of the buffer containing the compressed source bytes. */
  buffer: number;
  /** Byte offset of the compressed data within `buffer`; defaults to `0`. */
  byteOffset?: number;
  /** Length of the compressed source range in bytes. */
  byteLength: number;
  /** Stride of each decompressed element in bytes. */
  byteStride: number;
  /** Number of fixed-stride elements in the decompressed parent buffer view. */
  count: number;
  /** Meshopt bitstream mode used for the compressed source range. */
  mode: 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';
  /** KHR post-decode filter; defaults to `NONE` and is valid only for `ATTRIBUTES` mode. */
  filter?: 'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL' | 'COLOR';
  /** Application-specific extension data. */
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
export type GLTF_EXT_texture_webp = {
  source: GLTFId;
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif
 */
export type GLTF_EXT_texture_avif = {
  /** Index of the AVIF image used in place of the ordinary texture source. */
  source: GLTFId;
  /** Application-specific extension data. */
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
 */
export type GLTF_MSFT_texture_dds = {
  source: GLTFId;
  extras?: any;
};
