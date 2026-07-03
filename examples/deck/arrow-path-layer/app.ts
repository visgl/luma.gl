// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OrthographicView} from '@deck.gl/core';
import {ArrowPathLayer} from '@deck.gl-community/arrow-layers';
import {ArrowTimeline} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import {ArrowDeck} from '../arrow-deck';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowPathDataSource, type ArrowPathDataSourceUpdate} from './arrow-path-data-source';
import {
  getTemporalCurrentTimeMilliseconds,
  MEASURE_SWEEP_DURATION,
  TEMPORAL_EPOCH_MILLISECONDS,
  TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT
} from '../../arrow/arrow-lines/arrow-line-data';

/** Creates the standalone or website-hosted Deck path-layer example. */
export function createArrowPathLayerDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  const timeline = new ArrowTimeline({
    dataType: new arrow.TimestampMillisecond(),
    initialTime: getTimelineTime(MEASURE_SWEEP_DURATION * 0.25),
    range: [getTimelineTime(0), getTimelineTime(MEASURE_SWEEP_DURATION)],
    playbackRate: 0.24,
    loop: true
  });

  const deck = new ArrowDeck({
    parent,
    ...getDeckExampleProps(options),
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 8},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: [],
    onLoad: ({device}) => dataSource.initialize(device),
    onFinalize: () => dataSource.finalize()
  });

  const dataSource = new ArrowPathDataSource({
    onDataUpdated: (update: ArrowPathDataSourceUpdate) => {
      timeline.pause();
      timeline.setTime(
        getTimelineTime(
          update.animate && update.temporalEnabled
            ? MEASURE_SWEEP_DURATION * 0.25
            : update.currentTime
        )
      );
      if (update.animate && update.temporalEnabled) timeline.play();
      deck.setProps({layers: [makePathLayer(update, timeline)]});
    }
  });

  return deck;
}

function makePathLayer(
  dataSource: ArrowPathDataSourceUpdate,
  timeline: ArrowTimeline
): ArrowPathLayer {
  return new ArrowPathLayer({
    id: 'arrow-paths',
    pickable: true,
    model: dataSource.model ?? 'auto',
    data: dataSource.asyncIterator,
    paths: 'paths',
    color: dataSource.colorColumn
      ? {source: 'colors', nullValue: [199, 219, 245, 235]}
      : [199, 219, 245, 235],
    width: dataSource.widthColumn ? {source: 'widths', nullValue: 0.0035} : 0.0035,
    currentTime: dataSource.currentTime,
    timeline: dataSource.temporalEnabled ? timeline : undefined,
    timelineOrigin: TEMPORAL_EPOCH_MILLISECONDS,
    timelineScale: 1 / TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT,
    trailLength: dataSource.trailLength,
    temporalEnabled: dataSource.temporalEnabled,
    ...dataSource.layerProps
  });
}

function getTimelineTime(measureTime: number): bigint {
  return TEMPORAL_EPOCH_MILLISECONDS + BigInt(getTemporalCurrentTimeMilliseconds(measureTime));
}
