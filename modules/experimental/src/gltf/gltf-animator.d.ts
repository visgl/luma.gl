export const ATTRIBUTE_TYPE_TO_COMPONENTS: {
  SCALAR: number;
  VEC2: number;
  VEC3: number;
  VEC4: number;
  MAT2: number;
  MAT3: number;
  MAT4: number;
};

export const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY: {
  5120: Int8ArrayConstructor;
  5121: Uint8ArrayConstructor;
  5122: Int16ArrayConstructor;
  5123: Uint16ArrayConstructor;
  5125: Uint32ArrayConstructor;
  5126: Float32ArrayConstructor;
};

export default class GLTFAnimator {
  constructor(gltf: any);
  animate(time: any): void;
  setTime(time: any): void;
  getAnimations(): any;
}
