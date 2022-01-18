import type {NumberArray} from '@luma.gl/api';
import {assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getBrowser} from '@probe.gl/env';

import WebGLDevice from '../webgl-device';
import WebGLResource, {ResourceProps} from './webgl-resource';

import Buffer from '../../classes/webgl-buffer';
import Program from '../../classes/program';
import {VertexArrayObject} from '../..';

const ERR_ELEMENTS = 'elements must be GL.ELEMENT_ARRAY_BUFFER';

/**
 * VertexArrayObject properties
 * @param constantAttributeZero Attribute 0 can not be disable on most desktop OpenGL based browsers
 * and on iOS Safari browser.
 */
export type VertexArrayObjectProps = ResourceProps & {
  constantAttributeZero?: boolean;
  program?: Program;
  isDefaultArray?: boolean;
};

export default class WEBGLVertexArrayObject extends WebGLResource<VertexArrayObjectProps> {
  get [Symbol.toStringTag](): string {
    return 'BaseVertexArrayObject';
  }

  constructor(device: WebGLDevice, props: VertexArrayObjectProps) {
    // @ts-expect-error
    super(device, props, {});
  }

  _createHandle() {
    return this.gl2.createVertexArray();
  }

  _deleteHandle(): void {
    this.gl2.deleteVertexArray(this.handle);
    // @ts-expect-error
    return [this.elements];
    // return [this.elements, ...this.buffers];
  }

  _bindHandle(handle): void {
    this.gl2.bindVertexArray(handle);
  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer: Buffer = null, opts = {}) {
    assert(!elementBuffer || elementBuffer.target === GL.ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);

    // The GL.ELEMENT_ARRAY_BUFFER_BINDING is stored on the VertexArrayObject...
    this.bind(() => {
      this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, elementBuffer ? elementBuffer.handle : null);
    });

    return this;
  }

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location: number, buffer: Buffer, accessor: any): this {
    // Check target
    if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
      return this.setElementBuffer(buffer, accessor);
    }

    const {size, type, stride, offset, normalized, integer, divisor} = accessor;

    const {gl, gl2} = this;
    location = Number(location);

    this.bind(() => {
      // A non-zero buffer object must be bound to the GL_ARRAY_BUFFER target
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.handle);

      // WebGL2 supports *integer* data formats, i.e. GPU will see integer values
      if (integer) {
        this.device.assertWebGL2();
        gl2.vertexAttribIPointer(location, size, type, stride, offset);
      } else {
        // Attaches ARRAY_BUFFER with specified buffer format to location
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
      }
      gl.enableVertexAttribArray(location);
      gl2.vertexAttribDivisor(location, divisor || 0);

      // NOTE We don't unbind buffer here, typically another buffer will be bound just after
    });

    return this;
  }

  /**
   * Enabling an attribute location makes it reference the currently bound buffer
   *  Disabling an attribute location makes it reference the global constant value
   * TODO - handle single values for size 1 attributes?
   * TODO - convert classic arrays based on known type?
   */
  enable(location: number, enable = true): this {
    // Attribute 0 cannot be disabled in most desktop OpenGL based browsers...
    const canDisableAttributeZero = this.device.isWebGL2 || getBrowser() === 'Chrome';
    const canDisableAttribute = canDisableAttributeZero || location !== 0;

    if (enable || canDisableAttribute) {
      location = Number(location);
      this.bind(() =>
        enable
          ? this.gl.enableVertexAttribArray(location)
          : this.gl.disableVertexAttribArray(location)
      );
    }
    return this;
  }
}
