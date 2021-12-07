
/** Get WebGPU style feature strings */
export function getDeviceFeatures(gl: WebGLRenderingContext): Set<string> {
  const features = new Set<string>();
  // features.add('depth-clamping'); // GPUPrimitiveState.clampDepth
  // features.add('depth24unorm-stencil8'); // GPUTextureFormat 'depth24unorm-stencil8'.
  // features.add('depth32float-stencil8'); // GPUTextureFormat 'depth32float-stencil8'.
  // features.add('pipeline-statistics-query'); // GPUQueryType "pipeline-statistics"
  // features.add('timestamp-query'); // GPUQueryType "timestamp-query"
  // TODO
  // features.add('texture-compression-bc'); //  GPUQueryType "timestamp"
  // TODO
  return features;
}
