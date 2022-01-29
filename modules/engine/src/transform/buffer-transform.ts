// luma.gl, MIT license

import {Device, Resource, assert} from '@luma.gl/core';
import {WebGLDevice, isWebGL2} from '@luma.gl/webgl';
import {WEBGLTransformFeedback as TransformFeedback} from '@luma.gl/webgl';
import {ClassicBuffer as Buffer, BufferProps} from '@luma.gl/webgl';

import type {TransformProps, TransformDrawOptions, TransformRunOptions} from './transform';
import {Model} from '../lib/model';

// import {TransformDrawOptions, TransformModelProps} from './resource-transform';
// export interface BufferTransform2 {
//   setupResources(opts: any): void;
//   updateModelProps(props?: {}): TransformProps;
//   getDrawOptions(opts?: {}): TransformDrawOptions;
//   swap(): boolean;
//   update(opts?: {}): void;
//   getBuffer(varyingName: any): any;
//   getData(options?: {varyingName: string}): any;
//   delete(): void;
// }

type BufferBinding = {
  sourceBuffers: Record<string, Buffer | {buffer: Buffer}>;
  feedbackBuffers?: Record<string, Buffer | {buffer: Buffer}>;
  transformFeedback?: TransformFeedback;
};

export class BufferTransform {
  device: WebGLDevice;
  gl: WebGL2RenderingContext;
  currentIndex = 0;
  feedbackMap: Record<string, string> = {};
  varyings: string[] | null = null; // varyings array
  bindings: BufferBinding[] = [];
  resources: Record<string, Resource<any>> = {}; // resources to be deleted

  constructor(device: Device, props: TransformProps = {}) {
    this.device = device;
    this.gl = (device as any).gl2 as WebGL2RenderingContext;
    this._initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  destroy(): void {
    for (const name in this.resources) {
      this.resources[name].destroy();
    }
  }

  /** @deprecated Use .destroy() */
  delete(): void {
    this.destroy();
  }

  setupResources(opts: {model: Model}): void {
    for (const binding of this.bindings) {
      this._setupTransformFeedback(binding, opts);
    }
  }

  updateModelProps(props: TransformProps = {}): TransformProps {
    const {varyings} = this;
    if (varyings.length > 0) {
      props = Object.assign({}, props, {varyings});
    }
    return props;
  }

  getDrawOptions(opts: TransformRunOptions = {}): TransformDrawOptions {
    const binding = this.bindings[this.currentIndex];
    const {sourceBuffers, transformFeedback} = binding;
    // @ts-expect-error
    const attributes = Object.assign({}, sourceBuffers, opts.attributes);
    return {attributes, transformFeedback};
  }

  swap(): boolean {
    if (this.feedbackMap) {
      this.currentIndex = this._getNextIndex();
      return true;
    }
    return false;
  }

  // update source and/or feedbackBuffers
  update(opts: TransformProps = {}) {
    this._setupBuffers(opts);
  }

  // returns current feedbackBuffer of given name
  getBuffer(varyingName: string): Buffer | null {
    const {feedbackBuffers} = this.bindings[this.currentIndex];
    const bufferOrParams = varyingName ? feedbackBuffers[varyingName] : null;
    if (!bufferOrParams) {
      return null;
    }
    return bufferOrParams instanceof Buffer ? bufferOrParams : bufferOrParams.buffer;
  }

  getData(options: {varyingName?: string} = {}) {
    const {varyingName} = options;
    const buffer = this.getBuffer(varyingName);
    if (buffer) {
      return buffer.getData();
    }
    return null;
  }

  // Private

  _initialize(props: TransformProps = {}): void {
    this._setupBuffers(props);
    this.varyings = props.varyings || Object.keys(this.bindings[this.currentIndex].feedbackBuffers);
    if (this.varyings.length > 0) {
      // if writting to buffers make sure it is WebGL2
      assert(isWebGL2(this.gl));
    }
  }

  // auto create feedback buffers if requested
  _getFeedbackBuffers(props: TransformProps): Record<string, Buffer> {
    const {sourceBuffers = {}} = props;
    const feedbackBuffers: Record<string, string | Buffer> = {};
    if (this.bindings[this.currentIndex]) {
      // this guarantees a partial feedback buffer set doesn't update
      // previously set buffers during auto creation mode.
      Object.assign(feedbackBuffers, this.bindings[this.currentIndex].feedbackBuffers);
    }
    if (this.feedbackMap) {
      // feedbackMap is defined as sourceBuffer as key and feedbackBuffer name as object
      for (const sourceName in this.feedbackMap) {
        const feedbackName = this.feedbackMap[sourceName];
        if (sourceName in sourceBuffers) {
          feedbackBuffers[feedbackName] = sourceName;
        }
      }
    }
    Object.assign(feedbackBuffers, props.feedbackBuffers);

    const feedbackBuffers2: Record<string, Buffer> = {};
    for (const bufferName in feedbackBuffers) {
      const bufferOrRef = feedbackBuffers[bufferName];
      if (typeof bufferOrRef === 'string') {
        // Create new buffer with same layout and settings as source buffer
        const sourceBuffer = sourceBuffers[bufferOrRef];
        const {byteLength, usage, accessor} = sourceBuffer;
        feedbackBuffers2[bufferName] = this._createNewBuffer(bufferName, {
          byteLength,
          usage,
          accessor
        });
      } else {
        feedbackBuffers2[bufferName] = bufferOrRef;
      }
    }

    return feedbackBuffers2;
  }

  _setupBuffers(props: TransformProps = {}) {
    const {sourceBuffers = null} = props;

    Object.assign(this.feedbackMap, props.feedbackMap);
    const feedbackBuffers = this._getFeedbackBuffers(props);
    this._updateBindings({sourceBuffers, feedbackBuffers});
  }

  _setupTransformFeedback(binding: BufferBinding, opts: {model: Model}): void {
    const {program} = opts.model;
    binding.transformFeedback = this.device.createTransformFeedback({
      layout: opts.model.pipeline,
      buffers: binding.feedbackBuffers
    });
  }

  _updateBindings(opts: TransformProps): void {
    this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], opts);
    if (this.feedbackMap) {
      const {sourceBuffers, feedbackBuffers} = this._swapBuffers(this.bindings[this.currentIndex]);
      const nextIndex = this._getNextIndex();
      this.bindings[nextIndex] = this._updateBinding(this.bindings[nextIndex], {
        sourceBuffers,
        feedbackBuffers
      });
    }
  }

  _updateBinding(binding: BufferBinding, opts) {
    if (!binding) {
      return {
        sourceBuffers: Object.assign({}, opts.sourceBuffers),
        feedbackBuffers: Object.assign({}, opts.feedbackBuffers)
      };
    }
    Object.assign(binding.sourceBuffers, opts.sourceBuffers);
    Object.assign(binding.feedbackBuffers, opts.feedbackBuffers);
    if (binding.transformFeedback) {
      binding.transformFeedback.setBuffers(binding.feedbackBuffers);
    }
    return binding;
  }

  _swapBuffers(opts): {sourceBuffers: Record<string, Buffer>; feedbackBuffers: Record<string, Buffer>} | null {
    if (!this.feedbackMap) {
      return null;
    }
    const sourceBuffers = Object.assign({}, opts.sourceBuffers);
    const feedbackBuffers = Object.assign({}, opts.feedbackBuffers);
    for (const srcName in this.feedbackMap) {
      const dstName = this.feedbackMap[srcName];
      sourceBuffers[srcName] = opts.feedbackBuffers[dstName];
      feedbackBuffers[dstName] = opts.sourceBuffers[srcName];

      // make sure the new destination buffer is a Buffer object
      assert(feedbackBuffers[dstName] instanceof Buffer);
    }
    return {sourceBuffers, feedbackBuffers};
  }

  // Create a buffer and add to list of buffers to be deleted.
  _createNewBuffer(name: string, opts: BufferProps): Buffer {
    const buffer = new Buffer(this.gl, opts);
    if (this.resources[name]) {
      this.resources[name].destroy();
    }
    this.resources[name] = buffer;
    return buffer;
  }

  _getNextIndex(): number {
    return (this.currentIndex + 1) % 2;
  }
}
