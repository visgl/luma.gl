import Buffer from '../../webgl/buffer';
import Group from '../group';
import Model from '../model';

// GLTF instantiator for luma.gl
// Walks the parsed and resolved glTF structure and builds a luma.gl scenegraph
export default class GLTFInstantiator {
  constructor(gl, options = {}) {
    this.gl = gl;
    this.options = options;
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
    const children = gltfMeshes.map(child => this.createNode(child));
    // TODO: Check if we can have both children nodes and meshes!
    if (gltfNode.mesh) {
      children.push(this.createMesh(gltfNode.mesh));
    }
    const node = new Group({
      id: gltfNode.name || gltfNode.id,
      children
    });
    if (gltfNode.matrix) {
      node.setMatrix(gltfNode.matrix);
    }
    return node;
  }

  createMesh(gltfMesh) {
    // TODO: avoid changing the gltf
    if (!gltfMesh._mesh) {
      const gltfPrimitives = gltfMesh.primitives || [];
      const primitives = gltfPrimitives.map(
        (gltfPrimitive, i) => this.createPrimitive(gltfPrimitive, i, gltfMesh)
      );
      const mesh = new Group({
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
    const model = new Model(this.gl, {
      id: gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}=${i}`,
      drawMode: gltfPrimitive.mode || 4,
      vertexCount: 2046 // from indices count
    });
    model.setProps({attributes});
    this.options.getImage(0).then(img => model.setUniforms({ tex: img }));
    return model;
  }

  createAttributes(attributes, indices) {
    const result = {};
    Object.keys(attributes).forEach(attrName => {
      result[attrName] = this.createBuffer(attributes[attrName]);
    });
    if (indices) {
      const opts = Object.assign({target: this.gl.ELEMENT_ARRAY_BUFFER}, this.createAccessor(indices));
      result.indices = new Buffer(this.gl, opts);
    }
    console.log("attributes>>", attributes, result);
    return result;
  }

  createBuffer(accessor) {
    const opts = this.createAccessor(accessor);
    return new Buffer(this.gl, opts);
  }

  createAccessor(accessor) {
    console.log("AAAA",accessor)
    if (accessor.bufferView.byteStride) {
      console.log("bufferView has byteStride, see https://github.com/uber-web/loaders.gl/issues/45");
    }

    return {
      type: accessor.componentType,
      // size: accessor.count, ????
      offset: accessor.byteOffset || 0,
      stride: accessor.byteStride || 0,
      data: accessor.data
    };
  }

  // createTexture(gltfTexture) {
  //   if (!gltfTexture._texture) {
  //     const texture = Texture2D(this.gl, {
  //       id: gltfTexture.name || gltfTexture.id,
  //       // TODO - create sampler in WebGL2
  //       parameters: gltfTexture.sampler.parameters
  //     });
  //     gltfTexture._texture = texture;
  //   }
  //   return gltfTexture._texture;
  // }

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
