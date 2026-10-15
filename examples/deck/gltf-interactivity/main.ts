// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';
import {GLTFInteractivity} from '@luma.gl/gltf';
import {getDeckExampleProps} from '../deck-example-device';

const ASSET_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Test-Assets-Interactivity/main/' +
  'Tests/Interactivity/flow/branch/glTF-Binary/branch.glb';

const parent = document.querySelector<HTMLDivElement>('#scene')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
let sceneData: any = null;
let runtime: GLTFInteractivity | null = null;
let enlarged = false;
let lastError = '';
let sourceOperationCount = 0;
let activeNodeIndex = -1;
let deck: Deck;

/**
 * The official test asset uses operations outside the currently supported interpreter subset.
 * Construct a separate, standards-shaped demo graph and apply its pointer/set to the SAME
 * source glTF node rendered by ScenegraphLayer. Do not rewrite or misrepresent the source graph.
 */
function makeDemoGraph(scale: number) {
  return {
    graphs: [
      {
        types: [{signature: 'float3'}, {signature: 'bool'}],
        declarations: [{op: 'event/onStart'}, {op: 'flow/branch'}, {op: 'pointer/set'}],
        nodes: [
          {declaration: 0, flows: {out: {node: 1}}},
          {declaration: 1, values: {condition: {type: 1, value: [true]}}, flows: {true: {node: 2}}},
          {
            declaration: 2,
            configuration: {
              pointer: {value: [`/nodes/${activeNodeIndex}/scale`]},
              type: {value: [0]}
            },
            values: {value: {type: 0, value: [scale, scale, scale]}}
          }
        ]
      }
    ]
  };
}

function runDemo(scale: number): void {
  if (!sceneData || activeNodeIndex < 0) return;
  const sourceNode = sceneData.gltfNodeIndexToNodeMap.get(activeNodeIndex);
  if (!sourceNode) throw new Error('Selected glTF node was not instantiated');
  runtime = new GLTFInteractivity(makeDemoGraph(scale), {
    properties: {
      get(pointer) {
        return pointer === `/nodes/${activeNodeIndex}/scale` ? [...sourceNode.scale] : undefined;
      },
      set(pointer, value) {
        if (pointer !== `/nodes/${activeNodeIndex}/scale` || value.length !== 3) return false;
        if (!value.every(component => typeof component === 'number' && Number.isFinite(component)))
          return false;
        sourceNode.setScale(value as number[]);
        sourceNode.updateMatrix();
        deck.redraw('KHR_interactivity pointer/set');
        return true;
      }
    }
  });
  runtime.start();
  status.value = `KHR_interactivity: present
Source graph operations: ${sourceOperationCount}
Demo operation: event/onStart → flow/branch → pointer/set
Source node: ${activeNodeIndex}
Scale: ${scale.toFixed(2)}
Backend: ${deck?.device?.type ?? 'initializing'}`;
}

deck = new Deck({
  parent,
  ...getDeckExampleProps({deviceType: 'webgl'}),
  views: new OrbitView({id: 'orbit', controller: true, orbitAxis: 'Z'}),
  initialViewState: {target: [0, 0, 0], rotationX: 20, rotationOrbit: -25, zoom: 0},
  controller: true,
  _animate: true,
  layers: [
    new ScenegraphLayer({
      id: 'khr-interactivity-scene',
      data: [{position: [0, 0, 0]}],
      scenegraph: ASSET_URL,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      sizeScale: 1,
      pickable: true,
      getPosition: d => d.position,
      getScene: (data: any) => {
        if (!data?.scenes?.length) return null as any;
        sceneData = data;
        const original = data.gltf?.extensions?.['KHR_interactivity'];
        const sourceGraph = original?.graphs[original.graph ?? 0];
        sourceOperationCount = sourceGraph?.nodes?.length ?? 0;
        const entries = [...data.gltfNodeIndexToNodeMap.entries()] as Array<[number, any]>;
        activeNodeIndex =
          entries.find(([index]) => Boolean(data.gltf?.nodes?.[index]?.mesh))?.[0] ??
          entries[0]?.[0] ??
          -1;
        queueMicrotask(() => {
          try {
            if (!original) throw new Error('The source asset has no KHR_interactivity extension');
            runDemo(1);
          } catch (error) {
            lastError = String(error);
            status.value = lastError;
          }
        });
        return data.scenes[data.gltf?.scene ?? 0] ?? data.scenes[0];
      }
    })
  ],
  onError: error => {
    lastError = error.message;
    status.value = lastError;
  }
});

toggle.addEventListener('click', () => {
  try {
    enlarged = !enlarged;
    runDemo(enlarged ? 1.5 : 1);
  } catch (error) {
    status.value = String(error);
  }
});
reset.addEventListener('click', () => {
  enlarged = false;
  try {
    runDemo(1);
  } catch (error) {
    status.value = String(error);
  }
});
window.addEventListener('pagehide', () => deck.finalize());
