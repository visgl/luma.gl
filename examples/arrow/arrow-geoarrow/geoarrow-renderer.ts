// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {ArrowPointRenderer} from '../arrow-points/arrow-point-renderer';
import {ArrowPolygonRenderer} from '../arrow-polygons/arrow-polygon-renderer';
import {
  ArrowLineRenderer,
  type ArrowLineColorType,
  type ArrowLineRendererData,
  type ArrowLineRowColorType
} from '../arrow-lines/arrow-line-renderer';

export type GeoArrowRendererProps = {
  data?: arrow.Table;
  geometries?: string | arrow.Vector<arrow.DenseUnion>;
  colors?: string | arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null;
  widths?: string | arrow.Vector<arrow.Float32> | null;
  radii?: string | arrow.Vector<arrow.Float32> | null;
  center?: [number, number];
  scale?: number;
  pointColor?: [number, number, number, number];
  lineColor?: [number, number, number, number];
  polygonColor?: [number, number, number, number];
  lineWidth?: number;
  pointRadius?: number;
};

export type GeoArrowRendererMetrics = {
  sourceRowCount: number;
  pointRowCount: number;
  lineRowCount: number;
  polygonRowCount: number;
  skippedRowCount: number;
  preparationTimeMs: number;
};

type GeoArrowGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

const DEFAULT_POINT_COLOR: [number, number, number, number] = [255, 206, 82, 235];
const DEFAULT_LINE_COLOR: [number, number, number, number] = [92, 208, 248, 235];
const DEFAULT_POLYGON_COLOR: [number, number, number, number] = [92, 128, 255, 185];
const DEFAULT_LINE_WIDTH = 0.003;
const DEFAULT_POINT_RADIUS = 0.0065;
const DEFAULT_CENTER: [number, number] = [0, 0];
const DEFAULT_SCALE = 1;

export class GeoArrowRenderer {
  readonly device: Device;
  readonly pointRenderer: ArrowPointRenderer;
  readonly polygonRenderer: ArrowPolygonRenderer;
  props: GeoArrowRendererProps;
  private lineRenderer: ArrowLineRenderer | null = null;
  private lineData: ArrowLineRendererData | null = null;
  private metrics: GeoArrowRendererMetrics = {
    sourceRowCount: 0,
    pointRowCount: 0,
    lineRowCount: 0,
    polygonRowCount: 0,
    skippedRowCount: 0,
    preparationTimeMs: 0
  };
  private updateVersion = 0;

  constructor(device: Device, props: GeoArrowRendererProps = {}) {
    this.device = device;
    this.props = props;
    this.pointRenderer = new ArrowPointRenderer(device);
    this.polygonRenderer = new ArrowPolygonRenderer(device);
  }

  async setProps(props: Partial<GeoArrowRendererProps>): Promise<void> {
    const nextProps = {...this.props, ...props};
    const shouldRebuild = shouldRebuildSource(this.props, props);
    this.props = nextProps;

    this.pointRenderer.setProps({
      center: nextProps.center ?? DEFAULT_CENTER,
      scale: nextProps.scale ?? DEFAULT_SCALE
    });
    this.polygonRenderer.setProps({
      center: nextProps.center ?? DEFAULT_CENTER,
      scale: nextProps.scale ?? DEFAULT_SCALE
    });

    if (!shouldRebuild) {
      return;
    }

    const updateVersion = ++this.updateVersion;
    const startedAt = getTimestampMilliseconds();
    const geometries = getGeometryVector(nextProps);
    const colors = getOptionalVector<arrow.FixedSizeList<arrow.Uint8>>(
      nextProps,
      'colors',
      nextProps.colors
    );
    const widths = getOptionalVector<arrow.Float32>(nextProps, 'widths', nextProps.widths);
    const radii = getOptionalVector<arrow.Float32>(nextProps, 'radii', nextProps.radii);
    const geometrySummary = summarizeGeometries(geometries);
    const pointTable = makePointTable(geometries, colors, radii);
    const polygonTable = makePolygonTable(geometries, colors);
    const lineData = await ArrowLineRenderer.prepareData(this.device, {
      id: 'arrow-geoarrow-lines',
      model: 'attribute',
      timeColumn: 'none',
      mode: 'lines',
      sourceVectors: {
        paths: geometries,
        colors: (colors ??
          makeConstantRowColorVector(
            geometries.length,
            nextProps.lineColor ?? DEFAULT_LINE_COLOR
          )) as arrow.Vector<ArrowLineColorType>,
        widths:
          widths ??
          makeConstantFloat32Vector(geometries.length, nextProps.lineWidth ?? DEFAULT_LINE_WIDTH)
      }
    });
    if (updateVersion !== this.updateVersion) {
      lineData.destroy();
      return;
    }

    await this.preparePointRenderer(pointTable, nextProps);
    if (updateVersion !== this.updateVersion) {
      lineData.destroy();
      return;
    }
    await this.preparePolygonRenderer(polygonTable, nextProps);
    if (updateVersion !== this.updateVersion) {
      lineData.destroy();
      return;
    }

    this.replaceLineData(lineData, nextProps);
    this.metrics = {
      ...geometrySummary,
      preparationTimeMs: getTimestampMilliseconds() - startedAt
    };
  }

  predraw(commandEncoder: CommandEncoder): void {
    this.polygonRenderer.predraw(commandEncoder);
    this.lineRenderer?.predraw(commandEncoder);
  }

  draw(renderPass: RenderPass, props: {aspect: number}): void {
    const scale = this.props.scale ?? DEFAULT_SCALE;
    this.polygonRenderer.draw(renderPass, props);
    if (this.lineRenderer) {
      this.lineRenderer.shaderInputs.setProps({
        pathViewport: {
          viewportScale: [scale / Math.max(props.aspect, 0.2), scale],
          time: -1,
          colorsEnabled: 1,
          widthsEnabled: 1,
          capRounded: 1,
          jointRounded: 1,
          miterLimit: 4
        }
      });
      this.lineRenderer.draw(renderPass);
    }
    this.pointRenderer.draw(renderPass, props);
  }

  destroy(): void {
    this.updateVersion++;
    this.pointRenderer.destroy();
    this.polygonRenderer.destroy();
    this.lineRenderer?.destroy();
    this.lineRenderer = null;
    this.lineData?.destroy();
    this.lineData = null;
  }

  getMetrics(): GeoArrowRendererMetrics {
    return this.metrics;
  }

  private async preparePointRenderer(
    pointTable: arrow.Table,
    props: GeoArrowRendererProps
  ): Promise<void> {
    this.pointRenderer.setProps({
      positions: 'positions',
      colors: pointTable.getChild('colors') ? 'colors' : null,
      radii: pointTable.getChild('radii') ? 'radii' : null,
      color: props.pointColor ?? DEFAULT_POINT_COLOR,
      radius: props.pointRadius ?? DEFAULT_POINT_RADIUS,
      timeColumn: null,
      center: props.center ?? DEFAULT_CENTER,
      scale: props.scale ?? DEFAULT_SCALE
    });
    const streamingSession = this.pointRenderer.beginRecordBatchStream();
    await this.pointRenderer.streamRecordBatches({
      streamingSession,
      recordBatchIterator: makeRecordBatchIterator(pointTable.batches)
    });
  }

  private async preparePolygonRenderer(
    polygonTable: arrow.Table,
    props: GeoArrowRendererProps
  ): Promise<void> {
    this.polygonRenderer.setProps({
      polygons: 'geometries',
      colors: polygonTable.getChild('colors') ? 'colors' : null,
      tessellated: false,
      color: props.polygonColor ?? DEFAULT_POLYGON_COLOR,
      center: props.center ?? DEFAULT_CENTER,
      scale: props.scale ?? DEFAULT_SCALE
    });
    const streamingSession = this.polygonRenderer.beginRecordBatchStream();
    await this.polygonRenderer.streamRecordBatches({
      streamingSession,
      recordBatchIterator: makeRecordBatchIterator(polygonTable.batches)
    });
  }

  private replaceLineData(lineData: ArrowLineRendererData, props: GeoArrowRendererProps): void {
    this.lineRenderer?.destroy();
    this.lineData?.destroy();
    this.lineData = lineData;
    this.lineRenderer = new ArrowLineRenderer(this.device, {
      id: 'arrow-geoarrow-lines',
      data: lineData,
      mode: 'lines',
      model: 'attribute',
      timeColumn: 'none',
      color: props.lineColor ?? DEFAULT_LINE_COLOR,
      width: props.lineWidth ?? DEFAULT_LINE_WIDTH
    });
  }
}

function makePointTable(
  geometries: arrow.Vector<arrow.DenseUnion>,
  colors: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null,
  radii: arrow.Vector<arrow.Float32> | null
): arrow.Table {
  const pointValues: number[] = [];
  const colorValues: number[] = [];
  const radiusValues: number[] = [];

  visitDenseUnionRows(geometries, ({geometryKind, childData, childRowIndex, sourceRowIndex}) => {
    if (geometryKind !== 'Point') {
      return;
    }
    if (!arrow.DataType.isFixedSizeList(childData.type)) {
      throw new Error('GeoArrowRenderer Point children must use FixedSizeList coordinates');
    }
    const coordinateValues = getFixedSizeListFloat32Values(
      childData as arrow.Data<arrow.FixedSizeList<arrow.Float32>>
    );
    const sourceOffset = ((childData.offset ?? 0) + childRowIndex) * childData.type.listSize;
    pointValues.push(coordinateValues[sourceOffset] ?? 0, coordinateValues[sourceOffset + 1] ?? 0);
    appendSourceRowColor(colorValues, colors, sourceRowIndex);
    if (radii) {
      radiusValues.push(Number(radii.get(sourceRowIndex) ?? DEFAULT_POINT_RADIUS));
    }
  });

  const columns: Record<string, arrow.Vector> = {
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, Float32Array.from(pointValues))
  };
  if (colorValues.length > 0) {
    columns.colors = makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      Uint8Array.from(colorValues)
    );
  }
  if (radiusValues.length > 0) {
    columns.radii = makeConstantFloat32Vector(0, 0, Float32Array.from(radiusValues));
  }
  return new arrow.Table(columns);
}

function makePolygonTable(
  geometries: arrow.Vector<arrow.DenseUnion>,
  colors: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null
): arrow.Table {
  return new arrow.Table({
    geometries,
    ...(colors ? {colors} : {})
  });
}

function summarizeGeometries(geometries: arrow.Vector<arrow.DenseUnion>): GeoArrowRendererMetrics {
  const metrics: GeoArrowRendererMetrics = {
    sourceRowCount: geometries.length,
    pointRowCount: 0,
    lineRowCount: 0,
    polygonRowCount: 0,
    skippedRowCount: 0,
    preparationTimeMs: 0
  };
  visitDenseUnionRows(geometries, ({geometryKind, childData, childRowIndex}) => {
    if (!childData.getValid(childRowIndex)) {
      metrics.skippedRowCount++;
      return;
    }
    switch (geometryKind) {
      case 'Point':
        metrics.pointRowCount++;
        break;
      case 'LineString':
        metrics.lineRowCount++;
        break;
      case 'MultiLineString':
        metrics.lineRowCount += getListRowLength(childData, childRowIndex);
        break;
      case 'Polygon':
        metrics.polygonRowCount++;
        break;
      case 'MultiPolygon':
        metrics.polygonRowCount += getListRowLength(childData, childRowIndex);
        break;
      default:
        metrics.skippedRowCount++;
    }
  });
  return metrics;
}

function visitDenseUnionRows(
  geometries: arrow.Vector<arrow.DenseUnion>,
  visitor: (props: {
    geometryKind: GeoArrowGeometryKind;
    childData: arrow.Data;
    childRowIndex: number;
    sourceRowIndex: number;
  }) => void
): void {
  let sourceRowIndexBase = 0;
  for (const data of geometries.data) {
    const typeIds = data.typeIds as ArrayLike<number>;
    const valueOffsets = data.valueOffsets as ArrayLike<number>;
    const denseUnionType = data.type as arrow.DenseUnion & {
      typeIdToChildIndex: Record<number, number | undefined>;
    };
    for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
      const dataRowIndex = (data.offset ?? 0) + localRowIndex;
      const typeId = typeIds[dataRowIndex];
      const childIndex = denseUnionType.typeIdToChildIndex[typeId];
      if (childIndex === undefined) {
        throw new Error(`GeoArrowRenderer DenseUnion has unsupported type id ${typeId}`);
      }
      const childData = data.children[childIndex];
      const childRowIndex = valueOffsets[dataRowIndex];
      visitor({
        geometryKind: getDenseUnionGeometryKind(denseUnionType, typeId, childIndex),
        childData,
        childRowIndex,
        sourceRowIndex: sourceRowIndexBase + localRowIndex
      });
    }
    sourceRowIndexBase += data.length;
  }
}

function getGeometryVector(props: GeoArrowRendererProps): arrow.Vector<arrow.DenseUnion> {
  if (typeof props.geometries === 'string' || !props.geometries) {
    const columnName = typeof props.geometries === 'string' ? props.geometries : 'geometries';
    const vector = props.data?.getChild(columnName);
    if (!vector || !arrow.DataType.isDenseUnion(vector.type)) {
      throw new Error(
        `GeoArrowRenderer data is missing DenseUnion geometry column "${columnName}"`
      );
    }
    return vector as arrow.Vector<arrow.DenseUnion>;
  }
  return props.geometries;
}

function getOptionalVector<T extends arrow.DataType>(
  props: GeoArrowRendererProps,
  defaultColumnName: string,
  value: string | arrow.Vector<T> | null | undefined
): arrow.Vector<T> | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' && value !== undefined) {
    return value;
  }
  const columnName = typeof value === 'string' ? value : defaultColumnName;
  return (props.data?.getChild(columnName) as arrow.Vector<T> | null) ?? null;
}

function appendSourceRowColor(
  target: number[],
  colors: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> | null,
  sourceRowIndex: number
): void {
  if (!colors) {
    return;
  }
  const color = colors.get(sourceRowIndex);
  if (!isVectorLike(color) || color.length !== 4) {
    throw new Error('GeoArrowRenderer colors must be FixedSizeList<Uint8, 4>');
  }
  target.push(
    Number(color.get(0) ?? 0),
    Number(color.get(1) ?? 0),
    Number(color.get(2) ?? 0),
    Number(color.get(3) ?? 0)
  );
}

function getDenseUnionGeometryKind(
  denseUnionType: arrow.DenseUnion,
  typeId: number,
  childIndex: number
): GeoArrowGeometryKind {
  const childName = denseUnionType.children[childIndex]?.name.toLowerCase().replace(/[^a-z]/g, '');
  if (childName?.includes('geometrycollection')) {
    return 'GeometryCollection';
  }
  if (childName?.includes('multilinestring')) {
    return 'MultiLineString';
  }
  if (childName?.includes('linestring')) {
    return 'LineString';
  }
  if (childName?.includes('multipolygon')) {
    return 'MultiPolygon';
  }
  if (childName?.includes('polygon')) {
    return 'Polygon';
  }
  if (childName?.includes('multipoint')) {
    return 'MultiPoint';
  }
  if (childName?.includes('point')) {
    return 'Point';
  }
  return getGeoArrowGeometryKindFromTypeId(typeId);
}

function getGeoArrowGeometryKindFromTypeId(typeId: number): GeoArrowGeometryKind {
  switch (typeId % 10) {
    case 1:
      return 'Point';
    case 2:
      return 'LineString';
    case 3:
      return 'Polygon';
    case 4:
      return 'MultiPoint';
    case 5:
      return 'MultiLineString';
    case 6:
      return 'MultiPolygon';
    case 7:
      return 'GeometryCollection';
    default:
      throw new Error(`GeoArrowRenderer DenseUnion has unsupported GeoArrow type id ${typeId}`);
  }
}

function getListRowLength(data: arrow.Data, localRowIndex: number): number {
  const valueOffsets = data.valueOffsets as ArrayLike<number> | undefined;
  if (!valueOffsets) {
    return 0;
  }
  const rowIndex = (data.offset ?? 0) + localRowIndex;
  return Math.max(0, (valueOffsets[rowIndex + 1] ?? 0) - (valueOffsets[rowIndex] ?? 0));
}

function getFixedSizeListFloat32Values(
  data: arrow.Data<arrow.FixedSizeList<arrow.Float32>>
): Float32Array {
  const values = data.children[0]?.values;
  if (!(values instanceof Float32Array)) {
    throw new Error('GeoArrowRenderer point child values must be Float32');
  }
  return values;
}

function makeConstantRowColorVector(
  rowCount: number,
  color: [number, number, number, number]
): arrow.Vector<ArrowLineRowColorType> {
  const values = new Uint8Array(rowCount * 4);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    values.set(color, rowIndex * 4);
  }
  return makeArrowFixedSizeListVector(new arrow.Uint8(), 4, values);
}

function makeConstantFloat32Vector(
  rowCount: number,
  value: number,
  values = Float32Array.from({length: rowCount}, () => value)
): arrow.Vector<arrow.Float32> {
  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Float32(),
      length: values.length,
      data: values
    }) as arrow.Data<arrow.Float32>
  ]);
}

function shouldRebuildSource(
  currentProps: GeoArrowRendererProps,
  nextProps: Partial<GeoArrowRendererProps>
): boolean {
  return (
    nextProps.data !== undefined ||
    nextProps.geometries !== undefined ||
    nextProps.colors !== undefined ||
    nextProps.widths !== undefined ||
    nextProps.radii !== undefined ||
    nextProps.pointColor !== undefined ||
    nextProps.lineColor !== undefined ||
    nextProps.polygonColor !== undefined ||
    nextProps.lineWidth !== undefined ||
    nextProps.pointRadius !== undefined ||
    (!currentProps.data && !currentProps.geometries)
  );
}

async function* makeRecordBatchIterator(
  recordBatches: readonly arrow.RecordBatch[]
): AsyncGenerator<arrow.RecordBatch> {
  for (const recordBatch of recordBatches) {
    yield recordBatch;
  }
}

function isVectorLike(value: unknown): value is {
  length: number;
  get: (index: number) => unknown;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    'get' in value &&
    typeof (value as {get?: unknown}).get === 'function'
  );
}

function getTimestampMilliseconds(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
