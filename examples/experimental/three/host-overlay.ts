// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as THREE from 'three';
import {WebGPURenderer} from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import {ThreeDeckOverlay} from '@luma.gl/three/overlay';

const container = document.querySelector<HTMLDivElement>('#scene')!;
const canvas = document.querySelector<HTMLCanvasElement>('#three-canvas')!;
const status = document.querySelector<HTMLElement>('#status')!;
const projection = document.querySelector<HTMLSelectElement>('#projection')!;
const resolution = document.querySelector<HTMLSelectElement>('#resolution')!;
const animate = document.querySelector<HTMLInputElement>('#animate')!;
const showOverlay = document.querySelector<HTMLInputElement>('#show-overlay')!;
const recreate = document.querySelector<HTMLButtonElement>('#recreate')!;
const useWebGPU = new URLSearchParams(location.search).get('renderer') === 'webgpu';

// This is an ordinary Three app. Its renderer and controls exist before deck is attached.
const renderer = useWebGPU
  ? new WebGPURenderer({canvas, antialias: true})
  : new THREE.WebGLRenderer({canvas, antialias: true});
if (renderer instanceof WebGPURenderer) await renderer.init();
renderer.setPixelRatio(Number(resolution.value));
const scene = new THREE.Scene();
scene.background = new THREE.Color('#172536');
const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const material = new THREE.MeshStandardMaterial({color: '#61c6b8', roughness: 0.35});
const mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 0.8;
scene.add(mesh, new THREE.HemisphereLight(0xe6f6ff, 0x364657, 2));
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(3, 5, 4);
scene.add(light);
const grid = new THREE.GridHelper(10, 20, 0x69839b, 0x344960);
scene.add(grid);
const perspective = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const orthographic = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
perspective.position.set(5, 4, 6);
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = perspective;
const controls = new OrbitControls<THREE.PerspectiveCamera | THREE.OrthographicCamera>(
  camera,
  canvas
);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.update();

const points: [number, number, number][] = [
  [-2, 0.2, -1],
  [-1, 1.8, 0],
  [0, 2.5, 0],
  [1.5, 1.4, 0.5],
  [2.5, 0.2, 1]
];
function createLayers() {
  return showOverlay.checked
    ? [
        new PathLayer({
          id: 'three-route',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: [{path: points}],
          getPath: record => record.path,
          getColor: [255, 191, 89],
          widthUnits: 'pixels',
          billboard: true,
          getWidth: 4
        }),
        new ScatterplotLayer({
          id: 'three-observations',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: points,
          getPosition: point => point,
          getFillColor: [255, 219, 145],
          radiusUnits: 'pixels',
          billboard: true,
          getRadius: 8
        })
      ]
    : [];
}
let overlay: ThreeDeckOverlay | undefined;
let disposed = false;
function reportError(error: Error) {
  status.textContent = `Overlay unavailable: ${error.message}. Three keeps running.`;
}
function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height, false);
  perspective.aspect = width / height;
  perspective.updateProjectionMatrix();
  orthographic.left = (-4 * width) / height;
  orthographic.right = (4 * width) / height;
  orthographic.updateProjectionMatrix();
}
const observer = new ResizeObserver(resize);
observer.observe(container);
resize();
projection.onchange = () => {
  const nextCamera = projection.value === 'perspective' ? perspective : orthographic;
  nextCamera.position.copy(camera.position);
  nextCamera.quaternion.copy(camera.quaternion);
  camera = nextCamera;
  controls.object = camera;
  controls.update();
};
resolution.onchange = () => {
  renderer.setPixelRatio(Number(resolution.value));
  resize();
};
showOverlay.onchange = () => overlay?.setProps({layers: createLayers()});
async function attachOverlay(recreated = false) {
  recreate.disabled = true;
  overlay?.dispose();
  overlay = undefined;
  try {
    const nextOverlay = await ThreeDeckOverlay.create({
      renderer,
      container,
      target: controls.target,
      layers: createLayers(),
      onError: reportError
    });
    // The application may have closed while the separate device was initializing.
    if (disposed) {
      nextOverlay.dispose();
      return;
    }
    // Apply checkbox changes made while the deck device was initializing.
    nextOverlay.setProps({layers: createLayers()});
    overlay = nextOverlay;
    status.textContent = recreated
      ? 'Overlay recreated; the Three renderer, scene and controls are still running.'
      : `${useWebGPU ? 'WebGPU' : 'WebGL'} Three renderer with a separate deck overlay. Drag to orbit; scroll to zoom.`;
  } catch (error) {
    reportError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    if (!disposed) recreate.disabled = false;
  }
}
recreate.onclick = () => {
  void attachOverlay(true);
};
let frame = 0;
function render(time: number) {
  if (animate.checked) mesh.rotation.y = time * 0.0003;
  controls.update();
  renderer.render(scene, camera);
  try {
    overlay?.render(camera, time);
  } catch (error) {
    overlay?.dispose();
    overlay = undefined;
    reportError(error instanceof Error ? error : new Error(String(error)));
  }
  frame = requestAnimationFrame(render);
}
frame = requestAnimationFrame(render);
status.textContent = 'Three is running; attaching deck layers…';
window.addEventListener(
  'pagehide',
  () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    overlay?.dispose();
    controls.dispose();
    geometry.dispose();
    material.dispose();
    grid.dispose();
    renderer.dispose();
  },
  {once: true}
);

// The native frame loop is already running; an optional overlay failure cannot stop it.
void attachOverlay();
