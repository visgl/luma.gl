export type TransformDrawOptions = {
  attributes?: object;
  framebuffer?: any;
  uniforms?: object;
  discard?: boolean;
  parameters?: object;
  transformFeedback?: any;
};

export type TransformModelProps = {
  vs: any;
  fs: any;
  modules: any;
  uniforms: any;
  inject: any;
};
