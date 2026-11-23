// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Vector} from 'apache-arrow';
import type {
  CoordinateProjectionGraph,
  ProjectedCoordinateResult
} from '../../gpu-project/coordinate-projection-graph';
import {makeCPUVectorFromArrow} from './arrow-cpu-vector-adapters';

/** Adapt Arrow point coordinate batches into the shared reusable CPU/GPU projection graph. */
export function projectArrowCoordinates(
  graph: CoordinateProjectionGraph,
  source: Vector
): Promise<ProjectedCoordinateResult> {
  return graph.run(makeCPUVectorFromArrow(source, {name: 'source'}));
}
