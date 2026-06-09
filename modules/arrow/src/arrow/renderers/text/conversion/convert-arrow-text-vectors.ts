// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout, type Device, type ShaderLayout} from '@luma.gl/core';
import {
  GPUVector,
  planGeneratedBufferBatches,
  type GeneratedBufferBatch,
  type GPUData,
  type GPUTableModelProps
} from '@luma.gl/tables';
import {expandArrowVector} from '../../../vectors/arrow-vector-utils';
import {
  getArrowVectorBufferSource,
  makeArrowFixedSizeListVector
} from '../../../vectors/arrow-fixed-size-list';
import {
  makeGPUTableFromArrowTable,
  makeGPUVectorFromArrow
} from '../../../gpu/arrow-gpu-table-adapters';
import {isNumericArrowType, type NumericArrowType} from '../../../arrow-utils/arrow-types';
import {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float32,
  Int16,
  List,
  Schema,
  Table,
  Uint16,
  Uint32,
  Uint8,
  Utf8,
  Vector,
  makeData,
  makeVector,
  util
} from 'apache-arrow';
import {
  createTextDefaultFragmentShaderUniforms,
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createGpuUtf8ExpandedInputFromBuffers,
  DEFAULT_FONT_SETTINGS,
  DEFAULT_TEXT_FS,
  DEFAULT_TEXT_SHADER_LAYOUT,
  DEFAULT_TEXT_VS,
  DEFAULT_CLIPPED_TEXT_SHADER_LAYOUT,
  DEFAULT_CLIPPED_TEXT_VS,
  dispatchGpuExpandedTextCompute,
  dispatchGpuUtf8ExpandedTextCompute,
  FontAtlasManager,
  ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
  createStorageGlyphLookup,
  createStorageGlyphMetrics,
  assertTextStorageGPUVectorInputs,
  type TextAttributeState,
  type CharacterMapping,
  type FontAtlas,
  type FontSettings,
  type TextStorageInputProps
} from '@luma.gl/text';
import {
  buildArrowGlyphLayout,
  buildGpuDictionaryCompressedTextStream,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  buildArrowUtf8Chunks,
  decodeArrowUtf8CodePoints,
  isArrowUtf8DictionaryType,
  isArrowUtf8DictionaryVector,
  isArrowUtf8TextVector,
  isArrowUtf8Vector,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type ArrowUtf8Dictionary,
  type ArrowUtf8TextVector,
  type GpuDictionaryCompressedTextStream,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type Utf8TextIndexTarget
} from './arrow-text';

const GLYPH_OFFSETS_COLUMN = 'glyphOffsets';
const GLYPH_FRAMES_COLUMN = 'glyphFrames';
const GLYPH_CLIP_RECTS_COLUMN = 'glyphClipRects';
const ROW_INDICES_COLUMN = 'rowIndices';
const EXPANDED_GLYPH_VERTEX_DATA = 'expandedGlyphVertexData';
const COMPACT_GLYPH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 2;
const EXPANDED_GLYPH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 4;
const CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE =
  EXPANDED_GLYPH_VERTEX_BYTE_STRIDE + Int16Array.BYTES_PER_ELEMENT * 4;
const MISSING_CHAR_WIDTH = 32;
const MAX_UINT16 = 65535;
const DEFAULT_TEXT_STORAGE_COLOR: [number, number, number, number] = [0, 0, 0, 255];
const DEFAULT_TEXT_STORAGE_ANGLE = 0;
const DEFAULT_TEXT_STORAGE_SIZE = 32;
const DEFAULT_TEXT_STORAGE_PIXEL_OFFSET: [number, number] = [0, 0];
const DEFAULT_TEXT_STORAGE_ANCHOR = 0;
const DEFAULT_STORAGE_ALIGNMENT_BASELINE = 0;
const BITMAP_TEXT_SDF_THRESHOLD = -1;
const INVALID_DICTIONARY_INDEX = 0xffffffff;
const STORAGE_RENDER_CONFIG_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT * 4;
const DICTIONARY_RENDER_CONFIG_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT * 4;
/** Buffer-like row binding accepted by prepared storage text states. */
export type TextStorageBuffer = Buffer | DynamicBuffer;

/** Fragment shader SDF alpha decode settings derived from font settings. */
export type TextSdfRenderSettings = {
  /** Whether the atlas was generated as signed-distance-field glyphs. */
  sdf: boolean;
  /** Alpha threshold used when decoding SDF atlas samples. */
  threshold: number;
  /** Smoothstep width used around the SDF alpha threshold. */
  smoothing: number;
};

/** Resolved atlas mapping and layout metrics shared by attribute and storage conversion. */
export type ResolvedCharacterMapping = {
  /** Character-to-atlas-frame mapping used while generating glyph records. */
  mapping: CharacterMapping;
  /** Baseline offset in glyph-layout units. */
  baselineOffset: number;
  /** Line height in glyph-layout units for one-line label layout. */
  lineHeight: number;
  /** Optional character set accumulated from source labels. */
  characterSet?: Set<string>;
  /** Optional atlas manager owned by the prepared state. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional resolved font atlas texture and metrics. */
  fontAtlas?: FontAtlas;
  /** SDF rendering settings derived from the atlas/font settings. */
  sdfRenderSettings: TextSdfRenderSettings;
};

/** Expanded Arrow glyph table plus layout and allocation diagnostics. */
export type ArrowTextGlyphTable = {
  /** Expanded Arrow table containing glyph-instance columns. */
  table: Table;
  /** One-line glyph offsets and atlas frames expanded from source text rows. */
  glyphLayout: ArrowGlyphLayout;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Bytes occupied by generated glyph-instance Arrow attributes. */
  attributeByteLength: number;
  /** CPU time spent building generated glyph-instance Arrow attributes. */
  glyphAttributeBuildTimeMs: number;
};

/** CPU Arrow vectors used when one-line text layout expands rows into glyph attributes. */
export type ArrowTextSourceVectors = {
  /** CPU label origins aligned one-for-one with `texts`. */
  positions: Vector<FixedSizeList<Float32>>;
  /** CPU plain or dictionary-encoded UTF-8 labels used for glyph expansion. */
  texts: ArrowUtf8TextVector;
  /** Optional CPU packed RGBA8 text colors aligned with label rows or label characters. */
  colors?: Vector<ArrowTextColorType>;
  /** Optional CPU per-row angles in degrees. */
  angles?: Vector<Float32>;
  /** Optional CPU per-row deck-style text sizes. */
  sizes?: Vector<Float32>;
  /** Optional CPU per-row pixel offsets. */
  pixelOffsets?: Vector<FixedSizeList<Float32>>;
  /** Optional CPU per-row text anchor enum values. */
  textAnchors?: Vector<Uint8>;
  /** Optional CPU per-row alignment baseline enum values. */
  alignmentBaselines?: Vector<Uint8>;
  /** Optional CPU packed clip rectangles aligned with label rows. */
  clipRects?: Vector<FixedSizeList<Int16>>;
};

/** CPU Arrow vectors still needed by storage-backed text expansion. */
export type ArrowTextStorageSourceVectors = {
  /** CPU plain or dictionary-encoded UTF-8 labels used for storage glyph expansion. */
  texts: ArrowUtf8TextVector;
  /** Optional CPU packed clip rectangles aligned with label rows. */
  clipRects?: Vector<FixedSizeList<Int16>>;
};

/**
 * Arrow-to-attribute conversion input consumed by layer/data-conversion code.
 *
 * CPU source vectors are retained here only for Arrow conversion helpers. This is not a text model
 * constructor type.
 */
export type ArrowTextModelProps = Omit<GPUTableModelProps, 'table' | 'tableCount'> & {
  /** GPU-resident label origins aligned one-for-one with `texts`. */
  positions: GPUVector;
  /** Optional packed RGBA8 text colors, consumed as label or character attributes when declared by the shader. */
  colors?: GPUVector;
  /** Optional per-row angles in degrees, consumed as label attributes when declared by the shader. */
  angles?: GPUVector;
  /** Optional per-row deck-style text sizes, consumed as label attributes when declared by the shader. */
  sizes?: GPUVector;
  /** Optional per-row pixel offsets, consumed as label attributes when declared by the shader. */
  pixelOffsets?: GPUVector;
  /** GPU UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /** CPU Arrow vectors explicitly retained by the caller for glyph/layout expansion. */
  sourceVectors: ArrowTextSourceVectors;
  /**
   * Optional packed per-label clip rectangles `[x, y, width, height]`.
   * Values are signed 16-bit glyph-layout units relative to the label origin.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector;
  /** Constant fallback color used when nullable row or character color rows are null. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when nullable angle rows are null. */
  angle?: number;
  /** Constant fallback deck-style text size used when nullable size rows are null. */
  size?: number;
  /** Character set for atlas generation. Pass `'auto'` to derive it from Arrow labels. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for the single-line baseline layout. */
  lineHeight?: number;
  /** Optional prebuilt atlas manager for shared atlas reuse. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
};

/**
 * Arrow-to-attribute conversion input consumed by `convertArrowTextToAttributeState()`.
 *
 * This type describes the boundary between layer-owned Arrow adaptation and the pure
 * {@link TextAttributeModel}. It intentionally contains GPUVectors plus retained CPU source
 * vectors, and is not a renderer model constructor type.
 */
export type ArrowTextAttributeInputProps = ArrowTextModelProps;

/** Packed RGBA8 Arrow row-color type accepted by text conversion helpers. */
export type ArrowTextRowColorType = FixedSizeList<Uint8>;
/** Nested packed RGBA8 Arrow character-color type accepted by the attribute path. */
export type ArrowTextCharacterColorType = List<FixedSizeList<Uint8>>;
/** Arrow text color type accepted by conversion helpers. */
export type ArrowTextColorType = ArrowTextRowColorType | ArrowTextCharacterColorType;

type ArrowTextStorageSharedInputProps = Omit<
  ArrowTextModelProps,
  'sourceVectors' | 'texts' | 'colors'
> & {
  /**
   * Include a generated per-glyph row-index vertex column.
   * This increases the compact glyph vertex record from 8 to 12 bytes, but lets the storage shader
   * fetch the source row directly instead of binary-searching row glyph starts per glyph.
   */
  rowIndexColumn?: boolean;
  /** Optional packed RGBA8 text colors aligned with label rows. */
  colors?: GPUVector;
  /** Optional per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector;
  /** Optional per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector;
  /** Constant fallback color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when `angles` is absent. */
  angle?: number;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;
  /** Constant fallback pixel offset used when `pixelOffsets` is absent. */
  pixelOffset?: [number, number];
  /** Constant fallback text anchor used when `textAnchors` is absent. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Constant fallback alignment baseline used when `alignmentBaselines` is absent. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
};

/** Arrow-to-storage conversion input consumed by layer/data-conversion code. */
export type ArrowTextStorageInputProps = ArrowTextStorageSharedInputProps & {
  /** GPU UTF-8 or dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /** CPU Arrow vectors explicitly retained by the caller for storage glyph expansion. */
  sourceVectors: ArrowTextStorageSourceVectors;
};

/** Prepared GPU UTF-8 batch consumed by GPUVector-only storage text conversion. */
export type GPUVectorTextStorageBatch = {
  /** Source text rows in this batch. */
  rowCount: number;
  /** Cumulative UTF-8 byte offsets, length = `rowCount + 1`. */
  startIndices: readonly number[];
  /** CPU copy of per-row half-open UTF-8 byte ranges, used for render-batch partitioning. */
  rowByteRanges: Uint32Array;
  /** GPU buffer containing packed per-row half-open UTF-8 byte ranges. */
  rowByteRangesBuffer: Buffer;
  /** GPU buffer containing UTF-8 bytes packed four per `u32` word. */
  utf8BytesBuffer: TextStorageBuffer;
  /** Total UTF-8 byte slots represented by this batch. */
  byteLength: number;
  /** Bytes occupied by row ranges plus UTF-8 bytes. */
  inputByteLength: number;
  /** Whether the storage-state builder should release `rowByteRangesBuffer` after compute. */
  ownsRowByteRangesBuffer?: boolean;
};

/** GPUVector-only input for WebGPU storage text conversion. */
export type GPUVectorTextStorageInputProps = ArrowTextStorageSharedInputProps & {
  /** GPU plain UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /** Optional prepared UTF-8 GPU batches. Defaults to batches derived from `texts` metadata. */
  textBatches?: GPUVectorTextStorageBatch[];
};

/** CPU Arrow vectors still needed by compressed dictionary storage text expansion. */
export type ArrowTextDictionaryStorageSourceVectors = {
  /** CPU UTF-8 labels validated as dictionary-encoded before compressed glyph layout. */
  texts: ArrowUtf8TextVector;
  /** Optional CPU packed clip rectangles aligned with label rows. */
  clipRects?: Vector<FixedSizeList<Int16>>;
};

/** Arrow-to-dictionary-storage conversion input consumed by layer/data-conversion code. */
export type ArrowTextDictionaryStorageInputProps = ArrowTextStorageSharedInputProps & {
  /** GPU dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /** CPU Arrow vectors explicitly retained by the caller for compressed dictionary glyph layout. */
  sourceVectors: ArrowTextDictionaryStorageSourceVectors;
};

/** Render-only props left after Arrow attribute conversion has produced prepared state. */
export type ArrowTextAttributeRenderProps = Omit<
  ArrowTextModelProps,
  | 'positions'
  | 'texts'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
  | 'sourceVectors'
>;

/** Prepared attribute text state plus Arrow diagnostics retained by conversion helpers. */
export type ArrowTextAttributeState = TextAttributeState & {
  /** Props used to build the prepared attribute state. */
  textProps: ArrowTextModelProps;
  /** Expanded glyph table and layout diagnostics. */
  glyphTable: ArrowTextGlyphTable;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Character mapping retained for follow-on conversion diagnostics. */
  mappingState: ResolvedCharacterMapping;
};

/** Render-only props left after Arrow storage conversion has produced prepared state. */
export type ArrowTextStorageRenderProps = Omit<
  ArrowTextStorageInputProps,
  | 'positions'
  | 'texts'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'textAnchors'
  | 'alignmentBaselines'
  | 'rowIndexColumn'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
  | 'sourceVectors'
>;

/** Per-source-batch row bindings retained by {@link ArrowTextStorageState}. */
export type ArrowTextStorageBatchState = {
  /** Global source text row index assigned to local row zero. */
  batchRowIndexBase: number;
  /** Global row-storage index assigned to local row zero. */
  rowStorageIndexBase: number;
  /** Source text rows included in this storage batch. */
  rowCount: number;
  /** Glyph instances generated from this storage batch. */
  glyphCount: number;
  /** Read-only storage buffer for label origins. */
  rowPositionsBuffer: TextStorageBuffer;
  /** Read-only storage buffer for packed RGBA8 row colors. */
  rowColorsBuffer: TextStorageBuffer;
  /** Read-only storage buffer for per-row angles. */
  rowAnglesBuffer: TextStorageBuffer;
  /** Read-only storage buffer for per-row text sizes. */
  rowSizesBuffer: TextStorageBuffer;
  /** Read-only storage buffer for per-row pixel offsets. */
  rowPixelOffsetsBuffer: TextStorageBuffer;
  /** Read-only storage buffer for packed per-row text anchor enums. */
  rowTextAnchorsBuffer: TextStorageBuffer;
  /** Read-only storage buffer for packed per-row alignment baseline enums. */
  rowAlignmentBaselinesBuffer: TextStorageBuffer;
  /** Read-only storage buffer for packed per-row clip rectangles. */
  rowClipRectsBuffer: Buffer;
  /** Optional read-only storage buffer for cumulative row glyph starts. */
  rowGlyphStartsBuffer?: Buffer;
  /** Uniform buffer selecting row style binding usage and constant fallbacks. */
  styleConfigBuffer: DynamicBuffer;
};

/** Generated storage text render-batch state. */
export type ArrowTextStorageRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Global glyph index assigned to local glyph zero. */
  glyphIndexBase: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Uniform buffer scoping row/glyph lookup to this render batch. */
  storageRenderConfigBuffer: DynamicBuffer;
};

/** Reusable WebGPU storage text expansion and row-binding state. */
export type ArrowTextStorageState = {
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compact glyph stream retained for CPU-expanded storage mode. */
  glyphStream?: GpuExpandedTextStream;
  /** Glyph instances across all preserved render batches. */
  glyphCount: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph attributes and render control buffers. */
  glyphAttributeByteLength: number;
  /** CPU time spent building compact glyph stream inputs. */
  compactStreamBuildTimeMs: number;
  /** Bytes occupied by compact glyph stream inputs. */
  compactStreamByteLength: number;
  /** Bytes occupied by generated compact glyph vertex buffers. */
  generatedRenderBufferByteLength: number;
  /** Bytes occupied by row glyph starts and per-render-batch config buffers. */
  renderControlByteLength: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength: number;
  /** Bytes occupied by retained glyph frame/lookup definition resources. */
  glyphDefinitionStorageByteLength: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength: number;
  /** Whether generated glyph records include a per-glyph source-row index attribute. */
  hasGlyphRowIndices?: boolean;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer: Buffer;
  /** Per-source-batch row bindings. */
  batches: ArrowTextStorageBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowTextStorageRenderBatchState[];
  /** Row/default binding resources owned by this storage state. */
  ownedRowBindingResources: TextStorageOwnedResource[];
  /** Glyph definition and render-control resources owned by this storage state. */
  ownedGlyphResources: TextStorageOwnedResource[];
  /** First batch label origin buffer. */
  rowPositionsBuffer: TextStorageBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer: TextStorageBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer: TextStorageBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer: TextStorageBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer: TextStorageBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer: TextStorageBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer: TextStorageBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer: Buffer;
  /** First batch cumulative row glyph start buffer. */
  rowGlyphStartsBuffer: Buffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer: DynamicBuffer;
  /** First render batch row/glyph lookup config uniform buffer. */
  storageRenderConfigBuffer: DynamicBuffer;
  /** First generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Releases owned atlas, row, glyph, and generated render resources. */
  destroy: () => void;
};

/** Render-only props left after Arrow dictionary conversion has produced prepared state. */
export type ArrowTextDictionaryStorageRenderProps = Omit<
  ArrowTextDictionaryStorageInputProps,
  | 'positions'
  | 'texts'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'textAnchors'
  | 'alignmentBaselines'
  | 'rowIndexColumn'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
  | 'sourceVectors'
>;

/** Per-source-batch dictionary glyph storage retained by compressed dictionary text state. */
export type ArrowTextDictionaryStorageBatchState = ArrowTextStorageBatchState & {
  /** Per row `(dictionary index, row glyph start)` records plus one terminal sentinel. */
  rowDictionaryRecordsBuffer: Buffer;
  /** Per dictionary value half-open ranges into `dictionaryGlyphRecordsBuffer`. */
  dictionaryGlyphRangesBuffer: Buffer;
  /** Shared per-glyph layout records for unique dictionary values in this Arrow batch. */
  dictionaryGlyphRecordsBuffer: Buffer;
  /** Glyph atlas frames referenced by the shared dictionary glyph records. */
  glyphFramesBuffer: Buffer;
  /** Shared dictionary glyph records in this Arrow batch. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values in this Arrow batch. */
  dictionaryValueCount: number;
};

/** Generated compressed dictionary text render-batch state. */
export type ArrowTextDictionaryStorageRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Global visible-glyph base for this draw batch; added to `instance_index` in WGSL. */
  glyphIndexBase: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Tiny uniform that scopes row lookup to this render batch. */
  dictionaryRenderConfigBuffer: DynamicBuffer;
};

/** Reusable WebGPU compressed dictionary text storage and row-binding state. */
export type ArrowTextDictionaryStorageState = {
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this dictionary storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compressed dictionary glyph stream retained for diagnostics. */
  glyphStream?: GpuDictionaryCompressedTextStream;
  /** Visible glyph instances across all source text rows. */
  glyphCount: number;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values retained across Arrow data chunks. */
  dictionaryValueCount: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph attributes. */
  glyphAttributeByteLength: number;
  /** CPU time spent building compressed dictionary glyph stream inputs. */
  compactStreamBuildTimeMs: number;
  /** Resident dictionary text storage: row records, dictionary ranges, glyph records, configs. */
  compactStreamByteLength: number;
  /** Currently zero for the compressed dictionary path: instances are implicit draw instances. */
  generatedRenderBufferByteLength: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength: number;
  /** Bytes occupied by retained glyph frame definitions. */
  glyphDefinitionStorageByteLength: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength: number;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer: Buffer;
  /** Per-source-batch row and dictionary glyph bindings. */
  batches: ArrowTextDictionaryStorageBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowTextDictionaryStorageRenderBatchState[];
  /** Row/default binding resources owned by this dictionary storage state. */
  ownedRowBindingResources: TextStorageOwnedResource[];
  /** Dictionary glyph and render-control resources owned by this dictionary storage state. */
  ownedDictionaryResources: TextStorageOwnedResource[];
  /** First batch label origin buffer. */
  rowPositionsBuffer: TextStorageBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer: TextStorageBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer: TextStorageBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer: TextStorageBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer: TextStorageBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer: TextStorageBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer: TextStorageBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer: Buffer;
  /** First batch per-row dictionary reference buffer. */
  rowDictionaryRecordsBuffer: Buffer;
  /** First batch per-dictionary-value glyph range buffer. */
  dictionaryGlyphRangesBuffer: Buffer;
  /** First batch shared dictionary glyph record buffer. */
  dictionaryGlyphRecordsBuffer: Buffer;
  /** First render batch dictionary lookup config uniform buffer. */
  dictionaryRenderConfigBuffer: DynamicBuffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer: DynamicBuffer;
  /** Releases owned atlas, row, dictionary, and generated render resources. */
  destroy: () => void;
};

/** Generated attribute text render-batch state. */
export type ArrowTextRenderBatchState = {
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
};

type TextStorageOwnedResource = Pick<GPUVector, 'destroy'> | Pick<DynamicBuffer, 'destroy'>;
type AnyTextStorageInputProps =
  | ArrowTextStorageInputProps
  | ArrowTextDictionaryStorageInputProps
  | GPUVectorTextStorageInputProps;

/** Build an Arrow glyph table without creating a Model. */
export function buildArrowTextGlyphTable(props: {
  labelTable: Table;
  texts: ArrowUtf8TextVector;
  clipRects?: Vector<FixedSizeList<Int16>>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
  rowIndexBase?: number;
  color?: [number, number, number, number];
  angle?: number;
  size?: number;
}): ArrowTextGlyphTable {
  if (props.labelTable.numRows !== props.texts.length) {
    throw new Error('ArrowTextModel requires labelTable rows to match UTF-8 text rows');
  }
  assertClipRects(props.clipRects, props.texts.length);
  assertColumnAvailable(props.labelTable, GLYPH_OFFSETS_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_FRAMES_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_CLIP_RECTS_COLUMN);
  assertColumnAvailable(props.labelTable, ROW_INDICES_COLUMN);

  const glyphAttributeBuildStartTime = getNow();
  const glyphLayout = buildArrowGlyphLayout({
    texts: props.texts,
    mapping: props.mapping,
    baselineOffset: props.baselineOffset,
    lineHeight: props.lineHeight,
    characterSet: props.characterSet
  });
  const fields: Field[] = [];
  const columns: Record<string, Vector> = {};
  const glyphRowIndices = makeGlyphRowIndices(glyphLayout.startIndices);

  for (const field of props.labelTable.schema.fields) {
    const vector = props.labelTable.getChild(field.name);
    if (!vector) {
      continue;
    }
    if (field.name === 'colors' && isArrowTextCharacterColorType(vector.type)) {
      fields.push(
        new Field(field.name, vector.type.children[0]!.type, field.nullable, field.metadata)
      );
      columns[field.name] = expandArrowTextCharacterColorRows(
        vector as Vector<ArrowTextCharacterColorType>,
        glyphLayout.startIndices,
        props.color
      );
      continue;
    }
    if (!isInstanceCompatibleArrowType(vector.type)) {
      continue;
    }
    fields.push(field);
    columns[field.name] = expandArrowVector(
      vector as Vector<any>,
      glyphRowIndices,
      getArrowTextExpansionNullValue(field.name, props)
    );
  }

  fields.push(makeFixedSizeListField(GLYPH_OFFSETS_COLUMN, new Int16(), 2));
  fields.push(makeFixedSizeListField(GLYPH_FRAMES_COLUMN, new Uint16(), 4));
  if (props.clipRects) {
    fields.push(makeFixedSizeListField(GLYPH_CLIP_RECTS_COLUMN, new Int16(), 4));
  }
  fields.push(new Field(ROW_INDICES_COLUMN, new Uint32(), false));
  columns[GLYPH_OFFSETS_COLUMN] = makeArrowFixedSizeListVector(
    new Int16(),
    2,
    glyphLayout.glyphOffsets
  );
  columns[GLYPH_FRAMES_COLUMN] = makeArrowFixedSizeListVector(
    new Uint16(),
    4,
    glyphLayout.glyphFrames
  );
  if (props.clipRects) {
    columns[GLYPH_CLIP_RECTS_COLUMN] = expandArrowVector(props.clipRects, glyphRowIndices);
  }
  columns[ROW_INDICES_COLUMN] = makeNumericArrowVector(
    new Uint32(),
    makeGlyphRowIndices(glyphLayout.startIndices, props.rowIndexBase)
  );
  const attributeByteLength = getGeneratedAttributeByteLength(columns);
  const glyphAttributeBuildTimeMs = getNow() - glyphAttributeBuildStartTime;

  return {
    table: new Table(new Schema(fields, props.labelTable.schema.metadata), columns),
    glyphLayout,
    characterSet: props.characterSet,
    attributeByteLength,
    glyphAttributeBuildTimeMs
  };
}

type ResolvedArrowTextInputs = {
  labelTable: Table;
  texts: ArrowUtf8TextVector;
  clipRects?: Vector<FixedSizeList<Int16>>;
};

function resolveArrowTextInputs(props: ArrowTextModelProps): ResolvedArrowTextInputs {
  if (!props.sourceVectors) {
    throw new Error('ArrowTextModel requires explicit sourceVectors for CPU glyph expansion');
  }
  assertArrowTextVectorTypes(props);
  assertArrowTextVectorRowAlignment(props);
  assertArrowTextSourceVectorAlignment(props);
  const {sourceVectors} = props;
  const columns: Record<string, Vector> = {
    positions: sourceVectors.positions
  };
  if (sourceVectors.colors) {
    columns['colors'] = sourceVectors.colors;
  }
  if (sourceVectors.angles) {
    columns['angles'] = sourceVectors.angles;
  }
  if (sourceVectors.sizes) {
    columns['sizes'] = sourceVectors.sizes;
  }
  if (sourceVectors.pixelOffsets) {
    columns['pixelOffsets'] = sourceVectors.pixelOffsets;
  }
  const labelTable = new Table(columns);

  return {
    labelTable,
    texts: sourceVectors.texts,
    clipRects: sourceVectors.clipRects
  };
}

/** Resolves one aligned Arrow source-vector batch for attribute glyph expansion. */
export function resolveArrowTextBatchInputs(
  props: ArrowTextModelProps,
  batchIndex: number
): ResolvedArrowTextInputs {
  const {sourceVectors} = props;
  const columns: Record<string, Vector> = {
    positions: getArrowTextSourceBatch(sourceVectors.positions, 'positions', batchIndex)
  };
  appendArrowTextBatchSourceColumn(columns, 'colors', sourceVectors.colors, batchIndex);
  appendArrowTextBatchSourceColumn(columns, 'angles', sourceVectors.angles, batchIndex);
  appendArrowTextBatchSourceColumn(columns, 'sizes', sourceVectors.sizes, batchIndex);
  appendArrowTextBatchSourceColumn(columns, 'pixelOffsets', sourceVectors.pixelOffsets, batchIndex);

  return {
    labelTable: new Table(columns),
    texts: getArrowTextSourceBatch(sourceVectors.texts, 'texts', batchIndex),
    clipRects: sourceVectors.clipRects
      ? (getArrowTextSourceBatch(sourceVectors.clipRects, 'clipRects', batchIndex) as Vector<
          FixedSizeList<Int16>
        >)
      : undefined
  };
}

function appendArrowTextBatchSourceColumn(
  columns: Record<string, Vector>,
  columnName: string,
  vector: Vector | undefined,
  batchIndex: number
): void {
  if (!vector) {
    return;
  }
  columns[columnName] = getArrowTextSourceBatch(vector, columnName, batchIndex);
}

function getArrowTextSourceBatch<T extends DataType>(
  vector: Vector<T>,
  vectorName: string,
  batchIndex: number
): Vector<T> {
  const data = vector.data[batchIndex];
  if (!data) {
    throw new Error(`Arrow text ${vectorName} source is missing batch ${batchIndex}`);
  }
  return new Vector([data]) as Vector<T>;
}

/** Validates the GPUVector Arrow types accepted by attribute text conversion. */
export function assertArrowTextVectorTypes(props: ArrowTextModelProps): void {
  if (!isArrowUtf8TextVector(props.texts)) {
    throw new Error('ArrowTextModel texts must be GPUVector');
  }
  if (!isArrowUtf8TextVector(props.sourceVectors.texts)) {
    throw new Error('ArrowTextModel sourceVectors.texts must be Utf8 or Dictionary<Utf8>');
  }
  if (!util.compareTypes(props.sourceVectors.texts.type, props.texts.type)) {
    throw new Error('ArrowTextModel sourceVectors.texts type must match GPU texts type');
  }
  if (
    !DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('ArrowTextModel positions must be GPUVector');
  }
  if (props.colors && !isArrowTextColorType(props.colors.type)) {
    throw new Error(
      'ArrowTextModel colors must be GPUVector or GPUVector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (props.angles && !(props.angles.type instanceof Float32)) {
    throw new Error('ArrowTextModel angles must be GPUVector');
  }
  if (props.sizes && !(props.sizes.type instanceof Float32)) {
    throw new Error('ArrowTextModel sizes must be GPUVector');
  }
  if (
    props.pixelOffsets &&
    (!DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error('ArrowTextModel pixelOffsets must be GPUVector');
  }
}

function assertArrowTextVectorRowAlignment(props: ArrowTextModelProps): void {
  const rowInputs: Array<[string, GPUVector | undefined]> = [
    ['positions', props.positions],
    ['texts', props.texts],
    ['colors', props.colors],
    ['angles', props.angles],
    ['sizes', props.sizes],
    ['pixelOffsets', props.pixelOffsets],
    ['clipRects', props.clipRects]
  ];
  const suppliedInputs = rowInputs.filter(([, vector]) => vector !== undefined) as Array<
    [string, GPUVector]
  >;
  const [referenceName, referenceVector] = suppliedInputs[0];
  for (const [name, vector] of suppliedInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `ArrowTextModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
  }
}

/** Validates that all attribute text GPUVectors preserve matching batch boundaries. */
export function assertArrowTextVectorBatchAlignment(props: ArrowTextModelProps): void {
  assertArrowTextVectorRowAlignment(props);
  const rowInputs = getArrowTextRowInputs(props);
  const [referenceName, referenceVector] = rowInputs[0];
  for (const [name, vector] of rowInputs.slice(1)) {
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(`ArrowTextModel ${name} batch count must match ${referenceName} batch count`);
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `ArrowTextModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function assertArrowTextSourceVectorAlignment(props: ArrowTextModelProps): void {
  const sourceInputs: Array<[string, GPUVector | undefined, Vector | undefined]> = [
    ['positions', props.positions, props.sourceVectors.positions],
    ['texts', props.texts, props.sourceVectors.texts],
    ['colors', props.colors, props.sourceVectors.colors],
    ['angles', props.angles, props.sourceVectors.angles],
    ['sizes', props.sizes, props.sourceVectors.sizes],
    ['pixelOffsets', props.pixelOffsets, props.sourceVectors.pixelOffsets],
    ['clipRects', props.clipRects, props.sourceVectors.clipRects]
  ];

  for (const [name, gpuVector, sourceVector] of sourceInputs) {
    if (gpuVector && !sourceVector) {
      throw new Error(`ArrowTextModel ${name} GPU rows require matching sourceVectors rows`);
    }
    if (!gpuVector && sourceVector) {
      throw new Error(`ArrowTextModel sourceVectors.${name} requires matching GPU rows`);
    }
    if (!gpuVector || !sourceVector) {
      continue;
    }
    assertSourceVectorMatchesGPUVector('ArrowTextModel', name, gpuVector, sourceVector);
  }
}

function getArrowTextRowInputs(props: ArrowTextModelProps): Array<[string, GPUVector]> {
  return [
    ['positions', props.positions],
    ['texts', props.texts],
    ['colors', props.colors],
    ['angles', props.angles],
    ['sizes', props.sizes],
    ['pixelOffsets', props.pixelOffsets],
    ['clipRects', props.clipRects]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector]>;
}

function assertSourceVectorMatchesGPUVector(
  ownerName: 'ArrowTextModel' | 'ArrowTextStorageModel' | 'ArrowTextDictionaryStorageModel',
  vectorName: string,
  gpuVector: GPUVector,
  sourceVector: Vector
): void {
  if (sourceVector.length !== gpuVector.length) {
    throw new Error(
      `${ownerName} sourceVectors.${vectorName} rows must match GPU rows (${sourceVector.length} !== ${gpuVector.length})`
    );
  }
  if (sourceVector.data.length !== gpuVector.data.length) {
    throw new Error(`${ownerName} sourceVectors.${vectorName} batch count must match GPU batches`);
  }
  for (let batchIndex = 0; batchIndex < sourceVector.data.length; batchIndex++) {
    if (sourceVector.data[batchIndex].length !== gpuVector.data[batchIndex].length) {
      throw new Error(
        `${ownerName} sourceVectors.${vectorName} batch ${batchIndex} rows must match GPU rows`
      );
    }
  }
}

type ResolvedTextStorageBatchRowInputs = {
  batchRowIndexBase: number;
  rowStorageIndexBase: number;
  clipRects?: Vector<FixedSizeList<Int16>>;
  clipRectsBuffer?: TextStorageBuffer;
  positionsBuffer: TextStorageBuffer;
  colorsBuffer?: TextStorageBuffer;
  anglesBuffer?: TextStorageBuffer;
  sizesBuffer?: TextStorageBuffer;
  pixelOffsetsBuffer?: TextStorageBuffer;
  textAnchorsBuffer?: TextStorageBuffer;
  alignmentBaselinesBuffer?: TextStorageBuffer;
};

type ResolvedArrowTextStorageBatchInputs = ResolvedTextStorageBatchRowInputs & {
  texts: ArrowUtf8TextVector;
};

type ResolvedArrowTextStorageInputs = {
  texts: ArrowUtf8TextVector;
  batches: ResolvedArrowTextStorageBatchInputs[];
};

function resolveArrowTextStorageInputs(
  props: ArrowTextStorageInputProps
): ResolvedArrowTextStorageInputs {
  if (!props.sourceVectors) {
    throw new Error(
      'ArrowTextStorageModel requires explicit sourceVectors for CPU glyph expansion'
    );
  }
  assertStorageVectorTypes(props);
  assertTextStorageVectorBatchAlignment(props);
  assertStorageSourceVectorAlignment(props);
  const {sourceVectors} = props;
  const batches: ResolvedArrowTextStorageBatchInputs[] = [];
  let batchRowIndexBase = 0;

  for (let batchIndex = 0; batchIndex < props.texts.data.length; batchIndex++) {
    const textData = props.texts.data[batchIndex];
    const positionsData = props.positions.data[batchIndex];
    batches.push({
      batchRowIndexBase,
      rowStorageIndexBase: getGpuDataRowStorageIndexBase(positionsData, 'positions', batchIndex),
      texts: getArrowTextSourceBatch(sourceVectors.texts, 'texts', batchIndex),
      clipRects: sourceVectors.clipRects
        ? (getArrowTextSourceBatch(sourceVectors.clipRects, 'clipRects', batchIndex) as Vector<
            FixedSizeList<Int16>
          >)
        : undefined,
      positionsBuffer: positionsData.buffer,
      colorsBuffer: props.colors?.data[batchIndex].buffer,
      anglesBuffer: props.angles?.data[batchIndex].buffer,
      sizesBuffer: props.sizes?.data[batchIndex].buffer,
      pixelOffsetsBuffer: props.pixelOffsets?.data[batchIndex].buffer,
      textAnchorsBuffer: props.textAnchors?.data[batchIndex].buffer,
      alignmentBaselinesBuffer: props.alignmentBaselines?.data[batchIndex].buffer
    });
    batchRowIndexBase += textData.length;
  }

  return {texts: sourceVectors.texts, batches};
}

function resolveArrowTextDictionaryStorageInputs(
  props: ArrowTextDictionaryStorageInputProps
): ResolvedArrowTextStorageInputs {
  if (!props.sourceVectors) {
    throw new Error(
      'ArrowTextDictionaryStorageModel requires explicit sourceVectors for compressed dictionary glyph layout'
    );
  }
  assertDictionaryStorageVectorTypes(props);
  assertTextStorageVectorBatchAlignment(props, 'ArrowTextDictionaryStorageModel');
  assertDictionaryStorageSourceVectorAlignment(props);
  const {sourceVectors} = props;
  const batches: ResolvedArrowTextStorageBatchInputs[] = [];
  let batchRowIndexBase = 0;

  for (let batchIndex = 0; batchIndex < props.texts.data.length; batchIndex++) {
    const textData = props.texts.data[batchIndex];
    const positionsData = props.positions.data[batchIndex];
    batches.push({
      batchRowIndexBase,
      rowStorageIndexBase: getGpuDataRowStorageIndexBase(positionsData, 'positions', batchIndex),
      texts: getArrowTextSourceBatch(sourceVectors.texts, 'texts', batchIndex),
      clipRects: sourceVectors.clipRects
        ? (getArrowTextSourceBatch(sourceVectors.clipRects, 'clipRects', batchIndex) as Vector<
            FixedSizeList<Int16>
          >)
        : undefined,
      positionsBuffer: positionsData.buffer,
      colorsBuffer: props.colors?.data[batchIndex].buffer,
      anglesBuffer: props.angles?.data[batchIndex].buffer,
      sizesBuffer: props.sizes?.data[batchIndex].buffer,
      pixelOffsetsBuffer: props.pixelOffsets?.data[batchIndex].buffer,
      textAnchorsBuffer: props.textAnchors?.data[batchIndex].buffer,
      alignmentBaselinesBuffer: props.alignmentBaselines?.data[batchIndex].buffer
    });
    batchRowIndexBase += textData.length;
  }

  return {texts: sourceVectors.texts, batches};
}

type ResolvedGPUVectorTextStorageBatchInputs = ResolvedTextStorageBatchRowInputs &
  GPUVectorTextStorageBatch;

type ResolvedGPUVectorTextStorageInputs = {
  batches: ResolvedGPUVectorTextStorageBatchInputs[];
};

function resolveGPUVectorTextStorageInputs(
  device: Device,
  props: GPUVectorTextStorageInputProps
): ResolvedGPUVectorTextStorageInputs {
  assertGPUVectorTextStorageInputTypes(props);
  assertTextStorageVectorBatchAlignment(props, 'TextStorageModel');

  const preparedTextBatches =
    props.textBatches ?? createGPUVectorTextStorageBatchesFromTexts(device, props);
  if (preparedTextBatches.length !== props.texts.data.length) {
    throw new Error('TextStorageModel textBatches must match texts GPUVector batch count');
  }

  const batches: ResolvedGPUVectorTextStorageBatchInputs[] = [];
  let batchRowIndexBase = 0;
  for (let batchIndex = 0; batchIndex < props.texts.data.length; batchIndex++) {
    const textData = props.texts.data[batchIndex];
    const positionsData = props.positions.data[batchIndex];
    const textBatch = preparedTextBatches[batchIndex];
    if (!textBatch) {
      throw new Error(`TextStorageModel textBatches is missing batch ${batchIndex}`);
    }
    if (textBatch.rowCount !== textData.length) {
      throw new Error('TextStorageModel textBatches rows must match texts GPU rows');
    }
    batches.push({
      ...textBatch,
      batchRowIndexBase,
      rowStorageIndexBase: getGpuDataRowStorageIndexBase(positionsData, 'positions', batchIndex),
      positionsBuffer: positionsData.buffer,
      colorsBuffer: props.colors?.data[batchIndex].buffer,
      anglesBuffer: props.angles?.data[batchIndex].buffer,
      sizesBuffer: props.sizes?.data[batchIndex].buffer,
      pixelOffsetsBuffer: props.pixelOffsets?.data[batchIndex].buffer,
      textAnchorsBuffer: props.textAnchors?.data[batchIndex].buffer,
      alignmentBaselinesBuffer: props.alignmentBaselines?.data[batchIndex].buffer,
      clipRectsBuffer: props.clipRects
        ? getGPUVectorTextStorageClipRectsBuffer(props.clipRects, batchIndex)
        : undefined
    });
    batchRowIndexBase += textData.length;
  }

  return {batches};
}

function assertStorageVectorTypes(props: ArrowTextStorageInputProps): void {
  if (!isArrowUtf8TextVector(props.texts)) {
    throw new Error('ArrowTextStorageModel texts must be GPUVector');
  }
  if (!isArrowUtf8TextVector(props.sourceVectors.texts)) {
    throw new Error('ArrowTextStorageModel sourceVectors.texts must be Utf8 or Dictionary<Utf8>');
  }
  if (!util.compareTypes(props.sourceVectors.texts.type, props.texts.type)) {
    throw new Error('ArrowTextStorageModel sourceVectors.texts type must match GPU texts type');
  }
  if (
    !DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('ArrowTextStorageModel positions must be GPUVector');
  }
  if (
    props.colors &&
    (!DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof Uint8))
  ) {
    throw new Error('ArrowTextStorageModel colors must be GPUVector');
  }
  if (props.angles && !(props.angles.type instanceof Float32)) {
    throw new Error('ArrowTextStorageModel angles must be GPUVector');
  }
  if (props.sizes && !(props.sizes.type instanceof Float32)) {
    throw new Error('ArrowTextStorageModel sizes must be GPUVector');
  }
  if (
    props.pixelOffsets &&
    (!DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error('ArrowTextStorageModel pixelOffsets must be GPUVector');
  }
  if (props.textAnchors && !(props.textAnchors.type instanceof Uint8)) {
    throw new Error('ArrowTextStorageModel textAnchors must be GPUVector');
  }
  if (props.alignmentBaselines && !(props.alignmentBaselines.type instanceof Uint8)) {
    throw new Error('ArrowTextStorageModel alignmentBaselines must be GPUVector');
  }
  const clipRects = props.sourceVectors.clipRects;
  assertClipRects(clipRects as Vector<FixedSizeList<Int16>> | undefined, props.texts.length);
}

function assertGPUVectorTextStorageInputTypes(props: GPUVectorTextStorageInputProps): void {
  assertTextStorageGPUVectorInputs(props as TextStorageInputProps);
  if (props.characterSet === 'auto') {
    throw new Error('TextStorageModel GPUVector conversion does not support characterSet: auto');
  }
  if (!props.characterMapping && props.characterSet === undefined) {
    throw new Error(
      'TextStorageModel GPUVector conversion requires a fixed characterSet or characterMapping'
    );
  }
}

function createGPUVectorTextStorageBatchesFromTexts(
  device: Device,
  props: GPUVectorTextStorageInputProps
): GPUVectorTextStorageBatch[] {
  return props.texts.data.map((data, batchIndex) => {
    if (data.byteOffset !== 0 || data.byteStride !== 1) {
      throw new Error('TextStorageModel GPUVector UTF-8 batches must be zero-offset byte buffers');
    }
    const {valueOffsets, nullBitmap, valueByteLength} = data;
    if (!valueOffsets || valueByteLength === undefined) {
      throw new Error('TextStorageModel GPUVector UTF-8 batches require row offset metadata');
    }
    const rowByteRanges = new Uint32Array(data.length * 2);
    const startIndices = new Array<number>(data.length + 1);
    startIndices[0] = 0;

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const isValid = isGPUVectorTextStorageRowValid(nullBitmap, rowIndex);
      const startIndex = isValid ? (valueOffsets[rowIndex] ?? 0) : 0;
      const endIndex = isValid ? (valueOffsets[rowIndex + 1] ?? startIndex) : startIndex;
      rowByteRanges[rowIndex * 2] = startIndex;
      rowByteRanges[rowIndex * 2 + 1] = endIndex;
      startIndices[rowIndex + 1] = Math.max(startIndices[rowIndex] ?? 0, endIndex);
    }

    const rowByteRangesBuffer = device.createBuffer({
      id: `${props.id || 'text-storage-model'}-utf8-row-byte-ranges-${batchIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: rowByteRanges.byteLength > 0 ? rowByteRanges : new Uint32Array(2)
    });
    return {
      rowCount: data.length,
      startIndices,
      rowByteRanges,
      rowByteRangesBuffer,
      utf8BytesBuffer: data.buffer,
      byteLength: valueByteLength,
      inputByteLength: rowByteRanges.byteLength + valueByteLength,
      ownsRowByteRangesBuffer: true
    };
  });
}

function isGPUVectorTextStorageRowValid(
  nullBitmap: Uint8Array | undefined,
  rowIndex: number
): boolean {
  if (!nullBitmap) {
    return true;
  }
  return (nullBitmap[rowIndex >> 3] & (1 << (rowIndex & 7))) !== 0;
}

function getGPUVectorTextStorageClipRectsBuffer(
  clipRects: GPUVector,
  batchIndex: number
): TextStorageBuffer {
  const clipRectsData = clipRects.data[batchIndex];
  if (!clipRectsData) {
    throw new Error(`TextStorageModel clipRects is missing batch ${batchIndex}`);
  }
  if (
    clipRectsData.byteOffset !== 0 ||
    clipRectsData.byteStride !== Int16Array.BYTES_PER_ELEMENT * 4
  ) {
    throw new Error(
      'TextStorageModel GPUVector clipRects batches must be zero-offset packed Int16x4 buffers'
    );
  }
  return clipRectsData.buffer;
}

function assertTextStorageVectorBatchAlignment(
  props: AnyTextStorageInputProps,
  ownerName:
    | 'ArrowTextStorageModel'
    | 'ArrowTextDictionaryStorageModel'
    | 'TextStorageModel' = 'ArrowTextStorageModel'
): void {
  const rowInputs: Array<[string, GPUVector | undefined]> = [
    ['positions', props.positions],
    ['texts', props.texts],
    ['colors', props.colors],
    ['angles', props.angles],
    ['sizes', props.sizes],
    ['pixelOffsets', props.pixelOffsets],
    ['textAnchors', props.textAnchors],
    ['alignmentBaselines', props.alignmentBaselines],
    ['clipRects', props.clipRects]
  ];
  const suppliedInputs = rowInputs.filter(([, vector]) => vector !== undefined) as Array<
    [string, GPUVector]
  >;
  const [referenceName, referenceVector] = suppliedInputs[0];
  for (const [name, vector] of suppliedInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `${ownerName} ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(`${ownerName} ${name} batch count must match ${referenceName} batch count`);
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `${ownerName} ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function assertStorageSourceVectorAlignment(props: ArrowTextStorageInputProps): void {
  assertSourceVectorMatchesGPUVector(
    'ArrowTextStorageModel',
    'texts',
    props.texts,
    props.sourceVectors.texts
  );
  if (props.clipRects && !props.sourceVectors.clipRects) {
    throw new Error('ArrowTextStorageModel clipRects GPU rows require matching sourceVectors rows');
  }
  if (!props.clipRects && props.sourceVectors.clipRects) {
    throw new Error(
      'ArrowTextStorageModel sourceVectors.clipRects requires matching GPU clipRects rows'
    );
  }
  if (props.clipRects && props.sourceVectors.clipRects) {
    assertSourceVectorMatchesGPUVector(
      'ArrowTextStorageModel',
      'clipRects',
      props.clipRects,
      props.sourceVectors.clipRects
    );
  }
}

function assertDictionaryStorageVectorTypes(props: ArrowTextDictionaryStorageInputProps): void {
  if (!isArrowUtf8DictionaryVector(props.texts)) {
    throw new Error('ArrowTextDictionaryStorageModel texts must be GPUVector');
  }
  if (!isArrowUtf8DictionaryVector(props.sourceVectors.texts)) {
    throw new Error('ArrowTextDictionaryStorageModel sourceVectors.texts must be Dictionary<Utf8>');
  }
  if (!util.compareTypes(props.sourceVectors.texts.type, props.texts.type)) {
    throw new Error(
      'ArrowTextDictionaryStorageModel sourceVectors.texts type must match GPU texts type'
    );
  }
  if (
    !DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('ArrowTextDictionaryStorageModel positions must be GPUVector');
  }
  if (
    props.colors &&
    (!DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof Uint8))
  ) {
    throw new Error('ArrowTextDictionaryStorageModel colors must be GPUVector');
  }
  if (props.angles && !(props.angles.type instanceof Float32)) {
    throw new Error('ArrowTextDictionaryStorageModel angles must be GPUVector');
  }
  if (props.sizes && !(props.sizes.type instanceof Float32)) {
    throw new Error('ArrowTextDictionaryStorageModel sizes must be GPUVector');
  }
  if (
    props.pixelOffsets &&
    (!DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error('ArrowTextDictionaryStorageModel pixelOffsets must be GPUVector');
  }
  if (props.textAnchors && !(props.textAnchors.type instanceof Uint8)) {
    throw new Error('ArrowTextDictionaryStorageModel textAnchors must be GPUVector');
  }
  if (props.alignmentBaselines && !(props.alignmentBaselines.type instanceof Uint8)) {
    throw new Error('ArrowTextDictionaryStorageModel alignmentBaselines must be GPUVector');
  }
  const clipRects = props.sourceVectors.clipRects;
  assertClipRects(clipRects as Vector<FixedSizeList<Int16>> | undefined, props.texts.length);
}

function assertDictionaryStorageSourceVectorAlignment(
  props: ArrowTextDictionaryStorageInputProps
): void {
  assertSourceVectorMatchesGPUVector(
    'ArrowTextDictionaryStorageModel',
    'texts',
    props.texts,
    props.sourceVectors.texts
  );
  if (props.clipRects && !props.sourceVectors.clipRects) {
    throw new Error(
      'ArrowTextDictionaryStorageModel clipRects GPU rows require matching sourceVectors rows'
    );
  }
  if (!props.clipRects && props.sourceVectors.clipRects) {
    throw new Error(
      'ArrowTextDictionaryStorageModel sourceVectors.clipRects requires matching GPU clipRects rows'
    );
  }
  if (props.clipRects && props.sourceVectors.clipRects) {
    assertSourceVectorMatchesGPUVector(
      'ArrowTextDictionaryStorageModel',
      'clipRects',
      props.clipRects,
      props.sourceVectors.clipRects
    );
  }
}

function getGpuDataRowStorageIndexBase(
  data: GPUData,
  vectorName: string,
  batchIndex: number
): number {
  if (!Number.isFinite(data.byteStride) || data.byteStride <= 0) {
    throw new Error(
      `ArrowTextStorageModel ${vectorName} batch ${batchIndex} has invalid byte stride`
    );
  }
  const rowStorageIndexBase = data.byteOffset / data.byteStride;
  if (!Number.isInteger(rowStorageIndexBase)) {
    throw new Error(
      `ArrowTextStorageModel ${vectorName} batch ${batchIndex} byte offset is not row aligned`
    );
  }
  return rowStorageIndexBase;
}

/** Builds reusable attribute text state for GPU/state-only model construction. */
export function createArrowTextAttributeState(
  device: Device,
  props: ArrowTextModelProps
): ArrowTextAttributeState {
  return {
    ...makeArrowTextModelProps(device, props),
    textProps: props
  };
}

function makeArrowTextModelProps(
  device: Device,
  props: ArrowTextModelProps
): {
  modelProps: GPUTableModelProps;
  glyphLayout: ArrowGlyphLayout;
  glyphTable: ArrowTextGlyphTable;
  expandedGlyphVertexData: Buffer;
  renderBatches: ArrowTextRenderBatchState[];
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphAttributeBuildTimeMs: number;
  glyphAttributeByteLength: number;
  sdfRenderSettings: TextSdfRenderSettings;
  defaultFragmentShaderUniforms?: Record<string, unknown>;
  mappingState: ResolvedCharacterMapping;
} {
  const textInputs = resolveArrowTextInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const usesDefaultFragmentShader = props.fs === undefined || props.fs === null;
  const defaultFragmentShaderUniforms = usesDefaultFragmentShader
    ? createTextDefaultFragmentShaderUniforms(props.uniforms, mappingState.sdfRenderSettings)
    : undefined;
  const glyphTable = buildArrowTextGlyphTable({
    labelTable: textInputs.labelTable,
    texts: textInputs.texts,
    clipRects: textInputs.clipRects,
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet: mappingState.characterSet,
    color: props.color,
    angle: props.angle,
    size: props.size
  });
  const shaderLayout = resolveArrowTextShaderLayout(props);
  const generatedBufferBatches = planGeneratedBufferBatches({
    device,
    recordOffsets: glyphTable.glyphLayout.startIndices,
    recordByteStride: textInputs.clipRects
      ? CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
      : EXPANDED_GLYPH_VERTEX_BYTE_STRIDE,
    resourceLabel: 'ArrowTextModel expanded glyph vertex data'
  });
  const expandedGlyphVertexStates = generatedBufferBatches.map(generatedBufferBatch =>
    createExpandedGlyphVertexData(device, props, {
      glyphTable,
      shaderLayout,
      generatedBufferBatch,
      rowIndexBase: 0
    })
  );
  const firstExpandedGlyphVertexState = expandedGlyphVertexStates[0];
  if (!firstExpandedGlyphVertexState) {
    throw new Error('ArrowTextModel requires at least one generated glyph render batch');
  }
  const renderBatches = generatedBufferBatches.map((generatedBufferBatch, batchIndex) => ({
    rowStart: generatedBufferBatch.rowStart,
    rowEnd: generatedBufferBatch.rowEnd,
    glyphCount: generatedBufferBatch.recordCount,
    expandedGlyphVertexData: expandedGlyphVertexStates[batchIndex]!.buffer
  }));
  const expandedGlyphVertexState = firstExpandedGlyphVertexState;
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;

  return {
    modelProps: {
      ...props,
      vs: props.vs ?? (textInputs.clipRects ? DEFAULT_CLIPPED_TEXT_VS : DEFAULT_TEXT_VS),
      fs: props.fs ?? DEFAULT_TEXT_FS,
      uniforms: defaultFragmentShaderUniforms ?? props.uniforms,
      shaderLayout,
      bindings: {
        ...(props.bindings || {}),
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      attributes: {
        ...(props.attributes || {}),
        [EXPANDED_GLYPH_VERTEX_DATA]: expandedGlyphVertexState.buffer
      },
      bufferLayout: [...(props.bufferLayout || []), expandedGlyphVertexState.bufferLayout],
      vertexCount: props.vertexCount ?? 6,
      instanceCount: glyphTable.glyphLayout.glyphCount,
      table: makeGPUTableFromArrowTable(
        device,
        createArrowTextRenderTable(glyphTable.table, generatedBufferBatches),
        {shaderLayout}
      ),
      tableCount: 'none'
    },
    glyphLayout: glyphTable.glyphLayout,
    glyphTable,
    expandedGlyphVertexData: expandedGlyphVertexState.buffer,
    renderBatches,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    glyphAttributeBuildTimeMs: glyphTable.glyphAttributeBuildTimeMs,
    glyphAttributeByteLength: glyphTable.attributeByteLength,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    defaultFragmentShaderUniforms,
    mappingState
  };
}

/** Resolves the attribute text shader layout, selecting the clipped layout when needed. */
export function resolveArrowTextShaderLayout(props: ArrowTextModelProps): ShaderLayout {
  return (
    props.shaderLayout ??
    (props.clipRects ? DEFAULT_CLIPPED_TEXT_SHADER_LAYOUT : DEFAULT_TEXT_SHADER_LAYOUT)
  );
}

/** Builds the glyph render table and splits it to match generated buffer batches when needed. */
export function createArrowTextRenderTable(
  glyphTable: Table,
  generatedBufferBatches?: GeneratedBufferBatch[]
): Table {
  const generatedGlyphColumnNames = new Set([
    GLYPH_OFFSETS_COLUMN,
    GLYPH_FRAMES_COLUMN,
    GLYPH_CLIP_RECTS_COLUMN,
    ROW_INDICES_COLUMN
  ]);
  const fields: Field[] = [];
  const columns: Record<string, Vector> = {};

  for (const field of glyphTable.schema.fields) {
    if (generatedGlyphColumnNames.has(field.name)) {
      continue;
    }
    const vector = glyphTable.getChild(field.name);
    if (!vector) {
      continue;
    }
    fields.push(field);
    columns[field.name] = vector;
  }

  const renderTable = new Table(new Schema(fields, new Map(glyphTable.schema.metadata)), columns);
  if (!generatedBufferBatches || generatedBufferBatches.length <= 1) {
    return renderTable;
  }
  const recordBatches = generatedBufferBatches.flatMap(
    batch => renderTable.slice(batch.recordStart, batch.recordEnd).batches
  );
  return new Table(renderTable.schema, recordBatches);
}

/** Creates the interleaved expanded glyph vertex buffer consumed by the attribute model. */
export function createExpandedGlyphVertexData(
  device: Device,
  props: ArrowTextModelProps,
  {
    glyphTable,
    shaderLayout,
    generatedBufferBatch,
    rowIndexBase = 0
  }: {
    glyphTable: ArrowTextGlyphTable;
    shaderLayout: ShaderLayout;
    generatedBufferBatch: GeneratedBufferBatch;
    rowIndexBase?: number;
  }
): {
  buffer: Buffer;
  bufferLayout: BufferLayout;
  byteLength: number;
} {
  const {glyphLayout} = glyphTable;
  const glyphClipRects = glyphTable.table.getChild(GLYPH_CLIP_RECTS_COLUMN) as Vector<
    FixedSizeList<Int16>
  > | null;
  const glyphClipRectValues = glyphClipRects
    ? (getArrowVectorBufferSource(glyphClipRects) as Int16Array)
    : undefined;
  const byteStride = glyphClipRectValues
    ? CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
    : EXPANDED_GLYPH_VERTEX_BYTE_STRIDE;
  const byteLength = generatedBufferBatch.byteLength;
  const arrayBuffer = new ArrayBuffer(Math.max(byteLength, byteStride));
  const int16Values = new Int16Array(arrayBuffer);
  const uint16Values = new Uint16Array(arrayBuffer);
  const uint32Values = new Uint32Array(arrayBuffer);
  const rowIndices = makeGlyphRowIndices(glyphLayout.startIndices, rowIndexBase);

  for (
    let glyphIndex = generatedBufferBatch.recordStart;
    glyphIndex < generatedBufferBatch.recordEnd;
    glyphIndex++
  ) {
    const batchGlyphIndex = glyphIndex - generatedBufferBatch.recordStart;
    const recordInt16Index = (batchGlyphIndex * byteStride) / Int16Array.BYTES_PER_ELEMENT;
    const recordUint32Index = (batchGlyphIndex * byteStride) / Uint32Array.BYTES_PER_ELEMENT;
    const glyphOffsetIndex = glyphIndex * 2;
    const glyphFrameIndex = glyphIndex * 4;

    int16Values[recordInt16Index] = glyphLayout.glyphOffsets[glyphOffsetIndex];
    int16Values[recordInt16Index + 1] = glyphLayout.glyphOffsets[glyphOffsetIndex + 1];
    uint16Values[recordInt16Index + 2] = glyphLayout.glyphFrames[glyphFrameIndex];
    uint16Values[recordInt16Index + 3] = glyphLayout.glyphFrames[glyphFrameIndex + 1];
    uint16Values[recordInt16Index + 4] = glyphLayout.glyphFrames[glyphFrameIndex + 2];
    uint16Values[recordInt16Index + 5] = glyphLayout.glyphFrames[glyphFrameIndex + 3];
    uint32Values[recordUint32Index + 3] = rowIndices[glyphIndex];

    if (glyphClipRectValues) {
      const glyphClipRectIndex = glyphIndex * 4;
      int16Values[recordInt16Index + 8] = glyphClipRectValues[glyphClipRectIndex];
      int16Values[recordInt16Index + 9] = glyphClipRectValues[glyphClipRectIndex + 1];
      int16Values[recordInt16Index + 10] = glyphClipRectValues[glyphClipRectIndex + 2];
      int16Values[recordInt16Index + 11] = glyphClipRectValues[glyphClipRectIndex + 3];
    }
  }

  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const attributes: NonNullable<BufferLayout['attributes']> = [];
  if (shaderAttributeNames.has(GLYPH_OFFSETS_COLUMN)) {
    attributes.push({attribute: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', byteOffset: 0});
  }
  if (shaderAttributeNames.has(GLYPH_FRAMES_COLUMN)) {
    attributes.push({
      attribute: GLYPH_FRAMES_COLUMN,
      format: 'uint16x4',
      byteOffset: Int16Array.BYTES_PER_ELEMENT * 2
    });
  }
  if (shaderAttributeNames.has(ROW_INDICES_COLUMN)) {
    attributes.push({
      attribute: ROW_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: Int16Array.BYTES_PER_ELEMENT * 6
    });
  }
  if (glyphClipRectValues && shaderAttributeNames.has(GLYPH_CLIP_RECTS_COLUMN)) {
    attributes.push({
      attribute: GLYPH_CLIP_RECTS_COLUMN,
      format: 'sint16x4',
      byteOffset: EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
    });
  }

  return {
    buffer: device.createBuffer({
      id:
        `${props.id || 'arrow-text-model'}-expanded-glyph-vertex-data-` +
        `${generatedBufferBatch.rowStart}`,
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint8Array(arrayBuffer)
    }),
    bufferLayout: {
      name: EXPANDED_GLYPH_VERTEX_DATA,
      stepMode: 'instance',
      byteStride,
      attributes
    },
    byteLength
  };
}

/** Builds reusable WebGPU storage text expansion and row-binding state. */
export function createArrowTextStorageState(
  device: Device,
  props: ArrowTextStorageInputProps
): ArrowTextStorageState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowTextStorageState requires a WebGPU device');
  }
  const textInputs = resolveArrowTextStorageInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-text-storage-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const useGpuUtf8Decode = Boolean(
    mappingState.characterSet &&
      props.characterSet !== 'auto' &&
      isArrowUtf8Vector(textInputs.texts)
  );
  const hasGlyphRowIndices = props.rowIndexColumn === true;
  const compactGlyphVertexByteStride = hasGlyphRowIndices
    ? ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE
    : COMPACT_GLYPH_VERTEX_BYTE_STRIDE;

  let glyphStream: GpuExpandedTextStream | undefined;
  let glyphFrames: StorageGlyphFrameState | undefined;
  let utf8GlyphDefinitions: ReturnType<typeof buildGpuUtf8GlyphDefinitions> | undefined;
  let glyphCount = 0;
  let glyphAttributeBuildTimeMs = 0;
  let compactStreamByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let renderControlByteLength = 0;
  let rowStorageByteLength = 0;
  let glyphDefinitionStorageByteLength = 0;
  let transientComputeInputByteLength = 0;
  const ownedRowStorageResources: TextStorageOwnedResource[] = [];
  const ownedGlyphResources: TextStorageOwnedResource[] = [];
  const batches: ArrowTextStorageBatchState[] = [];
  const renderBatches: ArrowTextStorageRenderBatchState[] = [];
  const defaultBuffers = createTextStorageDefaultBuffers(device, props);
  ownedRowStorageResources.push(...defaultBuffers.ownedResources);
  rowStorageByteLength += defaultBuffers.byteLength;

  if (useGpuUtf8Decode) {
    const glyphDefinitions = buildGpuUtf8GlyphDefinitions({
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet!
    });
    utf8GlyphDefinitions = glyphDefinitions;
    glyphFrames = createStorageGlyphFrames(device, props, glyphDefinitions.glyphFrames);
    glyphDefinitionStorageByteLength = glyphFrames.byteLength;
    for (const [rowBindingBatchIndex, batchInput] of textInputs.batches.entries()) {
      const rowState = createTextStorageBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        mappingState.sdfRenderSettings
      );
      const utf8TextInput = buildGpuUtf8TextInput(batchInput.texts as Vector<Utf8>);
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        utf8TextInput.startIndices
      );
      ownedGlyphResources.push(rowGlyphStarts.buffer);
      renderControlByteLength += rowGlyphStarts.byteLength;
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        glyphDefinitions.glyphMetrics
      );
      const glyphLookup = createStorageGlyphLookup(
        device,
        {id: props.id},
        glyphDefinitions.glyphLookup
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: utf8TextInput.startIndices,
        recordByteStride: compactGlyphVertexByteStride,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowTextStorageModel UTF-8 generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedUtf8TextInput = createPartitionedGpuUtf8TextInput(
          utf8TextInput,
          generatedBufferBatch
        );
        const utf8Input = createGpuUtf8ExpandedInput(
          device,
          {id: props.id},
          {
            utf8TextInput: partitionedUtf8TextInput,
            baselineOffsetY: glyphDefinitions.baselineOffsetY,
            glyphLookupCount: glyphDefinitions.glyphLookup.length / 2,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            batchRowIndexBase: generatedBufferBatch.rowStart,
            rowStorageIndexBase: batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart,
            alignment: createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight)
          }
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedUtf8TextInput.byteLength,
          hasGlyphRowIndices
        );
        dispatchGpuUtf8ExpandedTextCompute(
          device,
          {id: props.id},
          {
            utf8Input,
            glyphLookup,
            glyphMetrics,
            generated,
            outputSlotCount: partitionedUtf8TextInput.byteLength,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeTextStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeTextStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        renderBatches.push({
          rowBindingBatchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedUtf8TextInput.byteLength,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        ownedGlyphResources.push(storageRenderConfigBuffer);
        renderControlByteLength += storageRenderConfigBuffer.byteLength;
        generatedRenderBufferByteLength += generated.byteLength;
        transientComputeInputByteLength += utf8Input.byteLength;
        utf8Input.rowByteRangesBuffer.destroy();
        utf8Input.utf8BytesBuffer.destroy();
        utf8Input.expansionConfigBuffer.destroy();
      }
      batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: utf8TextInput.byteLength,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      glyphCount += utf8TextInput.byteLength;
      glyphAttributeBuildTimeMs += utf8TextInput.textInputBuildTimeMs;
      compactStreamByteLength += utf8TextInput.inputByteLength;
      rowStorageByteLength += rowState.ownedByteLength;
      transientComputeInputByteLength += glyphLookup.byteLength + glyphMetrics.byteLength;
      ownedRowStorageResources.push(...rowState.ownedResources);
      glyphMetrics.buffer.destroy();
      glyphLookup.buffer.destroy();
    }
  } else {
    for (const [batchIndex, batchInput] of textInputs.batches.entries()) {
      const rowState = createTextStorageBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        mappingState.sdfRenderSettings
      );
      const batchGlyphStream = buildGpuExpandedTextStream({
        texts: batchInput.texts,
        mapping: mappingState.mapping,
        baselineOffset: mappingState.baselineOffset,
        lineHeight: mappingState.lineHeight,
        characterSet: mappingState.characterSet
      });
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        batchGlyphStream.startIndices
      );
      ownedGlyphResources.push(rowGlyphStarts.buffer);
      renderControlByteLength += rowGlyphStarts.byteLength;
      glyphStream ??= batchGlyphStream;
      glyphFrames ??= createStorageGlyphFrames(device, props, batchGlyphStream.glyphFrames);
      if (batchIndex === 0) {
        glyphDefinitionStorageByteLength = glyphFrames.byteLength;
      }
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        batchGlyphStream.glyphMetrics
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: batchGlyphStream.startIndices,
        recordByteStride: compactGlyphVertexByteStride,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowTextStorageModel compact generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedGlyphStream = createPartitionedGpuExpandedTextStream(
          batchGlyphStream,
          generatedBufferBatch
        );
        const compactInput = createGpuExpandedCompactInput(
          device,
          {id: props.id},
          partitionedGlyphStream,
          generatedBufferBatch.rowStart,
          createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight),
          batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedGlyphStream.glyphCount,
          hasGlyphRowIndices
        );
        dispatchGpuExpandedTextCompute(
          device,
          {id: props.id},
          {
            compactInput,
            glyphMetrics,
            generated,
            glyphCount: partitionedGlyphStream.glyphCount,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeTextStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeTextStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        renderBatches.push({
          rowBindingBatchIndex: batchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedGlyphStream.glyphCount,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        ownedGlyphResources.push(storageRenderConfigBuffer);
        renderControlByteLength += storageRenderConfigBuffer.byteLength;
        generatedRenderBufferByteLength += generated.byteLength;
        transientComputeInputByteLength += compactInput.byteLength;
        compactInput.glyphRangesBuffer.destroy();
        compactInput.glyphIdsBuffer.destroy();
        compactInput.expansionConfigBuffer.destroy();
      }
      batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: batchGlyphStream.glyphCount,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      glyphCount += batchGlyphStream.glyphCount;
      glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
      compactStreamByteLength += batchGlyphStream.compactStreamByteLength;
      rowStorageByteLength += rowState.ownedByteLength;
      transientComputeInputByteLength += glyphMetrics.byteLength;
      ownedRowStorageResources.push(...rowState.ownedResources);
      glyphMetrics.buffer.destroy();
    }
  }

  glyphFrames ??= createStorageGlyphFrames(device, props, new Float32Array(4));
  const firstBatch = getFirstArrowTextStorageBatch({batches});
  const firstRenderBatch = getFirstArrowTextStorageRenderBatch({renderBatches});
  let destroyed = false;
  const storageState: ArrowTextStorageState = {
    glyphStream,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet: mappingState.characterSet,
    glyphCount,
    glyphAttributeBuildTimeMs,
    glyphAttributeByteLength: generatedRenderBufferByteLength + renderControlByteLength,
    compactStreamBuildTimeMs: glyphAttributeBuildTimeMs,
    compactStreamByteLength,
    generatedRenderBufferByteLength,
    renderControlByteLength,
    rowStorageByteLength,
    glyphDefinitionStorageByteLength,
    transientComputeInputByteLength,
    hasGlyphRowIndices,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    batches,
    renderBatches,
    ownedRowBindingResources: ownedRowStorageResources,
    ownedGlyphResources,
    rowPositionsBuffer: firstBatch.rowPositionsBuffer,
    rowColorsBuffer: firstBatch.rowColorsBuffer,
    rowAnglesBuffer: firstBatch.rowAnglesBuffer,
    rowSizesBuffer: firstBatch.rowSizesBuffer,
    rowPixelOffsetsBuffer: firstBatch.rowPixelOffsetsBuffer,
    rowTextAnchorsBuffer: firstBatch.rowTextAnchorsBuffer,
    rowAlignmentBaselinesBuffer: firstBatch.rowAlignmentBaselinesBuffer,
    rowClipRectsBuffer: firstBatch.rowClipRectsBuffer,
    rowGlyphStartsBuffer: getArrowTextStorageRowGlyphStartsBuffer(firstBatch),
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    storageRenderConfigBuffer: firstRenderBatch.storageRenderConfigBuffer,
    glyphFramesBuffer: glyphFrames.buffer,
    compactGlyphVertexData: firstRenderBatch.compactGlyphVertexData,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      destroyTextStorageResources(ownedRowStorageResources);
      destroyTextStorageResources(ownedGlyphResources);
      glyphFrames.buffer.destroy();
      for (const renderBatch of renderBatches) {
        renderBatch.compactGlyphVertexData.destroy();
      }
    }
  };
  arrowTextStorageAppendContexts.set(storageState, {
    defaultBuffers,
    mappingState,
    useGpuUtf8Decode,
    utf8GlyphDefinitions
  });
  return storageState;
}

/** Builds reusable WebGPU storage text state directly from GPUVector inputs. */
export function createTextStorageStateFromGPUVectors(
  device: Device,
  props: GPUVectorTextStorageInputProps
): ArrowTextStorageState {
  if (device.type !== 'webgpu') {
    throw new Error('createTextStorageStateFromGPUVectors requires a WebGPU device');
  }
  const textInputs = resolveGPUVectorTextStorageInputs(device, props);
  const mappingState = resolveGPUVectorStorageCharacterMapping(props);
  const characterSet = mappingState.characterSet ?? new Set(Object.keys(mappingState.mapping));
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'text-storage-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const glyphDefinitions = buildGpuUtf8GlyphDefinitions({
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet
  });
  const glyphFrames = createStorageGlyphFrames(device, props, glyphDefinitions.glyphFrames);
  const hasGlyphRowIndices = props.rowIndexColumn === true;
  const compactGlyphVertexByteStride = hasGlyphRowIndices
    ? ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE
    : COMPACT_GLYPH_VERTEX_BYTE_STRIDE;

  let glyphCount = 0;
  let compactStreamByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let renderControlByteLength = 0;
  let rowStorageByteLength = 0;
  let transientComputeInputByteLength = 0;
  const ownedRowStorageResources: TextStorageOwnedResource[] = [];
  const ownedGlyphResources: TextStorageOwnedResource[] = [];
  const batches: ArrowTextStorageBatchState[] = [];
  const renderBatches: ArrowTextStorageRenderBatchState[] = [];
  const defaultBuffers = createTextStorageDefaultBuffers(device, props);
  ownedRowStorageResources.push(...defaultBuffers.ownedResources);
  rowStorageByteLength += defaultBuffers.byteLength;

  for (const [rowBindingBatchIndex, batchInput] of textInputs.batches.entries()) {
    const rowState = createTextStorageBatchRowState(
      device,
      props,
      batchInput,
      defaultBuffers,
      mappingState.sdfRenderSettings
    );
    const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
      device,
      props,
      batchInput.batchRowIndexBase,
      batchInput.startIndices
    );
    ownedGlyphResources.push(rowGlyphStarts.buffer);
    renderControlByteLength += rowGlyphStarts.byteLength;
    const glyphMetrics = createStorageGlyphMetrics(
      device,
      {id: props.id},
      glyphDefinitions.glyphMetrics
    );
    const glyphLookup = createStorageGlyphLookup(
      device,
      {id: props.id},
      glyphDefinitions.glyphLookup
    );
    const generatedBufferBatches = planGeneratedBufferBatches({
      device,
      recordOffsets: batchInput.startIndices,
      recordByteStride: compactGlyphVertexByteStride,
      maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
      resourceLabel: 'TextStorageModel GPUVector UTF-8 generated glyph vertex data'
    });

    for (const generatedBufferBatch of generatedBufferBatches) {
      const partitionedInput = createPartitionedGpuVectorUtf8TextInput(
        device,
        props,
        batchInput,
        generatedBufferBatch
      );
      const utf8Input = createGpuUtf8ExpandedInputFromBuffers(
        device,
        {id: props.id},
        {
          rowByteRangesBuffer: partitionedInput.rowByteRangesBuffer,
          utf8BytesBuffer: getComputeTextStorageBuffer(batchInput.utf8BytesBuffer),
          inputByteLength: partitionedInput.inputByteLength,
          baselineOffsetY: glyphDefinitions.baselineOffsetY,
          glyphLookupCount: glyphDefinitions.glyphLookup.length / 2,
          labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
          batchRowIndexBase: generatedBufferBatch.rowStart,
          rowStorageIndexBase: batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart,
          outputByteBase: generatedBufferBatch.recordStart,
          alignment: createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight)
        }
      );
      const generated = createGpuExpandedGeneratedState(
        device,
        {id: props.id},
        generatedBufferBatch.recordCount,
        hasGlyphRowIndices
      );
      dispatchGpuUtf8ExpandedTextCompute(
        device,
        {id: props.id},
        {
          utf8Input,
          glyphLookup,
          glyphMetrics,
          generated,
          outputSlotCount: generatedBufferBatch.recordCount,
          labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
          alignment: {
            rowTextAnchorsBuffer: getComputeTextStorageBuffer(rowState.rowTextAnchorsBuffer),
            rowAlignmentBaselinesBuffer: getComputeTextStorageBuffer(
              rowState.rowAlignmentBaselinesBuffer
            )
          }
        }
      );
      const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        generatedBufferBatch
      );
      renderBatches.push({
        rowBindingBatchIndex,
        rowStart: generatedBufferBatch.rowStart,
        rowEnd: generatedBufferBatch.rowEnd,
        glyphIndexBase: generatedBufferBatch.recordStart,
        glyphCount: generatedBufferBatch.recordCount,
        compactGlyphVertexData: generated.compactGlyphVertexData,
        storageRenderConfigBuffer
      });
      ownedGlyphResources.push(storageRenderConfigBuffer);
      renderControlByteLength += storageRenderConfigBuffer.byteLength;
      generatedRenderBufferByteLength += generated.byteLength;
      transientComputeInputByteLength += utf8Input.byteLength;
      utf8Input.expansionConfigBuffer.destroy();
      if (partitionedInput.ownsRowByteRangesBuffer) {
        partitionedInput.rowByteRangesBuffer.destroy();
      }
    }

    batches.push({
      ...rowState,
      batchRowIndexBase: batchInput.batchRowIndexBase,
      rowCount: batchInput.rowCount,
      glyphCount: batchInput.byteLength,
      rowGlyphStartsBuffer: rowGlyphStarts.buffer
    });
    glyphCount += batchInput.byteLength;
    compactStreamByteLength += batchInput.inputByteLength;
    rowStorageByteLength += rowState.ownedByteLength;
    transientComputeInputByteLength += glyphLookup.byteLength + glyphMetrics.byteLength;
    ownedRowStorageResources.push(...rowState.ownedResources);
    glyphMetrics.buffer.destroy();
    glyphLookup.buffer.destroy();
    if (batchInput.ownsRowByteRangesBuffer) {
      batchInput.rowByteRangesBuffer.destroy();
    }
  }

  const firstBatch = getFirstArrowTextStorageBatch({batches});
  const firstRenderBatch = getFirstArrowTextStorageRenderBatch({renderBatches});
  let destroyed = false;
  return {
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet,
    glyphCount,
    glyphAttributeBuildTimeMs: 0,
    glyphAttributeByteLength: generatedRenderBufferByteLength + renderControlByteLength,
    compactStreamBuildTimeMs: 0,
    compactStreamByteLength,
    generatedRenderBufferByteLength,
    renderControlByteLength,
    rowStorageByteLength,
    glyphDefinitionStorageByteLength: glyphFrames.byteLength,
    transientComputeInputByteLength,
    hasGlyphRowIndices,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    glyphFramesBuffer: glyphFrames.buffer,
    batches,
    renderBatches,
    ownedRowBindingResources: ownedRowStorageResources,
    ownedGlyphResources,
    rowPositionsBuffer: firstBatch.rowPositionsBuffer,
    rowColorsBuffer: firstBatch.rowColorsBuffer,
    rowAnglesBuffer: firstBatch.rowAnglesBuffer,
    rowSizesBuffer: firstBatch.rowSizesBuffer,
    rowPixelOffsetsBuffer: firstBatch.rowPixelOffsetsBuffer,
    rowTextAnchorsBuffer: firstBatch.rowTextAnchorsBuffer,
    rowAlignmentBaselinesBuffer: firstBatch.rowAlignmentBaselinesBuffer,
    rowClipRectsBuffer: firstBatch.rowClipRectsBuffer,
    rowGlyphStartsBuffer: getArrowTextStorageRowGlyphStartsBuffer(firstBatch),
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    storageRenderConfigBuffer: firstRenderBatch.storageRenderConfigBuffer,
    compactGlyphVertexData: firstRenderBatch.compactGlyphVertexData,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      destroyTextStorageResources(ownedRowStorageResources);
      destroyTextStorageResources(ownedGlyphResources);
      glyphFrames.buffer.destroy();
      for (const renderBatch of renderBatches) {
        renderBatch.compactGlyphVertexData.destroy();
      }
    }
  };
}

/** Builds reusable WebGPU compressed dictionary text storage state. */
export function createArrowTextDictionaryStorageState(
  device: Device,
  props: ArrowTextDictionaryStorageInputProps
): ArrowTextDictionaryStorageState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowTextDictionaryStorageState requires a WebGPU device');
  }
  const textInputs = resolveArrowTextDictionaryStorageInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-dictionary-text-storage-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;

  let glyphStream: GpuDictionaryCompressedTextStream | undefined;
  let glyphCount = 0;
  let dictionaryGlyphCount = 0;
  let dictionaryValueCount = 0;
  let glyphAttributeBuildTimeMs = 0;
  let compactStreamByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let rowStorageByteLength = 0;
  let glyphDefinitionStorageByteLength = 0;
  const ownedRowStorageResources: TextStorageOwnedResource[] = [];
  const ownedDictionaryResources: TextStorageOwnedResource[] = [];
  const batches: ArrowTextDictionaryStorageBatchState[] = [];
  const renderBatches: ArrowTextDictionaryStorageRenderBatchState[] = [];
  const defaultBuffers = createTextStorageDefaultBuffers(device, props);
  ownedRowStorageResources.push(...defaultBuffers.ownedResources);
  rowStorageByteLength += defaultBuffers.byteLength;

  for (const [rowBindingBatchIndex, batchInput] of textInputs.batches.entries()) {
    // Row/style buffers stay row-aligned and are shared with the storage text path.
    // The dictionary-specific buffers below only describe text content.
    const rowState = createTextStorageBatchRowState(
      device,
      props,
      batchInput,
      defaultBuffers,
      mappingState.sdfRenderSettings
    );
    const batchGlyphStream = buildGpuDictionaryCompressedTextStream({
      texts: batchInput.texts as Vector<ArrowUtf8Dictionary>,
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet
    });
    // One record per row plus a terminal sentinel lets the shader recover the
    // row for an instance_index by binary-searching visible glyph starts.
    const rowDictionaryRecords = createDictionaryRowRecords(batchGlyphStream);
    const rowDictionaryRecordsBuffer = createDictionaryStorageBuffer(
      device,
      props,
      `row-dictionary-records-${batchInput.batchRowIndexBase}`,
      rowDictionaryRecords,
      new Uint32Array(2)
    );
    // One range per unique dictionary value. Repeated rows reference these
    // ranges instead of storing their own glyph ids and layout offsets.
    const dictionaryGlyphRangesBuffer = createDictionaryStorageBuffer(
      device,
      props,
      `dictionary-glyph-ranges-${batchInput.batchRowIndexBase}`,
      batchGlyphStream.dictionaryGlyphRanges,
      new Uint32Array(2)
    );
    // Shared glyph layout records for dictionary strings in this Arrow batch.
    // This is the main compressed payload and scales with unique dictionary text.
    const dictionaryGlyphRecordsBuffer = createDictionaryStorageBuffer(
      device,
      props,
      `dictionary-glyph-records-${batchInput.batchRowIndexBase}`,
      batchGlyphStream.dictionaryGlyphRecords,
      new Uint32Array(2)
    );
    const glyphFrames = createStorageGlyphFrames(device, props, batchGlyphStream.glyphFrames);
    const generatedBufferBatches = planGeneratedBufferBatches({
      device,
      recordOffsets: batchGlyphStream.startIndices,
      // The dictionary model does not allocate a generated vertex buffer; the
      // planner is used only to split draw instance counts by device limits.
      recordByteStride: 1,
      maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
      resourceLabel: 'ArrowTextDictionaryStorageModel glyph instances'
    });

    for (const generatedBufferBatch of generatedBufferBatches) {
      const dictionaryRenderConfigBuffer = createDictionaryRenderConfigBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        generatedBufferBatch
      );
      renderBatches.push({
        rowBindingBatchIndex,
        rowStart: generatedBufferBatch.rowStart,
        rowEnd: generatedBufferBatch.rowEnd,
        glyphIndexBase: generatedBufferBatch.recordStart,
        glyphCount: generatedBufferBatch.recordCount,
        dictionaryRenderConfigBuffer
      });
      ownedDictionaryResources.push(dictionaryRenderConfigBuffer);
      compactStreamByteLength += dictionaryRenderConfigBuffer.byteLength;
    }

    batches.push({
      ...rowState,
      batchRowIndexBase: batchInput.batchRowIndexBase,
      rowCount: batchInput.texts.length,
      glyphCount: batchGlyphStream.glyphCount,
      rowDictionaryRecordsBuffer,
      dictionaryGlyphRangesBuffer,
      dictionaryGlyphRecordsBuffer,
      glyphFramesBuffer: glyphFrames.buffer,
      dictionaryGlyphCount: batchGlyphStream.dictionaryGlyphCount,
      dictionaryValueCount: batchGlyphStream.dictionaryValueCount
    });
    glyphStream ??= batchGlyphStream;
    glyphCount += batchGlyphStream.glyphCount;
    dictionaryGlyphCount += batchGlyphStream.dictionaryGlyphCount;
    dictionaryValueCount += batchGlyphStream.dictionaryValueCount;
    glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
    compactStreamByteLength +=
      rowDictionaryRecords.byteLength +
      batchGlyphStream.dictionaryGlyphRanges.byteLength +
      batchGlyphStream.dictionaryGlyphRecords.byteLength;
    rowStorageByteLength += rowState.ownedByteLength;
    glyphDefinitionStorageByteLength += glyphFrames.byteLength;
    ownedRowStorageResources.push(...rowState.ownedResources);
    ownedDictionaryResources.push(
      rowDictionaryRecordsBuffer,
      dictionaryGlyphRangesBuffer,
      dictionaryGlyphRecordsBuffer,
      glyphFrames.buffer
    );
  }

  const firstBatch = getFirstArrowTextDictionaryStorageBatch({batches});
  const firstRenderBatch = getFirstArrowTextDictionaryStorageRenderBatch({renderBatches});
  let destroyed = false;
  const storageState: ArrowTextDictionaryStorageState = {
    glyphStream,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet: mappingState.characterSet,
    glyphCount,
    dictionaryGlyphCount,
    dictionaryValueCount,
    glyphAttributeBuildTimeMs,
    glyphAttributeByteLength: generatedRenderBufferByteLength,
    compactStreamBuildTimeMs: glyphAttributeBuildTimeMs,
    compactStreamByteLength,
    generatedRenderBufferByteLength,
    rowStorageByteLength,
    glyphDefinitionStorageByteLength,
    transientComputeInputByteLength: 0,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    batches,
    renderBatches,
    ownedRowBindingResources: ownedRowStorageResources,
    ownedDictionaryResources,
    rowPositionsBuffer: firstBatch.rowPositionsBuffer,
    rowColorsBuffer: firstBatch.rowColorsBuffer,
    rowAnglesBuffer: firstBatch.rowAnglesBuffer,
    rowSizesBuffer: firstBatch.rowSizesBuffer,
    rowPixelOffsetsBuffer: firstBatch.rowPixelOffsetsBuffer,
    rowTextAnchorsBuffer: firstBatch.rowTextAnchorsBuffer,
    rowAlignmentBaselinesBuffer: firstBatch.rowAlignmentBaselinesBuffer,
    rowClipRectsBuffer: firstBatch.rowClipRectsBuffer,
    rowDictionaryRecordsBuffer: firstBatch.rowDictionaryRecordsBuffer,
    dictionaryGlyphRangesBuffer: firstBatch.dictionaryGlyphRangesBuffer,
    dictionaryGlyphRecordsBuffer: firstBatch.dictionaryGlyphRecordsBuffer,
    dictionaryRenderConfigBuffer: firstRenderBatch.dictionaryRenderConfigBuffer,
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    glyphFramesBuffer: firstBatch.glyphFramesBuffer,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      destroyTextStorageResources(ownedRowStorageResources);
      destroyTextStorageResources(ownedDictionaryResources);
    }
  };
  return storageState;
}

function createDictionaryRenderConfigBuffer(
  device: Device,
  props: ArrowTextDictionaryStorageInputProps,
  batchRowIndexBase: number,
  generatedBufferBatch: GeneratedBufferBatch
): DynamicBuffer {
  // The render config is the only per-render-batch dictionary allocation. It
  // tells WGSL which visible-glyph instance range and row range this draw owns.
  const data = new Uint32Array(
    DICTIONARY_RENDER_CONFIG_BYTE_LENGTH / Uint32Array.BYTES_PER_ELEMENT
  );
  data[0] = generatedBufferBatch.recordStart;
  data[1] = generatedBufferBatch.rowStart;
  data[2] = generatedBufferBatch.rowEnd;
  data[3] = 0;
  return new DynamicBuffer(device, {
    id:
      `${props.id || 'arrow-dictionary-text-storage-model'}-render-config-` +
      `${batchRowIndexBase}-${generatedBufferBatch.rowStart}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
}

function createStorageRenderConfigBuffer(
  device: Device,
  props: AnyTextStorageInputProps,
  batchRowIndexBase: number,
  generatedBufferBatch: GeneratedBufferBatch
): DynamicBuffer {
  const data = new Uint32Array(STORAGE_RENDER_CONFIG_BYTE_LENGTH / Uint32Array.BYTES_PER_ELEMENT);
  data[0] = generatedBufferBatch.recordStart;
  data[1] = generatedBufferBatch.rowStart;
  data[2] = generatedBufferBatch.rowEnd;
  data[3] = 0;
  return new DynamicBuffer(device, {
    id:
      `${props.id || 'arrow-text-storage-model'}-render-config-` +
      `${batchRowIndexBase}-${generatedBufferBatch.rowStart}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
}

function createStorageRowGlyphStartsBuffer(
  device: Device,
  props: AnyTextStorageInputProps,
  batchRowIndexBase: number,
  startIndices: readonly number[]
): {buffer: Buffer; byteLength: number} {
  const rowGlyphStarts = new Uint32Array(startIndices);
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'arrow-text-storage-model'}-row-glyph-starts-${batchRowIndexBase}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: rowGlyphStarts.byteLength > 0 ? rowGlyphStarts : new Uint32Array(1)
    }),
    byteLength: rowGlyphStarts.byteLength
  };
}

function createDictionaryRowRecords(glyphStream: GpuDictionaryCompressedTextStream): Uint32Array {
  const rowCount = glyphStream.rowDictionaryIndices.length;
  const records = new Uint32Array((rowCount + 1) * 2);
  // Pair each row's dictionary key with the first visible glyph occurrence for
  // that row. The final sentinel makes row-end lookup a single indexed read.
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    records[rowIndex * 2] = glyphStream.rowDictionaryIndices[rowIndex] ?? INVALID_DICTIONARY_INDEX;
    records[rowIndex * 2 + 1] = glyphStream.rowGlyphRanges[rowIndex * 2] ?? 0;
  }
  records[rowCount * 2] = INVALID_DICTIONARY_INDEX;
  records[rowCount * 2 + 1] = glyphStream.glyphCount;
  return records;
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function resolveCharacterMapping(
  props: ArrowTextModelProps | AnyTextStorageInputProps,
  texts: ArrowUtf8TextVector
): ResolvedCharacterMapping {
  const characterSet =
    props.characterSet === 'auto'
      ? collectArrowCharacterSet(texts)
      : normalizeCharacterSet(props.characterSet);
  const lineHeightMultiplier = props.lineHeight ?? 1;

  if (props.characterMapping) {
    const fontSize = props.fontSettings?.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize;
    return {
      mapping: props.characterMapping,
      baselineOffset: props.fontAtlas?.baselineOffset ?? 0,
      lineHeight: lineHeightMultiplier * fontSize,
      characterSet,
      fontAtlas: props.fontAtlas,
      sdfRenderSettings: resolveTextSdfRenderSettings(props)
    };
  }

  const fontAtlasManager = props.fontAtlasManager ?? new FontAtlasManager();
  fontAtlasManager.setProps({
    ...(props.fontSettings || {}),
    ...(characterSet ? {characterSet} : {})
  });
  const fontAtlas = fontAtlasManager.atlas;
  const mapping = fontAtlasManager.mapping;
  if (!fontAtlas || !mapping) {
    throw new Error('Text models require a generated or injected font atlas mapping');
  }

  return {
    mapping,
    baselineOffset: fontAtlas.baselineOffset,
    lineHeight: lineHeightMultiplier * fontAtlasManager.props.fontSize,
    characterSet,
    fontAtlasManager,
    fontAtlas,
    sdfRenderSettings: resolveTextSdfRenderSettings(props, fontAtlasManager)
  };
}

function resolveGPUVectorStorageCharacterMapping(
  props: GPUVectorTextStorageInputProps
): ResolvedCharacterMapping {
  if (props.characterSet === 'auto') {
    throw new Error('TextStorageModel GPUVector conversion does not support characterSet: auto');
  }
  const characterSet = normalizeCharacterSet(props.characterSet);
  const lineHeightMultiplier = props.lineHeight ?? 1;

  if (props.characterMapping) {
    const fontSize = props.fontSettings?.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize;
    return {
      mapping: props.characterMapping,
      baselineOffset: props.fontAtlas?.baselineOffset ?? 0,
      lineHeight: lineHeightMultiplier * fontSize,
      characterSet: characterSet ?? new Set(Object.keys(props.characterMapping)),
      fontAtlas: props.fontAtlas,
      sdfRenderSettings: resolveTextSdfRenderSettings(props)
    };
  }

  const fontAtlasManager = props.fontAtlasManager ?? new FontAtlasManager();
  fontAtlasManager.setProps({
    ...(props.fontSettings || {}),
    ...(characterSet ? {characterSet} : {})
  });
  const fontAtlas = fontAtlasManager.atlas;
  const mapping = fontAtlasManager.mapping;
  if (!fontAtlas || !mapping) {
    throw new Error('TextStorageModel requires a generated or injected font atlas mapping');
  }

  return {
    mapping,
    baselineOffset: fontAtlas.baselineOffset,
    lineHeight: lineHeightMultiplier * fontAtlasManager.props.fontSize,
    characterSet: characterSet ?? new Set(Object.keys(mapping)),
    fontAtlasManager,
    fontAtlas,
    sdfRenderSettings: resolveTextSdfRenderSettings(props, fontAtlasManager)
  };
}

function collectArrowCharacterSet(texts: ArrowUtf8TextVector): Set<string> {
  const characterSet = new Set<string>();
  if (isArrowUtf8DictionaryType(texts.type)) {
    for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
      const value = texts.get(rowIndex);
      if (typeof value !== 'string') {
        continue;
      }
      for (const character of Array.from(value)) {
        characterSet.add(character);
      }
    }
    return characterSet;
  }

  const chunks = buildArrowUtf8Chunks(texts as Vector<Utf8>);
  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    decodeArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex, codePoint => {
      characterSet.add(String.fromCodePoint(codePoint));
    });
  }
  return characterSet;
}

function normalizeCharacterSet(
  characterSet: FontSettings['characterSet'] | undefined
): Set<string> | undefined {
  if (!characterSet) {
    return undefined;
  }
  return typeof characterSet === 'string'
    ? new Set(Array.from(characterSet))
    : new Set(characterSet);
}

function resolveTextSdfRenderSettings(
  props: ArrowTextModelProps | AnyTextStorageInputProps,
  fontAtlasManager?: FontAtlasManager
): TextSdfRenderSettings {
  const fontSettings = fontAtlasManager?.props ?? {
    ...DEFAULT_FONT_SETTINGS,
    ...(props.fontSettings || {})
  };
  return {
    sdf: fontSettings.sdf,
    threshold: 1 - fontSettings.cutoff,
    smoothing: Math.max(0, fontSettings.smoothing)
  };
}

function assertColumnAvailable(table: Table, columnName: string): void {
  if (table.getChild(columnName)) {
    throw new Error(`ArrowTextModel labelTable column "${columnName}" is reserved`);
  }
}

function assertClipRects(
  clipRects: Vector<FixedSizeList<Int16>> | undefined,
  labelCount: number
): void {
  if (!clipRects) {
    return;
  }
  if (clipRects.length !== labelCount) {
    throw new Error('ArrowTextModel clipRects rows must match UTF-8 text rows');
  }
  if (
    !DataType.isFixedSizeList(clipRects.type) ||
    clipRects.type.listSize !== 4 ||
    !(clipRects.type.children[0]?.type instanceof Int16)
  ) {
    throw new Error('ArrowTextModel clipRects must be FixedSizeList<Int16>[4]');
  }
}

type TextStorageDefaultBuffers = {
  colorsBuffer: Buffer;
  anglesBuffer: Buffer;
  sizesBuffer: Buffer;
  pixelOffsetsBuffer: Buffer;
  textAnchorsBuffer: Buffer;
  alignmentBaselinesBuffer: Buffer;
  clipRectsBuffer: Buffer;
  byteLength: number;
  ownedResources: TextStorageOwnedResource[];
};

type TextStorageBatchRowState = {
  rowStorageIndexBase: number;
  rowPositionsBuffer: TextStorageBuffer;
  rowColorsBuffer: TextStorageBuffer;
  rowAnglesBuffer: TextStorageBuffer;
  rowSizesBuffer: TextStorageBuffer;
  rowPixelOffsetsBuffer: TextStorageBuffer;
  rowTextAnchorsBuffer: TextStorageBuffer;
  rowAlignmentBaselinesBuffer: TextStorageBuffer;
  rowClipRectsBuffer: Buffer;
  styleConfigBuffer: DynamicBuffer;
  ownedResources: TextStorageOwnedResource[];
  ownedByteLength: number;
};

type StorageGlyphFrameState = {
  buffer: Buffer;
  byteLength: number;
};

type ArrowTextStorageAppendContext = {
  defaultBuffers: TextStorageDefaultBuffers;
  mappingState: ResolvedCharacterMapping;
  useGpuUtf8Decode: boolean;
  utf8GlyphDefinitions?: ReturnType<typeof buildGpuUtf8GlyphDefinitions>;
};

const arrowTextStorageAppendContexts = new WeakMap<
  ArrowTextStorageState,
  ArrowTextStorageAppendContext
>();

function createTextStorageDefaultBuffers(
  device: Device,
  props: AnyTextStorageInputProps
): TextStorageDefaultBuffers {
  const id = props.id || 'text-storage-model';
  const colorsVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-colors`,
    makeArrowFixedSizeListVector(
      new Uint8(),
      4,
      new Uint8Array(props.color ?? DEFAULT_TEXT_STORAGE_COLOR)
    )
  );
  const anglesVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-angles`,
    makeNumericArrowVector(
      new Float32(),
      new Float32Array([props.angle ?? DEFAULT_TEXT_STORAGE_ANGLE])
    )
  );
  const sizesVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-sizes`,
    makeNumericArrowVector(
      new Float32(),
      new Float32Array([props.size ?? DEFAULT_TEXT_STORAGE_SIZE])
    )
  );
  const pixelOffsetsVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-pixel-offsets`,
    makeArrowFixedSizeListVector(
      new Float32(),
      2,
      new Float32Array(props.pixelOffset ?? DEFAULT_TEXT_STORAGE_PIXEL_OFFSET)
    )
  );
  const textAnchorsVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-text-anchors`,
    makeNumericArrowVector(new Uint32(), new Uint32Array([getTextAnchorEnum(props.textAnchor)]))
  );
  const alignmentBaselinesVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-alignment-baselines`,
    makeNumericArrowVector(
      new Uint32(),
      new Uint32Array([getAlignmentBaselineEnum(props.alignmentBaseline)])
    )
  );
  const clipRectsVector = createTextStorageOwnedGpuVector(
    device,
    `${id}-default-row-clip-rects`,
    makeArrowFixedSizeListVector(new Uint32(), 2, new Uint32Array(2))
  );
  return {
    colorsBuffer: getTextStorageGpuVectorBuffer(colorsVector),
    anglesBuffer: getTextStorageGpuVectorBuffer(anglesVector),
    sizesBuffer: getTextStorageGpuVectorBuffer(sizesVector),
    pixelOffsetsBuffer: getTextStorageGpuVectorBuffer(pixelOffsetsVector),
    textAnchorsBuffer: getTextStorageGpuVectorBuffer(textAnchorsVector),
    alignmentBaselinesBuffer: getTextStorageGpuVectorBuffer(alignmentBaselinesVector),
    clipRectsBuffer: getTextStorageGpuVectorBuffer(clipRectsVector),
    byteLength:
      Uint8Array.BYTES_PER_ELEMENT * 4 +
      Float32Array.BYTES_PER_ELEMENT +
      Float32Array.BYTES_PER_ELEMENT +
      Float32Array.BYTES_PER_ELEMENT * 2 +
      Uint32Array.BYTES_PER_ELEMENT +
      Uint32Array.BYTES_PER_ELEMENT +
      Uint32Array.BYTES_PER_ELEMENT * 2,
    ownedResources: [
      colorsVector,
      anglesVector,
      sizesVector,
      pixelOffsetsVector,
      textAnchorsVector,
      alignmentBaselinesVector,
      clipRectsVector
    ]
  };
}

function createTextStorageBatchRowState(
  device: Device,
  props: AnyTextStorageInputProps,
  batchInput: ResolvedTextStorageBatchRowInputs,
  defaultBuffers: TextStorageDefaultBuffers,
  sdfRenderSettings: TextSdfRenderSettings
): TextStorageBatchRowState {
  const packedClipRects = batchInput.clipRects
    ? packTextStorageClipRects(batchInput.clipRects)
    : undefined;
  const rowClipRectsVector = packedClipRects
    ? createTextStorageOwnedGpuVector(
        device,
        `${props.id || 'text-storage-model'}-row-clip-rects-${batchInput.batchRowIndexBase}`,
        makeArrowFixedSizeListVector(
          new Uint32(),
          2,
          packedClipRects.byteLength > 0 ? packedClipRects : new Uint32Array(2)
        )
      )
    : undefined;
  const rowClipRectsBuffer = rowClipRectsVector
    ? getTextStorageGpuVectorBuffer(rowClipRectsVector)
    : batchInput.clipRectsBuffer
      ? getComputeTextStorageBuffer(batchInput.clipRectsBuffer)
      : defaultBuffers.clipRectsBuffer;
  const styleConfigData = createTextStorageStyleConfigData(
    props,
    batchInput.batchRowIndexBase,
    batchInput.rowStorageIndexBase,
    sdfRenderSettings
  );
  const styleConfigBuffer = new DynamicBuffer(device, {
    id: `${props.id || 'text-storage-model'}-style-config-${batchInput.batchRowIndexBase}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: styleConfigData
  });
  const ownedResources = [styleConfigBuffer, ...(rowClipRectsVector ? [rowClipRectsVector] : [])];

  return {
    rowPositionsBuffer: batchInput.positionsBuffer,
    rowStorageIndexBase: batchInput.rowStorageIndexBase,
    rowColorsBuffer: batchInput.colorsBuffer ?? defaultBuffers.colorsBuffer,
    rowAnglesBuffer: batchInput.anglesBuffer ?? defaultBuffers.anglesBuffer,
    rowSizesBuffer: batchInput.sizesBuffer ?? defaultBuffers.sizesBuffer,
    rowPixelOffsetsBuffer: batchInput.pixelOffsetsBuffer ?? defaultBuffers.pixelOffsetsBuffer,
    rowTextAnchorsBuffer: batchInput.textAnchorsBuffer ?? defaultBuffers.textAnchorsBuffer,
    rowAlignmentBaselinesBuffer:
      batchInput.alignmentBaselinesBuffer ?? defaultBuffers.alignmentBaselinesBuffer,
    rowClipRectsBuffer,
    styleConfigBuffer,
    ownedResources,
    ownedByteLength: styleConfigData.byteLength + (packedClipRects?.byteLength ?? 0)
  };
}

function createTextStorageOwnedGpuVector<T extends DataType>(
  device: Device,
  name: string,
  vector: Vector<T>
): GPUVector {
  return makeGPUVectorFromArrow(device, vector, {
    name,
    id: name,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
}

function getTextStorageGpuVectorBuffer(vector: GPUVector): Buffer {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`Storage text vector "${vector.name}" requires exactly one GPUData chunk`);
  }
  const buffer = data.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function createDictionaryStorageBuffer(
  device: Device,
  props: ArrowTextDictionaryStorageInputProps,
  name: string,
  data: Uint32Array | Float32Array,
  emptyData: Uint32Array | Float32Array,
  usage: number = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
): Buffer {
  return device.createBuffer({
    id: `${props.id || 'arrow-dictionary-text-storage-model'}-${name}`,
    usage,
    data: data.byteLength > 0 ? data : emptyData
  });
}

/** Appends new source-vector batches to an owned storage text state without rebuilding old batches. */
export function appendArrowTextStorageStateBatches(
  device: Device,
  props: ArrowTextStorageInputProps,
  storageState: ArrowTextStorageState
): void {
  const appendContext = arrowTextStorageAppendContexts.get(storageState);
  if (!appendContext) {
    throw new Error('ArrowTextStorageState cannot append text batches it does not own');
  }
  const textInputs = resolveArrowTextStorageInputs(props);
  assertTextStorageAppendCompatible(storageState, textInputs.batches);
  if (textInputs.batches.length === storageState.batches.length) {
    return;
  }
  const hasGlyphRowIndices = storageState.hasGlyphRowIndices === true;
  const compactGlyphVertexByteStride = hasGlyphRowIndices
    ? ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE
    : COMPACT_GLYPH_VERTEX_BYTE_STRIDE;

  for (
    let batchIndex = storageState.batches.length;
    batchIndex < textInputs.batches.length;
    batchIndex++
  ) {
    const batchInput = textInputs.batches[batchIndex];
    const rowState = createTextStorageBatchRowState(
      device,
      props,
      batchInput,
      appendContext.defaultBuffers,
      appendContext.mappingState.sdfRenderSettings
    );
    const rowBindingBatchIndex = storageState.batches.length;
    storageState.ownedRowBindingResources.push(...rowState.ownedResources);
    storageState.rowStorageByteLength += rowState.ownedByteLength;

    if (appendContext.useGpuUtf8Decode) {
      const glyphDefinitions = appendContext.utf8GlyphDefinitions;
      if (!glyphDefinitions) {
        throw new Error('ArrowTextStorageState is missing UTF-8 glyph definitions');
      }
      const utf8TextInput = buildGpuUtf8TextInput(batchInput.texts as Vector<Utf8>);
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        utf8TextInput.startIndices
      );
      storageState.ownedGlyphResources.push(rowGlyphStarts.buffer);
      storageState.renderControlByteLength += rowGlyphStarts.byteLength;
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        glyphDefinitions.glyphMetrics
      );
      const glyphLookup = createStorageGlyphLookup(
        device,
        {id: props.id},
        glyphDefinitions.glyphLookup
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: utf8TextInput.startIndices,
        recordByteStride: compactGlyphVertexByteStride,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowTextStorageModel UTF-8 generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedUtf8TextInput = createPartitionedGpuUtf8TextInput(
          utf8TextInput,
          generatedBufferBatch
        );
        const utf8Input = createGpuUtf8ExpandedInput(
          device,
          {id: props.id},
          {
            utf8TextInput: partitionedUtf8TextInput,
            baselineOffsetY: glyphDefinitions.baselineOffsetY,
            glyphLookupCount: glyphDefinitions.glyphLookup.length / 2,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            batchRowIndexBase: generatedBufferBatch.rowStart,
            rowStorageIndexBase: batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart,
            alignment: createGpuTextAlignmentOptions(
              props,
              rowState,
              appendContext.mappingState.lineHeight
            )
          }
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedUtf8TextInput.byteLength,
          hasGlyphRowIndices
        );
        dispatchGpuUtf8ExpandedTextCompute(
          device,
          {id: props.id},
          {
            utf8Input,
            glyphLookup,
            glyphMetrics,
            generated,
            outputSlotCount: partitionedUtf8TextInput.byteLength,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeTextStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeTextStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        storageState.renderBatches.push({
          rowBindingBatchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedUtf8TextInput.byteLength,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        storageState.ownedGlyphResources.push(storageRenderConfigBuffer);
        storageState.renderControlByteLength += storageRenderConfigBuffer.byteLength;
        storageState.generatedRenderBufferByteLength += generated.byteLength;
        storageState.transientComputeInputByteLength += utf8Input.byteLength;
        utf8Input.rowByteRangesBuffer.destroy();
        utf8Input.utf8BytesBuffer.destroy();
        utf8Input.expansionConfigBuffer.destroy();
      }
      storageState.batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: utf8TextInput.byteLength,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      storageState.glyphCount += utf8TextInput.byteLength;
      storageState.glyphAttributeBuildTimeMs += utf8TextInput.textInputBuildTimeMs;
      storageState.compactStreamBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
      storageState.compactStreamByteLength += utf8TextInput.inputByteLength;
      storageState.transientComputeInputByteLength +=
        glyphLookup.byteLength + glyphMetrics.byteLength;
      glyphMetrics.buffer.destroy();
      glyphLookup.buffer.destroy();
    } else {
      const batchGlyphStream = buildGpuExpandedTextStream({
        texts: batchInput.texts,
        mapping: appendContext.mappingState.mapping,
        baselineOffset: appendContext.mappingState.baselineOffset,
        lineHeight: appendContext.mappingState.lineHeight,
        characterSet: appendContext.mappingState.characterSet
      });
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        batchGlyphStream.startIndices
      );
      storageState.ownedGlyphResources.push(rowGlyphStarts.buffer);
      storageState.renderControlByteLength += rowGlyphStarts.byteLength;
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        batchGlyphStream.glyphMetrics
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: batchGlyphStream.startIndices,
        recordByteStride: compactGlyphVertexByteStride,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowTextStorageModel compact generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedGlyphStream = createPartitionedGpuExpandedTextStream(
          batchGlyphStream,
          generatedBufferBatch
        );
        const compactInput = createGpuExpandedCompactInput(
          device,
          {id: props.id},
          partitionedGlyphStream,
          generatedBufferBatch.rowStart,
          createGpuTextAlignmentOptions(props, rowState, appendContext.mappingState.lineHeight),
          batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedGlyphStream.glyphCount,
          hasGlyphRowIndices
        );
        dispatchGpuExpandedTextCompute(
          device,
          {id: props.id},
          {
            compactInput,
            glyphMetrics,
            generated,
            glyphCount: partitionedGlyphStream.glyphCount,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeTextStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeTextStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        storageState.renderBatches.push({
          rowBindingBatchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedGlyphStream.glyphCount,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        storageState.ownedGlyphResources.push(storageRenderConfigBuffer);
        storageState.renderControlByteLength += storageRenderConfigBuffer.byteLength;
        storageState.generatedRenderBufferByteLength += generated.byteLength;
        storageState.transientComputeInputByteLength += compactInput.byteLength;
        compactInput.glyphRangesBuffer.destroy();
        compactInput.glyphIdsBuffer.destroy();
        compactInput.expansionConfigBuffer.destroy();
      }
      storageState.batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: batchGlyphStream.glyphCount,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      storageState.glyphCount += batchGlyphStream.glyphCount;
      storageState.glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
      storageState.compactStreamBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
      storageState.compactStreamByteLength += batchGlyphStream.compactStreamByteLength;
      storageState.transientComputeInputByteLength += glyphMetrics.byteLength;
      glyphMetrics.buffer.destroy();
    }
  }

  storageState.glyphAttributeByteLength =
    storageState.generatedRenderBufferByteLength + storageState.renderControlByteLength;
  syncArrowTextStorageStateFirstBatch(storageState);
}

function assertTextStorageAppendCompatible(
  storageState: ArrowTextStorageState,
  batches: ResolvedArrowTextStorageBatchInputs[]
): void {
  if (batches.length < storageState.batches.length) {
    throw new Error('ArrowTextStorageModel appended text batches cannot remove existing batches');
  }
  for (const [batchIndex, existingBatch] of storageState.batches.entries()) {
    const batchInput = batches[batchIndex];
    if (
      !batchInput ||
      batchInput.batchRowIndexBase !== existingBatch.batchRowIndexBase ||
      batchInput.rowStorageIndexBase !== existingBatch.rowStorageIndexBase ||
      batchInput.texts.length !== existingBatch.rowCount ||
      batchInput.positionsBuffer !== existingBatch.rowPositionsBuffer
    ) {
      throw new Error(
        'ArrowTextStorageModel appended text batches require existing row batches to stay unchanged'
      );
    }
  }
}

/** Rebuilds row/style binding buffers for an existing storage text state without replacing glyph buffers. */
export function refreshArrowTextStorageRowBindings(
  device: Device,
  props: ArrowTextStorageInputProps,
  storageState: ArrowTextStorageState
): void {
  const textInputs = resolveArrowTextStorageInputs(props);
  assertTextStorageRowBindingRefreshCompatible(storageState, textInputs.batches);

  const nextOwnedRowBindingResources: TextStorageOwnedResource[] = [];
  const defaultBuffers = createTextStorageDefaultBuffers(device, props);
  nextOwnedRowBindingResources.push(...defaultBuffers.ownedResources);

  let rowStorageByteLength = defaultBuffers.byteLength;
  let nextBatches: ArrowTextStorageBatchState[] = [];
  try {
    nextBatches = textInputs.batches.map((batchInput, batchIndex) => {
      const previousBatch = storageState.batches[batchIndex];
      const rowState = createTextStorageBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        storageState.sdfRenderSettings
      );
      nextOwnedRowBindingResources.push(...rowState.ownedResources);
      rowStorageByteLength += rowState.ownedByteLength;
      return {
        ...rowState,
        batchRowIndexBase: previousBatch.batchRowIndexBase,
        rowStorageIndexBase: batchInput.rowStorageIndexBase,
        rowCount: previousBatch.rowCount,
        glyphCount: previousBatch.glyphCount,
        rowGlyphStartsBuffer: previousBatch.rowGlyphStartsBuffer
      };
    });
  } catch (error) {
    destroyTextStorageResources(nextOwnedRowBindingResources);
    throw error;
  }

  replaceOwnedTextStorageResources(
    storageState.ownedRowBindingResources,
    nextOwnedRowBindingResources
  );
  storageState.batches = nextBatches;
  storageState.rowStorageByteLength = rowStorageByteLength;
  const appendContext = arrowTextStorageAppendContexts.get(storageState);
  if (appendContext) {
    appendContext.defaultBuffers = defaultBuffers;
  }
  syncArrowTextStorageStateFirstBatch(storageState);
}

function assertTextStorageRowBindingRefreshCompatible(
  storageState: ArrowTextStorageState,
  batches: ResolvedArrowTextStorageBatchInputs[]
): void {
  if (batches.length !== storageState.batches.length) {
    throw new Error('ArrowTextStorageModel row-binding updates must preserve text batch count');
  }
  for (const [batchIndex, batchInput] of batches.entries()) {
    const existingBatch = storageState.batches[batchIndex];
    if (
      !existingBatch ||
      existingBatch.batchRowIndexBase !== batchInput.batchRowIndexBase ||
      existingBatch.rowCount !== batchInput.texts.length
    ) {
      throw new Error('ArrowTextStorageModel row-binding updates must preserve text batch rows');
    }
  }
}

function syncArrowTextStorageStateFirstBatch(storageState: ArrowTextStorageState): void {
  const firstBatch = getFirstArrowTextStorageBatch(storageState);
  const firstRenderBatch = getFirstArrowTextStorageRenderBatch(storageState);
  storageState.rowPositionsBuffer = firstBatch.rowPositionsBuffer;
  storageState.rowColorsBuffer = firstBatch.rowColorsBuffer;
  storageState.rowAnglesBuffer = firstBatch.rowAnglesBuffer;
  storageState.rowSizesBuffer = firstBatch.rowSizesBuffer;
  storageState.rowPixelOffsetsBuffer = firstBatch.rowPixelOffsetsBuffer;
  storageState.rowTextAnchorsBuffer = firstBatch.rowTextAnchorsBuffer;
  storageState.rowAlignmentBaselinesBuffer = firstBatch.rowAlignmentBaselinesBuffer;
  storageState.rowClipRectsBuffer = firstBatch.rowClipRectsBuffer;
  storageState.rowGlyphStartsBuffer = getArrowTextStorageRowGlyphStartsBuffer(firstBatch);
  storageState.styleConfigBuffer = firstBatch.styleConfigBuffer;
  storageState.storageRenderConfigBuffer = firstRenderBatch.storageRenderConfigBuffer;
  storageState.compactGlyphVertexData = firstRenderBatch.compactGlyphVertexData;
}

/** Rebuilds row/style binding buffers for an existing dictionary text state without replacing glyph buffers. */
export function refreshArrowTextDictionaryStorageRowBindings(
  device: Device,
  props: ArrowTextDictionaryStorageInputProps,
  storageState: ArrowTextDictionaryStorageState
): void {
  const textInputs = resolveArrowTextDictionaryStorageInputs(props);
  assertTextDictionaryStorageRowBindingRefreshCompatible(storageState, textInputs.batches);

  const nextOwnedRowBindingResources: TextStorageOwnedResource[] = [];
  const defaultBuffers = createTextStorageDefaultBuffers(device, props);
  nextOwnedRowBindingResources.push(...defaultBuffers.ownedResources);

  let rowStorageByteLength = defaultBuffers.byteLength;
  let nextBatches: ArrowTextDictionaryStorageBatchState[] = [];
  try {
    nextBatches = textInputs.batches.map((batchInput, batchIndex) => {
      const previousBatch = storageState.batches[batchIndex];
      const rowState = createTextStorageBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        storageState.sdfRenderSettings
      );
      nextOwnedRowBindingResources.push(...rowState.ownedResources);
      rowStorageByteLength += rowState.ownedByteLength;
      return {
        ...rowState,
        batchRowIndexBase: previousBatch.batchRowIndexBase,
        rowStorageIndexBase: batchInput.rowStorageIndexBase,
        rowCount: previousBatch.rowCount,
        glyphCount: previousBatch.glyphCount,
        rowDictionaryRecordsBuffer: previousBatch.rowDictionaryRecordsBuffer,
        dictionaryGlyphRangesBuffer: previousBatch.dictionaryGlyphRangesBuffer,
        dictionaryGlyphRecordsBuffer: previousBatch.dictionaryGlyphRecordsBuffer,
        glyphFramesBuffer: previousBatch.glyphFramesBuffer,
        dictionaryGlyphCount: previousBatch.dictionaryGlyphCount,
        dictionaryValueCount: previousBatch.dictionaryValueCount
      };
    });
  } catch (error) {
    destroyTextStorageResources(nextOwnedRowBindingResources);
    throw error;
  }

  replaceOwnedTextStorageResources(
    storageState.ownedRowBindingResources,
    nextOwnedRowBindingResources
  );
  storageState.batches = nextBatches;
  storageState.rowStorageByteLength = rowStorageByteLength;
  syncArrowTextDictionaryStorageStateFirstBatch(storageState);
}

function assertTextDictionaryStorageRowBindingRefreshCompatible(
  storageState: ArrowTextDictionaryStorageState,
  batches: ResolvedArrowTextStorageBatchInputs[]
): void {
  if (batches.length !== storageState.batches.length) {
    throw new Error(
      'ArrowTextDictionaryStorageModel row-binding updates must preserve text batch count'
    );
  }
  for (const [batchIndex, batchInput] of batches.entries()) {
    const existingBatch = storageState.batches[batchIndex];
    if (
      !existingBatch ||
      existingBatch.batchRowIndexBase !== batchInput.batchRowIndexBase ||
      existingBatch.rowStorageIndexBase !== batchInput.rowStorageIndexBase ||
      existingBatch.rowCount !== batchInput.texts.length
    ) {
      throw new Error(
        'ArrowTextDictionaryStorageModel row-binding updates must preserve text batch rows'
      );
    }
  }
}

function syncArrowTextDictionaryStorageStateFirstBatch(
  storageState: ArrowTextDictionaryStorageState
): void {
  const firstBatch = getFirstArrowTextDictionaryStorageBatch(storageState);
  const firstRenderBatch = getFirstArrowTextDictionaryStorageRenderBatch(storageState);
  storageState.rowPositionsBuffer = firstBatch.rowPositionsBuffer;
  storageState.rowColorsBuffer = firstBatch.rowColorsBuffer;
  storageState.rowAnglesBuffer = firstBatch.rowAnglesBuffer;
  storageState.rowSizesBuffer = firstBatch.rowSizesBuffer;
  storageState.rowPixelOffsetsBuffer = firstBatch.rowPixelOffsetsBuffer;
  storageState.rowTextAnchorsBuffer = firstBatch.rowTextAnchorsBuffer;
  storageState.rowAlignmentBaselinesBuffer = firstBatch.rowAlignmentBaselinesBuffer;
  storageState.rowClipRectsBuffer = firstBatch.rowClipRectsBuffer;
  storageState.rowDictionaryRecordsBuffer = firstBatch.rowDictionaryRecordsBuffer;
  storageState.dictionaryGlyphRangesBuffer = firstBatch.dictionaryGlyphRangesBuffer;
  storageState.dictionaryGlyphRecordsBuffer = firstBatch.dictionaryGlyphRecordsBuffer;
  storageState.dictionaryRenderConfigBuffer = firstRenderBatch.dictionaryRenderConfigBuffer;
  storageState.styleConfigBuffer = firstBatch.styleConfigBuffer;
  storageState.glyphFramesBuffer = firstBatch.glyphFramesBuffer;
}

function destroyTextStorageResources(resources: TextStorageOwnedResource[]): void {
  for (const resource of resources) {
    resource.destroy();
  }
}

function replaceOwnedTextStorageResources(
  currentResources: TextStorageOwnedResource[],
  nextResources: TextStorageOwnedResource[]
): void {
  destroyTextStorageResources(currentResources);
  currentResources.splice(0, currentResources.length, ...nextResources);
}

function createTextStorageStyleConfigData(
  props: AnyTextStorageInputProps,
  batchRowIndexBase: number,
  rowStorageIndexBase: number,
  sdfRenderSettings: TextSdfRenderSettings
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(80);
  const floatValues = new Float32Array(arrayBuffer);
  const uintValues = new Uint32Array(arrayBuffer);
  const color = props.color ?? DEFAULT_TEXT_STORAGE_COLOR;
  floatValues[0] = color[0] / 255;
  floatValues[1] = color[1] / 255;
  floatValues[2] = color[2] / 255;
  floatValues[3] = color[3] / 255;
  floatValues[4] = props.angle ?? DEFAULT_TEXT_STORAGE_ANGLE;
  floatValues[5] = props.size ?? DEFAULT_TEXT_STORAGE_SIZE;
  floatValues[6] = (props.pixelOffset ?? DEFAULT_TEXT_STORAGE_PIXEL_OFFSET)[0];
  floatValues[7] = (props.pixelOffset ?? DEFAULT_TEXT_STORAGE_PIXEL_OFFSET)[1];
  uintValues[8] = props.colors ? 1 : 0;
  uintValues[9] = props.angles ? 1 : 0;
  uintValues[10] = props.sizes ? 1 : 0;
  uintValues[11] = props.pixelOffsets ? 1 : 0;
  uintValues[12] = props.clipRects ? 1 : 0;
  uintValues[13] = batchRowIndexBase;
  uintValues[14] = rowStorageIndexBase;
  uintValues[15] = 0;
  floatValues[16] = sdfRenderSettings.sdf ? sdfRenderSettings.threshold : BITMAP_TEXT_SDF_THRESHOLD;
  floatValues[17] = sdfRenderSettings.smoothing;
  return uintValues;
}

function createGpuTextAlignmentOptions(
  props: AnyTextStorageInputProps,
  rowState: TextStorageBatchRowState,
  lineHeight: number
) {
  return {
    rowTextAnchorsBuffer: getComputeTextStorageBuffer(rowState.rowTextAnchorsBuffer),
    rowAlignmentBaselinesBuffer: getComputeTextStorageBuffer(rowState.rowAlignmentBaselinesBuffer),
    useRowTextAnchors: Boolean(props.textAnchors),
    useRowAlignmentBaselines: Boolean(props.alignmentBaselines),
    textAnchor: getTextAnchorEnum(props.textAnchor),
    alignmentBaseline: getAlignmentBaselineEnum(props.alignmentBaseline),
    lineHeight
  };
}

function getComputeTextStorageBuffer(buffer: TextStorageBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function createStorageGlyphFrames(
  device: Device,
  props: ArrowTextModelProps | AnyTextStorageInputProps,
  glyphFrameData: Float32Array
): StorageGlyphFrameState {
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'arrow-text-storage-model'}-glyph-frames`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphFrameData.byteLength > 0 ? glyphFrameData : new Float32Array(4)
    }),
    byteLength: glyphFrameData.byteLength
  };
}

function buildGpuUtf8GlyphDefinitions({
  mapping,
  baselineOffset,
  lineHeight,
  characterSet
}: {
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet: Set<string>;
}): {
  glyphFrames: Float32Array;
  glyphMetrics: Int32Array;
  glyphLookup: Uint32Array;
  baselineOffsetY: number;
} {
  const glyphFrameValues = [0, 0, 0, 0];
  const glyphMetricValues = [0, MISSING_CHAR_WIDTH];
  const glyphLookupValues: number[] = [];
  const handledCodePoints = new Set<number>();

  for (const characterEntry of characterSet) {
    for (const character of Array.from(characterEntry)) {
      const codePoint = character.codePointAt(0);
      if (codePoint === undefined || handledCodePoints.has(codePoint)) {
        continue;
      }
      handledCodePoints.add(codePoint);
      const frame = mapping[character];
      let glyphId = 0;
      if (frame) {
        glyphId = glyphFrameValues.length / 4;
        if (glyphId > MAX_UINT16) {
          throw new Error('GPU UTF-8 text glyph definitions exceed the uint16 glyph id range');
        }
        glyphFrameValues.push(frame.x, frame.y, frame.width, frame.height);
        glyphMetricValues.push(frame.anchorX, frame.advance);
      }
      glyphLookupValues.push(codePoint, glyphId);
    }
  }

  return {
    glyphFrames: new Float32Array(glyphFrameValues),
    glyphMetrics: new Int32Array(glyphMetricValues),
    glyphLookup: new Uint32Array(glyphLookupValues),
    baselineOffsetY: toSignedInt16(baselineOffset + lineHeight / 2)
  };
}

/** Pack signed `[x, y, width, height]` Int16 clip rows into two uint32 words per row. */
export function packTextStorageClipRects(clipRects: Vector<FixedSizeList<Int16>>): Uint32Array {
  assertClipRects(clipRects, clipRects.length);
  const clipRectValues = getArrowVectorBufferSource(clipRects) as Int16Array;
  const packedClipRects = new Uint32Array(clipRects.length * 2);
  for (let rowIndex = 0; rowIndex < clipRects.length; rowIndex++) {
    const valueIndex = rowIndex * 4;
    packedClipRects[rowIndex * 2] = packSignedInt16Pair(
      clipRectValues[valueIndex],
      clipRectValues[valueIndex + 1]
    );
    packedClipRects[rowIndex * 2 + 1] = packSignedInt16Pair(
      clipRectValues[valueIndex + 2],
      clipRectValues[valueIndex + 3]
    );
  }
  return packedClipRects;
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((upperValue & 0xffff) << 16) | (lowerValue & 0xffff);
}

function getTextAnchorEnum(textAnchor: AnyTextStorageInputProps['textAnchor']): number {
  switch (textAnchor) {
    case 'middle':
      return 1;
    case 'end':
      return 2;
    case 'start':
    default:
      return DEFAULT_TEXT_STORAGE_ANCHOR;
  }
}

function getAlignmentBaselineEnum(
  alignmentBaseline: AnyTextStorageInputProps['alignmentBaseline']
): number {
  switch (alignmentBaseline) {
    case 'top':
      return 1;
    case 'bottom':
      return 2;
    case 'center':
    default:
      return DEFAULT_STORAGE_ALIGNMENT_BASELINE;
  }
}

/** Returns the first storage row-binding batch, or throws if the state is empty. */
export function getFirstArrowTextStorageBatch(
  storageState: Pick<ArrowTextStorageState, 'batches'>
): ArrowTextStorageBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('ArrowTextStorageState requires at least one row-binding batch');
  }
  return firstBatch;
}

/** Returns the first generated storage render batch, or throws if the state is empty. */
export function getFirstArrowTextStorageRenderBatch(
  storageState: Pick<ArrowTextStorageState, 'renderBatches'>
): ArrowTextStorageRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('ArrowTextStorageState requires at least one render batch');
  }
  return firstRenderBatch;
}

/** Returns the row glyph-start buffer for a storage batch, or the shared empty buffer. */
export function getArrowTextStorageRowGlyphStartsBuffer(batch: ArrowTextStorageBatchState): Buffer {
  if (!batch.rowGlyphStartsBuffer) {
    throw new Error('ArrowTextStorageState batch is missing row glyph starts');
  }
  return batch.rowGlyphStartsBuffer;
}

/** Returns the first dictionary row-binding batch, or throws if the state is empty. */
export function getFirstArrowTextDictionaryStorageBatch(
  storageState: Pick<ArrowTextDictionaryStorageState, 'batches'>
): ArrowTextDictionaryStorageBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('ArrowTextDictionaryStorageState requires at least one row-binding batch');
  }
  return firstBatch;
}

/** Returns the first generated dictionary render batch, or throws if the state is empty. */
export function getFirstArrowTextDictionaryStorageRenderBatch(
  storageState: Pick<ArrowTextDictionaryStorageState, 'renderBatches'>
): ArrowTextDictionaryStorageRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('ArrowTextDictionaryStorageState requires at least one render batch');
  }
  return firstRenderBatch;
}

function createPartitionedGpuExpandedTextStream(
  glyphStream: GpuExpandedTextStream,
  generatedBufferBatch: GeneratedBufferBatch
): GpuExpandedTextStream {
  const rowCount = generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart;
  const startIndices = new Array<number>(rowCount + 1);
  const labelGlyphRanges = new Uint32Array(rowCount * 2);
  startIndices[0] = 0;

  for (let localRowIndex = 0; localRowIndex < rowCount; localRowIndex++) {
    const sourceRowIndex = generatedBufferBatch.rowStart + localRowIndex;
    const sourceGlyphStart =
      glyphStream.startIndices[sourceRowIndex] ?? generatedBufferBatch.recordStart;
    const sourceGlyphEnd =
      glyphStream.startIndices[sourceRowIndex + 1] ?? generatedBufferBatch.recordStart;
    const localGlyphStart = sourceGlyphStart - generatedBufferBatch.recordStart;
    const localGlyphEnd = sourceGlyphEnd - generatedBufferBatch.recordStart;
    labelGlyphRanges[localRowIndex * 2] = localGlyphStart;
    labelGlyphRanges[localRowIndex * 2 + 1] = localGlyphEnd;
    startIndices[localRowIndex + 1] = localGlyphEnd;
  }

  const packedGlyphIds = copyPackedUint16Range(
    glyphStream.packedGlyphIds,
    generatedBufferBatch.recordStart,
    generatedBufferBatch.recordEnd
  );
  return {
    ...glyphStream,
    startIndices,
    glyphCount: generatedBufferBatch.recordCount,
    labelGlyphRanges,
    packedGlyphIds,
    compactStreamByteLength: labelGlyphRanges.byteLength + packedGlyphIds.byteLength,
    glyphStreamBuildTimeMs: 0
  };
}

function createPartitionedGpuUtf8TextInput(
  utf8TextInput: GpuUtf8TextInput,
  generatedBufferBatch: GeneratedBufferBatch
): GpuUtf8TextInput {
  const rowCount = generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart;
  const rowByteRanges = new Uint32Array(rowCount * 2);
  const startIndices = new Array<number>(rowCount + 1);
  startIndices[0] = 0;

  for (let localRowIndex = 0; localRowIndex < rowCount; localRowIndex++) {
    const sourceRowIndex = generatedBufferBatch.rowStart + localRowIndex;
    const sourceByteStart = utf8TextInput.rowByteRanges[sourceRowIndex * 2] ?? 0;
    const sourceByteEnd = utf8TextInput.rowByteRanges[sourceRowIndex * 2 + 1] ?? sourceByteStart;
    const hasPartitionLocalBytes =
      sourceByteEnd > sourceByteStart &&
      sourceByteStart >= generatedBufferBatch.recordStart &&
      sourceByteEnd <= generatedBufferBatch.recordEnd;
    const localByteStart = hasPartitionLocalBytes
      ? sourceByteStart - generatedBufferBatch.recordStart
      : 0;
    const localByteEnd = hasPartitionLocalBytes
      ? sourceByteEnd - generatedBufferBatch.recordStart
      : localByteStart;
    rowByteRanges[localRowIndex * 2] = localByteStart;
    rowByteRanges[localRowIndex * 2 + 1] = localByteEnd;
    startIndices[localRowIndex + 1] = Math.max(startIndices[localRowIndex] ?? 0, localByteEnd);
  }

  const packedUtf8Bytes = copyPackedByteRange(
    utf8TextInput.packedUtf8Bytes,
    generatedBufferBatch.recordStart,
    generatedBufferBatch.recordEnd
  );
  return {
    startIndices,
    rowByteRanges,
    packedUtf8Bytes,
    byteLength: generatedBufferBatch.recordCount,
    inputByteLength: rowByteRanges.byteLength + packedUtf8Bytes.byteLength,
    textInputBuildTimeMs: 0
  };
}

function createPartitionedGpuVectorUtf8TextInput(
  device: Device,
  props: GPUVectorTextStorageInputProps,
  textBatch: GPUVectorTextStorageBatch,
  generatedBufferBatch: GeneratedBufferBatch
): {
  rowByteRangesBuffer: Buffer;
  inputByteLength: number;
  ownsRowByteRangesBuffer: boolean;
} {
  const usesFullBatch =
    generatedBufferBatch.rowStart === 0 &&
    generatedBufferBatch.rowEnd === textBatch.rowCount &&
    generatedBufferBatch.recordStart === 0 &&
    generatedBufferBatch.recordEnd === textBatch.byteLength;
  if (usesFullBatch) {
    return {
      rowByteRangesBuffer: textBatch.rowByteRangesBuffer,
      inputByteLength: textBatch.inputByteLength,
      ownsRowByteRangesBuffer: false
    };
  }

  const rowCount = generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart;
  const rowByteRanges = new Uint32Array(rowCount * 2);
  for (let localRowIndex = 0; localRowIndex < rowCount; localRowIndex++) {
    const sourceRowIndex = generatedBufferBatch.rowStart + localRowIndex;
    rowByteRanges[localRowIndex * 2] = textBatch.rowByteRanges[sourceRowIndex * 2] ?? 0;
    rowByteRanges[localRowIndex * 2 + 1] =
      textBatch.rowByteRanges[sourceRowIndex * 2 + 1] ?? rowByteRanges[localRowIndex * 2];
  }

  return {
    rowByteRangesBuffer: device.createBuffer({
      id:
        `${props.id || 'text-storage-model'}-utf8-row-byte-ranges-` +
        `${generatedBufferBatch.rowStart}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: rowByteRanges.byteLength > 0 ? rowByteRanges : new Uint32Array(2)
    }),
    inputByteLength: rowByteRanges.byteLength + generatedBufferBatch.recordCount,
    ownsRowByteRangesBuffer: true
  };
}

function copyPackedUint16Range(
  source: Uint32Array,
  startIndex: number,
  endIndex: number
): Uint32Array {
  const valueCount = Math.max(0, endIndex - startIndex);
  const target = new Uint32Array(Math.ceil(valueCount / 2));
  for (let localIndex = 0; localIndex < valueCount; localIndex++) {
    const value = readPackedUint16(source, startIndex + localIndex);
    writePackedUint16(target, localIndex, value);
  }
  return target;
}

function readPackedUint16(source: Uint32Array, index: number): number {
  const word = source[index >> 1] ?? 0;
  return index & 1 ? word >>> 16 : word & 0xffff;
}

function writePackedUint16(target: Uint32Array, index: number, value: number): void {
  const wordIndex = index >> 1;
  const word = target[wordIndex] ?? 0;
  target[wordIndex] = index & 1 ? word | ((value & 0xffff) << 16) : word | (value & 0xffff);
}

function copyPackedByteRange(
  source: Uint32Array,
  startByteIndex: number,
  endByteIndex: number
): Uint32Array {
  const byteLength = Math.max(0, endByteIndex - startByteIndex);
  const target = new Uint32Array(Math.ceil(byteLength / Uint32Array.BYTES_PER_ELEMENT));
  const sourceBytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  new Uint8Array(target.buffer).set(sourceBytes.subarray(startByteIndex, endByteIndex));
  return target;
}

function toSignedInt16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < -32768 || integerValue > 32767) {
    throw new Error(`Arrow text glyph offset ${value} is outside the signed 16-bit range`);
  }
  return integerValue;
}

function makeFixedSizeListField(name: string, childType: Int16 | Uint16, listSize: 2 | 4): Field {
  return new Field(name, new FixedSizeList(listSize, new Field('value', childType, false)), false);
}

function isInstanceCompatibleArrowType(type: DataType): boolean {
  return (
    isNumericArrowType(type) ||
    (DataType.isFixedSizeList(type) && isNumericArrowType(type.children[0].type))
  );
}

function isArrowTextRowColorType(type: DataType | undefined): type is ArrowTextRowColorType {
  return (
    Boolean(type) &&
    DataType.isFixedSizeList(type) &&
    type.listSize === 4 &&
    type.children[0]?.type instanceof Uint8
  );
}

function isArrowTextCharacterColorType(
  type: DataType | undefined
): type is ArrowTextCharacterColorType {
  return Boolean(type) && DataType.isList(type) && isArrowTextRowColorType(type.children[0]?.type);
}

function isArrowTextColorType(type: DataType | undefined): type is ArrowTextColorType {
  return isArrowTextRowColorType(type) || isArrowTextCharacterColorType(type);
}

function expandArrowTextCharacterColorRows(
  vector: Vector<ArrowTextCharacterColorType>,
  startIndices: number[],
  nullValue?: [number, number, number, number]
): Vector<ArrowTextRowColorType> {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  const expandedValues = new Uint8Array(glyphCount * 4);
  let rowIndexBase = 0;

  for (const data of vector.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    const elementData = data.children[0] as Data<ArrowTextRowColorType> | undefined;
    const valueData = elementData?.children[0] as Data<Uint8> | undefined;
    const values = valueData?.values as Uint8Array | undefined;
    if (!valueOffsets || !elementData || !valueData || !values) {
      throw new Error('ArrowTextModel character colors require Arrow list offsets and values');
    }
    if (nullValue && ((elementData.nullCount ?? 0) > 0 || (valueData.nullCount ?? 0) > 0)) {
      throw new Error(
        'ArrowTextModel character colors do not support nullable nested color values'
      );
    }

    const firstElementOffset = valueOffsets[0] ?? 0;
    const valueOffset = valueData.offset ?? 0;
    for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
      const rowIndex = rowIndexBase + localRowIndex;
      const glyphStart = startIndices[rowIndex] ?? 0;
      const glyphEnd = startIndices[rowIndex + 1] ?? glyphStart;
      const glyphRowLength = glyphEnd - glyphStart;
      if (nullValue && !isArrowDataRowValid(data, localRowIndex)) {
        for (let glyphIndex = glyphStart; glyphIndex < glyphEnd; glyphIndex++) {
          expandedValues.set(nullValue, glyphIndex * 4);
        }
        continue;
      }
      const colorStart = (valueOffsets[localRowIndex] ?? firstElementOffset) - firstElementOffset;
      const colorEnd = (valueOffsets[localRowIndex + 1] ?? colorStart) - firstElementOffset;

      if (colorEnd - colorStart !== glyphRowLength) {
        throw new Error(
          'ArrowTextModel character colors must provide one color per UTF-8 code point'
        );
      }

      expandedValues.set(
        values.subarray(valueOffset + colorStart * 4, valueOffset + colorEnd * 4),
        glyphStart * 4
      );
    }
    rowIndexBase += data.length;
  }

  return makeArrowFixedSizeListVector(new Uint8(), 4, expandedValues);
}

function getArrowTextExpansionNullValue(
  fieldName: string,
  props: {
    color?: [number, number, number, number];
    angle?: number;
    size?: number;
  }
): number | readonly number[] | undefined {
  switch (fieldName) {
    case 'colors':
      return props.color;
    case 'angles':
      return props.angle;
    case 'sizes':
      return props.size;
    default:
      return undefined;
  }
}

function isArrowDataRowValid(data: Data, localRowIndex: number): boolean {
  if (data.nullCount === 0 || !data.nullBitmap) {
    return true;
  }
  const bitmapIndex = (data.offset ?? 0) + localRowIndex;
  const bitmapByte = data.nullBitmap[bitmapIndex >> 3] ?? 0;
  return (bitmapByte & (1 << (bitmapIndex & 7))) !== 0;
}

function makeNumericArrowVector<TypeT extends NumericArrowType>(
  type: TypeT,
  data: TypeT['TArray']
): Vector<TypeT> {
  const makeNumericData = makeData as <NumericTypeT extends NumericArrowType>(props: {
    type: NumericTypeT;
    length: number;
    data: NumericTypeT['TArray'];
  }) => Data<NumericTypeT>;
  return makeVector(
    makeNumericData({
      type,
      length: data.length,
      data
    })
  );
}

/** Appends one glyph layout to another while preserving global row/glyph offsets. */
export function appendArrowGlyphLayout(
  glyphLayout: ArrowGlyphLayout,
  appendedGlyphLayout: ArrowGlyphLayout
): ArrowGlyphLayout {
  const nextStartIndices = [
    ...glyphLayout.startIndices,
    ...appendedGlyphLayout.startIndices
      .slice(1)
      .map(startIndex => startIndex + glyphLayout.glyphCount)
  ];
  const glyphOffsets = new Int16Array(
    glyphLayout.glyphOffsets.length + appendedGlyphLayout.glyphOffsets.length
  );
  glyphOffsets.set(glyphLayout.glyphOffsets);
  glyphOffsets.set(appendedGlyphLayout.glyphOffsets, glyphLayout.glyphOffsets.length);
  const glyphFrames = new Uint16Array(
    glyphLayout.glyphFrames.length + appendedGlyphLayout.glyphFrames.length
  );
  glyphFrames.set(glyphLayout.glyphFrames);
  glyphFrames.set(appendedGlyphLayout.glyphFrames, glyphLayout.glyphFrames.length);
  return {
    startIndices: nextStartIndices,
    glyphCount: glyphLayout.glyphCount + appendedGlyphLayout.glyphCount,
    glyphOffsets,
    glyphFrames,
    characterSet: glyphLayout.characterSet
  };
}

function makeGlyphRowIndices(startIndices: number[], rowIndexBase: number = 0): Uint32Array {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  const rowIndices = new Uint32Array(glyphCount);
  for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
    rowIndices.fill(rowIndexBase + rowIndex, startIndices[rowIndex], startIndices[rowIndex + 1]);
  }
  return rowIndices;
}

type NumericArray =
  | Float32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

function getGeneratedAttributeByteLength(columns: Record<string, Vector>): number {
  let attributeByteLength = 0;
  for (const vector of Object.values(columns)) {
    if (isInstanceCompatibleArrowType(vector.type)) {
      attributeByteLength += (getArrowVectorBufferSource(vector) as NumericArray).byteLength;
    }
  }
  return attributeByteLength;
}
