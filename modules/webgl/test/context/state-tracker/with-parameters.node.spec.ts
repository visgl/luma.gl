// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GL} from '@luma.gl/webgl/constants';
import {withGLParameters} from '@luma.gl/webgl';
import {WebGLStateTracker} from '@luma.gl/webgl/context/state-tracker/webgl-state-tracker';

function createTrackedContext(failSetup = false) {
  const values = new Map<number, unknown>();
  const setupError = new Error('Pixel-store setup failed');
  let shouldFail = failSetup;
  const gl = {
    getParameter(parameter: number) {
      return values.get(parameter);
    },
    isEnabled() {
      return false;
    },
    useProgram() {},
    pixelStorei(parameter: number, value: unknown) {
      if (shouldFail && parameter === GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL) {
        shouldFail = false;
        throw setupError;
      }
      values.set(parameter, value);
    }
  } as unknown as WebGL2RenderingContext;
  const tracker = new WebGLStateTracker(gl);
  tracker.trackState(gl);
  return {gl, tracker, setupError};
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
