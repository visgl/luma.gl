// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RenderPass} from '@luma.gl/core';
import type {NumericArray} from '@math.gl/core';
import {ScenegraphNode, ScenegraphNodeProps} from './scenegraph-node';
import {
  areScenegraphBoundsDefined,
  expandScenegraphBounds,
  makeEmptyScenegraphBounds
} from './scenegraph-bounds';
import type {ScenegraphBounds} from './scenegraph-bounds';
import {Model} from '../model/model';

export type ModelNodeProps = ScenegraphNodeProps & {
  model: Model;
  managedResources?: any[];
  /** Bounds of one model instance before instance and node transforms. */
  bounds?: ScenegraphBounds;
  /** Optional per-instance transforms used to calculate aggregate local bounds. */
  instanceMatrices?: readonly NumericArray[];
};

export class ModelNode extends ScenegraphNode {
  readonly model: Model;
  readonly instanceMatrices: readonly NumericArray[] | null;
  bounds: ScenegraphBounds | null = null;
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
    this.instanceMatrices = props.instanceMatrices || null;
    this.bounds = props.bounds
      ? this.instanceMatrices
        ? getInstancedScenegraphBounds(props.bounds, this.instanceMatrices)
        : props.bounds
      : null;
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

function getInstancedScenegraphBounds(
  bounds: ScenegraphBounds,
  instanceMatrices: readonly NumericArray[]
): ScenegraphBounds | null {
  const instancedBounds = makeEmptyScenegraphBounds();

  for (const instanceMatrix of instanceMatrices) {
    expandScenegraphBounds(instancedBounds, bounds, instanceMatrix);
  }

  return areScenegraphBoundsDefined(instancedBounds) ? instancedBounds : null;
}
