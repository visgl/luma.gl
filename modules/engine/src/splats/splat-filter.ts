// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSplatData} from './splat-data';

/** Numeric semantic classes accepted by a Gaussian splat visibility filter. */
export type SplatSemanticSelection = ReadonlySet<number> | readonly number[];

/** Optional semantic-class and stable source-row visibility controls. */
export type SplatSemanticFilter = {
  /** Retain only these semantic class identifiers when this selection is supplied. */
  include?: SplatSemanticSelection;
  /** Remove these semantic class identifiers after applying the inclusion selection. */
  exclude?: SplatSemanticSelection;
  /** Retain batches without semantic metadata even when an inclusion selection is active. */
  includeUnlabeled?: boolean;
  /** Additional application-owned filtering using the original streamed source identity. */
  predicate?: (
    semanticId: number | undefined,
    rowIndex: number,
    sourceBatchIndex: number
  ) => boolean;
};

/** Returns whether one prepared source row passes the current semantic visibility controls. */
export function acceptsSplatSemantic(
  filter: SplatSemanticFilter | null | undefined,
  data: Pick<GPUSplatData, 'source' | 'rowIndexBase' | 'sourceBatchIndex'>,
  batchRowIndex: number
): boolean {
  if (!filter) {
    return true;
  }

  const semanticId = data.source.semanticIds?.[batchRowIndex];
  if (semanticId === undefined) {
    if (filter.includeUnlabeled === false || (filter.include && !filter.includeUnlabeled)) {
      return false;
    }
  } else {
    if (filter.include && !hasSplatSemanticId(filter.include, semanticId)) {
      return false;
    }
    if (filter.exclude && hasSplatSemanticId(filter.exclude, semanticId)) {
      return false;
    }
  }

  return (
    filter.predicate?.(semanticId, data.rowIndexBase + batchRowIndex, data.sourceBatchIndex) ?? true
  );
}

function hasSplatSemanticId(selection: SplatSemanticSelection, semanticId: number): boolean {
  return selection instanceof Set
    ? selection.has(semanticId)
    : (selection as readonly number[]).includes(semanticId);
}
