import {Buffer, Texture2D, Model, Group} from 'luma.gl';

// GLTF instantiator for luma.gl
// Walks the parsed and resolved glTF structure and builds a luma.gl scenegraph
export default class GLTFInstantiator {
  constructor(gl) {
    this.gl = gl;
    this.options = {
      removeEmptyGroups: true
    };
  }

  instantiate(gltf) {
    const scenes = (gltf.scenes || []).map(scene => this.createScene(scene));
    return scenes;
  }

  createScene(gltfScene) {
    const gltfNodes = gltfScene.nodes || [];
    const nodes = gltfNodes.map(node => this.createNode(node));
    const scene = new Group({
      id: gltfScene.name || gltfScene.id,
      children: nodes
    });
    return scene;
  }

  createNode(gltfNode) {
    const gltfMeshes = gltfNode.children || [];
    const meshes = gltfMeshes.map(node => this.createMesh(node));
    // Option: Avoid group if single Mesh
    let node = (this.options.removeEmptyGroups && meshes.length === 1) && meshes[0];
    node = node || new Group({
      id: gltfNode.name || gltfNode.id,
      children: meshes
    });
    return node;
  }

  createMesh(gltfMesh) {
    if (!gltfMesh._mesh) {
      const gltfPrimitives = gltfMesh.primitives || [];
      const primitives = gltfPrimitives.map(
        (gltfPrimitive, i) => this.createPrimitive(gltfPrimitive, i, gltfMesh)
      );
      // Option: avoid group if single Primitive
      let mesh = (this.options.removeEmptyGroups && primitives.length === 1) && primitives[0];
      mesh = mesh || new Group({
        id: gltfMesh.name || gltfMesh.id,
        children: primitives
      });
      gltfMesh._mesh = mesh;
    }
    return gltfMesh._mesh;
  }

  createPrimitive(gltfPrimitive, i, gltfMesh) {
    const attributes = this.createAttributes(gltfPrimitive.attributes, gltfPrimitive.indices);
    // TODO - handle gltfPrimitive.material
    return new Model(this.gl, {
      id: gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}=${i}`,
      attributes,
      drawMode: gltfPrimitive.mode
    });
  }

  createAttributes(attributes, indices) {
    return {};
  }

  createBuffer(accessor) {
    accessor = this.createAccessor(accessor);
    return new Buffer(this.gl, accessor).setData();
  }

  createAccessor(accessor) {
    return null;
    /*
    return new Accessor({
      type: accessor.componentType,
      size: accessor.components,
      offset: accessor.byteOffset || 0,
      stride: accessor.byteStride || 0
    });
    */
  }

  createTexture(gltfTexture) {
    if (!gltfTexture._texture) {
      const texture = Texture2D(this.gl, {
        id: gltfTexture.name || gltfTexture.id,
        // TODO - create sampler in WebGL2
        parameters: gltfTexture.sampler.parameters
      });
      gltfTexture._texture = texture;
    }
    return gltfTexture._texture;
  }

  // TODO - create sampler in WebGL2
  createSampler(gltfSampler) {
    return gltfSampler;
  }

  // Helper methods (move to GLTFLoader.resolve...?)

  needsPOT() {
    // Has a wrapping mode (either wrapS or wrapT) equal to REPEAT or MIRRORED_REPEAT, or
    // Has a minification filter (minFilter) that uses mipmapping
    // (NEAREST_MIPMAP_NEAREST, NEAREST_MIPMAP_LINEAR,
    // LINEAR_MIPMAP_NEAREST, or LINEAR_MIPMAP_LINEAR).
    return false;
  }
}
