// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {compileProjectionPlan} from './projection-plan';
import type {
  CompileProjectionPlanOptions,
  ProjectionBounds,
  ProjectionCoordinates,
  ProjectionPatch,
  ProjectionPlan,
  ProjectionProvider
} from './types';

/** An explicit source branch, never inferred from a CRS catalog envelope or derivative. */
export type ProjectionDomainBranch = {
  id: string;
  projection: ProjectionProvider;
  bounds: ProjectionBounds;
  /** Optional circular clipping region. Only conservatively interior rectangular cells are fitted. */
  disk?: {center: ProjectionCoordinates; radius: number; inset?: number};
};

export type ProjectionPartitionOptions = Omit<
  CompileProjectionPlanOptions,
  'projection' | 'bounds' | 'precision'
> & {
  branches: readonly ProjectionDomainBranch[];
  /** Curved boundary subdivision, independent of approximation subdivision. Defaults to 5. */
  domainDepth?: number;
  /** Limit all visited domain cells, including rejected cells. Defaults to 8192. */
  maxDomainCells?: number;
};

export type ProjectionPartition = {
  plan: ProjectionPlan;
  branches: readonly {id: string; firstPatch: number; patchEnd: number}[];
  visitedCells: number;
  /** Boundary cells intentionally excluded at the requested domain resolution. */
  unresolvedCells: number;
};

/**
 * Fits disconnected branches separately, keeping gaps invalid on CPU and GPU. Circular boundaries
 * use conservative interior cells: this is not an exact disk tessellation. A provider is never
 * sampled in an unresolved cell. Inverse partitions must be compiled independently, then supplied
 * as an adaptive operation's inversePlan; a forward envelope is not an inverse-domain proof.
 */
export function compileProjectionPartition(
  options: ProjectionPartitionOptions
): ProjectionPartition {
  const {branches, domainDepth = 5, maxDomainCells = 8192, maxPatches = 4096, ...fitting} = options;
  if (
    !branches.length ||
    new Set(branches.map(branch => branch.id)).size !== branches.length ||
    !Number.isSafeInteger(domainDepth) ||
    domainDepth < 0 ||
    domainDepth > 16 ||
    !Number.isSafeInteger(maxDomainCells) ||
    maxDomainCells < 1 ||
    !Number.isSafeInteger(maxPatches) ||
    maxPatches < 1
  )
    throw new Error('invalid projection partition limits');
  const patches: ProjectionPatch[] = [];
  const branchRanges: {id: string; firstPatch: number; patchEnd: number}[] = [];
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  let firstPlan: ProjectionPlan | undefined;
  let visitedCells = 0;
  let unresolvedCells = 0;
  for (const [branchIndex, branch] of branches.entries()) {
    if (
      !branch.id ||
      !branch.bounds.every(Number.isFinite) ||
      branch.bounds[0] >= branch.bounds[2] ||
      branch.bounds[1] >= branch.bounds[3]
    )
      throw new Error('invalid projection branch bounds');
    // Shared boundaries would make inverse branch identity ambiguous. Applications must leave
    // an explicit rejected seam or choose disjoint envelopes themselves.
    if (
      branches
        .slice(0, branchIndex)
        .some(previous => rectanglesOverlap(previous.bounds, branch.bounds))
    )
      throw new Error('projection branch envelopes must be disjoint, including their boundaries');
    const disk = branch.disk;
    const inset = disk
      ? Math.max(
          disk.inset ?? 0,
          disk.radius * 1e-10,
          ...disk.center.map(value => Math.abs(value) * Number.EPSILON * 16)
        )
      : 0;
    if (
      disk &&
      (disk.center.length !== 2 ||
        !disk.center.every(Number.isFinite) ||
        !Number.isFinite(disk.radius) ||
        disk.radius <= 0 ||
        !Number.isFinite(inset) ||
        inset < 0 ||
        inset >= disk.radius ||
        (disk.inset !== undefined && (!Number.isFinite(disk.inset) || disk.inset < 0)))
    )
      throw new Error('invalid projection clipping disk');
    const firstPatch = patches.length;
    const visitCell = (cell: ProjectionBounds, depth: number): void => {
      if (++visitedCells > maxDomainCells)
        throw new Error('projection partition exceeds its domain-cell limit');
      if (disk) {
        const farthest = Math.hypot(
          Math.max(Math.abs(cell[0] - disk.center[0]), Math.abs(cell[2] - disk.center[0])),
          Math.max(Math.abs(cell[1] - disk.center[1]), Math.abs(cell[3] - disk.center[1]))
        );
        if (farthest > disk.radius - inset) {
          const nearest = Math.hypot(
            Math.max(cell[0] - disk.center[0], 0, disk.center[0] - cell[2]),
            Math.max(cell[1] - disk.center[1], 0, disk.center[1] - cell[3])
          );
          if (nearest >= disk.radius - inset) return;
          if (depth === domainDepth) {
            unresolvedCells++;
            return;
          }
          const middleX = cell[0] / 2 + cell[2] / 2;
          const middleY = cell[1] / 2 + cell[3] / 2;
          if (middleX <= cell[0] || middleX >= cell[2] || middleY <= cell[1] || middleY >= cell[3])
            throw new Error('projection domain cannot be subdivided further');
          visitCell([cell[0], cell[1], middleX, middleY], depth + 1);
          visitCell([middleX, cell[1], cell[2], middleY], depth + 1);
          visitCell([cell[0], middleY, middleX, cell[3]], depth + 1);
          visitCell([middleX, middleY, cell[2], cell[3]], depth + 1);
          return;
        }
      }
      if (patches.length >= maxPatches)
        throw new Error('projection partition exceeds its patch limit');
      const plan = compileProjectionPlan({
        ...fitting,
        projection: branch.projection,
        bounds: cell,
        precision: 'double-single',
        maxPatches: maxPatches - patches.length
      });
      firstPlan ??= plan;
      for (const patch of plan.patches) patches.push({...patch, id: patches.length});
    };
    visitCell(branch.bounds, 0);
    if (patches.length === firstPatch)
      throw new Error('projection branch has no accepted interior cells');
    branchRanges.push({id: branch.id, firstPatch, patchEnd: patches.length});
    for (let axis = 0; axis < 2; axis++) {
      bounds[axis] = Math.min(bounds[axis], branch.bounds[axis]);
      bounds[axis + 2] = Math.max(bounds[axis + 2], branch.bounds[axis + 2]);
    }
  }
  if (!firstPlan) throw new Error('projection partition has no patches');
  return {
    plan: {
      ...firstPlan,
      bounds,
      patches,
      strictDomains: true,
      maxError: patches.reduce((maximum, patch) => Math.max(maximum, patch.maxError), 0),
      doubleSingleMaxError: patches.reduce(
        (maximum, patch) => Math.max(maximum, patch.doubleSingleMaxError),
        0
      ),
      // Per-cell local origins differ: no combined local-Float32 error estimate is certified.
      float32MaxError: Infinity
    },
    branches: branchRanges,
    visitedCells,
    unresolvedCells
  };
}

export type ProjectionSegment = {
  patchId: number;
  start: ProjectionCoordinates;
  end: ProjectionCoordinates;
  interval: readonly [number, number];
};

/**
 * Clips a straight source-coordinate segment against accepted cells, splitting at every patch.
 * No edge bridges a rejected gap. Does not unwrap longitudes, densify curves or rebuild polygons.
 */
export function clipProjectionSegment(
  plan: ProjectionPlan,
  start: ProjectionCoordinates,
  end: ProjectionCoordinates
): ProjectionSegment[] {
  if (![...start, ...end].every(Number.isFinite)) return [];
  const segments: ProjectionSegment[] = [];
  for (const patch of plan.patches) {
    let minimum = 0;
    let maximum = 1;
    for (let axis = 0; axis < 2; axis++) {
      const delta = end[axis] - start[axis];
      if (!Number.isFinite(delta))
        throw new Error('projection segment exceeds finite coordinate range');
      if (delta === 0) {
        if (start[axis] < patch.bounds[axis] || start[axis] > patch.bounds[axis + 2]) maximum = -1;
      } else {
        const first = (patch.bounds[axis] - start[axis]) / delta;
        const second = (patch.bounds[axis + 2] - start[axis]) / delta;
        minimum = Math.max(minimum, Math.min(first, second));
        maximum = Math.min(maximum, Math.max(first, second));
      }
    }
    if (minimum < maximum) {
      segments.push({
        patchId: patch.id,
        start,
        end,
        interval: [minimum, maximum]
      });
    }
  }
  // An edge on a shared cell boundary belongs to the first patch, not both. Split at every
  // interval endpoint before choosing the canonical patch, including unequal-size neighbors.
  const endpoints = [...new Set(segments.flatMap(segment => [...segment.interval]))].sort(
    (first, second) => first - second
  );
  const clipped: ProjectionSegment[] = [];
  for (let index = 1; index < endpoints.length; index++) {
    const minimum = endpoints[index - 1];
    const maximum = endpoints[index];
    const segment = segments.find(
      candidate => candidate.interval[0] <= minimum && candidate.interval[1] >= maximum
    );
    if (!segment) continue;
    const patch = plan.patches[segment.patchId];
    const point = (parameter: number): ProjectionCoordinates => {
      const coordinate = (axis: number) =>
        Math.max(
          patch.bounds[axis],
          Math.min(patch.bounds[axis + 2], start[axis] + (end[axis] - start[axis]) * parameter)
        );
      return [coordinate(0), coordinate(1)];
    };
    clipped.push({
      patchId: segment.patchId,
      start: point(minimum),
      end: point(maximum),
      interval: [minimum, maximum]
    });
  }
  return clipped;
}

function rectanglesOverlap(first: ProjectionBounds, second: ProjectionBounds): boolean {
  return (
    first[0] <= second[2] && first[2] >= second[0] && first[1] <= second[3] && first[3] >= second[1]
  );
}
