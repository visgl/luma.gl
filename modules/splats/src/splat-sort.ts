// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Camera-dependent Gaussian splat depth-ordering strategies. */
export type SplatSortMode = 'none' | 'global' | 'tile';

/** Number of low-order bits reserved for quantized back-to-front depth. */
export const SPLAT_DEPTH_KEY_BITS = 24;
/** Screen-space tile size used by tile-local depth ordering. */
export const SPLAT_TILE_SIZE_PIXELS = 16;

const MAX_DEPTH_KEY = (1 << SPLAT_DEPTH_KEY_BITS) - 1;
const MIN_RADIX_SORT_REFERENCE_COUNT = 8192;
const RADIX_DIGIT_BITS = 8;
const RADIX_DIGIT_COUNT = 1 << RADIX_DIGIT_BITS;
const RADIX_PASS_COUNT = 4;
const FLOAT32_SIGN_BIT = 0x80000000;

/** One source row retained in a camera-dependent render ordering. */
export type SplatSortReference = {
  /** Position in the renderer's borrowed prepared batch list. */
  batchIndex: number;
  /** Zero-based row within the borrowed source batch. */
  batchRowIndex: number;
  /** Stable global source-row index. */
  rowIndex: number;
  /** Positive back-to-front camera depth. */
  depth: number;
  /** Screen tile identity used by tile-local sorting. */
  tileIndex: number;
};

/** Quantizes one positive depth into an ascending, back-to-front sortable key. */
export function packSplatDepthKey(
  depth: number,
  options: {depthMin?: number; depthMax?: number; tileId?: number} = {}
): number {
  const depthMin = options.depthMin ?? 0;
  const depthMax = options.depthMax ?? 1;
  const depthRange = Math.max(depthMax - depthMin, Number.EPSILON);
  const normalizedDepth = Math.min(Math.max((depth - depthMin) / depthRange, 0), 1);
  const depthKey = Math.round(normalizedDepth * MAX_DEPTH_KEY);
  return (
    ((((options.tileId ?? 0) & 0xff) << SPLAT_DEPTH_KEY_BITS) | (MAX_DEPTH_KEY - depthKey)) >>> 0
  );
}

/** Returns stable back-to-front row indices without changing source data. */
export function getSortedSplatIndicesByDepth(depths: Float32Array): Uint32Array {
  return Uint32Array.from(
    Array.from({length: depths.length}, (_, rowIndex) => rowIndex).sort(
      (leftIndex, rightIndex) => depths[rightIndex] - depths[leftIndex]
    )
  );
}

/** Sorts borrowed source-row references without concatenating source batches. */
export function sortSplatReferences(
  references: SplatSortReference[],
  sortMode: SplatSortMode
): SplatSortReference[] {
  if (sortMode === 'none') {
    return references;
  }
  if (sortMode === 'global' && references.length >= MIN_RADIX_SORT_REFERENCE_COUNT) {
    return radixSortSplatReferences(references);
  }
  references.sort((left, right) => {
    if (sortMode === 'tile' && left.tileIndex !== right.tileIndex) {
      return left.tileIndex - right.tileIndex;
    }
    return right.depth - left.depth || left.rowIndex - right.rowIndex;
  });
  return references;
}

/** Sorts large depth domains in linear time while refining equal Float32 depth keys exactly. */
function radixSortSplatReferences(references: SplatSortReference[]): SplatSortReference[] {
  const referenceCount = references.length;
  const sortableDepthKeys = new Uint32Array(referenceCount);
  const floatingPointDepthKeys = new Float32Array(sortableDepthKeys.buffer);
  let sourceIndices = new Uint32Array(referenceCount);
  let targetIndices = new Uint32Array(referenceCount);
  const digitOffsets = new Uint32Array(RADIX_PASS_COUNT * RADIX_DIGIT_COUNT);

  for (let referenceIndex = 0; referenceIndex < referenceCount; referenceIndex++) {
    const depth = references[referenceIndex].depth;
    if (Number.isNaN(depth)) {
      references.sort(compareSplatDepthReferences);
      return references;
    }
    // Normalize signed zero so exact row-index refinement retains JavaScript comparator semantics.
    floatingPointDepthKeys[referenceIndex] = depth === 0 ? 0 : depth;
    const floatingPointBits = sortableDepthKeys[referenceIndex];
    const ascendingDepthKey =
      floatingPointBits & FLOAT32_SIGN_BIT
        ? ~floatingPointBits
        : floatingPointBits ^ FLOAT32_SIGN_BIT;
    const descendingDepthKey = ~ascendingDepthKey >>> 0;
    sortableDepthKeys[referenceIndex] = descendingDepthKey;
    sourceIndices[referenceIndex] = referenceIndex;

    for (let passIndex = 0; passIndex < RADIX_PASS_COUNT; passIndex++) {
      const digit = (descendingDepthKey >>> (passIndex * RADIX_DIGIT_BITS)) & 0xff;
      digitOffsets[passIndex * RADIX_DIGIT_COUNT + digit]++;
    }
  }

  for (let passIndex = 0; passIndex < RADIX_PASS_COUNT; passIndex++) {
    const digitOffset = passIndex * RADIX_DIGIT_COUNT;
    let outputOffset = 0;
    let activeDigitCount = 0;
    for (let digit = 0; digit < RADIX_DIGIT_COUNT; digit++) {
      const digitCount = digitOffsets[digitOffset + digit];
      if (digitCount > 0) {
        activeDigitCount++;
      }
      digitOffsets[digitOffset + digit] = outputOffset;
      outputOffset += digitCount;
    }
    if (activeDigitCount <= 1) {
      continue;
    }

    const digitShift = passIndex * RADIX_DIGIT_BITS;
    for (let sourceIndex = 0; sourceIndex < referenceCount; sourceIndex++) {
      const referenceIndex = sourceIndices[sourceIndex];
      const digit = (sortableDepthKeys[referenceIndex] >>> digitShift) & 0xff;
      targetIndices[digitOffsets[digitOffset + digit]++] = referenceIndex;
    }
    [sourceIndices, targetIndices] = [targetIndices, sourceIndices];
  }

  const originalReferences = references.slice();
  for (let sortedIndex = 0; sortedIndex < referenceCount; sortedIndex++) {
    references[sortedIndex] = originalReferences[sourceIndices[sortedIndex]];
  }

  // Float32 keys can represent the same bucket for distinct Float64 source depths. Refining
  // those buckets preserves exact depth ordering, infinities, and stable global source-row ties.
  for (let rangeStart = 0; rangeStart < referenceCount; ) {
    let rangeEnd = rangeStart + 1;
    const rangeDepthKey = sortableDepthKeys[sourceIndices[rangeStart]];
    while (
      rangeEnd < referenceCount &&
      sortableDepthKeys[sourceIndices[rangeEnd]] === rangeDepthKey
    ) {
      rangeEnd++;
    }
    if (rangeEnd === rangeStart + 2) {
      const firstReference = references[rangeStart];
      const secondReference = references[rangeStart + 1];
      if (compareSplatDepthReferences(firstReference, secondReference) > 0) {
        references[rangeStart] = secondReference;
        references[rangeStart + 1] = firstReference;
      }
    } else if (rangeEnd > rangeStart + 2) {
      const matchingDepthReferences = references.slice(rangeStart, rangeEnd);
      matchingDepthReferences.sort(compareSplatDepthReferences);
      for (let rangeIndex = 0; rangeIndex < matchingDepthReferences.length; rangeIndex++) {
        references[rangeStart + rangeIndex] = matchingDepthReferences[rangeIndex];
      }
    }
    rangeStart = rangeEnd;
  }

  return references;
}

function compareSplatDepthReferences(left: SplatSortReference, right: SplatSortReference): number {
  return right.depth - left.depth || left.rowIndex - right.rowIndex;
}
