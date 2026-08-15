// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Experimental v10 WebXR hit-test source options. */
export type WebXRHitTestManagerProps = {
  entityTypes?: XRHitTestTrackableType[];
  offsetRay?: XRRay;
};

export type WebXRHitTestState = {
  xrFrame: XRFrame;
  hits: readonly WebXRHitTestResult[];
};

export type WebXRHitTestResult = {
  xrHitTestResult: XRHitTestResult;
  pose: XRPose;
  matrix: Float32Array;
};

/**
 * Experimental v10 WebXR hit-test source and per-frame result helper.
 *
 * WebXR hit tests are primarily useful for immersive AR placement workflows.
 */
export class WebXRHitTestManager {
  props: Required<WebXRHitTestManagerProps>;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;
  viewerSpace: XRReferenceSpace | null = null;
  hitTestSource: XRHitTestSource | null = null;

  private _sessionEndListener = () => this.clearSession();

  constructor(props: WebXRHitTestManagerProps = {}) {
    this.props = {...WebXRHitTestManager.defaultProps, ...props};
  }

  async setSession(
    session: XRSession | null,
    referenceSpace: XRReferenceSpace | null,
    props: WebXRHitTestManagerProps = {}
  ): Promise<this> {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRHitTestManager requires an app reference space');
    }
    if (!session.requestHitTestSource) {
      throw new Error('WebXR hit-test source requests are not supported in this browser');
    }

    const viewerSpace = await session.requestReferenceSpace('viewer');
    const hitTestSource = await session.requestHitTestSource({
      space: viewerSpace,
      offsetRay: this.props.offsetRay,
      entityTypes: this.props.entityTypes
    });
    if (!hitTestSource) {
      throw new Error('WebXR hit-test source request returned no source');
    }

    this.session = session;
    this.referenceSpace = referenceSpace;
    this.viewerSpace = viewerSpace;
    this.hitTestSource = hitTestSource;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  getHitTestState(xrFrame: XRFrame): WebXRHitTestState | null {
    if (!this.session || !this.referenceSpace || !this.hitTestSource) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.getHitTestResults) {
      return null;
    }

    const hits = xrFrame
      .getHitTestResults(this.hitTestSource)
      .map(xrHitTestResult => makeWebXRHitTestResult(xrHitTestResult, this.referenceSpace!))
      .filter((hit): hit is WebXRHitTestResult => Boolean(hit));

    return {xrFrame, hits};
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.hitTestSource?.cancel();
    this.session = null;
    this.referenceSpace = null;
    this.viewerSpace = null;
    this.hitTestSource = null;
  }

  destroy(): void {
    this.clearSession();
  }

  static defaultProps: Required<WebXRHitTestManagerProps> = {
    entityTypes: undefined!,
    offsetRay: undefined!
  };
}

function makeWebXRHitTestResult(
  xrHitTestResult: XRHitTestResult,
  referenceSpace: XRReferenceSpace
): WebXRHitTestResult | null {
  const pose = xrHitTestResult.getPose(referenceSpace);
  if (!pose) {
    return null;
  }

  return {
    xrHitTestResult,
    pose,
    matrix: pose.transform.matrix
  };
}
