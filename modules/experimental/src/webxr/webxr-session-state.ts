// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRTargetFrameRate = number | 'highest' | 'lowest';

export type WebXRSessionStateManagerProps = {
  targetFrameRate?: WebXRTargetFrameRate | null;
};

export type WebXRSessionState = {
  session: XRSession;
  visibilityState: XRVisibilityState;
  frameRate: number | null;
  supportedFrameRates: readonly number[];
  isVisible: boolean;
  isFocused: boolean;
  isSystemKeyboardSupported: boolean | null;
};

/** Experimental v10 WebXR session visibility and frame-rate helper. */
export class WebXRSessionStateManager {
  props: Required<WebXRSessionStateManagerProps>;
  session: XRSession | null = null;

  private _sessionState: WebXRSessionState | null = null;
  private _sessionEndListener = () => this.clearSession();
  private _sessionStateChangeListener = () => {
    this._sessionState = this.session ? makeWebXRSessionState(this.session) : null;
  };

  constructor(props: WebXRSessionStateManagerProps = {}) {
    this.props = {...WebXRSessionStateManager.defaultProps, ...props};
  }

  async setSession(
    session: XRSession | null,
    props: WebXRSessionStateManagerProps = {}
  ): Promise<this> {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }

    this.session = session;
    this._sessionState = makeWebXRSessionState(session);
    session.addEventListener('end', this._sessionEndListener);
    session.addEventListener('visibilitychange', this._sessionStateChangeListener);
    session.addEventListener('frameratechange', this._sessionStateChangeListener);

    if (this.props.targetFrameRate !== null) {
      await this.updateTargetFrameRate(this.props.targetFrameRate);
    }

    return this;
  }

  getSessionState(): WebXRSessionState | null {
    if (!this.session) {
      return null;
    }
    this._sessionState = makeWebXRSessionState(this.session);
    return this._sessionState;
  }

  async updateTargetFrameRate(targetFrameRate: WebXRTargetFrameRate): Promise<number | null> {
    if (!this.session) {
      return null;
    }

    const targetFrameRateValue = getWebXRTargetFrameRate(this.session, targetFrameRate);
    if (targetFrameRateValue === null || !this.session.updateTargetFrameRate) {
      return null;
    }

    await this.session.updateTargetFrameRate(targetFrameRateValue);
    this._sessionState = makeWebXRSessionState(this.session);
    return targetFrameRateValue;
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session?.removeEventListener('visibilitychange', this._sessionStateChangeListener);
    this.session?.removeEventListener('frameratechange', this._sessionStateChangeListener);
    this.session = null;
    this._sessionState = null;
  }

  destroy(): void {
    this.clearSession();
  }

  static defaultProps: Required<WebXRSessionStateManagerProps> = {
    targetFrameRate: null
  };
}

export function makeWebXRSessionState(session: XRSession): WebXRSessionState {
  const visibilityState = session.visibilityState || 'visible';

  return {
    session,
    visibilityState,
    frameRate: session.frameRate ?? null,
    supportedFrameRates: getWebXRSupportedFrameRates(session),
    isVisible: visibilityState !== 'hidden',
    isFocused: visibilityState === 'visible',
    isSystemKeyboardSupported: session.isSystemKeyboardSupported ?? null
  };
}

export function getWebXRSupportedFrameRates(session: XRSession): readonly number[] {
  return session.supportedFrameRates ? Array.from(session.supportedFrameRates) : [];
}

export function getWebXRTargetFrameRate(
  session: XRSession,
  targetFrameRate: WebXRTargetFrameRate
): number | null {
  const supportedFrameRates = getWebXRSupportedFrameRates(session);
  if (supportedFrameRates.length === 0) {
    return typeof targetFrameRate === 'number' ? targetFrameRate : null;
  }

  if (targetFrameRate === 'highest') {
    return Math.max(...supportedFrameRates);
  }
  if (targetFrameRate === 'lowest') {
    return Math.min(...supportedFrameRates);
  }

  return supportedFrameRates.includes(targetFrameRate) ? targetFrameRate : null;
}
