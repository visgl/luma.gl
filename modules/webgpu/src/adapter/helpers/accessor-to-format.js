/*
import {assert} from '@luma.gl/core';

type Accessor = Record<string, any>;

const FORMAT_TO_ACCESSOR: Record<GPUVertexFormat, Accessor> = {
  uchar2: {type: 'uchar', size: 2},
  uchar4: {type: 'uchar', size: 4},
  char2: {type: 'char', size: 2},
  char4: {type: 'char', size: 4},
  uchar2norm: {type: 'uchar', size: 2, normalized: true},
  uchar4norm: {type: 'uchar', size: 4, normalized: true},
  char2norm: {type: 'char', size: 2, normalized: true},
  char4norm: {type: 'char', size: 4, normalized: true},
  ushort2: {type: 'ushort', size: 2},
  ushort4: {type: 'ushort', size: 4},
  short2: {type: 'short', size: 2},
  short4: {type: 'short', size: 4},
  ushort2norm: {type: 'ushort', size: 2, normalized: true},
  ushort4norm: {type: 'ushort', size: 4, normalized: true},
  short2norm: {type: 'short', size: 1, normalized: true},
  short4norm: {type: 'short', size: 1, normalized: true},
  half2: {type: 'half', size: 2},
  half4: {type: 'half', size: 4},
  float: {type: 'float', size: 1},
  float2: {type: 'float', size: 2},
  float3: {type: 'float', size: 3},
  float4: {type: 'float', size: 4},
  uint: {type: 'uint', size: 1, integer: true},
  uint2: {type: 'uint', size: 2, integer: true},
  uint3: {type: 'uint', size: 3, integer: true},
  uint4: {type: 'uint', size: 4, integer: true},
  int: {type: 'int', size: 1, integer: true},
  int2: {type: 'int', size: 2, integer: true},
  int3: {type: 'int', size: 3, integer: true},
  int4: {type: 'int', size: 4, integer: true}
};

/**
 * Convert from WebGPU attribute format strings to accessor {type, size, normalized, integer}
 * @param {*} format
 *
export function mapWebGPUFormatToAccessor(format) {
  const accessorDefinition = FORMAT_TO_ACCESSOR[format];
  assert(accessorDefinition, 'invalid attribute format');
  return Object.freeze(accessorDefinition);
}

/**
 * Convert from accessor {type, size, normalized, integer} to WebGPU attribute format strings
 * @param {*} format
 *
export function mapAccessorToWebGPUFormat(accessor) {
  const {type = GL.FLOAT, size = 1, normalized = false, integer = false} = accessor;
  assert(size >=1 && size <=4);
  // `norm` suffix (uchar4norm)
  const norm = normalized ? 'norm' : '';
  // size 1 is ommitted in format names (float vs float2)
  const count = size === 1 ? '' : size;
  switch (type) {
    case GL.UNSIGNED_BYTE:
      switch (size) {
        case 2:
        case 4:
          return `uchar${count}${norm}`;
      }
    case GL.BYTE:
      switch (size) {
        case 2:
        case 4:
          return `char${count}${norm}`;
      }
    case GL.UNSIGNED_SHORT:
      switch (size) {
        case 2:
        case 4:
          return `ushort${count}${norm}`;
      }
    case GL.SHORT:
      switch (size) {
        case 2:
        case 4:
          return `short${count}${norm}`;
      }
    case GL.HALF_FLOAT:
      switch (size) {
        case 2:
        case 4:
          return `half${count}`;
      }
    case GL.FLOAT:
      return `float${count}`;
    case GL.UNSIGNED_INT:
      return `uint${count}`;
    case GL.INT:
      return `int${count}`;
  }
  throw new Error('illegal accessor');
}
*/ 
