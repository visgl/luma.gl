// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUTableEvaluator} from '@luma.gl/gpgpu';
import {Virtualizer, observeElementRect, type VirtualItem} from '@tanstack/virtual-core';

const ROW_HEIGHT = 34;
const ROW_OVERSCAN = 12;
const MAXIMUM_CELL_VALUES = 12;
const MAXIMUM_PHYSICAL_SCROLL_SIZE = 16_000_000;
const READ_CHUNK_ROWS = 128;
const ROW_INDEX_COLUMN_WIDTH = 112;
const SCALAR_COLUMN_WIDTH = 120;
const VECTOR_COLUMN_WIDTH = 300;
const SEGMENTED_COLUMN_WIDTH = 320;
const VALUE_WIDTH = 72;
const MAXIMUM_VECTOR_COLUMN_WIDTH = 520;

export type TableValueArray =
  | Float32Array
  | Float64Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array;

type BaseTableColumn = {
  id: string;
  logicalType: string;
  evaluator?: GPUTableEvaluator;
  getRowText: (rowIndex: number) => string | Promise<string>;
};

type EvaluatorRowChunk = {
  startRow: number;
  endRow: number;
  values: TableValueArray;
};

type PendingEvaluatorRowChunk = {
  startRow: number;
  endRow: number;
  promise: Promise<EvaluatorRowChunk>;
};

type EvaluatorRowChunkRange = Pick<EvaluatorRowChunk, 'startRow' | 'endRow'>;

export type EvaluatorTableColumn = BaseTableColumn & {
  kind: 'evaluator';
  evaluator: GPUTableEvaluator;
};

export type SegmentedTableColumn = BaseTableColumn & {
  kind: 'segmented';
  valuesEvaluator: GPUTableEvaluator;
  startIndicesEvaluator: GPUTableEvaluator;
};

export type TableColumn = EvaluatorTableColumn | SegmentedTableColumn;

export type RenderedTableElements = {
  scrollContainer: HTMLElement;
  headerRow: HTMLElement;
  rowLayer: HTMLElement;
  status: HTMLElement;
};

export class VirtualGPUTableRenderer {
  readonly rowCount: number;
  columns: TableColumn[];
  readonly elements: RenderedTableElements;
  readonly virtualizer: Virtualizer<HTMLElement, Element>;
  private cleanupCallback: (() => void) | undefined;
  private readonly handleHeaderScroll = (): void => this.syncHeaderScroll();
  private renderVersion = 0;
  private gridTemplateColumns = '';
  private gridMinimumWidth = 0;

  constructor(elements: RenderedTableElements, columns: TableColumn[], rowCount: number) {
    this.elements = elements;
    this.columns = columns;
    this.rowCount = rowCount;
    this.updateGridLayout();
    this.renderHeader();

    this.virtualizer = new Virtualizer<HTMLElement, Element>({
      count: rowCount,
      estimateSize: () => ROW_HEIGHT,
      getScrollElement: () => this.elements.scrollContainer,
      observeElementOffset: this.observeScaledElementOffset,
      observeElementRect,
      onChange: () => this.renderRows(),
      overscan: ROW_OVERSCAN,
      scrollToFn: this.scaledElementScroll
    });
  }

  setColumns(columns: TableColumn[]): void {
    this.columns = columns;
    this.updateGridLayout();
    this.renderHeader();
    this.renderRows();
  }

  scrollToLastColumn(): void {
    requestAnimationFrame(() => {
      this.elements.scrollContainer.scrollLeft = this.elements.scrollContainer.scrollWidth;
      this.syncHeaderScroll();
    });
  }

  mount(): void {
    this.elements.scrollContainer.addEventListener('scroll', this.handleHeaderScroll);
    this.cleanupCallback = this.virtualizer._didMount();
    this.virtualizer._willUpdate();
    this.syncHeaderScroll();
    this.renderRows();
  }

  destroy(): void {
    this.elements.scrollContainer.removeEventListener('scroll', this.handleHeaderScroll);
    this.cleanupCallback?.();
    this.cleanupCallback = undefined;
  }

  private renderHeader(): void {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(makeHeaderCell('row', 'Arrow row index', 'row-index'));
    for (const column of this.columns) {
      fragment.appendChild(makeHeaderCell(column.id, column.logicalType));
    }
    this.elements.headerRow.replaceChildren(fragment);
  }

  private renderRows(): void {
    this.renderVersion++;
    const virtualItems = this.virtualizer.getVirtualItems();
    this.elements.rowLayer.style.height = `${this.getPhysicalTotalSize()}px`;

    const fragment = document.createDocumentFragment();
    for (const virtualItem of virtualItems) {
      fragment.appendChild(this.renderRow(virtualItem, this.renderVersion));
    }
    this.elements.rowLayer.replaceChildren(fragment);
  }

  private renderRow(virtualItem: VirtualItem, version: number): HTMLElement {
    const rowIndex = virtualItem.index;
    const row = document.createElement('div');
    row.className = 'data-row table-row-grid';
    row.style.transform = `translateY(${this.getRenderedPhysicalOffset(virtualItem.start)}px)`;

    row.appendChild(makeCell(formatInteger(rowIndex), 'row-index'));
    for (const column of this.columns) {
      const cell = makeCell('');
      row.appendChild(cell);
      this.renderCell(cell, column, rowIndex, version);
    }
    return row;
  }

  private renderCell(
    cell: HTMLElement,
    column: TableColumn,
    rowIndex: number,
    version: number
  ): void {
    const value = column.getRowText(rowIndex);
    if (typeof value === 'string') {
      cell.textContent = value;
      return;
    }

    cell.textContent = '...';
    value
      .then(text => {
        if (cell.isConnected && version === this.renderVersion) {
          cell.textContent = text;
        }
      })
      .catch(error => {
        if (cell.isConnected && version === this.renderVersion) {
          cell.textContent = error instanceof Error ? error.message : String(error);
        }
      });
  }

  private syncHeaderScroll(): void {
    this.elements.headerRow.style.transform = `translateX(${-this.elements.scrollContainer.scrollLeft}px)`;
  }

  private updateGridLayout(): void {
    const columnTracks = this.columns.map(column => getColumnGridTrack(column));
    this.gridTemplateColumns = [`${ROW_INDEX_COLUMN_WIDTH}px`, ...columnTracks].join(' ');
    this.gridMinimumWidth =
      ROW_INDEX_COLUMN_WIDTH +
      this.columns.reduce((width, column) => width + getColumnMinimumWidth(column), 0);

    this.elements.headerRow.style.setProperty('--table-grid-template', this.gridTemplateColumns);
    this.elements.headerRow.style.minWidth = `${this.gridMinimumWidth}px`;
    this.elements.rowLayer.style.setProperty('--table-grid-template', this.gridTemplateColumns);
    this.elements.rowLayer.style.minWidth = `${this.gridMinimumWidth}px`;
  }

  private readonly observeScaledElementOffset = (
    instance: Virtualizer<HTMLElement, Element>,
    callback: (offset: number, isScrolling: boolean) => void
  ): (() => void) | undefined => {
    const element = instance.scrollElement;
    const targetWindow = instance.targetWindow;
    if (!element || !targetWindow) {
      return undefined;
    }

    let scrollEndTimeout: number | undefined;
    const notify = (isScrolling: boolean): void => {
      callback(this.toLogicalScrollOffset(element.scrollTop), isScrolling);
    };
    const handleScroll = (): void => {
      if (scrollEndTimeout !== undefined) {
        targetWindow.clearTimeout(scrollEndTimeout);
      }
      notify(true);
      scrollEndTimeout = targetWindow.setTimeout(
        () => notify(false),
        instance.options.isScrollingResetDelay
      );
    };

    element.addEventListener('scroll', handleScroll, {passive: true});
    return () => {
      if (scrollEndTimeout !== undefined) {
        targetWindow.clearTimeout(scrollEndTimeout);
      }
      element.removeEventListener('scroll', handleScroll);
    };
  };

  private readonly scaledElementScroll = (
    offset: number,
    options: {adjustments?: number; behavior?: ScrollBehavior},
    instance: Virtualizer<HTMLElement, Element>
  ): void => {
    const physicalOffset = this.toPhysicalScrollOffset(offset + (options.adjustments ?? 0));
    instance.scrollElement?.scrollTo?.({top: physicalOffset, behavior: options.behavior});
  };

  private getRenderedPhysicalOffset(logicalOffset: number): number {
    const physicalScrollOffset = this.elements.scrollContainer.scrollTop;
    const logicalScrollOffset =
      this.virtualizer.scrollOffset ?? this.toLogicalScrollOffset(physicalScrollOffset);
    return physicalScrollOffset + logicalOffset - logicalScrollOffset;
  }

  private toLogicalScrollOffset(physicalOffset: number): number {
    return Math.min(physicalOffset * this.getScrollScale(), this.getLogicalScrollSize());
  }

  private toPhysicalScrollOffset(logicalOffset: number): number {
    return Math.min(logicalOffset / this.getScrollScale(), this.getPhysicalScrollSize());
  }

  private getScrollScale(): number {
    const physicalScrollSize = this.getPhysicalScrollSize();
    if (physicalScrollSize <= 0) {
      return 1;
    }
    return this.getLogicalScrollSize() / physicalScrollSize;
  }

  private getLogicalTotalSize(): number {
    return this.rowCount * ROW_HEIGHT;
  }

  private getPhysicalTotalSize(): number {
    return Math.min(this.getLogicalTotalSize(), MAXIMUM_PHYSICAL_SCROLL_SIZE);
  }

  private getLogicalScrollSize(): number {
    return Math.max(0, this.getLogicalTotalSize() - this.getViewportHeight());
  }

  private getPhysicalScrollSize(): number {
    return Math.max(0, this.getPhysicalTotalSize() - this.getViewportHeight());
  }

  private getViewportHeight(): number {
    return this.virtualizer.scrollRect?.height ?? this.elements.scrollContainer.clientHeight;
  }
}

export function makeEvaluatorTableColumn(
  id: string,
  logicalType: string,
  evaluator: GPUTableEvaluator
): EvaluatorTableColumn {
  const reader = new EvaluatorRowReader(evaluator);
  return {
    kind: 'evaluator',
    id,
    logicalType,
    evaluator,
    getRowText: rowIndex => reader.getRowText(rowIndex)
  };
}

export function makeSegmentedEvaluatorTableColumn(
  id: string,
  logicalType: string,
  valuesEvaluator: GPUTableEvaluator,
  startIndicesEvaluator: GPUTableEvaluator
): SegmentedTableColumn {
  const reader = new SegmentedEvaluatorRowReader(valuesEvaluator, startIndicesEvaluator);
  return {
    kind: 'segmented',
    id,
    logicalType,
    valuesEvaluator,
    startIndicesEvaluator,
    getRowText: rowIndex => reader.getRowText(rowIndex)
  };
}

export function formatFixedRow(values: TableValueArray, startIndex: number, size: number): string {
  const rowValues: string[] = [];
  for (let valueIndex = 0; valueIndex < size; valueIndex++) {
    rowValues.push(formatNumber(values[startIndex + valueIndex] ?? 0));
  }
  return `[${rowValues.join(', ')}]`;
}

export function formatSegmentedRow(
  values: TableValueArray,
  startIndex: number,
  endIndex: number
): string {
  const valueCount = Math.max(0, endIndex - startIndex);
  if (valueCount === 0) {
    return '[]';
  }

  const rowValues: string[] = [];
  const visibleValueCount = Math.min(valueCount, MAXIMUM_CELL_VALUES);
  for (let valueIndex = 0; valueIndex < visibleValueCount; valueIndex++) {
    rowValues.push(formatNumber(values[startIndex + valueIndex] ?? 0));
  }
  if (visibleValueCount < valueCount) {
    rowValues.push(`... ${formatInteger(valueCount - visibleValueCount)} more`);
  }
  return `[${rowValues.join(', ')}]`;
}

class EvaluatorRowReader {
  private cachedChunk: EvaluatorRowChunk | null = null;
  private pendingChunk: PendingEvaluatorRowChunk | null = null;

  constructor(private readonly evaluator: GPUTableEvaluator) {}

  async getRowText(rowIndex: number): Promise<string> {
    const effectiveRowIndex = this.evaluator.isConstant ? 0 : rowIndex;
    if (effectiveRowIndex < 0 || effectiveRowIndex >= this.evaluator.length) {
      return '';
    }

    const chunk = await this.getChunk(effectiveRowIndex);
    const chunkRowIndex = effectiveRowIndex - chunk.startRow;
    return formatFixedRow(chunk.values, chunkRowIndex * this.evaluator.size, this.evaluator.size);
  }

  private async getChunk(rowIndex: number): Promise<EvaluatorRowChunk> {
    if (this.cachedChunk && isRowInChunk(rowIndex, this.cachedChunk)) {
      return this.cachedChunk;
    }
    if (this.pendingChunk && isRowInChunk(rowIndex, this.pendingChunk)) {
      return this.pendingChunk.promise;
    }

    const startRow = Math.floor(rowIndex / READ_CHUNK_ROWS) * READ_CHUNK_ROWS;
    const endRow = Math.min(startRow + READ_CHUNK_ROWS, this.evaluator.length);
    const promise = this.evaluator
      .readValue(startRow, endRow)
      .then(values => ({startRow, endRow, values: values as TableValueArray}));
    const pendingChunk = {startRow, endRow, promise};
    this.pendingChunk = pendingChunk;

    try {
      const chunk = await promise;
      if (this.pendingChunk === pendingChunk) {
        this.cachedChunk = chunk;
        this.pendingChunk = null;
      }
      return chunk;
    } catch (error) {
      if (this.pendingChunk === pendingChunk) {
        this.pendingChunk = null;
      }
      throw error;
    }
  }
}

class SegmentedEvaluatorRowReader {
  constructor(
    private readonly valuesEvaluator: GPUTableEvaluator,
    private readonly startIndicesEvaluator: GPUTableEvaluator
  ) {}

  async getRowText(rowIndex: number): Promise<string> {
    if (rowIndex < 0 || rowIndex + 1 >= this.startIndicesEvaluator.length) {
      return '';
    }

    const startIndices = await this.startIndicesEvaluator.readValue(rowIndex, rowIndex + 2);
    const startRow = Number(startIndices[0] ?? 0);
    const endRow = Number(startIndices[1] ?? startRow);
    validateSegmentRange(startRow, endRow, this.valuesEvaluator.length);
    if (startRow === endRow) {
      return '[]';
    }

    const visibleRowCount = Math.min(
      endRow - startRow,
      Math.max(1, Math.floor(MAXIMUM_CELL_VALUES / this.valuesEvaluator.size))
    );
    const values = (await this.valuesEvaluator.readValue(
      startRow,
      startRow + visibleRowCount
    )) as TableValueArray;
    return formatSegmentedEvaluatorRow(values, endRow - startRow, this.valuesEvaluator.size);
  }
}

function isRowInChunk(rowIndex: number, chunk: EvaluatorRowChunkRange): boolean {
  return rowIndex >= chunk.startRow && rowIndex < chunk.endRow;
}

function validateSegmentRange(startRow: number, endRow: number, outputLength: number): void {
  if (!Number.isInteger(startRow) || !Number.isInteger(endRow)) {
    throw new Error(`Segment range must use integer indices: [${startRow}, ${endRow})`);
  }
  if (startRow < 0 || endRow < startRow) {
    throw new Error(`Invalid segment range [${startRow}, ${endRow})`);
  }
  if (endRow > outputLength) {
    throw new Error(`Segment range [${startRow}, ${endRow}) exceeds output length ${outputLength}`);
  }
}

function makeHeaderCell(label: string, title: string, className?: string): HTMLElement {
  const cell = document.createElement('div');
  cell.className = className ? `header-cell ${className}` : 'header-cell';
  cell.title = title;
  const labelElement = document.createElement('span');
  labelElement.textContent = label;
  const titleElement = document.createElement('small');
  titleElement.textContent = title;
  cell.append(labelElement, titleElement);
  return cell;
}

function makeCell(value: string, className?: string): HTMLElement {
  const cell = document.createElement('div');
  cell.className = className ? `table-cell ${className}` : 'table-cell';
  cell.textContent = value;
  return cell;
}

function formatSegmentedEvaluatorRow(
  values: TableValueArray,
  totalRowCount: number,
  rowSize: number
): string {
  const totalScalarCount = totalRowCount * rowSize;
  if (totalScalarCount === 0) {
    return '[]';
  }

  const rowValues: string[] = [];
  const visibleValueCount = Math.min(values.length, MAXIMUM_CELL_VALUES);
  for (let valueIndex = 0; valueIndex < visibleValueCount; valueIndex++) {
    rowValues.push(formatNumber(values[valueIndex] ?? 0));
  }
  if (visibleValueCount < totalScalarCount) {
    rowValues.push(`... ${formatInteger(totalScalarCount - visibleValueCount)} more`);
  }
  return `[${rowValues.join(', ')}]`;
}

function getColumnGridTrack(column: TableColumn): string {
  const minimumWidth = getColumnMinimumWidth(column);
  const flexibleWidth =
    column.kind === 'segmented' ? '1.25fr' : column.evaluator.size === 1 ? '0.45fr' : '1fr';
  return `minmax(${minimumWidth}px, ${flexibleWidth})`;
}

function getColumnMinimumWidth(column: TableColumn): number {
  if (column.kind === 'segmented') {
    return SEGMENTED_COLUMN_WIDTH;
  }
  if (column.evaluator.size === 1) {
    return SCALAR_COLUMN_WIDTH;
  }
  return Math.min(
    MAXIMUM_VECTOR_COLUMN_WIDTH,
    Math.max(VECTOR_COLUMN_WIDTH, column.evaluator.size * VALUE_WIDTH)
  );
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1_000_000 || (absoluteValue > 0 && absoluteValue < 0.001)) {
    return value.toExponential(3);
  }
  return value.toFixed(4).replace(/\.?0+$/, '');
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
