// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  MapView,
  type MapViewState,
  type PickingInfo,
  type ViewStateChangeParameters
} from '@deck.gl/core';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {ArrowDeck} from '../arrow-deck';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {LuSpatialPointLayer} from './luspatial-point-layer';
import {LuSpatialTaxiQueryEffect, type LuSpatialTaxiQueryStats} from './luspatial-query-effect';
import {
  TAXI_CORPUS_POINT_COUNT,
  getTaxiPoint,
  makeLuSpatialTaxiData,
  makeTaxiZonePresets,
  type TaxiZonePreset
} from './taxi-data';

const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_ZONE_ID = 161;

type TaxiViewState = MapViewState & {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

/** Creates the WebGPU-only luSpatial taxi explorer with a synchronized MapLibre basemap. */
export function createLuSpatialTaxiDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  const ownsContainer = !parent;
  const container = parent ?? createStandaloneContainer();
  const taxiData = makeLuSpatialTaxiData();
  const zonePresets = makeTaxiZonePresets();
  const initialZone = zonePresets.find(zone => zone.id === INITIAL_ZONE_ID) ?? zonePresets[0];
  let viewState: TaxiViewState = {
    longitude: initialZone.center[0],
    latitude: initialZone.center[1],
    zoom: 12.2,
    pitch: 0,
    bearing: 0,
    minZoom: 9,
    maxZoom: 20
  };
  let queryEffect: LuSpatialTaxiQueryEffect | null = null;
  let queryRadiusKilometres = 0.35;

  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const basemapContainer = document.createElement('div');
  Object.assign(basemapContainer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '0',
    pointerEvents: 'none'
  });
  container.prepend(basemapContainer);
  const map = new maplibregl.Map({
    container: basemapContainer,
    style: BASEMAP_STYLE,
    center: [viewState.longitude, viewState.latitude],
    zoom: viewState.zoom,
    pitch: viewState.pitch,
    bearing: viewState.bearing,
    interactive: false,
    attributionControl: false
  });
  map.addControl(new maplibregl.AttributionControl({compact: true}), 'bottom-right');
  const resizeObserver = new ResizeObserver(() => map.resize());
  resizeObserver.observe(container);

  let deck: ArrowDeck<MapView>;
  const controls = createControlPanel(container, zonePresets, {
    onRadiusChange: radiusKilometres => {
      queryRadiusKilometres = radiusKilometres;
      queryEffect?.setSelectionRadius(radiusKilometres);
      deck?.redraw('luSpatial radius changed');
    },
    onZoneChange: zone => {
      viewState = {
        ...viewState,
        longitude: zone.center[0],
        latitude: zone.center[1],
        zoom: zone.zoom
      };
      queryEffect?.setSelection(zone.center, queryRadiusKilometres);
      controls.setCoordinate(zone.center, zone.name);
      deck?.setProps({viewState});
      synchronizeBasemap(map, viewState);
      deck?.redraw('luSpatial taxi zone changed');
    }
  });
  controls.setCoordinate(initialZone.center, initialZone.name);

  deck = new ArrowDeck({
    parent: container,
    ...getDeckExampleProps({...options, deviceType: 'webgpu'}),
    views: new MapView({id: 'map', repeat: false}),
    viewState,
    controller: {
      dragPan: true,
      scrollZoom: {smooth: true, speed: 0.02},
      doubleClickZoom: true,
      touchZoom: true,
      dragRotate: false
    },
    style: {background: 'transparent'},
    layers: [],
    effects: [],
    getTooltip: info => getTooltip(taxiData, info),
    onClick: (info: PickingInfo) => {
      const coordinate = info.coordinate;
      if (!coordinate || coordinate.length < 2) return;
      const center = [coordinate[0], coordinate[1]] as const;
      queryEffect?.setSelection(center, queryRadiusKilometres);
      controls.setCoordinate(center, 'Custom map query');
      controls.setCustomZone();
      deck.redraw('luSpatial query moved');
    },
    onViewStateChange: ({viewState: nextViewState}: ViewStateChangeParameters) => {
      viewState = nextViewState as TaxiViewState;
      deck.setProps({viewState});
      synchronizeBasemap(map, viewState);
    },
    onLoad: ({deck: loadedDeck, device}) => {
      if (device.type !== 'webgpu') throw new Error('luSpatial taxi explorer requires WebGPU');
      const canvas = device.getDefaultCanvasContext().canvas;
      if (canvas instanceof HTMLCanvasElement) {
        Object.assign(canvas.style, {
          position: 'absolute',
          inset: '0',
          zIndex: '1',
          background: 'transparent'
        });
      }
      queryEffect = new LuSpatialTaxiQueryEffect(device, taxiData, {
        onStats: stats => controls.updateStats(stats)
      });
      queryEffect.setSelection(initialZone.center, queryRadiusKilometres);
      loadedDeck.setProps({
        effects: [queryEffect],
        layers: [
          new LuSpatialPointLayer({
            id: 'luspatial-taxi-context',
            data: [],
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 140, 32, 230],
            longitudeLatitudes: queryEffect.longitudeLatitudes,
            visibleIds: queryEffect.viewportIds,
            drawCommands: queryEffect.drawCommands,
            commandIndex: 0,
            color: [94, 172, 198, 105],
            radiusPixels: 0.9,
            opacity: 0.46
          }),
          new LuSpatialPointLayer({
            id: 'luspatial-taxi-selection',
            data: [],
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 140, 32, 245],
            longitudeLatitudes: queryEffect.longitudeLatitudes,
            visibleIds: queryEffect.selectedIds,
            drawCommands: queryEffect.drawCommands,
            commandIndex: 1,
            color: [52, 220, 244, 205],
            radiusPixels: 1.25,
            opacity: 0.72
          })
        ]
      });
      loadedDeck.redraw('luSpatial initialized');
    },
    onFinalize: () => {
      resizeObserver.disconnect();
      controls.destroy();
      map.remove();
      if (ownsContainer) container.remove();
    }
  });

  return deck;
}

function createStandaloneContainer(): HTMLDivElement {
  document.body.style.margin = '0';
  document.body.style.background = '#020609';
  const container = document.createElement('div');
  Object.assign(container.style, {position: 'fixed', inset: '0', overflow: 'hidden'});
  document.body.appendChild(container);
  return container;
}

function synchronizeBasemap(map: maplibregl.Map, viewState: TaxiViewState): void {
  map.jumpTo({
    center: [viewState.longitude, viewState.latitude],
    zoom: viewState.zoom,
    pitch: viewState.pitch,
    bearing: viewState.bearing
  });
}

function getTooltip(
  data: ReturnType<typeof makeLuSpatialTaxiData>,
  info: PickingInfo
): {html: string} | null {
  const point = getTaxiPoint(data, info.index);
  if (!point) return null;
  return {
    html: `<div style="font:12px/1.5 ui-monospace,monospace;min-width:190px">
      <div style="color:#64e9ff;font-weight:700">TRIP ROW ${info.index.toLocaleString()}</div>
      <div>longitude&nbsp; ${point.longitude.toFixed(6)}</div>
      <div>latitude&nbsp;&nbsp; ${point.latitude.toFixed(6)}</div>
      <div style="margin-top:4px;color:#91a4b7">Synthetic public-sample expansion</div>
    </div>`
  };
}

type ControlPanelCallbacks = {
  onRadiusChange: (radiusKilometres: number) => void;
  onZoneChange: (zone: TaxiZonePreset) => void;
};

type TaxiControlPanel = {
  destroy: () => void;
  setCoordinate: (coordinate: readonly [number, number], label: string) => void;
  setCustomZone: () => void;
  updateStats: (stats: LuSpatialTaxiQueryStats) => void;
};

function createControlPanel(
  container: HTMLElement,
  zones: readonly TaxiZonePreset[],
  callbacks: ControlPanelCallbacks
): TaxiControlPanel {
  const root = document.createElement('section');
  root.setAttribute('aria-label', 'luSpatial taxi controls');
  Object.assign(root.style, {
    position: 'absolute',
    zIndex: '12',
    left: '16px',
    top: '88px',
    width: 'min(292px, calc(100% - 32px))',
    maxHeight: 'calc(100% - 104px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
    border: '1px solid rgba(113, 226, 255, .22)',
    borderRadius: '10px',
    padding: '12px',
    color: '#e9f6ff',
    background: 'rgba(3, 8, 13, .91)',
    boxShadow: '0 14px 38px rgba(0,0,0,.38)',
    backdropFilter: 'blur(14px)',
    font: '11px/1.35 Inter, ui-sans-serif, system-ui, sans-serif',
    pointerEvents: 'auto'
  });
  root.innerHTML = `<style>
    [data-luspatial-card] input {
      width:100%;box-sizing:border-box;color:#e9f6ff;background:#08131c;
      border:1px solid rgba(126,183,211,.26);border-radius:6px;font:11px ui-monospace,monospace;
    }
    [data-zone-picker] {position:relative;margin-top:3px}
    [data-zone-trigger] {
      position:relative;width:100%;height:21px;padding:0 25px 0 10px;overflow:hidden;
      border:1px solid rgba(81,191,215,.28);border-radius:0;color:#ccebf3;
      clip-path:polygon(2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px),0 2px);
      box-shadow:inset 2px 0 #2adcf5;background-color:rgba(5,16,23,.88);
      background-image:
        linear-gradient(45deg,transparent 46%,#56e7f8 48%,#56e7f8 61%,transparent 63%),
        linear-gradient(135deg,#56e7f8 37%,#56e7f8 50%,transparent 52%),
        linear-gradient(rgba(126,183,211,.18),rgba(126,183,211,.18));
      background-position:calc(100% - 10px) 7px,calc(100% - 7px) 7px,calc(100% - 19px) 50%;
      background-repeat:no-repeat;background-size:4px 4px,4px 4px,1px 11px;
      font:700 8px/1 ui-monospace,monospace;letter-spacing:.08em;text-align:left;text-transform:uppercase;
      cursor:pointer;
    }
    [data-zone-trigger-label] {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    [data-zone-trigger]:hover,[data-zone-trigger][aria-expanded="true"] {border-color:rgba(75,225,247,.58);color:#e8fbff;background-color:rgba(7,25,33,.96)}
    [data-zone-trigger]:focus-visible,[data-zone-option]:focus-visible {outline:1px solid #54e8fa;outline-offset:1px}
    [data-zone-list] {
      display:grid;gap:1px;max-height:184px;margin-top:2px;padding:2px;overflow:auto;
      border:1px solid rgba(71,207,230,.34);background:rgba(2,10,15,.98);
      clip-path:polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px);
      box-shadow:0 10px 24px rgba(0,0,0,.5);
    }
    [data-zone-list][hidden] {display:none}
    [data-zone-option] {
      display:grid;grid-template-columns:54px minmax(0,1fr);align-items:center;gap:5px;width:100%;height:22px;padding:0 7px;
      border:0;border-left:2px solid transparent;color:#9bb4c1;background:rgba(11,24,31,.54);
      font:700 8px/1 ui-monospace,monospace;letter-spacing:.055em;text-align:left;text-transform:uppercase;cursor:pointer;
    }
    [data-zone-option] span:first-child {color:#536d7c;font-size:7px;letter-spacing:.09em}
    [data-zone-option] span:last-child {overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    [data-zone-option]:hover,[data-zone-option]:focus-visible {border-left-color:#5ee9f8;color:#e1f9fd;background:rgba(30,91,104,.34)}
    [data-zone-option][aria-selected="true"] {border-left-color:#2adcf5;color:#6cecff;background:linear-gradient(90deg,rgba(25,187,211,.2),rgba(8,35,43,.56) 42%,rgba(8,24,30,.62))}
    [data-zone-option][aria-selected="true"] span:first-child {color:#4ca6b5}
    [data-zone-list]::-webkit-scrollbar {width:4px}
    [data-zone-list]::-webkit-scrollbar-thumb {background:#235b67}
    [data-zone-list]::-webkit-scrollbar-track {background:#071218}
    [data-luspatial-card] input {accent-color:#36dfff}
    [data-luspatial-label] {color:#71889c;font:600 9px/1.2 ui-monospace,monospace;letter-spacing:.12em}
    [data-luspatial-value] {font:600 11px/1.3 ui-monospace,monospace;color:#dff8ff;font-variant-numeric:tabular-nums}
  </style>
  <div data-luspatial-card>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding-bottom:10px;border-bottom:1px solid rgba(125,180,206,.16)">
      <div><div style="font:700 16px/1.1 ui-sans-serif,system-ui">luSpatial</div><div style="margin-top:3px;color:#7890a4">NYC taxi query explorer</div></div>
      <div style="padding:4px 6px;border:1px solid rgba(54,223,255,.28);border-radius:5px;color:#4be4ff;font:700 9px ui-monospace,monospace">DECK.GL · WEBGPU</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
      <div><div data-luspatial-label>CORPUS</div><div data-luspatial-value>${formatCount(TAXI_CORPUS_POINT_COUNT)}</div></div>
      <div><div data-luspatial-label>GPU RESIDENT</div><div data-luspatial-value data-resident>—</div></div>
      <div><div data-luspatial-label>IN VIEW</div><div data-luspatial-value data-visible>—</div></div>
      <div><div data-luspatial-label>SELECTED</div><div data-luspatial-value data-selected style="color:#49e3ff">—</div></div>
    </div>
    <div style="margin-top:12px"><div data-luspatial-label>TAXI ZONE PRESET</div>
      <div data-zone-picker>
        <button data-zone-trigger type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="luspatial-zone-list" aria-label="Taxi zone preset: Manhattan, Midtown Center"><span data-zone-trigger-label>MANHATTAN · MIDTOWN CENTER</span></button>
        <div data-zone-list id="luspatial-zone-list" role="listbox" aria-label="Taxi zone presets" hidden>
          ${zones.map(zone => `<button data-zone-option="${zone.id}" type="button" role="option" tabindex="-1" aria-selected="${zone.id === INITIAL_ZONE_ID}"><span>${zone.borough}</span><span>${zone.name}</span></button>`).join('')}
        </div>
      </div>
    </div>
    <label style="display:block;margin-top:10px"><span style="display:flex;justify-content:space-between"><span data-luspatial-label>QUERY RADIUS</span><strong data-radius-value style="color:#49e3ff;font:600 10px ui-monospace,monospace">0.35 km</strong></span>
      <input data-radius aria-label="Query radius in kilometres" type="range" min="0.1" max="3" step="0.05" value="0.35" />
    </label>
    <div style="margin-top:9px;padding:8px;border-radius:6px;background:rgba(32,210,242,.07);border:1px solid rgba(42,218,249,.13)">
      <div data-luspatial-label>QUERY CENTER</div><div data-coordinate style="margin-top:3px;color:#cdebf4;font:10px/1.4 ui-monospace,monospace">—</div>
    </div>
    <div style="display:flex;justify-content:space-between;gap:10px;margin-top:9px;color:#6f8598;font:9px/1.35 ui-monospace,monospace">
      <span>CLICK TO MOVE QUERY<br/>DRAG / SCROLL TO NAVIGATE</span>
      <span style="text-align:right"><span data-query-time>—</span> CPU ENCODE<br/>GPU COUNT → INDIRECT DRAW</span>
    </div>
    <details style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(125,180,206,.16)">
      <summary style="cursor:pointer;color:#829bb1;font:700 9px/1.4 ui-monospace,monospace;letter-spacing:.08em">COMMAND GRAPH INSPECTOR</summary>
      <div data-graph-inspector style="margin-top:8px"></div>
    </details>
  </div>`;
  container.appendChild(root);

  const zonePicker = root.querySelector<HTMLElement>('[data-zone-picker]')!;
  const zoneTrigger = root.querySelector<HTMLButtonElement>('[data-zone-trigger]')!;
  const zoneTriggerLabel = root.querySelector<HTMLElement>('[data-zone-trigger-label]')!;
  const zoneList = root.querySelector<HTMLElement>('[data-zone-list]')!;
  const zoneOptions = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-zone-option]'));
  const radiusInput = root.querySelector<HTMLInputElement>('[data-radius]')!;
  const radiusValue = root.querySelector<HTMLElement>('[data-radius-value]')!;
  const coordinateElement = root.querySelector<HTMLElement>('[data-coordinate]')!;
  const residentElement = root.querySelector<HTMLElement>('[data-resident]')!;
  const visibleElement = root.querySelector<HTMLElement>('[data-visible]')!;
  const selectedElement = root.querySelector<HTMLElement>('[data-selected]')!;
  const queryTimeElement = root.querySelector<HTMLElement>('[data-query-time]')!;
  const graphInspectorElement = root.querySelector<HTMLElement>('[data-graph-inspector]')!;
  const graphInspectorPanel = new GPUCommandGraphInspectorPanel(graphInspectorElement, {
    graphLabels: {
      'luspatial-taxi-build-graph': 'Projection + grid build',
      'luspatial-taxi-query-graph': 'Viewport + radius queries'
    }
  });

  const closeZonePicker = (restoreFocus = false) => {
    zoneList.hidden = true;
    zoneTrigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) zoneTrigger.focus();
  };
  const openZonePicker = (focusIndex?: number) => {
    zoneList.hidden = false;
    zoneTrigger.setAttribute('aria-expanded', 'true');
    const selectedIndex = zoneOptions.findIndex(
      option => option.getAttribute('aria-selected') === 'true'
    );
    zoneOptions[focusIndex ?? Math.max(selectedIndex, 0)]?.focus();
  };
  const selectZoneOption = (option: HTMLButtonElement) => {
    const zone = zones.find(candidate => String(candidate.id) === option.dataset.zoneOption);
    if (!zone) return;
    for (const candidate of zoneOptions) {
      candidate.setAttribute('aria-selected', String(candidate === option));
    }
    zoneTriggerLabel.textContent = `${zone.borough} · ${zone.name}`;
    zoneTrigger.setAttribute('aria-label', `Taxi zone preset: ${zone.borough}, ${zone.name}`);
    closeZonePicker(true);
    callbacks.onZoneChange(zone);
  };
  const onZoneTriggerClick = () => {
    if (zoneList.hidden) openZonePicker();
    else closeZonePicker();
  };
  const onZoneTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openZonePicker(event.key === 'ArrowUp' ? zoneOptions.length - 1 : undefined);
    } else if (event.key === 'Escape') {
      closeZonePicker();
    }
  };
  const onZoneOptionClick = (event: Event) => {
    selectZoneOption(event.currentTarget as HTMLButtonElement);
  };
  const onZoneOptionKeyDown = (event: KeyboardEvent) => {
    const option = event.currentTarget as HTMLButtonElement;
    const optionIndex = zoneOptions.indexOf(option);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') nextIndex = (optionIndex + 1) % zoneOptions.length;
    else if (event.key === 'ArrowUp')
      nextIndex = (optionIndex - 1 + zoneOptions.length) % zoneOptions.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = zoneOptions.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectZoneOption(option);
      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeZonePicker(true);
      return;
    } else if (event.key === 'Tab') {
      closeZonePicker();
      return;
    } else if (event.key.length === 1) {
      const search = event.key.toLocaleLowerCase();
      nextIndex = zoneOptions.findIndex(candidate =>
        candidate.textContent?.trim().toLocaleLowerCase().startsWith(search)
      );
    }
    if (nextIndex !== null && nextIndex >= 0) {
      event.preventDefault();
      zoneOptions[nextIndex]?.focus();
    }
  };
  const onDocumentPointerDown = (event: PointerEvent) => {
    if (event.target instanceof Node && !zonePicker.contains(event.target)) closeZonePicker();
  };
  const onRadiusInput = () => {
    const radius = Number(radiusInput.value);
    radiusValue.textContent = `${radius.toFixed(2)} km`;
    callbacks.onRadiusChange(radius);
  };
  zoneTrigger.addEventListener('click', onZoneTriggerClick);
  zoneTrigger.addEventListener('keydown', onZoneTriggerKeyDown);
  for (const option of zoneOptions) {
    option.addEventListener('click', onZoneOptionClick);
    option.addEventListener('keydown', onZoneOptionKeyDown);
  }
  document.addEventListener('pointerdown', onDocumentPointerDown);
  radiusInput.addEventListener('input', onRadiusInput);

  return {
    destroy: () => {
      zoneTrigger.removeEventListener('click', onZoneTriggerClick);
      zoneTrigger.removeEventListener('keydown', onZoneTriggerKeyDown);
      for (const option of zoneOptions) {
        option.removeEventListener('click', onZoneOptionClick);
        option.removeEventListener('keydown', onZoneOptionKeyDown);
      }
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      radiusInput.removeEventListener('input', onRadiusInput);
      graphInspectorPanel.destroy();
      root.remove();
    },
    setCoordinate: (coordinate, label) => {
      coordinateElement.textContent = `${label} · ${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`;
    },
    setCustomZone: () => {
      for (const option of zoneOptions) option.setAttribute('aria-selected', 'false');
      zoneTriggerLabel.textContent = 'CUSTOM MAP QUERY';
      zoneTrigger.setAttribute('aria-label', 'Taxi zone preset: custom map query');
      closeZonePicker();
    },
    updateStats: stats => {
      residentElement.textContent = formatCount(stats.residentPointCount);
      visibleElement.textContent = formatCount(stats.visiblePointCount);
      selectedElement.textContent = formatCount(stats.selectedPointCount);
      queryTimeElement.textContent = `${stats.queryEncodingMilliseconds.toFixed(2)} ms`;
      graphInspectorPanel.update(stats.inspectorSnapshot, 'luspatial-taxi-query-graph');
    }
  };
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}
