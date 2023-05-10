/*
import {Resource, Query, QueryProps} from '@luma.gl/api';
import {WebGPUDevice} from '../webgpu-device';

export type WebGPUQueryProps = QueryProps & {
  handle?: any;
};

const DEFAULT_QUERY_PROPS: Required<WebGPUQueryProps> = {
  id: undefined,
  handle: undefined,
  userData: undefined,
  type: 'timestamp',
  count: 1,
  pipelineStatistics: []
};

/**
 * Immutable
 *
class WebGPUQuery extends Resource<WebGPUQueryProps> implements Query {
  readonly device: WebGPUDevice;
  readonly handle: GPUQuerySet;

  constructor(device: WebGPUDevice, props: WebGPUQueryProps) {
    super(device, props, DEFAULT_QUERY_PROPS);
    this.handle = this.props.handle as GPUQuerySet || this.createHandle();
    this.handle.label = this.props.id;
  }

  protected createHandle() {
    return this.device.handle.createQuerySet({
      type: this.props.type,
      count: this.props.count,
      pipelineStatistics: this.props.pipelineStatistics
    });
  }

  override destroy(): void {
    this.handle.destroy();
  }
}
*/