type TypedArrayConstructor =
  | Float32ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int8ArrayConstructor
  | Int16ArrayConstructor
  | Int32ArrayConstructor;

export function getGLTypeFromTypedArray(arrayOrType: any): any;

export function getTypedArrayFromGLType(
  glType: any,
  options?: {
    clamped?: boolean;
  }
): TypedArrayConstructor;

export function flipRows(options: {
  data: any;
  width: any;
  height: any;
  bytesPerPixel?: number;
  temp?: any;
}): void;

export function scalePixels(options: {
  data: any;
  width: any;
  height: any;
}): {
  data: Uint8Array;
  width: number;
  height: number;
};
