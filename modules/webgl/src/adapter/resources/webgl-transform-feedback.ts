import type {PrimitiveTopology, ShaderLayout, TransformFeedbackProps} from '@luma.gl/core';
import {log, TransformFeedback, Buffer} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from '../..';
import { getGLPrimitive } from '../helpers/webgl-topology-utils';

/** For bindRange */
type BufferRange = {
  buffer: WEBGLBuffer;
  byteOffset?: number;
  byteLength?: number;
};

export class WEBGLTransformFeedback extends TransformFeedback {
  readonly device: WebGLDevice;
  readonly gl2: WebGL2RenderingContext;
  readonly handle: WebGLTransformFeedback;

  /**
   * NOTE: The Model already has this information while drawing, but
   * TransformFeedback currently needs it internally, to look up
   * varying information outside of a draw() call.
   */
  readonly layout: ShaderLayout;
  buffers: Record<string, BufferRange> = {};
  unusedBuffers: Record<string, Buffer> = {};
  /**
   * NOTE: The `bindOnUse` flag is a major workaround:
   * See https://github.com/KhronosGroup/WebGL/issues/2346
   */
  bindOnUse = true;
  private _bound: boolean = false;

  constructor(device: WebGLDevice, props: TransformFeedbackProps) {
    super(device, props);

    device.assertWebGL2();
    this.device = device;
    this.gl2 = device.gl2;
    this.handle = this.props.handle || this.gl2.createTransformFeedback();
    this.layout = this.props.layout;

    // TODO(v9): Should this logic exist in the constructor?
    try {
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
      for (const [locationOrName, bufferOrRange] of Object.entries(this.props.buffers)) {
        const location = this._getVaryingIndex(locationOrName);
        const range = this._getBufferRange(bufferOrRange as WEBGLBuffer | BufferRange);
        if (location < 0) {
          this.unusedBuffers[locationOrName] = range.buffer;
          log.warn(`${this.id} unused varying buffer ${locationOrName}`)();
          return this;
        }
        this.buffers[location] = range;
      }
    } finally {
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    }

    // Need to avoid chrome bug where buffer that is already bound to a different target
    // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
    if (!this.bindOnUse) {
      this._bindBuffers();
    }

    Object.seal(this);
  }

  override destroy(): void {
    this.gl2.deleteTransformFeedback(this.handle);
    super.destroy();
  }

  begin(topology: PrimitiveTopology = 'point-list'): void {
    this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    if (this.bindOnUse) {
      this._bindBuffers();
    }
    this.gl2.beginTransformFeedback(getGLPrimitive(topology));
  }

  end(): void {
    this.gl2.endTransformFeedback();
    if (!this.bindOnUse) {
      this._unbindBuffers();
    }
    this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
  }

  /**
   * Need to avoid chrome bug where buffer that is already bound to a different target
   * cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
   */
  _bindBuffers(): void {
    for (const bufferIndex in this.buffers) {
      const {buffer, byteLength, byteOffset} = this._getBufferRange(this.buffers[bufferIndex]);
      const handle = buffer && buffer.handle;
      if (!handle || byteLength === undefined) {
        this.gl2.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), handle);
      } else {
        this.gl2.bindBufferRange(
          GL.TRANSFORM_FEEDBACK_BUFFER,
          Number(bufferIndex),
          handle,
          byteOffset,
          byteLength
        );
      }
    }
  }

  _unbindBuffers(): void {
    for (const bufferIndex in this.buffers) {
      this.gl2.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
    }
  }

  _bindBuffer(
    index: number,
    buffer: WEBGLBuffer,
    byteOffset: number = 0,
    byteLength?: number
  ): this {
    const handle = buffer && buffer.handle;
    if (!handle || byteLength === undefined) {
      // @ts-expect-error
      this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle);
    } else {
      // @ts-expect-error
      this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle, byteOffset, byteLength);
    }
    return this;
  }

  // SUBCLASS

  setProps(props: TransformFeedbackProps) {
    if ('buffers' in props) {
      this.setBuffers(props.buffers);
    }
  }

  setBuffers(buffers = {}) {
    this.bind(() => {
      for (const bufferName in buffers) {
        this.setBuffer(bufferName, buffers[bufferName]);
      }
    });
    return this;
  }

  setBuffer(locationOrName: string | number, bufferOrRange: WEBGLBuffer) {
    const location = this._getVaryingIndex(locationOrName);
    const {buffer, byteLength, byteOffset} = this._getBufferRange(bufferOrRange);

    if (location < 0) {
      this.unusedBuffers[locationOrName] = buffer;
      log.warn(`${this.id} unusedBuffers varying buffer ${locationOrName}`)();
      return this;
    }

    this.buffers[location] = {buffer, byteLength, byteOffset};

    // Need to avoid chrome bug where buffer that is already bound to a different target
    // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
    if (!this.bindOnUse) {
      this._bindBuffer(location, buffer, byteOffset, byteLength);
    }

    return this;
  }

  // PRIVATE METHODS

  /** Extract offsets for bindBufferRange */
  _getBufferRange(
    bufferOrRange: WEBGLBuffer | {buffer: WEBGLBuffer; byteOffset?: number; byteLength?: number}
  ): Required<BufferRange> {
    if (bufferOrRange instanceof WEBGLBuffer) {
      return {buffer: bufferOrRange, byteOffset: 0, byteLength: bufferOrRange.byteLength};
    }

    // To use bindBufferRange either offset or size must be specified.
    const {buffer, byteOffset = 0, byteLength = bufferOrRange.buffer.byteLength} = bufferOrRange;
    return {buffer, byteOffset, byteLength};
  }

  _getVaryingInfo(locationOrName: string | number) {
    throw new Error(`${this.id} getVaryingInfo not implemented`);
  }

  _getVaryingIndex(locationOrName: string | number) {
    if (typeof locationOrName === 'number') {
      return locationOrName;
    }

    for (const varying of this.layout.varyings) {
      if (locationOrName === varying.name) {
        return varying.location;
      }
    }

    return -1;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, funcOrHandle);
      return this;
    }

    let value: unknown;

    if (!this._bound) {
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
      this._bound = true;
      value = funcOrHandle();
      this._bound = false;
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    } else {
      value = funcOrHandle();
    }

    return value;
  }

  unbind() {
    this.bind(null);
  }
}
