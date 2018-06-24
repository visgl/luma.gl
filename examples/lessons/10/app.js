import GL from 'luma.gl/constants';
import {addEvents} from 'luma.gl/addons';
import {AnimationLoop, loadTextures, loadFile, setParameters} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';
import {loadWorldGeometry, World} from './world';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1067" target="_blank">
    Loading a world, and the most basic kind of camera
  </a>

  </br>
  </br>
  Use the cursor keys or WASD to run around, and <code>+</code>/<code>-</code> to look up and down.
<p>
The classic WebGL Lessons in luma.gl
`;

const cameraInfo = {
  pitch: 0,
  pitchRate: 0,
  yaw: 0,
  yawRate: 0,
  xPos: 0,
  yPos: 0.4,
  zPos: 0,
  speed: 0,
  joggingAngle: 0, // Used to make us "jog" up and down as we move forward.
  direction: [0, 0, -1]
};

const timeLine = {
  lastTime: 0
};

const currentlyPressedKeys = {};

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addKeyboardHandler(canvas, currentlyPressedKeys);

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
        const geometry = loadWorldGeometry(file);
        const world = new World({
          gl,
          texture: textures[0],
          geometry
        });
        return {world};
      });
    });
  },

  onRender: ({gl, tick, aspect, world}) => {
    // Update Camera Position
    const eyePos = [cameraInfo.xPos, cameraInfo.yPos, cameraInfo.zPos];
    const centerPos = new Matrix4()
      .rotateX(radians(cameraInfo.pitch))
      .rotateY(radians(cameraInfo.yaw))
      .transformVector3(cameraInfo.direction)
      .add(eyePos);

    const uMVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: centerPos, up:[0, 1, 0]});

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    world.render({
      uMVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });
    handleKeys(cameraInfo, currentlyPressedKeys);
    animate(cameraInfo, timeLine);
  }
});

animationLoop.getInfo = () => INFO_HTML;

function addKeyboardHandler(canvas, currentlyPressedKeys) {
  addEvents(canvas, {
    onKeyDown(e) {
      currentlyPressedKeys[e.code] = true;
    },
    onKeyUp(e) {
      currentlyPressedKeys[e.code] = false;
    }
  });
}

function handleKeys(cameraInfo, currentlyPressedKeys) {
  if (currentlyPressedKeys[33] || currentlyPressedKeys[187]) { // Page Up
    cameraInfo.pitchRate = 0.1;
  } else if (currentlyPressedKeys[34] || currentlyPressedKeys[189]) { // Page Down
    cameraInfo.pitchRate = -0.1;
  } else {
    cameraInfo.pitchRate = 0;
  }
  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) { // Left cursor key or A
    cameraInfo.yawRate = 0.1;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) { // Right cursor key or D
    cameraInfo.yawRate = -0.1;
  } else {
    cameraInfo.yawRate = 0;
  }
  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) { // Up cursor key or W
    cameraInfo.speed = 0.003;
  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) { // Down cursor key
    cameraInfo.speed = -0.003;
  } else {
    cameraInfo.speed = 0;
  }
}

function animate(cameraInfo, timeLine) {
  const timeNow = new Date().getTime();
  if (timeLine.lastTime !== 0) {
    const elapsed = timeNow - timeLine.lastTime;
    if (cameraInfo.speed !== 0) {
      cameraInfo.xPos -= Math.sin(radians(cameraInfo.yaw)) * cameraInfo.speed * elapsed;
      cameraInfo.zPos -= Math.cos(radians(cameraInfo.yaw)) * cameraInfo.speed * elapsed;
      cameraInfo.joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - feel more realistic :-)
      cameraInfo.yPos = Math.sin(radians(cameraInfo.joggingAngle)) / 20 + 0.4
    }
    cameraInfo.yaw += cameraInfo.yawRate * elapsed;
    cameraInfo.pitch += cameraInfo.pitchRate * elapsed;
  }
  timeLine.lastTime = timeNow;
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
