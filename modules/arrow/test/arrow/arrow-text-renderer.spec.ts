// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowTextRenderer,
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  createArrowTextShaderInputs,
  drawArrowTextPickingPass,
  getArrowTextRenderModules,
  makeArrowFixedSizeListVector,
  prepareArrowTextInput,
  prepareArrowTextInputFromData,
  supportsTextIndexPicking,
  type ArrowTextRendererDataBatchUpdate
} from '@luma.gl/arrow';
import type {RenderPass} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {
  buildBitmapFontAtlas,
  TextAttributeModel,
  TextDictionaryModel,
  TextStorageModel
} from '@luma.gl/text';
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

test('ArrowTextRenderer streams data-backed text batches into prepared updates', async t => {
  const device = new NullDevice({});
  const renderer = await ArrowTextRenderer.create(device, {
    data: new arrow.Table([makeTextRecordBatch(new Float32Array([0, 0]), ['A'])]),
    model: 'attribute',
    fontAtlas: FONT_ATLAS
  });
  const updates = await waitForTextBatches(
    renderer,
    new arrow.Table([
      makeTextRecordBatch(new Float32Array([0, 0, 1, 1]), ['AB', 'A']),
      makeTextRecordBatch(new Float32Array([2, 2]), ['B'])
    ]),
    2
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
    value: 8
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

test('Arrow text picking rebuilds storage and dictionary picking models from state', t => {
  const device = new NullDevice({});
  const shaderInputs = createArrowTextShaderInputs();
  const dictionaryTextModel = makeTextModelStateStub(TextDictionaryModel, 'dictionary-text');
  const storageTextModel = makeTextModelStateStub(TextStorageModel, 'storage-text');
  const dictionaryPickingModel = {} as TextDictionaryModel;
  const storagePickingModel = {} as TextStorageModel;
  const originalDictionaryFromState = TextDictionaryModel.fromState;
  const originalStorageFromState = TextStorageModel.fromState;
  let dictionaryPickingProps: Parameters<typeof TextDictionaryModel.fromState>[1] | undefined;
  let storagePickingProps: Parameters<typeof TextStorageModel.fromState>[1] | undefined;

  TextDictionaryModel.fromState = ((
    _: Parameters<typeof TextDictionaryModel.fromState>[0],
    props: Parameters<typeof TextDictionaryModel.fromState>[1]
  ) => {
    dictionaryPickingProps = props;
    return dictionaryPickingModel;
  }) as typeof TextDictionaryModel.fromState;
  TextStorageModel.fromState = ((
    _: Parameters<typeof TextStorageModel.fromState>[0],
    props: Parameters<typeof TextStorageModel.fromState>[1]
  ) => {
    storagePickingProps = props;
    return storagePickingModel;
  }) as typeof TextStorageModel.fromState;

  try {
    t.equal(
      createArrowTextPickingModel(device, dictionaryTextModel, shaderInputs),
      dictionaryPickingModel,
      'dictionary picking rebuilds through dictionary state'
    );
    t.equal(
      createArrowTextPickingModel(device, storageTextModel, shaderInputs),
      storagePickingModel,
      'storage picking rebuilds through storage state'
    );
    t.equal(
      dictionaryPickingProps?.fragmentEntryPoint,
      'fragmentPicking',
      'dictionary picking selects picking fragment entrypoint'
    );
    t.equal(
      storagePickingProps?.fragmentEntryPoint,
      'fragmentPicking',
      'storage picking selects picking fragment entrypoint'
    );

    const drawState = makePickingDrawState();
    drawArrowTextPickingPass({} as RenderPass, makePickingDrawModel(drawState), storageTextModel, {
      onBatch: batchIndex => drawState.batchIndices.push(batchIndex)
    });
    t.deepEqual(drawState.batchIndices, [0], 'storage picking reports its single render batch');
    t.equal(drawState.drawCount, 1, 'storage picking draws once');
  } finally {
    TextDictionaryModel.fromState = originalDictionaryFromState;
    TextStorageModel.fromState = originalStorageFromState;
  }
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

function makeTextModelStateStub<ModelT extends TextDictionaryModel | TextStorageModel>(
  ModelClass: {prototype: ModelT},
  id: string
): ModelT {
  return Object.assign(Object.create(ModelClass.prototype), {id, storageState: {}}) as ModelT;
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
  expectedBatchCount: number
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
          if (updates.length === expectedBatchCount) {
            clearTimeout(timeoutId);
            resolve(updates);
          }
        }
      })
      .catch(reject);
  });
}
