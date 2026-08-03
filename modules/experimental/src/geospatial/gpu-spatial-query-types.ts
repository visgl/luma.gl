// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GraphDataView} from '../gpu-primitives/gpu-command-graph';

/** Caller-owned, capacity-bounded output shared by GPU spatial queries. */
export type GPUSpatialQueryOutput = {
  /** Compact source IDs. Result order is unspecified. */
  ids: GraphDataView<'uint32'>;
  /** Scalar receiving `min(totalCount, ids.length)`, suitable for an indirect draw count. */
  count: GraphDataView<'uint32'>;
  /** Scalar receiving `1` when the index or result capacity overflowed, otherwise `0`. */
  overflow: GraphDataView<'uint32'>;
  /** Optional scalar receiving the unclamped number of matching points. */
  totalCount?: GraphDataView<'uint32'>;
};
