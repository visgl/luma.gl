// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView
} from '../gpu-core/gpu-command-graph';
import {GPURasterBandMath} from './gpu-raster-band-math';
import type {GPURasterBufferBand} from './types';

/** Explicit red and near-infrared inputs for one normalized-difference vegetation index pass. */
export type GPURasterNDVIProps = {
  id?: string;
  width: number;
  height: number;
  nearInfrared: GPURasterBufferBand;
  red: GPURasterBufferBand;
  /** Caller-owned packed float32 output; invalid pixels receive canonical quiet NaNs. */
  output: GraphDataView<'float32'>;
  /** Caller-owned packed uint32 flags intersecting both source validity domains. */
  outputValidity: GraphDataView<'uint32'>;
  /** Rejects near-zero calibrated denominators without implicitly clamping valid results. */
  epsilon?: number;
  /** Optional explicit output range, useful when a caller requires normalized display values. */
  clamp?: readonly [number, number];
};

/**
 * Graph-native `(nearInfrared - red) / (nearInfrared + red)` on independently calibrated bands.
 *
 * This specialized contributor borrows its inputs and outputs and delegates all graph ownership,
 * exact raw nodata rejection, validity propagation, and finite checks to raster band math.
 */
export class GPURasterNDVI implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly nearInfrared: GPURasterBufferBand;
  readonly red: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly epsilon: number;
  readonly clamp?: readonly [number, number];

  private readonly bandMath: GPURasterBandMath;

  constructor(props: GPURasterNDVIProps) {
    this.id = props.id ?? 'gpu-raster-ndvi';
    this.width = props.width;
    this.height = props.height;
    this.nearInfrared = props.nearInfrared;
    this.red = props.red;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.epsilon = props.epsilon ?? 0;
    this.clamp = props.clamp;
    this.bandMath = new GPURasterBandMath({
      id: this.id,
      width: this.width,
      height: this.height,
      left: this.nearInfrared,
      right: this.red,
      operation: 'normalized-difference',
      output: this.output,
      outputValidity: this.outputValidity,
      epsilon: this.epsilon,
      clamp: this.clamp
    });
  }

  /** Contributes one bounded compute pass; command encoding and submission remain explicit. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    this.bandMath.addToGraph(graph);
  }
}
