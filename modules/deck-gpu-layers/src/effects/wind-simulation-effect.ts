// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Effect, EffectContext} from '@deck.gl/core';
import type {Device} from '@luma.gl/core';
import {ScientificFlowGraph, type ScientificFlowGraphProps} from '@luma.gl/experimental';
import type {GPUCommandGraphEncoding} from '@luma.gl/graph/gpu-core';

export type WindSimulationEffectProps = ScientificFlowGraphProps & {
  id?: string;
  /** Simulation seconds per wall second. Large frame gaps are capped at 0.1 seconds. */
  timeScale?: number;
  paused?: boolean;
  /** Inspect actual graph encodings without reading particle positions. */
  onEncode?: (simulation: ScientificFlowGraph, encoding: GPUCommandGraphEncoding) => void;
};

/** Owns a scientific wind graph and records it into Deck's frame encoder before rendering. */
export class WindSimulationEffect implements Effect {
  readonly id: string;
  readonly useInPicking = false;
  readonly simulation: ScientificFlowGraph;
  readonly props: WindSimulationEffectProps;
  private previousTime: number | undefined;
  private initialized = false;
  private destroyed = false;

  constructor(
    private readonly device: Device,
    props: WindSimulationEffectProps
  ) {
    this.id = props.id ?? 'wind-simulation';
    this.props = props;
    this.simulation = new ScientificFlowGraph(device, props);
  }

  setup(_context: EffectContext): void {}

  preRender(options: Parameters<Effect['preRender']>[0]): void {
    if (this.destroyed || !options.viewports.length) return;
    const now = performance.now();
    const elapsed =
      this.previousTime === undefined ? 0 : Math.min(0.1, (now - this.previousTime) / 1000);
    this.previousTime = now;
    if (this.initialized && this.props.paused) return;
    const deltaTime = Math.min(
      elapsed * Math.max(0, this.props.timeScale ?? 1),
      this.simulation.remainingTime
    );
    if (this.initialized && deltaTime === 0) return;
    const substeps = Math.max(1, Math.ceil(deltaTime / this.simulation.simulation.maximumTimeStep));
    const encoding = this.simulation.record(
      this.device.commandEncoder,
      deltaTime / substeps,
      substeps
    );
    this.initialized = true;
    this.props.onEncode?.(this.simulation, encoding);
  }

  cleanup(_context: EffectContext): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.simulation.destroy();
  }
}
