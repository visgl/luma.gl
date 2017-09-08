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

var pitch = 0;
var pitchRate = 0;
var yaw = 0;
var yawRate = 0;
var xPos = 0;
var yPos = 0.4;
var zPos = 0;
var speed = 0;
var direction = [0, 0, -1];

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
        var geometry = loadWorldGeometry(file);
        var world = new World({
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
    const eyePos = [xPos, yPos, zPos];
    const centerPos = new Matrix4()
      .identity()
      .rotateX(degToRad(pitch))
      .rotateY(degToRad(yaw))
      .transformVector3(direction)
      .add(eyePos);
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    var uMVMatrix = new Matrix4()
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
    <a href="http://learningwebgl.com/blog/?p=1008" target="_blank">
      Improving the code structure with lots of moving objects
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
};

function degToRad(degree) {
  return degree / 180 * Math.PI;
}

var currentlyPressedKeys = {};

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
      pitchRate = 0.1;
  } else if (currentlyPressedKeys[34]) {
      // Page Down
      pitchRate = -0.1;
  } else {
      pitchRate = 0;
  }
  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
      yawRate = 0.1;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
      yawRate = -0.1;
  } else {
      yawRate = 0;
  }
  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
      // Up cursor key or W
      speed = 0.003;
  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
      // Down cursor key
      speed = -0.003;
  } else {
      speed = 0;
  }
}

var lastTime = 0;
// Used to make us "jog" up and down as we move forward.
var joggingAngle = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        if (speed != 0) {
            xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
            zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;
            joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
            yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
        }
        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;
    }
    lastTime = timeNow;
}

export default animationLoop;

// expose on Window for standalone example
window.animationLoop = animationLoop; // eslint-disable-lie

