import GL from '@luma.gl/constants';
import {AnimationLoop} from '@luma.gl/engine';
import {Texture2D, loadFile} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {Matrix4, radians} from 'math.gl';
import {loadWorldGeometry, World} from './world';
import {EventManager} from 'mjolnir.js';
/* eslint-disable complexity */

/*
  Cave texture from: http://texturelib.com/texture/?path=/Textures/rock/cave/rock_cave_0019
  "Free for personal and commercial use." http://texturelib.com/about/
*/

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

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({canvas, gl}) {
    // Use mjolnir.js (hammer.js)'s EventManager to handle gestures on both
    // desktop and mobile
    this.eventManager = new EventManager(canvas);
    addKeyboardHandler(this.eventManager);
    addMouseHandler(this.eventManager);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    const texture = new Texture2D(gl, {
      data: 'cave.jpg',
      parameters: {
        [gl.TEXTURE_WRAP_S]: gl.MIRRORED_REPEAT,
        [gl.TEXTURE_WRAP_T]: gl.MIRRORED_REPEAT
      }
    });

    return loadFile('world.txt').then(file => {
      const geometry = loadWorldGeometry(file);
      const world = new World({
        gl,
        geometry,
        texture
      });
      return {world};
    });
  }

  onRender({gl, tick, aspect, world}) {
    // Update Camera Position
    const eyePos = [cameraInfo.xPos, cameraInfo.yPos, cameraInfo.zPos];
    const centerPos = new Matrix4()
      .rotateX(radians(cameraInfo.pitch))
      .rotateY(radians(cameraInfo.yaw))
      .transform(cameraInfo.direction)
      .map((val, i) => val + eyePos[i]);

    const uMVMatrix = new Matrix4().lookAt({eye: eyePos, center: centerPos, up: [0, 1, 0]});

    handleKeys(cameraInfo, currentlyPressedKeys);
    animate(cameraInfo, timeLine);

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    return world
      .setUniforms({
        uMVMatrix,
        uPMatrix: new Matrix4().perspective({
          fov: (45 * Math.PI) / 180,
          aspect,
          near: 0.1,
          far: 100
        })
      })
      .draw();
  }

  onFinalize() {
    this.eventManager.destroy();
  }
}

function addKeyboardHandler(eventManager) {
  eventManager.on({
    keydown(e) {
      currentlyPressedKeys[e.srcEvent.code] = true;
    },
    keyup(e) {
      currentlyPressedKeys[e.srcEvent.code] = false;
    }
  });
}

function addMouseHandler(eventManager) {
  let mouseDown = false;
  let currentX = 0;
  let currentY = 0;

  eventManager.on({
    panstart(e) {
      mouseDown = true;
      currentX = e.offsetCenter.x;
      currentY = e.offsetCenter.y;
    },
    panend() {
      mouseDown = false;
    },
    panmove(e) {
      if (!mouseDown) {
        return;
      }
      const dx = e.offsetCenter.x - currentX;
      const dy = e.offsetCenter.y - currentY;
      cameraInfo.yaw += dx * 0.1;
      cameraInfo.pitch += dy * 0.1;
      currentX = e.offsetCenter.x;
      currentY = e.offsetCenter.y;
    }
  });
}

function handleKeys() {
  if (currentlyPressedKeys.PageUp || currentlyPressedKeys.Equal) {
    cameraInfo.pitchRate = 0.1;
  } else if (currentlyPressedKeys.PageDown || currentlyPressedKeys.Minus) {
    cameraInfo.pitchRate = -0.1;
  } else {
    cameraInfo.pitchRate = 0;
  }
  if (currentlyPressedKeys.ArrowLeft || currentlyPressedKeys.KeyA) {
    cameraInfo.yawRate = 0.1;
  } else if (currentlyPressedKeys.ArrowRight || currentlyPressedKeys.KeyD) {
    cameraInfo.yawRate = -0.1;
  } else {
    cameraInfo.yawRate = 0;
  }
  if (currentlyPressedKeys.ArrowUp || currentlyPressedKeys.KeyW) {
    cameraInfo.speed = 0.003;
  } else if (currentlyPressedKeys.ArrowDown || currentlyPressedKeys.KeyS) {
    cameraInfo.speed = -0.003;
  } else {
    cameraInfo.speed = 0;
  }
}

function animate() {
  const timeNow = new Date().getTime();
  if (timeLine.lastTime !== 0) {
    const elapsed = timeNow - timeLine.lastTime;
    if (cameraInfo.speed !== 0) {
      cameraInfo.xPos -= Math.sin(radians(cameraInfo.yaw)) * cameraInfo.speed * elapsed;
      cameraInfo.zPos -= Math.cos(radians(cameraInfo.yaw)) * cameraInfo.speed * elapsed;
      cameraInfo.joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - feel more realistic :-)
      cameraInfo.yPos = Math.sin(radians(cameraInfo.joggingAngle)) / 20 + 0.4;
    }
    cameraInfo.yaw += cameraInfo.yawRate * elapsed;
    cameraInfo.pitch += cameraInfo.pitchRate * elapsed;
  }
  timeLine.lastTime = timeNow;
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
