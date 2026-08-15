// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  ArrowTextRenderer,
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  drawArrowTextPickingPass,
  getArrowTextRenderModules,
  getArrowVectorByteLength,
  isArrowUtf8ViewDictionaryVector,
  isArrowUtf8ViewVector,
  makeGPUTextDataFromArrow,
  makeGPUTextDataFromArrowStream,
  makeArrowFixedSizeListVector,
  normalizeArrowUtf8TextVector,
  prepareArrowTextInput,
  prepareArrowTextInputFromData,
  supportsTextIndexPicking,
  type ArrowUtf8TextInputVector,
  type ArrowTextRendererDataBatchUpdate
} from '@luma.gl/arrow';
import type {RenderPass} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {
  buildBitmapFontAtlas,
  GPUTextResources,
  TextRenderer,
  type GPUTextData
} from '@luma.gl/text';
import {
  TextAttributeModel,
  TextDictionaryModel,
  TextStorageModel
} from '@luma.gl/text/experimental';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const CHARACTER_SET = ' AB';
const FONT_ATLAS = buildBitmapFontAtlas({characterSet: CHARACTER_SET, fontSize: 10});

test('ArrowTextRenderer prepares attribute text and draws attribute picking batches', async t => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowTextSourceVectors(['AB', 'A']);
  const renderer = await ArrowTextRenderer.create(device, {
    ...sourceVectors,
    model: 'attribute',
    fontAtlas: FONT_ATLAS
  });

  t.equal(renderer.resolvedModel, 'attribute', 'NullDevice keeps text on the attribute path');
  t.ok(renderer.textRenderer instanceof TextRenderer, 'renderer uses the stable text facade');
  t.equal(renderer.textData[0]?.strategy, 'attribute', 'prepared data records the strategy');
  t.equal(renderer.textRenderer.stats.glyphCount, 3, 'renderer exposes aggregate statistics');
  t.ok(renderer.model instanceof TextAttributeModel, 'attribute renderer owns an attribute model');
  t.equal(getArrowTextRenderModules(device).length, 1, 'renderer resolves one picking module');
  t.notOk(supportsTextIndexPicking(device), 'NullDevice does not support index picking');
  t.equal(
    createArrowTextPickingManager(device, renderer.shaderInputs, () => {}),
    null,
    'unsupported devices skip picking manager creation'
  );

  const preparedFromSource = prepareArrowTextInput(device, {
    ...sourceVectors,
    arrowVectorByteLength: 12
  });
  t.equal(preparedFromSource.arrowVectorByteLength, 12, 'source preparation keeps byte metadata');
  preparedFromSource.destroy();

  const preparedFromData = await prepareArrowTextInputFromData(device, sourceVectors);
  t.ok(preparedFromData.arrowVectorByteLength > 0, 'direct source preparation measures text bytes');
  const resources = new GPUTextResources(device, {fontAtlas: FONT_ATLAS});
  const preparedTextData = makeGPUTextDataFromArrow(device, {
    ...preparedFromData,
    resources
  });
  t.equal(preparedTextData[0]?.strategy, 'attribute', 'automatic preparation uses attributes');
  const preparedTextRenderer = new TextRenderer(device, {data: preparedTextData});
  preparedTextRenderer.destroy();
  for (const data of preparedTextData) {
    data.destroy();
  }
  resources.destroy();
  preparedFromData.destroy();

  const pickingModel = createArrowTextPickingModel(device, renderer.model, renderer.shaderInputs);
  t.equal(
    pickingModel.instanceCount,
    renderer.model.instanceCount,
    'picking model mirrors glyph rows'
  );

  const drawState = makePickingDrawState();
  drawArrowTextPickingPass({} as RenderPass, makePickingDrawModel(drawState), renderer.model, {
    onBatch: batchIndex => drawState.batchIndices.push(batchIndex)
  });
  t.deepEqual(drawState.batchIndices, [0], 'attribute picking reports each glyph batch');
  t.deepEqual(
    drawState.instanceCounts,
    [3, 3],
    'attribute picking binds and restores glyph counts'
  );
  t.equal(drawState.attributeSetCount, 2, 'attribute picking binds and restores attributes');
  t.equal(drawState.drawCount, 1, 'attribute picking draws each glyph batch');

  t.equal(
    (await renderer.setProps({color: [1, 2, 3, 4]})).modelChanged,
    true,
    'constant style changes rebuild the model'
  );
  t.equal(
    (await renderer.setProps({color: [1, 2, 3, 4]})).modelChanged,
    false,
    'unchanged constant styles keep the model'
  );
  t.equal(
    (await renderer.setProps({texts: makeArrowTexts(['A', 'A'])})).modelChanged,
    true,
    'direct text vector changes rebuild prepared input'
  );
  t.equal(
    (await renderer.setProps({model: 'storage'})).modelChanged,
    true,
    'unsupported storage requests rebuild through attribute fallback'
  );
  t.equal(renderer.resolvedModel, 'attribute', 'unsupported storage resolves back to attributes');

  renderer.needsRedraw();
  renderer.setNeedsRedraw('renderer redraw');
  t.equal(renderer.needsRedraw(), 'renderer redraw', 'renderer exposes pending redraw reason');
  renderer.predraw(device.commandEncoder);
  renderer.draw(device.getDefaultRenderPass());

  pickingModel.destroy();
  renderer.destroy();
  t.end();
});

test('ArrowTextRenderer normalizes Utf8View labels with Arrow 17-compatible imports', async t => {
  const labels = ['A', 'ABABABABABABA', null];
  const texts = makeArrowUtf8ViewTexts(labels);
  t.ok(isArrowUtf8ViewVector(texts), 'detects Utf8View by its runtime type ID');
  const data = texts.data[0] as unknown as {
    buffers: readonly (ArrayBufferView | undefined)[];
    variadicBuffers: readonly Uint8Array[];
  };
  const fixedBufferByteLength = data.buffers.reduce(
    (byteLength, buffer) => byteLength + (buffer?.byteLength ?? 0),
    0
  );
  const variadicBufferByteLength = data.variadicBuffers.reduce(
    (byteLength, buffer) => byteLength + buffer.byteLength,
    0
  );
  t.equal(
    getArrowVectorByteLength(texts),
    fixedBufferByteLength + variadicBufferByteLength,
    'counts view records, validity, and variadic buffers'
  );

  const normalized = normalizeArrowUtf8TextVector(texts);
  t.ok(normalized.type instanceof arrow.Utf8, 'normalizes Utf8View to Utf8');
  t.deepEqual(
    Array.from(normalized),
    labels,
    'preserves sliced inline, out-of-line, and null labels'
  );

  const device = new NullDevice({});
  const renderer = await ArrowTextRenderer.create(device, {
    positions: makeArrowPositions(labels.length),
    texts,
    model: 'attribute',
    fontAtlas: FONT_ATLAS
  });
  t.ok(
    renderer.textInput.sourceVectors.texts.type instanceof arrow.Utf8,
    'renderer retains normalized Utf8 source data'
  );
  t.equal(renderer.textRenderer.stats.glyphCount, 14, 'renderer expands every view-backed glyph');
  renderer.destroy();
  t.end();
});

test('Arrow Utf8View normalization preserves dictionary encoding', t => {
  const texts = makeArrowUtf8ViewDictionaryTexts(['A', 'ABABABABABABA'], [1, 0, 1]);
  t.ok(isArrowUtf8ViewDictionaryVector(texts), 'detects dictionary-encoded Utf8View');

  const normalized = normalizeArrowUtf8TextVector(texts);
  t.ok(arrow.DataType.isDictionary(normalized.type), 'preserves dictionary encoding');
  t.ok(normalized.type.dictionary instanceof arrow.Utf8, 'normalizes dictionary values to Utf8');
  t.deepEqual(
    Array.from(normalized),
    ['ABABABABABABA', 'A', 'ABABABABABABA'],
    'preserves dictionary row values'
  );
  t.end();
});

test('ArrowTextRenderer can transfer GPUTextData ownership to a host', async t => {
  const device = new NullDevice({});
  const renderer = await ArrowTextRenderer.create(device, {
    ...makeArrowTextSourceVectors(['AB']),
    fontAtlas: FONT_ATLAS
  });
  const textData = renderer.transferTextDataOwnership(() => {});

  renderer.destroy();
  t.equal(textData[0]?.glyphCount, 2, 'destroying the renderer preserves host-owned data');
  textData[0]?.destroy();
  textData[0]?.destroy();
  t.pass('caller-owned GPUTextData destruction is idempotent');
  t.end();
});

test('makeGPUTextDataFromArrowStream preserves incremental global indices', async t => {
  const device = new NullDevice({});
  const resources = new GPUTextResources(device, {fontAtlas: FONT_ATLAS});
  const inputs = await Promise.all(
    [makeArrowTextSourceVectors(['AB']), makeArrowTextSourceVectors(['A'])].map(source =>
      prepareArrowTextInputFromData(device, source)
    )
  );
  const batches: GPUTextData[] = [];
  async function* getInputs() {
    for (const input of inputs) {
      yield input;
    }
  }
  for await (const batch of makeGPUTextDataFromArrowStream(device, getInputs(), {resources})) {
    batches.push(batch);
  }

  t.equal(batches.length, 2, 'one GPUTextData is yielded for each input batch');
  t.deepEqual(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.glyphIndexBase]),
    [
      [0, 0, 0],
      [1, 1, 2]
    ],
    'stream metadata remains global without rebuilding earlier batches'
  );
  for (const batch of batches) {
    batch.destroy();
  }
  for (const input of inputs) {
    input.destroy();
  }
  resources.destroy();
  t.end();
});

test('ArrowTextRenderer streams data-backed text batches into prepared updates', async t => {
  const device = new NullDevice({});
  const renderer = await ArrowTextRenderer.create(device, {
    data: new arrow.Table([makeTextRecordBatch(new Float32Array([0, 0]), ['A'])]),
    model: 'attribute',
    fontAtlas: FONT_ATLAS
  });
  let firstBatchModel: ArrowTextRenderer['model'] | undefined;
  let firstTextData: (typeof renderer.textData)[number] | undefined;
  const updates = await waitForTextBatches(
    renderer,
    new arrow.Table([
      makeTextRecordBatch(new Float32Array([0, 0, 1, 1]), ['AB', 'A']),
      makeTextRecordBatch(new Float32Array([2, 2]), ['B'])
    ]),
    2,
    update => {
      if (update.isFirstBatch) {
        firstBatchModel = renderer.model;
        firstTextData = renderer.textData[0];
      }
    }
  );

  t.deepEqual(
    updates.map(update => update.loadedBatchCount),
    [1, 2],
    'streaming updates report uploaded GPU table batch count'
  );
  t.deepEqual(
    updates.map(update => update.isFirstBatch),
    [true, false],
    'streaming updates distinguish first and appended batches'
  );
  t.equal(renderer.textInput.positions.length, 3, 'streamed renderer retains every source row');
  t.equal(renderer.textInput.texts.length, 3, 'streamed renderer retains every text row');
  t.equal(renderer.model, firstBatchModel, 'appending keeps the first render model');
  t.equal(renderer.textData[0], firstTextData, 'appending keeps the first prepared batch');
  t.equal(renderer.textData.length, 2, 'each streamed source batch has independent data');
  t.equal(renderer.textRenderer.stats.sourceBatchCount, 2, 'stats retain source boundaries');

  renderer.destroy();
  t.end();
});

test('ArrowTextRenderer keeps auto text on attributes below compact compute limits', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const originalMaxStorageBuffersPerShaderStage = device.limits.maxStorageBuffersPerShaderStage;
  Object.defineProperty(device.limits, 'maxStorageBuffersPerShaderStage', {
    configurable: true,
    value: 6
  });
  try {
    const renderer = await ArrowTextRenderer.create(device, {
      ...makeArrowTextSourceVectors(['AB', 'A']),
      fontAtlas: FONT_ATLAS
    });
    t.equal(renderer.resolvedModel, 'attribute', 'portable compute limits use attribute text');
    renderer.destroy();
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBuffersPerShaderStage', {
      configurable: true,
      value: originalMaxStorageBuffersPerShaderStage
    });
  }
  t.end();
});

test('Arrow text picking draws storage and dictionary models with borrowed state', t => {
  const dictionaryTextModel = makeTextModelStateStub(TextDictionaryModel, 'dictionary-text');
  const storageTextModel = makeTextModelStateStub(TextStorageModel, 'storage-text');
  const storageDrawState = makePickingDrawState();
  drawArrowTextPickingPass(
    {} as RenderPass,
    makePickingDrawModel(storageDrawState),
    storageTextModel,
    {onBatch: batchIndex => storageDrawState.batchIndices.push(batchIndex)}
  );
  t.deepEqual(storageDrawState.batchIndices, [0], 'storage picking reports one render batch');
  t.equal(storageDrawState.drawCount, 1, 'storage picking draws once');

  const dictionaryDrawState = makePickingDrawState();
  drawArrowTextPickingPass(
    {} as RenderPass,
    makePickingDrawModel(dictionaryDrawState),
    dictionaryTextModel,
    {onBatch: batchIndex => dictionaryDrawState.batchIndices.push(batchIndex)}
  );
  t.deepEqual(dictionaryDrawState.batchIndices, [0], 'dictionary picking reports one render batch');
  t.equal(dictionaryDrawState.drawCount, 1, 'dictionary picking draws once');
  t.end();
});

function makeArrowTextSourceVectors(labels: readonly (string | null)[]) {
  return {
    positions: makeArrowPositions(labels.length),
    texts: makeArrowTexts(labels)
  };
}

function makeArrowPositions(rowCount: number): arrow.Vector<arrow.FixedSizeList<arrow.Float32>> {
  const positions = new Float32Array(rowCount * 2);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    positions[rowIndex * 2] = rowIndex;
    positions[rowIndex * 2 + 1] = rowIndex;
  }
  return makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions);
}

function makeArrowTexts(labels: readonly (string | null)[]): arrow.Vector<arrow.Utf8> {
  return arrow.vectorFromArray(labels, new arrow.Utf8()) as arrow.Vector<arrow.Utf8>;
}

function makeArrowUtf8ViewTexts(labels: readonly (string | null)[]): ArrowUtf8TextInputVector {
  const Utf8View = (arrow as unknown as {Utf8View?: new () => arrow.DataType}).Utf8View;
  if (Utf8View) {
    return arrow.vectorFromArray(labels, new Utf8View()) as ArrowUtf8TextInputVector;
  }

  const type = {typeId: 24} as unknown as arrow.DataType;
  const dataOffset = 1;
  const values = new Uint8Array((labels.length + dataOffset) * 16);
  const variadicBytes: number[] = [];
  const nullBitmap = new Uint8Array(Math.ceil((labels.length + dataOffset) / 8));
  const textEncoder = new TextEncoder();

  for (let rowIndex = 0; rowIndex < labels.length; rowIndex++) {
    const label = labels[rowIndex];
    if (label === null) {
      continue;
    }
    nullBitmap[(rowIndex + dataOffset) >> 3] |= 1 << ((rowIndex + dataOffset) & 7);
    const encodedLabel = textEncoder.encode(label);
    const viewByteOffset = (rowIndex + dataOffset) * 16;
    const view = new DataView(values.buffer, viewByteOffset, 16);
    view.setInt32(0, encodedLabel.byteLength, true);
    if (encodedLabel.byteLength <= 12) {
      values.set(encodedLabel, viewByteOffset + 4);
      continue;
    }
    values.set(encodedLabel.subarray(0, 4), viewByteOffset + 4);
    view.setInt32(8, 0, true);
    view.setInt32(12, variadicBytes.length, true);
    variadicBytes.push(...encodedLabel);
  }

  const variadicBuffers = [Uint8Array.from(variadicBytes)];
  const data = {
    type,
    length: labels.length,
    offset: dataOffset,
    nullCount: labels.filter(label => label === null).length,
    values,
    nullBitmap,
    buffers: [undefined, values, nullBitmap, undefined],
    children: [],
    variadicBuffers
  };
  return {type, data: [data], length: labels.length} as unknown as ArrowUtf8TextInputVector;
}

function makeArrowUtf8ViewDictionaryTexts(
  dictionaryLabels: readonly string[],
  indices: readonly number[]
): ArrowUtf8TextInputVector {
  const dictionary = makeArrowUtf8ViewTexts(dictionaryLabels);
  const type = new arrow.Dictionary(dictionary.type, new arrow.Int8(), 0, false);
  const values = Int8Array.from(indices);
  const data = {
    type,
    length: indices.length,
    offset: 0,
    nullCount: 0,
    values,
    buffers: [undefined, values, undefined, undefined],
    children: [],
    dictionary
  };
  return {type, data: [data], length: indices.length} as unknown as ArrowUtf8TextInputVector;
}

function makeTextModelStateStub<ModelT extends TextDictionaryModel | TextStorageModel>(
  ModelClass: {prototype: ModelT},
  id: string
): ModelT {
  return Object.assign(Object.create(ModelClass.prototype), {id, storageStates: [{}]}) as ModelT;
}

function makeTextRecordBatch(positions: Float32Array, texts: string[]): arrow.RecordBatch {
  const recordBatch = new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    texts: makeArrowTexts(texts)
  }).batches[0];
  if (!recordBatch) {
    throw new Error('Arrow text renderer test requires a populated record batch');
  }
  return recordBatch;
}

function makePickingDrawState() {
  return {
    attributeSetCount: 0,
    batchIndices: [] as number[],
    drawCount: 0,
    instanceCounts: [] as number[]
  };
}

function makePickingDrawModel(drawState: ReturnType<typeof makePickingDrawState>): Model {
  return {
    setAttributes: () => {
      drawState.attributeSetCount++;
    },
    setInstanceCount: instanceCount => {
      drawState.instanceCounts.push(instanceCount);
    },
    draw: () => {
      drawState.drawCount++;
      return true;
    }
  } as unknown as Model;
}

function waitForTextBatches(
  renderer: ArrowTextRenderer,
  data: arrow.Table,
  expectedBatchCount: number,
  onUpdate?: (update: ArrowTextRendererDataBatchUpdate) => void
): Promise<ArrowTextRendererDataBatchUpdate[]> {
  return new Promise((resolve, reject) => {
    const updates: ArrowTextRendererDataBatchUpdate[] = [];
    const timeoutId = setTimeout(
      () => reject(new Error(`Timed out waiting for ${expectedBatchCount} text batches`)),
      2000
    );
    void renderer
      .setProps({
        data,
        onDataBatch: update => {
          updates.push(update);
          onUpdate?.(update);
          if (updates.length === expectedBatchCount) {
            clearTimeout(timeoutId);
            resolve(updates);
          }
        }
      })
      .catch(reject);
  });
}
