// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {StoragePathModel, StorageTripsPathModel} from '@luma.gl/arrow';
import type {GPUVector} from '@luma.gl/tables';
import type {ArrowPathControlPanelMetrics} from './control-panel';
import type {
  ArrowPathLayer,
  ArrowPathLayerActiveModel,
  ArrowPathLayerInput
} from './arrow-path-layer';

// PathLayer-style estimate: four vec3 position attributes plus width, color, picking, and type.
export const DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT = 60;

export function getArrowPathMetrics(
  pathLayer: ArrowPathLayer,
  pathInput: ArrowPathLayerInput
): ArrowPathControlPanelMetrics {
  const pathModel = pathLayer.model;
  const pathArrowBytes = pathInput.pathArrowByteLength;
  const styleArrowBytes = pathInput.styleArrowByteLength;
  const segmentCount = getGeneratedPathSegmentCount(pathModel);
  const pathGpuBytes = getPathCoordinateGpuByteLength(pathInput, pathModel);
  const transientPathGpuBytes = getTransientPathGpuByteLength(pathModel);
  const peakPathGpuBytes = pathGpuBytes + transientPathGpuBytes;
  const styleGpuBytes = getPathStyleGpuByteLength(pathInput, pathModel);
  const totalArrowBytes = pathArrowBytes + styleArrowBytes;
  const totalGpuBytes = pathGpuBytes + styleGpuBytes;
  const peakTotalGpuBytes = peakPathGpuBytes + styleGpuBytes;
  const deckGpuBytes = segmentCount * DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT;

  return {
    pathCount: formatInteger(pathInput.paths.length),
    segmentCount: formatInteger(segmentCount),
    pathArrowBytes: formatByteLength(pathArrowBytes),
    pathGpuBytes:
      transientPathGpuBytes > 0
        ? `${formatByteLength(pathGpuBytes)}\n${formatByteLength(peakPathGpuBytes)} peak`
        : formatByteLength(pathGpuBytes),
    pathGpuExpansion:
      transientPathGpuBytes > 0
        ? `${formatExpansionRatio(pathGpuBytes, pathArrowBytes)}\n${formatExpansionRatio(
            peakPathGpuBytes,
            pathArrowBytes
          )} peak`
        : formatExpansionRatio(pathGpuBytes, pathArrowBytes),
    pathPrepTime: `${getPathModelPrepTimeMs(pathModel).toFixed(1)} ms`,
    styleArrowBytes: formatByteLength(styleArrowBytes),
    styleGpuBytes: formatByteLength(styleGpuBytes),
    styleGpuExpansion: formatExpansionRatio(styleGpuBytes, styleArrowBytes),
    styleBuildTime: `${pathInput.arrowVectorBuildTimeMs.toFixed(1)} ms`,
    totalArrowBytes: formatByteLength(totalArrowBytes),
    totalGpuBytes:
      transientPathGpuBytes > 0
        ? `${formatByteLength(totalGpuBytes)}\n${formatByteLength(peakTotalGpuBytes)} peak`
        : formatByteLength(totalGpuBytes),
    totalGpuExpansion:
      transientPathGpuBytes > 0
        ? `${formatExpansionRatio(totalGpuBytes, totalArrowBytes)}\n${formatExpansionRatio(
            peakTotalGpuBytes,
            totalArrowBytes
          )} peak`
        : formatExpansionRatio(totalGpuBytes, totalArrowBytes),
    deckGpuBytes: formatByteLength(deckGpuBytes),
    deckGpuExpansion: formatExpansionRatio(deckGpuBytes, totalArrowBytes)
  };
}

function getPathCoordinateGpuByteLength(
  pathInput: ArrowPathLayerInput,
  pathModel: ArrowPathLayerActiveModel
): number {
  const storagePathRangeGpuBytes = isStoragePathModel(pathModel)
    ? pathModel.pathRangeByteLength
    : 0;
  return (
    getGpuVectorByteLength(pathInput.paths) +
    (pathInput.timestamps ? getGpuVectorByteLength(pathInput.timestamps) : 0) +
    (pathInput.viewOrigins ? getGpuVectorByteLength(pathInput.viewOrigins) : 0) +
    storagePathRangeGpuBytes +
    getGeneratedPathGpuByteLength(pathModel)
  );
}

function getGeneratedPathGpuByteLength(pathModel: ArrowPathLayerActiveModel): number {
  if (isStoragePathModel(pathModel)) {
    return pathModel.generatedRenderBufferByteLength;
  }
  return pathModel.renderBatches.reduce(
    (byteLength, renderBatch) =>
      byteLength +
      renderBatch.expandedPathVertexData.byteLength +
      renderBatch.pathViewOriginData.byteLength,
    0
  );
}

function getTransientPathGpuByteLength(pathModel: ArrowPathLayerActiveModel): number {
  return isStoragePathModel(pathModel) ? pathModel.transientComputeInputByteLength : 0;
}

function getGeneratedPathSegmentCount(pathModel: ArrowPathLayerActiveModel): number {
  return isStoragePathModel(pathModel)
    ? pathModel.segmentCount
    : pathModel.segmentLayout.segmentCount;
}

function getPathStyleGpuByteLength(
  pathInput: ArrowPathLayerInput,
  pathModel: ArrowPathLayerActiveModel
): number {
  const sourceStyleGpuBytes =
    (pathInput.colors ? getGpuVectorByteLength(pathInput.colors) : 0) +
    getGpuVectorByteLength(pathInput.widths);
  if (isStoragePathModel(pathModel)) {
    return sourceStyleGpuBytes + pathModel.rowStorageByteLength;
  }
  const expandedStyleGpuBytes = Object.values(pathModel.table?.gpuVectors || {}).reduce(
    (byteLength, vector) => byteLength + getGpuVectorByteLength(vector),
    0
  );
  return sourceStyleGpuBytes + expandedStyleGpuBytes;
}

function getPathModelPrepTimeMs(pathModel: ArrowPathLayerActiveModel): number {
  return isStoragePathModel(pathModel)
    ? pathModel.pathRangeBuildTimeMs
    : pathModel.segmentAttributeBuildTimeMs;
}

function isStoragePathModel(
  pathModel: ArrowPathLayerActiveModel
): pathModel is StoragePathModel | StorageTripsPathModel {
  return pathModel instanceof StoragePathModel || pathModel instanceof StorageTripsPathModel;
}

function getGpuVectorByteLength(vector: GPUVector<any>): number {
  return vector.data.reduce((byteLength, data) => {
    const variableLengthByteLength = data.readbackMetadata?.valueByteLength;
    return (
      byteLength +
      (variableLengthByteLength !== undefined
        ? variableLengthByteLength
        : data.length * data.byteStride)
    );
  }, 0);
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatExpansionRatio(byteLength: number, arrowByteLength: number): string {
  const expansionFactor =
    Number.isFinite(arrowByteLength) && arrowByteLength > 0 ? byteLength / arrowByteLength : null;
  if (expansionFactor === null || !Number.isFinite(expansionFactor)) {
    return '-';
  }
  const precision = expansionFactor < 10 ? 1 : 0;
  return `${expansionFactor.toFixed(precision).replace(/\.0$/, '')}x`;
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${formatInteger(byteLength)} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${formatMetricDigits(byteLength / 1000)} kB`;
  }
  if (byteLength < 1000 ** 3) {
    return `${formatMetricDigits(byteLength / 1000 ** 2)} MB`;
  }
  return `${formatMetricDigits(byteLength / 1000 ** 3)} GB`;
}

function formatMetricDigits(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 2}).format(value);
}
