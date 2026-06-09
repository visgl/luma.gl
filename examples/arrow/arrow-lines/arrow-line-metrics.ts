// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {StoragePathModel, StorageTripsPathModel, type GPUVector} from '@luma.gl/tables';
import type {ArrowLineControlPanelMetrics} from './control-panel';
import type {
  ArrowLineRenderer,
  ArrowLineRendererActiveModel,
  ArrowLineRendererInput
} from './arrow-line-renderer';

// PathLayer-style estimate: four vec3 position attributes plus width, color, picking, and type.
export const DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT = 60;

export function getArrowLineMetrics(
  pathRenderer: ArrowLineRenderer,
  pathInput: ArrowLineRendererInput,
  arrowVectorBuildTimeMs: number
): ArrowLineControlPanelMetrics {
  const pathModel = pathRenderer.model;
  const pathArrowBytes = pathInput.pathArrowByteLength;
  const styleArrowBytes = pathInput.styleArrowByteLength;
  const segmentCount = getGeneratedPathSegmentCount(pathModel);
  const pathGpuBytes = getPathCoordinateGpuByteLength(pathInput, pathModel);
  const transientPathGpuBytes = getTransientPathGpuByteLength(pathModel);
  const styleGpuBytes = getPathStyleGpuByteLength(pathInput, pathModel);
  const totalArrowBytes = pathArrowBytes + styleArrowBytes;
  const totalGpuBytes = pathGpuBytes + styleGpuBytes;
  const deckGpuBytes = segmentCount * DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT;

  return {
    pathCount: formatInteger(pathInput.paths.length),
    segmentCount: formatInteger(segmentCount),
    pathArrowBytes: formatByteLength(pathArrowBytes),
    pathGpuBytes: formatByteLength(pathGpuBytes),
    pathGpuExpansion: formatExpansionRatio(pathGpuBytes, pathArrowBytes),
    pathPrepTime: `${getPathModelPrepTimeMs(pathInput, pathModel).toFixed(1)}ms`,
    styleArrowBytes: formatByteLength(styleArrowBytes),
    styleGpuBytes: formatByteLength(styleGpuBytes),
    styleGpuExpansion: formatExpansionRatio(styleGpuBytes, styleArrowBytes),
    styleBuildTime: `${arrowVectorBuildTimeMs.toFixed(1)}ms`,
    computeGpuBytes: formatByteLength(transientPathGpuBytes),
    computeGpuExpansion:
      transientPathGpuBytes > 0
        ? formatExpansionRatio(transientPathGpuBytes, totalArrowBytes)
        : '-',
    totalArrowBytes: formatByteLength(totalArrowBytes),
    totalGpuBytes: formatByteLength(totalGpuBytes),
    totalGpuExpansion: formatExpansionRatio(totalGpuBytes, totalArrowBytes),
    deckGpuBytes: formatByteLength(deckGpuBytes),
    deckGpuExpansion: formatExpansionRatio(deckGpuBytes, totalArrowBytes)
  };
}

function getPathCoordinateGpuByteLength(
  pathInput: ArrowLineRendererInput,
  pathModel: ArrowLineRendererActiveModel | null
): number {
  const storagePathRangeGpuBytes =
    pathModel && isStoragePathModel(pathModel) ? pathModel.pathRangeByteLength : 0;
  return (
    getGpuVectorByteLength(pathInput.paths) +
    (pathInput.timestamps ? getGpuVectorByteLength(pathInput.timestamps) : 0) +
    (pathInput.viewOrigins ? getGpuVectorByteLength(pathInput.viewOrigins) : 0) +
    storagePathRangeGpuBytes +
    getGeneratedPathGpuByteLength(pathModel)
  );
}

function getGeneratedPathGpuByteLength(pathModel: ArrowLineRendererActiveModel | null): number {
  if (!pathModel) {
    return 0;
  }
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

function getTransientPathGpuByteLength(pathModel: ArrowLineRendererActiveModel | null): number {
  return pathModel && isStoragePathModel(pathModel) ? pathModel.transientComputeInputByteLength : 0;
}

function getGeneratedPathSegmentCount(pathModel: ArrowLineRendererActiveModel | null): number {
  if (!pathModel) {
    return 0;
  }
  return isStoragePathModel(pathModel)
    ? pathModel.segmentCount
    : pathModel.segmentLayout.segmentCount;
}

function getPathStyleGpuByteLength(
  pathInput: ArrowLineRendererInput,
  pathModel: ArrowLineRendererActiveModel | null
): number {
  const sourceStyleGpuBytes =
    (pathInput.colors ? getGpuVectorByteLength(pathInput.colors) : 0) +
    getGpuVectorByteLength(pathInput.widths);
  if (!pathModel) {
    return sourceStyleGpuBytes;
  }
  if (isStoragePathModel(pathModel)) {
    return sourceStyleGpuBytes + pathModel.rowStorageByteLength;
  }
  const expandedStyleGpuBytes = Object.values(pathModel.table?.gpuVectors || {}).reduce(
    (byteLength, vector) => byteLength + getGpuVectorByteLength(vector),
    0
  );
  return sourceStyleGpuBytes + expandedStyleGpuBytes;
}

function getPathModelPrepTimeMs(
  pathInput: ArrowLineRendererInput,
  pathModel: ArrowLineRendererActiveModel | null
): number {
  if (!pathModel) {
    return 0;
  }
  if (isStoragePathModel(pathModel)) {
    return pathModel.pathRangeBuildTimeMs;
  }
  return pathInput.model === 'attribute'
    ? pathInput.pathState.segmentTable.segmentAttributeBuildTimeMs
    : 0;
}

function isStoragePathModel(
  pathModel: ArrowLineRendererActiveModel
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
