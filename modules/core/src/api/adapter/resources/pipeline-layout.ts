// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Device} from '../device';
import {ShaderLayout} from '../types/shader-layout';
import {DeviceResource, DeviceResourceProps} from './device-resource';

export type PipelineLayoutProps = DeviceResourceProps & {
  shaderLayout: ShaderLayout;
};

/** Immutable PipelineLayout object */
export abstract class PipelineLayout extends DeviceResource<PipelineLayoutProps> {
  get [Symbol.toStringTag](): string {
    return 'PipelineLayout';
  }

  constructor(device: Device, props: PipelineLayoutProps) {
    super(device, props, PipelineLayout.defaultProps);
  }

  static override defaultProps: Required<PipelineLayoutProps> = {
    ...DeviceResource.defaultProps,
    shaderLayout: {
      attributes: [],
      bindings: []
    }
  };
}
