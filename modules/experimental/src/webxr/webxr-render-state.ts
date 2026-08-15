// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRRenderStateManagerProps = {
  depthNear?: number | null;
  depthFar?: number | null;
  inlineVerticalFieldOfView?: number | null;
};

export type WebXRRenderState = {
  session: XRSession;
  depthNear: number | null;
  depthFar: number | null;
  inlineVerticalFieldOfView: number | null;
  baseLayer: XRWebGLLayer | null;
  layers: readonly XRLayer[];
};

/** Experimental v10 helper for WebXR clip planes and inline FOV render state. */
export class WebXRRenderStateManager {
  props: Required<WebXRRenderStateManagerProps>;
  session: XRSession | null = null;

  private _sessionEndListener = () => this.clearSession();

  constructor(props: WebXRRenderStateManagerProps = {}) {
    this.props = {...WebXRRenderStateManager.defaultProps, ...props};
  }

  async setSession(
    session: XRSession | null,
    props: WebXRRenderStateManagerProps = {}
  ): Promise<this> {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }

    this.session = session;
    session.addEventListener('end', this._sessionEndListener);
    await this.updateRenderState(this.props);
    return this;
  }

  getRenderState(): WebXRRenderState | null {
    return this.session ? makeWebXRRenderState(this.session) : null;
  }

  async updateRenderState(
    props: WebXRRenderStateManagerProps = {}
  ): Promise<WebXRRenderState | null> {
    if (!this.session) {
      return null;
    }

    this.props = {...this.props, ...props};
    const renderStateInit = getWebXRRenderStateInit(this.props);
    if (Object.keys(renderStateInit).length > 0) {
      await this.session.updateRenderState(renderStateInit);
    }

    return this.getRenderState();
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session = null;
  }

  destroy(): void {
    this.clearSession();
  }

  static defaultProps: Required<WebXRRenderStateManagerProps> = {
    depthNear: null,
    depthFar: null,
    inlineVerticalFieldOfView: null
  };
}

export function makeWebXRRenderState(session: XRSession): WebXRRenderState {
  const renderState = session.renderState;
  return {
    session,
    depthNear: renderState?.depthNear ?? null,
    depthFar: renderState?.depthFar ?? null,
    inlineVerticalFieldOfView: renderState?.inlineVerticalFieldOfView ?? null,
    baseLayer: renderState?.baseLayer ?? null,
    layers: renderState?.layers ? Array.from(renderState.layers) : []
  };
}

export function getWebXRRenderStateInit(
  props: WebXRRenderStateManagerProps = {}
): XRRenderStateInit {
  const renderStateInit: XRRenderStateInit = {};
  if (props.depthNear !== null && props.depthNear !== undefined) {
    renderStateInit.depthNear = props.depthNear;
  }
  if (props.depthFar !== null && props.depthFar !== undefined) {
    renderStateInit.depthFar = props.depthFar;
  }
  if (props.inlineVerticalFieldOfView !== null && props.inlineVerticalFieldOfView !== undefined) {
    renderStateInit.inlineVerticalFieldOfView = props.inlineVerticalFieldOfView;
  }
  return renderStateInit;
}
