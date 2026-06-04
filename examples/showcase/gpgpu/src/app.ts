// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {luma, type Device} from '@luma.gl/core';
import {cleanEvaluate, type GPUTableEvaluator} from '@luma.gl/gpgpu';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {makeShowcaseData} from './arrow-data';
import {evaluateExpression} from './expression';
import {
  makeEvaluatorTableColumn,
  makeSegmentedEvaluatorTableColumn,
  VirtualGPUTableRenderer,
  type RenderedTableElements,
  type TableColumn
} from './table-renderer';

const DEFAULT_ROW_COUNT = 10_000_000;
const MAXIMUM_ROW_COUNT = 10_000_000;
const EXPRESSION_QUERY_PARAMETER = 'expression';

let evaluationDevicePromise: Promise<Device> | null = null;

initializeGPGPUShowcase();

function initializeGPGPUShowcase(): void {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('GPGPU showcase requires #app');
  }

  const elements = getRenderedTableElements();
  const expressionElements = getExpressionElements();
  const requestedExpression = getRequestedExpression();
  if (requestedExpression !== null) {
    expressionElements.input.value = requestedExpression;
  }

  window.requestAnimationFrame(() => {
    const rowCount = getRequestedRowCount();
    const startedAt = performance.now();
    const data = makeShowcaseData(rowCount);
    updateMetadata({
      rows: formatInteger(data.rowCount),
      columns: formatInteger(data.columns.length),
      metricValues: formatInteger(data.metricValueCount),
      arrowBatches: formatInteger(data.table.batches.length)
    });

    const renderer = new VirtualGPUTableRenderer(elements, data.columns, data.rowCount);
    renderer.mount();
    expressionElements.runButton.disabled = false;
    expressionElements.form.addEventListener('submit', event => {
      event.preventDefault();
      void runExpression({
        expression: expressionElements.input.value,
        messageElement: expressionElements.message,
        renderer,
        sourceColumns: data.columns,
        expressionInputs: data.expressionInputs,
        persistExpression: true
      });
    });

    if (requestedExpression !== null) {
      void runExpression({
        expression: requestedExpression,
        messageElement: expressionElements.message,
        renderer,
        sourceColumns: data.columns,
        expressionInputs: data.expressionInputs,
        persistExpression: false
      });
    }

    const elapsedMilliseconds = performance.now() - startedAt;
    elements.status.textContent = [
      `${formatInteger(data.rowCount)} Arrow rows`,
      `${formatInteger(data.metricValueCount)} sample metric values`,
      `generated in ${formatDuration(elapsedMilliseconds)}`
    ].join(' · ');

    window.addEventListener(
      'beforeunload',
      () => {
        renderer.destroy();
        void evaluationDevicePromise?.then(device => device.destroy());
      },
      {once: true}
    );
  });
}

function getRenderedTableElements(): RenderedTableElements {
  return {
    scrollContainer: getRequiredElement('table-scroll'),
    headerRow: getRequiredElement('table-header'),
    rowLayer: getRequiredElement('table-row-layer'),
    status: getRequiredElement('table-status')
  };
}

function getExpressionElements(): {
  form: HTMLFormElement;
  input: HTMLInputElement;
  runButton: HTMLButtonElement;
  message: HTMLElement;
} {
  return {
    form: getRequiredElement('expression-form'),
    input: getRequiredElement('expression-input'),
    runButton: getRequiredElement('expression-run'),
    message: getRequiredElement('expression-message')
  };
}

async function runExpression({
  expression,
  messageElement,
  renderer,
  sourceColumns,
  expressionInputs,
  persistExpression
}: {
  expression: string;
  messageElement: HTMLElement;
  renderer: VirtualGPUTableRenderer;
  sourceColumns: Parameters<VirtualGPUTableRenderer['setColumns']>[0];
  expressionInputs: Parameters<typeof evaluateExpression>[1];
  persistExpression: boolean;
}): Promise<void> {
  let evaluationStartedAt: number | null = null;
  try {
    const trimmedExpression = expression.trim();
    if (!trimmedExpression) {
      throw new Error('Enter an expression');
    }

    if (persistExpression) {
      setExpressionQueryParameter(trimmedExpression);
    }
    evaluationStartedAt = performance.now();
    messageElement.textContent = 'Evaluating expression...';
    const output = evaluateExpression(trimmedExpression, expressionInputs);

    const device = await getEvaluationDevice();
    await cleanEvaluate(device, {
      ...expressionInputs,
      output
    });

    const outputColumn = await makeOutputTableColumn(output, renderer.rowCount, sourceColumns);
    renderer.setColumns([...sourceColumns, outputColumn]);
    renderer.scrollToLastColumn();
    messageElement.textContent = `output = ${output} · evaluated in ${formatDuration(
      performance.now() - evaluationStartedAt
    )}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    messageElement.textContent =
      evaluationStartedAt === null
        ? message
        : `${message} · failed after ${formatDuration(performance.now() - evaluationStartedAt)}`;
  }
}

async function makeOutputTableColumn(
  output: GPUTableEvaluator,
  rowCount: number,
  sourceColumns: TableColumn[]
): Promise<TableColumn> {
  if (output.length === rowCount) {
    return makeEvaluatorTableColumn('output', formatEvaluatorType(output), output);
  }
  if (output.length > rowCount) {
    const metricStartIndices = getMetricStartIndicesEvaluator(sourceColumns);
    await validateMetricSegmentedOutput(output, metricStartIndices, rowCount);
    return makeSegmentedEvaluatorTableColumn(
      'output',
      `List<${formatEvaluatorType(output)}>`,
      output,
      metricStartIndices
    );
  }

  throw new Error(
    `Output length ${formatInteger(output.length)} is smaller than table row count ${formatInteger(rowCount)}`
  );
}

async function getEvaluationDevice(): Promise<Device> {
  if (!evaluationDevicePromise) {
    evaluationDevicePromise = luma.createDevice({
      adapters: [webgpuAdapter, webgl2Adapter],
      createCanvasContext:
        typeof OffscreenCanvas === 'undefined'
          ? true
          : {
              canvas: new OffscreenCanvas(1, 1),
              width: 1,
              height: 1,
              autoResize: false,
              useDevicePixels: false
            }
    });
  }
  return evaluationDevicePromise;
}

function getMetricStartIndicesEvaluator(sourceColumns: TableColumn[]): GPUTableEvaluator {
  const metricsColumn = sourceColumns.find(column => column.id === 'sampleMetrics');
  if (!metricsColumn || metricsColumn.kind !== 'segmented') {
    throw new Error('Cannot display longer output without sampleMetrics start indices');
  }
  return metricsColumn.startIndicesEvaluator;
}

async function validateMetricSegmentedOutput(
  output: GPUTableEvaluator,
  metricStartIndices: GPUTableEvaluator,
  rowCount: number
): Promise<void> {
  if (metricStartIndices.length !== rowCount + 1) {
    throw new Error(
      `sampleMetrics start indices length ${formatInteger(metricStartIndices.length)} does not match row count ${formatInteger(rowCount)}`
    );
  }

  const terminalStartIndex = await metricStartIndices.readValue(rowCount, rowCount + 1);
  const metricValueCount = Number(terminalStartIndex[0] ?? 0);
  if (metricValueCount > output.length) {
    throw new Error(
      `Output length ${formatInteger(output.length)} is smaller than sampleMetrics value count ${formatInteger(metricValueCount)}`
    );
  }
}

function formatEvaluatorType(evaluator: GPUTableEvaluator): string {
  return `${evaluator.type}${evaluator.size === 1 ? '' : `x${evaluator.size}`}`;
}

function updateMetadata(values: {
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

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1_000) {
    return `${milliseconds.toFixed(0)} ms`;
  }
  return `${(milliseconds / 1_000).toFixed(1)} s`;
}

function getRequestedRowCount(): number {
  const params = new URLSearchParams(window.location.search);
  const requestedRows = Number(params.get('rows') ?? DEFAULT_ROW_COUNT);
  if (!Number.isFinite(requestedRows) || requestedRows <= 0) {
    return DEFAULT_ROW_COUNT;
  }
  return Math.min(MAXIMUM_ROW_COUNT, Math.floor(requestedRows));
}

function getRequestedExpression(): string | null {
  const encodedExpression = new URLSearchParams(window.location.search).get(
    EXPRESSION_QUERY_PARAMETER
  );
  if (encodedExpression === null) {
    return null;
  }
  return decodeBase64URL(encodedExpression);
}

function setExpressionQueryParameter(expression: string): void {
  const params = new URLSearchParams(window.location.search);
  params.set(EXPRESSION_QUERY_PARAMETER, encodeBase64URL(expression));
  const search = params.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
  );
}

function encodeBase64URL(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binaryValue = '';
  for (const byte of bytes) {
    binaryValue += String.fromCharCode(byte);
  }
  return window.btoa(binaryValue).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeBase64URL(value: string): string {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binaryValue = window.atob(paddedBase64);
  const bytes = new Uint8Array(binaryValue.length);
  for (let index = 0; index < binaryValue.length; index++) {
    bytes[index] = binaryValue.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}
