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
  gltfMeshIdToNodeMap: Map<string, GroupNode>;
  gltfNodeIndexToNodeMap: Map<number, GroupNode>;
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
} {
  const combinedOptions = {...defaultOptions, ...options};

  const gltfMeshIdToNodeMap = new Map<string, GroupNode>();
  gltf.meshes.forEach((gltfMesh, idx) => {
    const newMesh = createNodeForGLTFMesh(device, gltfMesh, combinedOptions);
    gltfMeshIdToNodeMap.set(gltfMesh.id, newMesh);
  });

  const gltfNodeIndexToNodeMap = new Map<number, GroupNode>();
  const gltfNodeIdToNodeMap = new Map<string, GroupNode>();
  // Step 1/2: Generate a GroupNode for each gltf node. (1:1 mapping).
  gltf.nodes.forEach((gltfNode, idx) => {
    const newNode = createNodeForGLTFNode(device, gltfNode, combinedOptions);
    gltfNodeIndexToNodeMap.set(idx, newNode);
    gltfNodeIdToNodeMap.set(gltfNode.id, newNode);
  });

  // Step 2/2: Go though each gltf node and attach the children.
  // This guarantees that each gltf node will have exactly one luma GroupNode.
  gltf.nodes.forEach((gltfNode, idx) => {
    gltfNodeIndexToNodeMap.get(idx)!.add(
      (gltfNode.children ?? []).map(({id}) => {
        const child = gltfNodeIdToNodeMap.get(id);
        if (!child) throw new Error(`Cannot find child ${id} of node ${idx}`);
        return child;
      })
    );

    // Nodes can have children nodes and one optional child mesh at the same time.
    if (gltfNode.mesh) {
      const mesh = gltfMeshIdToNodeMap.get(gltfNode.mesh.id);
      if (!mesh) {
        throw new Error(`Cannot find mesh child ${gltfNode.mesh.id} of node ${idx}`);
      }
      gltfNodeIndexToNodeMap.get(idx)!.add(mesh);
    }
  });

  const scenes = gltf.scenes.map(gltfScene => {
    const children = (gltfScene.nodes || []).map(({id}) => {
      const child = gltfNodeIdToNodeMap.get(id);
      if (!child)
        throw new Error(`Cannot find child ${id} of scene ${gltfScene.name || gltfScene.id}`);
      return child;
    });
    return new GroupNode({
      id: gltfScene.name || gltfScene.id,
      children
    });
  });

  return {scenes, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap};
}

function createNodeForGLTFNode(
  device: Device,
  gltfNode: GLTFNodePostprocessed,
  options: Required<ParseGLTFOptions>
): GroupNode {
  return new GroupNode({
    id: gltfNode.name || gltfNode.id,
    children: [],
    matrix: gltfNode.matrix,
    position: gltfNode.translation,
    rotation: gltfNode.rotation,
    scale: gltfNode.scale
  });
}

function createNodeForGLTFMesh(
  device: Device,
  gltfMesh: GLTFMeshPostprocessed,
  options: Required<ParseGLTFOptions>
): GroupNode {
  const gltfPrimitives = gltfMesh.primitives || [];
  const primitives = gltfPrimitives.map((gltfPrimitive, i) =>
    createNodeForGLTFPrimitive(device, gltfPrimitive, i, gltfMesh, options)
  );
  const mesh = new GroupNode({
    id: gltfMesh.name || gltfMesh.id,
    children: primitives
  });

  return mesh;
}

function createNodeForGLTFPrimitive(
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
