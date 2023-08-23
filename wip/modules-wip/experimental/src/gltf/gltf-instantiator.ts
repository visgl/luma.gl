import {Device, Buffer, log, PrimitiveTopology} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {Accessor} from '@luma.gl/webglx';
import {Model} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {GroupNode} from '../scenegraph/group-node';
import {ModelNode} from '../scenegraph/model-node';

import type {ParseGLTFMaterialOptions} from './gltf-material-parser';
import {GLTFAnimator} from './gltf-animator';

export type GLTFInstantiatorOptions = Omit<ParseGLTFMaterialOptions, 'attributes'> & {
  modelOptions?: Record<string, any>,
  pbrDebug?: boolean,
  imageBasedLightingEnvironment?: any,
  lights?: boolean,
  useTangents?: boolean
}

const DEFAULT_OPTIONS = {
  modelOptions: {},
  pbrDebug: false,
  imageBasedLightingEnvironment: null,
  lights: true,
  useTangents: false
};

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

/**
 * GLTF instantiator for luma.gl
 * Walks the parsed and resolved glTF structure and builds a luma.gl scenegraph
 */
export class GLTFInstantiator {
  // TODO - replace with Device
  device: WebGLDevice;
  options: GLTFInstantiatorOptions;
  gltf: any;

  constructor(device: Device, options: GLTFInstantiatorOptions = {}) {
    this.device = WebGLDevice.attach(device);
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  instantiate(gltf: any): any {
    this.gltf = gltf;
    const scenes = (gltf.scenes || []).map((scene) => this.createScene(scene));
    return scenes;
  }

  createAnimator(): GLTFAnimator {
    if (Array.isArray(this.gltf.animations)) {
      return new GLTFAnimator(this.gltf);
    }

    return null;
  }

  createScene(gltfScene: any): GroupNode {
    const gltfNodes = gltfScene.nodes || [];
    const nodes = gltfNodes.map((node) => this.createNode(node));
    const scene = new GroupNode({
      id: gltfScene.name || gltfScene.id,
      children: nodes
    });
    return scene;
  }

  createNode(gltfNode) {
    if (!gltfNode._node) {
      const gltfChildren = gltfNode.children || [];
      const children = gltfChildren.map((child) => this.createNode(child));

      // Node can have children nodes and meshes at the same time
      if (gltfNode.mesh) {
        children.push(this.createMesh(gltfNode.mesh));
      }

      const node = new GroupNode({
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
      gltfNode._node = node;
    }

    return gltfNode._node;
  }

  createMesh(gltfMesh): GroupNode {
    // TODO: avoid changing the gltf
    if (!gltfMesh._mesh) {
      const gltfPrimitives = gltfMesh.primitives || [];
      const primitives = gltfPrimitives.map((gltfPrimitive, i) =>
        this.createPrimitive(gltfPrimitive, i, gltfMesh)
      );
      const mesh = new GroupNode({
        id: gltfMesh.name || gltfMesh.id,
        children: primitives
      });
      gltfMesh._mesh = mesh;
    }

    return gltfMesh._mesh;
  }

  createPrimitive(gltfPrimitive: any, i: number, gltfMesh): ModelNode {
    const vertexCount = gltfPrimitive.indices
      ? gltfPrimitive.indices.count
      : this.getVertexCount(gltfPrimitive.attributes);

    const model = new Model(
      this.device,
      {
        id: gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}-primitive-${i}`,
        topology: convertGLPrimitiveTopologyToTopology(gltfPrimitive.mode || 4),
        vertexCount,
        attributes: this.createAttributes(gltfPrimitive.attributes, gltfPrimitive.indices),
        ...this.options
      }
    );

    const modelNode = new ModelNode({model});
    modelNode.bounds = [gltfPrimitive.attributes.POSITION.min, gltfPrimitive.attributes.POSITION.max];
    // TODO this holds on to all the CPU side texture and attribute data
    // modelNode.material =  gltfPrimitive.material;

    return modelNode;
  }

  getVertexCount(attributes: any) {
    throw new Error('getVertexCount not implemented');
  }

  createAttributes(attributes, indices) {
    const loadedAttributes = {};

    for (const [attrName, attribute] of Object.entries(attributes)) {
      const buffer = this.createBuffer(attribute, Buffer.VERTEX);
      loadedAttributes[attrName] = this.createAccessor(attribute, buffer);
    }

    if (indices) {
      const buffer = this.createBuffer(indices, Buffer.INDEX)
      // @ts-expect-error
      loadedAttributes.indices = this.createAccessor(indices, buffer);
    }

    log.info(4, 'glTF Attributes', {attributes, indices, generated: loadedAttributes})();

    return loadedAttributes;
  }

  createBuffer(attribute, usage: number): Buffer {
    if (!attribute.bufferView) {
      // Draco decoded files do not have a bufferView
      attribute.bufferView = {};
    }

    const {bufferView} = attribute;
    if (!bufferView.lumaBuffers) {
      bufferView.lumaBuffers = {};
    }

    if (!bufferView.lumaBuffers[usage]) {
      bufferView.lumaBuffers[usage] = this.device.createBuffer({
        id: `from-${bufferView.id}`,
        // Draco decoded files have attribute.value
        data: bufferView.data || attribute.value,
      });
    }

    return bufferView.lumaBuffers[usage];
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

  needsPOT(): boolean {
    // Has a wrapping mode (either wrapS or wrapT) equal to REPEAT or MIRRORED_REPEAT, or
    // Has a minification filter (minFilter) that uses mipmapping
    // (NEAREST_MIPMAP_NEAREST, NEAREST_MIPMAP_LINEAR,
    // LINEAR_MIPMAP_NEAREST, or LINEAR_MIPMAP_LINEAR).
    return false;
  }
}

enum GL {
  POINTS = 0x0,
  LINES = 0x1,
  LINE_LOOP = 0x2,
  LINE_STRIP = 0x3,
  TRIANGLES = 0x4,
  TRIANGLE_STRIP = 0x5,
  TRIANGLE_FAN = 0x6
}

export function convertGLPrimitiveTopologyToTopology(
  drawMode: GL.POINTS | GL.LINES | GL.LINE_STRIP | GL.LINE_LOOP | GL.TRIANGLES | GL.TRIANGLE_STRIP | GL.TRIANGLE_FAN,
): PrimitiveTopology  {
  switch (drawMode) {
    case GL.POINTS: return 'point-list';
    case GL.LINES: return 'line-list';
    case GL.LINE_STRIP: return 'line-strip';
    case GL.LINE_LOOP: return 'line-loop-webgl';
    case GL.TRIANGLES: return 'triangle-list';
    case GL.TRIANGLE_STRIP: return 'triangle-strip';
    case GL.TRIANGLE_FAN: return 'triangle-fan-webgl';
    default: throw new Error(drawMode);
  }
}
