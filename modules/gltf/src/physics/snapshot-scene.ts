// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ScenegraphNode} from '@luma.gl/engine';
import type {GLTFPhysicsDocument} from './physics-types';

/** Copy current local authoring transforms for an explicit import/cooking revision.
 * Node indices and geometry resources retain their source identities. Simulated poses
 * are GPU-owned; use exportGLTFPhysicsState when those poses are needed instead.
 */
export function snapshotGLTFPhysicsScene<T extends GLTFPhysicsDocument>(
  source: T,
  nodes: ReadonlyMap<number, ScenegraphNode>
): T {
  const snapshot = structuredClone(source);
  for (const [index, node] of nodes) {
    const target = snapshot.nodes?.[index];
    if (!target) throw new Error('Unknown source node');
    target.matrix = Array.from(node.matrix);
    delete target.translation;
    delete target.rotation;
    delete target.scale;
    const weights = node.userData['morphWeights'];
    if (
      Array.isArray(weights) &&
      weights.every(value => typeof value === 'number' && Number.isFinite(value))
    )
      target.weights = [...weights];
  }
  return snapshot;
}
