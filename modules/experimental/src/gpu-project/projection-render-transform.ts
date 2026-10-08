// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {compileProjectionProgram, type CompiledProjection} from './projection-program';
import {ProjectionTableTransform} from './projection-table-transform';
import type {PreparedCRSProjectionResult} from './projection-engine';
import type {ProjectionCoordinates} from './types';

/** Explicit mapping from destination CRS coordinates to a local Cartesian render frame. */
export type ProjectionRenderFrame = {
  /** Absolute origin in destination CRS axis order and units. */
  origin: ProjectionCoordinates;
  /** Render x/y select destination axes after origin subtraction. Defaults to [0, 1]. */
  axes?: readonly [0, 1] | readonly [1, 0];
  /** Signed render units per selected destination unit. No implicit metre/degree conversion. */
  scale: ProjectionCoordinates;
};

export type ProjectedRenderPosition = {
  source: ProjectionCoordinates;
  destination: ProjectionCoordinates;
  common: ProjectionCoordinates;
};

/**
 * A two-dimensional inline consumer of the same plan and CPU provider as table projection.
 * Subtracts the absolute origin in double-single arithmetic before the final float32 boundary.
 * This is a local Cartesian frame, not deck's geographic map/globe common space.
 */
export class ProjectionRenderTransform {
  readonly compiled: CompiledProjection;
  readonly frame: Readonly<Required<ProjectionRenderFrame>>;
  private readonly tableTransform: ProjectionTableTransform;

  constructor(
    readonly prepared: Extract<PreparedCRSProjectionResult, {status: 'ready'}>,
    frame: ProjectionRenderFrame
  ) {
    this.tableTransform = new ProjectionTableTransform(prepared);
    this.frame = Object.freeze({
      origin: Object.freeze([...frame.origin] as [number, number]),
      axes: Object.freeze(frame.axes ? ([...frame.axes] as [0, 1] | [1, 0]) : ([0, 1] as [0, 1])),
      scale: Object.freeze([...frame.scale] as [number, number])
    });
    this.compiled = compileProjectionProgram(
      {
        operations: [
          ...prepared.program.operations,
          {type: 'affine', scale: [1, 1], offset: this.frame.origin, inverse: true},
          {type: 'axis', order: this.frame.axes},
          {type: 'affine', scale: this.frame.scale, offset: [0, 0]}
        ],
        precision: 'local-f32',
        destinationOrigin: [0, 0]
      },
      {inputFormat: 'uint32x4'}
    );
  }

  /** Exact retained CPU projection for a picked source row; no GPU readback or inverse guess. */
  projectPosition(source: ProjectionCoordinates): ProjectedRenderPosition | null {
    // Altitude/vertical datum transforms are deliberately not part of this 2D contract.
    if (source.length !== 2) throw new Error('render projection requires a 2D coordinate');
    const result = this.tableTransform.projectBatch({positions: new Float64Array(source)});
    if (!result.validity[0]) return null;
    const destination: ProjectionCoordinates = [result.positions[0], result.positions[1]];
    const common = this.getCommonPosition(destination);
    if (!common.every(Number.isFinite)) throw new Error('nonfinite render frame coordinate');
    return {source: [source[0], source[1]], destination, common};
  }

  /** Decode absolute CPU or double-single materialized output into the same render frame. */
  getCommonPosition(destination: ProjectionCoordinates): ProjectionCoordinates {
    const {origin, axes, scale} = this.frame;
    return [
      (destination[axes[0]] - origin[axes[0]]) * scale[0],
      (destination[axes[1]] - origin[axes[1]]) * scale[1]
    ];
  }
}
