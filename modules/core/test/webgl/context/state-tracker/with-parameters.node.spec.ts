// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GL} from '@luma.gl/core/webgl-constants';
import {withGLParameters} from '@luma.gl/core/webgl';
import {WebGLStateTracker} from '@luma.gl/core/webgl/context/state-tracker/webgl-state-tracker';

function createTrackedContext(failSetup = false) {
  const values = new Map<number, unknown>();
  const pixelStoreCalls: [number, unknown][] = [];
  const setupError = new Error('Pixel-store setup failed');
  let shouldFail = failSetup;
  const gl = {
    getParameter(parameter: number) {
      return values.get(parameter);
    },
    isEnabled() {
      return false;
    },
    deleteFramebuffer() {},
    deleteRenderbuffer() {},
    deleteVertexArray() {},
    useProgram() {},
    pixelStorei(parameter: number, value: unknown) {
      if (shouldFail && parameter === GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL) {
        shouldFail = false;
        throw setupError;
      }
      pixelStoreCalls.push([parameter, value]);
      values.set(parameter, value);
    }
  } as unknown as WebGL2RenderingContext;
  const tracker = new WebGLStateTracker(gl);
  tracker.trackState(gl);
  return {gl, tracker, setupError, values, pixelStoreCalls};
}

it.each([
  undefined,
  false,
  true
])('withGLParameters returns and restores with nocatch=%s', nocatch => {
  const {gl, tracker} = createTrackedContext();
  const result = {};
  expect(
    withGLParameters(
      gl,
      {[GL.UNPACK_FLIP_Y_WEBGL]: true, nocatch},
      (context: WebGL2RenderingContext) => {
        expect(context).toBe(gl);
        expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(true);
        return result;
      }
    )
  ).toBe(result);
  expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(false);
  expect(tracker.stateStack).toHaveLength(0);
});

it.each([
  undefined,
  false
])('withGLParameters restores after exceptions with nocatch=%s', nocatch => {
  const {gl, tracker} = createTrackedContext();
  const uploadError = new Error('Upload failed');
  expect(() =>
    withGLParameters(gl, {[GL.UNPACK_FLIP_Y_WEBGL]: true, nocatch}, () => {
      throw uploadError;
    })
  ).toThrow(uploadError);
  expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(false);
  expect(tracker.stateStack).toHaveLength(0);
});

it('withGLParameters restores partially applied parameters when setup throws', () => {
  const {gl, tracker, setupError} = createTrackedContext(true);
  let callbackCalled = false;
  expect(() =>
    withGLParameters(
      gl,
      {[GL.UNPACK_FLIP_Y_WEBGL]: true, [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: true},
      () => {
        callbackCalled = true;
      }
    )
  ).toThrow(setupError);
  expect(callbackCalled).toBe(false);
  expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(false);
  expect(gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(false);
  expect(tracker.stateStack).toHaveLength(0);
});

it('withGLParameters preserves the outer scope after a nested exception', () => {
  const {gl, tracker} = createTrackedContext();
  const uploadError = new Error('Nested upload failed');
  withGLParameters(gl, {[GL.UNPACK_FLIP_Y_WEBGL]: true}, () => {
    expect(() =>
      withGLParameters(gl, {[GL.UNPACK_FLIP_Y_WEBGL]: false}, () => {
        throw uploadError;
      })
    ).toThrow(uploadError);
    expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(true);
    expect(tracker.stateStack).toHaveLength(1);
  });
  expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(false);
  expect(tracker.stateStack).toHaveLength(0);
});

it('withGLParameters passes through empty parameters without a tracker', () => {
  const gl = {} as WebGL2RenderingContext;
  const callbackError = new Error('Callback failed');
  expect(withGLParameters(gl, {}, (context: WebGL2RenderingContext) => context)).toBe(gl);
  expect(() =>
    withGLParameters(gl, {}, () => {
      throw callbackError;
    })
  ).toThrow(callbackError);
});

it.each([true, false])('pixelStorei preserves scalar tracking with enable=%s', enable => {
  const {gl, tracker, values, pixelStoreCalls} = createTrackedContext();
  tracker.enable = enable;
  expect(gl.pixelStorei(GL.UNPACK_ALIGNMENT, 1)).toBe(4);
  expect(gl.pixelStorei(GL.UNPACK_ALIGNMENT, 1)).toBeUndefined();
  expect(gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true)).toBe(false);
  expect(gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true)).toBeUndefined();
  expect(pixelStoreCalls).toEqual([
    [GL.UNPACK_ALIGNMENT, 1],
    [GL.UNPACK_FLIP_Y_WEBGL, true]
  ]);
  withGLParameters(gl, {[GL.UNPACK_ALIGNMENT]: 2}, () => {
    gl.pixelStorei(GL.UNPACK_ALIGNMENT, 8);
    withGLParameters(gl, {[GL.UNPACK_ALIGNMENT]: 4}, () => {
      expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(4);
    });
    expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(8);
  });
  expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(1);
  expect(tracker.cache[GL.UNPACK_ALIGNMENT]).toBe(1);
  expect(tracker.stateStack).toHaveLength(0);
});
