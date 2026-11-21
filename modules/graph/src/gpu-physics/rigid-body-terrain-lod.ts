// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBodyTerrainEdge, GPURigidBodyTerrainSeam} from './rigid-body-terrain-stitch';
import type {GPURigidBodyTerrainSlot, GPURigidBodyTerrainWindow} from './rigid-body-terrain-stream';

/** Planar metric bounds, in minimum east, minimum north, maximum east, maximum north order. */
export type GPURigidBodyTerrainBounds = readonly [number, number, number, number];

/** Quadtree address in a common metric frame. Rows increase along the positive north axis. */
export type GPURigidBodyTerrainAddress = Readonly<{
  /** Zero at the root. */
  level: number;
  /** West-to-east index at this level. */
  column: number;
  /** South-to-north index at this level. */
  row: number;
}>;

/** A selected provider tile, receiving collider, and sampling bounds. */
export type GPURigidBodySelectedTerrainTile = GPURigidBodyTerrainSlot & {
  /** Quadtree position of the tile. */
  address: GPURigidBodyTerrainAddress;
  /** Metric domain expected in the fetched tile. */
  bounds: GPURigidBodyTerrainBounds;
};

/** A collider window and its quadtree selection diagnostics. */
export type GPURigidBodyTerrainSelection = GPURigidBodyTerrainWindow & {
  /** Selected nonoverlapping leaves with stable assignments where possible. */
  tiles: readonly GPURigidBodySelectedTerrainTile[];
  /** Edge matches computed from the selected quadtree leaves. */
  seams: readonly GPURigidBodyTerrainSeam[];
  /** Refinement was limited by the reserved collider slots. */
  slotLimitReached: boolean;
};

/** Dataset coverage and selection policy. */
export type GPURigidBodyTerrainSelectorProps = {
  /** Bounds of the root tile in a shared local metric frame. */
  bounds: GPURigidBodyTerrainBounds;
  /** Reserved fixed-dimension height-field collider indices. */
  slots: readonly number[];
  /** Deepest available quadtree level. */
  maximumLevel: number;
  /** Refine within this many tile widths of the focus. Defaults to one. */
  refinementDistance?: number;
  /** Fractional dead band around LOD and residency thresholds. Defaults to 0.2. */
  hysteresis?: number;
  /** Resolve a revisioned provider key. Undefined denotes a missing tile. */
  getTileKey?: (address: GPURigidBodyTerrainAddress) => string | undefined;
};

/** Location and optional collision residency radius used for one selection. */
export type GPURigidBodyTerrainFocus = {
  /** Position of a camera, chassis, or predicted simulation focus in metric XY. */
  position: readonly [number, number];
  /** Include tiles intersecting this radius. Omit to keep coarse coverage to the root boundary. */
  radius?: number;
};

/** A leaf and its order of preference for refinement. */
type Candidate = {
  id: string;
  key: string;
  address: GPURigidBodyTerrainAddress;
  bounds: GPURigidBodyTerrainBounds;
  priority: number;
};

/** Relative offsets, and the matching grid-index edges of a neighbor. */
const DIRECTIONS = [
  {column: -1, row: 0, edge: 'first-column', opposite: 'last-column'},
  {column: 1, row: 0, edge: 'last-column', opposite: 'first-column'},
  {column: 0, row: -1, edge: 'first-row', opposite: 'last-row'},
  {column: 0, row: 1, edge: 'last-row', opposite: 'first-row'}
] as const satisfies readonly {
  column: number;
  row: number;
  edge: GPURigidBodyTerrainEdge;
  opposite: GPURigidBodyTerrainEdge;
}[];

/** Resolve the sampling domain of a quadtree address from the root extent. */
export function getRigidBodyTerrainTileBounds(
  bounds: GPURigidBodyTerrainBounds,
  address: GPURigidBodyTerrainAddress
): GPURigidBodyTerrainBounds {
  const divisions = 2 ** address.level;
  const east = (bounds[2] - bounds[0]) / divisions;
  const north = (bounds[3] - bounds[1]) / divisions;
  return [
    bounds[0] + address.column * east,
    bounds[1] + address.row * north,
    bounds[0] + (address.column + 1) * east,
    bounds[1] + (address.row + 1) * north
  ];
}

/** Select a bounded collision window with 2:1 neighboring LODs and automatic seam declarations. */
export class GPURigidBodyTerrainSelector {
  /** A detached copy of the dataset extent. */
  private readonly bounds: GPURigidBodyTerrainBounds;
  /** Stable slot order used to break ties. */
  private readonly slots: readonly number[];
  /** Per-tile distance threshold multiplier. */
  private readonly refinementDistance: number;
  /** LOD and residency dead band. */
  private readonly hysteresis: number;
  /** Collider assignment from the last selected window. */
  private previous = new Map<string, number>();
  /** Previously split ancestors, used to retain detail near the threshold. */
  private previousSplits = new Set<string>();

  /** Establish the provider topology and fixed collider budget. */
  constructor(private readonly props: GPURigidBodyTerrainSelectorProps) {
    const {bounds, maximumLevel, slots} = props;
    this.refinementDistance = props.refinementDistance ?? 1;
    this.hysteresis = props.hysteresis ?? 0.2;
    if (
      bounds.length !== 4 ||
      !bounds.every(Number.isFinite) ||
      !Number.isFinite(bounds[2] - bounds[0]) ||
      !Number.isFinite(bounds[3] - bounds[1]) ||
      bounds[2] <= bounds[0] ||
      bounds[3] <= bounds[1] ||
      !Number.isSafeInteger(maximumLevel) ||
      maximumLevel < 0 ||
      maximumLevel > 24 ||
      !slots.length ||
      new Set(slots).size !== slots.length ||
      slots.some(slot => !Number.isSafeInteger(slot) || slot < 0) ||
      !Number.isFinite(this.refinementDistance) ||
      this.refinementDistance < 0 ||
      !Number.isFinite(this.hysteresis) ||
      this.hysteresis < 0 ||
      this.hysteresis >= 1
    )
      throw new Error('Invalid terrain selection policy');
    this.bounds = [...bounds];
    this.slots = [...slots];
  }

  /** Forget LOD hysteresis and previous slot choices after teleporting or resetting the app. */
  reset(): void {
    this.previous.clear();
    this.previousSplits.clear();
  }

  /** Select leaves near the focus. Missing children or exhausted slots retain their parent. */
  select(focus: GPURigidBodyTerrainFocus): GPURigidBodyTerrainSelection {
    const {position, radius = Infinity} = focus;
    if (position.length !== 2 || !position.every(Number.isFinite) || !(radius >= 0))
      throw new Error('Invalid terrain focus');
    const leaves = new Map<string, Candidate>();
    const split = new Set<string>();
    const queue: Candidate[] = [];
    let slotLimitReached = false;

    /** Calculate proximity and consult the catalog only for the active residency footprint. */
    const getCandidate = (
      address: GPURigidBodyTerrainAddress,
      bounds: GPURigidBodyTerrainBounds
    ) => {
      const id = addressKey(address);
      const distance = Math.hypot(
        Math.max(0, bounds[0] - position[0], position[0] - bounds[2]),
        Math.max(0, bounds[1] - position[1], position[1] - bounds[3])
      );
      const retained = this.previous.has(id) || this.previousSplits.has(id);
      if (distance > radius * (retained ? 1 + this.hysteresis : 1)) return null;
      const key = this.props.getTileKey ? this.props.getTileKey(address) : id;
      if (!key) return undefined;
      const priority = distance / Math.min(bounds[2] - bounds[0], bounds[3] - bounds[1]);
      return {id, key, address, bounds, priority};
    };

    /** Register a leaf and enqueue it if the focus requires a finer resolution. */
    const add = (tile: Candidate) => {
      leaves.set(tile.id, tile);
      const retained = this.previousSplits.has(tile.id);
      const threshold =
        this.refinementDistance * (retained ? 1 + this.hysteresis : 1 - this.hysteresis);
      if (tile.address.level < this.props.maximumLevel && tile.priority <= threshold)
        pushCandidate(queue, tile);
    };

    const root = getCandidate({level: 0, column: 0, row: 0}, this.bounds);
    if (root) add(root);
    while (queue.length) {
      const tile = popCandidate(queue);
      if (!leaves.has(tile.id)) continue;
      const refinements = new Map<Candidate, Candidate[]>();
      let slotCost = 0;
      /** Stage the requested split and any coarser neighbor splits needed to preserve 2:1. */
      const planSplit = (parent: Candidate): boolean => {
        if (refinements.has(parent)) return true;
        const children: Candidate[] = [];
        const {level, column, row} = parent.address;
        for (let child = 0; child < 4; child++) {
          const address = {
            level: level + 1,
            column: column * 2 + (child % 2),
            row: row * 2 + Math.floor(child / 2)
          };
          const candidate = getCandidate(
            address,
            getRigidBodyTerrainTileBounds(this.bounds, address)
          );
          if (candidate === undefined) return false;
          if (candidate) children.push(candidate);
        }
        if (!children.length) return false;
        refinements.set(parent, children);
        slotCost += children.length - 1;
        if (leaves.size + slotCost > this.slots.length) {
          slotLimitReached = true;
          return false;
        }
        for (const direction of DIRECTIONS) {
          const neighbor = getNeighbor(leaves, parent.address, direction);
          if (neighbor && neighbor.address.level < level && !planSplit(neighbor)) return false;
        }
        return true;
      };
      if (!planSplit(tile)) continue;
      for (const [parent, children] of refinements) {
        leaves.delete(parent.id);
        split.add(parent.id);
        for (const child of children) add(child);
      }
    }

    const assignments = new Map<string, number>();
    for (const id of leaves.keys()) {
      const slot = this.previous.get(id);
      if (slot !== undefined) assignments.set(id, slot);
    }
    const taken = new Set(assignments.values());
    const vacancies = this.slots.filter(slot => !taken.has(slot));
    let nextSlot = 0;
    const tiles = Array.from(leaves.values(), ({id, key, address, bounds}) => {
      const collider = assignments.get(id) ?? vacancies[nextSlot++];
      assignments.set(id, collider);
      return {collider, key, address, bounds};
    });
    const seams: GPURigidBodyTerrainSeam[] = [];
    for (const tile of tiles) {
      for (const direction of DIRECTIONS) {
        const neighbor = getNeighbor(leaves, tile.address, direction);
        if (!neighbor) continue;
        const collider = assignments.get(neighbor.id)!;
        // A fine tile finds its coarse neighbor by walking ancestors. Equal levels only emit once.
        if (neighbor.address.level === tile.address.level && collider < tile.collider) continue;
        seams.push({
          first: tile.collider,
          firstEdge: direction.edge,
          second: collider,
          secondEdge: direction.opposite
        });
      }
    }
    this.previous = assignments;
    this.previousSplits = split;
    return {tiles, seams, slotLimitReached};
  }
}

/** Encode a dyadic tile address as its default provider key. */
function addressKey(address: GPURigidBodyTerrainAddress): string {
  return `${address.level}/${address.column}/${address.row}`;
}

/** Find a same-level or coarser leaf across an edge. Fine neighbors emit their own seam. */
function getNeighbor(
  leaves: ReadonlyMap<string, Candidate>,
  address: GPURigidBodyTerrainAddress,
  direction: (typeof DIRECTIONS)[number]
): Candidate | undefined {
  let column = address.column + direction.column;
  let row = address.row + direction.row;
  const count = 2 ** address.level;
  if (column < 0 || row < 0 || column >= count || row >= count) return undefined;
  for (let level = address.level; level >= 0; level--) {
    const tile = leaves.get(addressKey({level, column, row}));
    if (tile) return tile;
    column = Math.floor(column / 2);
    row = Math.floor(row / 2);
  }
  return undefined;
}

/** Prefer nearby tiles and resolve equal priorities deterministically. */
function compareCandidates(first: Candidate, second: Candidate): number {
  return (
    first.priority - second.priority ||
    first.address.level - second.address.level ||
    first.address.row - second.address.row ||
    first.address.column - second.address.column
  );
}

/** Insert a refinement candidate in the priority heap. */
function pushCandidate(queue: Candidate[], candidate: Candidate): void {
  let index = queue.length;
  queue.push(candidate);
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (compareCandidates(queue[parent], candidate) <= 0) break;
    queue[index] = queue[parent];
    index = parent;
  }
  queue[index] = candidate;
}

/** Remove the highest-priority refinement candidate. */
function popCandidate(queue: Candidate[]): Candidate {
  const first = queue[0];
  const last = queue.pop()!;
  if (!queue.length) return first;
  let index = 0;
  while (index * 2 + 1 < queue.length) {
    let child = index * 2 + 1;
    if (child + 1 < queue.length && compareCandidates(queue[child + 1], queue[child]) < 0) child++;
    if (compareCandidates(last, queue[child]) <= 0) break;
    queue[index] = queue[child];
    index = child;
  }
  queue[index] = last;
  return first;
}
