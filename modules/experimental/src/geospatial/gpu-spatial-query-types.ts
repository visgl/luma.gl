// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GraphDataView} from '../gpu-primitives/gpu-command-graph';

/**
 * Caller-owned, capacity-bounded output shared by GPU spatial queries.
 *
 * Every writable view's aligned storage-binding range must be disjoint from the other outputs and
 * all query inputs. A zero-capacity `ids` view still has a one-row binding footprint.
 */
export type GPUSpatialQueryOutput = {
  /** Compact application IDs, or position-row indices when no source-ID view is supplied. */
  ids: GraphDataView<'uint32'>;
  /** Scalar receiving `min(totalCount, ids.length)`, suitable for an indirect draw count. */
  count: GraphDataView<'uint32'>;
  /** Scalar receiving `1` when the index or result capacity overflowed, otherwise `0`. */
  overflow: GraphDataView<'uint32'>;
  /**
   * Optional scalar receiving the unclamped matches among examined candidates.
   *
   * When index overflow is set, the index stores only a subset of its source rows, so this count
   * is incomplete rather than a total over the original positions.
   */
  totalCount?: GraphDataView<'uint32'>;
};
