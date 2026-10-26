// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GroupNode,
  type ScenegraphNode,
  type Interactivity,
  type InteractivityPhysics
} from '@luma.gl/engine';
import type {GPURigidBodyWorld} from './gpu-rigid-body-world';

export type ScenegraphPhysicsBehaviorProps = {
  roots: readonly ScenegraphNode[];
  /** Behavior-graph node identity table. Cross-references inside the scene remain objects. */
  nodes: ReadonlyMap<number, ScenegraphNode>;
  bodyNodes: ReadonlyMap<ScenegraphNode, number>;
  colliderNodes: readonly ScenegraphNode[];
  triggerNodes: readonly ScenegraphNode[];
  querySelections?: readonly (readonly number[])[];
};

/** Connect behavior operations to a GPU world without retaining an asset-format document. */
export class ScenegraphPhysicsBehaviors implements InteractivityPhysics {
  private readonly bodyByNode = new Map<ScenegraphNode, number>();
  private readonly nodeIndices: ReadonlyMap<ScenegraphNode, number>;
  private readonly motionNodes = new Map<number, number>();
  private active = true;
  private readonly dispatches = new Set<Promise<void>>();
  private queryTail: Promise<unknown> = Promise.resolve();

  constructor(
    readonly world: GPURigidBodyWorld,
    readonly props: ScenegraphPhysicsBehaviorProps
  ) {
    this.nodeIndices = new Map(Array.from(props.nodes, ([index, node]) => [node, index]));
    const visit = (node: ScenegraphNode, inherited?: number) => {
      const body = props.bodyNodes.get(node) ?? inherited;
      if (body !== undefined) this.bodyByNode.set(node, body);
      if (node instanceof GroupNode) for (const child of node.children) visit(child, body);
    };
    for (const root of props.roots) visit(root);
    for (const [node, body] of props.bodyNodes) {
      if (world.getBodyMode(body) !== 'static')
        this.motionNodes.set(body, this.nodeIndices.get(node) ?? -1);
    }
  }

  private body(nodeIndex: number): number | undefined {
    if (!this.active) throw new Error('Disposed physics behavior binding');
    if (!Number.isInteger(nodeIndex)) throw new Error('Invalid behavior node index');
    const node = this.props.nodes.get(nodeIndex);
    if (!node) throw new Error('Unknown behavior node');
    return this.bodyByNode.get(node);
  }

  applyImpulse(node: number, linear: readonly number[], angular: readonly number[]): void {
    validateVector(linear);
    validateVector(angular);
    const body = this.body(node);
    if (body === undefined) return;
    this.world.applyImpulse(body, [linear[0], linear[1], linear[2]]);
    this.world.applyAngularImpulse(body, [angular[0], angular[1], angular[2]]);
  }

  applyPointImpulse(node: number, impulse: readonly number[], position: readonly number[]): void {
    validateVector(impulse);
    validateVector(position);
    const body = this.body(node);
    if (body !== undefined)
      this.world.applyImpulse(
        body,
        [impulse[0], impulse[1], impulse[2]],
        [position[0], position[1], position[2]]
      );
  }

  rayCast(start: readonly number[], end: readonly number[], filter: number) {
    // Snapshot caller-owned inputs before waiting for the shared query transport.
    const origin = [...start];
    const destination = [...end];
    const run = async () => {
      if (!this.active) throw new Error('Disposed physics behavior binding');
      validateVector(origin);
      validateVector(destination);
      if (
        !Number.isInteger(filter) ||
        filter < -1 ||
        (filter >= 0 && !this.props.querySelections?.[filter])
      )
        throw new Error('Invalid query filter');
      const direction: [number, number, number] = [
        destination[0] - origin[0],
        destination[1] - origin[1],
        destination[2] - origin[2]
      ];
      const length = Math.hypot(...direction);
      if (!length) return null;
      const result = await this.world.raycast({
        origin: [origin[0], origin[1], origin[2]],
        direction,
        maximumDistance: length,
        colliderIndices: filter === -1 ? undefined : this.props.querySelections![filter]
      });
      if (!this.active) throw new Error('Disposed physics behavior binding');
      if (!result.complete || result.truncated) throw new Error('Incomplete behavior ray query');
      const hit = result.hits[0];
      if (!hit) return null;
      const node = this.nodeIndices.get(this.props.colliderNodes[hit.collider]);
      if (node === undefined) throw new Error('Missing collider node binding');
      return {node, fraction: hit.distance / length, normal: hit.normal};
    };
    // The world owns one query transport. Serialize requests without dropping activations.
    const result = this.queryTail.then(run, run);
    this.queryTail = result.catch(() => {});
    return result;
  }

  /** Invalidate queued continuations and wait for the currently borrowed query transport. */
  async destroy(): Promise<void> {
    this.active = false;
    await Promise.allSettled([this.queryTail, ...this.dispatches]);
  }

  isTriggerNode(node: number): boolean {
    return (
      Number.isInteger(node) &&
      Boolean(
        this.props.nodes.get(node) && this.props.triggerNodes.includes(this.props.nodes.get(node)!)
      )
    );
  }

  dispatchTriggers(behavior: Interactivity): Promise<void> {
    const operation = this.dispatchTriggerBatch(behavior);
    this.dispatches.add(operation);
    void operation.finally(() => this.dispatches.delete(operation)).catch(() => {});
    return operation;
  }

  private async dispatchTriggerBatch(behavior: Interactivity): Promise<void> {
    if (!this.active) throw new Error('Disposed physics behavior binding');
    if (!this.props.triggerNodes.length) {
      await behavior.flushPhysics();
      return;
    }
    const batch = await this.world.readTriggerEvents();
    if (!this.active) throw new Error('Disposed physics behavior binding');
    if (batch.dropped || batch.saturated) throw new Error('Behavior trigger events lost');
    for (const event of batch.events) {
      const triggerNode = this.nodeIndices.get(this.props.triggerNodes[event.trigger]);
      const colliderNode = this.nodeIndices.get(this.props.colliderNodes[event.collider]);
      if (triggerNode === undefined || colliderNode === undefined)
        throw new Error('Missing trigger node binding');
      behavior.notifyPhysicsTrigger(
        event.phase,
        triggerNode,
        colliderNode,
        this.motionNodes.get(event.body) ?? -1
      );
    }
    await behavior.flushPhysics();
  }
}

function validateVector(vector: readonly number[]): void {
  if (vector.length !== 3 || !vector.every(value => Number.isFinite(Math.fround(value))))
    throw new Error('Expected finite three-component physics vector');
}
