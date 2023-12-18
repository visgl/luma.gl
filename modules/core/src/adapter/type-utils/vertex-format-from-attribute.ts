// luma.gl, MIT licese
import {TypedArray} from '../..';
import {DataType, VertexFormat} from '../types/vertex-formats';

/** Get the vertex format for an attribute with TypedArray value and size*/
export function getVertexFormatFromAttribute({value, size}: {value: TypedArray, size?: number}): VertexFormat {
  if(!size || size > 4) {
    throw new Error(`Invalid attribute size ${size}`);
  }

  const components = size as 1 | 2 | 3 | 4;
  let dataType: DataType;
  if (value instanceof Uint8Array  || value instanceof Uint8ClampedArray) {
    dataType = 'uint8';
  } else if (value instanceof Int8Array) {
    dataType = 'sint8';
  } else if (value instanceof Uint16Array) {
    dataType = 'uint16';
  } else if (value instanceof Int16Array) {
    dataType = 'sint16';
  } else if (value instanceof Uint32Array) {
    dataType = 'uint32';
  } else if (value instanceof Int32Array) {
    dataType = 'sint32';
  } else if (value instanceof Float32Array) {
    dataType = 'float32';
  } else {
    throw new Error(`Unknown attribute format ${value.constructor.name}`);
  }

  if (dataType === 'uint8' || dataType === 'sint8') {
    if (components === 1 || components === 3) {
      throw new Error('WebGPU only supports 16 bit aligned formats');
    }
    return `${dataType}x${components}`;
  }
  if (dataType === 'uint16' || dataType === 'sint16') {
    if (components === 1 || components === 3) {
      throw new Error('WebGPU only supports 32 bit aligned formats');
    }
    return `${dataType}x${components}`;
  }

  if (components === 1) {
    return dataType;
  }

  return `${dataType}x${components}`;
}

