// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph, type GPUCommandGraphEncoding} from '../gpu-core/gpu-command-graph';
import {
  GPURigidBodyWorld,
  type GPURigidBodyCapture,
  type GPURigidBodyWorldProps
} from './gpu-rigid-body-world';
import type {GPURigidBodySimulationDiagnostics} from './rigid-body-diagnostics';
import {applyRigidBodyCommand, type GPURigidBodyCommand} from './rigid-body-journal';

export type GPURigidBodyRecoveryOptions = {
  maximumRetries?: number;
  maximumReplayTicks?: number;
  maximumOwnedBufferBytes?: number;
};
export type GPURigidBodyRecoveryResult = {
  accepted: boolean;
  tick: number;
  retries: number;
  replayedTicks: number;
  diagnostics: GPURigidBodySimulationDiagnostics;
};
type Execution = {
  world: GPURigidBodyWorld;
  encoding?: GPUCommandGraphEncoding;
  graph: Awaited<ReturnType<GPUCommandGraph['compileAsync']>>;
};

/** Grow only budgets whose exhaustion has an unambiguous diagnostic. Other failures reject. */
export function growRigidBodyBudgets(
  props: GPURigidBodyWorldProps,
  diagnostics: GPURigidBodySimulationDiagnostics,
  maximumPairs: number
): GPURigidBodyWorldProps | null {
  if (
    diagnostics.saturated ||
    diagnostics.invalidBounds ||
    diagnostics.invalidBodyStates ||
    diagnostics.unresolvedQueries ||
    diagnostics.incompleteIslandUnions ||
    diagnostics.incompleteContinuousBodies ||
    diagnostics.incompleteTriggerQueries ||
    diagnostics.droppedTriangleQueries
  )
    return null;
  const next = structuredClone(props);
  let changed = false;
  if (diagnostics.droppedPairs || diagnostics.droppedManifolds) {
    if (props.broadPhase !== 'hierarchical-grid' || maximumPairs >= 0x40000000) return null;
    next.maximumPairs = maximumPairs * 2;
    changed = true;
  }
  if (diagnostics.incompleteQueries) {
    const previous = props.maximumCandidateTestsPerCollider ?? 4096;
    next.maximumCandidateTestsPerCollider = Math.min(65535, previous * 2);
    changed ||= next.maximumCandidateTestsPerCollider > previous;
  }
  if (diagnostics.incompleteMeshQueries) {
    const previous = props.maximumMeshTraversalTestsPerPair ?? 65536;
    next.maximumMeshTraversalTestsPerPair = Math.min(1048576, previous * 2);
    changed ||= next.maximumMeshTraversalTestsPerPair > previous;
  }
  return changed ? next : null;
}

/**
 * Opt-in asynchronous qualification/recovery runner. All mutations must use advance commands.
 * Recovery reconstructs and replays from authored initial state, including kinematic targets and
 * joint toggles; it never migrates incompatible manifold layouts. Borrow world buffers only until
 * the next advance. The runner owns graph submission and must not be externally stepped.
 */
export class GPURigidBodyRecoveryRunner {
  private execution: Execution;
  private props: GPURigidBodyWorldProps;
  private history: GPURigidBodyCommand[][] = [];
  private busy = false;
  private destroyed = false;
  private blocked = false;
  private constructor(
    private readonly device: Device,
    props: GPURigidBodyWorldProps,
    private readonly options: Required<GPURigidBodyRecoveryOptions>,
    execution: Execution
  ) {
    this.props = props;
    this.execution = execution;
  }
  static async create(
    device: Device,
    props: GPURigidBodyWorldProps,
    options: GPURigidBodyRecoveryOptions = {}
  ): Promise<GPURigidBodyRecoveryRunner> {
    const limits = {
      maximumRetries: 8,
      maximumReplayTicks: 4096,
      maximumOwnedBufferBytes: 256 * 1024 * 1024,
      ...options
    };
    if (
      Object.values(limits).some(value => !Number.isSafeInteger(value) || value < 0) ||
      limits.maximumReplayTicks === 0 ||
      limits.maximumOwnedBufferBytes === 0
    )
      throw new Error('Invalid recovery limits');
    const initial = structuredClone({...props, failurePolicy: 'rollback' as const});
    const execution = await createExecution(device, initial, limits.maximumOwnedBufferBytes);
    initial.broadPhase = execution.world.broadPhase;
    return new GPURigidBodyRecoveryRunner(device, initial, limits, execution);
  }
  get world(): GPURigidBodyWorld {
    return this.execution.world;
  }
  get tick(): number {
    return this.history.length;
  }
  /** Inspection only; submissions remain owned by the runner. */
  get graph(): Execution['graph'] {
    return this.execution.graph;
  }
  get encoding(): GPUCommandGraphEncoding | undefined {
    return this.execution.encoding;
  }

  async advance(
    commands: readonly GPURigidBodyCommand[] = []
  ): Promise<GPURigidBodyRecoveryResult> {
    if (this.busy || this.destroyed || this.blocked || this.tick >= this.options.maximumReplayTicks)
      throw new Error('Recovery runner is unavailable');
    this.busy = true;
    const original = this.execution;
    let checkpoint: GPURigidBodyCapture | undefined;
    let retries = 0;
    let replayedTicks = 0;
    let candidate: Execution | undefined;
    try {
      const saved = structuredClone([...commands]);
      // Controls mutate GPU state before the graph checkpoint. Preserve pre-command state
      // so rejecting a tick also rejects its external mutations. Uncommanded ticks stay GPU-only.
      if (saved.length) checkpoint = await original.world.captureState();
      let diagnostics = await advanceExecution(this.device, this.execution, saved);
      let props = this.props;
      let maximumPairs = this.world.maximumPairs;
      while (!diagnostics.complete && retries < this.options.maximumRetries) {
        const grown = growRigidBodyBudgets(props, diagnostics, maximumPairs);
        if (!grown) break;
        props = grown;
        candidate = await createExecution(this.device, props, this.options.maximumOwnedBufferBytes);
        retries++;
        for (const tickCommands of [...this.history, saved]) {
          diagnostics = await advanceExecution(this.device, candidate, tickCommands);
          replayedTicks++;
          if (!diagnostics.complete) break;
        }
        maximumPairs = candidate.world.maximumPairs;
        if (diagnostics.complete) {
          destroyExecution(this.execution);
          this.execution = candidate;
          candidate = undefined;
          this.props = props;
          break;
        }
        destroyExecution(candidate);
        candidate = undefined;
      }
      if (diagnostics.complete) this.history.push(saved);
      else {
        if (checkpoint) original.world.restoreState(checkpoint);
        this.blocked = true;
      }
      return {accepted: diagnostics.complete, tick: this.tick, retries, replayedTicks, diagnostics};
    } catch (error) {
      if (checkpoint && this.execution === original) original.world.restoreState(checkpoint);
      this.blocked = true;
      throw error;
    } finally {
      if (candidate) destroyExecution(candidate);
      this.busy = false;
    }
  }
  destroy(): void {
    if (this.busy) throw new Error('Recovery runner is busy');
    if (this.destroyed) return;
    this.destroyed = true;
    destroyExecution(this.execution);
    this.history = [];
  }
}

async function createExecution(
  device: Device,
  props: GPURigidBodyWorldProps,
  maximumBytes: number
): Promise<Execution> {
  const world = new GPURigidBodyWorld(props);
  try {
    if (world.getCapacityInfo().ownedBufferBytes > maximumBytes)
      throw new Error('Recovery memory budget exhausted');
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    return {world, graph: await definition.compileAsync()};
  } catch (error) {
    world.destroy();
    throw error;
  }
}
async function advanceExecution(
  device: Device,
  execution: Execution,
  commands: readonly GPURigidBodyCommand[]
): Promise<GPURigidBodySimulationDiagnostics> {
  for (const command of commands) applyRigidBodyCommand(execution.world, command);
  const encoder = device.createCommandEncoder();
  execution.encoding = execution.graph.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  return execution.world.readSimulationDiagnostics();
}
function destroyExecution(execution: Execution): void {
  execution.graph.destroy();
  execution.world.destroy();
}
