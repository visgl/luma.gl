// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {COORDINATE_SYSTEM, OrthographicView} from '@deck.gl/core';
import {
  GPUBitmapLayer,
  WindParticleLayer,
  WindSimulationEffect
} from '@deck.gl-community/gpu-layers';
import {PanelManager} from '@deck.gl-community/panels';
import {Texture, type Device} from '@luma.gl/core';
import {loadImageBitmap} from '@luma.gl/engine';
import {ArrowDeck} from '../arrow-deck';
import {getDeckExampleProps} from '../deck-example-device';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {
  ExampleSettingsPanelManager,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {makeWindField, WIND_BOUNDS} from './fields';
import earthUrl from '../../showcase/globe/earth.jpg?url';
import mainSource from './main.ts?raw';

const diagnostics = new GPUGraphDiagnostics({traceTitle: 'Trace'});
const settings = {
  paused: false,
  particleCount: innerWidth < 600 ? 16384 : 65536,
  integrator: 'rk4',
  timeScale: 1,
  widthPixels: innerWidth < 600 ? 0.8 : 1.2,
  trailSeconds: 0.35
};
let activeDevice: Device | undefined;
let earth: Texture | undefined;
let effect: WindSimulationEffect | undefined;
let finalized = false;
const status = document.querySelector<HTMLElement>('#status')!;
const settingsPanel = new ExampleSettingsPanelManager({
  id: 'wind-settings',
  settings,
  schema: {
    title: 'Settings',
    sections: [
      {
        id: 'simulation',
        name: '',
        settings: [
          {name: 'paused', type: 'boolean', label: 'Pause', persist: 'none'},
          {
            name: 'particleCount',
            type: 'select',
            label: 'Particles',
            persist: 'none',
            options: [
              {label: '16,384', value: 16384},
              {label: '65,536', value: 65536},
              {label: '262,144', value: 262144}
            ]
          },
          {
            name: 'integrator',
            type: 'select',
            label: 'Integrator',
            persist: 'none',
            options: [
              {label: 'Runge–Kutta 4', value: 'rk4'},
              {label: 'Midpoint / RK2', value: 'rk2'}
            ]
          },
          {
            name: 'timeScale',
            type: 'number',
            label: 'Speed',
            persist: 'none',
            min: 0.1,
            max: 3,
            step: 0.1
          },
          {
            name: 'widthPixels',
            type: 'number',
            label: 'Width',
            persist: 'none',
            min: 0.5,
            max: 3,
            step: 0.1
          },
          {
            name: 'trailSeconds',
            type: 'number',
            label: 'Streak length',
            persist: 'none',
            min: 0.05,
            max: 1,
            step: 0.05
          }
        ]
      }
    ]
  },
  onSettingsChange: next => {
    const rebuild =
      next['particleCount'] !== settings.particleCount ||
      next['integrator'] !== settings.integrator;
    if (typeof next['paused'] === 'boolean') settings.paused = next['paused'];
    if (next['integrator'] === 'rk2' || next['integrator'] === 'rk4')
      settings.integrator = next['integrator'];
    for (const name of ['particleCount', 'timeScale', 'widthPixels', 'trailSeconds'] as const)
      if (typeof next[name] === 'number') settings[name] = next[name];
    if (rebuild) rebuildSimulation();
    if (effect) {
      effect.props.paused = settings.paused;
      effect.props.timeScale = settings.timeScale;
    }
    updateLayers();
  }
});
const panels = new PanelManager({parentElement: document.querySelector<HTMLElement>('#panels')!});
panels.setProps({
  components: [
    new InfoBoxPanelContainer({
      title: 'Wind Atlas',
      subtitle: 'deck.gl · GPU advection',
      directory: 'deck',
      id: 'wind',
      websiteBaseUrl: '/',
      appearance: 'cinematic',
      panel: makeExampleTabbedPanel({
        id: 'wind-tabs',
        theme: 'dark',
        panels: [
          settingsPanel.makePanel(),
          makeHtmlCustomPanel({
            id: 'wind-info',
            title: 'Info',
            html: '<p>Follow synthetic wind bands and vortices. Drag to pan and scroll to zoom this longitude/latitude atlas.</p><p>WindSimulationEffect records RK2/RK4 advection into Deck’s frame encoder. WindParticleLayer renders the resident buffers without reading particles back to the CPU.</p><p>These angular velocities and seconds are illustrative, not a forecast. Streaks extrapolate recent motion; they are not retained trajectories. Longitude wraps; seam-crossing streaks briefly become heads to avoid long lines across the map.</p>'
          }),
          diagnostics.inspectorPanel.panel,
          diagnostics.tracePanel.panel,
          makeHtmlCustomPanel({
            id: 'wind-source',
            title: 'Source',
            html: '',
            onRender: root => {
              const code = document.createElement('pre');
              code.textContent = mainSource;
              root.append(code);
            }
          })
        ]
      })
    })
  ]
});
const deck = new ArrowDeck({
  parent: document.querySelector<HTMLDivElement>('#scene')!,
  ...getDeckExampleProps({deviceType: 'webgpu'}),
  views: new OrthographicView({id: 'wind-atlas', flipY: false}),
  initialViewState: {
    target: [0, 0, 0],
    zoom: Math.log2(Math.min((innerWidth * 0.9) / 360, (innerHeight * 0.7) / 180)),
    minZoom: -2,
    maxZoom: 7
  },
  controller: true,
  _animate: true,
  layers: [],
  effects: [],
  onLoad: ({device}) => {
    activeDevice = device;
    rebuildSimulation();
    void loadImageBitmap(earthUrl)
      .then(bitmap => {
        if (finalized) {
          bitmap.close();
          return;
        }
        earth = device.createTexture({
          id: 'wind-earth',
          width: bitmap.width,
          height: bitmap.height,
          data: bitmap,
          format: 'rgba8unorm',
          usage: Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER
        });
        bitmap.close();
        updateLayers();
      })
      .catch(error => {
        status.textContent = String(error);
      });
  },
  onAfterRender: () => {
    panels.onRedraw({viewports: [], layers: []});
    if (effect)
      status.textContent = `${settings.particleCount.toLocaleString()} particles · ${settings.integrator.toUpperCase()} · ${effect.simulation.time.toFixed(1)} illustrative seconds${settings.paused ? ' · paused' : ''}`;
  },
  onError: error => {
    status.textContent = error.message;
  }
});
function rebuildSimulation() {
  if (!activeDevice) return;
  diagnostics.clear();
  effect = new WindSimulationEffect(activeDevice, {
    input: makeWindField(),
    bounds: WIND_BOUNDS,
    periodicLongitude: true,
    particleCount: settings.particleCount,
    integrator: settings.integrator === 'rk2' ? 'rk2' : 'rk4',
    lifetime: 45,
    seed: 17,
    paused: settings.paused,
    timeScale: settings.timeScale,
    onEncode: (simulation, encoding) => diagnostics.record(simulation.commandGraph, encoding)
  });
  deck.setProps({effects: [effect]});
  updateLayers();
}
function updateLayers() {
  deck.setProps({
    layers: [
      earth &&
        new GPUBitmapLayer({
          id: 'earth',
          image: earth,
          bounds: [-180, -90, 180, 90],
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          tintColor: [75, 100, 120, 255]
        }),
      effect &&
        new WindParticleLayer({
          id: 'winds',
          simulation: effect.simulation,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          widthPixels: settings.widthPixels,
          trailSeconds: settings.trailSeconds,
          altitude: 0.1,
          color: [0.25, 0.85, 1, 0.65]
        })
    ]
  });
}
window.addEventListener('pagehide', () => {
  finalized = true;
  deck.finalize();
  earth?.destroy();
  panels.finalize();
  settingsPanel.finalize();
  diagnostics.clear();
});
