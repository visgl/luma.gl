import {VertexFormat, AttributeBinding, assert} from '@luma.gl/api';

export type Attribute = {
  name: string;
  location: number;
  accessor: {
    format: VertexFormat;
    offset?: number;
    stride?: number;
    stepMode?: 'vertex' | 'instance';
    divisor?: number;
  }
};

// type InterleavedAttributes = {
//   byteStride?: number;
//   stepMode?: 
//   attributes: Attribute[];
// }

export function convertAttributesVertexBufferToLayout(attributes: Attribute[]): GPUVertexBufferLayout[] {
  const vertexBufferLayouts: GPUVertexBufferLayout[] = [];

  for (const attribute of attributes) {
    const arrayStride = attribute.accessor.stride || getVertexFormatBytes(attribute.accessor.format);
    const stepMode = attribute.accessor.stepMode || (attribute.accessor.divisor ? 'instance' : 'vertex');
    vertexBufferLayouts.push({
      arrayStride,
      stepMode,
      attributes: [
        {
          format: attribute.accessor.format,
          offset: attribute.accessor.offset || 0,
          shaderLocation: attribute.location
        }
      ]
    });
  }

  return vertexBufferLayouts;
}

function getVertexFormatBytes(format: GPUVertexFormat): number {
  const [type, count] = format.split('x');
  const bytes = getTypeBytes(type);
  assert(bytes);
  return bytes * parseInt(count);
}

const TYPE_SIZES = {
  uint8: 1,
  sint8: 1,
  unorm8: 1,
  snorm8: 1,
  uint16: 2,
  sint16: 2,
  unorm16: 2,
  snorm16: 2,
  float16: 2,
  float32: 4,
  uint32: 4,
  sint32: 4,
};

function getTypeBytes(type: string): number {
  const bytes = TYPE_SIZES[type];
  assert(bytes);
  return bytes;
}

/**
 * Attempt to convert legacy luma.gl accessors to attribute infos
 * @param bufferAccessors
 *
 function getVertexBuffers(bufferAccessors: BufferAccessors[]) {
  const vertexBuffers = [];

  for (const buffer of bufferAccessors) {
    let stride = null;
    let divisor = null;
    const attributes = [];

    for (const accessor of buffer.attributes) {
      if ('stride' in accessor) {
        stride = accessor.stride;
      }
      if ('divisor' in accessor) {
        divisor = accessor.divisor;
      }

      attributes.push({
        format: accessor.format || mapAccessorToWebGPUFormat(accessor),
        offset: accessor.offset || 0,
        location: accessor.location
      });
    }

    vertexBuffers.push({
      stride: buffer.stride || stride || 0,
      stepMode: buffer.stepMode || (divisor ? 'instance' : 'vertex'),
      attributes
    });
  }

  return vertexBuffers;
}
*/