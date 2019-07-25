import GL from '@luma.gl/constants';
import {AnimationLoop, Texture2D, setParameters} from '@luma.gl/core';
import {Matrix4} from 'math.gl';
import {Star} from './star';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1008" target="_blank">
    Improving the code structure with lots of moving objects
  </a>
  Up/Down/PageUp/PageDown to tilt and zoom.
<p>
The classic WebGL Lessons in luma.gl
`;

let zoom = -15;
let tilt = 90;

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({canvas, gl}) {
    /* global document */
    document.addEventListener('keydown', keyboardEventHandler);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      blendFunc: [gl.SRC_ALPHA, gl.ONE],
      blend: true
    });

    const texture = new Texture2D(gl, 'star.gif');

    const stars = [];
    const numStars = 50;
    for (let i = 0; i < numStars; i++) {
      stars.push(
        new Star(gl, {
          startingDistance: (i / numStars) * 5.0,
          rotationSpeed: i / numStars,
          texture
        })
      );
    }

    return {stars};
  }

  onRender({gl, tick, aspect, stars}) {
    // Update Camera Position
    const radTilt = (tilt / 180) * Math.PI;
    const cameraY = Math.cos(radTilt) * zoom;
    const cameraZ = Math.sin(radTilt) * zoom;

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    for (const i in stars) {
      const uMVMatrix = new Matrix4()
        .lookAt({eye: [0, cameraY, cameraZ]})
        .multiplyRight(stars[i].matrix);

      stars[i]
        .setUniforms({
          uMVMatrix,
          uPMatrix: new Matrix4().perspective({aspect})
        })
        .draw();
      stars[i].animate();
    }
  }

  onFinalize() {
    document.removeEventListener('keydown', keyboardEventHandler);
  }
}

function keyboardEventHandler(e) {
  switch (e.code) {
    case 'ArrowUp':
      tilt -= 1.5;
      break;
    case 'ArrowDown':
      tilt += 1.5;
      break;
    case 'PageUp':
      zoom -= 0.1;
      break;
    case 'PageDown':
      zoom += 0.1;
      break;
    default:
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
