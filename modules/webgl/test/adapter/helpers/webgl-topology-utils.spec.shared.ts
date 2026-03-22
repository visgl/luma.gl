import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { GL } from '@luma.gl/constants';
import { getGLDrawMode, getGLPrimitive, getPrimitiveCount, getPrimitiveDrawMode, getVertexCount } from '@luma.gl/webgl/adapter/helpers/webgl-topology-utils';
export function registerWebGLTopologyUtilsTests(): void {
  test('getPrimitiveDrawMode', () => {
    expect(getPrimitiveDrawMode(GL.POINTS), 'point-list').toBe(GL.POINTS);
    expect(getPrimitiveDrawMode(GL.LINES), 'line-list').toBe(GL.LINES);
    expect(getPrimitiveDrawMode(GL.LINE_STRIP), 'line-strip').toBe(GL.LINES);
    expect(getPrimitiveDrawMode(GL.LINE_LOOP), 'line-loop').toBe(GL.LINES);
    expect(getPrimitiveDrawMode(GL.TRIANGLES), 'triangle-list').toBe(GL.TRIANGLES);
    expect(getPrimitiveDrawMode(GL.TRIANGLE_STRIP), 'triangle-strip').toBe(GL.TRIANGLES);
    expect(getPrimitiveDrawMode(GL.TRIANGLE_FAN), 'triangle-fan').toBe(GL.TRIANGLES);
    expect(() => getPrimitiveDrawMode(-1 as any), 'invalid').toThrow();
  });
  test('getPrimitiveCount', () => {
    expect(getPrimitiveCount({
      drawMode: GL.POINTS,
      vertexCount: 12
    }), 'point-list').toBe(12);
    expect(getPrimitiveCount({
      drawMode: GL.LINE_LOOP,
      vertexCount: 12
    }), 'line-loop').toBe(12);
    expect(getPrimitiveCount({
      drawMode: GL.LINES,
      vertexCount: 12
    }), 'line-list').toBe(6);
    expect(getPrimitiveCount({
      drawMode: GL.LINE_STRIP,
      vertexCount: 12
    }), 'line-strip').toBe(11);
    expect(getPrimitiveCount({
      drawMode: GL.TRIANGLES,
      vertexCount: 12
    }), 'triangle-list').toBe(4);
    expect(getPrimitiveCount({
      drawMode: GL.TRIANGLE_STRIP,
      vertexCount: 12
    }), 'triangle-strip').toBe(10);
    expect(getPrimitiveCount({
      drawMode: GL.TRIANGLE_FAN,
      vertexCount: 12
    }), 'triangle-fan').toBe(10);
    expect(() => getPrimitiveCount({
      drawMode: -1 as any,
      vertexCount: 12
    }), 'invalid').toThrow();
  });
  test('getVertexCount', () => {
    expect(getVertexCount({
      drawMode: GL.POINTS,
      vertexCount: 12
    }), 'point-list').toBe(12);
    expect(getVertexCount({
      drawMode: GL.LINE_STRIP,
      vertexCount: 12
    }), 'line-strip').toBe(22);
    expect(getVertexCount({
      drawMode: GL.TRIANGLE_STRIP,
      vertexCount: 12
    }), 'triangle-strip').toBe(30);
    expect(getVertexCount({
      drawMode: GL.TRIANGLE_FAN,
      vertexCount: 12
    }), 'triangle-fan').toBe(30);
    expect(() => getVertexCount({
      drawMode: -1 as any,
      vertexCount: 12
    }), 'invalid').toThrow();
  });
  test('getGLDrawMode', () => {
    expect(getGLDrawMode('point-list'), 'point-list').toBe(GL.POINTS);
    expect(getGLDrawMode('line-list'), 'line-list').toBe(GL.LINES);
    expect(getGLDrawMode('line-strip'), 'line-strip').toBe(GL.LINE_STRIP);
    expect(getGLDrawMode('triangle-list'), 'triangle-list').toBe(GL.TRIANGLES);
    expect(getGLDrawMode('triangle-strip'), 'triangle-strip').toBe(GL.TRIANGLE_STRIP);
    expect(() => getGLDrawMode('quad-list' as any), 'invalid').toThrow();
  });
  test('getGLPrimitive', () => {
    expect(getGLPrimitive('point-list'), 'point-list').toBe(GL.POINTS);
    expect(getGLPrimitive('line-list'), 'line-list').toBe(GL.LINES);
    expect(getGLPrimitive('line-strip'), 'line-strip').toBe(GL.LINES);
    expect(getGLPrimitive('triangle-list'), 'triangle-list').toBe(GL.TRIANGLES);
    expect(getGLPrimitive('triangle-strip'), 'triangle-strip').toBe(GL.TRIANGLES);
    expect(() => getGLPrimitive('quad-list' as any), 'invalid').toThrow();
  });
}
