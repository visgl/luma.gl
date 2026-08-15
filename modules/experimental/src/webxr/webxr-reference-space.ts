// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRReferenceSpaceResetState = {
  referenceSpace: XRReferenceSpace;
  resetCount: number;
  lastResetEvent: XRReferenceSpaceEvent | null;
  transform: XRRigidTransform | null;
  matrix: Float32Array | null;
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
