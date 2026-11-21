// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBodyHeightField} from './rigid-body-height-field';
import type {RigidBodyVector} from './rigid-body-properties';

/** A source tile in the common metric frame shared by the receiving collider slots. */
export type GPURigidBodyTerrainTile = {
  /** Source samples and affine grid transform. */
  field: GPURigidBodyHeightField;
  /** Placement of the tile in the common frame. */
  position: RigidBodyVector;
};

/** Grid-index boundary, independent of the compass direction of its affine transform. */
export type GPURigidBodyTerrainEdge = 'first-column' | 'last-column' | 'first-row' | 'last-row';

/** Two declared adjacent edges indexed by collider slot in a terrain window. */
export type GPURigidBodyTerrainSeam = {
  /** First collider slot. */
  first: number;
  /** Edge of the first tile. */
  firstEdge: GPURigidBodyTerrainEdge;
  /** Second collider slot. */
  second: number;
  /** Edge of the second tile. */
  secondEdge: GPURigidBodyTerrainEdge;
};

/** Metric sample positions and their row-major indices on one boundary. */
type Boundary = {
  slot: number;
  tile: GPURigidBodyTerrainTile;
  origin: readonly [number, number];
  step: readonly [number, number];
  count: number;
  index: (sample: number) => number;
};

/** One equivalence class of colocated boundary samples. */
type Sample = {
  parent: Sample | null;
  value: number;
  spacing: number;
  slot: number;
  index: number;
  valid: boolean;
};

/** A fine boundary sample constrained to a coarse linear segment. */
type Interpolation = {fine: Sample; lower: Sample; upper: Sample; fraction: number};

/** Match aligned mixed-resolution edges without mutating any provider tile. */
export function stitchRigidBodyTerrainTiles(
  tiles: ReadonlyMap<number, GPURigidBodyTerrainTile>,
  seams: readonly GPURigidBodyTerrainSeam[]
): ReadonlyMap<number, GPURigidBodyTerrainTile> {
  if (!seams.length) return tiles;
  const samples = new Map<number, Map<number, Sample>>();
  const constraints: Interpolation[] = [];
  const aliases: [Sample, Sample][] = [];

  /** Retain original samples until every neighbor and corner constraint is collected. */
  const getSample = (boundary: Boundary, edgeIndex: number): Sample => {
    let tileSamples = samples.get(boundary.slot);
    if (!tileSamples) {
      tileSamples = new Map();
      samples.set(boundary.slot, tileSamples);
    }
    const index = boundary.index(edgeIndex);
    const {field, position} = boundary.tile;
    const sourceHeight = field.heights?.[index] ?? NaN;
    const spacing = Math.hypot(...boundary.step);
    let sample = tileSamples.get(index);
    if (!sample) {
      sample = {
        parent: null,
        value: sourceHeight + position[2],
        valid: Number.isFinite(sourceHeight) && field.validity?.[index] !== 0,
        spacing,
        slot: boundary.slot,
        index
      };
      tileSamples.set(index, sample);
    } else {
      sample.spacing = Math.max(sample.spacing, spacing);
    }
    return sample;
  };

  for (const seam of seams) {
    const first = makeBoundary(tiles, seam.first, seam.firstEdge);
    const second = makeBoundary(tiles, seam.second, seam.secondEdge);
    if (first.slot === second.slot) throw new Error('Terrain seam requires distinct tiles');
    const firstSpacing = Math.hypot(...first.step);
    const secondSpacing = Math.hypot(...second.step);
    const firstIsCoarse = firstSpacing >= secondSpacing;
    const coarse = firstIsCoarse ? first : second;
    const fine = firstIsCoarse ? second : first;
    const spacing = Math.max(firstSpacing, secondSpacing);
    const spacingRatio = Math.min(firstSpacing, secondSpacing) / spacing;
    if (!Number.isFinite(spacingRatio) || spacingRatio <= 0)
      throw new Error('Invalid terrain edge spacing');

    const direction = coarse.step.map(value => value / spacing);
    const offset = fine.origin.map((value, axis) => value - coarse.origin[axis]);
    const projectedStart = (offset[0] * direction[0] + offset[1] * direction[1]) / spacing;
    const projectedStep = (fine.step[0] * direction[0] + fine.step[1] * direction[1]) / spacing;
    // Include subtraction roundoff from large anchors. Reject an ambiguous lattice fit.
    const tolerance =
      16 *
      Number.EPSILON *
      Math.max(
        1,
        coarse.count,
        fine.count,
        ...coarse.origin.map(value => Math.abs(value) / spacing),
        ...fine.origin.map(value => Math.abs(value) / spacing)
      );
    const lateralStart = (offset[0] * direction[1] - offset[1] * direction[0]) / spacing;
    const lateralStep = (fine.step[0] * direction[1] - fine.step[1] * direction[0]) / spacing;
    const subdivision = Math.round(1 / spacingRatio);
    if (
      tolerance >= spacingRatio * 0.01 ||
      Math.max(Math.abs(lateralStart), Math.abs(lateralStart + lateralStep * (fine.count - 1))) >
        tolerance ||
      Math.abs(Math.abs(projectedStep) - 1 / subdivision) * (fine.count - 1) > tolerance ||
      Math.abs(projectedStart * subdivision - Math.round(projectedStart * subdivision)) >
        tolerance * subdivision
    )
      throw new Error('Terrain seam requires collinear nested sample lattices');

    // Work on exact integer subdivisions after matching the physical lattice.
    const start = Math.round(projectedStart * subdivision);
    const directionSign = Math.sign(projectedStep);
    const end = start + directionSign * (fine.count - 1);
    const lower = Math.max(0, Math.min(start, end));
    const upper = Math.min((coarse.count - 1) * subdivision, Math.max(start, end));
    if (upper <= lower || lower % subdivision !== 0 || upper % subdivision !== 0)
      throw new Error('Terrain seam overlap must start and end at common sample knots');

    for (let knot = lower; knot <= upper; knot++) {
      const fineSample = getSample(fine, (knot - start) * directionSign);
      const lowerIndex = Math.floor(knot / subdivision);
      const lowerSample = getSample(coarse, lowerIndex);
      const remainder = knot % subdivision;
      if (remainder === 0) {
        aliases.push([fineSample, lowerSample]);
      } else {
        constraints.push({
          fine: fineSample,
          lower: lowerSample,
          upper: getSample(coarse, lowerIndex + 1),
          fraction: remainder / subdivision
        });
      }
    }
  }

  for (const [first, second] of aliases) uniteSamples(first, second);
  const bySample = new Map<Sample, Interpolation[]>();
  for (const constraint of constraints) {
    const root = getRoot(constraint.fine);
    const existing = bySample.get(root) ?? [];
    existing.push(constraint);
    bySample.set(root, existing);
  }
  const resolved = new Map<Sample, number>();
  const resolving = new Set<Sample>();
  /** Evaluate coarse endpoint constraints before fine samples, including at T-junctions. */
  const resolve = (sample: Sample): number => {
    const root = getRoot(sample);
    const cached = resolved.get(root);
    if (cached !== undefined) return cached;
    if (resolving.has(root)) throw new Error('Cyclic terrain seam constraints');
    resolving.add(root);
    const rules = bySample.get(root);
    let value = root.valid ? root.value : NaN;
    if (root.valid && rules) {
      let previous: number | undefined;
      for (const rule of rules) {
        const lower = resolve(rule.lower);
        const upper = resolve(rule.upper);
        const interpolated = lower + (upper - lower) * rule.fraction;
        if (!Number.isFinite(interpolated)) {
          previous = NaN;
          break;
        }
        if (
          previous !== undefined &&
          Math.abs(previous - interpolated) >
            16 * Number.EPSILON * Math.max(1, Math.abs(previous), Math.abs(interpolated))
        )
          throw new Error('Incompatible terrain junction heights');
        previous = interpolated;
      }
      value = previous!;
    }
    resolving.delete(root);
    resolved.set(root, value);
    return value;
  };

  const result = new Map(tiles);
  for (const [slot, tileSamples] of samples) {
    const tile = tiles.get(slot)!;
    const {field, position} = tile;
    if (!field.heights) continue;
    let heights: Float64Array | undefined;
    for (const sample of tileSamples.values()) {
      const height = resolve(sample) - position[2];
      if (!heights && Object.is(height, field.heights[sample.index])) continue;
      heights ??= Float64Array.from(field.heights);
      heights[sample.index] = height;
    }
    if (heights) result.set(slot, {...tile, field: {...field, heights}});
  }
  return result;
}

/** Read edge positions in the common metric frame. */
function makeBoundary(
  tiles: ReadonlyMap<number, GPURigidBodyTerrainTile>,
  slot: number,
  edge: GPURigidBodyTerrainEdge
): Boundary {
  const tile = tiles.get(slot);
  if (!tile || !tile.field.heights)
    throw new Error('Terrain seam requires two loaded height fields');
  const {field, position} = tile;
  if (
    !Number.isSafeInteger(field.width) ||
    !Number.isSafeInteger(field.height) ||
    field.width < 2 ||
    field.height < 2 ||
    field.width * field.height > 1_000_000 ||
    field.heights?.length !== field.width * field.height ||
    !position.every(Number.isFinite)
  )
    throw new Error('Invalid terrain seam tile');
  const origin = field.origin ?? [0, 0];
  const columnStep = field.columnStep ?? [1, 0];
  const rowStep = field.rowStep ?? [0, 1];
  const rowEdge = edge === 'first-row' || edge === 'last-row';
  const row = edge === 'last-row' ? field.height - 1 : 0;
  const column = edge === 'last-column' ? field.width - 1 : 0;
  return {
    slot,
    tile,
    origin: [
      position[0] + origin[0] + column * columnStep[0] + row * rowStep[0],
      position[1] + origin[1] + column * columnStep[1] + row * rowStep[1]
    ],
    step: rowEdge ? columnStep : rowStep,
    count: rowEdge ? field.width : field.height,
    index: rowEdge ? sample => row * field.width + sample : sample => sample * field.width + column
  };
}

/** Find and compress a shared grid knot's authoritative sample. */
function getRoot(sample: Sample): Sample {
  let root = sample;
  while (root.parent) root = root.parent;
  while (sample.parent) {
    const previous = sample.parent;
    sample.parent = root;
    sample = previous;
  }
  return root;
}

/** Join knots with deterministic coarse-first ownership and conservative missing-data handling. */
function uniteSamples(first: Sample, second: Sample): void {
  const firstRoot = getRoot(first);
  const secondRoot = getRoot(second);
  if (firstRoot === secondRoot) return;
  // A tie uses the stable slot ID. Comparing grid spacing also resolves corner ownership.
  const firstWins =
    firstRoot.spacing > secondRoot.spacing ||
    (firstRoot.spacing === secondRoot.spacing && firstRoot.slot < secondRoot.slot);
  const authority = firstWins ? firstRoot : secondRoot;
  const dependent = firstWins ? secondRoot : firstRoot;
  authority.valid &&= dependent.valid;
  dependent.parent = authority;
}
