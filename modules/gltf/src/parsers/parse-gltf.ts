// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type PrimitiveTopology} from '@luma.gl/core';
import {
  Geometry,
  GeometryAttribute,
  GroupNode,
  Material,
  MaterialFactory,
  ModelNode,
  type ModelProps
} from '@luma.gl/engine';
import {
  type GLTFMaterialPostprocessed,
  type GLTFMeshPostprocessed,
  type GLTFNodePostprocessed,
  type GLTFPostprocessed
} from '@loaders.gl/gltf';
import {pbrMaterial} from '@luma.gl/shadertools';

import {type PBREnvironment} from '../pbr/pbr-environment';
import {convertGLDrawModeToTopology} from '../webgl-to-webgpu/convert-webgl-topology';
import {createGLTFMaterial, createGLTFModel} from '../gltf/create-gltf-model';

import {parsePBRMaterial} from './parse-pbr-material';

/** Options that influence how a post-processed glTF is turned into a luma.gl scenegraph. */
export type ParseGLTFOptions = {
  /** Additional model props applied to each generated primitive model. */
  modelOptions?: Partial<ModelProps>;
  /** Enables shader-level PBR debug output. */
  pbrDebug?: boolean;
  /** Optional image-based lighting environment. */
  imageBasedLightingEnvironment?: PBREnvironment;
  /** Enables punctual light extraction. */
  lights?: boolean;
  /** Enables tangent usage when available. */
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
  /** Scene roots generated from `gltf.scenes`. */
  scenes: GroupNode[];
  /** Materials aligned with the source `gltf.materials` array. */
  materials: Material[];
  /** Map from glTF mesh ids to generated mesh group nodes. */
  gltfMeshIdToNodeMap: Map<string, GroupNode>;
  /** Map from glTF node indices to generated scenegraph nodes. */
  gltfNodeIndexToNodeMap: Map<number, GroupNode>;
  /** Map from glTF node ids to generated scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
} {
  const combinedOptions = {...defaultOptions, ...options};
  const materialFactory = new MaterialFactory(device, {modules: [pbrMaterial]});
  const materials = (gltf.materials || []).map((gltfMaterial, materialIndex) =>
    createGLTFMaterial(device, {
      id: getGLTFMaterialId(gltfMaterial, materialIndex),
      parsedPPBRMaterial: parsePBRMaterial(
        device,
        gltfMaterial as any,
        {},
        {
          ...combinedOptions,
          gltf,
          validateAttributes: false
        }
      ),
      materialFactory
    })
  );
  const gltfMaterialIdToMaterialMap = new Map<string, Material>();
  (gltf.materials || []).forEach((gltfMaterial, materialIndex) => {
    gltfMaterialIdToMaterialMap.set(gltfMaterial.id, materials[materialIndex]);
  });

  const gltfMeshIdToNodeMap = new Map<string, GroupNode>();
  gltf.meshes.forEach((gltfMesh, idx) => {
    const newMesh = createNodeForGLTFMesh(
      device,
      gltfMesh,
      gltf,
      gltfMaterialIdToMaterialMap,
      combinedOptions
    );
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

  return {scenes, materials, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap};
}

/** Creates a `GroupNode` for one glTF node transform. */
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

/** Creates a mesh group node containing one model node per glTF primitive. */
function createNodeForGLTFMesh(
  device: Device,
  gltfMesh: GLTFMeshPostprocessed,
  gltf: GLTFPostprocessed,
  gltfMaterialIdToMaterialMap: Map<string, Material>,
  options: Required<ParseGLTFOptions>
): GroupNode {
  const gltfPrimitives = gltfMesh.primitives || [];
  const primitives = gltfPrimitives.map((gltfPrimitive, i) =>
    createNodeForGLTFPrimitive({
      device,
      gltfPrimitive,
      primitiveIndex: i,
      gltfMesh,
      gltf,
      gltfMaterialIdToMaterialMap,
      options
    })
  );
  const mesh = new GroupNode({
    id: gltfMesh.name || gltfMesh.id,
    children: primitives
  });

  return mesh;
}

/** Input options for creating one renderable glTF primitive model node. */
type CreateNodeForGLTFPrimitiveOptions = {
  device: Device;
  gltfPrimitive: any;
  primitiveIndex: number;
  gltfMesh: GLTFMeshPostprocessed;
  gltf: GLTFPostprocessed;
  gltfMaterialIdToMaterialMap: Map<string, Material>;
  options: Required<ParseGLTFOptions>;
};

/** Creates a renderable model node for one glTF primitive. */
function createNodeForGLTFPrimitive({
  device,
  gltfPrimitive,
  primitiveIndex,
  gltfMesh,
  gltf,
  gltfMaterialIdToMaterialMap,
  options
}: CreateNodeForGLTFPrimitiveOptions): ModelNode {
  const id = gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}-primitive-${primitiveIndex}`;
  const topology = convertGLDrawModeToTopology(gltfPrimitive.mode ?? 4);
  const vertexCount = gltfPrimitive.indices
    ? gltfPrimitive.indices.count
    : getVertexCount(gltfPrimitive.attributes);

  const geometry = createGeometry(id, gltfPrimitive, topology);

  const parsedPPBRMaterial = parsePBRMaterial(device, gltfPrimitive.material, geometry.attributes, {
    ...options,
    gltf
  });

  const modelNode = createGLTFModel(device, {
    id,
    geometry,
    material: gltfPrimitive.material
      ? gltfMaterialIdToMaterialMap.get(gltfPrimitive.material.id) || null
      : null,
    parsedPPBRMaterial,
    modelOptions: options.modelOptions,
    vertexCount
  });

  modelNode.bounds = [gltfPrimitive.attributes.POSITION.min, gltfPrimitive.attributes.POSITION.max];
  // TODO this holds on to all the CPU side texture and attribute data
  // modelNode.material =  gltfPrimitive.material;

  return modelNode;
}

/** Computes the vertex count for a primitive without indices. */
function getVertexCount(attributes: any) {
  let vertexCount = Infinity;
  for (const attribute of Object.values(attributes)) {
    if (attribute) {
      const {value, size, components} = attribute as any;
      const attributeSize = size ?? components;
      if (value?.length !== undefined && attributeSize >= 1) {
        vertexCount = Math.min(vertexCount, value.length / attributeSize);
      }
    }
  }
  if (!Number.isFinite(vertexCount)) {
    throw new Error('Could not determine vertex count from attributes');
  }
  return vertexCount;
}

/** Converts glTF primitive attributes and indices into a luma.gl `Geometry`. */
function createGeometry(id: string, gltfPrimitive: any, topology: PrimitiveTopology): Geometry {
  const attributes: Record<string, GeometryAttribute> = {};
  for (const [attributeName, attribute] of Object.entries(gltfPrimitive.attributes)) {
    const {components, size, value, normalized} = attribute as GeometryAttribute;

    attributes[attributeName] = {size: size ?? components, value, normalized};
  }

  return new Geometry({
    id,
    topology,
    indices: gltfPrimitive.indices?.value,
    attributes
  });
}

function getGLTFMaterialId(gltfMaterial: GLTFMaterialPostprocessed, materialIndex: number): string {
  return gltfMaterial.name || gltfMaterial.id || `material-${materialIndex}`;
}
