// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeArrowFixedSizeListVector, resolveArrowTextSourceVectors} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

it('resolveArrowTextSourceVectors maps same-name Table and RecordBatch columns', () => {
  const sourceVectors = makeArrowTextSourceVectors();
  const table = new arrow.Table(sourceVectors);
  const resolvedFromTable = resolveArrowTextSourceVectors({data: table});
  const resolvedFromRecordBatch = resolveArrowTextSourceVectors({data: table.batches[0]!});

  expect(resolvedFromTable.positions.length, 'Table positions resolve').toBe(
    sourceVectors.positions.length
  );
  expect(resolvedFromTable.texts.toArray(), 'Table texts resolve').toEqual(
    sourceVectors.texts.toArray()
  );
  expect(resolvedFromRecordBatch.texts.length, 'RecordBatch resolves').toBe(
    sourceVectors.texts.length
  );
  expect(resolvedFromTable.colors?.length, 'same-name colors resolve').toBe(
    sourceVectors.colors.length
  );
  void 0;
});

it('resolveArrowTextSourceVectors maps nested string selectors', () => {
  const sourceVectors = makeArrowTextSourceVectors();
  const table = makeNestedArrowTextTable('source', sourceVectors);
  const resolved = resolveArrowTextSourceVectors({
    data: table,
    selectors: {
      positions: 'source.positions',
      texts: 'source.texts',
      colors: 'source.colors',
      clipRects: 'source.clipRects',
      textAnchors: 'source.textAnchors',
      alignmentBaselines: 'source.alignmentBaselines'
    }
  });

  expect(resolved.positions.length, 'nested positions resolve').toBe(
    sourceVectors.positions.length
  );
  expect(resolved.texts.length, 'nested texts resolve').toBe(sourceVectors.texts.length);
  expect(resolved.colors?.length, 'nested colors resolve').toBe(sourceVectors.colors.length);
  expect(resolved.clipRects?.length, 'nested clipRects resolve').toBe(
    sourceVectors.clipRects.length
  );
  expect(resolved.textAnchors?.length, 'nested text anchors resolve').toBe(
    sourceVectors.textAnchors.length
  );
  expect(resolved.alignmentBaselines?.length, 'nested alignment baselines resolve').toBe(
    sourceVectors.alignmentBaselines.length
  );
  void 0;
});

it('resolveArrowTextSourceVectors supports direct vectors and optional disable', () => {
  const sourceVectors = makeArrowTextSourceVectors();
  const resolved = resolveArrowTextSourceVectors({
    selectors: {positions: sourceVectors.positions, texts: sourceVectors.texts, colors: null}
  });

  expect(resolved.positions, 'direct positions do not require a Table').toBe(
    sourceVectors.positions
  );
  expect(resolved.texts, 'direct texts do not require a Table').toBe(sourceVectors.texts);
  expect(resolved.colors, 'null disables optional colors').toBe(undefined);
  void 0;
});

it('resolveArrowTextSourceVectors skips optional columns and requires text inputs', () => {
  const sourceVectors = makeArrowTextSourceVectors();
  const resolved = resolveArrowTextSourceVectors({
    data: new arrow.Table({positions: sourceVectors.positions, texts: sourceVectors.texts})
  });

  expect(resolved.colors, 'missing optional colors are skipped').toBe(undefined);
  expect(
    () => resolveArrowTextSourceVectors({data: new arrow.Table({texts: sourceVectors.texts})}),
    'missing required positions throw'
  ).toThrow(/source column "positions" for "positions" is missing/);
  expect(
    () =>
      resolveArrowTextSourceVectors({data: new arrow.Table({positions: sourceVectors.positions})}),
    'missing required texts throw'
  ).toThrow(/source column "texts" for "texts" is missing/);
  void 0;
});

function makeArrowTextSourceVectors() {
  return {
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1])),
    texts: arrow.vectorFromArray(['A', 'B'], new arrow.Utf8()),
    colors: makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
    ),
    textAnchors: arrow.vectorFromArray([0, 1], new arrow.Uint8()),
    alignmentBaselines: arrow.vectorFromArray([0, 2], new arrow.Uint8()),
    clipRects: makeArrowFixedSizeListVector(
      new arrow.Float32(),
      4,
      new Float32Array([0, 0, 8, 8, 0, 0, 8, 8])
    )
  };
}

function makeNestedArrowTextTable(
  fieldName: string,
  sourceVectors: ReturnType<typeof makeArrowTextSourceVectors>
): arrow.Table {
  const table = new arrow.Table(sourceVectors);
  const innerStructData = table.batches[0]!.data;
  const schema = new arrow.Schema([new arrow.Field(fieldName, innerStructData.type)]);
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: table.numRows,
    nullCount: 0,
    nullBitmap: null,
    children: [innerStructData]
  });
  return new arrow.Table([new arrow.RecordBatch(schema, structData)]);
}
