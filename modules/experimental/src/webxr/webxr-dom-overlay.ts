// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRDOMOverlayManagerProps = {
  root?: Element | null;
  suppressXRSelectEvents?: boolean;
};

export type WebXRDOMOverlaySessionInitProps = {
  required?: boolean;
};

export type WebXRDOMOverlayState = {
  session: XRSession;
  root: Element | null;
  type: XRDOMOverlayType;
};

/** Experimental v10 WebXR DOM overlay session-state helper. */
export class WebXRDOMOverlayManager {
  props: Required<WebXRDOMOverlayManagerProps>;

  session: XRSession | null = null;
  root: Element | null = null;

  private _sessionEndListener = () => this.clearSession();
  private _beforeXRSelectListener = (event: Event) => event.preventDefault();

  constructor(props: WebXRDOMOverlayManagerProps = {}) {
    this.props = {...WebXRDOMOverlayManager.defaultProps, ...props};
  }

  setSession(session: XRSession | null, props: WebXRDOMOverlayManagerProps = {}): this {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }

    this.session = session;
    this.root = this.props.root || null;
    session.addEventListener('end', this._sessionEndListener);
    if (this.root && this.props.suppressXRSelectEvents) {
      this.root.addEventListener('beforexrselect', this._beforeXRSelectListener);
    }
    return this;
  }

  getOverlayState(): WebXRDOMOverlayState | null {
    const domOverlayState = this.session?.domOverlayState;
    if (!this.session || !domOverlayState) {
      return null;
    }

    return {
      session: this.session,
      root: this.root,
      type: domOverlayState.type
    };
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.root?.removeEventListener('beforexrselect', this._beforeXRSelectListener);
    this.session = null;
    this.root = null;
  }

  destroy(): void {
    this.clearSession();
  }

  static defaultProps: Required<WebXRDOMOverlayManagerProps> = {
    root: null,
    suppressXRSelectEvents: true
  };
}

export function getWebXRDOMOverlaySessionInit(
  root: Element,
  props: WebXRDOMOverlaySessionInitProps = {}
): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['dom-overlay'],
    domOverlay: {root}
  };
}
