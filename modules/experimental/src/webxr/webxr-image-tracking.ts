// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRImageTrackingManagerProps = {
  trackedImages?: readonly XRTrackedImageInit[];
};

export type WebXRImageTrackingSessionInitProps = WebXRImageTrackingManagerProps & {
  required?: boolean;
};

export type WebXRImageTrackingState = {
  xrFrame: XRFrame;
  session: XRSession;
  images: readonly WebXRTrackedImageState[];
  added: readonly WebXRTrackedImageState[];
  updated: readonly WebXRTrackedImageState[];
  removed: readonly WebXRTrackedImageState[];
};

export type WebXRTrackedImageState = {
  result: XRImageTrackingResult;
  pose: XRPose;
  matrix: Float32Array;
  index: number;
  trackingState: XRImageTrackingState;
  measuredWidthInMeters: number;
};

/** Experimental v10 WebXR image-tracking result and per-frame diff helper. */
export class WebXRImageTrackingManager {
  props: Required<WebXRImageTrackingManagerProps>;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;

  private _images = new Map<number, WebXRTrackedImageState>();
  private _sessionEndListener = () => this.clearSession();

  constructor(props: WebXRImageTrackingManagerProps = {}) {
    this.props = {...WebXRImageTrackingManager.defaultProps, ...props};
  }

  setSession(
    session: XRSession | null,
    referenceSpace: XRReferenceSpace | null,
    props: WebXRImageTrackingManagerProps = {}
  ): this {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRImageTrackingManager requires an app reference space');
    }

    this.session = session;
    this.referenceSpace = referenceSpace;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  async getImageTrackability(): Promise<readonly XRImageTrackability[] | null> {
    if (!this.session?.getImageTrackability) {
      return null;
    }

    return this.session.getImageTrackability();
  }

  getImageTrackingState(xrFrame: XRFrame): WebXRImageTrackingState | null {
    if (!this.session || !this.referenceSpace) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.getImageTrackingResults) {
      return null;
    }

    const previousImages = this._images;
    const nextImages = new Map<number, WebXRTrackedImageState>();
    const images: WebXRTrackedImageState[] = [];
    const added: WebXRTrackedImageState[] = [];
    const updated: WebXRTrackedImageState[] = [];

    for (const result of xrFrame.getImageTrackingResults()) {
      const image = this._getTrackedImageState(xrFrame, result);
      if (!image) {
        continue;
      }

      nextImages.set(image.index, image);
      images.push(image);

      const previousImage = previousImages.get(image.index);
      if (!previousImage) {
        added.push(image);
      } else if (isTrackedImageUpdated(previousImage, image)) {
        updated.push(image);
      }
    }

    const removed = [...previousImages]
      .filter(([index]) => !nextImages.has(index))
      .map(([, image]) => image);

    this._images = nextImages;

    return {xrFrame, session: this.session, images, added, updated, removed};
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session = null;
    this.referenceSpace = null;
    this._images.clear();
  }

  destroy(): void {
    this.clearSession();
  }

  private _getTrackedImageState(
    xrFrame: XRFrame,
    result: XRImageTrackingResult
  ): WebXRTrackedImageState | null {
    const pose = xrFrame.getPose(result.imageSpace, this.referenceSpace!);
    if (!pose) {
      return null;
    }

    return {
      result,
      pose,
      matrix: pose.transform.matrix,
      index: result.index,
      trackingState: result.trackingState,
      measuredWidthInMeters: result.measuredWidthInMeters
    };
  }

  static defaultProps: Required<WebXRImageTrackingManagerProps> = {
    trackedImages: undefined!
  };
}

export function getWebXRImageTrackingSessionInit(
  props: WebXRImageTrackingSessionInitProps = {}
): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['image-tracking'],
    trackedImages: props.trackedImages ? [...props.trackedImages] : undefined
  };
}

function isTrackedImageUpdated(
  previousImage: WebXRTrackedImageState,
  image: WebXRTrackedImageState
): boolean {
  return (
    previousImage.trackingState !== image.trackingState ||
    previousImage.measuredWidthInMeters !== image.measuredWidthInMeters
  );
}
