export function buildHistopyramidBaseLevel(
  gl: WebGLRenderingContext,
  opts: any
): {
  textureData: any;
  baseTexture: any;
  flatPyramidTexture: any;
};
export function getHistoPyramid(
  gl: WebGLRenderingContext,
  opts: any
): {
  pyramidTextures: any[];
  flatPyramidTexture: any;
  levelCount: number;
  topLevelData: any;
};
export function histoPyramidGenerateIndices(
  gl: WebGLRenderingContext,
  opts: any
): {
  locationAndIndexBuffer: any;
};
