// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type PrimitiveTopology} from '@luma.gl/core';
import {Geometry, GeometryAttribute, GroupNode, ModelNode, type ModelProps} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  type GLTFMeshPostprocessed,
  type GLTFNodePostprocessed,
  type GLTFPostprocessed
} from '@loaders.gl/gltf';
import {type GLTFScenePostprocessed} from '@loaders.gl/gltf/dist/lib/types/gltf-postprocessed-schema';

import {type PBREnvironment} from '../pbr/pbr-environment';
import {convertGLDrawModeToTopology} from '../webgl-to-webgpu/convert-webgl-topology';
import {createGLTFModel} from '../gltf/create-gltf-model';

import {parsePBRMaterial} from './parse-pbr-material';

export type ParseGLTFOptions = {
  modelOptions?: Partial<ModelProps>;
  pbrDebug?: boolean;
  imageBasedLightingEnvironment?: PBREnvironment;
  lights?: boolean;
  useTangents?: boolean;
};

const defaultOptions: Required<ParseGLTFOptions> = {
  modelOptions: {},
  pbrDebug: false,
  imageBasedLightingEnvironment: undefined!,
  lights: true,
  useTangents: false
};

/**
 * GLTF instantiator for luma.gl
 * Walks the parsed and resolved glTF structure and builds a luma.gl scenegraph
 */
export function parseGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options_: ParseGLTFOptions = {}
): GroupNode[] {
  const options = {...defaultOptions, ...options_};
  const sceneNodes = gltf.scenes.map(gltfScene =>
    createScene(device, gltfScene, gltf.nodes, options)
  );
  return sceneNodes;
}

function createScene(
  device: Device,
  gltfScene: GLTFScenePostprocessed,
  gltfNodes: GLTFNodePostprocessed[],
  options: Required<ParseGLTFOptions>
): GroupNode {
  const gltfSceneNodes = gltfScene.nodes || [];
  const nodes = gltfSceneNodes.map(node => createNode(device, node, gltfNodes, options));
  const sceneNode = new GroupNode({
    id: gltfScene.name || gltfScene.id,
    children: nodes
  });
  return sceneNode;
}

function createNode(
  device: Device,
  gltfNode: GLTFNodePostprocessed & {_node?: GroupNode},
  gltfNodes: GLTFNodePostprocessed[],
  options: Required<ParseGLTFOptions>
): GroupNode {
  if (!gltfNode._node) {
    const gltfChildren = gltfNode.children || [];
    const children = gltfChildren.map(child => createNode(device, child, gltfNodes, options));

    // Node can have children nodes and meshes at the same time
    if (gltfNode.mesh) {
      children.push(createMesh(device, gltfNode.mesh, options));
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

  // Copy _node so that gltf-animator can access
  const topLevelNode = gltfNodes.find(node => node.id === gltfNode.id) as any;
  topLevelNode._node = gltfNode._node;

  return gltfNode._node;
}

function createMesh(
  device: Device,
  gltfMesh: GLTFMeshPostprocessed & {_mesh?: GroupNode},
  options: Required<ParseGLTFOptions>
): GroupNode {
  // TODO: avoid changing the gltf
  if (!gltfMesh._mesh) {
    const gltfPrimitives = gltfMesh.primitives || [];
    const primitives = gltfPrimitives.map((gltfPrimitive, i) =>
      createPrimitive(device, gltfPrimitive, i, gltfMesh, options)
    );
    const mesh = new GroupNode({
      id: gltfMesh.name || gltfMesh.id,
      children: primitives
    });
    gltfMesh._mesh = mesh;
  }

  return gltfMesh._mesh;
}

function createPrimitive(
  device: Device,
  gltfPrimitive: any,
  i: number,
  gltfMesh: GLTFMeshPostprocessed,
  options: Required<ParseGLTFOptions>
): ModelNode {
  const id = gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}-primitive-${i}`;
  const topology = convertGLDrawModeToTopology(gltfPrimitive.mode || 4);
  const vertexCount = gltfPrimitive.indices
    ? gltfPrimitive.indices.count
    : getVertexCount(gltfPrimitive.attributes);

  const geometry = createGeometry(id, gltfPrimitive, topology);

  const parsedPPBRMaterial = parsePBRMaterial(
    device,
    gltfPrimitive.material,
    geometry.attributes,
    options
  );

  const modelNode = createGLTFModel(device, {
    id,
    geometry: createGeometry(id, gltfPrimitive, topology),
    parsedPPBRMaterial,
    modelOptions: options.modelOptions,
    vertexCount
  });

  modelNode.bounds = [gltfPrimitive.attributes.POSITION.min, gltfPrimitive.attributes.POSITION.max];
  // TODO this holds on to all the CPU side texture and attribute data
  // modelNode.material =  gltfPrimitive.material;

  return modelNode;
}

function getVertexCount(attributes: any) {
  throw new Error('getVertexCount not implemented');
}

function createGeometry(id: string, gltfPrimitive: any, topology: PrimitiveTopology): Geometry {
  const attributes: Record<string, GeometryAttribute> = {};
  for (const [attributeName, attribute] of Object.entries(gltfPrimitive.attributes)) {
    const {components, size, value} = attribute as GeometryAttribute;

    attributes[attributeName] = {size: size ?? components, value};
  }

  return new Geometry({
    id,
    topology,
    indices: gltfPrimitive.indices.value,
    attributes
  });
}
