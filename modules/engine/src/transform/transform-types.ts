/** Properties for creating Transforms */
export type TransformProps = {
  id?: string;
  vs?: string;
  elementCount?: number;
  sourceBuffers?: object;
  feedbackBuffers?: object;
  varyings?: string[];
  feedbackMap?: object;
  modules?: object[]; // TODO use ShaderModule type
  attributes?: any;
  uniforms?: any;
  parameters?: any;
  discard?: boolean;
  isIndexed?: boolean;
  _sourceTextures?: any;
  _targetTexture?: any;
  _targetTextureVarying?: string;
  _swapTexture?: string;
  _fs?: string;
  fs?: string;
  inject?: any;
  drawMode?: number;
};

/** Options that can be provided when running a Transform */
export type TransformRunOptions = {
  clearRenderTarget?: boolean;
  uniforms: Record<string, any>;
};

/** Options that control drawing a Transform. Used by subclasses to return draw parameters */
export type TransformDrawOptions = {
  attributes?: object;
  framebuffer?: any;
  uniforms?: object;
  discard?: boolean;
  parameters?: object;
  transformFeedback?: any;
};

export type TransformBinding = {sourceBuffers, feedbackBuffers, transformFeedback};
