// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type LayerContext,
  type LayerProps,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import {assert, type Buffer, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {ScientificFlowGraph} from '@luma.gl/experimental';
import {windStreak, SOURCE} from './wind-particle-layer-shaders';

export type WindParticleLayerProps = LayerProps & {
  /** Borrowed graph; the layer never advances or destroys its simulation. */
  simulation: ScientificFlowGraph;
  widthPixels?: number;
  /** Displayed motion extrapolation in seconds, not a retained curved particle trail. */
  trailSeconds?: number;
  altitude?: number;
  /** Linear RGBA components in [0, 1]. */
  color?: readonly [number, number, number, number];
};

const PARAMETERS = {
  depthCompare: 'less-equal',
  depthWriteEnabled: false,
  cullMode: 'none',
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

/** Draws GPU scientific-flow buffers as depth-tested screen-width streaks with stable particle picking. */
export class WindParticleLayer extends Layer<WindParticleLayerProps> {
  static override layerName = 'WindParticleLayer';
  static override defaultProps = {
    // Altitude controls occlusion without Deck polygon offsets.
    getPolygonOffset: () => [0, 0],
    widthPixels: {type: 'number', value: 1.5, min: 0},
    trailSeconds: {type: 'number', value: 1, min: 0},
    altitude: {type: 'number', value: 1},
    color: [0.4, 0.9, 1, 0.9],
    parameters: PARAMETERS
  };
  declare state: {model: Model; corners: Buffer};
  override getAttributeManager() {
    return null;
  }
  override getNumInstances(): number {
    return this.props.simulation.simulation.particleCount;
  }
  override initializeState({device}: LayerContext): void {
    // Scientific flow uses WebGPU storage buffers.
    assert(device.type === 'webgpu');
    const simulation = this.props.simulation;
    const corners = device.createBuffer({
      data: new Float32Array([0, -1, 1, -1, 0, 1, 0, 1, 1, -1, 1, 1])
    });
    try {
      const model = new Model(device, {
        ...this.getShaders({
          source: SOURCE,
          modules: [project32, picking, windStreak]
        }),
        shaderLayout: {
          attributes: [],
          bindings: [
            {
              name: 'windState',
              type: 'read-only-storage',
              group: 3,
              location: 1
            },
            {
              name: 'windPreviousState',
              type: 'read-only-storage',
              group: 3,
              location: 2
            }
          ]
        },
        id: this.id,
        topology: 'triangle-list',
        vertexCount: 6,
        isInstanced: true,
        instanceCount: this.props.simulation.simulation.particleCount,
        bufferLayout: [{name: 'corner', format: 'float32x2'}],
        attributes: {corner: corners},
        bindings: {
          windState: simulation.output,
          windPreviousState: simulation.previous
        },
        parameters: PARAMETERS
      });
      this.setState({model, corners});
    } catch (error) {
      corners.destroy();
      throw error;
    }
  }
  override updateState({props}: UpdateParameters<this>): void {
    const simulation = this.props.simulation;
    this.state.model.setInstanceCount(props.simulation.simulation.particleCount);
    this.state.model.setBindings({
      windState: simulation.output,
      windPreviousState: simulation.previous
    });
  }
  override getModels(): Model[] {
    return this.state.model ? [this.state.model] : [];
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    const simulation = this.props.simulation;
    this.state.model.setBindings({
      windState: simulation.output,
      windPreviousState: simulation.previous
    });
    const bounds = [
      simulation.field.field.bounds[0],
      simulation.field.field.bounds[1],
      simulation.field.field.bounds[2] - simulation.field.field.bounds[0],
      simulation.field.field.bounds[3] - simulation.field.field.bounds[1]
    ];
    this.state.model.shaderInputs.setProps({
      windStreak: {
        bounds: bounds.map(Math.fround),
        boundsLow: bounds.map(value => value - Math.fround(value)),
        appearance: [
          this.props.widthPixels,
          this.props.trailSeconds,
          this.props.altitude,
          this.props.opacity
        ],
        color: this.props.color
      }
    });
    this.state.model.draw(renderPass);
  }
  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    info.object = info.index >= 0 ? {id: info.index} : null;
    return info;
  }
  override finalizeState(context: LayerContext): void {
    this.state.model?.destroy();
    this.state.corners?.destroy();
    super.finalizeState(context);
  }
}
