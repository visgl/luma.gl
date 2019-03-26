import GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';

export function getBuffersFromGeometry(gl, geometry) {
  const attributes = geometry.getAttributes();
  const buffers = {};

  for (const name in attributes) {
    const attribute = attributes[name];
    buffers[name] = new Buffer(gl, {
      data: attribute.value,
      target: attribute.isIndexed ? GL.ELEMENT_ARRAY_BUFFER : GL.ARRAY_BUFFER
    });
  }

  return buffers;
}
