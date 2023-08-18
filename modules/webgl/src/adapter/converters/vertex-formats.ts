import {GL} from '@luma.gl/constants';
import {VertexFormat} from '@luma.gl/core';

export function getVertexFormat(type: GL, components: number): VertexFormat {
  const base = getDataFormat(type);
  switch (components) {
    case 1: return base;
    case 2: return `${base}x2`;
    case 3: return `${base}x3`;
    case 4: return `${base}x4`;
    default: throw new Error(String(components));
  }
}

function getDataFormat(type: GL): 'sint32' | 'uint32' | 'float32' {
  switch (type) {
    // TODO
    case GL.INT: return 'sint32';
    case GL.UNSIGNED_INT: return 'uint32';
    case GL.FLOAT: return 'float32';
    default: throw new Error(String(type));
  }
}