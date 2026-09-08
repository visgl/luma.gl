// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('ArrowTextRenderer prepares attribute text and draws attribute picking batches', async () => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowTextSourceVectors(['AB', 'A']);
  const renderer = await ArrowTextRenderer.create(device, {
    ...sourceVectors,
    model: 'attribute',
    fontAtlas: FONT_ATLAS
  });

  expect(renderer.resolvedModel, 'NullDevice keeps text on the attribute path').toBe('attribute');
  expect(
    Boolean(renderer.textRenderer instanceof TextRenderer),
    'renderer uses the stable text facade'
  ).toBe(true);
  expect(renderer.textData[0]?.strategy, 'prepared data records the strategy').toBe('attribute');
  expect(renderer.textRenderer.stats.glyphCount, 'renderer exposes aggregate statistics').toBe(3);
  expect(
    Boolean(renderer.model instanceof TextAttributeModel),
    'attribute renderer owns an attribute model'
  ).toBe(true);
  expect(getArrowTextRenderModules(device).length, 'renderer resolves one picking module').toBe(1);
  expect(
    Boolean(supportsTextIndexPicking(device)),
    'NullDevice does not support index picking'
  ).toBe(false);
  expect(
    createArrowTextPickingManager(device, renderer.shaderInputs, () => {}),
    'unsupported devices skip picking manager creation'
  ).toBe(null);

  const preparedFromSource = prepareArrowTextInput(device, {
    ...sourceVectors,
    arrowVectorByteLength: 12
  });
  expect(preparedFromSource.arrowVectorByteLength, 'source preparation keeps byte metadata').toBe(
    12
  );
  preparedFromSource.destroy();

  const preparedFromData = await prepareArrowTextInputFromData(device, sourceVectors);
  expect(
    Boolean(preparedFromData.arrowVectorByteLength > 0),
    'direct source preparation measures text bytes'
  ).toBe(true);
  const resources = new GPUTextResources(device, {fontAtlas: FONT_ATLAS});
  const preparedTextData = makeGPUTextDataFromArrow(device, {
    ...preparedFromData,
    resources
  });
  expect(preparedTextData[0]?.strategy, 'automatic preparation uses attributes').toBe('attribute');
  const preparedTextRenderer = new TextRenderer(device, {data: preparedTextData});
  preparedTextRenderer.destroy();
  for (const data of preparedTextData) {
    data.destroy();
  }
  resources.destroy();
  preparedFromData.destroy();

  const pickingModel = createArrowTextPickingModel(device, renderer.model, renderer.shaderInputs);
  expect(pickingModel.instanceCount, 'picking model mirrors glyph rows').toBe(
    renderer.model.instanceCount
  );

  const drawState = makePickingDrawState();
  drawArrowTextPickingPass({} as RenderPass, makePickingDrawModel(drawState), renderer.model, {
    onBatch: batchIndex => drawState.batchIndices.push(batchIndex)
  });
  expect(drawState.batchIndices, 'attribute picking reports each glyph batch').toEqual([0]);
  expect(drawState.instanceCounts, 'attribute picking binds and restores glyph counts').toEqual([
    3, 3
  ]);
  expect(drawState.attributeSetCount, 'attribute picking binds and restores attributes').toBe(2);
  expect(drawState.drawCount, 'attribute picking draws each glyph batch').toBe(1);

  expect(
    (await renderer.setProps({color: [1, 2, 3, 4]})).modelChanged,
    'constant style changes rebuild the model'
  ).toBe(true);
  expect(
    (await renderer.setProps({color: [1, 2, 3, 4]})).modelChanged,
    'unchanged constant styles keep the model'
  ).toBe(false);
  expect(
    (await renderer.setProps({texts: makeArrowTexts(['A', 'A'])})).modelChanged,
    'direct text vector changes rebuild prepared input'
  ).toBe(true);
  expect(
    (await renderer.setProps({model: 'storage'})).modelChanged,
    'unsupported storage requests rebuild through attribute fallback'
  ).toBe(true);
  expect(renderer.resolvedModel, 'unsupported storage resolves back to attributes').toBe(
    'attribute'
  );

  renderer.needsRedraw();
  renderer.setNeedsRedraw('renderer redraw');
  expect(renderer.needsRedraw(), 'renderer exposes pending redraw reason').toBe('renderer redraw');
  renderer.predraw(device.commandEncoder);
  renderer.draw(device.getDefaultRenderPass());

  pickingModel.destroy();
  renderer.destroy();
  void 0;
});

it('ArrowTextRenderer normalizes Utf8View labels with Arrow 17-compatible imports', async () => {
  const labels = ['A', 'ABABABABABABA', null];
  const texts = makeArrowUtf8ViewTexts(labels);
  expect(Boolean(isArrowUtf8ViewVector(texts)), 'detects Utf8View by its runtime type ID').toBe(
    true
  );
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
  expect(
    getArrowVectorByteLength(texts),
    'counts view records, validity, and variadic buffers'
  ).toBe(fixedBufferByteLength + variadicBufferByteLength);

  const normalized = normalizeArrowUtf8TextVector(texts);
  expect(Boolean(normalized.type instanceof arrow.Utf8), 'normalizes Utf8View to Utf8').toBe(true);
  expect(Array.from(normalized), 'preserves sliced inline, out-of-line, and null labels').toEqual(
    labels
  );

  const device = new NullDevice({});
  const renderer = await ArrowTextRenderer.create(device, {
    positions: makeArrowPositions(labels.length),
    texts,
    model: 'attribute',
    fontAtlas: FONT_ATLAS
  });
  expect(
    Boolean(renderer.textInput.sourceVectors.texts.type instanceof arrow.Utf8),
    'renderer retains normalized Utf8 source data'
  ).toBe(true);
  expect(renderer.textRenderer.stats.glyphCount, 'renderer expands every view-backed glyph').toBe(
    14
  );
  renderer.destroy();
  void 0;
});

it('Arrow Utf8View normalization preserves dictionary encoding', () => {
  const texts = makeArrowUtf8ViewDictionaryTexts(['A', 'ABABABABABABA'], [1, 0, 1]);
  expect(
    Boolean(isArrowUtf8ViewDictionaryVector(texts)),
    'detects dictionary-encoded Utf8View'
  ).toBe(true);

  const normalized = normalizeArrowUtf8TextVector(texts);
  expect(
    Boolean(arrow.DataType.isDictionary(normalized.type)),
    'preserves dictionary encoding'
  ).toBe(true);
  expect(
    Boolean(normalized.type.dictionary instanceof arrow.Utf8),
    'normalizes dictionary values to Utf8'
  ).toBe(true);
  expect(Array.from(normalized), 'preserves dictionary row values').toEqual([
    'ABABABABABABA',
    'A',
    'ABABABABABABA'
  ]);
  void 0;
});

it('ArrowTextRenderer can transfer GPUTextData ownership to a host', async () => {
  const device = new NullDevice({});
  const renderer = await ArrowTextRenderer.create(device, {
    ...makeArrowTextSourceVectors(['AB']),
    fontAtlas: FONT_ATLAS
  });
  const textData = renderer.transferTextDataOwnership(() => {});

  renderer.destroy();
  expect(textData[0]?.glyphCount, 'destroying the renderer preserves host-owned data').toBe(2);
  textData[0]?.destroy();
  textData[0]?.destroy();
  expect(Boolean('caller-owned GPUTextData destruction is idempotent'), '').toBe(true);
  void 0;
});

it('makeGPUTextDataFromArrowStream preserves incremental global indices', async () => {
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

  expect(batches.length, 'one GPUTextData is yielded for each input batch').toBe(2);
  expect(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.glyphIndexBase]),
    'stream metadata remains global without rebuilding earlier batches'
  ).toEqual([
    [0, 0, 0],
    [1, 1, 2]
  ]);
  for (const batch of batches) {
    batch.destroy();
  }
  for (const input of inputs) {
    input.destroy();
  }
  resources.destroy();
  void 0;
});

it('ArrowTextRenderer streams data-backed text batches into prepared updates', async () => {
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

  expect(
    updates.map(update => update.loadedBatchCount),
    'streaming updates report uploaded GPU table batch count'
  ).toEqual([1, 2]);
  expect(
    updates.map(update => update.isFirstBatch),
    'streaming updates distinguish first and appended batches'
  ).toEqual([true, false]);
  expect(renderer.textInput.positions.length, 'streamed renderer retains every source row').toBe(3);
  expect(renderer.textInput.texts.length, 'streamed renderer retains every text row').toBe(3);
  expect(renderer.model, 'appending keeps the first render model').toBe(firstBatchModel);
  expect(renderer.textData[0], 'appending keeps the first prepared batch').toBe(firstTextData);
  expect(renderer.textData.length, 'each streamed source batch has independent data').toBe(2);
  expect(renderer.textRenderer.stats.sourceBatchCount, 'stats retain source boundaries').toBe(2);

  renderer.destroy();
  void 0;
});

it('ArrowTextRenderer keeps auto text on attributes below compact compute limits', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
    expect(renderer.resolvedModel, 'portable compute limits use attribute text').toBe('attribute');
    renderer.destroy();
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBuffersPerShaderStage', {
      configurable: true,
      value: originalMaxStorageBuffersPerShaderStage
    });
  }
  void 0;
});

it('Arrow text picking draws storage and dictionary models with borrowed state', () => {
  const dictionaryTextModel = makeTextModelStateStub(TextDictionaryModel, 'dictionary-text');
  const storageTextModel = makeTextModelStateStub(TextStorageModel, 'storage-text');
  const storageDrawState = makePickingDrawState();
  drawArrowTextPickingPass(
    {} as RenderPass,
    makePickingDrawModel(storageDrawState),
    storageTextModel,
    {onBatch: batchIndex => storageDrawState.batchIndices.push(batchIndex)}
  );
  expect(storageDrawState.batchIndices, 'storage picking reports one render batch').toEqual([0]);
  expect(storageDrawState.drawCount, 'storage picking draws once').toBe(1);

  const dictionaryDrawState = makePickingDrawState();
  drawArrowTextPickingPass(
    {} as RenderPass,
    makePickingDrawModel(dictionaryDrawState),
    dictionaryTextModel,
    {onBatch: batchIndex => dictionaryDrawState.batchIndices.push(batchIndex)}
  );
  expect(dictionaryDrawState.batchIndices, 'dictionary picking reports one render batch').toEqual([
    0
  ]);
  expect(dictionaryDrawState.drawCount, 'dictionary picking draws once').toBe(1);
  void 0;
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
