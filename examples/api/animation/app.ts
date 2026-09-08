import {UniformStore} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  Model,
  CubeGeometry,
  Timeline,
  KeyFrames,
  makeRandomGenerator
} from '@luma.gl/engine';
import {dirlight} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {type SettingsChangeDescriptor} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml
} from '../../example-panels';
import {makeAnimationPanel, makeAnimationSettingsSchema} from './app-ui';

// Ensure repeatable rendertests
const random = makeRandomGenerator();

import {app, fs, source, vs, type AppUniforms} from './shaders';

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly translations = [
    [2, -2, 0],
    [2, 2, 0],
    [-2, 2, 0],
    [-2, -2, 0]
  ];

  readonly rotations = [
    [random(), random(), random()],
    [random(), random(), random()],
    [random(), random(), random()],
    [random(), random(), random()]
  ];

  readonly colors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0]
  ];

  readonly keyFrameData: [number, number][] = [
    [0, 0],
    [1000, 2 * Math.PI],
    [2000, Math.PI],
    [3000, 2 * Math.PI],
    [4000, 0]
  ];

  timeline: Timeline;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;

  cubes: {
    translation: number[];
    rotation: number[];
    keyFrames: KeyFrames<number>;
    model: Model;
    uniformStore: UniformStore<{app: AppUniforms}>;
  }[];
  globalUniformStore: UniformStore<{dirlight: typeof dirlight.uniforms}>;

  constructor({device, aspect, animationLoop}: AnimationProps) {
    super();
    this.globalUniformStore = new UniformStore(device, {
      dirlight
    });

    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'animation-settings',
      schema: makeAnimationSettingsSchema(),
      settings: {time: this.timeline.getTime()},
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({
      panel: makeAnimationPanel(this.settingsPanel, this.timeline)
    });
    this.panels.mount();

    const channels = [
      this.timeline.addChannel({delay: 2000, rate: 0.5, duration: 8000, repeat: 2}),
      this.timeline.addChannel({delay: 10000, rate: 0.2, duration: 20000, repeat: 1}),
      this.timeline.addChannel({
        delay: 7000,
        rate: 1,
        duration: 4000,
        repeat: 8
      }),
      this.timeline.addChannel({
        delay: 0,
        rate: 0.8,
        duration: 5000,
        repeat: Number.POSITIVE_INFINITY
      })
    ];

    this.cubes = new Array(4);

    const keyFrames = [
      new KeyFrames(this.keyFrameData),
      new KeyFrames(this.keyFrameData),
      new KeyFrames(this.keyFrameData),
      new KeyFrames(this.keyFrameData)
    ];

    for (let i = 0; i < 4; ++i) {
      this.timeline.attachAnimation(keyFrames[i], channels[i]);

      const cubeUniformStore = new UniformStore(device, {app});

      cubeUniformStore.setUniforms({
        app: {
          uProjection: new Matrix4().perspective({fovy: radians(60), aspect, near: 1, far: 20.0}),
          uView: new Matrix4().lookAt({
            center: [0, 0, 0],
            eye: [0, 0, -8]
          }),
          uColor: this.colors[i]
        }
      });

      this.cubes[i] = {
        uniformStore: cubeUniformStore,
        translation: this.translations[i],
        rotation: this.rotations[i],
        keyFrames: keyFrames[i],
        model: new Model(device, {
          id: `cube-${i}`,
          source,
          vs,
          fs,
          instanceCount: 1,
          modules: [dirlight],
          geometry: new CubeGeometry(),
          parameters: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal'
          },
          bindings: {
            app: cubeUniformStore.getManagedUniformBuffer('app'),
            dirlight: this.globalUniformStore.getManagedUniformBuffer('dirlight')
          }
        })
      };
    }
  }

  onFinalize() {
    this.settingsPanel.finalize();
    this.panels.finalize();
    for (const cube of this.cubes) {
      cube.model.destroy();
    }
  }

  onRender({device, aspect}: AnimationProps) {
    this.settingsPanel.setSettings({time: this.timeline.getTime()});
    this.panels.setPanel(makeAnimationPanel(this.settingsPanel, this.timeline));

    const modelMatrix = new Matrix4();
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(60),
      aspect,
      near: 1,
      far: 20.0
    });

    for (const cube of this.cubes) {
      const startRotation = cube.keyFrames.getStartData();
      const endRotation = cube.keyFrames.getEndData();
      const rotation = startRotation + cube.keyFrames.factor * (endRotation - startRotation);
      const rotationX = cube.rotation[0] + rotation;
      const rotationY = cube.rotation[1] + rotation;
      const rotationZ = cube.rotation[2];
      modelMatrix
        .identity()
        .translate(cube.translation)
        .rotateXYZ([rotationX, rotationY, rotationZ]);

      cube.uniformStore.setUniforms({
        app: {
          uModel: modelMatrix,
          uProjection: projectionMatrix
        }
      });

      cube.uniformStore.updateUniformBuffers();
    }

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: true
    });
    for (const cube of this.cubes) {
      cube.model.draw(renderPass);
    }
    renderPass.end();
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const time = getChangedSetting(changedSettings, 'time')?.nextValue;
    if (typeof time === 'number') {
      this.timeline.setTime(time);
    }
  };
}
