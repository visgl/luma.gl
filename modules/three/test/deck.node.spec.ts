// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {OrbitViewport, WebMercatorViewport, _GlobeViewport, type LayerContext} from '@deck.gl/core';
import {
  Camera,
  Group,
  Scene,
  Matrix4,
  Vector4,
  Vector3,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  OrthographicCamera,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {
  ThreeMeshLayer,
  ThreeSceneLayer,
  synchronizeThreeCamera,
  pickThreeObject
} from '../src/deck';

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
    'coordinate origin'
  );
  const layer = new ThreeMeshLayer({id: 'unsupported', meshes: [], pickable: true});
  layer.context = {device: {type: 'webgpu'}} as LayerContext;
  expect(() => layer.updateState()).toThrow('non-pickable');
  layer.context = {device: {type: 'webgl'}} as LayerContext;
  expect(() => layer.updateState()).toThrow('WebGPU');
});

for (const latitude of [0, 37.7749, 70]) {
  test('geographic camera preserves local meter placement at latitude ' + latitude, () => {
    const origin: [number, number, number] = [-122.4194, latitude, 120];
    const viewport = new WebMercatorViewport({
      width: 256,
      height: 128,
      longitude: origin[0],
      latitude,
      zoom: 19,
      pitch: 55,
      bearing: 31
    });
    const camera = new Camera();
    synchronizeThreeCamera(camera, viewport, WebGPUCoordinateSystem, origin);
    camera.updateWorldMatrix(true, false);
    const originCommon = viewport.projectPosition(origin);
    const scale = viewport.getDistanceScales(origin).unitsPerMeter;
    const local = new Vector3(14, -11, 6);
    const common = local
      .clone()
      .multiply(new Vector3(...scale))
      .add(new Vector3(...originCommon));
    const expected = new Vector4(...common.toArray(), 1).applyMatrix4(
      new Matrix4().fromArray(viewport.viewProjectionMatrix)
    );
    const actual = new Vector4(...local.toArray(), 1)
      .applyMatrix4(camera.matrixWorldInverse)
      .applyMatrix4(camera.projectionMatrix);
    expect(actual.x / actual.w).toBeCloseTo(expected.x / expected.w, 8);
    expect(actual.y / actual.w).toBeCloseTo(expected.y / expected.w, 8);
    expect(actual.z / actual.w).toBeCloseTo((expected.z / expected.w + 1) / 2, 8);
    const unprojected = new Vector3(
      actual.x / actual.w,
      actual.y / actual.w,
      actual.z / actual.w
    ).unproject(camera);
    expect(unprojected.distanceTo(local)).toBeLessThan(0.00001);
  });
}

test('triangle picking respects nearest occluder, clipping and hidden model roots', () => {
  const camera = new OrthographicCamera(-2, 2, 2, -2, 1, 20);
  camera.position.z = 10;
  camera.updateMatrixWorld();
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial();
  const lantern = new Mesh(geometry, material);
  lantern.userData['geographicId'] = 'lantern';
  const building = new Mesh(geometry, material);
  building.position.z = 2;
  expect(pickThreeObject(camera, [0, 0], [lantern, building])?.object).toBe(building);
  building.visible = false;
  expect(pickThreeObject(camera, [0, 0], [lantern, building])?.object).toBe(lantern);
  lantern.visible = false;
  expect(pickThreeObject(camera, [0, 0], [lantern, building])).toBeUndefined();
  lantern.visible = true;
  lantern.position.z = -30;
  expect(pickThreeObject(camera, [0, 0], [lantern])).toBeUndefined();
  geometry.dispose();
  material.dispose();
});

test('geographic camera explicitly rejects globe projection', () => {
  expect(() =>
    synchronizeThreeCamera(
      new Camera(),
      new _GlobeViewport({width: 128, height: 128}),
      WebGPUCoordinateSystem,
      [0, 0, 0]
    )
  ).toThrow('Mercator');
});

test('local meter origin explicitly rejects Cartesian viewports', () => {
  expect(() =>
    synchronizeThreeCamera(
      new Camera(),
      new OrbitViewport({width: 128, height: 128}),
      WebGPUCoordinateSystem,
      [0, 0, 0]
    )
  ).toThrow('Mercator');
});

test('scene picking maps descendant hits to application IDs and safely disables roots', () => {
  const device = {type: 'webgpu'};
  const draw = vi.fn();
  const drawPicking = vi.fn<import('../src/objects').ThreeSceneAdapter['drawPicking']>();
  const adapter = {
    device,
    draw,
    drawPicking
  } as unknown as import('../src/objects').ThreeSceneAdapter;
  const first = new Group();
  const second = new Group();
  const child = new Group();
  first.add(child);
  const entries = [
    {id: 'first', object: first},
    {id: 'second', object: second}
  ];
  const layer = new ThreeSceneLayer({
    id: 'pick-scene',
    adapter,
    scene: new Scene(),
    camera: new Camera(),
    pickable: true,
    pickingObjects: entries
  });
  layer.context = {
    device,
    viewport: new OrbitViewport({width: 128, height: 128})
  } as unknown as LayerContext;
  layer.state = {pickingIndices: new Map(), disabledPickingIndices: new Set()};
  layer.initializeState();
  layer.updateState();
  const pass = {} as import('@luma.gl/core').RenderPass;
  layer.draw({renderPass: pass, shaderModuleProps: {picking: {isActive: true}}});
  const getColor = drawPicking.mock
    .calls[0][3] as import('../src/objects').ThreePickingColorAccessor;
  expect(getColor(child)).toEqual([1 / 255, 0, 0, 1]);
  expect(getColor(second)).toEqual([2 / 255, 0, 0, 1]);
  expect(getColor(new Group())).toEqual([0, 0, 0, 0]);
  layer.disablePickingIndex(0);
  expect(getColor(child)).toBeNull();
  layer.restorePickingColors();
  expect(getColor(child)).toEqual([1 / 255, 0, 0, 1]);
  const info = {color: null, layer, index: 1, picked: true, x: 0, y: 0, pixelRatio: 1};
  expect(layer.getPickingInfo({info, mode: 'query', sourceLayer: null}).object).toBe(entries[1]);
  layer.draw({renderPass: pass});
  expect(draw).toHaveBeenCalledWith(layer.props.scene, layer.props.camera, pass);
  expect(() =>
    layer.draw({
      renderPass: pass,
      shaderModuleProps: {picking: {isActive: true, isAttribute: true}}
    })
  ).toThrow('unproject3D');
  const reordered = layer.clone({pickingObjects: [entries[1], entries[0]]});
  reordered.context = layer.context;
  reordered.state = layer.state;
  reordered.updateState();
  expect(
    reordered.getPickingInfo({info: {...info, index: 0}, mode: 'query', sourceLayer: null}).object
      ?.id
  ).toBe('second');
  const duplicate = layer.clone({pickingObjects: [entries[0], {id: 'first', object: second}]});
  duplicate.context = layer.context;
  duplicate.state = layer.state;
  expect(() => duplicate.updateState()).toThrow('unique');
});
