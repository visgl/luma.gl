// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import {isPointInWebXRBounds, type WebXRBoundsPoint} from './webxr-bounds';

export type WebXRReferenceSpaceResetState = {
  referenceSpace: XRReferenceSpace;
  resetCount: number;
  lastResetEvent: XRReferenceSpaceEvent | null;
  transform: XRRigidTransform | null;
  matrix: Float32Array | null;
};

export type WebXRTeleportOffsetProps = {
  bounds?: readonly WebXRBoundsPoint[] | null;
  preserveY?: boolean;
  invert?: boolean;
  orientation?: DOMPointInit;
};

export type WebXRTeleportState = {
  referenceSpace: XRReferenceSpace;
  offsetReferenceSpace: XRReferenceSpace;
  originOffset: XRRigidTransform;
  target: NumberArray3;
  translation: NumberArray3;
};

/** Experimental v10 helper for tracking WebXR reference-space reset events. */
export class WebXRReferenceSpaceManager {
  referenceSpace: XRReferenceSpace | null = null;
  resetCount = 0;
  lastResetEvent: XRReferenceSpaceEvent | null = null;

  private _resetListener = (event: Event) => {
    const resetEvent = event as XRReferenceSpaceEvent;
    if (resetEvent.referenceSpace && resetEvent.referenceSpace !== this.referenceSpace) {
      return;
    }
    this.resetCount++;
    this.lastResetEvent = resetEvent;
  };

  setReferenceSpace(referenceSpace: XRReferenceSpace | null): this {
    this.clearReferenceSpace();

    if (!referenceSpace) {
      return this;
    }

    this.referenceSpace = referenceSpace;
    referenceSpace.addEventListener('reset', this._resetListener);
    return this;
  }

  getReferenceSpaceState(): WebXRReferenceSpaceResetState | null {
    return this.referenceSpace
      ? makeWebXRReferenceSpaceState(this.referenceSpace, this.resetCount, this.lastResetEvent)
      : null;
  }

  getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace | null {
    return this.referenceSpace?.getOffsetReferenceSpace?.(originOffset) || null;
  }

  getTeleportReferenceSpace(
    target: NumberArray3,
    props: WebXRTeleportOffsetProps = {}
  ): WebXRTeleportState | null {
    return this.referenceSpace ? getWebXRTeleportState(this.referenceSpace, target, props) : null;
  }

  clearReferenceSpace(): void {
    this.referenceSpace?.removeEventListener('reset', this._resetListener);
    this.referenceSpace = null;
    this.resetCount = 0;
    this.lastResetEvent = null;
  }

  destroy(): void {
    this.clearReferenceSpace();
  }
}

export function makeWebXRReferenceSpaceState(
  referenceSpace: XRReferenceSpace,
  resetCount: number,
  lastResetEvent: XRReferenceSpaceEvent | null
): WebXRReferenceSpaceResetState {
  const transform = lastResetEvent?.transform || null;
  return {
    referenceSpace,
    resetCount,
    lastResetEvent,
    transform,
    matrix: transform?.matrix || null
  };
}

export function getWebXRTeleportState(
  referenceSpace: XRReferenceSpace,
  target: NumberArray3,
  props: WebXRTeleportOffsetProps = {}
): WebXRTeleportState | null {
  const originOffset = makeWebXRTeleportOffset(target, props);
  const offsetReferenceSpace = originOffset
    ? referenceSpace.getOffsetReferenceSpace?.(originOffset) || null
    : null;

  return originOffset && offsetReferenceSpace
    ? {
        referenceSpace,
        offsetReferenceSpace,
        originOffset,
        target: [target[0], target[1], target[2]],
        translation: getWebXRTeleportTranslation(target, props)
      }
    : null;
}

export function makeWebXRTeleportOffset(
  target: NumberArray3,
  props: WebXRTeleportOffsetProps = {}
): XRRigidTransform | null {
  if (
    !isWebXRTeleportTargetAllowed(target, props.bounds) ||
    typeof XRRigidTransform === 'undefined'
  ) {
    return null;
  }

  const translation = getWebXRTeleportTranslation(target, props);
  return new XRRigidTransform(
    {
      x: translation[0],
      y: translation[1],
      z: translation[2]
    },
    props.orientation
  );
}

export function getWebXRTeleportTranslation(
  target: NumberArray3,
  props: Pick<WebXRTeleportOffsetProps, 'invert' | 'preserveY'> = {}
): NumberArray3 {
  const multiplier = props.invert === false ? 1 : -1;
  return [
    target[0] * multiplier,
    props.preserveY === false ? target[1] * multiplier : 0,
    target[2] * multiplier
  ];
}

export function isWebXRTeleportTargetAllowed(
  target: NumberArray3,
  bounds?: readonly WebXRBoundsPoint[] | null
): boolean {
  return !bounds || isPointInWebXRBounds(target, bounds);
}
