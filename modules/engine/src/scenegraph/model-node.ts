// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RenderPass} from '@luma.gl/core';
import {ScenegraphNode, ScenegraphNodeProps} from './scenegraph-node';
import {Model} from '../model/model';

export type ModelNodeProps = ScenegraphNodeProps & {
  model: Model;
  managedResources?: any[];
  bounds?: [number[], number[]];
};

export class ModelNode extends ScenegraphNode {
  readonly model: Model;
  bounds: [number[], number[]] | null = null;
  managedResources: any[];

  // TODO - is this used? override callbacks to make sure we call them with this
  // onBeforeRender = null;
  // onAfterRender = null;
  // AfterRender = null;

  constructor(props: ModelNodeProps) {
    super(props);

    // Create new Model or used supplied Model
    this.model = props.model;
    this.managedResources = props.managedResources || [];
    this.bounds = props.bounds || null;
    this.setProps(props);
  }

  override destroy(): void {
    if (this.model) {
      this.model.destroy();
      // @ts-expect-error
      this.model = null;
    }
    this.managedResources.forEach(resource => resource.destroy());
    this.managedResources = [];
  }

  override getBounds(): [number[], number[]] | null {
    return this.bounds;
  }

  // Expose model methods
  draw(renderPass: RenderPass) {
    // Return value indicates if something was actually drawn
    return this.model.draw(renderPass);
  }
}
