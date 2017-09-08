/* eslint-disable no-var, max-statements */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
/* global document */
import {
  GL, AnimationLoop, loadTextures, loadFile, addEvents,
  resetParameters, setParameters
} from 'luma.gl';

import {
  Matrix4
} from 'math.gl'

import {loadWorldGeometry, World} from './world';

const cameraInfo = {
  pitch: 0,
  pitchRate: 0,
  yaw: 0,
  yawRate: 0,
  xPos: 0,
  yPos: 0.4,
  zPos: 0,
  speed: 0,
  direction: [0, 0, -1]
};

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addKeyboardHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    return loadTextures(gl, {
      urls: ['mud.gif']
    })
    .then(textures => {
      return loadFile({url: 'world.txt'})
      .then(file => {
        let geometry = loadWorldGeometry(file);
        let world = new World({
          gl,
          texture: textures[0],
          geometry});
        return {world};
      });
    });
  },
  onRender: ({
    gl, tick, aspect, world
  }) => {
    // Update Camera Position
    const eyePos = [cameraInfo.xPos, cameraInfo.yPos, cameraInfo.zPos];
    const centerPos = new Matrix4()
      .rotateX(degToRad(cameraInfo.pitch))
      .rotateY(degToRad(cameraInfo.yaw))
      .transformVector3(cameraInfo.direction)
      .add(eyePos);
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    let uMVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: centerPos, up:[0, 1, 0]})

    world.render({
      uMVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });
    handleKeys();
    animate();
  }
});

animationLoop.getInfo = () => {
  return `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1067" target="_blank">
      Improving the code structure with lots of moving objects
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
};

function degToRad(degree) {
  return degree / 180 * Math.PI;
}

let currentlyPressedKeys = {};

function addKeyboardHandler(canvas) {
  addEvents(canvas, {
    onKeyDown(e) {
      currentlyPressedKeys[e.code] = true;
    },
    onKeyUp(e) {
      currentlyPressedKeys[e.code] = false;
    }
  });
}

function handleKeys() {
  if (currentlyPressedKeys[33]) {
      // Page Up
    cameraInfo.pitchRate = 0.1;
  } else if (currentlyPressedKeys[34]) {
      // Page Down
    cameraInfo.pitchRate = -0.1;
  } else {
    cameraInfo.pitchRate = 0;
  }
  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
    cameraInfo.yawRate = 0.1;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
    cameraInfo.yawRate = -0.1;
  } else {
    cameraInfo.yawRate = 0;
  }
  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
      // Up cursor key or W
    cameraInfo.speed = 0.003;
  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
      // Down cursor key
    cameraInfo.speed = -0.003;
  } else {
    cameraInfo.speed = 0;
  }
}

let lastTime = 0;
// Used to make us "jog" up and down as we move forward.
let joggingAngle = 0;

function animate() {
    let timeNow = new Date().getTime();
    if (lastTime != 0) {
        let elapsed = timeNow - lastTime;
        if (cameraInfo.speed != 0) {
          cameraInfo.xPos -= Math.sin(degToRad(cameraInfo.yaw)) * cameraInfo.speed * elapsed;
          cameraInfo.zPos -= Math.cos(degToRad(cameraInfo.yaw)) * cameraInfo.speed * elapsed;
          cameraInfo.joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
          cameraInfo.yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
        }
        cameraInfo.yaw += cameraInfo.yawRate * elapsed;
        cameraInfo.pitch += cameraInfo.pitchRate * elapsed;
    }
    lastTime = timeNow;
}

export default animationLoop;

// expose on Window for standalone example
window.animationLoop = animationLoop; // eslint-disable-lie
