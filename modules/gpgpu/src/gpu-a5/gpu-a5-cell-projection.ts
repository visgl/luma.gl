// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUDGGSCellProjection,
  type GPUDGGSCellProjectionProps
} from '../gpu-dggs/gpu-dggs-cell-projection';

/** Properties for projecting packed A5 cell indexes to geographic centers. */
export type GPUA5CellProjectionProps = Omit<GPUDGGSCellProjectionProps, 'family'>;

/** Projects A5 cell indexes to center longitude/latitude pairs or unit vectors on the GPU. */
export class GPUA5CellProjection extends GPUDGGSCellProjection {
  constructor(props: GPUA5CellProjectionProps) {
    super({...props, id: props.id ?? 'gpu-a5-cell-projection', family: 'a5'});
  }
}
