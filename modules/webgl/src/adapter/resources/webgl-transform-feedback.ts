import type {PrimitiveTopology, ShaderLayout, TransformFeedbackProps} from '@luma.gl/core';
import {log, TransformFeedback, Buffer, BufferRange} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from '../../index';
import {getGLPrimitive} from '../helpers/webgl-topology-utils';

export class WEBGLTransformFeedback extends TransformFeedback {
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
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

    this.device = device;
    this.gl = device.gl;
    this.handle = this.props.handle || this.gl.createTransformFeedback();
    this.layout = this.props.layout;

    if (props.buffers) {
      this.setBuffers(props.buffers);
    }

    Object.seal(this);
  }

  override destroy(): void {
    this.gl.deleteTransformFeedback(this.handle);
    super.destroy();
  }

  begin(topology: PrimitiveTopology = 'point-list'): void {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    if (this.bindOnUse) {
      this._bindBuffers();
    }
    this.gl.beginTransformFeedback(getGLPrimitive(topology));
  }

  end(): void {
    this.gl.endTransformFeedback();
    if (this.bindOnUse) {
      this._unbindBuffers();
    }
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
  }

  // SUBCLASS

  setBuffers(buffers: Record<string, Buffer | BufferRange>): void {
    this.buffers = {};
    this.unusedBuffers = {};

    this.bind(() => {
      for (const bufferName in buffers) {
        this.setBuffer(bufferName, buffers[bufferName]);
      }
    });
  }

  setBuffer(locationOrName: string | number, bufferOrRange: Buffer | BufferRange): void {
    const location = this._getVaryingIndex(locationOrName);
    const {buffer, byteLength, byteOffset} = this._getBufferRange(bufferOrRange);

    if (location < 0) {
      this.unusedBuffers[locationOrName] = buffer;
      log.warn(`${this.id} unusedBuffers varying buffer ${locationOrName}`)();
      return;
    }

    this.buffers[location] = {buffer, byteLength, byteOffset};

    // Need to avoid chrome bug where buffer that is already bound to a different target
    // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
    if (!this.bindOnUse) {
      this._bindBuffer(location, buffer, byteOffset, byteLength);
    }
  }

  getBuffer(locationOrName: string | number): Buffer | BufferRange | null {
    if (isIndex(locationOrName)) {
      return this.buffers[locationOrName] || null;
    }
    const location = this._getVaryingIndex(locationOrName);
    return location >= 0 ? this.buffers[location] : null;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, funcOrHandle);
      return this;
    }

    let value: unknown;

    if (!this._bound) {
      this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
      this._bound = true;
      value = funcOrHandle();
      this._bound = false;
      this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
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

  protected _getVaryingIndex(locationOrName: string | number): number {
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
      this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
    }
  }

  protected _bindBuffer(index: number, buffer: Buffer, byteOffset = 0, byteLength?: number): void {
    const handle = buffer && (buffer as WEBGLBuffer).handle;
    if (!handle || byteLength === undefined) {
      this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle);
    } else {
      this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle, byteOffset, byteLength);
    }
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
