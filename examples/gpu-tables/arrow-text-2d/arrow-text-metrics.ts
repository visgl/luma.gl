// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowVectorByteLength} from '@luma.gl/arrow';
import type {GPUVector} from '@luma.gl/tables';
import {AttributeTextModel, DictionaryTextModel, StorageTextModel} from '@luma.gl/text';
import type {ArrowText2DControlPanelMetrics} from './control-panel';
import type {
  ArrowTextLayer,
  ArrowTextLayerActiveModel,
  ArrowTextLayerInput
} from './arrow-text-layer';

// IconLayer + MultiIconLayer character attributes, assuming float32 positions in the active path.
export const DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH = 80;

export type ArrowTextMetricProps = {
  textModel: ArrowTextLayerActiveModel;
  textInput: ArrowTextLayerInput;
  arrowVectorBuildTimeMs: number;
  colorEnabled: boolean;
  angleEnabled: boolean;
  sizeEnabled: boolean;
};

export function getArrowTextLayerMetrics(
  textLayer: ArrowTextLayer,
  textInput: ArrowTextLayerInput,
  arrowVectorBuildTimeMs: number
): ArrowText2DControlPanelMetrics {
  return getArrowTextMetrics({
    textModel: textLayer.model,
    textInput,
    arrowVectorBuildTimeMs,
    colorEnabled: Boolean(textInput.colors),
    angleEnabled: Boolean(textInput.angles),
    sizeEnabled: Boolean(textInput.sizes)
  });
}

export function getArrowTextMetrics({
  textModel,
  textInput,
  arrowVectorBuildTimeMs,
  colorEnabled,
  angleEnabled,
  sizeEnabled
}: ArrowTextMetricProps): ArrowText2DControlPanelMetrics {
  const rowStorageByteLength =
    textModel instanceof StorageTextModel || textModel instanceof DictionaryTextModel
      ? textModel.rowStorageByteLength
      : 0;
  const glyphDefinitionStorageByteLength =
    textModel instanceof StorageTextModel || textModel instanceof DictionaryTextModel
      ? textModel.glyphDefinitionStorageByteLength
      : 0;
  const transientComputeInputByteLength =
    textModel instanceof StorageTextModel || textModel instanceof DictionaryTextModel
      ? textModel.transientComputeInputByteLength
      : 0;
  const compressedDictionaryStorageByteLength =
    textModel instanceof DictionaryTextModel ? textModel.compactStreamByteLength : 0;
  const styleArrowByteLength = getSelectedArrowStyleVectorByteLength(
    textInput,
    colorEnabled,
    angleEnabled,
    sizeEnabled
  );
  const styleGpuByteLength = getSelectedStyleColumnGpuByteLength(
    textModel,
    textInput,
    colorEnabled,
    angleEnabled,
    sizeEnabled
  );
  const textGpuByteLength =
    textModel instanceof AttributeTextModel
      ? Math.max(0, textModel.glyphAttributeByteLength - styleGpuByteLength)
      : textModel.glyphAttributeByteLength +
        rowStorageByteLength +
        glyphDefinitionStorageByteLength +
        compressedDictionaryStorageByteLength;
  const totalArrowByteLength = textInput.arrowVectorByteLength + styleArrowByteLength;
  const totalGpuByteLength = textGpuByteLength + styleGpuByteLength;
  const totalBuildTimeMs = textModel.glyphAttributeBuildTimeMs + arrowVectorBuildTimeMs;
  const deckAttributeByteLength =
    getTextModelGlyphCount(textModel) * DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH;

  return {
    arrowVectorBytes: formatByteLength(textInput.arrowVectorByteLength),
    styleArrowBytes: formatByteLength(styleArrowByteLength),
    arrowVectorBuildTime: arrowVectorBuildTimeMs.toFixed(1) + 'ms',
    cpuGenerationTime: textModel.glyphAttributeBuildTimeMs.toFixed(1) + 'ms',
    totalGpuBytes: formatByteLength(textGpuByteLength),
    textGpuExpansion: formatExpansionRatio(textGpuByteLength, textInput.arrowVectorByteLength),
    gpuStyleVectorBytes: formatByteLength(styleGpuByteLength),
    styleGpuExpansion: formatExpansionRatio(styleGpuByteLength, styleArrowByteLength),
    computeGpuBytes: formatByteLength(transientComputeInputByteLength),
    computeGpuExpansion:
      transientComputeInputByteLength > 0
        ? formatExpansionRatio(transientComputeInputByteLength, totalArrowByteLength)
        : '-',
    totalArrowBytes: formatByteLength(totalArrowByteLength),
    totalLumaGpuBytes: formatByteLength(totalGpuByteLength),
    totalLumaGpuExpansion: formatExpansionRatio(totalGpuByteLength, totalArrowByteLength),
    totalBuildTime: totalBuildTimeMs.toFixed(1) + 'ms',
    deckAttributeSize: formatByteLength(deckAttributeByteLength),
    deckGpuExpansion: formatExpansionRatio(
      deckAttributeByteLength,
      textInput.arrowVectorByteLength + styleArrowByteLength
    )
  };
}

function getSelectedStyleColumnGpuByteLength(
  textModel: ArrowTextLayerActiveModel,
  textInput: ArrowTextLayerInput,
  colorEnabled: boolean,
  angleEnabled: boolean,
  sizeEnabled: boolean
): number {
  if (textModel instanceof AttributeTextModel) {
    return getSelectedExpandedAttributeStyleVectorByteLength(
      textModel,
      textInput,
      colorEnabled,
      angleEnabled,
      sizeEnabled
    );
  }
  if (!(textModel instanceof StorageTextModel || textModel instanceof DictionaryTextModel)) {
    return 0;
  }

  return (
    (colorEnabled && textInput.colors ? getGpuVectorByteLength(textInput.colors) : 0) +
    (angleEnabled && textInput.angles ? getGpuVectorByteLength(textInput.angles) : 0) +
    (sizeEnabled && textInput.sizes ? getGpuVectorByteLength(textInput.sizes) : 0)
  );
}

function getSelectedExpandedAttributeStyleVectorByteLength(
  textModel: ArrowTextLayerActiveModel,
  textInput: ArrowTextLayerInput,
  colorEnabled: boolean,
  angleEnabled: boolean,
  sizeEnabled: boolean
): number {
  const glyphCount = getTextModelGlyphCount(textModel);
  return (
    (colorEnabled && textInput.colors
      ? getExpandedAttributeVectorByteLength(textInput.colors, glyphCount)
      : 0) +
    (angleEnabled && textInput.angles
      ? getExpandedAttributeVectorByteLength(textInput.angles, glyphCount)
      : 0) +
    (sizeEnabled && textInput.sizes
      ? getExpandedAttributeVectorByteLength(textInput.sizes, glyphCount)
      : 0)
  );
}

function getSelectedArrowStyleVectorByteLength(
  textInput: ArrowTextLayerInput,
  colorEnabled: boolean,
  angleEnabled: boolean,
  sizeEnabled: boolean
): number {
  return (
    (colorEnabled && textInput.sourceVectors.colors
      ? getArrowVectorByteLength(textInput.sourceVectors.colors)
      : 0) +
    (angleEnabled && textInput.sourceVectors.angles
      ? getArrowVectorByteLength(textInput.sourceVectors.angles)
      : 0) +
    (sizeEnabled && textInput.sourceVectors.sizes
      ? getArrowVectorByteLength(textInput.sourceVectors.sizes)
      : 0)
  );
}

function getTextModelGlyphCount(textModel: ArrowTextLayerActiveModel): number {
  return textModel instanceof StorageTextModel || textModel instanceof DictionaryTextModel
    ? textModel.glyphCount
    : textModel.glyphLayout.glyphCount;
}

function getGpuVectorByteLength(vector: GPUVector): number {
  return vector.data.reduce((byteLength, data) => byteLength + data.buffer.byteLength, 0);
}

function getExpandedAttributeVectorByteLength(vector: GPUVector, glyphCount: number): number {
  return (vector.data[0]?.byteStride ?? 0) * glyphCount;
}

function formatExpansionRatio(byteLength: number, arrowByteLength: number): string {
  return formatExpansionFactor(arrowByteLength > 0 ? byteLength / arrowByteLength : null);
}

function formatExpansionFactor(expansionFactor: number | null): string {
  if (expansionFactor === null || !Number.isFinite(expansionFactor)) {
    return '-';
  }
  return expansionFactor.toFixed(expansionFactor < 10 ? 1 : 0) + 'x';
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1024) {
    return byteLength + ' B';
  }
  const units = ['KB', 'MB', 'GB'];
  let value = byteLength / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return value.toFixed(value < 10 ? 1 : 0) + ' ' + units[unitIndex];
}
