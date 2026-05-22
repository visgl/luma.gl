// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowStoragePathModel,
  packDggsA5CellKey,
  packDggsGeohashKey,
  packDggsH3CellKey,
  packDggsQuadkeyKey,
  packDggsS2CellKey,
  prepareDggsCellKeyGPUVector,
  prepareDggsCellPathGPUVector,
  type DggsCellEncoding,
  type PreparedDggsCellKeyGPUVector,
  type PreparedDggsCellPathGPUVector
} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';

export const title = 'Global Grids: Uint64, Utf8';
export const description =
  'Parses geohash, quadkey, S2, A5, and H3 cell ids into Uint64 keys on the GPU, generates boundary paths, and renders them through the storage-backed Arrow path model.';

type DggsSourceKind = 'uint64' | 'utf8';
type DggsPreparedInput = {
  keys?: PreparedDggsCellKeyGPUVector;
  paths: PreparedDggsCellPathGPUVector;
  destroy: () => void;
};
type DggsViewportUniforms = {
  center: [number, number];
  scale: number;
  aspect: number;
};

const ENCODING_SELECTOR_ID = 'dggs-gpu-polygons-encoding';
const SOURCE_SELECTOR_ID = 'dggs-gpu-polygons-source';
const ROW_COUNT_ID = 'dggs-gpu-polygons-row-count';
const KEY_BYTES_ID = 'dggs-gpu-polygons-key-bytes';
const PATH_BYTES_ID = 'dggs-gpu-polygons-path-bytes';
const TRANSIENT_BYTES_ID = 'dggs-gpu-polygons-transient-bytes';
const ACTIVE_COLUMN_ID = 'dggs-gpu-polygons-active-column';

const SAMPLE_GEOHASH_PRECISION = 2;
const SAMPLE_QUADKEY_ZOOM = 5;
const SAMPLE_S2_LEVEL = 4;

const SAMPLE_GEOHASHES = [
  '9q8yyk',
  '9q9j7n',
  'dr5reg',
  'dr72h7',
  'gcpvj0',
  'u4pruy',
  'xn774c',
  'r3gx2f',
  '6gkzwg',
  'ezs42e',
  'kbc6wj',
  's00000'
].map(geohash => geohash.slice(0, SAMPLE_GEOHASH_PRECISION));

const SAMPLE_LOCATIONS: Array<[number, number]> = [
  [-122.42, 37.78],
  [-118.24, 34.05],
  [-73.98, 40.75],
  [-71.06, 42.36],
  [-0.12, 51.5],
  [10.75, 59.91],
  [116.39, 39.9],
  [151.21, -33.86],
  [-58.38, -34.6],
  [-43.17, -22.91],
  [28.04, -26.2],
  [77.21, 28.61]
];

const SAMPLE_S2_KEYS = [
  makeSampleS2CellKey(0, [0, 1, 2, 3, 0]),
  makeSampleS2CellKey(0, [1, 2, 3, 0, 1]),
  makeSampleS2CellKey(1, [2, 2, 1, 0, 3]),
  makeSampleS2CellKey(1, [3, 0, 1, 1, 2]),
  makeSampleS2CellKey(2, [0, 3, 3, 2, 1]),
  makeSampleS2CellKey(2, [2, 1, 0, 2, 3]),
  makeSampleS2CellKey(3, [1, 1, 2, 0, 0]),
  makeSampleS2CellKey(3, [3, 2, 0, 1, 1]),
  makeSampleS2CellKey(4, [0, 2, 1, 3, 2]),
  makeSampleS2CellKey(4, [2, 3, 0, 0, 1]),
  makeSampleS2CellKey(5, [1, 0, 3, 2, 2]),
  makeSampleS2CellKey(5, [3, 1, 1, 0, 3])
] as const;

const SAMPLE_A5_KEYS = [
  0x1ae0000000000000n,
  0x1960000000000000n,
  0x24e0000000000000n,
  0x2620000000000000n,
  0x6360000000000000n,
  0x0c20000000000000n,
  0x8160000000000000n,
  0x8f60000000000000n,
  0x3220000000000000n,
  0x3920000000000000n,
  0x46a0000000000000n,
  0x75e0000000000000n
] as const;

const SAMPLE_H3_KEYS = [
  0x822837fffffffffn,
  0x8229a7fffffffffn,
  0x822a17fffffffffn,
  0x822a37fffffffffn,
  0x822f5ffffffffffn,
  0x82be0ffffffffffn,
  0x82a8a7fffffffffn,
  0x827a6ffffffffffn,
  0x823da7fffffffffn,
  0x824997fffffffffn,
  0x828c17fffffffffn,
  0x82464ffffffffffn
] as const;

const ENCODING_COLORS: Record<DggsCellEncoding, [number, number, number, number]> = {
  geohash: [72, 205, 217, 235],
  quadkey: [255, 186, 73, 235],
  s2: [152, 221, 132, 235],
  a5: [238, 128, 255, 235],
  h3: [255, 112, 112, 235]
};

const dggsViewport: ShaderModule<DggsViewportUniforms> = {
  name: 'dggsViewport',
  uniformTypes: {
    center: 'vec2<f32>',
    scale: 'f32',
    aspect: 'f32'
  }
};

const DGGS_PATH_SOURCE = /* wgsl */ `\
@group(0) @binding(auto) var<storage, read> pathValues : array<f32>;
@group(0) @binding(auto) var<storage, read> pathRanges : array<vec4<u32>>;
@group(0) @binding(auto) var<storage, read> pathViewOrigins : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> pathRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathVertexColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;

struct PathStorageStyleConfig {
  constantColor : vec4<f32>,
  constantWidth : f32,
  useRowColors : u32,
  useRowWidths : u32,
  batchRowIndexBase : u32,
  pathComponentCount : u32,
  useViewOrigins : u32,
  useVertexColors : u32,
  _padding1 : u32,
};

struct DggsViewportUniforms {
  center : vec2<f32>,
  scale : f32,
  aspect : f32,
};

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;
@group(0) @binding(auto) var<uniform> dggsViewport : DggsViewportUniforms;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPointIndices : u32,
  @location(1) segmentFlags : u32,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

const PI : f32 = 3.141592653589793;
const DEGREES_TO_RADIANS : f32 = 0.017453292519943295;

fn readPathComponent(pointIndex : u32, componentIndex : u32) -> f32 {
  if (componentIndex >= pathStorageStyleConfig.pathComponentCount) {
    return 0.0;
  }
  return pathValues[pointIndex * pathStorageStyleConfig.pathComponentCount + componentIndex];
}

fn readPathPoint(pointIndex : u32) -> vec2<f32> {
  return vec2<f32>(readPathComponent(pointIndex, 0u), readPathComponent(pointIndex, 1u));
}

fn latitudeToMercator(latitude : f32) -> f32 {
  let clampedLatitude = clamp(latitude, -85.0, 85.0) * DEGREES_TO_RADIANS;
  return log(tan(PI * 0.25 + clampedLatitude * 0.5));
}

fn projectLngLat(lngLat : vec2<f32>) -> vec2<f32> {
  let x = (lngLat.x - dggsViewport.center.x) / 180.0;
  let y = (latitudeToMercator(lngLat.y) - latitudeToMercator(dggsViewport.center.y)) / PI;
  return vec2<f32>(x / max(dggsViewport.aspect, 0.2), y) * dggsViewport.scale;
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  let pointIndex = inputs.segmentStartPointIndices + (inputs.vertexIndex & 1u);
  let lngLat = readPathPoint(pointIndex);
  var outputs : FragmentInputs;
  outputs.Position = vec4<f32>(projectLngLat(lngLat), 0.0, 1.0);
  outputs.color = pathStorageStyleConfig.constantColor;
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

export default class DggsGpuPolygonsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
  <div style="min-width: 280px; max-width: 420px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 10px; background: rgba(255, 255, 255, 0.96); color: #0f172a; font: 14px/1.4 system-ui, sans-serif;">
    <div style="display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px 12px; align-items: center;">
      <label for="${ENCODING_SELECTOR_ID}" style="font-weight: 700;">Column</label>
      <select id="${ENCODING_SELECTOR_ID}" style="min-height: 32px; border: 1px solid #94a3b8; border-radius: 6px; background: white;">
        <option value="geohash">geohash</option>
        <option value="quadkey">quadkey</option>
        <option value="s2">s2</option>
        <option value="a5">a5</option>
        <option value="h3">h3</option>
      </select>
      <label for="${SOURCE_SELECTOR_ID}" style="font-weight: 700;">Source</label>
      <select id="${SOURCE_SELECTOR_ID}" style="min-height: 32px; border: 1px solid #94a3b8; border-radius: 6px; background: white;">
        <option value="uint64">Vector&lt;Uint64&gt;</option>
        <option value="utf8">Vector&lt;Utf8&gt; parsed on GPU</option>
      </select>
    </div>
    ${makeMetricRow('Active Arrow column', ACTIVE_COLUMN_ID)}
    ${makeMetricRow('Rows', ROW_COUNT_ID)}
    ${makeMetricRow('Uint64 key bytes', KEY_BYTES_ID)}
    ${makeMetricRow('Generated path bytes', PATH_BYTES_ID)}
    ${makeMetricRow('Transient compute bytes', TRANSIENT_BYTES_ID)}
  </div>
  `;

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly uint64Table = makeDggsUint64Table();
  readonly stringTable = makeDggsStringTable();
  readonly shaderInputs = new ShaderInputs<{dggsViewport: typeof dggsViewport.props}>({
    dggsViewport
  });
  readonly preparedInputs: Partial<Record<string, DggsPreparedInput>> = {};
  activeEncoding: DggsCellEncoding = 'geohash';
  activeSourceKind: DggsSourceKind = 'uint64';
  activeInput!: DggsPreparedInput;
  pathModel!: ArrowStoragePathModel;
  encodingSelector: HTMLSelectElement | null = null;
  sourceSelector: HTMLSelectElement | null = null;
  rowCountLabel: HTMLElement | null = null;
  keyBytesLabel: HTMLElement | null = null;
  pathBytesLabel: HTMLElement | null = null;
  transientBytesLabel: HTMLElement | null = null;
  activeColumnLabel: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    if (this.device.type !== 'webgpu') {
      throw new Error('Global Grids example requires WebGPU');
    }
    this.activeInput = this.getOrCreatePreparedInput(this.activeEncoding, this.activeSourceKind);
    this.pathModel = this.createPathModel(this.activeInput, this.activeEncoding);
    this.initializeControls();
    this.initializeLabels();
    this.updateLabels();
  }

  override onRender({aspect, device}: AnimationProps): void {
    if (!this.pathModel) {
      const renderPass = device.beginRenderPass({clearColor: [0.015, 0.035, 0.07, 1]});
      renderPass.end();
      return;
    }

    this.shaderInputs.setProps({
      dggsViewport: {
        center: [0, 18],
        scale: 1.25,
        aspect
      }
    });
    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.035, 0.07, 1]});
    this.pathModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.encodingSelector?.removeEventListener('change', this.handleEncodingSelection);
    this.sourceSelector?.removeEventListener('change', this.handleSourceSelection);
    this.pathModel?.destroy();
    for (const preparedInput of Object.values(this.preparedInputs)) {
      preparedInput?.destroy();
    }
  }

  initializeControls(): void {
    this.encodingSelector = document.getElementById(
      ENCODING_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
    if (this.encodingSelector) {
      this.encodingSelector.value = this.activeEncoding;
      this.encodingSelector.addEventListener('change', this.handleEncodingSelection);
    }
    if (this.sourceSelector) {
      this.sourceSelector.value = this.activeSourceKind;
      this.sourceSelector.addEventListener('change', this.handleSourceSelection);
    }
  }

  initializeLabels(): void {
    this.rowCountLabel = document.getElementById(ROW_COUNT_ID);
    this.keyBytesLabel = document.getElementById(KEY_BYTES_ID);
    this.pathBytesLabel = document.getElementById(PATH_BYTES_ID);
    this.transientBytesLabel = document.getElementById(TRANSIENT_BYTES_ID);
    this.activeColumnLabel = document.getElementById(ACTIVE_COLUMN_ID);
  }

  updateLabels(): void {
    const keyBytes = this.activeInput.keys?.keyByteLength ?? this.uint64Table.numRows * 8;
    const transientBytes =
      this.activeInput.paths.transientByteLength +
      (this.activeInput.keys?.transientByteLength ?? 0);
    setMetricText(this.activeColumnLabel, this.activeEncoding);
    setMetricText(this.rowCountLabel, formatInteger(this.uint64Table.numRows));
    setMetricText(this.keyBytesLabel, formatByteLength(keyBytes));
    setMetricText(this.pathBytesLabel, formatByteLength(this.activeInput.paths.pathByteLength));
    setMetricText(this.transientBytesLabel, formatByteLength(transientBytes));
  }

  getOrCreatePreparedInput(
    encoding: DggsCellEncoding,
    sourceKind: DggsSourceKind
  ): DggsPreparedInput {
    const cacheKey = `${sourceKind}-${encoding}`;
    const cachedInput = this.preparedInputs[cacheKey];
    if (cachedInput) {
      return cachedInput;
    }

    let preparedKeys: PreparedDggsCellKeyGPUVector | undefined;
    let keys: PreparedDggsCellKeyGPUVector['keys'] | arrow.Vector<arrow.Uint64>;
    if (sourceKind === 'utf8') {
      preparedKeys = prepareDggsCellKeyGPUVector(
        this.device,
        getTableVector<arrow.Utf8>(this.stringTable, encoding),
        {
          id: `dggs-${sourceKind}-${encoding}`,
          encoding
        }
      );
      keys = preparedKeys.keys;
    } else {
      keys = getTableVector<arrow.Uint64>(this.uint64Table, encoding);
    }
    const preparedPaths = prepareDggsCellPathGPUVector(this.device, keys, {
      id: `dggs-${sourceKind}-${encoding}-paths`,
      encoding
    });
    const preparedInput = {
      ...(preparedKeys ? {keys: preparedKeys} : {}),
      paths: preparedPaths,
      destroy: () => {
        preparedPaths.destroy();
        preparedKeys?.destroy();
      }
    };
    this.preparedInputs[cacheKey] = preparedInput;
    return preparedInput;
  }

  createPathModel(input: DggsPreparedInput, encoding: DggsCellEncoding): ArrowStoragePathModel {
    return new ArrowStoragePathModel(this.device, {
      id: `dggs-gpu-polygons-${encoding}`,
      paths: input.paths.paths,
      source: DGGS_PATH_SOURCE,
      shaderInputs: this.shaderInputs,
      topology: 'line-list',
      vertexCount: 2,
      color: ENCODING_COLORS[encoding],
      width: 1,
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
  }

  replaceInput(encoding: DggsCellEncoding, sourceKind: DggsSourceKind): void {
    if (encoding === this.activeEncoding && sourceKind === this.activeSourceKind) {
      return;
    }
    const previousModel = this.pathModel;
    this.activeEncoding = encoding;
    this.activeSourceKind = sourceKind;
    this.activeInput = this.getOrCreatePreparedInput(encoding, sourceKind);
    this.pathModel = this.createPathModel(this.activeInput, encoding);
    previousModel.destroy();
    this.updateLabels();
  }

  readonly handleEncodingSelection = (): void => {
    const encoding = parseDggsCellEncoding(this.encodingSelector?.value);
    if (encoding) {
      this.replaceInput(encoding, this.activeSourceKind);
    }
  };

  readonly handleSourceSelection = (): void => {
    const sourceKind = this.sourceSelector?.value === 'utf8' ? 'utf8' : 'uint64';
    this.replaceInput(this.activeEncoding, sourceKind);
  };
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;"><span>${label}</span><strong id="${id}" style="font-variant-numeric: tabular-nums;">-</strong></div>`;
}

function makeDggsUint64Table(): arrow.Table {
  return new arrow.Table({
    geohash: makeUint64Vector(SAMPLE_GEOHASHES.map(packDggsGeohashKey)),
    quadkey: makeUint64Vector(
      SAMPLE_LOCATIONS.map(location =>
        packDggsQuadkeyKey(getQuadkey(location, SAMPLE_QUADKEY_ZOOM))
      )
    ),
    s2: makeUint64Vector(SAMPLE_S2_KEYS),
    a5: makeUint64Vector(SAMPLE_A5_KEYS.map(packDggsA5CellKey)),
    h3: makeUint64Vector(SAMPLE_H3_KEYS.map(packDggsH3CellKey))
  });
}

function makeDggsStringTable(): arrow.Table {
  return new arrow.Table({
    geohash: arrow.vectorFromArray([...SAMPLE_GEOHASHES], new arrow.Utf8()),
    quadkey: arrow.vectorFromArray(
      SAMPLE_LOCATIONS.map(location => getQuadkey(location, SAMPLE_QUADKEY_ZOOM)),
      new arrow.Utf8()
    ),
    s2: arrow.vectorFromArray(SAMPLE_S2_KEYS.map(getS2Token), new arrow.Utf8()),
    a5: arrow.vectorFromArray(SAMPLE_A5_KEYS.map(getA5Token), new arrow.Utf8()),
    h3: arrow.vectorFromArray(SAMPLE_H3_KEYS.map(getH3Token), new arrow.Utf8())
  });
}

function makeUint64Vector(values: readonly bigint[]): arrow.Vector<arrow.Uint64> {
  const typedValues = new BigUint64Array(values.length);
  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    typedValues[valueIndex] = BigInt.asUintN(64, values[valueIndex] ?? 0n);
  }
  const uint64Type = new arrow.Uint64();
  const uint64Data = new arrow.Data(uint64Type, 0, typedValues.length, 0, {
    [arrow.BufferType.DATA]: typedValues
  });
  return new arrow.Vector([uint64Data]) as arrow.Vector<arrow.Uint64>;
}

function getTableVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`DGGS example table is missing column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function parseDggsCellEncoding(value: string | undefined): DggsCellEncoding | null {
  if (
    value === 'geohash' ||
    value === 'quadkey' ||
    value === 's2' ||
    value === 'a5' ||
    value === 'h3'
  ) {
    return value;
  }
  return null;
}

function makeSampleS2CellKey(face: number, childPositions: readonly number[]): bigint {
  return packDggsS2CellKey(face, childPositions.slice(0, SAMPLE_S2_LEVEL));
}

function getQuadkey([longitude, latitude]: [number, number], zoom: number): string {
  const tileScale = 1 << zoom;
  const sinLatitude = Math.sin((Math.max(-85, Math.min(85, latitude)) * Math.PI) / 180);
  const tileX = Math.min(
    tileScale - 1,
    Math.max(0, Math.floor(((longitude + 180) / 360) * tileScale))
  );
  const tileY = Math.min(
    tileScale - 1,
    Math.max(
      0,
      Math.floor(
        (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * tileScale
      )
    )
  );
  let quadkey = '';
  for (let digitIndex = zoom; digitIndex > 0; digitIndex--) {
    let digit = 0;
    const mask = 1 << (digitIndex - 1);
    if ((tileX & mask) !== 0) {
      digit += 1;
    }
    if ((tileY & mask) !== 0) {
      digit += 2;
    }
    quadkey += String(digit);
  }
  return quadkey;
}

function getS2Token(cellKey: bigint): string {
  if (cellKey === 0n) {
    return 'X';
  }
  return cellKey.toString(16).replace(/0+$/, '');
}

function getA5Token(cellKey: bigint): string {
  return packDggsA5CellKey(cellKey).toString(16);
}

function getH3Token(cellKey: bigint): string {
  return packDggsH3CellKey(cellKey).toString(16);
}

function setMetricText(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${formatInteger(byteLength)} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${formatMetricDigits(byteLength / 1000)} kB`;
  }
  return `${formatMetricDigits(byteLength / 1000 ** 2)} MB`;
}

function formatMetricDigits(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 2}).format(value);
}
