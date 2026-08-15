// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WebXRMediaLayerManager} from '../../src/webxr/webxr-media-layers';

test('webxr#WebXRMediaLayerManager creates media layers and exposes state', testCase => {
  const originalXRMediaBinding = globalThis.XRMediaBinding;
  const session = makeMockXRSession();
  const referenceSpace = {} as XRReferenceSpace;
  const video = makeMockVideo();

  globalThis.XRMediaBinding = makeMockXRMediaBindingClass();

  try {
    const manager = new WebXRMediaLayerManager();
    manager.setSession(session);

    const quadLayer = manager.createQuadLayer(video, {
      space: referenceSpace,
      layout: 'stereo-left-right',
      invertStereo: true,
      width: 1.5,
      height: 0.75
    });
    const cylinderLayer = manager.createCylinderLayer(video, {
      space: referenceSpace,
      radius: 2,
      centralAngle: Math.PI / 3,
      aspectRatio: 2
    });
    const equirectLayer = manager.createEquirectLayer(video, {
      space: referenceSpace,
      radius: 0,
      centralHorizontalAngle: Math.PI * 2
    });

    void manager.updateRenderState([quadLayer, cylinderLayer, equirectLayer]);

    const quadState = manager.getLayerState(quadLayer);
    const cylinderState = manager.getLayerState(cylinderLayer);
    const equirectState = manager.getLayerState(equirectLayer);

    testCase.equal(session.updatedLayers[0], quadLayer, 'updates render state with quad layer');
    testCase.equal(
      session.updatedLayers[1],
      cylinderLayer,
      'updates render state with cylinder layer'
    );
    testCase.equal(
      session.updatedLayers[2],
      equirectLayer,
      'updates render state with equirect layer'
    );
    testCase.equal(quadState?.session, session, 'retains source session');
    testCase.equal(quadState?.layer, quadLayer, 'retains source layer');
    testCase.equal(quadState?.video, video, 'retains source video');
    testCase.equal(quadState?.type, 'quad', 'reports quad layer type');
    testCase.equal(cylinderState?.type, 'cylinder', 'reports cylinder layer type');
    testCase.equal(equirectState?.type, 'equirect', 'reports equirect layer type');
    testCase.equal(quadState?.layout, 'stereo-left-right', 'exposes stereo layout');
    testCase.equal(quadState?.invertStereo, true, 'exposes inverted stereo metadata');
    testCase.equal(cylinderState?.invertStereo, false, 'defaults invertStereo to false');

    quadLayer.dispatchEvent(new Event('redraw'));
    testCase.equal(manager.getLayerState(quadLayer)?.needsRedraw, true, 'tracks redraw events');
    testCase.equal(manager.getLayerState(quadLayer)?.needsRedraw, false, 'consumes redraw events');

    session.dispatchEvent(new Event('end'));
    testCase.equal(manager.session, null, 'session end clears session');
    testCase.equal(manager.getLayerState(quadLayer), null, 'inactive manager returns null');
  } finally {
    globalThis.XRMediaBinding = originalXRMediaBinding;
  }

  testCase.end();
});

test('webxr#WebXRMediaLayerManager handles unsupported and untracked layers', testCase => {
  const originalXRMediaBinding = globalThis.XRMediaBinding;
  const session = makeMockXRSession();
  const layer = makeMockCompositionLayer('mono');
  const manager = new WebXRMediaLayerManager();

  try {
    globalThis.XRMediaBinding = undefined!;
    testCase.throws(
      () => manager.setSession(session),
      /XRMediaBinding/,
      'throws when XRMediaBinding is unavailable'
    );

    globalThis.XRMediaBinding = makeMockXRMediaBindingClass();
    manager.setSession(session);
    testCase.throws(
      () => manager.getLayerState(layer),
      /not tracked/,
      'rejects untracked composition layers'
    );

    manager.clearSession();
    manager.clearSession();
    testCase.equal(manager.session, null, 'clearSession is idempotent');
  } finally {
    globalThis.XRMediaBinding = originalXRMediaBinding;
  }

  testCase.end();
});

function makeMockVideo(): HTMLVideoElement {
  return {
    videoWidth: 3840,
    videoHeight: 1920
  } as HTMLVideoElement;
}

function makeMockXRSession(): XRSession & {updatedLayers: XRLayer[]} {
  return Object.assign(new EventTarget(), {
    inputSources: [],
    updatedLayers: [] as XRLayer[],
    async updateRenderState(renderStateInit: XRRenderStateInit = {}) {
      this.updatedLayers = [...(renderStateInit.layers || [])];
    }
  }) as XRSession & {updatedLayers: XRLayer[]};
}

function makeMockXRMediaBindingClass(): typeof XRMediaBinding {
  return class MockXRMediaBinding {
    constructor(public session: XRSession) {}

    createQuadLayer(video: HTMLVideoElement, init: XRMediaQuadLayerInit): XRQuadLayer {
      return Object.assign(makeMockCompositionLayer(init.layout || 'mono'), {
        video,
        space: init.space,
        width: init.width,
        height: init.height,
        transform: init.transform
      }) as XRQuadLayer;
    }

    createCylinderLayer(video: HTMLVideoElement, init: XRMediaCylinderLayerInit): XRCylinderLayer {
      return Object.assign(makeMockCompositionLayer(init.layout || 'mono'), {
        video,
        space: init.space,
        radius: init.radius,
        centralAngle: init.centralAngle,
        aspectRatio: init.aspectRatio,
        transform: init.transform
      }) as XRCylinderLayer;
    }

    createEquirectLayer(video: HTMLVideoElement, init: XRMediaEquirectLayerInit): XREquirectLayer {
      return Object.assign(makeMockCompositionLayer(init.layout || 'mono'), {
        video,
        space: init.space,
        radius: init.radius,
        centralHorizontalAngle: init.centralHorizontalAngle,
        upperVerticalAngle: init.upperVerticalAngle,
        lowerVerticalAngle: init.lowerVerticalAngle,
        transform: init.transform
      }) as XREquirectLayer;
    }
  } as unknown as typeof XRMediaBinding;
}

function makeMockCompositionLayer(layout: XRLayerLayout): XRCompositionLayer {
  return Object.assign(new EventTarget(), {
    layout,
    blendTextureSourceAlpha: true,
    forceMonoPresentation: false,
    opacity: 1,
    mipLevels: 1,
    quality: 'default' as XRLayerQuality,
    needsRedraw: false,
    destroy() {}
  }) as XRCompositionLayer;
}
