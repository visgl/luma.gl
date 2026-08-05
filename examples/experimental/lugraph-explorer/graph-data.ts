// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Four source communities keep component coloring and hub importance visually distinguishable. */
export const GRAPH_EXPLORER_COMMUNITY_COUNT = 4;

/** Exact all-pairs layout remains interactive at this bounded demonstration population. */
export const GRAPH_EXPLORER_DEFAULT_VERTEX_COUNT = 128;

/** Deterministic graph input preserving an explicit empty aligned source batch. */
export type GraphExplorerDataset = {
  /** Number of stable zero-based graph vertices. */
  vertexCount: number;
  /** Original directed source-edge batches, including one intentionally empty batch. */
  sourceChunks: Uint32Array[];
  /** Original target-edge batches with source-aligned row counts and chunk boundaries. */
  targetChunks: Uint32Array[];
  /** Initial directly renderable two-component positions in source-vertex order. */
  positions: Float32Array;
  /** Caller-owned progressive two-component velocities in source-vertex order. */
  velocities: Float32Array;
};

/**
 * Creates deterministic directed community rings, unequal-importance hubs, and one isolated node.
 *
 * One bridge connects the first two communities; the remaining communities and final isolated
 * vertex stay disconnected. Original edge rows are deliberately partitioned around an empty
 * middle chunk so the explorer can draw the actual caller-owned edge batches without packing.
 */
export function makeGraphExplorerDataset(
  vertexCount: number = GRAPH_EXPLORER_DEFAULT_VERTEX_COUNT
): GraphExplorerDataset {
  if (!Number.isSafeInteger(vertexCount) || vertexCount < GRAPH_EXPLORER_COMMUNITY_COUNT * 2) {
    throw new Error('Graph explorer requires at least eight graph vertices');
  }

  const positions = new Float32Array(vertexCount * 2);
  const velocities = new Float32Array(vertexCount * 2);
  const sources: number[] = [];
  const targets: number[] = [];

  for (let community = 0; community < GRAPH_EXPLORER_COMMUNITY_COUNT; community++) {
    const firstVertex = Math.floor((community * vertexCount) / GRAPH_EXPLORER_COMMUNITY_COUNT);
    const nextCommunityVertex = Math.floor(
      ((community + 1) * vertexCount) / GRAPH_EXPLORER_COMMUNITY_COUNT
    );
    const lastConnectedVertex =
      community === GRAPH_EXPLORER_COMMUNITY_COUNT - 1
        ? nextCommunityVertex - 1
        : nextCommunityVertex;
    const connectedCount = lastConnectedVertex - firstVertex;
    const centerX = community % 2 === 0 ? -0.52 : 0.52;
    const centerY = community < 2 ? -0.43 : 0.43;

    for (let vertex = firstVertex; vertex < nextCommunityVertex; vertex++) {
      const communityIndex = vertex - firstVertex;
      const angle = communityIndex * 2.399963229728653;
      const radius = 0.11 + (communityIndex % 7) * 0.016;
      positions[vertex * 2] = centerX + Math.cos(angle) * radius;
      positions[vertex * 2 + 1] = centerY + Math.sin(angle) * radius;

      if (vertex >= lastConnectedVertex || connectedCount < 2) {
        continue;
      }

      sources.push(vertex);
      targets.push(firstVertex + ((communityIndex + 1) % connectedCount));

      if (connectedCount > 3) {
        sources.push(vertex);
        targets.push(firstVertex + ((communityIndex + 3) % connectedCount));
      }

      if (communityIndex > 0 && communityIndex % 4 === 0) {
        sources.push(vertex);
        targets.push(firstVertex);
      }
    }
  }

  // Join only the first pair so weak components, an isolated vertex, and hubs remain visible.
  sources.push(0);
  targets.push(Math.floor(vertexCount / GRAPH_EXPLORER_COMMUNITY_COUNT));

  const midpoint = Math.ceil(sources.length / 2);
  return {
    vertexCount,
    sourceChunks: [
      Uint32Array.from(sources.slice(0, midpoint)),
      new Uint32Array(0),
      Uint32Array.from(sources.slice(midpoint))
    ],
    targetChunks: [
      Uint32Array.from(targets.slice(0, midpoint)),
      new Uint32Array(0),
      Uint32Array.from(targets.slice(midpoint))
    ],
    positions,
    velocities
  };
}
