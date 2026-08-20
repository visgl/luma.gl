// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GPUCommandGraphExecutionBudget,
  GPUCommandGraphExecutionLatencyPriority,
  GPUCommandGraphExecutionPlanStep
} from './gpu-command-graph';

const TARGET_STEP_MILLISECONDS: Record<GPUCommandGraphExecutionLatencyPriority, number> = {
  interactive: 4,
  normal: 8,
  background: 16
};

/** Configuration for empirical command-graph execution-budget calibration. */
export type GPUCommandGraphExecutionBudgetControllerProps = {
  /** Starting multidimensional budget. Every adaptive result preserves the same dimensions. */
  initialBudget: GPUCommandGraphExecutionBudget;
  /** Latency class selecting a default queue-completion target. Default `normal`. */
  latencyPriority?: GPUCommandGraphExecutionLatencyPriority;
  /** Desired queue-completion time for one planned submission. Overrides the priority default. */
  targetStepMilliseconds?: number;
  /** Smallest permitted multiplier relative to the initial budget. Default `0.125`. */
  minimumScale?: number;
  /** Largest permitted multiplier relative to the initial budget. Default `4`. */
  maximumScale?: number;
  /** Fraction of each observed correction applied to the next budget. Default `0.25`. */
  responsiveness?: number;
  /** Largest increase or decrease learned from one observation. Default `2`. */
  maximumAdjustmentFactor?: number;
};

/** Immutable state published after one measured execution step. */
export type GPUCommandGraphExecutionBudgetObservation = {
  sampleCount: number;
  durationMilliseconds: number;
  targetStepMilliseconds: number;
  latencyPriority: GPUCommandGraphExecutionLatencyPriority;
  /** Largest consumed fraction across every configured budget dimension. */
  saturation: number;
  /** Multiplier applied relative to the initial budget. */
  scale: number;
  /** Budget recommended for the next graph execution. */
  budget: Readonly<GPUCommandGraphExecutionBudget>;
};

/**
 * Learns a future graph-execution budget from measured queue-completion time.
 *
 * A graph execution keeps one immutable plan. Observations therefore affect only later executions,
 * never reorder or resize work already submitted. Scaling all configured dimensions together keeps
 * invocation, command, and memory-traffic constraints coherent while device measurements tune the
 * overall envelope.
 */
export class GPUCommandGraphExecutionBudgetController {
  readonly targetStepMilliseconds: number;
  readonly latencyPriority: GPUCommandGraphExecutionLatencyPriority;
  readonly minimumScale: number;
  readonly maximumScale: number;
  readonly responsiveness: number;
  readonly maximumAdjustmentFactor: number;

  private readonly initialBudget: Readonly<GPUCommandGraphExecutionBudget>;
  private currentBudget: Readonly<GPUCommandGraphExecutionBudget>;
  private currentScale = 1;
  private currentSampleCount = 0;

  constructor(props: GPUCommandGraphExecutionBudgetControllerProps) {
    validateExecutionBudget(props.initialBudget);
    const latencyPriority = props.latencyPriority ?? 'normal';
    const targetStepMilliseconds =
      props.targetStepMilliseconds ?? TARGET_STEP_MILLISECONDS[latencyPriority];
    validatePositiveNumber(targetStepMilliseconds, 'targetStepMilliseconds');
    const minimumScale = props.minimumScale ?? 0.125;
    const maximumScale = props.maximumScale ?? 4;
    const responsiveness = props.responsiveness ?? 0.25;
    const maximumAdjustmentFactor = props.maximumAdjustmentFactor ?? 2;
    validatePositiveNumber(minimumScale, 'minimumScale');
    validatePositiveNumber(maximumScale, 'maximumScale');
    validatePositiveNumber(maximumAdjustmentFactor, 'maximumAdjustmentFactor');
    if (minimumScale > 1 || maximumScale < 1) {
      throw new Error('GPUCommandGraph budget scale range must contain the initial scale 1');
    }
    if (!Number.isFinite(responsiveness) || responsiveness <= 0 || responsiveness > 1) {
      throw new Error('GPUCommandGraph budget responsiveness must be in the interval (0, 1]');
    }
    if (maximumAdjustmentFactor < 1) {
      throw new Error('GPUCommandGraph budget maximumAdjustmentFactor must be at least 1');
    }
    this.initialBudget = freezeBudget(props.initialBudget);
    this.currentBudget = this.initialBudget;
    this.latencyPriority = latencyPriority;
    this.targetStepMilliseconds = targetStepMilliseconds;
    this.minimumScale = minimumScale;
    this.maximumScale = maximumScale;
    this.responsiveness = responsiveness;
    this.maximumAdjustmentFactor = maximumAdjustmentFactor;
  }

  /** Budget recommended for the next complete graph execution. */
  get budget(): Readonly<GPUCommandGraphExecutionBudget> {
    return this.currentBudget;
  }

  /** Number of valid queue-completion measurements consumed by this controller. */
  get sampleCount(): number {
    return this.currentSampleCount;
  }

  /** Restores the initial budget and clears empirical calibration. */
  reset(): void {
    this.currentBudget = this.initialBudget;
    this.currentScale = 1;
    this.currentSampleCount = 0;
  }

  /** Records one completed plan step and returns the recommendation for the next execution. */
  observeStep(
    step: GPUCommandGraphExecutionPlanStep,
    durationMilliseconds: number,
    /** Budget used to create the immutable execution that produced this step. */
    executionBudget: Readonly<GPUCommandGraphExecutionBudget> = this.currentBudget
  ): GPUCommandGraphExecutionBudgetObservation {
    validatePositiveNumber(durationMilliseconds, 'durationMilliseconds');
    validateExecutionBudget(executionBudget);
    const saturation = getBudgetSaturation(step, executionBudget);
    if (saturation > 0) {
      const desiredAdjustment =
        (this.targetStepMilliseconds * Math.min(saturation, 1)) / durationMilliseconds;
      const boundedAdjustment = clamp(
        desiredAdjustment,
        1 / this.maximumAdjustmentFactor,
        this.maximumAdjustmentFactor
      );
      const responsiveAdjustment = 1 + (boundedAdjustment - 1) * this.responsiveness;
      this.currentScale = clamp(
        this.currentScale * responsiveAdjustment,
        this.minimumScale,
        this.maximumScale
      );
      this.currentBudget = scaleBudget(this.initialBudget, this.currentScale);
    }
    this.currentSampleCount++;
    return Object.freeze({
      sampleCount: this.currentSampleCount,
      durationMilliseconds,
      targetStepMilliseconds: this.targetStepMilliseconds,
      latencyPriority: this.latencyPriority,
      saturation,
      scale: this.currentScale,
      budget: this.currentBudget
    });
  }
}

function getBudgetSaturation(
  step: GPUCommandGraphExecutionPlanStep,
  budget: Readonly<GPUCommandGraphExecutionBudget>
): number {
  const ratios = [step.maximumInvocationCount / budget.maximumInvocationCount];
  if (budget.maximumNodeCount !== undefined) ratios.push(step.nodeCount / budget.maximumNodeCount);
  if (budget.maximumCommandCount !== undefined) {
    ratios.push(step.commandCount / budget.maximumCommandCount);
  }
  if (budget.maximumReadByteLength !== undefined) {
    ratios.push(step.readByteLength / budget.maximumReadByteLength);
  }
  if (budget.maximumWriteByteLength !== undefined) {
    ratios.push(step.writeByteLength / budget.maximumWriteByteLength);
  }
  return Math.max(...ratios);
}

function scaleBudget(
  budget: Readonly<GPUCommandGraphExecutionBudget>,
  scale: number
): Readonly<GPUCommandGraphExecutionBudget> {
  return freezeBudget({
    maximumInvocationCount: scalePositiveInteger(budget.maximumInvocationCount, scale),
    ...(budget.maximumNodeCount === undefined
      ? {}
      : {maximumNodeCount: scalePositiveInteger(budget.maximumNodeCount, scale)}),
    ...(budget.maximumCommandCount === undefined
      ? {}
      : {maximumCommandCount: scalePositiveInteger(budget.maximumCommandCount, scale)}),
    ...(budget.maximumReadByteLength === undefined
      ? {}
      : {maximumReadByteLength: scalePositiveInteger(budget.maximumReadByteLength, scale)}),
    ...(budget.maximumWriteByteLength === undefined
      ? {}
      : {maximumWriteByteLength: scalePositiveInteger(budget.maximumWriteByteLength, scale)})
  });
}

function scalePositiveInteger(value: number, scale: number): number {
  return Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.round(value * scale)));
}

function freezeBudget(
  budget: GPUCommandGraphExecutionBudget
): Readonly<GPUCommandGraphExecutionBudget> {
  return Object.freeze({...budget});
}

function validatePositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`GPUCommandGraph budget ${name} must be positive`);
  }
}

function validateExecutionBudget(budget: GPUCommandGraphExecutionBudget): void {
  for (const [name, value] of [
    ['maximumInvocationCount', budget.maximumInvocationCount],
    ['maximumNodeCount', budget.maximumNodeCount],
    ['maximumCommandCount', budget.maximumCommandCount],
    ['maximumReadByteLength', budget.maximumReadByteLength],
    ['maximumWriteByteLength', budget.maximumWriteByteLength]
  ] as const) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) {
      throw new Error(`GPUCommandGraph budget ${name} must be a positive safe integer`);
    }
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
