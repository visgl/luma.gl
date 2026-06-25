// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Timeline} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';
import {
  ArrowInstancedMeshRenderer,
  DEFAULT_INSTANCES_PER_SIDE,
  INSTANCES_PER_SIDE_OPTIONS
} from './arrow-instanced-mesh-renderer';
import {ArrowInstancingControlPanel} from './control-panel';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly timeline: Timeline;
  readonly timelineChannels: Record<string, number>;
  readonly controlPanel: ArrowInstancingControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  readonly layer: ArrowInstancedMeshRenderer;
  instancesPerSide = DEFAULT_INSTANCES_PER_SIDE;

  constructor({device, animationLoop}: AnimationProps) {
    super();

    this.device = device as Device;
    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();

    this.timelineChannels = {
      timeChannel: this.timeline.addChannel({rate: 0.01}),
      eyeXChannel: this.timeline.addChannel({rate: 0.0003}),
      eyeYChannel: this.timeline.addChannel({rate: 0.0004}),
      eyeZChannel: this.timeline.addChannel({rate: 0.0002})
    };

    this.layer = new ArrowInstancedMeshRenderer(this.device, {
      instancesPerSide: this.instancesPerSide
    });
    this.controlPanel = new ArrowInstancingControlPanel({
      instanceCountOptions: INSTANCES_PER_SIDE_OPTIONS,
      initialState: {instancesPerSide: this.instancesPerSide},
      handlers: {onInstanceCountChange: this.handleInstanceCountChange},
      onRefresh: () => this.panels.refresh()
    });
    this.panels.mount();
    this.controlPanel.initialize();
    this.syncTableEntry();
  }

  onRender(animationProps: AnimationProps): void {
    const {device, aspect, tick} = animationProps;
    const {timeChannel, eyeXChannel, eyeYChannel, eyeZChannel} = this.timelineChannels;

    this.controlPanel.initialize();
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });
    this.layer.draw(renderPass, {
      geometryScale: DEFAULT_INSTANCES_PER_SIDE / this.instancesPerSide,
      time: this.timeline.getTime(timeChannel),
      projectionMatrix: new Matrix4().perspective({
        fovy: radians(60),
        aspect,
        near: 1,
        far: 2048.0
      }),
      viewMatrix: new Matrix4().lookAt({
        center: [0, 0, 0],
        eye: [
          (Math.cos(this.timeline.getTime(eyeXChannel)) * DEFAULT_INSTANCES_PER_SIDE) / 2,
          (Math.sin(this.timeline.getTime(eyeYChannel)) * DEFAULT_INSTANCES_PER_SIDE) / 2,
          ((Math.sin(this.timeline.getTime(eyeZChannel)) + 1) * DEFAULT_INSTANCES_PER_SIDE) / 4 + 32
        ]
      }),
      modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
    });
    renderPass.end();

    this.layer.pick(animationProps._mousePosition, {force: true});
  }

  onFinalize(): void {
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer.destroy();
  }

  handleInstanceCountChange = (instancesPerSide: number): void => {
    if (instancesPerSide === this.instancesPerSide) {
      return;
    }
    this.instancesPerSide = instancesPerSide;
    this.controlPanel.syncControls({instancesPerSide});
    this.layer.setProps({instancesPerSide});
    this.syncTableEntry();
  };

  syncTableEntry(): void {
    this.panels.setTableEntries([
      {
        id: 'instancing-source',
        label: 'Instance attributes',
        kind: 'source',
        table: this.layer.getInstanceArrowTable()
      }
    ]);
  }
}
