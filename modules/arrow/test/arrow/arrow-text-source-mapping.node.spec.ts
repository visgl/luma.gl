// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeArrowFixedSizeListVector, resolveArrowTextSourceVectors} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

test('resolveArrowTextSourceVectors maps same-name Table and RecordBatch columns', t => {
  const sourceVectors = makeArrowTextSourceVectors();
  const table = new arrow.Table(sourceVectors);
  const resolvedFromTable = resolveArrowTextSourceVectors({data: table});
  const resolvedFromRecordBatch = resolveArrowTextSourceVectors({data: table.batches[0]!});

  t.equal(
    resolvedFromTable.positions.length,
    sourceVectors.positions.length,
    'Table positions resolve'
  );
  t.deepEqual(
    resolvedFromTable.texts.toArray(),
    sourceVectors.texts.toArray(),
    'Table texts resolve'
  );
  t.equal(resolvedFromRecordBatch.texts.length, sourceVectors.texts.length, 'RecordBatch resolves');
  t.equal(
    resolvedFromTable.colors?.length,
    sourceVectors.colors.length,
    'same-name colors resolve'
  );
  t.end();
});

test('resolveArrowTextSourceVectors maps nested string selectors', t => {
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

  t.equal(resolved.positions.length, sourceVectors.positions.length, 'nested positions resolve');
  t.equal(resolved.texts.length, sourceVectors.texts.length, 'nested texts resolve');
  t.equal(resolved.colors?.length, sourceVectors.colors.length, 'nested colors resolve');
  t.equal(resolved.clipRects?.length, sourceVectors.clipRects.length, 'nested clipRects resolve');
  t.equal(
    resolved.textAnchors?.length,
    sourceVectors.textAnchors.length,
    'nested text anchors resolve'
  );
  t.equal(
    resolved.alignmentBaselines?.length,
    sourceVectors.alignmentBaselines.length,
    'nested alignment baselines resolve'
  );
  t.end();
});

test('resolveArrowTextSourceVectors supports direct vectors and optional disable', t => {
  const sourceVectors = makeArrowTextSourceVectors();
  const resolved = resolveArrowTextSourceVectors({
    selectors: {positions: sourceVectors.positions, texts: sourceVectors.texts, colors: null}
  });

  t.equal(resolved.positions, sourceVectors.positions, 'direct positions do not require a Table');
  t.equal(resolved.texts, sourceVectors.texts, 'direct texts do not require a Table');
  t.equal(resolved.colors, undefined, 'null disables optional colors');
  t.end();
});

test('resolveArrowTextSourceVectors skips optional columns and requires text inputs', t => {
  const sourceVectors = makeArrowTextSourceVectors();
  const resolved = resolveArrowTextSourceVectors({
    data: new arrow.Table({positions: sourceVectors.positions, texts: sourceVectors.texts})
  });

  t.equal(resolved.colors, undefined, 'missing optional colors are skipped');
  t.throws(
    () => resolveArrowTextSourceVectors({data: new arrow.Table({texts: sourceVectors.texts})}),
    /source column "positions" for "positions" is missing/,
    'missing required positions throw'
  );
  t.throws(
    () =>
      resolveArrowTextSourceVectors({data: new arrow.Table({positions: sourceVectors.positions})}),
    /source column "texts" for "texts" is missing/,
    'missing required texts throw'
  );
  t.end();
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
