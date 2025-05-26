// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type PrimitiveTopology} from '@luma.gl/core';
import {Geometry, GeometryAttribute, GroupNode, ModelNode, type ModelProps} from '@luma.gl/engine';
import {
  type GLTFMeshPostprocessed,
  type GLTFNodePostprocessed,
  type GLTFPostprocessed
} from '@loaders.gl/gltf';

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
  options: ParseGLTFOptions = {}
): {
  scenes: GroupNode[];
  nodeMap: Map<number | string, GroupNode>;
  meshMap: Map<number | string, GroupNode>;
} {
  const combinedOptions = {...defaultOptions, ...options};

  const meshMap = new Map<number | string, GroupNode>();
  gltf.meshes.forEach((gltfMesh, idx) => {
    const newMesh = createNodeForGLTFMesh(device, gltfMesh, combinedOptions);
    meshMap.set(idx, newMesh);
    meshMap.set(gltfMesh.id, newMesh);
  });

  const nodeMap = new Map<number | string, GroupNode>();
  gltf.nodes.forEach((gltfNode, idx) => {
    const newNode = createNodeForGLTFNode(device, gltfNode, combinedOptions);
    nodeMap.set(idx, newNode);
    nodeMap.set(gltfNode.id, newNode);
  });

  gltf.nodes.forEach((gltfNode, idx) => {
    nodeMap.get(idx)?.add(
      (gltfNode.children ?? []).map(({id}) => {
        const child = nodeMap.get(id);
        if (!child) throw new Error(`Cannot find child ${id} of node ${idx}`);
        return child;
      })
    );
    // Node can have children nodes and meshes at the same time
    if (gltfNode.mesh) {
      const mesh = meshMap.get(gltfNode.mesh.id);
      if (mesh) {
        nodeMap.get(idx)?.add(mesh);
      } else {
        throw new Error(`Cannot find mesh child ${gltfNode.mesh.id} of node ${idx}`);
      }
    }
  });

  const scenes = gltf.scenes.map(gltfScene => {
    const children = (gltfScene.nodes || []).map(({id}) => {
      const child = nodeMap.get(id);
      if (!child)
        throw new Error(`Cannot find child ${id} of scene ${gltfScene.name || gltfScene.id}`);
      return child;
    });
    return new GroupNode({
      id: gltfScene.name || gltfScene.id,
      children
    });
  });

  return {scenes, nodeMap, meshMap};
}

function createNodeForGLTFNode(
  device: Device,
  gltfNode: GLTFNodePostprocessed,
  options: Required<ParseGLTFOptions>
): GroupNode {
  const node = new GroupNode({
    id: gltfNode.name || gltfNode.id,
    children: []
  });

  if (gltfNode.matrix) {
    node.setMatrix(gltfNode.matrix);
  } else {
    node.update({
      position: gltfNode.translation,
      rotation: gltfNode.rotation,
      scale: gltfNode.scale
    });
  }

  return node;
}

function createNodeForGLTFMesh(
  device: Device,
  gltfMesh: GLTFMeshPostprocessed,
  options: Required<ParseGLTFOptions>
): GroupNode {
  const gltfPrimitives = gltfMesh.primitives || [];
  const primitives = gltfPrimitives.map((gltfPrimitive, i) =>
    createPrimitive(device, gltfPrimitive, i, gltfMesh, options)
  );
  const mesh = new GroupNode({
    id: gltfMesh.name || gltfMesh.id,
    children: primitives
  });

  return mesh;
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
