// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTF_KHR_interactivity, GLTFInteractivityGraph} from '@loaders.gl/gltf';

/**
 * Backend-independent foundation for KHR_interactivity graph inspection.
 *
 * This class does not execute behavior graphs. In particular, unknown operations
 * must not silently become no-ops: a runtime must implement the operation
 * semantics and validate socket types before advertising extension support.
 */
export class GLTFInteractivity {
  readonly extension: GLTF_KHR_interactivity;

  constructor(extension: GLTF_KHR_interactivity) {
    this.extension = extension;
  }

  get graphCount(): number {
    return this.extension.graphs.length;
  }

  getGraph(index: number): GLTFInteractivityGraph {
    const graph = this.extension.graphs[index];
    if (!graph) {
      throw new Error(`KHR_interactivity: graph index ${index} is out of range`);
    }
    return graph;
  }

  /** Resolve a graph node's operation through the extension declaration table. */
  getOperation(graphIndex: number, nodeIndex: number): string {
    const node = this.getGraph(graphIndex).nodes[nodeIndex];
    if (!node) {
      throw new Error(`KHR_interactivity: node index ${nodeIndex} is out of range`);
    }
    const declaration = this.extension.declarations[node.declaration];
    if (!declaration) {
      throw new Error(`KHR_interactivity: declaration index ${node.declaration} is out of range`);
    }
    return declaration.extension ? `${declaration.extension}:${declaration.op}` : declaration.op;
  }
}
