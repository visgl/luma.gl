// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView} from '@deck.gl/core';
import {SketchEdgeLayer} from '@deck.gl-community/gpu-layers';
import type {Buffer} from '@luma.gl/core';
import type {SketchStrokeProps} from '@luma.gl/shadertools';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {BuildingMeshLayer} from './building-layer';
import {makeBuildings, makeEdges, ORIGIN} from './building-data';

export function createSketchScene(parent: HTMLDivElement, options: DeckExampleDeviceOptions = {}) {
  const features = makeBuildings();
  const edgeData = makeEdges(features);
  let resolveReady: () => void;
  let rejectReady: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const diagnostics = {frames: 0, backend: '', error: '', selected: '', finalized: false};
  let segments: Buffer | null = null;
  let style: SketchStrokeProps = {
    width: 2.2,
    jitter: 0.85,
    grain: 0.6,
    variation: 0.65,
    extension: 4
  };
  let edgesVisible = true;
  let fillsVisible = true;
  const deck = new Deck({
    parent,
    ...getDeckExampleProps(options),
    views: new MapView({controller: true}),
    initialViewState: {
      longitude: ORIGIN[0],
      latitude: ORIGIN[1],
      zoom: 16.6,
      pitch: 52,
      bearing: -25
    },
    layers: [],
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
      segments = device.createBuffer({id: 'building-edges', data: edgeData});
    },
    onLoad: () => {
      updateLayers();
      resolveReady();
    },
    onAfterRender: () => {
      diagnostics.frames++;
    },
    onError: error => {
      diagnostics.error = error.message;
      rejectReady(error);
    },
    onClick: info => {
      diagnostics.selected = info.object?.name || '';
    },
    getTooltip: info => info.object?.name || null
  });
  function updateLayers() {
    deck.setProps({
      layers: [
        new BuildingMeshLayer({
          id: 'buildings',
          features,
          data: features,
          pickable: true,
          visible: fillsVisible,
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
          coordinateOrigin: ORIGIN
        }),
        edgesVisible &&
          segments &&
          new SketchEdgeLayer({
            id: 'sketch-edges',
            segments,
            segmentCount: edgeData.length / 8,
            data: features,
            style,
            visible: edgesVisible,
            coordinateOrigin: ORIGIN,
            pickable: true
          })
      ]
    });
  }
  return {
    deck,
    features,
    diagnostics,
    ready,
    get segments() {
      return segments;
    },
    setStyle(next: SketchStrokeProps) {
      style = {...style, ...next};
      updateLayers();
    },
    setEdgesVisible(visible: boolean) {
      edgesVisible = visible;
      updateLayers();
    },
    setFillsVisible(visible: boolean) {
      fillsVisible = visible;
      updateLayers();
    },
    rebuildLayers() {
      updateLayers();
    },
    finalize() {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
      segments?.destroy();
      segments = null;
    }
  };
}
