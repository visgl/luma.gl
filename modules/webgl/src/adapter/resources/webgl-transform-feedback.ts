import type {PrimitiveTopology, ShaderLayout, TransformFeedbackProps} from '@luma.gl/core';
import {log, TransformFeedback, Buffer} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from '../..';
import {getGLPrimitive} from '../helpers/webgl-topology-utils';

/** For bindRange */
type BufferRange = {
  buffer: Buffer;
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
   * Allows us to avoid a Chrome bug where a buffer that is already bound to a
   * different target cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
   * This a major workaround, see: https://github.com/KhronosGroup/WebGL/issues/2346
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

    if (props.buffers) {
      this.setBuffers(props.buffers);
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

  // SUBCLASS

  setBuffers(buffers: Record<string, Buffer | BufferRange>) {
    this.buffers = {};
    this.unusedBuffers = {};

    this.bind(() => {
      for (const bufferName in buffers) {
        this.setBuffer(bufferName, buffers[bufferName]);
      }
    });
    return this;
  }

  setBuffer(locationOrName: string | number, bufferOrRange: Buffer | BufferRange) {
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

  // PRIVATE METHODS

  /** Extract offsets for bindBufferRange */
  protected _getBufferRange(
    bufferOrRange: Buffer | {buffer: Buffer; byteOffset?: number; byteLength?: number}
  ): Required<BufferRange> {
    if (bufferOrRange instanceof WEBGLBuffer) {
      return {buffer: bufferOrRange, byteOffset: 0, byteLength: bufferOrRange.byteLength};
    }

    // To use bindBufferRange either offset or size must be specified.
    // @ts-expect-error Must be a BufferRange.
    const {buffer, byteOffset = 0, byteLength = bufferOrRange.buffer.byteLength} = bufferOrRange;
    return {buffer, byteOffset, byteLength};
  }

  protected _getVaryingIndex(locationOrName: string | number) {
    if (isIndex(locationOrName)) {
      return Number(locationOrName);
    }

    for (const varying of this.layout.varyings) {
      if (locationOrName === varying.name) {
        return varying.location;
      }
    }

    return -1;
  }

  /**
   * Need to avoid chrome bug where buffer that is already bound to a different target
   * cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
   */
  protected _bindBuffers(): void {
    for (const bufferIndex in this.buffers) {
      const {buffer, byteLength, byteOffset} = this._getBufferRange(this.buffers[bufferIndex]);
      this._bindBuffer(Number(bufferIndex), buffer, byteOffset, byteLength);
    }
  }

  protected _unbindBuffers(): void {
    for (const bufferIndex in this.buffers) {
      this.gl2.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
    }
  }

  protected _bindBuffer(
    index: number,
    buffer: Buffer,
    byteOffset = 0,
    byteLength?: number
  ): this {
    const handle = buffer && (buffer as WEBGLBuffer).handle;
    if (!handle || byteLength === undefined) {
      this.gl2.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle);
    } else {
      this.gl2.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle, byteOffset, byteLength);
    }
    return this;
  }
}

/**
 * Returns true if the given value is an integer, or a string that
 * trivially converts to an integer (only numeric characters).
 */
function isIndex(value: string | number): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value);
  }
  return /^\d+$/.test(value);
}
