import {RenderLoop, AnimationProps, CubeGeometry, Timeline, KeyFrames, Model} from '@luma.gl/engine';
import {setParameters, clear} from '@luma.gl/webgl';
import {dirlight} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

import {getRandom} from '@luma.gl/api';
// Ensure repeatable rendertests
const random = getRandom();

const INFO_HTML = `
Key frame animation based on multiple hierarchical timelines.
<button id="play">Play</button>
<button id="pause">Pause</button><BR>
Time: <input type="range" id="time" min="0" max="30000" step="1"><BR>
`;

const vs = `\
attribute vec3 positions;
attribute vec3 normals;

uniform vec3 uColor;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 color;

void main(void) {
  vec3 normal = vec3(uModel * vec4(normals, 0.0));

  // Set up data for modules
  color = uColor;
  project_setNormal(normal);
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
}
`;

const fs = `\
precision highp float;

varying vec3 color;

void main(void) {
  gl_FragColor = vec4(color, 1.);
  gl_FragColor = dirlight_filterColor(gl_FragColor);
}
`;

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  timeline: Timeline;
  timeSlider;

  cubes: {
    translation: any[],
    rotation: any[],
    keyFrames: any[],
    model: Model
  }[];

  // @ts-expect-error animationLoop
  constructor({device, aspect, animationLoop}: AnimationProps) {
    super();

    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    this.timeSlider = document.getElementById('time');

    if (playButton) {
      playButton.addEventListener('click', () => {
        this.timeline.play();
      });

      pauseButton.addEventListener('click', () => {
        this.timeline.pause();
      });

      this.timeSlider.addEventListener('input', (event) => {
        // @ts-ignore
        this.timeline.setTime(parseFloat(event.target.value));
      });
    }

    const translations = [
      [2, -2, 0],
      [2, 2, 0],
      [-2, 2, 0],
      [-2, -2, 0]
    ];

    const rotations = [
      [random(), random(), random()],
      [random(), random(), random()],
      [random(), random(), random()],
      [random(), random(), random()]
    ];

    const colors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0]
    ];

    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();

    const channels = [
      this.timeline.addChannel({
        delay: 2000,
        rate: 0.5,
        duration: 8000,
        repeat: 2
      }),
      this.timeline.addChannel({
        delay: 10000,
        rate: 0.2,
        duration: 20000,
        repeat: 1
      }),
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

    const keyFrameData: [number, number][] = [
      [0, 0],
      [1000, 2 * Math.PI],
      [2000, Math.PI],
      [3000, 2 * Math.PI],
      [4000, 0]
    ];

    const keyFrames = [
      new KeyFrames(keyFrameData),
      new KeyFrames(keyFrameData),
      new KeyFrames(keyFrameData),
      new KeyFrames(keyFrameData)
    ];

    this.cubes = new Array(4);

    for (let i = 0; i < 4; ++i) {
      this.timeline.attachAnimation(keyFrames[i], channels[i]);

      this.cubes[i] = {
        translation: translations[i],
        rotation: rotations[i],
        // @ts-expect-error
        keyFrames: keyFrames[i],
        model: new Model(device, {
          vs,
          fs,
          modules: [dirlight],
          geometry: new CubeGeometry(),
          parameters: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal'
          },
          uniforms: {
            uProjection: new Matrix4().perspective({fov: radians(60), aspect, near: 1, far: 20.0}),
            uView: new Matrix4().lookAt({
              center: [0, 0, 0],
              eye: [0, 0, -8]
            }),
            uColor: colors[i]
          }
        })
      };
    }
  }

  onFinalize() {
    for (let i = 0; i < 4; ++i) {
      this.cubes[i].model.destroy();
    }
  }

  onRender({device}) {
    if (this.timeSlider) {
      this.timeSlider.value = this.timeline.getTime();
    }

    const modelMatrix = new Matrix4();

    // Draw the cubes
    clear(device, {color: [0, 0, 0, 1], depth: true});

    for (let i = 0; i < 4; ++i) {
      const cube = this.cubes[i];
      // @ts-expect-error
      const startRotation = cube.keyFrames.getStartData();
      // @ts-expect-error
      const endRotation = cube.keyFrames.getEndData();
      // @ts-expect-error
      const rotation = startRotation + cube.keyFrames.factor * (endRotation - startRotation);
      const rotationX = cube.rotation[0] + rotation;
      const rotationY = cube.rotation[1] + rotation;
      const rotationZ = cube.rotation[2];
      modelMatrix
        .identity()
        .translate(cube.translation)
        .rotateXYZ([rotationX, rotationY, rotationZ]);
      cube.model
        .setUniforms({
          uModel: modelMatrix
        })
        .draw();
    }
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
