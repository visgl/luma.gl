// luma.gl, MIT license
import {Texture} from "@luma.gl/api";
import {GLParameters} from "@luma.gl/webgl";
import {default as Framebuffer} from "../classic/framebuffer";
import {default as Buffer} from '../classic/buffer';
import {default as Texture2D} from '../classic/texture-2d';
import {default as TransformFeedback} from '../classic/transform-feedback';

/** Properties for creating Transforms */
export type TransformProps = {
  id?: string;
  vs?: string;
  elementCount?: number;
  sourceBuffers?: Record<string, Buffer>;
  feedbackBuffers?: Record<string, string | Buffer | {buffer: Buffer, byteOffset?: number}>;
  varyings?: string[];
  feedbackMap?: Record<string, string>;
  modules?: object[]; // TODO use ShaderModule type
  attributes?: Record<string, any>;
  uniforms?: Record<string, any>;
  parameters?: GLParameters;
  discard?: boolean;
  isIndexed?: boolean;
  _sourceTextures?: Record<string, Texture2D>;
  _targetTexture?: string | Texture2D;
  _targetTextureVarying?: string;
  _swapTexture?: string | null;
  _fs?: string;
  fs?: string;
  inject?: Record<string, string>;
  drawMode?: number;
};

/** Options that can be provided when running a Transform */
export type TransformRunOptions = {
  clearRenderTarget?: boolean;
  uniforms?: Record<string, any>;
  parameters?: Record<string, any>;
};

/** Options that control drawing a Transform. Used by subclasses to return draw parameters */
export type TransformDrawOptions = {
  attributes?: Record<string, any>;
  framebuffer?: any;
  uniforms?: object;
  discard?: boolean;
  parameters?: object;
  transformFeedback?: any;
};

export type TransformBinding = {
  sourceBuffers: Record<string, Buffer>;
  sourceTextures: Record<string, Texture>;
  feedbackBuffers?: Record<string, Buffer | {buffer: Buffer}>;
  transformFeedback?: TransformFeedback;
  framebuffer?: Framebuffer;
  targetTexture?: Texture2D;
};
