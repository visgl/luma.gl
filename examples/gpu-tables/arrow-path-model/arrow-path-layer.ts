// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AttributePathModel,
  StoragePathModel,
  StorageTripsPathModel,
  convertArrowPathsToAttribute,
  prepareArrowTemporalGPUVector,
  type ArrowPathPreparedState
} from '@luma.gl/arrow';
import {type Device, type ShaderLayout} from '@luma.gl/core';
import {type ShaderInputs} from '@luma.gl/engine';
import {type GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';

export type ArrowPathLayerModel = 'attribute' | 'storage' | 'trips' | 'auto';
export type ArrowPathLayerResolvedModel = Exclude<ArrowPathLayerModel, 'auto'>;
export type ArrowPathLayerTimeColumn = 'xyzm' | 'timestamps';
export type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
export type ArrowPathFloat64CoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
export type ArrowPathSourceCoordinateType =
  | ArrowPathCoordinateType
  | ArrowPathFloat64CoordinateType;
export type ArrowPathTimestampType = arrow.List<arrow.Float32>;
export type ArrowPathSourceTimestampType = arrow.List<arrow.TimestampMillisecond>;
export type ArrowPathRowColorType = arrow.FixedSizeList<arrow.Uint8>;
export type ArrowPathVertexColorType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;
export type ArrowPathColorType = ArrowPathRowColorType | ArrowPathVertexColorType;
export type ArrowPathLayerActiveModel =
  | AttributePathModel
  | StoragePathModel
  | StorageTripsPathModel;

export type ArrowPathLayerSourceVectors = {
  paths: arrow.Vector<ArrowPathSourceCoordinateType>;
  colors?: arrow.Vector<ArrowPathColorType>;
  widths?: arrow.Vector<arrow.Float32>;
  timestamps?: arrow.Vector<ArrowPathSourceTimestampType>;
};

export type ArrowPathLayerData = {
  paths: GPUVector<ArrowPathCoordinateType>;
  colors?: GPUVector<ArrowPathColorType>;
  widths?: GPUVector<arrow.Float32>;
  timestamps?: GPUVector<ArrowPathTimestampType>;
  viewOrigins?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  pathState: ArrowPathPreparedState;
  destroy: () => void;
};

export type ArrowPathLayerPrepareDataProps = {
  sourceVectors: ArrowPathLayerSourceVectors;
  id?: string;
};

export type ArrowPathLayerProps = {
  id?: string;
  data: ArrowPathLayerData;
  model?: ArrowPathLayerModel;
  timeColumn?: ArrowPathLayerTimeColumn;
  currentTime?: number;
  trailLength?: number;
  color?: [number, number, number, number];
  width?: number;
  source: string;
  vs?: string;
  fs?: string;
  shaderLayout: ShaderLayout;
  storageSource?: string;
  storageShaderLayout?: ShaderLayout;
  tripsSource?: string;
  tripsShaderLayout?: ShaderLayout;
  shaderInputs: ShaderInputs<any>;
  topology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  vertexCount?: number;
  parameters?: Record<string, unknown>;
};

export class ArrowPathLayer {
  readonly device: Device;
  props: ArrowPathLayerProps;
  model: ArrowPathLayerActiveModel;
  resolvedModel: ArrowPathLayerResolvedModel;

  constructor(device: Device, props: ArrowPathLayerProps) {
    this.device = device;
    this.props = props;
    this.resolvedModel = this.resolveModel(props.model ?? 'auto', props.timeColumn ?? 'xyzm');
    this.model = this.createModel(this.resolvedModel, props);
  }

  static async prepareData(
    device: Device,
    props: ArrowPathLayerPrepareDataProps
  ): Promise<ArrowPathLayerData> {
    const preparedTimestamps = props.sourceVectors.timestamps
      ? await prepareArrowTemporalGPUVector(device, props.sourceVectors.timestamps, {
          name: 'timestamps',
          id: `${props.id ?? 'arrow-path-layer'}-timestamps`
        })
      : null;
    const prepared = await convertArrowPathsToAttribute(
      device,
      {
        paths: props.sourceVectors.paths,
        ...(props.sourceVectors.colors ? {colors: props.sourceVectors.colors} : {}),
        ...(props.sourceVectors.widths ? {widths: props.sourceVectors.widths} : {})
      },
      {
        id: props.id ?? 'arrow-path-layer'
      }
    );

    return {
      paths: prepared.paths,
      ...(prepared.colors ? {colors: prepared.colors} : {}),
      ...(prepared.widths ? {widths: prepared.widths} : {}),
      ...(preparedTimestamps
        ? {timestamps: preparedTimestamps.temporal as GPUVector<ArrowPathTimestampType>}
        : {}),
      ...(prepared.viewOrigins ? {viewOrigins: prepared.viewOrigins} : {}),
      pathState: prepared.pathProps.pathState,
      destroy: () => {
        prepared.destroy();
        preparedTimestamps?.destroy();
      }
    };
  }

  setProps(props: Partial<ArrowPathLayerProps>): void {
    const nextProps = {...this.props, ...props};
    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextProps.timeColumn ?? this.props.timeColumn ?? 'xyzm'
    );
    this.props = nextProps;

    if (props.currentTime !== undefined && this.model instanceof StorageTripsPathModel) {
      this.model.setProps({currentTime: props.currentTime});
    }

    if (
      props.data === undefined &&
      props.model === undefined &&
      props.timeColumn === undefined &&
      nextModel === this.resolvedModel
    ) {
      return;
    }

    const previousModel = this.model;
    this.resolvedModel = nextModel;
    this.model = this.createModel(nextModel, nextProps);
    previousModel.destroy();
  }

  draw(renderPass: Parameters<ArrowPathLayerActiveModel['draw']>[0]): void {
    this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
  }

  private resolveModel(
    modelKind: ArrowPathLayerModel,
    timeColumn: ArrowPathLayerTimeColumn
  ): ArrowPathLayerResolvedModel {
    if (modelKind === 'auto') {
      if (this.device.type !== 'webgpu') {
        return 'attribute';
      }
      return timeColumn === 'timestamps' ? 'trips' : 'storage';
    }
    if (modelKind !== 'attribute' && this.device.type !== 'webgpu') {
      return 'attribute';
    }
    if (modelKind === 'storage' && timeColumn === 'timestamps') {
      return 'trips';
    }
    return modelKind;
  }

  private createModel(
    modelKind: ArrowPathLayerResolvedModel,
    props: ArrowPathLayerProps
  ): ArrowPathLayerActiveModel {
    const commonProps = {
      id: props.id,
      paths: props.data.paths,
      ...(props.data.colors ? {colors: props.data.colors} : {}),
      ...(props.data.widths ? {widths: props.data.widths} : {}),
      ...(props.data.viewOrigins ? {viewOrigins: props.data.viewOrigins} : {}),
      shaderInputs: props.shaderInputs,
      topology: props.topology,
      vertexCount: props.vertexCount,
      parameters: props.parameters
    };

    if (modelKind === 'storage') {
      return new StoragePathModel(this.device, {
        ...commonProps,
        color: props.color,
        width: props.width,
        source: props.storageSource ?? props.source,
        shaderLayout: props.storageShaderLayout ?? props.shaderLayout
      });
    }

    if (modelKind === 'trips') {
      if (!props.data.timestamps) {
        throw new Error('ArrowPathLayer trips model requires a timestamps column');
      }
      return new StorageTripsPathModel(this.device, {
        ...commonProps,
        timestamps: props.data.timestamps,
        currentTime: props.currentTime ?? 0,
        trailLength: props.trailLength ?? 0,
        color: props.color,
        width: props.width,
        source: props.tripsSource ?? props.storageSource ?? props.source,
        shaderLayout: props.tripsShaderLayout ?? props.storageShaderLayout ?? props.shaderLayout
      });
    }

    return new AttributePathModel(this.device, {
      ...commonProps,
      pathState: props.data.pathState,
      source: props.source,
      vs: props.vs,
      fs: props.fs,
      shaderLayout: props.shaderLayout
    });
  }
}
