// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RigidBodyVector} from './rigid-body-properties';

/** Grid in the collider's local Z-up frame, with row-major scalar heights. */
export type GPURigidBodyHeightField = {
  /** Number of columns, including both ends of the tile. */
  width: number;
  /** Number of rows, including both ends of the tile. */
  height: number;
  /** First sample in local XY, after any cell-registration shift. */
  origin?: readonly [number, number];
  /** Metric column basis vector. Defaults to a unit step along X. */
  columnStep?: readonly [number, number];
  /** Metric row basis vector. Defaults to a unit step along Y. */
  rowStep?: readonly [number, number];
  /** The diagonal connecting opposite samples in each cell. */
  diagonal?: '00-11' | '10-01';
  /** Missing heights allocate a vacant slot. Nonfinite or masked samples omit their triangles. */
  heights?: Float32Array | Float64Array;
  /** Optional row-major mask with zero for an absent sample. */
  validity?: Uint8Array;
};

/** Structural subset of math.gl HeightField needed to create a collider without a terrain dependency. */
export type GPURigidBodyHeightFieldSource = {
  /** Source column count. */
  readonly width: number;
  /** Source row count. */
  readonly height: number;
  /** Metric source origin before applying sample registration. */
  readonly origin: readonly [number, number];
  /** Metric column basis vector. */
  readonly columnStep: readonly [number, number];
  /** Metric row basis vector. */
  readonly rowStep: readonly [number, number];
  /** Placement of the first sample relative to the source origin. */
  readonly registration: 'vertex' | 'cell';
  /** Authored triangle diagonal used for each cell. */
  readonly diagonal: '00-11' | '10-01';
  /** Return detached row-major data and validity. */
  copyData(): {heights: Float32Array | Float64Array; validity: Uint8Array};
};

/** Detach math.gl samples and express them relative to the supplied collider origin. */
export function makeRigidBodyHeightField(
  source: GPURigidBodyHeightFieldSource,
  colliderOrigin: RigidBodyVector
): GPURigidBodyHeightField {
  const samples = source.copyData();
  const registrationOffset = source.registration === 'cell' ? 0.5 : 0;
  return {
    width: source.width,
    height: source.height,
    origin: [
      source.origin[0] -
        colliderOrigin[0] +
        registrationOffset * (source.columnStep[0] + source.rowStep[0]),
      source.origin[1] -
        colliderOrigin[1] +
        registrationOffset * (source.columnStep[1] + source.rowStep[1])
    ],
    columnStep: [...source.columnStep],
    rowStep: [...source.rowStep],
    diagonal: source.diagonal,
    heights: Float64Array.from(samples.heights, height => height - colliderOrigin[2]),
    validity: samples.validity
  };
}

/** One reserved f32 value marks a missing height in the GPU data. */
const MISSING_HEIGHT = Math.fround(3.402823e38);
/** Leaves cover a contiguous range from a single row of at most eight cells. */
const CELLS_PER_LEAF = 8;

/** Exact fixed payload size, independent of height values and missing-data masks. */
export function getRigidBodyHeightFieldPageWords(width: number, height: number): number {
  const sampleCount = width * height;
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 2 ||
    height < 2 ||
    sampleCount > 1_000_000
  )
    throw new Error('Invalid height-field grid');
  // Every row eventually uses the same bisection of its columns. Interleaving the
  // row splits changes traversal order, but the full binary tree has 2 * leaves - 1 nodes.
  const memo = new Map<number, number>();
  /** Count single-row leaves after the same column bisection used by the packer. */
  const countLeaves = (columns: number): number => {
    if (columns <= CELLS_PER_LEAF) return 1;
    const cached = memo.get(columns);
    if (cached !== undefined) return cached;
    const half = Math.floor(columns / 2);
    const leaves = countLeaves(half) + countLeaves(columns - half);
    memo.set(columns, leaves);
    return leaves;
  };
  const leaves = countLeaves(width - 1) * (height - 1);
  return 8 + Math.ceil(sampleCount / 4) * 4 + (2 * leaves - 1) * 12;
}

/** Pack scalar samples and a bounded stackless hierarchy, with no stored vertices or triangle indices. */
export function packRigidBodyHeightField(field: GPURigidBodyHeightField) {
  const {width, height, heights, validity, diagonal = '00-11'} = field;
  const sampleCount = width * height;
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 2 ||
    height < 2 ||
    sampleCount > 1_000_000 ||
    (heights && heights.length !== sampleCount) ||
    (validity && validity.length !== sampleCount) ||
    (diagonal !== '00-11' && diagonal !== '10-01')
  )
    throw new Error('Invalid height-field grid');

  const origin = (field.origin ?? [0, 0]).map(Math.fround);
  const columnStep = (field.columnStep ?? [1, 0]).map(Math.fround);
  const rowStep = (field.rowStep ?? [0, 1]).map(Math.fround);
  const determinant = columnStep[0] * rowStep[1] - columnStep[1] * rowStep[0];
  const horizontalScale = [0, 1].map(
    axis =>
      Math.abs(origin[axis]) +
      Math.abs(columnStep[axis]) * (width - 1) +
      Math.abs(rowStep[axis]) * (height - 1)
  );
  if (
    origin.length !== 2 ||
    columnStep.length !== 2 ||
    rowStep.length !== 2 ||
    ![...origin, ...columnStep, ...rowStep, ...horizontalScale].every(value =>
      Number.isFinite(Math.fround(value))
    ) ||
    Math.abs(determinant) <= 1e-7 * Math.hypot(...columnStep) * Math.hypot(...rowStep)
  )
    throw new Error('Invalid height-field transform');

  // Match shader arithmetic at the sample positions, padding conservative XY bounds
  // for separate rounding of the index products and sum.
  const roundingPadding = horizontalScale.map(value => value * 2 ** -21);
  const nodeOffset = 2 + Math.ceil(sampleCount / 4);
  const data = new Array<number>(nodeOffset * 4).fill(MISSING_HEIGHT);
  data.splice(
    0,
    8,
    ...columnStep,
    ...rowStep,
    ...origin,
    width,
    Number(diagonal === '10-01') + 2 * Number(determinant < 0)
  );
  for (let index = 0; heights && index < sampleCount; index++) {
    if (validity?.[index] === 0 || !Number.isFinite(heights[index])) continue;
    const sample = Math.fround(heights[index]);
    if (!Number.isFinite(sample) || sample === MISSING_HEIGHT)
      throw new Error('Height-field sample exceeds float32 range');
    data[8 + index] = sample;
  }

  /** Build deterministic rectangular nodes even for an empty or partially loaded slot. */
  const appendNode = (
    firstColumn: number,
    firstRow: number,
    columns: number,
    rows: number
  ): number => {
    const offset = data.length;
    data.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    let minimumHeight = Infinity;
    let maximumHeight = -Infinity;
    if (rows === 1 && columns <= CELLS_PER_LEAF) {
      const firstSample = firstRow * width + firstColumn;
      for (let column = 0; column < columns; column++) {
        const sample = 8 + firstSample + column;
        const first = data[sample];
        const second = data[sample + 1];
        const third = data[sample + width];
        const fourth = data[sample + width + 1];
        const triangles =
          diagonal === '00-11'
            ? [first, second, fourth, first, fourth, third]
            : [first, second, third, second, fourth, third];
        for (let triangle = 0; triangle < 6; triangle += 3) {
          const cornerA = triangles[triangle];
          const cornerB = triangles[triangle + 1];
          const cornerC = triangles[triangle + 2];
          if (
            cornerA === MISSING_HEIGHT ||
            cornerB === MISSING_HEIGHT ||
            cornerC === MISSING_HEIGHT
          )
            continue;
          minimumHeight = Math.min(minimumHeight, cornerA, cornerB, cornerC);
          maximumHeight = Math.max(maximumHeight, cornerA, cornerB, cornerC);
        }
      }
      data[offset + 7] = minimumHeight <= maximumHeight ? columns * 2 : 0;
      data[offset + 8] = 2 * (firstRow * (width - 1) + firstColumn);
    } else {
      let firstChild: number;
      let secondChild: number;
      if (columns > CELLS_PER_LEAF && (rows === 1 || columns >= rows * CELLS_PER_LEAF)) {
        const split = Math.floor(columns / 2);
        firstChild = appendNode(firstColumn, firstRow, split, rows);
        secondChild = appendNode(firstColumn + split, firstRow, columns - split, rows);
      } else {
        const split = Math.floor(rows / 2);
        firstChild = appendNode(firstColumn, firstRow, columns, split);
        secondChild = appendNode(firstColumn, firstRow + split, columns, rows - split);
      }
      minimumHeight = Math.min(data[firstChild + 2], data[secondChild + 2]);
      maximumHeight = Math.max(data[firstChild + 6], data[secondChild + 6]);
    }
    if (minimumHeight <= maximumHeight) {
      for (let axis = 0; axis < 2; axis++) {
        const first = origin[axis] + firstColumn * columnStep[axis] + firstRow * rowStep[axis];
        const column = columns * columnStep[axis];
        const row = rows * rowStep[axis];
        data[offset + axis] =
          first + Math.min(0, column) + Math.min(0, row) - roundingPadding[axis];
        data[offset + 4 + axis] =
          first + Math.max(0, column) + Math.max(0, row) + roundingPadding[axis];
      }
    }
    data[offset + 2] = minimumHeight;
    data[offset + 6] = maximumHeight;
    data[offset + 3] = (data.length - nodeOffset * 4) / 12;
    return offset;
  };
  const root = appendNode(0, 0, width - 1, height - 1);
  const active = data[root + 2] <= data[root + 6];
  // Empty hierarchy branches have reversed finite bounds. Readers skip them without
  // evaluating a cast against invalid limits. The allocation stays identical on reload.
  for (let offset = root; offset < data.length; offset += 12) {
    if (data[offset + 2] > data[offset + 6]) {
      data[offset + 2] = 1;
      data[offset + 6] = -1;
    }
  }
  const extent = active
    ? [0, 1, 2].map(axis => Math.max(Math.abs(data[root + axis]), Math.abs(data[root + 4 + axis])))
    : [0, 0, 0];
  if (!extent.every(value => Number.isFinite(Math.fround(value))))
    throw new Error('Height-field bounds exceed float32 range');
  return {
    data,
    extent,
    nodeOffset,
    nodeCount: active ? (data.length - root) / 12 : 0,
    triangleCount: active ? (width - 1) * (height - 1) * 2 : 0
  };
}
