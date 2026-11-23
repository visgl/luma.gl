// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUDGGSCellProjection,
  type GPUDGGSCellProjectionProps
} from '../gpu-dggs/gpu-dggs-cell-projection';

/** Properties for projecting packed H3 cell indexes to geographic centers. */
export type GPUH3CellProjectionProps = Omit<GPUDGGSCellProjectionProps, 'family'>;

/**
 * Projects H3 cell indexes to center longitude/latitude pairs or unit vectors on the GPU.
 *
 * The operation implements split-uint64 validation, pentagon digit handling, and icosahedron face
 * overage without CPU readback. Invalid rows produce zero coordinates and may be exposed through a
 * separate validity view.
 */
export class GPUH3CellProjection extends GPUDGGSCellProjection {
  constructor(props: GPUH3CellProjectionProps) {
    super({...props, id: props.id ?? 'gpu-h3-cell-projection', family: 'h3'});
  }
}
