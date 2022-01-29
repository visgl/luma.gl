import type {ShaderLayout, TransformFeedbackProps} from '@luma.gl/api';
import {log, isObjectEmpty, TransformFeedback} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';
import {ClassicBuffer as Buffer, ClassicBuffer} from '../../classic/buffer';

  /** For bindRange */
export type BufferRange = {
  buffer: Buffer; 
  byteOffset?: number;
  byteLength?: number
};

export class WEBGLTransformFeedback extends TransformFeedback {
  get [Symbol.toStringTag](): string {
    return 'TransformFeedback';
  }

  readonly device: WebGLDevice;
  readonly gl2: WebGL2RenderingContext;
  readonly handle: WebGLTransformFeedback;
  readonly layout: ShaderLayout;
  buffers: Record<string, BufferRange> = {};
  unusedBuffers: Record<string, Buffer> = {};
  // NOTE: The `bindOnUse` flag is a major workaround:
  // See https://github.com/KhronosGroup/WebGL/issues/2346
  bindOnUse = true;
  configuration;
  // export class ClassicTransformFeedback extends WEBGLTransformFeedback {
  private _bound: boolean = false;

  constructor(device: WebGLDevice, props: TransformFeedbackProps) {
    super(device, props);

    device.assertWebGL2();
    this.device = device;
    this.gl2 = device.gl2;
    this.handle = this.props.handle || this.gl2.createTransformFeedback();
    this.layout = this.props.layout;

    try {
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
      for (const [locationOrName, bufferOrRange] of Object.entries(this.props.buffers as Record<string, ClassicBuffer | BufferRange>)) {
        const location = this._getVaryingIndex(locationOrName);
        const {buffer, byteOffset, byteLength} = this._getBufferRange(bufferOrRange);
        if (location < 0) {
          this.unusedBuffers[locationOrName] = buffer;
          log.warn(`${this.id} unused varying buffer ${locationOrName}`)();
          return this;
        }
        this.buffers[location] = {buffer, byteOffset, byteLength};
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
  }

  begin(primitiveMode = GL.POINTS): this {
    this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    if (this.bindOnUse) {
      this._bindBuffers();
    }
    this.gl2.beginTransformFeedback(primitiveMode);
    return this;
  }

  end(): this {
    this.gl2.endTransformFeedback();
    if (!this.bindOnUse) {
      this._unbindBuffers();
    }
    this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    return this;
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
        this.gl2.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), handle, byteOffset, byteLength);
      }
    }
  }

  _unbindBuffers(): void {
    for (const bufferIndex in this.buffers) {
      this.gl2.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
    }
  }

  // // Need to avoid chrome bug where buffer that is already bound to a different target
  // // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
  // _bindBuffers() {
  //   if (this.bindOnUse) {
  //     for (const bufferIndex in this.buffers) {
  //       const {buffer, byteLength, byteOffset} = this._getBufferRange(this.buffers[bufferIndex]);
  //       this._bindBuffer(bufferIndex, buffer, byteOffset, byteLength);
  //     }
  //   }
  // }

  // _unbindBuffers() {
  //   if (this.bindOnUse) {
  //     for (const bufferIndex in this.buffers) {
  //       this._bindBuffer(bufferIndex, null);
  //     }
  //   }
  // }

  _bindBuffer(index: number, buffer: Buffer, byteOffset: number = 0, byteLength?: number): this {
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

  initialize(props?: TransformFeedbackProps): this {
    this.buffers = {};
    this.unusedBuffers = {};
    this.configuration = null;
    this.bindOnUse = true;

    // Unbind any currently bound buffers
    if (!isObjectEmpty(this.buffers)) {
      this.bind(() => this._unbindBuffers());
    }

    this.setProps(props);
    return this;
  }

  setProps(props: TransformFeedbackProps) {
    // if ('program' in props) {
    //   this.configuration = props.program && props.program.configuration;
    // }
    // if ('configuration' in props) {
    //   this.configuration = props.configuration;
    // }
    // if ('bindOnUse' in props) {
    //   props = props.bindOnUse;
    // }
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

  setBuffer(locationOrName, bufferOrRange) {
    const location = this._getVaryingIndex(locationOrName);
    const {buffer, byteLength, byteOffset} = this._getBufferRange(bufferOrRange);

    if (location < 0) {
      this.unusedBuffers[locationOrName] = buffer;
      log.warn(`${this.id} unusedBuffers varying buffer ${locationOrName}`)();
      return this;
    }

    this.buffers[location] = bufferOrRange;

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
    bufferOrRange: Buffer | {buffer: Buffer; byteOffset?: number; byteSize?: number}
  ): BufferRange {
    let byteOffset;
    let byteLength;
    let buffer;
    if (!(bufferOrRange instanceof Buffer)) {
      buffer = bufferOrRange.buffer;
      byteLength = bufferOrRange.byteSize;
      byteOffset = bufferOrRange.byteOffset;
    } else {
      buffer = bufferOrRange;
    }

    // to use bindBufferRange, either offset or size must be specified, use default value for the other.
    if (byteOffset !== undefined || byteLength !== undefined) {
      byteOffset = byteOffset || 0;
      byteLength = byteLength || buffer.byteLength - byteOffset;
    }
    return {buffer, byteOffset, byteLength};
  }

  _getVaryingInfo(locationOrName) {
    return this.configuration && this.configuration.getVaryingInfo(locationOrName);
  }

  _getVaryingIndex(locationOrName) {
    if (this.configuration) {
      return this.configuration.getVaryingInfo(locationOrName).location;
    }
    const location = Number(locationOrName);
    return Number.isFinite(location) ? location : -1;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this.gl2.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, funcOrHandle);
      return this;
    }

    let value;

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
