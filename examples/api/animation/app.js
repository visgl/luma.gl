import {AnimationLoop, CubeGeometry, Timeline, KeyFrames, Model} from '@luma.gl/engine';
import {setParameters} from '@luma.gl/gltools';
import {dirlight} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {getRandom} from '../../utils';

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

export default class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({debug: true});
  }

  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl, _animationLoop, aspect}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    const timeSlider = document.getElementById('time');

    if (playButton) {
      playButton.addEventListener('click', () => {
        this.timeline.play();
      });

      pauseButton.addEventListener('click', () => {
        this.timeline.pause();
      });

      timeSlider.addEventListener('input', (event) => {
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

    this.attachTimeline(new Timeline());
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

    const keyFrameData = [
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
        keyFrames: keyFrames[i],
        model: new Model(gl, {
          vs,
          fs,
          modules: [dirlight],
          geometry: new CubeGeometry(),
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

    return {timeSlider};
  }

  onRender(animationProps) {
    const {gl, timeSlider} = animationProps;

    if (timeSlider) {
      timeSlider.value = this.timeline.getTime();
    }

    const modelMatrix = new Matrix4();

    // Draw the cubes
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < 4; ++i) {
      const cube = this.cubes[i];
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
      cube.model
        .setUniforms({
          uModel: modelMatrix
        })
        .draw();
    }
  }

  onFinalize({gl}) {
    for (let i = 0; i < 4; ++i) {
      this.cubes[i].model.delete();
    }
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
