// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Geometry, GroupNode } from '@luma.gl/engine';
import { convertGLDrawModeToTopology } from '../webgl-to-webgpu/convert-webgl-topology';
import { createGLTFModel } from '../gltf/create-gltf-model';
import { parsePBRMaterial } from './parse-pbr-material';
const defaultOptions = {
    modelOptions: {},
    pbrDebug: false,
    imageBasedLightingEnvironment: undefined,
    lights: true,
    useTangents: false
};
/**
 * GLTF instantiator for luma.gl
 * Walks the parsed and resolved glTF structure and builds a luma.gl scenegraph
 */
export function parseGLTF(device, gltf, options = {}) {
    const combinedOptions = { ...defaultOptions, ...options };
    const gltfMeshIdToNodeMap = new Map();
    gltf.meshes.forEach((gltfMesh, idx) => {
        const newMesh = createNodeForGLTFMesh(device, gltfMesh, combinedOptions);
        gltfMeshIdToNodeMap.set(gltfMesh.id, newMesh);
    });
    const gltfNodeIndexToNodeMap = new Map();
    const gltfNodeIdToNodeMap = new Map();
    // Step 1/2: Generate a GroupNode for each gltf node. (1:1 mapping).
    gltf.nodes.forEach((gltfNode, idx) => {
        const newNode = createNodeForGLTFNode(device, gltfNode, combinedOptions);
        gltfNodeIndexToNodeMap.set(idx, newNode);
        gltfNodeIdToNodeMap.set(gltfNode.id, newNode);
    });
    // Step 2/2: Go though each gltf node and attach the children.
    // This guarantees that each gltf node will have exactly one luma GroupNode.
    gltf.nodes.forEach((gltfNode, idx) => {
        gltfNodeIndexToNodeMap.get(idx).add((gltfNode.children ?? []).map(({ id }) => {
            const child = gltfNodeIdToNodeMap.get(id);
            if (!child)
                throw new Error(`Cannot find child ${id} of node ${idx}`);
            return child;
        }));
        // Nodes can have children nodes and one optional child mesh at the same time.
        if (gltfNode.mesh) {
            const mesh = gltfMeshIdToNodeMap.get(gltfNode.mesh.id);
            if (!mesh) {
                throw new Error(`Cannot find mesh child ${gltfNode.mesh.id} of node ${idx}`);
            }
            gltfNodeIndexToNodeMap.get(idx).add(mesh);
        }
    });
    const scenes = gltf.scenes.map(gltfScene => {
        const children = (gltfScene.nodes || []).map(({ id }) => {
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
    return { scenes, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap };
}
function createNodeForGLTFNode(device, gltfNode, options) {
    return new GroupNode({
        id: gltfNode.name || gltfNode.id,
        children: [],
        matrix: gltfNode.matrix,
        position: gltfNode.translation,
        rotation: gltfNode.rotation,
        scale: gltfNode.scale
    });
}
function createNodeForGLTFMesh(device, gltfMesh, options) {
    const gltfPrimitives = gltfMesh.primitives || [];
    const primitives = gltfPrimitives.map((gltfPrimitive, i) => createNodeForGLTFPrimitive(device, gltfPrimitive, i, gltfMesh, options));
    const mesh = new GroupNode({
        id: gltfMesh.name || gltfMesh.id,
        children: primitives
    });
    return mesh;
}
function createNodeForGLTFPrimitive(device, gltfPrimitive, i, gltfMesh, options) {
    const id = gltfPrimitive.name || `${gltfMesh.name || gltfMesh.id}-primitive-${i}`;
    const topology = convertGLDrawModeToTopology(gltfPrimitive.mode || 4);
    const vertexCount = gltfPrimitive.indices
        ? gltfPrimitive.indices.count
        : getVertexCount(gltfPrimitive.attributes);
    const geometry = createGeometry(id, gltfPrimitive, topology);
    const parsedPPBRMaterial = parsePBRMaterial(device, gltfPrimitive.material, geometry.attributes, options);
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
function getVertexCount(attributes) {
    throw new Error('getVertexCount not implemented');
}
function createGeometry(id, gltfPrimitive, topology) {
    const attributes = {};
    for (const [attributeName, attribute] of Object.entries(gltfPrimitive.attributes)) {
        const { components, size, value } = attribute;
        attributes[attributeName] = { size: size ?? components, value };
    }
    return new Geometry({
        id,
        topology,
        indices: gltfPrimitive.indices.value,
        attributes
    });
}
