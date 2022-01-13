/*
import {getFeatures} from '@luma.gl/webgl';

export function getWebGLFeatures(gl: WebGLRenderingContext): string[] {
  const features = getFeatures();

  let featureList: string[] = [];
  for (const featureName in features) {
    if (features[featureName]) {
      const fixedFeatureName = featureName.toLowerCase().replace('_', '-');
      featureList.push(fixedFeatureName);
    }
  }

  /* TODO - Handle WebGPU feature constants
    "depth-clamping",
    "depth24unorm-stencil8",
    "depth32float-stencil8",
    "pipeline-statistics-query", (false)
    "texture-compression-bc",
    "timestamp-query",
  *

  return featureList;
}
*/
