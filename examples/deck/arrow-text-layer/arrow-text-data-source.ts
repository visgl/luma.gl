// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SettingsSchema} from '@deck.gl-community/panels';
import type {ArrowTextLayerProps} from '@deck.gl-community/arrow-layers';
import * as arrow from 'apache-arrow';
import {
  createStreamingRecordBatchIterator,
  makeArrowTextSource,
  makeStreamingArrowTextSourceAsync,
  STREAMING_TEXT_BATCH_COUNT,
  TEXT_DATASETS,
  type TextColorKind,
  type TextRowCountKind,
  type TextSourceKind
} from '../../arrow/arrow-text-2d/arrow-text-data';
import {
  ARROW_EXAMPLE_INPUT_MODE_OPTIONS,
  type ArrowExampleInputMode
} from '../../arrow/arrow-example-input';
import {DeckArrowSourcePanel} from '../arrow-example-source-panel';

type TextColumnKind = 'constant' | 'column';
type TextClipKind = 'none' | 'column';

type ArrowTextDataSourceState = Record<string, unknown> & {
  inputMode: ArrowExampleInputMode;
  rowCountKind: TextRowCountKind;
  sourceKind: TextSourceKind;
  colorKind: TextColorKind;
  sizeKind: TextColumnKind;
  angleKind: TextColumnKind;
  clipKind: TextClipKind;
  modelKind: 'attribute';
};

export type ArrowTextDataSourceUpdate = Pick<
  ArrowTextLayerProps,
  | 'data'
  | 'positions'
  | 'texts'
  | 'clipRects'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'model'
  | 'color'
  | 'angle'
  | 'size'
  | 'characterSet'
  | 'onDataBatch'
>;

/** Owns data selection and the shared Arrow panels for the deck text example. */
export class ArrowTextDataSource {
  private state: ArrowTextDataSourceState = {
    inputMode: 'stream',
    rowCountKind: '10k',
    sourceKind: 'utf8',
    colorKind: 'constant',
    sizeKind: 'constant',
    angleKind: 'constant',
    clipKind: 'column',
    modelKind: 'attribute'
  };
  private readonly panel = new DeckArrowSourcePanel({
    id: 'deck-arrow-text',
    description:
      'Arrow UTF-8 or dictionary strings and style columns can stream by RecordBatch, resolve by table column name, or be supplied as direct vectors.',
    schema: makeArrowTextDataSourceSchema(),
    initialState: this.state,
    onSettingsChange: state => {
      this.state = state;
      void this.emitDataSource();
    }
  });
  private sourceVersion = 0;
  private isFinalized = false;

  constructor(private readonly onDataSourceChange: (update: ArrowTextDataSourceUpdate) => void) {}

  initialize(): void {
    this.panel.initialize();
    void this.emitDataSource();
  }

  finalize(): void {
    this.isFinalized = true;
    this.sourceVersion++;
    this.panel.finalize();
  }

  private async emitDataSource(): Promise<void> {
    const sourceVersion = ++this.sourceVersion;
    const datasetKey = `${this.state.rowCountKind}${
      this.state.sourceKind === 'dictionary' ? '-dict' : ''
    }` as keyof typeof TEXT_DATASETS;
    const dataset = TEXT_DATASETS[datasetKey];
    const styleColumns = {
      clipRects: this.state.clipKind === 'column',
      angles: this.state.angleKind === 'column',
      sizes: this.state.sizeKind === 'column'
    };
    const recordBatches =
      this.state.inputMode === 'stream'
        ? (await makeStreamingArrowTextSourceAsync(dataset, this.state.colorKind, styleColumns))
            .recordBatches
        : makeArrowTextTable(makeArrowTextSource(dataset, this.state.colorKind, styleColumns))
            .batches;
    if (this.isFinalized || sourceVersion !== this.sourceVersion) {
      return;
    }

    const sourceTable = new arrow.Table(recordBatches);
    const positions = sourceTable.getChild('positions');
    const texts = sourceTable.getChild('texts');
    if (!positions || !texts) {
      throw new Error('Arrow text example requires positions and texts columns');
    }
    const tableStream = this.panel.beginTableStream(recordBatches);
    const commonProps: ArrowTextDataSourceUpdate = {
      model: 'attribute',
      color: [199, 219, 245, 255],
      angle: 0,
      size: 32,
      characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-',
      colors: this.state.colorKind === 'constant' ? null : undefined,
      sizes: this.state.sizeKind === 'constant' ? null : undefined,
      angles: this.state.angleKind === 'constant' ? null : undefined,
      clipRects: this.state.clipKind === 'none' ? null : undefined,
      pixelOffsets: null,
      onDataBatch: update => {
        if (!this.isFinalized) {
          tableStream.setLoadedBatchCount(update.loadedBatchCount);
        }
      }
    };

    if (this.state.inputMode === 'vectors') {
      tableStream.setLoadedBatchCount(recordBatches.length);
      this.onDataSourceChange({
        ...commonProps,
        positions: positions as ArrowTextLayerProps['positions'],
        texts: texts as ArrowTextLayerProps['texts'],
        colors:
          this.state.colorKind === 'constant'
            ? null
            : (sourceTable.getChild('colors') as ArrowTextLayerProps['colors']),
        sizes:
          this.state.sizeKind === 'constant'
            ? null
            : (sourceTable.getChild('sizes') as ArrowTextLayerProps['sizes']),
        angles:
          this.state.angleKind === 'constant'
            ? null
            : (sourceTable.getChild('angles') as ArrowTextLayerProps['angles']),
        clipRects:
          this.state.clipKind === 'none'
            ? null
            : (sourceTable.getChild('clipRects') as ArrowTextLayerProps['clipRects'])
      });
      return;
    }

    this.onDataSourceChange({
      ...commonProps,
      data:
        this.state.inputMode === 'stream'
          ? createStreamingRecordBatchIterator(recordBatches)[Symbol.asyncIterator]()
          : sourceTable,
      positions: 'positions',
      texts: 'texts',
      colors: this.state.colorKind === 'constant' ? null : 'colors',
      sizes: this.state.sizeKind === 'constant' ? null : 'sizes',
      angles: this.state.angleKind === 'constant' ? null : 'angles',
      clipRects: this.state.clipKind === 'none' ? null : 'clipRects'
    });
  }
}

function makeArrowTextDataSourceSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'data',
        name: 'Data',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'inputMode',
            label: 'Input',
            type: 'select',
            persist: 'none',
            options: [...ARROW_EXAMPLE_INPUT_MODE_OPTIONS]
          },
          {
            name: 'rowCountKind',
            label: 'Rows',
            type: 'select',
            persist: 'none',
            options: [
              {label: '10K texts', value: '10k'},
              {label: '100K texts', value: '100k'},
              {label: '1M texts', value: '1m'}
            ]
          },
          {
            name: 'sourceKind',
            label: 'Text',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Utf8 strings', value: 'utf8'},
              {label: 'Dictionary<Utf8>', value: 'dictionary'}
            ]
          },
          {
            name: 'colorKind',
            label: 'Colors',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row colors', value: 'string-colors'},
              {label: 'Character colors', value: 'character-colors'}
            ]
          },
          {
            name: 'sizeKind',
            label: 'Sizes',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row size column', value: 'column'}
            ]
          },
          {
            name: 'angleKind',
            label: 'Angles',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row angle column', value: 'column'}
            ]
          },
          {
            name: 'clipKind',
            label: 'Clip rects',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              {label: 'Row clip column', value: 'column'}
            ]
          }
        ]
      },
      {
        id: 'renderer',
        name: 'Renderer',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'modelKind',
            label: 'Model',
            type: 'select',
            persist: 'none',
            options: [{label: 'Attribute (deck.gl)', value: 'attribute'}]
          }
        ]
      }
    ]
  };
}

export const DECK_TEXT_STREAMING_BATCH_COUNT = STREAMING_TEXT_BATCH_COUNT;

function makeArrowTextTable(source: ReturnType<typeof makeArrowTextSource>): arrow.Table {
  return new arrow.Table({
    positions: source.positions,
    texts: source.texts,
    ...(source.clipRects ? {clipRects: source.clipRects} : {}),
    ...(source.colors ? {colors: source.colors} : {}),
    ...(source.angles ? {angles: source.angles} : {}),
    ...(source.sizes ? {sizes: source.sizes} : {}),
    ...(source.pixelOffsets ? {pixelOffsets: source.pixelOffsets} : {})
  });
}
