// luma.gl, MIT license

/** Basic data types signed and unsigned integers, and floats, of varying sizes */
export type DataType =
  'uint8' |
  'sint8' |
  'uint16' |
  'sint16' |
  'uint32' |
  'sint32' |
  'float16' |
  'float32'
  // 'float64'
  ;

/** Vertex and Pixel data types. Include normalized integers */
export type NormalizedDataType =
  'uint8' |
  'sint8' |
  'unorm8' |
  'snorm8' |
  'uint16' |
  'sint16' |
  'unorm16' |
  'snorm16' |
  'float16' |
  'float32' |
  'uint32' |
  'sint32'
  ;

export type VertexType = NormalizedDataType;

/** Attribute formats */
export type VertexFormat =
  'uint8x2' |
  'uint8x4' |
  'sint8x2' |
  'sint8x4' |
  'unorm8-webgl' |
  'unorm8x2' |
  'unorm8x3-webgl' |
  'unorm8x4' |
  'snorm8-webgl' |
  'snorm8x2' |
  'snorm8x3-webgl' |
  'snorm8x4' |
  'uint16x2' |
  'uint16x4' |
  'sint16x2' |
  'sint16x4' |
  'unorm16x2' |
  'unorm16x4' |
  'snorm16x2' |
  'snorm16x4' |
  'float16x2' |
  'float16x4' |
  'float32' |
  'float32x2' |
  'float32x3' |
  'float32x4' |
  'uint32' |
  'uint32x2' |
  'uint32x3' |
  'uint32x4' |
  'sint32' |
  'sint32x2' |
  'sint32x3' |
  'sint32x4';
