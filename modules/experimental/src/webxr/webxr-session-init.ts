// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRSessionFeature = string;

export type WebXRSessionFeatures = {
  requiredFeatures: readonly WebXRSessionFeature[];
  optionalFeatures: readonly WebXRSessionFeature[];
  requestedFeatures: readonly WebXRSessionFeature[];
};

export type WebXRSessionSupportProps = {
  xr?: XRSystem | null;
  modes?: readonly XRSessionMode[];
};

export type WebXRSessionSupport = {
  xr: XRSystem | null;
  isSupported: boolean;
  modes: Partial<Record<XRSessionMode, boolean>>;
  supportedModes: readonly XRSessionMode[];
};

export const WEBXR_DEFAULT_SESSION_SUPPORT_MODES: readonly XRSessionMode[] = [
  'immersive-vr',
  'immersive-ar',
  'inline'
];

/** Merges WebXR session init dictionaries while de-duplicating feature descriptors. */
export function mergeWebXRSessionInit(
  ...sessionInits: (XRSessionInit | null | undefined)[]
): XRSessionInit {
  const mergedSessionInit = {} as XRSessionInit;
  const requiredFeatureSet = new Set<WebXRSessionFeature>();
  const optionalFeatureSet = new Set<WebXRSessionFeature>();

  for (const sessionInit of sessionInits) {
    if (!sessionInit) {
      continue;
    }
    Object.assign(mergedSessionInit, sessionInit);
    for (const feature of sessionInit.requiredFeatures || []) {
      requiredFeatureSet.add(feature);
    }
    for (const feature of sessionInit.optionalFeatures || []) {
      optionalFeatureSet.add(feature);
    }
  }

  const requiredFeatures = Array.from(requiredFeatureSet);
  const optionalFeatures = Array.from(optionalFeatureSet).filter(
    feature => !requiredFeatureSet.has(feature)
  );

  delete mergedSessionInit.requiredFeatures;
  delete mergedSessionInit.optionalFeatures;
  if (requiredFeatures.length > 0) {
    mergedSessionInit.requiredFeatures = requiredFeatures;
  }
  if (optionalFeatures.length > 0) {
    mergedSessionInit.optionalFeatures = optionalFeatures;
  }

  return mergedSessionInit;
}

export function getWebXRSessionFeatures(
  sessionInit: Pick<XRSessionInit, 'requiredFeatures' | 'optionalFeatures'> = {}
): WebXRSessionFeatures {
  const requiredFeatures = Array.from(new Set(sessionInit.requiredFeatures || []));
  const optionalFeatures = Array.from(new Set(sessionInit.optionalFeatures || [])).filter(
    feature => !requiredFeatures.includes(feature)
  );
  return {
    requiredFeatures,
    optionalFeatures,
    requestedFeatures: [...requiredFeatures, ...optionalFeatures]
  };
}

export function isWebXRSessionFeatureEnabled(
  session: XRSession,
  feature: WebXRSessionFeature
): boolean {
  return Boolean(session.enabledFeatures?.includes(feature));
}

export async function getWebXRSessionSupport(
  props: WebXRSessionSupportProps = {}
): Promise<WebXRSessionSupport> {
  const xr = props.xr === undefined ? getNavigatorXR() : props.xr;
  const modes = props.modes || WEBXR_DEFAULT_SESSION_SUPPORT_MODES;
  const modeSupport: Partial<Record<XRSessionMode, boolean>> = {};

  if (!xr) {
    return {
      xr: null,
      isSupported: false,
      modes: modeSupport,
      supportedModes: []
    };
  }

  for (const mode of modes) {
    modeSupport[mode] = await isWebXRSessionModeSupported(xr, mode);
  }

  const supportedModes = modes.filter(mode => modeSupport[mode]);
  return {
    xr,
    isSupported: supportedModes.length > 0,
    modes: modeSupport,
    supportedModes
  };
}

async function isWebXRSessionModeSupported(xr: XRSystem, mode: XRSessionMode): Promise<boolean> {
  try {
    return await xr.isSessionSupported(mode);
  } catch {
    return false;
  }
}

function getNavigatorXR(): XRSystem | null {
  return typeof navigator !== 'undefined' ? navigator.xr || null : null;
}
