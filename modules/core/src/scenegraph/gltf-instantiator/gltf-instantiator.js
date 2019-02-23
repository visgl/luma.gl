import {Matrix4} from 'math.gl';
import {Buffer, Accessor} from '../../webgl';
import Group from '../group';
import log from '../../utils/log';

import {createGLTFModel} from './gltf-material';

// TODO: import {ATTRIBUTE_TYPE_TO_COMPONENTS} from '@loaders.gl/gltf';
const ATTRIBUTE_TYPE_TO_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const DEFAULT_OPTIONS = {
  modelOptions: {},
  pbrDebug: false,
  pbrIbl: null
};

// GLTF instantiator for luma.gl
// Walks the parsed and resolved glTF structure and builds a luma.gl scenegraph
export default class GLTFInstantiator {
  constructor(gl, options = {}) {
    this.gl = gl;
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  }

  instantiate(gltf) {
    this.gltf = gltf;
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

    // Node can have children nodes and meshes at the same time
    if (gltfNode.mesh) {
      children.push(this.createMesh(gltfNode.mesh));
    }

    const node = new Group({
      id: gltfNode.name || gltfNode.id,
      children
    });

    if (gltfNode.matrix) {
      node.setMatrix(gltfNode.matrix);
    } else {
      node.matrix.identity();

      if (gltfNode.translation) {
        node.matrix.translate(gltfNode.translation);
      }

      if (gltfNode.rotation) {
        const rotationMatrix = new Matrix4().fromQuaternion(gltfNode.rotation);
        node.matrix.multiplyRight(rotationMatrix);
      }

      if (gltfNode.scale) {
        node.matrix.scale(gltfNode.scale);
      }
    }

    return node;
  }

  createMesh(gltfMesh) {
    // TODO: avoid changing the gltf
    if (!gltfMesh._mesh) {
      const gltfPrimitives = gltfMesh.primitives || [];
      const primitives = gltfPrimitives.map((gltfPrimitive, i) =>
        this.createPrimitive(gltfPrimitive, i, gltfMesh)
      );
      const mesh = new Group({
        id: gltfMesh.name || gltfMesh.id,
        children: primitives
      });
      gltfMesh._mesh = mesh;
    }

    return gltfMesh._mesh;
  }

  getVertexCount(attributes) {
    // TODO: implement this
    log.warn('getVertexCount() not found')();
  }

  createPrimitive(gltfPrimitive, i, gltfMesh) {
    const model = createGLTFModel(this.gl, {
      id: gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}-primitive-${i}`,
      drawMode: gltfPrimitive.mode || 4,
      vertexCount: gltfPrimitive.indices
        ? gltfPrimitive.indices.count
        : this.getVertexCount(gltfPrimitive.attributes),
      attributes: this.createAttributes(gltfPrimitive.attributes, gltfPrimitive.indices),
      material: gltfPrimitive.material,
      modelOptions: this.options.modelOptions,
      debug: this.options.pbrDebug,
      ibl: this.options.pbrIbl
    });

    return model;
  }

  createAttributes(attributes, indices) {
    const loadedAttributes = {};

    Object.keys(attributes).forEach(attrName => {
      loadedAttributes[attrName] = this.createAccessor(
        attributes[attrName],
        this.createBuffer(attributes[attrName].bufferView, this.gl.ARRAY_BUFFER)
      );
    });

    if (indices) {
      loadedAttributes.indices = this.createAccessor(
        indices,
        this.createBuffer(indices.bufferView, this.gl.ELEMENT_ARRAY_BUFFER)
      );
    }

    log.info(4, 'glTF Attributes', {attributes, indices, generated: loadedAttributes})();

    return loadedAttributes;
  }

  createBuffer(bufferView, target) {
    if (!bufferView.lumaBuffers) {
      bufferView.lumaBuffers = {};
    }

    if (!bufferView.lumaBuffers[target]) {
      bufferView.lumaBuffers[target] = new Buffer(this.gl, {
        id: `from-${bufferView.id}`,
        data: bufferView.data,
        target
      });
    }

    return bufferView.lumaBuffers[target];
  }

  createAccessor(accessor, buffer) {
    return new Accessor({
      buffer,
      offset: accessor.byteOffset || 0,
      stride: accessor.bufferView.byteStride || 0,
      type: accessor.componentType,
      size: ATTRIBUTE_TYPE_TO_COMPONENTS[accessor.type]
    });
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
