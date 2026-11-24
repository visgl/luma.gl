// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {GL} from '@luma.gl/core/webgl-constants';
import {WebGLStateTracker} from '@luma.gl/core/webgl/context/state-tracker/webgl-state-tracker';
import {
  getGLParameters,
  setGLParameters
} from '@luma.gl/core/webgl/context/parameters/unified-parameter-api';
import {WebGLDeviceFeatures} from '@luma.gl/core/webgl/adapter/device-helpers/webgl-device-features';

/** Creates a mock WebGL2 context. `clipControl` is null when EXT_clip_control is absent. */
function createMockContext(options: {withClipControl: boolean}) {
  const nativeState = new Map<number, unknown>([
    [GL.CLIP_ORIGIN_EXT, GL.LOWER_LEFT_EXT],
    [GL.CLIP_DEPTH_MODE_EXT, GL.NEGATIVE_ONE_TO_ONE_EXT]
  ]);
  const clipControlEXT = vi.fn((origin: number, depthMode: number) => {
    nativeState.set(GL.CLIP_ORIGIN_EXT, origin);
    nativeState.set(GL.CLIP_DEPTH_MODE_EXT, depthMode);
  });
  const clipControl = options.withClipControl ? {clipControlEXT} : null;
  const getExtension = vi.fn((name: string) => (name === 'EXT_clip_control' ? clipControl : null));
  const context = {
    getExtension,
    // Without the extension, WebGL rejects its enums (INVALID_ENUM) and returns null.
    getParameter: (parameter: number) =>
      options.withClipControl ? (nativeState.get(parameter) ?? null) : null,
    viewport() {},
    scissor() {},
    isEnabled() {},
    deleteFramebuffer() {},
    deleteRenderbuffer() {},
    deleteVertexArray() {},
    useProgram() {}
  };
  return {
    gl: context as unknown as WebGL2RenderingContext,
    nativeState,
    clipControlEXT,
    getExtension
  };
}

it('clip-control-webgl feature reports EXT_clip_control', () => {
  const present = createMockContext({withClipControl: true});
  const presentFeatures = new WebGLDeviceFeatures(present.gl, {}, {});
  expect(presentFeatures.has('clip-control-webgl'), 'feature present').toBe(true);
  expect(present.getExtension, 'feature check enables the extension').toHaveBeenCalledWith(
    'EXT_clip_control'
  );

  const absent = createMockContext({withClipControl: false});
  const absentFeatures = new WebGLDeviceFeatures(absent.gl, {}, {});
  expect(absentFeatures.has('clip-control-webgl'), 'feature absent').toBe(false);

  const disabledFeatures = new WebGLDeviceFeatures(present.gl, {}, {'clip-control-webgl': true});
  expect(disabledFeatures.has('clip-control-webgl'), 'feature disabled by props').toBe(false);
});

it('setGLParameters calls clipControlEXT and pop restores the previous mode', () => {
  const {gl, nativeState, clipControlEXT} = createMockContext({withClipControl: true});
  const tracker = new WebGLStateTracker(gl);
  tracker.trackState(gl, {copyState: false});

  tracker.push();
  setGLParameters(gl, {
    [GL.CLIP_ORIGIN_EXT]: GL.LOWER_LEFT_EXT,
    [GL.CLIP_DEPTH_MODE_EXT]: GL.ZERO_TO_ONE_EXT
  });
  expect(clipControlEXT).toHaveBeenCalledTimes(1);
  expect(clipControlEXT).toHaveBeenLastCalledWith(GL.LOWER_LEFT_EXT, GL.ZERO_TO_ONE_EXT);
  expect(nativeState.get(GL.CLIP_DEPTH_MODE_EXT)).toBe(GL.ZERO_TO_ONE_EXT);
  expect(gl.getParameter(GL.CLIP_DEPTH_MODE_EXT), 'cache holds the new mode').toBe(
    GL.ZERO_TO_ONE_EXT
  );

  // The same values again do not reach the driver.
  setGLParameters(gl, {[GL.CLIP_DEPTH_MODE_EXT]: GL.ZERO_TO_ONE_EXT});
  expect(clipControlEXT).toHaveBeenCalledTimes(1);

  tracker.pop();
  expect(clipControlEXT).toHaveBeenCalledTimes(2);
  expect(clipControlEXT).toHaveBeenLastCalledWith(GL.LOWER_LEFT_EXT, GL.NEGATIVE_ONE_TO_ONE_EXT);
  expect(nativeState.get(GL.CLIP_DEPTH_MODE_EXT)).toBe(GL.NEGATIVE_ONE_TO_ONE_EXT);
  expect(gl.getParameter(GL.CLIP_DEPTH_MODE_EXT)).toBe(GL.NEGATIVE_ONE_TO_ONE_EXT);
});

it('clip control parameters are a no-op without EXT_clip_control', () => {
  const {gl} = createMockContext({withClipControl: false});
  const tracker = new WebGLStateTracker(gl);
  tracker.trackState(gl, {copyState: false});

  setGLParameters(gl, {[GL.CLIP_DEPTH_MODE_EXT]: GL.ZERO_TO_ONE_EXT});
  expect(gl.getParameter(GL.CLIP_DEPTH_MODE_EXT), 'cache keeps the WebGL default').toBe(
    GL.NEGATIVE_ONE_TO_ONE_EXT
  );

  tracker.enable = false;
  expect(
    getGLParameters(gl, [GL.CLIP_ORIGIN_EXT, GL.CLIP_DEPTH_MODE_EXT]),
    'a native read without the extension returns the defaults and does not query the enums'
  ).toEqual({
    [GL.CLIP_ORIGIN_EXT]: GL.LOWER_LEFT_EXT,
    [GL.CLIP_DEPTH_MODE_EXT]: GL.NEGATIVE_ONE_TO_ONE_EXT
  });
});
