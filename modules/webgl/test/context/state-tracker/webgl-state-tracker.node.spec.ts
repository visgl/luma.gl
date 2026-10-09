// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {GL} from '@luma.gl/webgl/constants';
import {WebGLStateTracker} from '@luma.gl/webgl/context/state-tracker/webgl-state-tracker';

it('initializes size-dependent state before hooking getters and restores native state', () => {
  const nativeState = new Map([
    [GL.VIEWPORT, new Int32Array([0, 0, 300, 150])],
    [GL.SCISSOR_BOX, new Int32Array([10, 20, 200, 100])]
  ]);
  const getParameter = vi.fn((parameter: number) => nativeState.get(parameter));
  const viewport = vi.fn((...values: number[]) => {
    nativeState.set(GL.VIEWPORT, new Int32Array(values));
  });
  const scissor = vi.fn((...values: number[]) => {
    nativeState.set(GL.SCISSOR_BOX, new Int32Array(values));
  });
  const context = {getParameter, viewport, scissor, isEnabled() {}, useProgram() {}};
  const gl = context as unknown as WebGL2RenderingContext;
  const tracker = new WebGLStateTracker(gl);
  tracker.trackState(gl, {copyState: false});

  expect(getParameter.mock.calls).toEqual([[GL.VIEWPORT], [GL.SCISSOR_BOX]]);
  expect(gl.getParameter(GL.VIEWPORT)).toEqual(new Int32Array([0, 0, 300, 150]));
  expect(gl.getParameter(GL.SCISSOR_BOX)).toEqual(new Int32Array([10, 20, 200, 100]));

  tracker.push();
  gl.viewport(0, 0, 1024, 1024);
  gl.scissor(0, 0, 1024, 1024);
  expect(viewport).toHaveBeenCalledTimes(1);
  expect(scissor).toHaveBeenCalledTimes(1);
  expect(nativeState.get(GL.VIEWPORT)).toEqual(new Int32Array([0, 0, 1024, 1024]));
  expect(nativeState.get(GL.SCISSOR_BOX)).toEqual(new Int32Array([0, 0, 1024, 1024]));

  gl.viewport(0, 0, 1024, 1024);
  gl.scissor(0, 0, 1024, 1024);
  expect(viewport).toHaveBeenCalledTimes(1);
  expect(scissor).toHaveBeenCalledTimes(1);

  tracker.pop();
  expect(nativeState.get(GL.VIEWPORT)).toEqual(new Int32Array([0, 0, 300, 150]));
  expect(nativeState.get(GL.SCISSOR_BOX)).toEqual(new Int32Array([10, 20, 200, 100]));
  expect(Array.from(gl.getParameter(GL.VIEWPORT))).toEqual([0, 0, 300, 150]);
  expect(Array.from(gl.getParameter(GL.SCISSOR_BOX))).toEqual([10, 20, 200, 100]);
});
