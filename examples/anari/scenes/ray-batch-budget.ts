// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraphExecutionBudgetController} from '@luma.gl/graph/gpu-core';
import type {SceneRenderStatistics} from '@luma.gl/anari';

/** Calibrates the live ray work budget from completed timestamp measurements. */
export class RayBatchBudget {
  /** Controller for the current internal pixel grid. */
  private controller: GPUCommandGraphExecutionBudgetController | undefined;
  /** Number of shader invocations in one full trace dispatch. */
  private fullInvocationCount = 0;
  /** Invalidates timestamp results from replaced scenes. */
  private generation = 0;

  /** Next requested phase count, or the renderer's normal policy before timing is available. */
  get phaseCount(): 1 | 2 | 4 | 8 | undefined {
    if (!this.controller) return undefined;
    /** Fraction of full-screen trace invocations allowed in the next dispatch. */
    const fraction = this.controller.budget.maximumInvocationCount / this.fullInvocationCount;
    return fraction >= 1 ? 1 : fraction >= 0.5 ? 2 : fraction >= 0.25 ? 4 : 8;
  }

  /** Drops timing from the old scene, including readbacks still in flight. */
  reset(): void {
    this.controller = undefined;
    this.fullInvocationCount = 0;
    this.generation++;
  }

  /** Returns true when WebGPU can provide timings for this batch. */
  canMeasure(device: Device): boolean {
    return (
      device.features.has('timestamp-query') &&
      Boolean(device.commandEncoder.withTimeProfilingQuerySet) &&
      Boolean(device.commandEncoder.captureTimestampQuerySet)
    );
  }

  /** Updates the work budget using timestamped GPU time and the actual trace dispatch size. */
  observe(statistics: SceneRenderStatistics['rayTracing'], gpuTime: Promise<number | null>): void {
    if (
      !statistics ||
      statistics.graph?.topology ||
      statistics.graph?.acceleration ||
      statistics.graph?.refit
    )
      return;
    /** Identity of the scene that produced this measurement. */
    const generation = this.generation;
    /** Dispatch height rounded to the trace workgroup size. */
    const heightGroups = Math.ceil(statistics.internalHeight / 8);
    /** Padded invocation count of a full trace dispatch. */
    const fullInvocations = Math.ceil(statistics.internalWidth / 8) * heightGroups * 64;
    /** Compact width of the completed trace dispatch. */
    const dispatchWidth = Math.ceil(statistics.internalWidth * statistics.sampledPixelCoverage);
    /** Padded invocation count of the measured trace dispatch. */
    const actualInvocations = Math.ceil(dispatchWidth / 8) * heightGroups * 64;
    /** Controller active when this batch was submitted. */
    const submittedController = this.controller;
    /** Budget used by the measured batch. */
    const submittedBudget = submittedController?.budget;
    void gpuTime.then(milliseconds => {
      if (generation !== this.generation || milliseconds === null || milliseconds <= 0) return;
      if (!this.controller || this.fullInvocationCount !== fullInvocations) {
        this.fullInvocationCount = fullInvocations;
        this.controller = new GPUCommandGraphExecutionBudgetController({
          initialBudget: {maximumInvocationCount: fullInvocations},
          targetStepMilliseconds: 16,
          maximumScale: 1
        });
      }
      this.controller.observeInvocations(
        actualInvocations,
        milliseconds,
        submittedBudget && submittedController === this.controller
          ? submittedBudget
          : this.controller.budget
      );
    });
  }
}
