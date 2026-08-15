// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WEBXR_DEFAULT_SESSION_SUPPORT_MODES,
  getWebXRSessionFeatures,
  getWebXRSessionSupport,
  isWebXRSessionFeatureEnabled,
  mergeWebXRSessionInit
} from '../../src/webxr/webxr-session-init';

test('webxr#mergeWebXRSessionInit composes feature lists and extension fields', testCase => {
  const domOverlayRoot = new EventTarget() as unknown as Element;
  const trackedImages = [{image: {} as ImageBitmap, widthInMeters: 0.5}];
  const depthSensing: XRDepthStateInit = {
    usagePreference: ['gpu-optimized'],
    dataFormatPreference: ['float32']
  };

  const sessionInit = mergeWebXRSessionInit(
    {requiredFeatures: ['webgpu'], optionalFeatures: ['local-floor', 'depth-sensing']},
    {requiredFeatures: ['depth-sensing'], depthSensing},
    {optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: {root: domOverlayRoot}},
    {optionalFeatures: ['image-tracking'], trackedImages}
  );

  testCase.deepEqual(
    sessionInit.requiredFeatures,
    ['webgpu', 'depth-sensing'],
    'deduplicates required features in insertion order'
  );
  testCase.deepEqual(
    sessionInit.optionalFeatures,
    ['local-floor', 'dom-overlay', 'image-tracking'],
    'deduplicates optional features and removes required features'
  );
  testCase.equal(sessionInit.depthSensing, depthSensing, 'preserves depth sensing init');
  testCase.deepEqual(sessionInit.domOverlay, {root: domOverlayRoot}, 'preserves DOM overlay init');
  testCase.equal(sessionInit.trackedImages, trackedImages, 'preserves tracked image init');
  testCase.deepEqual(getWebXRSessionFeatures(sessionInit), {
    requiredFeatures: ['webgpu', 'depth-sensing'],
    optionalFeatures: ['local-floor', 'dom-overlay', 'image-tracking'],
    requestedFeatures: ['webgpu', 'depth-sensing', 'local-floor', 'dom-overlay', 'image-tracking']
  });
  testCase.end();
});

test('webxr#WebXRSessionInit helpers handle support checks and enabled features', async testCase => {
  const xr = makeMockXRSystem({
    'immersive-vr': true,
    'immersive-ar': false,
    inline: 'reject'
  });
  const session = {enabledFeatures: ['local-floor', 'hand-tracking']} as XRSession;

  const support = await getWebXRSessionSupport({xr});

  testCase.deepEqual(
    WEBXR_DEFAULT_SESSION_SUPPORT_MODES,
    ['immersive-vr', 'immersive-ar', 'inline'],
    'keeps default support probe order'
  );
  testCase.equal(support.xr, xr, 'keeps XR system identity');
  testCase.equal(support.isSupported, true, 'reports support when at least one mode works');
  testCase.deepEqual(
    support.modes,
    {'immersive-vr': true, 'immersive-ar': false, inline: false},
    'maps rejected probes to unsupported'
  );
  testCase.deepEqual(support.supportedModes, ['immersive-vr'], 'filters supported modes');
  testCase.equal(
    isWebXRSessionFeatureEnabled(session, 'hand-tracking'),
    true,
    'detects enabled features'
  );
  testCase.equal(
    isWebXRSessionFeatureEnabled(session, 'depth-sensing'),
    false,
    'rejects missing enabled features'
  );

  const missingSupport = await getWebXRSessionSupport({xr: null, modes: ['immersive-ar']});
  testCase.deepEqual(
    missingSupport,
    {xr: null, isSupported: false, modes: {}, supportedModes: []},
    'missing XR system reports unsupported'
  );
  testCase.end();
});

function makeMockXRSystem(support: Partial<Record<XRSessionMode, boolean | 'reject'>>): XRSystem {
  return Object.assign(new EventTarget(), {
    async isSessionSupported(mode: XRSessionMode): Promise<boolean> {
      if (support[mode] === 'reject') {
        throw new Error('unsupported');
      }
      return Boolean(support[mode]);
    },
    async requestSession(): Promise<XRSession> {
      throw new Error('not implemented');
    }
  }) as XRSystem;
}
