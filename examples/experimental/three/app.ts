// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, type Device} from '@luma.gl/core';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';
import {LumaRenderer} from '@luma.gl/three/backend';
import {WebGPURenderer, UnsignedByteType, HalfFloatType, type Renderer} from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createScene} from './scene';
import {createGLTFScene, type GLTFSceneKind} from './gltf-scene';
import {createObjectScene} from './object-scene';
import {MixedObjectRenderer} from './mixed-object-renderer';
import {createComputeScene} from './compute-scene';
import {createDeckComparison} from './deck-comparison';
import {createDeckLanternComparison} from './deck-lantern-comparison';
import {createGeographicComparison} from './geographic-comparison';

let deckComparison: Awaited<ReturnType<typeof createDeckComparison>> | undefined;

const status = document.querySelector<HTMLElement>('#status')!;
const sceneSelection = document.querySelector<HTMLSelectElement>('#scene')!;
const requestedScene = new URLSearchParams(window.location.search).get('scene');
if (
  requestedScene &&
  Array.from(sceneSelection.options).some(option => option.value === requestedScene)
)
  sceneSelection.value = requestedScene;
const backendSelection = document.querySelector<HTMLSelectElement>('#backend')!;
if (!navigator.gpu) backendSelection.value = 'webgl';
const lighting = document.querySelector<HTMLInputElement>('#lighting')!;
const environment = document.querySelector<HTMLInputElement>('#environment')!;
const shadows = document.querySelector<HTMLInputElement>('#shadows')!;
const deckContext = document.querySelector<HTMLInputElement>('#deck-context')!;
type ComparisonScene =
  | ReturnType<typeof createScene>
  | Awaited<ReturnType<typeof createGLTFScene>>
  | ReturnType<typeof createObjectScene>
  | ReturnType<typeof createComputeScene>;
type ExampleRenderer = Renderer | MixedObjectRenderer;
type View = {renderer: ExampleRenderer; scene: ComparisonScene; controls: OrbitControls};
let views: View[] = [];
let device: Device | undefined;
let width = 512;
let busy = false;
let synchronizing = false;

function synchronizeCamera(source: View, destination: View) {
  if (synchronizing) return;
  synchronizing = true;
  try {
    destination.scene.camera.position.copy(source.scene.camera.position);
    destination.scene.camera.quaternion.copy(source.scene.camera.quaternion);
    destination.scene.camera.up.copy(source.scene.camera.up);
    destination.scene.camera.zoom = source.scene.camera.zoom;
    destination.scene.camera.updateProjectionMatrix();
    destination.controls.target.copy(source.controls.target);
    destination.controls.update();
  } finally {
    synchronizing = false;
  }
}

async function createView(renderer: ExampleRenderer): Promise<View> {
  await renderer.init();
  renderer.setSize(width, width, false);
  const sceneKinds: Record<string, GLTFSceneKind> = {
    gltf: 'gltf',
    morph: 'morph',
    skin: 'skin',
    instances: 'instances',
    materials: 'materials',
    transmission: 'transmission'
  };
  let scene: ComparisonScene;
  if (sceneSelection.value === 'interop') {
    if (!(renderer instanceof WebGPURenderer))
      throw new Error('Interop uses upstream Three rendering');
    scene = createComputeScene(views.length === 0 ? device : undefined, renderer);
  } else if (sceneSelection.value === 'objects') scene = createObjectScene();
  else if (sceneSelection.value === 'tsl') scene = createScene();
  else {
    if (renderer instanceof MixedObjectRenderer)
      throw new Error('Mixed renderer requires the object scene');
    scene = await createGLTFScene(renderer, sceneKinds[sceneSelection.value]);
  }
  if ('compute' in scene) {
    if (renderer instanceof MixedObjectRenderer)
      throw new Error('Mixed example does not run compute');
    if (backendSelection.value === 'webgpu') {
      await renderer.computeAsync(scene.compute);
      const values = new Float32Array(await renderer.getArrayBufferAsync(scene.attribute));
      if (!values.every((value, index) => value === index * 2 + 1))
        throw new Error('Compute readback mismatch');
    }
  }
  const controls = new OrbitControls(scene.camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();
  return {renderer, scene, controls};
}

function createInteropRenderer(device: Device, canvas: HTMLCanvasElement) {
  if (!(device instanceof WebGPUDevice)) throw new Error('Shared compute requires WebGPU');
  return new WebGPURenderer({
    canvas,
    device: device.handle,
    antialias: false,
    outputBufferType: UnsignedByteType
  });
}

async function recreate() {
  if (busy) return;
  busy = true;
  const useWebGL = backendSelection.value === 'webgl';
  if (
    useWebGL &&
    ['objects', 'interop', 'deck', 'deck-lantern', 'deck-geographic'].includes(sceneSelection.value)
  )
    sceneSelection.value = 'gltf';
  for (const sceneKind of ['objects', 'interop', 'deck', 'deck-lantern', 'deck-geographic'])
    sceneSelection.querySelector<HTMLOptionElement>(`option[value="${sceneKind}"]`)!.disabled =
      useWebGL;
  sceneSelection.disabled = true;
  backendSelection.disabled = true;
  for (const button of document.querySelectorAll('button')) button.disabled = true;
  status.textContent = 'Preparing both renderers…';
  for (const control of [lighting, environment, shadows])
    control.disabled = ['objects', 'tsl', 'interop', 'deck', 'deck-geographic'].includes(
      sceneSelection.value
    );
  try {
    deckComparison?.dispose();
    deckComparison = undefined;
    for (const view of views) {
      view.renderer.setAnimationLoop(null);
      view.controls.dispose();
      view.scene.dispose();
      view.renderer.dispose();
    }
    views = [];
    device?.destroy();
    device = undefined;
    // A fresh canvas avoids retaining a context from a disposed renderer.
    const canvases = ['luma', 'three'].map(name => {
      const canvas = document.createElement('canvas');
      canvas.id = `${name}-canvas`;
      canvas.width = canvas.height = width;
      document.querySelector(`#${name}-canvas`)!.replaceWith(canvas);
      return canvas;
    });
    device = await luma.createDevice({
      adapters: [useWebGL ? webgl2Adapter : webgpuAdapter],
      type: useWebGL ? 'webgl' : 'webgpu',
      createCanvasContext: {canvas: canvases[0], autoResize: false}
    });
    deckContext.disabled = sceneSelection.value !== 'deck-lantern';
    if (['deck', 'deck-lantern', 'deck-geographic'].includes(sceneSelection.value)) {
      const onError = (error: Error) => {
        status.textContent = String(error);
      };
      deckComparison =
        sceneSelection.value === 'deck-geographic'
          ? await createGeographicComparison(device, canvases[1], width, onError, id => {
              status.textContent = id ? `Selected: ${id}` : 'No object selected';
            })
          : sceneSelection.value === 'deck-lantern'
            ? await createDeckLanternComparison(device, canvases[1], width, onError, () => ({
                lighting: lighting.checked,
                environment: environment.checked,
                shadows: shadows.checked,
                context: deckContext.checked
              }))
            : await createDeckComparison(device, canvases[1], width, onError);
      document.querySelector('#luma-heading')!.textContent =
        'deck.gl + Three meshes / one device and depth buffer';
      document.querySelector('#three-heading')!.textContent = 'Upstream Three reference';
      status.textContent =
        sceneSelection.value === 'deck-geographic'
          ? 'Local meter Lanterns at a geographic origin. Drag/zoom either map to control both views; Shift-drag rotates/tilts; hover the deck view for IDs and highlights; click either view to select a Lantern or native building through deck GPU picking. Toggle Lantern models removes/reinserts the layer. Buildings share depth. THREE.js nameplates use the same texture in both renderers.'
          : sceneSelection.value === 'deck-lantern'
            ? 'Lantern glTF / MeshStandardMaterial, environment and PCF shadows inside a native deck courtyard. Shared device/depth; synchronized cameras. Hover a data column.'
            : 'Three cube + native deck ScatterplotLayer in one render pass. Drag either view; cameras synchronize. The disk moves behind and in front of the cube.';
      return;
    }
    const lumaRenderer =
      sceneSelection.value === 'interop'
        ? createInteropRenderer(device, canvases[0])
        : sceneSelection.value === 'objects'
          ? new MixedObjectRenderer(device)
          : new LumaRenderer({device});
    try {
      views.push(await createView(lumaRenderer));
    } catch (error) {
      lumaRenderer.dispose();
      throw error;
    }
    const threeRenderer = new WebGPURenderer({
      canvas: canvases[1],
      forceWebGL: useWebGL,
      antialias: false,
      // The mixed path writes directly to the canvas. Avoid an 8-bit linear
      // intermediate in Three introducing an extra quantization before sRGB output.
      outputBufferType: sceneSelection.value === 'objects' ? HalfFloatType : UnsignedByteType
    });
    try {
      views.push(await createView(threeRenderer));
    } catch (error) {
      threeRenderer.dispose();
      throw error;
    }
    const [lumaView, threeView] = views;
    lumaView.controls.addEventListener('change', () => synchronizeCamera(lumaView, threeView));
    threeView.controls.addEventListener('change', () => synchronizeCamera(threeView, lumaView));
    synchronizeCamera(lumaView, threeView);
    document.querySelector('#luma-heading')!.textContent =
      sceneSelection.value === 'interop' ? 'luma compute → upstream Three' : 'luma.gl';
    document.querySelector('#three-heading')!.textContent =
      sceneSelection.value === 'interop' ? 'Upstream Three / TSL reference' : 'Three.js';
    status.textContent =
      sceneSelection.value === 'interop'
        ? 'Three wave instances share GPU-generated vertices, triangle indices and instance offsets. One device on the left; no geometry readback or re-upload. Both views render with upstream Three.js.'
        : sceneSelection.value === 'objects'
          ? 'One luma pass: adapted Three cube + native luma triangle. Shared depth, synchronized camera. Lighting controls apply to PBR scenes.'
          : sceneSelection.value !== 'tsl'
            ? `${sceneSelection.selectedOptions[0].text}: standard materials, directional light, PCF shadows and PMREM environment. Drag or zoom either view.`
            : useWebGL
              ? 'TSL graphics on WebGL2. Compute is unsupported in the luma backend.'
              : 'TSL shaders and compute readback passed on both renderers. Drag or zoom either view.';
    const start = performance.now();
    // One clock keeps TSL animation identical across the two independently owned devices.
    lumaRenderer.setAnimationLoop(() => {
      const phase = (performance.now() - start) / 1000;
      for (const view of views) {
        if ('phase' in view.scene) view.scene.phase.value = phase;
        if ('update' in view.scene) view.scene.update(phase);
        if ('light' in view.scene) {
          view.scene.light.intensity = lighting.checked ? 3 : 0;
          view.scene.scene.environmentIntensity = environment.checked ? 1 : 0;
          view.scene.light.shadow.intensity = shadows.checked ? 1 : 0;
        }
        view.renderer.render(view.scene.scene, view.scene.camera);
      }
    });
  } catch (error) {
    deckComparison?.dispose();
    deckComparison = undefined;
    status.textContent = String(error);
    for (const view of views) {
      view.controls.dispose();
      view.scene.dispose();
      view.renderer.dispose();
    }
    views = [];
    device?.destroy();
    device = undefined;
  } finally {
    busy = false;
    sceneSelection.disabled = false;
    backendSelection.disabled = false;
    for (const button of document.querySelectorAll('button')) button.disabled = false;
    document.querySelector('#pause')!.textContent =
      sceneSelection.value === 'deck-geographic' ? 'Toggle Lantern models' : 'Pause deck animation';
    for (const selector of ['#reverse-order', '#pause'])
      document.querySelector<HTMLButtonElement>(selector)!.disabled = ![
        'deck',
        'deck-lantern',
        'deck-geographic'
      ].includes(sceneSelection.value);
  }
}
sceneSelection.addEventListener('change', () => void recreate());
backendSelection.addEventListener('change', () => void recreate());
document.querySelector('#recreate')!.addEventListener('click', () => void recreate());
document.querySelector('#resize')!.addEventListener('click', () => {
  width = width === 512 ? 384 : 512;
  deckComparison?.setSize(width);
  for (const view of views) view.renderer.setSize(width, width, false);
});
document
  .querySelector('#reverse-order')!
  .addEventListener('click', () => deckComparison?.reverseOrder());
document.querySelector('#pause')!.addEventListener('click', () => deckComparison?.pause());
void recreate();
