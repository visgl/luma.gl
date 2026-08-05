import type {Texture} from '@luma.gl/core';
import type {NumberArray9, TypedArray} from '@math.gl/core';
import type {
  ANARIArray,
  ANARICamera,
  ANARIGeometry,
  ANARIGroup,
  ANARIInstance,
  ANARILight,
  ANARIMaterial,
  ANARIRenderer,
  ANARISampler,
  ANARISurface,
  ANARIWorld
} from './anari-objects';

export type ANARIObjectType =
  | 'array'
  | 'camera'
  | 'frame'
  | 'geometry'
  | 'group'
  | 'instance'
  | 'light'
  | 'material'
  | 'renderer'
  | 'sampler'
  | 'surface'
  | 'world';

export type ANARIGeometrySubtype = 'triangle' | 'sphere' | 'cylinder' | 'cone' | 'quad';
export type ANARIMaterialSubtype = 'matte' | 'physicallyBased';
export type ANARISamplerSubtype = 'image2D';
export type ANARILightSubtype = 'ambient' | 'directional' | 'point' | 'spot';
export type ANARICameraSubtype = 'perspective' | 'orthographic';
export type ANARIRendererSubtype = 'default' | 'deferred' | 'debugNormals' | 'debugDepth';

export type ANARIVector3 = readonly [number, number, number];
export type ANARIVector4 = readonly [number, number, number, number];
export type ANARIMatrix4 = readonly number[];
export type ANARIArrayData = TypedArray | readonly ANARIObjectReference[];
export type ANARIObjectReference =
  | ANARIGeometry
  | ANARIMaterial
  | ANARISampler
  | ANARISurface
  | ANARIGroup
  | ANARIInstance
  | ANARILight;

export type ANARISamplerParameters = {
  image: Texture;
  transform?: Readonly<NumberArray9>;
  textureCoordinateSet?: 0 | 1;
};

export type ANARIArrayParameters = {
  data: ANARIArrayData;
  elementType?: string;
  dimensions?: readonly number[];
};

/** CPU-side displacement attributes belonging to one retained morph target. */
export type ANARIMorphTargetParameters = {
  POSITION?: Float32Array;
  NORMAL?: Float32Array;
  TANGENT?: Float32Array;
};

export type ANARIGeometryParameters = {
  'vertex.position'?: Float32Array | ANARIArray;
  'vertex.normal'?: Float32Array | ANARIArray;
  'vertex.tangent'?: Float32Array | ANARIArray;
  'vertex.joint'?: Uint8Array | Uint16Array | Uint32Array | ANARIArray;
  'vertex.weight'?: Float32Array | ANARIArray;
  'vertex.attribute0'?: Float32Array | ANARIArray;
  'vertex.attribute1'?: Float32Array | ANARIArray;
  'vertex.attribute2'?: Float32Array | ANARIArray;
  'primitive.index'?: Uint16Array | Uint32Array | ANARIArray;
  morphTargets?: readonly ANARIMorphTargetParameters[];
  morphWeights?: readonly number[];
  radius?: number;
  height?: number;
  width?: number;
  segments?: number;
};

export type ANARIMaterialParameters = {
  color?: ANARIVector3 | ANARIVector4;
  baseColor?: ANARIVector3 | ANARIVector4;
  emissive?: ANARIVector3;
  emissiveStrength?: number;
  metallic?: number;
  roughness?: number;
  opacity?: number;
  alphaMode?: 'opaque' | 'mask' | 'blend';
  alphaCutoff?: number;
  doubleSided?: boolean;
  unlit?: boolean;
  specularColor?: ANARIVector3;
  specularIntensity?: number;
  clearcoat?: number;
  iridescence?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  thickness?: number;
  attenuationDistance?: number;
  attenuationColor?: ANARIVector3;
  indexOfRefraction?: number;
  sheenColor?: ANARIVector3;
  sheenRoughness?: number;
  iridescenceIndexOfRefraction?: number;
  iridescenceThicknessMinimum?: number;
  iridescenceThicknessMaximum?: number;
  anisotropyStrength?: number;
  anisotropyRotation?: number;
  anisotropyDirection?: readonly [number, number];
  normalScale?: number;
  occlusionStrength?: number;
  baseColorTexture?: ANARISampler;
  normalTexture?: ANARISampler;
  metallicRoughnessTexture?: ANARISampler;
  emissiveTexture?: ANARISampler;
  occlusionTexture?: ANARISampler;
  specularColorTexture?: ANARISampler;
  specularIntensityTexture?: ANARISampler;
  clearcoatTexture?: ANARISampler;
  clearcoatRoughnessTexture?: ANARISampler;
  clearcoatNormalTexture?: ANARISampler;
  transmissionTexture?: ANARISampler;
  thicknessTexture?: ANARISampler;
  sheenColorTexture?: ANARISampler;
  sheenRoughnessTexture?: ANARISampler;
  iridescenceTexture?: ANARISampler;
  iridescenceThicknessTexture?: ANARISampler;
  anisotropyTexture?: ANARISampler;
};

/** Format-independent joint palette retained by one deformable surface. */
export type ANARISkinParameters = {
  jointMatrices: Float32Array | readonly number[];
};

export type ANARISurfaceParameters = {
  geometry: ANARIGeometry;
  material: ANARIMaterial;
  skin?: ANARISkinParameters;
};

export type ANARIGroupParameters = {
  surface?: readonly ANARISurface[] | ANARIArray;
  surfaces?: readonly ANARISurface[];
  light?: readonly ANARILight[] | ANARIArray;
  lights?: readonly ANARILight[];
};

export type ANARIInstanceParameters = {
  group: ANARIGroup | readonly ANARIGroup[] | ANARIArray;
  transform?: ANARIMatrix4;
};

export type ANARIWorldParameters = {
  surface?: readonly ANARISurface[] | ANARIArray;
  surfaces?: readonly ANARISurface[];
  instance?: readonly ANARIInstance[] | ANARIArray;
  instances?: readonly ANARIInstance[];
  light?: readonly ANARILight[] | ANARIArray;
  lights?: readonly ANARILight[];
};

export type ANARILightParameters = {
  color?: ANARIVector3;
  direction?: ANARIVector3;
  position?: ANARIVector3;
  intensity?: number;
  irradiance?: number;
  radiance?: number;
  openingAngle?: number;
  falloffAngle?: number;
};

export type ANARICameraParameters = {
  position?: ANARIVector3;
  direction?: ANARIVector3;
  up?: ANARIVector3;
  aspect?: number;
  fovy?: number;
  height?: number;
  near?: number;
  far?: number;
};

export type ANARIRendererParameters = {
  background?: ANARIVector4;
  ambientRadiance?: number;
  environment?: {
    diffuseTexture?: Texture;
    specularTexture?: Texture;
    brdfLUTTexture?: Texture;
    intensity?: number;
    rotation?: number;
  };
  exposure?: number;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  fogColor?: ANARIVector3;
  fogDensity?: number;
};

export type ANARIFrameParameters = {
  world: ANARIWorld;
  camera: ANARICamera;
  renderer: ANARIRenderer;
  size?: readonly [number, number];
};

export type ANARIFrameStatistics = {
  surfaceCount: number;
  instanceCount: number;
  drawCount: number;
  triangleCount: number;
};

export type ANARIObjectInfo = {
  type: ANARIObjectType;
  subtypes: readonly string[];
  extensions: readonly string[];
};
