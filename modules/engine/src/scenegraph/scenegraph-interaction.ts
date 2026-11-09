// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ScenegraphNode} from './scenegraph-node';

/** Action whose authored subtree eligibility is being evaluated. */
export type ScenegraphInteractionKind = 'select' | 'hover';

/** A hit with its particular root-to-target path, ordered nearest to farthest by the caller. */
export type ScenegraphInteractionHit = {
  /** Root-to-target path, including the hit node; distinguishes shared instances. */
  path: readonly ScenegraphNode[];
  /** Optional intersection point in world coordinates. */
  point?: readonly [number, number, number];
  /** Optional world-space ray origin. */
  rayOrigin?: readonly [number, number, number];
  /** Application-specific picking information. */
  data?: unknown;
};

/** Returns whether all nodes on an instance path permit the specified action. */
export function isScenegraphInteractionEnabled(
  path: readonly ScenegraphNode[],
  kind: ScenegraphInteractionKind
): boolean {
  return (
    path.length > 0 && path.every(node => (kind === 'select' ? node.selectable : node.hoverable))
  );
}

/** Finds the first eligible hit without letting an ineligible hit occlude later candidates. */
export function getFirstScenegraphInteractionHit<Hit extends ScenegraphInteractionHit>(
  hits: readonly Hit[],
  kind: ScenegraphInteractionKind
): Hit | undefined {
  return hits.find(hit => isScenegraphInteractionEnabled(hit.path, kind));
}

/** One bubbled host interaction event. */
export type ScenegraphInteractionEvent = {
  type: 'select' | 'hover-in' | 'hover-out';
  /** Target object where the interaction began or ended. */
  target: ScenegraphNode;
  /** Node receiving this step of the event's upward propagation. */
  currentTarget: ScenegraphNode;
  /** Identifies the pointer or controller. */
  controllerIndex: number;
  /** The original host hit associated with this event. */
  hit: ScenegraphInteractionHit;
};

/** Caller-owned hit testing with per-controller hover tracking and subtree event propagation. */
export class ScenegraphInteractionManager {
  private readonly hoveredHits = new Map<number, ScenegraphInteractionHit>();
  private readonly pendingHover = new Map<number, (ScenegraphInteractionHit | undefined)[]>();
  private readonly onEvent: (event: ScenegraphInteractionEvent) => void;

  /** Creates a controller that reports bubbled selection and hover events. */
  constructor(onEvent: (event: ScenegraphInteractionEvent) => void) {
    this.onEvent = onEvent;
  }

  /** Selects the first eligible nearest-first hit and bubbles from target to root. */
  select<Hit extends ScenegraphInteractionHit>(
    hits: readonly Hit[],
    controllerIndex = 0
  ): Hit | undefined {
    const hit = getFirstScenegraphInteractionHit(hits, 'select');
    if (!hit) return undefined;
    this.emitPath('select', hit, 0, controllerIndex);
    return hit;
  }

  /** Updates hover from current hits; call after pointer, camera, object, or flag changes. */
  updateHover<Hit extends ScenegraphInteractionHit>(
    hits: readonly Hit[],
    controllerIndex = 0
  ): Hit | undefined {
    const hit = getFirstScenegraphInteractionHit(hits, 'hover');
    const queuedHit = hit ? {...hit, path: [...hit.path]} : undefined;
    const activeQueue = this.pendingHover.get(controllerIndex);
    if (activeQueue) {
      activeQueue.push(queuedHit);
      return hit;
    }
    const queue = [queuedHit];
    this.pendingHover.set(controllerIndex, queue);
    try {
      while (queue.length) {
        const next = queue.shift();
        const previous = this.hoveredHits.get(controllerIndex);
        const previousPath = previous?.path || [];
        const nextPath = next?.path || [];
        let shared = 0;
        while (
          shared < previousPath.length &&
          shared < nextPath.length &&
          previousPath[shared] === nextPath[shared]
        )
          shared++;
        if (next) this.hoveredHits.set(controllerIndex, next);
        else this.hoveredHits.delete(controllerIndex);
        if (previous) this.emitPath('hover-out', previous, shared, controllerIndex);
        if (next) this.emitPath('hover-in', next, shared, controllerIndex);
      }
    } finally {
      this.pendingHover.delete(controllerIndex);
    }
    return hit;
  }

  /** Emits exits for one controller and drops its tracked hover path. */
  clearHover(controllerIndex = 0): void {
    this.updateHover([], controllerIndex);
  }

  /** Emits events from the target towards the first ancestor outside the shared subtree. */
  private emitPath(
    type: ScenegraphInteractionEvent['type'],
    hit: ScenegraphInteractionHit,
    first: number,
    controllerIndex: number
  ): void {
    const {path} = hit;
    const target = path[path.length - 1];
    for (let index = path.length - 1; index >= first; index--) {
      this.onEvent({type, target, currentTarget: path[index], controllerIndex, hit});
    }
  }
}
