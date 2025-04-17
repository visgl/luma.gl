// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '../device';
import {ShaderLayout} from '../types/shader-layout';
import {Resource, ResourceProps} from './resource';

export type PipelineLayoutProps = ResourceProps & {
  shaderLayout: ShaderLayout;
};

/** Immutable PipelineLayout object */
export abstract class PipelineLayout extends Resource<PipelineLayoutProps> {
  get [Symbol.toStringTag](): string {
    return 'PipelineLayout';
  }

  constructor(device: Device, props: PipelineLayoutProps) {
    super(device, props, PipelineLayout.defaultProps);
  }

  static override defaultProps: Required<PipelineLayoutProps> = {
    ...Resource.defaultProps,
    shaderLayout: {
      attributes: [],
      bindings: []
    }
  };
}
