// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {OrbitViewport, type LayerContext} from '@deck.gl/core';
import {Camera, Matrix4, Vector4, WebGPUCoordinateSystem} from 'three/webgpu';
import {ThreeMeshLayer, synchronizeThreeCamera} from '../src/deck';

for (const orthographic of [false, true]) {
  test(`deck camera preserves scaled view, target and clip depth (${orthographic ? 'orthographic' : 'perspective'})`, () => {
    const viewport = new OrbitViewport({
      width: 256,
      height: 128,
      target: [2, 3, -1],
      zoom: 4.2,
      rotationOrbit: 32,
      rotationX: -23,
      fovy: 65,
      orbitAxis: 'Y',
      orthographic
    });
    const camera = new Camera();
    synchronizeThreeCamera(camera, viewport);
    camera.updateWorldMatrix(true, false);
    const transform = new Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    transform.elements.forEach((value, index) =>
      expect(value).toBeCloseTo(viewport.viewProjectionMatrix[index], 12)
    );
    camera.position
      .toArray()
      .forEach((value, index) => expect(value).toBeCloseTo(viewport.cameraPosition[index], 12));
    expect(camera.matrixAutoUpdate).toBe(false);
    expect(camera.matrixWorldAutoUpdate).toBe(false);
    const expected = new Vector4(2.5, 2.8, 0.5, 1).applyMatrix4(transform);
    synchronizeThreeCamera(camera, viewport, WebGPUCoordinateSystem);
    camera.updateWorldMatrix(true, false);
    const actual = new Vector4(2.5, 2.8, 0.5, 1)
      .applyMatrix4(camera.matrixWorldInverse)
      .applyMatrix4(camera.projectionMatrix);
    expect(actual.x).toBeCloseTo(expected.x, 12);
    expect(actual.y).toBeCloseTo(expected.y, 12);
    expect(actual.z).toBeCloseTo((expected.z + expected.w) / 2, 12);
    expect(actual.w).toBeCloseTo(expected.w, 12);
  });
}

test('deck adapter reports unsupported viewport, device and picking requests', () => {
  const viewport = new OrbitViewport({width: 128, height: 128});
  expect(() => synchronizeThreeCamera(new Camera(), {...viewport, isGeospatial: true})).toThrow(
    'Cartesian'
  );
  const layer = new ThreeMeshLayer({id: 'unsupported', meshes: [], pickable: true});
  layer.context = {device: {type: 'webgpu'}} as LayerContext;
  expect(() => layer.updateState()).toThrow('non-pickable');
  layer.context = {device: {type: 'webgl'}} as LayerContext;
  expect(() => layer.updateState()).toThrow('WebGPU');
});
