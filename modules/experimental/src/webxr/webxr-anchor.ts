// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRAnchorState = {
  xrFrame: XRFrame;
  anchors: readonly WebXRAnchorPose[];
};

export type WebXRAnchorPose = {
  anchor: XRAnchor;
  pose: XRPose;
  matrix: Float32Array;
};

/** Experimental v10 WebXR anchor lifecycle and per-frame pose helper. */
export class WebXRAnchorManager {
  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;
  readonly anchors = new Set<XRAnchor>();

  private _sessionEndListener = () => this.clearSession();

  setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null): this {
    this.clearSession();

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRAnchorManager requires an app reference space');
    }

    this.session = session;
    this.referenceSpace = referenceSpace;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  async createAnchor(xrFrame: XRFrame, pose: XRRigidTransform, space?: XRSpace): Promise<XRAnchor> {
    if (!this.session || !this.referenceSpace) {
      throw new Error('WebXRAnchorManager requires an active XRSession');
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.createAnchor) {
      throw new Error('WebXR anchors are not supported in this browser');
    }

    const anchor = await xrFrame.createAnchor(pose, space || this.referenceSpace);
    this.anchors.add(anchor);
    return anchor;
  }

  async createAnchorFromHitTestResult(xrHitTestResult: XRHitTestResult): Promise<XRAnchor> {
    if (!this.session) {
      throw new Error('WebXRAnchorManager requires an active XRSession');
    }
    if (!xrHitTestResult.createAnchor) {
      throw new Error('WebXR hit-test anchors are not supported in this browser');
    }

    const anchor = await xrHitTestResult.createAnchor();
    this.anchors.add(anchor);
    return anchor;
  }

  getAnchorState(xrFrame: XRFrame): WebXRAnchorState | null {
    if (!this.session || !this.referenceSpace) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }

    const trackedAnchors = xrFrame.trackedAnchors;
    if (trackedAnchors) {
      this._syncTrackedAnchors(trackedAnchors);
    }

    const anchors = Array.from(this.anchors)
      .map(anchor => makeWebXRAnchorPose(anchor, xrFrame, this.referenceSpace!))
      .filter((anchorPose): anchorPose is WebXRAnchorPose => Boolean(anchorPose));

    return {xrFrame, anchors};
  }

  deleteAnchor(anchor: XRAnchor): void {
    if (this.anchors.delete(anchor)) {
      anchor.delete();
    }
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    for (const anchor of this.anchors) {
      anchor.delete();
    }
    this.anchors.clear();
    this.session = null;
    this.referenceSpace = null;
  }

  destroy(): void {
    this.clearSession();
  }

  private _syncTrackedAnchors(trackedAnchors: ReadonlySet<XRAnchor>): void {
    for (const anchor of this.anchors) {
      if (!trackedAnchors.has(anchor)) {
        this.anchors.delete(anchor);
      }
    }
  }
}

function makeWebXRAnchorPose(
  anchor: XRAnchor,
  xrFrame: XRFrame,
  referenceSpace: XRReferenceSpace
): WebXRAnchorPose | null {
  const pose = xrFrame.getPose(anchor.anchorSpace, referenceSpace);
  if (!pose) {
    return null;
  }

  return {
    anchor,
    pose,
    matrix: pose.transform.matrix
  };
}
