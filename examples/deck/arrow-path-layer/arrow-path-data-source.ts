// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SettingsSchema} from '@deck.gl-community/panels';
import type {ArrowPathLayerProps} from '@deck.gl-community/arrow-layers';
import * as arrow from 'apache-arrow';
import {
  createStreamingPathRecordBatchIterator,
  makeArrowLineRecordBatches,
  makeArrowLineSourceData,
  PATH_DATASETS,
  STREAMING_PATH_BATCH_COUNT,
  STREAMING_PATH_ROWS_PER_CHUNK,
  type ArrowLineColorKind,
  type ArrowLineCoordinateKind,
  type ArrowLineRowCountKind,
  type ArrowLineTimeKind
} from '../../arrow/arrow-lines/arrow-line-data';
import {
  ARROW_EXAMPLE_INPUT_MODE_OPTIONS,
  type ArrowExampleInputMode
} from '../../arrow/arrow-example-input';
import {DeckArrowSourcePanel} from '../arrow-example-source-panel';

type PathWidthKind = 'constant' | 'row-widths';

type ArrowPathDataSourceState = Record<string, unknown> & {
  inputMode: ArrowExampleInputMode;
  rowCountKind: ArrowLineRowCountKind;
  coordinateKind: Exclude<ArrowLineCoordinateKind, 'dense-union'>;
  colorKind: ArrowLineColorKind;
  widthKind: PathWidthKind;
  timeKind: ArrowLineTimeKind;
  modelKind: 'attribute';
};

export type ArrowPathDataSourceUpdate = Pick<
  ArrowPathLayerProps,
  | 'data'
  | 'paths'
  | 'colors'
  | 'widths'
  | 'timestamps'
  | 'color'
  | 'width'
  | 'model'
  | 'onDataBatch'
>;

/** Owns data selection and the shared Arrow panels for the deck path example. */
export class ArrowPathDataSource {
  private state: ArrowPathDataSourceState = {
    inputMode: 'stream',
    rowCountKind: '240-stream',
    coordinateKind: 'float32',
    colorKind: 'row-colors',
    widthKind: 'row-widths',
    timeKind: 'none',
    modelKind: 'attribute'
  };
  private readonly panel = new DeckArrowSourcePanel({
    id: 'deck-arrow-paths',
    description:
      'Variable-length Arrow paths preserve RecordBatch boundaries and can be supplied as a stream, named table columns, or direct vectors.',
    schema: makeArrowPathDataSourceSchema(),
    initialState: this.state,
    onSettingsChange: state => {
      this.state = state;
      this.emitDataSource();
    }
  });
  private isFinalized = false;

  constructor(private readonly onDataSourceChange: (update: ArrowPathDataSourceUpdate) => void) {}

  initialize(): void {
    this.panel.initialize();
    this.emitDataSource();
  }

  finalize(): void {
    this.isFinalized = true;
    this.panel.finalize();
  }

  private emitDataSource(): void {
    const datasetKind = this.state.rowCountKind === '240-stream' ? '240' : '2400';
    const sourceData = makeArrowLineSourceData(
      PATH_DATASETS[datasetKind],
      'lines',
      this.state.coordinateKind,
      this.state.colorKind,
      this.state.timeKind,
      STREAMING_PATH_ROWS_PER_CHUNK
    );
    const recordBatches = makeArrowLineRecordBatches(sourceData).slice(
      0,
      STREAMING_PATH_BATCH_COUNT
    );
    const sourceTable = new arrow.Table(recordBatches);
    const tableStream = this.panel.beginTableStream(recordBatches);
    const commonProps: ArrowPathDataSourceUpdate = {
      model: 'attribute',
      color: [199, 219, 245, 235],
      width: 0.0035,
      colors: this.state.colorKind === 'none' ? null : undefined,
      widths: this.state.widthKind === 'constant' ? null : undefined,
      timestamps: this.state.timeKind === 'timestamps' ? undefined : null,
      onDataBatch: update => {
        if (!this.isFinalized) {
          tableStream.setLoadedBatchCount(update.loadedBatchCount);
        }
      }
    };

    if (this.state.inputMode === 'vectors') {
      this.onDataSourceChange({
        ...commonProps,
        paths: sourceData.sourceVectors.paths as ArrowPathLayerProps['paths'],
        colors:
          this.state.colorKind === 'none' ? null : (sourceData.sourceVectors.colors ?? undefined),
        widths: this.state.widthKind === 'constant' ? null : sourceData.sourceVectors.widths,
        timestamps:
          this.state.timeKind === 'timestamps' ? sourceData.sourceVectors.timestamps : null
      });
      return;
    }

    this.onDataSourceChange({
      ...commonProps,
      data:
        this.state.inputMode === 'stream'
          ? createStreamingPathRecordBatchIterator(recordBatches)
          : sourceTable,
      paths: 'paths',
      colors: this.state.colorKind === 'none' ? null : 'colors',
      widths: this.state.widthKind === 'constant' ? null : 'widths',
      timestamps: this.state.timeKind === 'timestamps' ? 'timestamps' : null
    });
  }
}

function makeArrowPathDataSourceSchema(): SettingsSchema {
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
              {label: PATH_DATASETS['240'].label, value: '240-stream'},
              {label: PATH_DATASETS['2400'].label, value: '2400-stream'}
            ]
          },
          {
            name: 'coordinateKind',
            label: 'Coordinates',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Float32 XY(ZM)', value: 'float32'},
              {label: 'Float64 XY(ZM)', value: 'float64'}
            ]
          },
          {
            name: 'colorKind',
            label: 'Colors',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'none'},
              {label: 'Row colors', value: 'row-colors'},
              {label: 'Vertex colors', value: 'vertex-colors'}
            ]
          },
          {
            name: 'widthKind',
            label: 'Widths',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row widths', value: 'row-widths'}
            ]
          },
          {
            name: 'timeKind',
            label: 'Time',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              {label: 'XYZM coordinate', value: 'xyzm'},
              {label: 'Timestamp column', value: 'timestamps'}
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
