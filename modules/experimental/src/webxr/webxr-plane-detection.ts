// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRPlaneDetectionManagerProps = {
  orientations?: readonly XRPlaneOrientation[];
  semanticLabels?: readonly string[];
};

export type WebXRPlaneDetectionSessionInitProps = {
  required?: boolean;
};

export type WebXRPlaneDetectionState = {
  xrFrame: XRFrame;
  session: XRSession;
  planes: readonly WebXRPlaneState[];
  added: readonly WebXRPlaneState[];
  updated: readonly WebXRPlaneState[];
  removed: readonly WebXRPlaneState[];
};

export type WebXRPlaneState = {
  xrPlane: XRPlane;
  pose: XRPose;
  matrix: Float32Array;
  polygon: readonly [number, number, number][];
  orientation: XRPlaneOrientation | null;
  semanticLabel: string | null;
  lastChangedTime: DOMHighResTimeStamp;
};

/** Experimental v10 WebXR plane-detection state and per-frame diff helper. */
export class WebXRPlaneDetectionManager {
  props: Required<WebXRPlaneDetectionManagerProps>;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;

  private _planes = new Map<XRPlane, WebXRPlaneState>();
  private _sessionEndListener = () => this.clearSession();

  constructor(props: WebXRPlaneDetectionManagerProps = {}) {
    this.props = {...WebXRPlaneDetectionManager.defaultProps, ...props};
  }

  setSession(
    session: XRSession | null,
    referenceSpace: XRReferenceSpace | null,
    props: WebXRPlaneDetectionManagerProps = {}
  ): this {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRPlaneDetectionManager requires an app reference space');
    }

    this.session = session;
    this.referenceSpace = referenceSpace;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  getPlaneDetectionState(xrFrame: XRFrame): WebXRPlaneDetectionState | null {
    if (!this.session || !this.referenceSpace) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.detectedPlanes) {
      return null;
    }

    const previousPlanes = this._planes;
    const nextPlanes = new Map<XRPlane, WebXRPlaneState>();
    const planes: WebXRPlaneState[] = [];
    const added: WebXRPlaneState[] = [];
    const updated: WebXRPlaneState[] = [];

    for (const xrPlane of xrFrame.detectedPlanes) {
      const plane = this._getPlaneState(xrFrame, xrPlane);
      if (!plane) {
        continue;
      }

      nextPlanes.set(xrPlane, plane);
      planes.push(plane);

      const previousPlane = previousPlanes.get(xrPlane);
      if (!previousPlane) {
        added.push(plane);
      } else if (previousPlane.lastChangedTime !== plane.lastChangedTime) {
        updated.push(plane);
      }
    }

    const removed = [...previousPlanes]
      .filter(([xrPlane]) => !nextPlanes.has(xrPlane))
      .map(([, plane]) => plane);

    this._planes = nextPlanes;

    return {xrFrame, session: this.session, planes, added, updated, removed};
  }

  async initiateRoomCapture(): Promise<boolean> {
    if (!this.session?.initiateRoomCapture) {
      return false;
    }

    await this.session.initiateRoomCapture();
    return true;
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session = null;
    this.referenceSpace = null;
    this._planes.clear();
  }

  destroy(): void {
    this.clearSession();
  }

  private _getPlaneState(xrFrame: XRFrame, xrPlane: XRPlane): WebXRPlaneState | null {
    if (!this._matchesPlane(xrPlane)) {
      return null;
    }

    const pose = xrFrame.getPose(xrPlane.planeSpace, this.referenceSpace!);
    if (!pose) {
      return null;
    }

    return {
      xrPlane,
      pose,
      matrix: pose.transform.matrix,
      polygon: xrPlane.polygon.map(getDOMPointVector3),
      orientation: xrPlane.orientation,
      semanticLabel: xrPlane.semanticLabel ?? null,
      lastChangedTime: xrPlane.lastChangedTime
    };
  }

  private _matchesPlane(xrPlane: XRPlane): boolean {
    const {orientations, semanticLabels} = this.props;
    if (
      orientations?.length &&
      (!xrPlane.orientation || !orientations.includes(xrPlane.orientation))
    ) {
      return false;
    }
    if (
      semanticLabels?.length &&
      (!xrPlane.semanticLabel || !semanticLabels.includes(xrPlane.semanticLabel))
    ) {
      return false;
    }

    return true;
  }

  static defaultProps: Required<WebXRPlaneDetectionManagerProps> = {
    orientations: undefined!,
    semanticLabels: undefined!
  };
}

export function getWebXRPlaneDetectionSessionInit(
  props: WebXRPlaneDetectionSessionInitProps = {}
): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['plane-detection']
  };
}

function getDOMPointVector3(point: DOMPointReadOnly): [number, number, number] {
  return [point.x, point.y, point.z];
}
