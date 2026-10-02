// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RenderedTableElements} from './table-renderer';

export type GPGPUExpressionElements = {
  form: HTMLFormElement;
  input: HTMLInputElement;
  runButton: HTMLButtonElement;
  message: HTMLElement;
};

export function getGPGPUShowcaseRoot(): HTMLElement {
  return getRequiredElement('app');
}

export function getRenderedTableElements(): RenderedTableElements {
  return {
    scrollContainer: getRequiredElement('table-scroll'),
    headerRow: getRequiredElement('table-header'),
    rowLayer: getRequiredElement('table-row-layer'),
    status: getRequiredElement('table-status')
  };
}

export function getExpressionElements(): GPGPUExpressionElements {
  return {
    form: getRequiredElement('expression-form'),
    input: getRequiredElement('expression-input'),
    runButton: getRequiredElement('expression-run'),
    message: getRequiredElement('expression-message')
  };
}

export function updateMetadata(values: {
  rows: string;
  columns: string;
  metricValues: string;
  arrowBatches: string;
}): void {
  getRequiredElement('metadata-rows').textContent = values.rows;
  getRequiredElement('metadata-columns').textContent = values.columns;
  getRequiredElement('metadata-metric-values').textContent = values.metricValues;
  getRequiredElement('metadata-arrow-batches').textContent = values.arrowBatches;
}

function getRequiredElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`GPGPU showcase requires #${id}`);
  }
  return element as T;
}
