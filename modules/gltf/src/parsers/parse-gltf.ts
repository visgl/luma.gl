// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type GLTFMaterialPostprocessed,
  type GLTFMeshPostprocessed,
  type GLTFNodePostprocessed,
  type GLTFPostprocessed
} from '@loaders.gl/gltf';
import {Device, type PrimitiveTopology} from '@luma.gl/core';
import {
  Geometry,
  GeometryAttribute,
  GroupNode,
  Material,
  MaterialFactory,
  ModelNode,
  type ModelProps,
  type MorphTargetAttributes,
  decodeMorphTargetAttribute
} from '@luma.gl/engine';
import {pbrMaterial} from '@luma.gl/shadertools';
import {createGLTFMaterial, createGLTFModel} from '../gltf/create-gltf-model';
import {getGLTFNodeInstancing, type GLTFGPUInstancing} from '../gltf/gltf-instancing';
import type {GLTFPrimitiveMaterialVariants} from '../gltf/gltf-material-variants';
import {type GLTFMorphTargetState, setGLTFMorphWeights} from '../gltf/morph-targets';
import {type PBREnvironment} from '../pbr/pbr-environment';
import {convertGLDrawModeToTopology} from '../webgl-to-webgpu/convert-webgl-topology';

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
  /** When true, parsed semantic light colors are converted into luma.gl's legacy byte-style range. */
  useByteColors?: boolean;
  /** Reject documents whose required extensions have no complete runtime implementation. */
  strictExtensions?: boolean;
};

const defaultOptions: Required<ParseGLTFOptions> = {
  modelOptions: {},
  pbrDebug: false,
  imageBasedLightingEnvironment: undefined!,
  lights: true,
  useTangents: false,
  useByteColors: true,
  strictExtensions: false
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
  const assignedMorphMeshes = new Set<string>();
  const assignedMeshes = new Set<string>();
  const independentlySkinnedMeshes = new Set<string>();
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
      const sourceMesh = gltfNode.mesh;
      const instancing = getGLTFNodeInstancing(gltf, gltfNode);
      const hasMorphTargets = sourceMesh.primitives.some(primitive =>
        Boolean(primitive.targets?.length)
      );
      const mesh =
        instancing || (hasMorphTargets && assignedMorphMeshes.has(sourceMesh.id))
          ? createNodeForGLTFMesh(
              device,
              sourceMesh,
              gltf,
              gltfMaterialIdToMaterialMap,
              combinedOptions,
              instancing || undefined
            )
          : gltfMeshIdToNodeMap.get(sourceMesh.id);
      if (!mesh) {
        throw new Error(`Cannot find mesh child ${gltfNode.mesh.id} of node ${idx}`);
      }
      const node = gltfNodeIndexToNodeMap.get(idx)!;
      const sharedMesh = gltfMeshIdToNodeMap.get(sourceMesh.id);
      const needsIndependentSkin =
        assignedMeshes.has(sourceMesh.id) &&
        (gltfNode.skin !== undefined || independentlySkinnedMeshes.has(sourceMesh.id));
      const ownedMesh =
        needsIndependentSkin && mesh === sharedMesh
          ? createNodeForGLTFMesh(
              device,
              sourceMesh,
              gltf,
              gltfMaterialIdToMaterialMap,
              combinedOptions
            )
          : mesh;
      node.add(ownedMesh);
      node.userData['gltfMesh'] = ownedMesh;
      assignedMeshes.add(sourceMesh.id);
      if (gltfNode.skin !== undefined) {
        independentlySkinnedMeshes.add(sourceMesh.id);
      }
      if (hasMorphTargets) {
        assignedMorphMeshes.add(sourceMesh.id);
        const targetCount =
          sourceMesh.primitives.find(primitive => primitive.targets?.length)?.targets?.length || 0;
        const weights =
          gltfNode.weights || sourceMesh.weights || new Array<number>(targetCount).fill(0);
        node.userData['morphMeshes'] = [ownedMesh];
        setGLTFMorphWeights(node, weights);
      }
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
    display: gltfNode.extensions?.['KHR_node_visibility']?.visible !== false,
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
  options: Required<ParseGLTFOptions>,
  instancing?: GLTFGPUInstancing
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
      options,
      instancing
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
  instancing?: GLTFGPUInstancing;
};

/** Creates a renderable model node for one glTF primitive. */
function createNodeForGLTFPrimitive({
  device,
  gltfPrimitive,
  primitiveIndex,
  gltfMesh,
  gltf,
  gltfMaterialIdToMaterialMap,
  options,
  instancing
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
    vertexCount,
    bounds: [gltfPrimitive.attributes.POSITION.min, gltfPrimitive.attributes.POSITION.max],
    instanceMatrices: instancing?.matrices
  });

  if (instancing) {
    modelNode.userData['gltfInstancing'] = instancing;
  }

  const sourceVariantMappings =
    gltfPrimitive.extensions?.['KHR_materials_variants']?.mappings || [];
  if (sourceVariantMappings.length) {
    const mappings = new Map<
      number,
      {material: Material; parameters: GLTFPrimitiveMaterialVariants['defaultParameters']}
    >();
    for (const mapping of sourceVariantMappings) {
      const sourceMaterial =
        typeof mapping.material === 'number' ? gltf.materials[mapping.material] : mapping.material;
      const material = sourceMaterial && gltfMaterialIdToMaterialMap.get(sourceMaterial.id);
      if (!material) {
        continue;
      }
      const variantMaterial = parsePBRMaterial(device, sourceMaterial as any, geometry.attributes, {
        ...options,
        gltf
      });
      for (const variantIndex of mapping.variants || []) {
        mappings.set(variantIndex, {
          material,
          parameters: {
            ...modelNode.model.parameters,
            ...variantMaterial.parameters,
            depthWriteEnabled: sourceMaterial.alphaMode !== 'BLEND',
            cullMode: sourceMaterial.doubleSided ? 'none' : 'back'
          }
        });
      }
    }
    modelNode.userData['gltfMaterialVariants'] = {
      defaultMaterial: modelNode.model.material,
      defaultParameters: {...modelNode.model.parameters},
      mappings
    } satisfies GLTFPrimitiveMaterialVariants;
  }

  if (gltfPrimitive.targets?.length) {
    const baseAttributes: MorphTargetAttributes = {};
    for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
      const values = geometry.attributes[attributeName]?.value;
      if (values instanceof Float32Array) {
        baseAttributes[attributeName] = new Float32Array(values);
      }
    }

    const targets = gltfPrimitive.targets.map(
      (target: Record<string, number | {value?: Float32Array}>) => {
        const attributes: MorphTargetAttributes = {};
        for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
          const accessorReference = target[attributeName];
          const accessor =
            typeof accessorReference === 'number'
              ? gltf.accessors[accessorReference]
              : accessorReference;
          if (accessor?.value && ArrayBuffer.isView(accessor.value)) {
            attributes[attributeName] = decodeMorphTargetAttribute(accessor as GeometryAttribute);
          }
        }
        return attributes;
      }
    );
    modelNode.userData['morphTargets'] = {
      geometry,
      baseAttributes,
      targets
    } satisfies GLTFMorphTargetState;
  }

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

    const isMorphAttribute =
      attributeName === 'POSITION' || attributeName === 'NORMAL' || attributeName === 'TANGENT';
    const shouldDecode = Boolean(gltfPrimitive.targets?.length && isMorphAttribute);
    attributes[attributeName] = {
      size: size ?? components,
      value: shouldDecode
        ? decodeMorphTargetAttribute({value, normalized} as GeometryAttribute)
        : value,
      normalized: shouldDecode ? false : normalized
    };
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
