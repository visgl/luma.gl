// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {
  layoutText3DGlyphRows,
  type Text3DGlyphAtlas,
  type Text3DGlyphInstance,
  type Text3DGlyphLayout,
  type Text3DGlyphRange
} from '@luma.gl/text/text-3d';
import * as arrow from 'apache-arrow';

/** Arrow columns retained for one grouped 3D glyph occurrence table. */
export type ArrowText3DGlyphInstanceColumns = {
  glyphIds: arrow.Uint32;
  glyphCodePoints: arrow.Uint32;
  instanceOffsets: arrow.FixedSizeList<arrow.Float32>;
  sourceRowIndices: arrow.Uint32;
  sourceGlyphIndices: arrow.Uint32;
};

/** Arrow Utf8 rows used as the 3D crawl text source. */
export type ArrowText3DTextTable = arrow.Table<{texts: arrow.Utf8}>;

/** Arrow glyph occurrences grouped by atlas glyph for glyph geometry range draws. */
export type ArrowText3DGlyphInstanceTable = arrow.Table<ArrowText3DGlyphInstanceColumns>;

/** One shared glyph geometry range plus its grouped Arrow instance batch. */
export type ArrowText3DGlyphDrawRange = Text3DGlyphRange & {
  /** Arrow/GPU record batch containing this glyph's visible instances. */
  batchIndex: number;
  /** Number of visible instances in the grouped batch. */
  instanceCount: number;
};

/** CPU Arrow source and grouped glyph occurrence data used by the example renderer. */
export type ArrowText3DGlyphData = {
  /** Original Arrow Utf8 crawl rows. */
  textTable: ArrowText3DTextTable;
  /** Visible glyph occurrences grouped into one Arrow record batch per glyph. */
  glyphInstanceTable: ArrowText3DGlyphInstanceTable;
  /** Shared glyph geometry ranges aligned with {@link glyphInstanceTable} batches. */
  drawRanges: ArrowText3DGlyphDrawRange[];
  /** Positioned visible glyph occurrences before Arrow grouping. */
  glyphLayout: Text3DGlyphLayout;
};

/** Crawl rows kept as Arrow Utf8 input before glyph expansion. */
export const CRAWL_TEXT_ROWS = [
  'EPISODE IV',
  'A NEW VISION',
  '',
  'It is a period of rapid',
  'advancement in GPU',
  'visualization.',
  '',
  'deck.gl, striking from',
  'the vis.gl alliance, has',
  'won its first great victory',
  'against the forces of slow,',
  'static rendering.',
  '',
  'During the battle,',
  'developers uncovered',
  'the secret weakness of',
  "Legacy Rendering's",
  'ultimate weapon:',
  'brittle visualization',
  'pipelines with no reusable',
  'layers, no rapid tiling,',
  'and no graceful path to',
  'large-scale interaction.',
  '',
  'Driven by a band of',
  'vis.gl contributors,',
  'deck.gl carries the hope',
  'of the GPU rebellion,',
  'bringing new promise to',
  'interactive maps, massive',
  'datasets, and cinematic',
  'exploration....'
] as const;

/** Wraps crawl rows in the Arrow Utf8 source table consumed by the example. */
export function makeArrowText3DTextTable(
  textRows: readonly string[] = CRAWL_TEXT_ROWS
): ArrowText3DTextTable {
  return new arrow.Table({
    texts: arrow.vectorFromArray([...textRows], new arrow.Utf8()) as arrow.Vector<arrow.Utf8>
  });
}

/** Expands Arrow Utf8 rows into grouped Arrow glyph occurrences for glyph geometry range draws. */
export function makeArrowText3DGlyphData(
  textTable: ArrowText3DTextTable,
  glyphAtlas: Text3DGlyphAtlas
): ArrowText3DGlyphData {
  const glyphLayout = layoutText3DGlyphRows(getArrowTextRows(textTable), glyphAtlas, {
    align: 'center'
  });
  const glyphInstancesByIndex = groupGlyphInstancesByIndex(glyphLayout.instances);
  const recordBatches: arrow.RecordBatch<ArrowText3DGlyphInstanceColumns>[] = [];
  const drawRanges: ArrowText3DGlyphDrawRange[] = [];

  for (const glyphRange of glyphAtlas.glyphs) {
    const glyphInstances = glyphInstancesByIndex.get(glyphRange.glyphIndex);
    if (!glyphInstances?.length) {
      continue;
    }
    const glyphInstanceTable = makeArrowText3DGlyphInstanceGroupTable(glyphRange, glyphInstances);
    const glyphInstanceBatch = glyphInstanceTable.batches[0];
    if (!glyphInstanceBatch) {
      throw new Error('Arrow 3D text glyph groups must create one record batch');
    }
    recordBatches.push(glyphInstanceBatch);
    drawRanges.push({
      ...glyphRange,
      batchIndex: recordBatches.length - 1,
      instanceCount: glyphInstances.length
    });
  }

  const glyphData = {
    textTable,
    glyphInstanceTable: new arrow.Table(recordBatches),
    drawRanges,
    glyphLayout
  } satisfies ArrowText3DGlyphData;
  validateArrowText3DGlyphData(glyphAtlas, glyphData);
  return glyphData;
}

/** Verifies grouped Arrow glyph data matches its used-glyph atlas and draw ranges. */
export function validateArrowText3DGlyphData(
  glyphAtlas: Text3DGlyphAtlas,
  glyphData: ArrowText3DGlyphData
): void {
  const glyphIds = getRequiredArrowUint32Column(glyphData.glyphInstanceTable, 'glyphIds');
  const renderedGlyphIndices = new Set(
    glyphData.glyphLayout.instances.map(glyphInstance => glyphInstance.glyphIndex)
  );
  const tableGlyphIndices = new Set<number>(glyphIds.toArray());

  if (renderedGlyphIndices.size !== glyphAtlas.glyphs.length) {
    throw new Error('Arrow 3D text glyph atlas must contain only visible used glyphs');
  }
  if (tableGlyphIndices.size !== glyphData.drawRanges.length) {
    throw new Error('Arrow 3D text glyph batches must contain one group per draw range');
  }
  if (glyphData.glyphInstanceTable.batches.length !== glyphData.drawRanges.length) {
    throw new Error('Arrow 3D text glyph batches must align with draw ranges');
  }
  if (glyphData.glyphInstanceTable.numRows !== glyphData.glyphLayout.instances.length) {
    throw new Error('Arrow 3D text glyph table row count must match visible glyph instances');
  }

  for (const drawRange of glyphData.drawRanges) {
    const glyphInstanceBatch = glyphData.glyphInstanceTable.batches[drawRange.batchIndex];
    if (!glyphInstanceBatch || glyphInstanceBatch.numRows !== drawRange.instanceCount) {
      throw new Error('Arrow 3D text draw ranges must match grouped instance batches');
    }
  }
}

/** Reads required Utf8 rows from the example source table. */
function getArrowTextRows(textTable: ArrowText3DTextTable): string[] {
  const texts = textTable.getChild('texts');
  if (!texts || !arrow.DataType.isUtf8(texts.type)) {
    throw new Error('Arrow 3D text source requires one Utf8 "texts" column');
  }
  return Array.from({length: texts.length}, (_, textRowIndex) => texts.get(textRowIndex) ?? '');
}

/** Groups visible glyph occurrences by stable atlas glyph order. */
function groupGlyphInstancesByIndex(
  glyphInstances: readonly Text3DGlyphInstance[]
): Map<number, Text3DGlyphInstance[]> {
  const glyphInstancesByIndex = new Map<number, Text3DGlyphInstance[]>();
  for (const glyphInstance of glyphInstances) {
    const glyphInstances = glyphInstancesByIndex.get(glyphInstance.glyphIndex) ?? [];
    glyphInstances.push(glyphInstance);
    glyphInstancesByIndex.set(glyphInstance.glyphIndex, glyphInstances);
  }
  return glyphInstancesByIndex;
}

/** Creates one glyph-homogeneous Arrow record batch for one glyph geometry range draw. */
function makeArrowText3DGlyphInstanceGroupTable(
  glyphRange: Text3DGlyphRange,
  glyphInstances: readonly Text3DGlyphInstance[]
): ArrowText3DGlyphInstanceTable {
  const glyphIds = new Uint32Array(glyphInstances.length);
  const glyphCodePoints = new Uint32Array(glyphInstances.length);
  const instanceOffsets = new Float32Array(glyphInstances.length * 3);
  const sourceRowIndices = new Uint32Array(glyphInstances.length);
  const sourceGlyphIndices = new Uint32Array(glyphInstances.length);

  for (const [glyphInstanceIndex, glyphInstance] of glyphInstances.entries()) {
    glyphIds[glyphInstanceIndex] = glyphRange.glyphIndex;
    glyphCodePoints[glyphInstanceIndex] = glyphRange.glyphCodePoint;
    sourceRowIndices[glyphInstanceIndex] = glyphInstance.sourceRowIndex;
    sourceGlyphIndices[glyphInstanceIndex] = glyphInstance.sourceGlyphIndex;
    instanceOffsets.set(glyphInstance.offset, glyphInstanceIndex * 3);
  }

  return new arrow.Table({
    glyphIds: makeArrowUint32Vector(glyphIds),
    glyphCodePoints: makeArrowUint32Vector(glyphCodePoints),
    instanceOffsets: makeArrowFixedSizeListVector(new arrow.Float32(), 3, instanceOffsets),
    sourceRowIndices: makeArrowUint32Vector(sourceRowIndices),
    sourceGlyphIndices: makeArrowUint32Vector(sourceGlyphIndices)
  });
}

/** Creates one Arrow Uint32 vector from packed row values. */
function makeArrowUint32Vector(values: Uint32Array): arrow.Vector<arrow.Uint32> {
  return arrow.vectorFromArray(
    Array.from(values),
    new arrow.Uint32()
  ) as unknown as arrow.Vector<arrow.Uint32>;
}

/** Returns one required Arrow Uint32 table column. */
function getRequiredArrowUint32Column(
  table: ArrowText3DGlyphInstanceTable,
  columnName: keyof ArrowText3DGlyphInstanceColumns
): arrow.Vector<arrow.Uint32> {
  const column = table.getChild(columnName);
  if (!column || !(column.type instanceof arrow.Uint32)) {
    throw new Error(`Arrow 3D text glyph table requires Uint32 "${columnName}"`);
  }
  return column as arrow.Vector<arrow.Uint32>;
}
