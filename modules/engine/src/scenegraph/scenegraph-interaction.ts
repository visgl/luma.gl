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
};

/** Caller-owned hit testing with per-controller hover tracking and subtree event propagation. */
export class ScenegraphInteractionManager {
  private readonly hoveredPaths = new Map<number, readonly ScenegraphNode[]>();
  private readonly onEvent: (event: ScenegraphInteractionEvent) => void;

  /** Creates a controller that reports bubbled selection and hover events. */
  constructor(onEvent: (event: ScenegraphInteractionEvent) => void) {
    this.onEvent = onEvent;
  }

  /** Selects the first eligible nearest-first hit and bubbles from target to root. */
  select(
    hits: readonly ScenegraphInteractionHit[],
    controllerIndex = 0
  ): ScenegraphNode | undefined {
    const path = getFirstScenegraphInteractionHit(hits, 'select')?.path;
    if (!path) return undefined;
    this.emitPath('select', path, 0, controllerIndex);
    return path[path.length - 1];
  }

  /** Updates hover from current hits; call after pointer, camera, object, or flag changes. */
  updateHover(
    hits: readonly ScenegraphInteractionHit[],
    controllerIndex = 0
  ): ScenegraphNode | undefined {
    const previous = this.hoveredPaths.get(controllerIndex) || [];
    const current = getFirstScenegraphInteractionHit(hits, 'hover')?.path || [];
    let shared = 0;
    while (
      shared < previous.length &&
      shared < current.length &&
      previous[shared] === current[shared]
    )
      shared++;
    this.emitPath('hover-out', previous, shared, controllerIndex);
    this.emitPath('hover-in', current, shared, controllerIndex);
    if (current.length) this.hoveredPaths.set(controllerIndex, [...current]);
    else this.hoveredPaths.delete(controllerIndex);
    return current[current.length - 1];
  }

  /** Emits exits for one controller and drops its tracked hover path. */
  clearHover(controllerIndex = 0): void {
    this.updateHover([], controllerIndex);
  }

  /** Emits events from the target towards the first ancestor outside the shared subtree. */
  private emitPath(
    type: ScenegraphInteractionEvent['type'],
    path: readonly ScenegraphNode[],
    first: number,
    controllerIndex: number
  ): void {
    const target = path[path.length - 1];
    for (let index = path.length - 1; index >= first; index--) {
      this.onEvent({type, target, currentTarget: path[index], controllerIndex});
    }
  }
}
