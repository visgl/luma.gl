// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import type {GroupNode, Material} from '@luma.gl/engine';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';
import {TextLayer} from '@deck.gl/layers';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {GLTFInteractivity} from '@luma.gl/gltf';
import {getDeckExampleProps} from '../deck-example-device';
import {createInteractivityInfoBox} from './info-box';
import {INTERACTIVITY_SAMPLES} from './samples';
import {Matrix4} from '@math.gl/core';

let selectedSampleIndex = 0;
let loading = true;
const infoBox = createInteractivityInfoBox();
const sampleSelector = document.querySelector<HTMLSelectElement>('#sample')!;
const previous = document.querySelector<HTMLButtonElement>('#previous')!;
const next = document.querySelector<HTMLButtonElement>('#next')!;
let generation = 0;

// Replace the tiny atlas glyphs with pixel-sized labels, retaining the source
// nodes and their graph bindings. Keep the label plates light.
async function loadReadableScenegraph(sample: (typeof INTERACTIVITY_SAMPLES)[number]) {
  const gltf = await load(sample.url, GLTFLoader, {
    gltf: {excludeExtensions: {KHR_texture_transform: false}}
  });
  const materials = gltf.json.materials ?? [];
  for (const material of materials) {
    if (sample.id !== 'traffic-light' && material.name === 'LiberationSans SDF Material') {
      material.alphaMode = 'MASK';
      material.alphaCutoff = 0.5;
      material.pbrMetallicRoughness = {
        ...material.pbrMetallicRoughness,
        baseColorFactor: [0, 0, 0, 0]
      };
    }
    if (
      sample.id !== 'traffic-light' &&
      (material.name === 'LabelBaclground' || material.name === 'Background')
    ) {
      material.pbrMetallicRoughness = {
        baseColorFactor: [0.84, 0.88, 0.92, 1]
      };
    }
  }
  for (const node of gltf.json.nodes ?? []) {
    const mesh = node.mesh === undefined ? undefined : gltf.json.meshes?.[node.mesh];
    if (
      mesh?.primitives.some(
        primitive =>
          primitive.material !== undefined && materials[primitive.material]?.name === 'Background'
      )
    ) {
      const scale = node.scale ?? [1, 1, 1];
      node.scale = [scale[0], scale[1] * 1.6, scale[2]];
    }
  }
  return gltf;
}

const parent = document.querySelector<HTMLDivElement>('#scene')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const run = document.querySelector<HTMLButtonElement>('#run')!;
const result = document.querySelector<HTMLOutputElement>('#result')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const sceneHelp = document.querySelector<HTMLElement>('#scene-help')!;
let runtime: GLTFInteractivity | null = null;

let lastError = '';
let sourceOperationCount = 0;
let deck: Deck<OrbitView>;
let deviceType = 'initializing';
let modelScene: GroupNode | null = null;
let sourceExtension: ConstructorParameters<typeof GLTFInteractivity>[0] | null = null;
const sourceNodes = new Map<number, GroupNode>();
let sourceMaterials: Material[] = [];
let initialMaterialColors: number[][] = [];
let trafficStartTime = 0;
const trafficTargets: {element: HTMLButtonElement; position: number[]}[] = [];
const initialPositions = new Map<number, number[]>();

function fitModel(): void {
  const bounds = modelScene?.getBounds();
  if (!bounds) return;
  const [minimum, maximum] = bounds;
  const target: [number, number, number] = [
    (minimum[0] + maximum[0]) / 2,
    (minimum[1] + maximum[1]) / 2,
    (minimum[2] + maximum[2]) / 2
  ];
  const pixelsPerUnit = Math.min(
    (parent.clientWidth * 0.82) / Math.max(maximum[0] - minimum[0], 0.1),
    (parent.clientHeight * 0.72) / Math.max(maximum[1] - minimum[1], 0.1)
  );
  deck.setProps({
    initialViewState: {target, rotationX: 0, rotationOrbit: 0, zoom: Math.log2(pixelsPerUnit)}
  });
}

function resetChecks(): void {
  for (const [nodeIndex, position] of initialPositions) {
    sourceNodes
      .get(nodeIndex)!
      .setPosition([...position])
      .updateMatrix();
  }
  runtime = null;
  sourceMaterials.forEach((material, index) =>
    material.setProps({pbrMaterial: {baseColorFactor: initialMaterialColors[index]}})
  );
  const traffic = INTERACTIVITY_SAMPLES[selectedSampleIndex].id === 'traffic-light';
  result.value = traffic
    ? 'Click a blue-ringed button: left plays a sequence; right advances a phase.'
    : 'Test suite · Run tests executes every check; the icons are results.';
  sceneHelp.textContent = traffic
    ? 'Click the highlighted buttons · Left: timed sequence · Right: next phase'
    : 'Test results, not toggles · Open the luma.gl panel → Run tests';
  run.hidden = traffic;
  run.textContent = 'Run tests';
  if (traffic) initializeTrafficRuntime();
  status.value = `Authored graph: ${sourceOperationCount} nodes\nBackend: ${deviceType}`;
  deck.redraw('Reset authored checks');
}

function runChecks(): void {
  if (
    !sourceExtension ||
    INTERACTIVITY_SAMPLES[selectedSampleIndex].id === 'traffic-light' ||
    loading
  )
    return;
  resetChecks();
  const diagnostics: string[] = [];
  let lastEvent = '';
  try {
    runtime = createRuntime(diagnostics, eventId => {
      lastEvent = eventId;
    });
    runtime.start();
    const checks = runtime.variables.filter(value => typeof value[0] === 'boolean');
    const passedChecks = checks.filter(value => value[0] === true).length;
    result.value = `${passedChecks} / ${checks.length} checks passed · ${lastEvent || 'Completed'}`;
    sceneHelp.textContent = `${passedChecks} / ${checks.length} checks passed · These are test results, not toggles · Reset clears results`;
    status.value = `Authored graph: ${sourceOperationCount} nodes\nEvent: ${lastEvent}\nBackend: ${deviceType}\n\n${diagnostics.join('\n')}`;
    deck.redraw('Run authored interactivity graph');
  } catch (error) {
    result.value = 'Graph execution failed';
    status.value = String(error);
  }
}

function createRuntime(
  diagnostics: string[] = [],
  onEvent?: (eventId: string) => void
): GLTFInteractivity {
  return new GLTFInteractivity(sourceExtension!, {
    properties: {
      get(pointer) {
        const match = /^\/nodes\/(\d+)\/translation$/.exec(pointer);
        const node = match && sourceNodes.get(Number(match[1]));
        return node ? [...node.position] : undefined;
      },
      set(pointer, value) {
        const materialMatch = /^\/materials\/(\d+)\/pbrMetallicRoughness\/baseColorFactor$/.exec(
          pointer
        );
        if (
          materialMatch &&
          value.length === 4 &&
          value.every(component => typeof component === 'number' && Number.isFinite(component))
        ) {
          const material = sourceMaterials[Number(materialMatch[1])];
          if (!material) return false;
          material.setProps({pbrMaterial: {baseColorFactor: value.map(Number)}});
          return true;
        }
        const match = /^\/nodes\/(\d+)\/translation$/.exec(pointer);
        const node = match && sourceNodes.get(Number(match[1]));
        if (
          !node ||
          value.length !== 3 ||
          !value.every(component => typeof component === 'number' && Number.isFinite(component))
        )
          return false;
        node.setPosition([...value]).updateMatrix();
        return true;
      }
    },
    onLog: message => diagnostics.push(message),
    onEvent
  });
}

function initializeTrafficRuntime(): void {
  runtime = createRuntime();
  trafficStartTime = performance.now() / 1000;
  runtime.tick(0);
}

function clearTrafficTargets(): void {
  trafficTargets.splice(0).forEach(target => target.element.remove());
}

function getParentMatrix(node: GroupNode): Matrix4 {
  let child = node;
  let parentGroup = [...sourceNodes.values()].find(candidate => candidate.children.includes(child));
  const ancestors: GroupNode[] = [];
  while (parentGroup) {
    ancestors.push(parentGroup);
    child = parentGroup;
    parentGroup = [...sourceNodes.values()].find(candidate => candidate.children.includes(child));
  }
  const matrix = new Matrix4();
  for (const ancestor of ancestors.reverse()) matrix.multiplyRight(ancestor.matrix);
  return matrix;
}

let activeSceneLayer: ScenegraphLayer | undefined;
type ReadableLabel = {position: [number, number, number]; text: string; title: boolean};
let readableLabels: ReadableLabel[] = [];
function createReadableLabels(sourceNodeDefinitions: {name?: string}[]): void {
  readableLabels = [];
  for (const [nodeIndex, node] of sourceNodes) {
    const definition = sourceNodeDefinitions[nodeIndex];
    const isTitle = definition.name?.startsWith('CaseLabel_');
    if (definition.name !== 'Label' && !isTitle) continue;
    const parentEntry = [...sourceNodes].find(([, candidate]) => candidate.children.includes(node));
    const label = isTitle
      ? definition.name!.replace('CaseLabel_flow/', '')
      : sourceNodeDefinitions[parentEntry![0]].name!.replace('CheckBox_', '');
    const bounds = node.getBounds();
    const labelCenter = bounds
      ? bounds[0].map((value, component) => (value + bounds[1][component]) / 2)
      : [0, 0, 0];
    const position = getParentMatrix(node).transformAsPoint(labelCenter);
    readableLabels.push({
      position: [position[0], position[1], position[2]],
      text: isTitle
        ? label[0].toUpperCase() + label.slice(1)
        : label.replaceAll(' > ', '\n→ ').replace(': ', ':\n'),
      title: Boolean(isTitle)
    });
  }
  if (activeSceneLayer) deck.setProps({layers: [activeSceneLayer, createLabelLayer()]});
}

function createLabelLayer() {
  return new TextLayer<ReadableLabel>({
    id: 'readable-check-labels',
    data: readableLabels,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: label => label.position,
    getText: label => label.text,
    getSize: label => (label.title ? 16 : 11),
    getColor: [18, 26, 35, 255],
    fontFamily: 'Arial, sans-serif',
    fontWeight: 600,
    maxWidth: 130,
    wordBreak: 'break-word',
    lineHeight: 1.1,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    billboard: true,
    parameters: {depthCompare: 'always', depthWriteEnabled: false}
  });
}

function createTrafficTargets(): void {
  clearTrafficTargets();
  if (INTERACTIVITY_SAMPLES[selectedSampleIndex].id !== 'traffic-light') return;
  for (const [nodeIndex, label] of [
    [5, 'Play sequence'],
    [10, 'Next phase']
  ] as const) {
    const node = sourceNodes.get(nodeIndex)!;
    const bounds = node.getBounds();
    if (!bounds) continue;
    let position = bounds[0].map((value, component) => (value + bounds[1][component]) / 2);
    position = Array.from(getParentMatrix(node).transformAsPoint(position));
    const element = document.createElement('button');
    element.className = 'traffic-hit-target';
    element.setAttribute('aria-label', label);
    element.title = label;
    const caption = document.createElement('span');
    caption.textContent = label;
    element.append(caption);
    element.onpointerdown = event => event.stopPropagation();
    element.onpointerup = event => event.stopPropagation();
    element.onclick = event => {
      event.stopPropagation();
      runtime?.selectNode(nodeIndex);
      result.value =
        nodeIndex === 5
          ? 'Left light: running the authored timed sequence.'
          : 'Right light: advanced one authored phase.';
      deck.redraw('Selected traffic light button');
    };
    parent.append(element);
    trafficTargets.push({element, position});
  }
}

function createLayers() {
  const sample = INTERACTIVITY_SAMPLES[selectedSampleIndex];
  const currentGeneration = ++generation;
  const sceneLayer = new ScenegraphLayer({
    id: `khr-interactivity-scene-${currentGeneration}`,
    data: [{position: [0, 0, 0]}],
    scenegraph: loadReadableScenegraph(sample),
    _lighting: 'pbr',
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    sizeScale: 1,
    pickable: false,
    getPosition: d => d.position,
    getScene: (data: any) => {
      if (currentGeneration !== generation || !data?.scenes?.length) return null as any;
      const original = data.gltf?.extensions?.['KHR_interactivity'];
      const sourceGraph = original?.graphs[original.graph ?? 0];
      sourceOperationCount = sourceGraph?.nodes?.length ?? 0;
      sourceExtension = original;
      sourceMaterials = data.materials;
      initialMaterialColors = data.gltf.materials.map(
        (material: {pbrMetallicRoughness?: {baseColorFactor?: number[]}}) => [
          ...(material.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1])
        ]
      );
      infoBox.setGraph(
        (sourceGraph?.nodes ?? []).map(
          (node: {declaration: number}) =>
            sourceGraph.declarations[node.declaration]?.op || 'Unknown'
        ),
        sample.sourceUrl
      );
      loading = false;
      sampleSelector.disabled = previous.disabled = next.disabled = false;
      reset.disabled = false;
      run.disabled = sample.id === 'traffic-light';
      if (original) {
        try {
          new GLTFInteractivity(original);
        } catch (error) {
          run.disabled = true;
          lastError = String(error);
        }
      }
      sourceNodes.clear();
      initialPositions.clear();
      for (const [nodeIndex, node] of data.gltfNodeIndexToNodeMap.entries()) {
        sourceNodes.set(nodeIndex, node);
        initialPositions.set(nodeIndex, [...node.position]);
      }
      modelScene = data.scenes[data.gltf?.scene ?? 0] ?? data.scenes[0];
      queueMicrotask(() => {
        try {
          if (!original) throw new Error('The source asset has no KHR_interactivity extension');
          resetChecks();
          if (sample.id !== 'traffic-light' && !lastError) runChecks();
          if (lastError) status.value = lastError;
          fitModel();
          createTrafficTargets();
          if (sample.id !== 'traffic-light') createReadableLabels(data.gltf.nodes);
        } catch (error) {
          lastError = String(error);
          status.value = lastError;
        }
      });
      return modelScene;
    }
  });
  activeSceneLayer = sceneLayer;
  return [sceneLayer, createLabelLayer()];
}

run.disabled = reset.disabled = sampleSelector.disabled = previous.disabled = next.disabled = true;

deck = new Deck({
  parent,
  onDeviceInitialized: device => {
    deviceType = device.type;
  },
  ...getDeckExampleProps({deviceType: 'webgl'}),
  views: new OrbitView({id: 'orbit', controller: true, orbitAxis: 'Y', orthographic: true}),
  initialViewState: {target: [0, 0, 0], rotationX: 0, rotationOrbit: 0, zoom: 6},
  controller: true,
  _animate: true,
  onAfterRender: () => {
    infoBox.redraw();
    if (!loading && runtime && INTERACTIVITY_SAMPLES[selectedSampleIndex].id === 'traffic-light') {
      runtime.tick(performance.now() / 1000 - trafficStartTime);
      const viewport = deck.getViewports()[0];
      for (const target of trafficTargets) {
        const [horizontal, vertical] = viewport.project(target.position);
        target.element.style.left = `${horizontal}px`;
        target.element.style.top = `${vertical}px`;
      }
    }
  },
  layers: createLayers(),
  onError: error => {
    lastError = error.message;
    status.value = lastError;
    result.value = lastError;
    loading = false;
    sampleSelector.disabled = previous.disabled = next.disabled = false;
  }
});

run.addEventListener('click', runChecks);
reset.addEventListener('click', resetChecks);
document.querySelector<HTMLButtonElement>('#fit')!.addEventListener('click', fitModel);
const resizeObserver = new ResizeObserver(() => {
  fitModel();
  infoBox.redraw();
});
resizeObserver.observe(parent);
window.addEventListener('pagehide', () => {
  resizeObserver.disconnect();
  clearTrafficTargets();
  infoBox.destroy();
  deck.finalize();
});

function selectSample(index: number): void {
  if (loading) return;
  selectedSampleIndex = (index + INTERACTIVITY_SAMPLES.length) % INTERACTIVITY_SAMPLES.length;
  sampleSelector.selectedIndex = selectedSampleIndex;
  loading = true;
  clearTrafficTargets();
  readableLabels = [];
  runtime = null;
  sourceExtension = null;
  lastError = '';
  run.disabled =
    reset.disabled =
    sampleSelector.disabled =
    previous.disabled =
    next.disabled =
      true;
  result.value = 'Loading asset…';
  status.value = '';
  deck.setProps({layers: createLayers()});
}
sampleSelector.addEventListener('change', () => selectSample(sampleSelector.selectedIndex));
previous.addEventListener('click', () => selectSample(selectedSampleIndex - 1));
next.addEventListener('click', () => selectSample(selectedSampleIndex + 1));
