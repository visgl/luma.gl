import {assert, ResourceProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getBrowser} from '@probe.gl/env';

import {WebGLDevice} from '../webgl-device';
import {WebGLResource} from './webgl-resource';

import {WEBGLBuffer} from '../resources/webgl-buffer';

const ERR_ELEMENTS = 'elements must be GL.ELEMENT_ARRAY_BUFFER';

/**
 * VertexArrayObject properties
 */
export type VertexArrayObjectProps = ResourceProps & {
};

/** VertexArrayObject wrapper */
export class WEBGLVertexArrayObject extends WebGLResource<VertexArrayObjectProps> {
  override get [Symbol.toStringTag](): string {
    return 'BaseVertexArrayObject';
  }

  constructor(device: WebGLDevice, props?: VertexArrayObjectProps) {
    // @ts-expect-error
    super(device, props, {});
  }

  override _createHandle() {
    return this.gl2.createVertexArray();
  }

  override _deleteHandle(): void {
    this.gl2.deleteVertexArray(this.handle);
    // @ts-expect-error
    return [this.elements];
    // return [this.elements, ...this.buffers];
  }

  override _bindHandle(handle: WEBGLVertexArrayObject): void {
    this.gl2.bindVertexArray(handle);
  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer: WEBGLBuffer | null = null, opts = {}) {
    assert(!elementBuffer || elementBuffer.target === GL.ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);

    // The GL.ELEMENT_ARRAY_BUFFER_BINDING is stored on the VertexArrayObject...
    this.bind(() => {
      this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, elementBuffer ? elementBuffer.handle : null);
    });

    return this;
  }

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location: number, buffer: WEBGLBuffer, accessor: any): this {
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
