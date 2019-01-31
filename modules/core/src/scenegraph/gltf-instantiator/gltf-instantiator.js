import Buffer from '../../webgl/buffer';
import Accessor from '../../webgl/accessor';
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

const DEFAULT_ATTRIBUTES = {
  POSITION: {constant: true, value: [0, 0, 0]},
  NORMAL: {constant: true, value: [0, 0, 0]},
  TEXCOORD_0: {constant: true, value: [0, 0]}
};

const ATTRIBUTE_TYPE_TO_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

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
      node.setMatrixComponents({
        position: gltfNode.translation,
        // rotation: gltfNode.rotation, // TODO: fix quaternion problem
        scale: gltfNode.scale
      });
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
    const attributes = this.createAttributes(gltfPrimitive.attributes, gltfPrimitive.indices);

    const model = new Model(this.gl, {
      id: gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}-primitive-${i}`,
      drawMode: gltfPrimitive.mode || 4,
      vertexCount: gltfPrimitive.indices
        ? gltfPrimitive.indices.count
        : this.getVertexCount(gltfPrimitive.attributes),
      vs,
      fs
    });
    model.setProps({attributes});

    // TODO: handle case of having no material
    if (gltfPrimitive.material) {
      this.configureMaterial(model, gltfPrimitive.material);
    }

    return model;
  }

  configureMaterial(model, material) {
    // TODO: process remaining tex types
    if (material.pbrMetallicRoughness) {
      if (material.pbrMetallicRoughness.baseColorTexture) {
        this.configureTexture(material.pbrMetallicRoughness.baseColorTexture, model);
      }
    }
  }

  createAttributes(attributes, indices) {
    const result = {};

    Object.keys(attributes).forEach(attrName => {
      result[attrName] = this.createAccessor(
        attributes[attrName],
        this.createBuffer(attributes[attrName].bufferView, this.gl.ARRAY_BUFFER)
      );
    });

    if (indices) {
      result.indices = this.createAccessor(
        indices,
        this.createBuffer(indices.bufferView, this.gl.ELEMENT_ARRAY_BUFFER)
      );
    }

    log.info(4, 'glTF Attributes', {attributes, indices, generated: result})();

    return Object.assign({}, DEFAULT_ATTRIBUTES, result);
  }

  createBuffer(bufferView, target) {
    const name = `_luma_buffer_${target}`;

    if (!bufferView[name]) {
      bufferView[name] = new Buffer(this.gl, {
        id: `from-${bufferView.id}`,
        data: bufferView.data,
        target
      });
    }

    return bufferView[name];
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

  configureTexture(gltfTexture, model) {
    const parameters =
      (gltfTexture.texture &&
        gltfTexture.texture.sampler &&
        gltfTexture.texture.sampler.parameters) ||
      {};

    const tex = new Texture2D(this.gl, {
      id: gltfTexture.name || gltfTexture.id,
      parameters,
      data: gltfTexture.texture.source.getImageAsync()
    });
    model.setUniforms({tex});
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
