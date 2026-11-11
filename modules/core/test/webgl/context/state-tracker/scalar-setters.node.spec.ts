// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {GL} from '@luma.gl/core/webgl-constants';
import {withGLParameters} from '@luma.gl/core/webgl';
import {WebGLStateTracker} from '@luma.gl/core/webgl/context/state-tracker/webgl-state-tracker';

const cases = [
  {
    method: 'pixelStorei',
    parameter: GL.UNPACK_ALIGNMENT,
    initial: 4,
    value: 1,
    nested: 2,
    dynamic: true
  },
  {
    method: 'hint',
    parameter: GL.GENERATE_MIPMAP_HINT,
    initial: GL.DONT_CARE,
    value: GL.NICEST,
    nested: GL.FASTEST,
    dynamic: true
  },
  {method: 'clearDepth', parameter: GL.DEPTH_CLEAR_VALUE, initial: 1, value: 0.5, nested: 0.25},
  {method: 'clearStencil', parameter: GL.STENCIL_CLEAR_VALUE, initial: 0, value: 1, nested: 2},
  {
    method: 'cullFace',
    parameter: GL.CULL_FACE_MODE,
    initial: GL.BACK,
    value: GL.FRONT,
    nested: GL.FRONT_AND_BACK
  },
  {
    method: 'depthFunc',
    parameter: GL.DEPTH_FUNC,
    initial: GL.LESS,
    value: GL.LEQUAL,
    nested: GL.ALWAYS
  },
  {method: 'depthMask', parameter: GL.DEPTH_WRITEMASK, initial: true, value: false, nested: true},
  {method: 'frontFace', parameter: GL.FRONT_FACE, initial: GL.CCW, value: GL.CW, nested: GL.CCW},
  {method: 'lineWidth', parameter: GL.LINE_WIDTH, initial: 1, value: 2, nested: 3},
  {method: 'enable', parameter: GL.BLEND, initial: false, value: true, nested: false},
  {method: 'disable', parameter: GL.DITHER, initial: true, value: false, nested: true}
];

for (const caching of [true, false]) {
  it.each(cases)('$method preserves scalar state with caching=' + caching, setting => {
    const values = new Map<number, unknown>([[setting.parameter, setting.initial]]);
    const calls = vi.fn();
    const context: Record<string, any> = {
      getParameter: (parameter: number) => values.get(parameter),
      isEnabled: (parameter: number) => values.get(parameter),
      useProgram() {}
    };
    const capability = setting.method === 'enable' || setting.method === 'disable';
    if (capability) {
      context.enable = (parameter: number) => {
        calls(parameter, true);
        values.set(parameter, true);
      };
      context.disable = (parameter: number) => {
        calls(parameter, false);
        values.set(parameter, false);
      };
    } else {
      context[setting.method] = (first: number | boolean, second: unknown) => {
        const value = setting.dynamic ? second : first;
        calls(value);
        values.set(setting.parameter, value);
      };
    }
    const gl = context as unknown as WebGL2RenderingContext;
    const tracker = new WebGLStateTracker(gl);
    tracker.trackState(gl);
    tracker.enable = caching;
    const set = (value: number | boolean) =>
      capability
        ? context[value ? 'enable' : 'disable'](setting.parameter)
        : setting.dynamic
          ? context[setting.method](setting.parameter, value)
          : context[setting.method](value);

    expect(set(setting.value)).toBe(setting.initial);
    expect(set(setting.value)).toBeUndefined();
    expect(calls).toHaveBeenCalledTimes(1);
    expect(gl.getParameter(setting.parameter)).toBe(setting.value);
    const error = new Error('scope failed');
    expect(() =>
      withGLParameters(gl, {[setting.parameter]: setting.nested}, () => {
        expect(values.get(setting.parameter)).toBe(setting.nested);
        withGLParameters(gl, {[setting.parameter]: setting.value}, () => {
          expect(values.get(setting.parameter)).toBe(setting.value);
        });
        expect(values.get(setting.parameter)).toBe(setting.nested);
        throw error;
      })
    ).toThrow(error);
    expect(values.get(setting.parameter)).toBe(setting.value);
    expect(tracker.cache[setting.parameter]).toBe(setting.value);
    expect(tracker.stateStack).toHaveLength(0);
  });
}
