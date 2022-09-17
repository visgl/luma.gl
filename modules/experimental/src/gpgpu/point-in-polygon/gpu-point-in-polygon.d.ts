export default class GPUPointInPolygon {
  constructor(gl: WebGLRenderingContext, props?: {});
  update(props?: {polygons: any; textureSize?: any}): void;
  filter(options: {positionBuffer: any; filterValueIndexBuffer: any; count: any}): void;
  _setupResources(): void;
  _updateResources(vertices: any, indices: any, ids: any, vertexCount: any): void;
}
