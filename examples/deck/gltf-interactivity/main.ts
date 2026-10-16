// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {BoxPanelContainer, CustomPanel, PanelManager} from '@deck.gl-community/panels';
import type {GroupNode} from '@luma.gl/engine';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';
import {TextLayer} from '@deck.gl/layers';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {GLTFInteractivity} from '@luma.gl/gltf';
import {getDeckExampleProps} from '../deck-example-device';

const ASSET_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Test-Assets-Interactivity/main/' +
  'Tests/Interactivity/flow/branch/glTF-Binary/branch.glb';

// Replace the tiny atlas glyphs with pixel-sized labels, retaining the source
// nodes and their graph bindings. Keep the label plates light.
async function loadReadableScenegraph() {
  const gltf = await load(ASSET_URL, GLTFLoader, {
    gltf: {excludeExtensions: {KHR_texture_transform: false}}
  });
  const materials = gltf.json.materials ?? [];
  for (const material of materials) {
    if (material.name === 'LiberationSans SDF Material') {
      material.alphaMode = 'MASK';
      material.alphaCutoff = 0.5;
      material.pbrMetallicRoughness = {
        ...material.pbrMetallicRoughness,
        baseColorFactor: [0, 0, 0, 0]
      };
    }
    if (material.name === 'LabelBaclground' || material.name === 'Background') {
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
const panelContent = document.querySelector<HTMLDivElement>('#info-content')!;
const panelManager = new PanelManager({
  parentElement: document.querySelector<HTMLDivElement>('#panels')!
});
panelManager.setProps({
  components: [
    new BoxPanelContainer({
      id: 'interactivity-info',
      title: 'glTF Behavior Graphs',
      placement: 'top-right',
      widthPx: 300,
      collapsible: true,
      defaultOpen: false,
      panel: new CustomPanel({
        id: 'interactivity-content',
        title: 'Info',
        theme: 'dark',
        onRenderHTML: rootElement => {
          panelContent.hidden = false;
          rootElement.append(panelContent);
        }
      })
    })
  ]
});
const status = document.querySelector<HTMLOutputElement>('#status')!;
const run = document.querySelector<HTMLButtonElement>('#run')!;
const result = document.querySelector<HTMLOutputElement>('#result')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
let runtime: GLTFInteractivity | null = null;
let hasRun = false;
let lastError = '';
let sourceOperationCount = 0;
let deck: Deck<OrbitView>;
let deviceType = 'initializing';
let modelScene: GroupNode | null = null;
let sourceExtension: ConstructorParameters<typeof GLTFInteractivity>[0] | null = null;
const sourceNodes = new Map<number, GroupNode>();
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
  hasRun = false;
  result.value = 'Ready · Click the model or Run checks';
  status.value = `Authored graph: ${sourceOperationCount} nodes\nBackend: ${deviceType}`;
  deck.redraw('Reset authored checks');
}

function runChecks(): void {
  if (!sourceExtension) return;
  resetChecks();
  const diagnostics: string[] = [];
  let lastEvent = '';
  try {
    runtime = new GLTFInteractivity(sourceExtension, {
      properties: {
        get(pointer) {
          const match = /^\/nodes\/(\d+)\/translation$/.exec(pointer);
          const node = match && sourceNodes.get(Number(match[1]));
          return node ? [...node.position] : undefined;
        },
        set(pointer, value) {
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
      onEvent: eventId => {
        lastEvent = eventId;
      }
    });
    runtime.start();
    hasRun = true;
    const passedChecks = runtime.variables.filter(value => value[0] === true).length;
    result.value = `${passedChecks} / ${runtime.variables.length} checks passed · Click model to reset`;
    status.value = `Authored graph: ${sourceOperationCount} nodes\nEvent: ${lastEvent}\nBackend: ${deviceType}\n\n${diagnostics.join('\n')}`;
    deck.redraw('Run authored interactivity graph');
  } catch (error) {
    result.value = 'Graph execution failed';
    status.value = String(error);
  }
}

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
  layers: [
    new ScenegraphLayer({
      id: 'khr-interactivity-scene',
      data: [{position: [0, 0, 0]}],
      scenegraph: loadReadableScenegraph(),
      _lighting: 'pbr',
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      sizeScale: 1,
      pickable: true,
      getPosition: d => d.position,
      onClick: () => {
        if (hasRun) resetChecks();
        else runChecks();
      },
      onHover: information => {
        parent.style.cursor = information.index >= 0 ? 'pointer' : 'grab';
      },
      getScene: (data: any) => {
        if (!data?.scenes?.length) return null as any;
        const original = data.gltf?.extensions?.['KHR_interactivity'];
        const sourceGraph = original?.graphs[original.graph ?? 0];
        sourceOperationCount = sourceGraph?.nodes?.length ?? 0;
        sourceExtension = original;
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
            fitModel();
          } catch (error) {
            lastError = String(error);
            status.value = lastError;
          }
        });
        return modelScene;
      }
    }),
    new TextLayer<{position: [number, number, number]; text: string}>({
      id: 'readable-check-labels',
      data: [
        {position: [-1.325, 0, 0.1], text: 'Branch'},
        {position: [0, -0.7624, 0.1], text: 'True\nTrue'},
        {position: [1.1, -0.7624, 0.1], text: 'True\nFalse'},
        {position: [2.2, -0.7624, 0.1], text: 'False\nTrue'},
        {position: [3.3, -0.7624, 0.1], text: 'False\nFalse'}
      ],
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: label => label.position,
      getText: label => label.text,
      getSize: 12,
      getColor: [18, 26, 35, 255],
      fontFamily: 'Arial, sans-serif',
      fontWeight: 600,
      lineHeight: 1.05,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      billboard: true,
      parameters: {depthCompare: 'always', depthWriteEnabled: false}
    })
  ],
  onError: error => {
    lastError = error.message;
    status.value = lastError;
    result.value = lastError;
  }
});

run.addEventListener('click', runChecks);
reset.addEventListener('click', resetChecks);
document.querySelector<HTMLButtonElement>('#fit')!.addEventListener('click', fitModel);
const resizeObserver = new ResizeObserver(() => {
  fitModel();
  panelManager.onRedraw({viewports: [], layers: []});
});
resizeObserver.observe(parent);
window.addEventListener('pagehide', () => {
  resizeObserver.disconnect();
  panelManager.finalize();
  deck.finalize();
});
