// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  StoragePathModel,
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
import type {Device, RenderPass} from '@luma.gl/core';
import {ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import * as arrow from 'apache-arrow';

/** Source key representation used by the DGGS polygon example. */
export type DggsSourceKind = 'uint64' | 'utf8';

/** Public configuration for the Arrow DGGS polygon layer. */
export type ArrowDggsPolygonLayerProps = {
  /** Active DGGS encoding column. */
  encoding?: DggsCellEncoding;
  /** Whether to prepare cells from packed Uint64 keys or UTF-8 tokens. */
  sourceKind?: DggsSourceKind;
  /** View center in longitude/latitude. */
  center?: [number, number];
  /** Map scale applied by the DGGS viewport shader. */
  scale?: number;
  /** Constant polygon stroke color. Defaults to the active encoding color. */
  color?: [number, number, number, number];
  /** Constant polygon stroke width. */
  width?: number;
};

/** Metrics displayed by the Arrow DGGS polygon example control panel. */
export type ArrowDggsPolygonLayerMetrics = {
  /** Active DGGS encoding column. */
  activeColumn: DggsCellEncoding;
  /** Number of DGGS cells in the sample table. */
  rowCount: number;
  /** Bytes used by the active key representation. */
  keyBytes: number;
  /** Bytes used by prepared boundary path data. */
  pathBytes: number;
  /** Transient bytes used while preparing keys and paths. */
  transientBytes: number;
};

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
const DEFAULT_DGGS_CENTER: [number, number] = [0, 18];
const DEFAULT_DGGS_SCALE = 1.25;
const DEFAULT_DGGS_WIDTH = 1;
const DEFAULT_DGGS_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies Record<string, unknown>;

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

/** Example layer that prepares Arrow DGGS cell keys and renders their GPU-decoded boundaries. */
export class ArrowDggsPolygonLayer {
  readonly device: Device;
  readonly uint64Table = makeDggsUint64Table();
  readonly stringTable = makeDggsStringTable();
  readonly shaderInputs = new ShaderInputs<{dggsViewport: typeof dggsViewport.props}>({
    dggsViewport
  });
  readonly preparedInputs: Partial<Record<string, DggsPreparedInput>> = {};
  activeEncoding: DggsCellEncoding;
  activeSourceKind: DggsSourceKind;
  activeInput!: DggsPreparedInput;
  pathModel!: StoragePathModel;
  props: ArrowDggsPolygonLayerProps;

  constructor(device: Device, props: ArrowDggsPolygonLayerProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('Global Grids example requires WebGPU');
    }
    this.device = device;
    this.props = props;
    this.activeEncoding = props.encoding ?? 'geohash';
    this.activeSourceKind = props.sourceKind ?? 'uint64';
    this.activeInput = this.getOrCreatePreparedInput(this.activeEncoding, this.activeSourceKind);
    this.pathModel = this.createPathModel(this.activeInput, this.activeEncoding);
  }

  setProps(props: ArrowDggsPolygonLayerProps): void {
    const previousColor = this.props.color;
    const previousWidth = this.props.width;
    this.props = {...this.props, ...props};
    const nextEncoding = props.encoding ?? this.activeEncoding;
    const nextSourceKind = props.sourceKind ?? this.activeSourceKind;
    if (
      nextEncoding === this.activeEncoding &&
      nextSourceKind === this.activeSourceKind &&
      props.color === previousColor &&
      props.width === previousWidth
    ) {
      return;
    }
    const previousModel = this.pathModel;
    this.activeEncoding = nextEncoding;
    this.activeSourceKind = nextSourceKind;
    this.activeInput = this.getOrCreatePreparedInput(nextEncoding, nextSourceKind);
    this.pathModel = this.createPathModel(this.activeInput, nextEncoding);
    previousModel.destroy();
  }

  draw(renderPass: RenderPass, props: {aspect: number}): void {
    this.shaderInputs.setProps({
      dggsViewport: {
        center: this.props.center ?? DEFAULT_DGGS_CENTER,
        scale: this.props.scale ?? DEFAULT_DGGS_SCALE,
        aspect: props.aspect
      }
    });
    this.pathModel.draw(renderPass);
  }

  destroy(): void {
    this.pathModel?.destroy();
    for (const preparedInput of Object.values(this.preparedInputs)) {
      preparedInput?.destroy();
    }
  }

  getMetrics(): ArrowDggsPolygonLayerMetrics {
    const keyBytes = this.activeInput.keys?.keyByteLength ?? this.uint64Table.numRows * 8;
    const transientBytes =
      this.activeInput.paths.transientByteLength +
      (this.activeInput.keys?.transientByteLength ?? 0);
    return {
      activeColumn: this.activeEncoding,
      rowCount: this.uint64Table.numRows,
      keyBytes,
      pathBytes: this.activeInput.paths.pathByteLength,
      transientBytes
    };
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

  createPathModel(input: DggsPreparedInput, encoding: DggsCellEncoding): StoragePathModel {
    return new StoragePathModel(this.device, {
      id: `arrow-dggs-polygons-${encoding}`,
      paths: input.paths.paths,
      source: DGGS_PATH_SOURCE,
      shaderInputs: this.shaderInputs,
      topology: 'line-list',
      vertexCount: 2,
      color: this.props.color ?? ENCODING_COLORS[encoding],
      width: this.props.width ?? DEFAULT_DGGS_WIDTH,
      parameters: DEFAULT_DGGS_RENDER_PARAMETERS
    });
  }

  setNeedsRedraw(_reason: string): void {}

  needsRedraw(): false {
    return false;
  }
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
