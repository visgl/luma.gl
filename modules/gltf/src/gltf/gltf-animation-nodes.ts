// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GroupNode} from '@luma.gl/engine';
import type {GLTFScenegraphs} from './create-scenegraph-from-gltf';

/** CPU-only hierarchy used during baking and independent actor playback. */
export type GLTFAnimationNodes = {
  root: GroupNode;
  scenes: GroupNode[];
  nodesByIndex: Map<number, GroupNode>;
  nodesById: Map<string, GroupNode>;
};

export function createGLTFAnimationNodes(
  scenegraphs: GLTFScenegraphs,
  id: string
): GLTFAnimationNodes {
  const {gltf, gltfNodeIndexToNodeMap} = scenegraphs;
  const nodesByIndex = new Map<number, GroupNode>();
  const nodesById = new Map<string, GroupNode>();

  for (let nodeIndex = 0; nodeIndex < gltf.nodes.length; nodeIndex++) {
    const sourceNode = gltf.nodes[nodeIndex];
    const sourceRuntimeNode = gltfNodeIndexToNodeMap.get(nodeIndex);
    if (!sourceRuntimeNode) {
      continue;
    }
    const node = new GroupNode({
      id: sourceRuntimeNode.id,
      position: Array.from(sourceRuntimeNode.position),
      rotation: Array.from(sourceRuntimeNode.rotation),
      scale: Array.from(sourceRuntimeNode.scale),
      matrix: Array.from(sourceRuntimeNode.matrix),
      display: sourceRuntimeNode.display
    });
    const morphWeights = sourceRuntimeNode.userData['morphWeights'];
    if (Array.isArray(morphWeights)) {
      node.userData['morphWeights'] = [...morphWeights];
    }
    nodesByIndex.set(nodeIndex, node);
    nodesById.set(sourceNode.id, node);
  }

  for (let nodeIndex = 0; nodeIndex < gltf.nodes.length; nodeIndex++) {
    const sourceNode = gltf.nodes[nodeIndex];
    const node = nodesByIndex.get(nodeIndex);
    if (!node) {
      continue;
    }
    for (const child of sourceNode.children || []) {
      const childNode = nodesById.get(child.id);
      if (childNode) {
        node.add(childNode);
      }
    }
    if (sourceNode.mesh) {
      const mesh = new GroupNode({id: sourceNode.mesh.name || sourceNode.mesh.id});
      node.userData['gltfMesh'] = mesh;
      node.add(mesh);
    }
  }

  const scenes = gltf.scenes.map(
    (scene, sceneIndex) =>
      new GroupNode({
        id: `${id}-scene-${sceneIndex}`,
        children: (scene.nodes || []).flatMap(sourceNode => {
          const node = nodesById.get(sourceNode.id);
          return node ? [node] : [];
        })
      })
  );

  return {
    root: new GroupNode({id: `${id}-root`, children: [...scenes]}),
    scenes,
    nodesByIndex,
    nodesById
  };
}
