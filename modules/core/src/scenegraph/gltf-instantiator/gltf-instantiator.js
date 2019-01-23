import Buffer from '../../webgl/buffer';
import Texture2D from '../../webgl/texture-2d';
import Group from '../group';
import Model from '../model';
import log from '../../utils/log';

const vs = `
  attribute vec3 POSITION;
  attribute vec3 NORMAL;
  attribute vec2 TEXCOORD_0;

  uniform mat4 uModel;
  uniform mat4 uView;
  uniform mat4 uProjection;

  varying vec3 normal;
  varying vec2 tc;

  void main(void) {
    gl_Position = uProjection * uView * uModel * vec4(POSITION, 1.0);
    normal = vec3(uModel * vec4(NORMAL, 0.0));
    tc = TEXCOORD_0;
  }
`;

const fs = `
  precision highp float;

  uniform sampler2D tex;

  varying vec3 normal;
  varying vec2 tc;

  void main(void) {
    float d = clamp(dot(normalize(normal), vec3(0,1,0)), 0.5, 1.0);
    vec4 t = texture2D(tex, vec2(tc.x, -tc.y));
    gl_FragColor = vec4(d * t.r, d * t.g, d * t.b, 1.0);
  }
`;

const DEFAULT_OPTIONS = {};

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

  getVertexCount(attributes) {
    // TODO: implement this
  }

  createPrimitive(gltfPrimitive, i, gltfMesh) {
    const attributes = this.createAttributes(gltfPrimitive.attributes, gltfPrimitive.indices);
    // TODO - handle gltfPrimitive.material

    const model = new Model(this.gl, {
      id: gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}=${i}`,
      drawMode: gltfPrimitive.mode || 4,
      vertexCount: gltfPrimitive.indices ? gltfPrimitive.indices.count : this.getVertexCount(gltfPrimitive.attributes),
      vs,
      fs
    });
    model.setProps({attributes});

    this.loadImage(0).then(img => model.setUniforms({ tex: new Texture2D(this.gl, { data: img }) }));
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

    log.info(4, "glTF Attributes", {attributes, generated: result})();

    return result;
  }

  createBuffer(accessor) {
    // TODO: make sure we only create one buffer per buffer view
    const opts = this.createAccessor(accessor);
    return new Buffer(this.gl, opts);
  }

  createAccessor(accessor) {
    if (accessor.bufferView.byteStride) {
      log.warn("bufferView has byteStride, see https://github.com/uber-web/loaders.gl/issues/45")();
    }

    return {
      type: accessor.componentType,
      offset: accessor.byteOffset || 0,
      stride: accessor.byteStride || 0, // see https://github.com/uber-web/loaders.gl/issues/45
      data: accessor.data
    };
  }

  loadImage(index) {
    const img = this.gltf.images[index].image;

    if (img.naturalWidth === 0 || img.complete === false) {
      // Image not loaded
      return new Promise(resolve => (img.onload = () => resolve(img)));
    }

    return Promise.resolve(img);
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
