// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GL} from '@luma.gl/core/webgl-constants';
import {withGLParameters} from '@luma.gl/core/webgl';
import {WebGLStateTracker} from '@luma.gl/core/webgl/context/state-tracker/webgl-state-tracker';

function createTrackedContext() {
  const values = new Map<number, unknown>();
  const gl = {
    getParameter: (parameter: number) => values.get(parameter),
    isEnabled: () => false,
    useProgram() {},
    pixelStorei: (parameter: number, value: unknown) => values.set(parameter, value),
    bindRenderbuffer: (_target: number, value: unknown) =>
      values.set(GL.RENDERBUFFER_BINDING, value),
    blendFuncSeparate(
      sourceRgb: number,
      destinationRgb: number,
      sourceAlpha: number,
      destinationAlpha: number
    ) {
      values.set(GL.BLEND_SRC_RGB, sourceRgb);
      values.set(GL.BLEND_DST_RGB, destinationRgb);
      values.set(GL.BLEND_SRC_ALPHA, sourceAlpha);
      values.set(GL.BLEND_DST_ALPHA, destinationAlpha);
    }
  } as unknown as WebGL2RenderingContext;
  const tracker = new WebGLStateTracker(gl);
  tracker.trackState(gl);
  return {gl, tracker, values};
}

it('reused frames release saved resources and capture new values on subsequent scopes', () => {
  const {gl, tracker, values} = createTrackedContext();
  const resource = {} as WebGLRenderbuffer;
  gl.bindRenderbuffer(GL.RENDERBUFFER, resource);
  tracker.push();
  const frame = tracker.stateStack[0];
  gl.bindRenderbuffer(GL.RENDERBUFFER, null);
  tracker.pop();
  expect(values.get(GL.RENDERBUFFER_BINDING)).toBe(resource);
  expect(Object.keys(frame)).toEqual([]);
  gl.bindRenderbuffer(GL.RENDERBUFFER, null);
  gl.pixelStorei(GL.UNPACK_ALIGNMENT, 2);
  tracker.push();
  expect(tracker.stateStack[0]).toBe(frame);
  gl.pixelStorei(GL.UNPACK_ALIGNMENT, 1);
  tracker.pop();
  expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(2);
  expect(values.get(GL.RENDERBUFFER_BINDING)).toBeNull();
});

it('nested and exceptional scopes keep distinct reusable frames', () => {
  const {gl, tracker, values} = createTrackedContext();
  const failure = new Error('upload failed');
  let outerFrame: object;
  let innerFrame: object;
  for (let iteration = 0; iteration < 3; iteration++) {
    withGLParameters(gl, {[GL.UNPACK_ALIGNMENT]: 1}, () => {
      outerFrame = tracker.stateStack[0];
      expect(() =>
        withGLParameters(gl, {[GL.UNPACK_ALIGNMENT]: 2}, () => {
          innerFrame = tracker.stateStack[1];
          expect(innerFrame).not.toBe(outerFrame);
          gl.pixelStorei(GL.UNPACK_ALIGNMENT, 8);
          throw failure;
        })
      ).toThrow(failure);
      expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(1);
      expect(Object.keys(innerFrame!)).toEqual([]);
    });
    expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(4);
    expect(Object.keys(outerFrame!)).toEqual([]);
    expect(tracker.stateStack).toHaveLength(0);
  }
});

it('mixed scalar and composite scopes preserve unspecified composite values', () => {
  const {gl, values} = createTrackedContext();
  withGLParameters(gl, {[GL.UNPACK_ALIGNMENT]: 1, [GL.BLEND_SRC_RGB]: GL.SRC_ALPHA}, () => {
    expect(values.get(GL.BLEND_SRC_RGB)).toBe(GL.SRC_ALPHA);
    expect(values.get(GL.BLEND_DST_RGB)).toBe(GL.ZERO);
    expect(values.get(GL.BLEND_SRC_ALPHA)).toBe(GL.ONE);
    expect(values.get(GL.BLEND_DST_ALPHA)).toBe(GL.ZERO);
  });
  expect(values.get(GL.BLEND_SRC_RGB)).toBe(GL.ONE);
  expect(values.get(GL.UNPACK_ALIGNMENT)).toBe(4);
});
