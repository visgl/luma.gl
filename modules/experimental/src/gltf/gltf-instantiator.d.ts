import GroupNode from '../scenegraph/group-node';
import ModelNode from '../scenegraph/model-node';
import GLTFAnimator from './gltf-animator';

export default class GLTFInstantiator {
  constructor(gl: WebGLRenderingContext, options?: {});
  instantiate(gltf: any): any;
  createAnimator(): GLTFAnimator;
  createScene(gltfScene: any): GroupNode;
  createNode(gltfNode: any): any;
  createMesh(gltfMesh: any): any;
  getVertexCount(attributes: any): void;
  createPrimitive(gltfPrimitive: any, i: any, gltfMesh: any): ModelNode;
  createAttributes(attributes: any, indices: any): {};
  createBuffer(attribute: any, target: any): any;
  createAccessor(accessor: any, buffer: any): any;
  createSampler(gltfSampler: any): any;
  needsPOT(): boolean;
}
