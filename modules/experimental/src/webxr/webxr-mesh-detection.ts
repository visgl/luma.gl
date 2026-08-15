// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRMeshDetectionManagerProps = {
  semanticLabels?: readonly string[];
};

export type WebXRMeshDetectionSessionInitProps = {
  required?: boolean;
};

export type WebXRMeshDetectionState = {
  xrFrame: XRFrame;
  session: XRSession;
  meshes: readonly WebXRMeshState[];
  added: readonly WebXRMeshState[];
  updated: readonly WebXRMeshState[];
  removed: readonly WebXRMeshState[];
};

export type WebXRMeshState = {
  xrMesh: XRMesh;
  pose: XRPose;
  matrix: Float32Array;
  vertices: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  triangleCount: number;
  semanticLabel: string | null;
  lastChangedTime: DOMHighResTimeStamp;
};

/** Experimental v10 WebXR mesh-detection state and per-frame diff helper. */
export class WebXRMeshDetectionManager {
  props: Required<WebXRMeshDetectionManagerProps>;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;

  private _meshes = new Map<XRMesh, WebXRMeshState>();
  private _sessionEndListener = () => this.clearSession();

  constructor(props: WebXRMeshDetectionManagerProps = {}) {
    this.props = {...WebXRMeshDetectionManager.defaultProps, ...props};
  }

  setSession(
    session: XRSession | null,
    referenceSpace: XRReferenceSpace | null,
    props: WebXRMeshDetectionManagerProps = {}
  ): this {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRMeshDetectionManager requires an app reference space');
    }

    this.session = session;
    this.referenceSpace = referenceSpace;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  getMeshDetectionState(xrFrame: XRFrame): WebXRMeshDetectionState | null {
    if (!this.session || !this.referenceSpace) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.detectedMeshes) {
      return null;
    }

    const previousMeshes = this._meshes;
    const nextMeshes = new Map<XRMesh, WebXRMeshState>();
    const meshes: WebXRMeshState[] = [];
    const added: WebXRMeshState[] = [];
    const updated: WebXRMeshState[] = [];

    for (const xrMesh of xrFrame.detectedMeshes) {
      const mesh = this._getMeshState(xrFrame, xrMesh);
      if (!mesh) {
        continue;
      }

      nextMeshes.set(xrMesh, mesh);
      meshes.push(mesh);

      const previousMesh = previousMeshes.get(xrMesh);
      if (!previousMesh) {
        added.push(mesh);
      } else if (previousMesh.lastChangedTime !== mesh.lastChangedTime) {
        updated.push(mesh);
      }
    }

    const removed = [...previousMeshes]
      .filter(([xrMesh]) => !nextMeshes.has(xrMesh))
      .map(([, mesh]) => mesh);

    this._meshes = nextMeshes;

    return {xrFrame, session: this.session, meshes, added, updated, removed};
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session = null;
    this.referenceSpace = null;
    this._meshes.clear();
  }

  destroy(): void {
    this.clearSession();
  }

  private _getMeshState(xrFrame: XRFrame, xrMesh: XRMesh): WebXRMeshState | null {
    if (!this._matchesMesh(xrMesh)) {
      return null;
    }

    const pose = xrFrame.getPose(xrMesh.meshSpace, this.referenceSpace!);
    if (!pose) {
      return null;
    }

    return {
      xrMesh,
      pose,
      matrix: pose.transform.matrix,
      vertices: xrMesh.vertices,
      indices: xrMesh.indices,
      vertexCount: Math.floor(xrMesh.vertices.length / 3),
      triangleCount: Math.floor(xrMesh.indices.length / 3),
      semanticLabel: xrMesh.semanticLabel ?? null,
      lastChangedTime: xrMesh.lastChangedTime
    };
  }

  private _matchesMesh(xrMesh: XRMesh): boolean {
    const {semanticLabels} = this.props;
    return (
      !semanticLabels?.length ||
      Boolean(xrMesh.semanticLabel && semanticLabels.includes(xrMesh.semanticLabel))
    );
  }

  static defaultProps: Required<WebXRMeshDetectionManagerProps> = {
    semanticLabels: undefined!
  };
}

export function getWebXRMeshDetectionSessionInit(
  props: WebXRMeshDetectionSessionInitProps = {}
): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['mesh-detection']
  };
}
