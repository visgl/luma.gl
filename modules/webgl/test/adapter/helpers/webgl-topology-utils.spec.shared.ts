// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/constants';
import {
  getGLDrawMode,
  getGLPrimitive,
  getPrimitiveCount,
  getPrimitiveDrawMode,
  getVertexCount
} from '@luma.gl/webgl/adapter/helpers/webgl-topology-utils';
import type {TapeTestFunction} from 'test/utils/vitest-tape';

export function registerWebGLTopologyUtilsTests(test: TapeTestFunction): void {
  test('getPrimitiveDrawMode', t => {
    t.equals(getPrimitiveDrawMode(GL.POINTS), GL.POINTS, 'point-list');
    t.equals(getPrimitiveDrawMode(GL.LINES), GL.LINES, 'line-list');
    t.equals(getPrimitiveDrawMode(GL.LINE_STRIP), GL.LINES, 'line-strip');
    t.equals(getPrimitiveDrawMode(GL.LINE_LOOP), GL.LINES, 'line-loop');
    t.equals(getPrimitiveDrawMode(GL.TRIANGLES), GL.TRIANGLES, 'triangle-list');
    t.equals(getPrimitiveDrawMode(GL.TRIANGLE_STRIP), GL.TRIANGLES, 'triangle-strip');
    t.equals(getPrimitiveDrawMode(GL.TRIANGLE_FAN), GL.TRIANGLES, 'triangle-fan');
    t.throws(() => getPrimitiveDrawMode(-1 as any), 'invalid');
    t.end();
  });

  test('getPrimitiveCount', t => {
    t.equals(getPrimitiveCount({drawMode: GL.POINTS, vertexCount: 12}), 12, 'point-list');
    t.equals(getPrimitiveCount({drawMode: GL.LINE_LOOP, vertexCount: 12}), 12, 'line-loop');
    t.equals(getPrimitiveCount({drawMode: GL.LINES, vertexCount: 12}), 6, 'line-list');
    t.equals(getPrimitiveCount({drawMode: GL.LINE_STRIP, vertexCount: 12}), 11, 'line-strip');
    t.equals(getPrimitiveCount({drawMode: GL.TRIANGLES, vertexCount: 12}), 4, 'triangle-list');
    t.equals(
      getPrimitiveCount({drawMode: GL.TRIANGLE_STRIP, vertexCount: 12}),
      10,
      'triangle-strip'
    );
    t.equals(getPrimitiveCount({drawMode: GL.TRIANGLE_FAN, vertexCount: 12}), 10, 'triangle-fan');
    t.throws(() => getPrimitiveCount({drawMode: -1 as any, vertexCount: 12}), 'invalid');
    t.end();
  });

  test('getVertexCount', t => {
    t.equals(getVertexCount({drawMode: GL.POINTS, vertexCount: 12}), 12, 'point-list');
    t.equals(getVertexCount({drawMode: GL.LINE_STRIP, vertexCount: 12}), 22, 'line-strip');
    t.equals(getVertexCount({drawMode: GL.TRIANGLE_STRIP, vertexCount: 12}), 30, 'triangle-strip');
    t.equals(getVertexCount({drawMode: GL.TRIANGLE_FAN, vertexCount: 12}), 30, 'triangle-fan');
    t.throws(() => getVertexCount({drawMode: -1 as any, vertexCount: 12}), 'invalid');
    t.end();
  });

  test('getGLDrawMode', t => {
    t.equals(getGLDrawMode('point-list'), GL.POINTS, 'point-list');
    t.equals(getGLDrawMode('line-list'), GL.LINES, 'line-list');
    t.equals(getGLDrawMode('line-strip'), GL.LINE_STRIP, 'line-strip');
    t.equals(getGLDrawMode('triangle-list'), GL.TRIANGLES, 'triangle-list');
    t.equals(getGLDrawMode('triangle-strip'), GL.TRIANGLE_STRIP, 'triangle-strip');
    t.throws(() => getGLDrawMode('quad-list' as any), 'invalid');
    t.end();
  });

  test('getGLPrimitive', t => {
    t.equals(getGLPrimitive('point-list'), GL.POINTS, 'point-list');
    t.equals(getGLPrimitive('line-list'), GL.LINES, 'line-list');
    t.equals(getGLPrimitive('line-strip'), GL.LINES, 'line-strip');
    t.equals(getGLPrimitive('triangle-list'), GL.TRIANGLES, 'triangle-list');
    t.equals(getGLPrimitive('triangle-strip'), GL.TRIANGLES, 'triangle-strip');
    t.throws(() => getGLPrimitive('quad-list' as any), 'invalid');
    t.end();
  });
}
