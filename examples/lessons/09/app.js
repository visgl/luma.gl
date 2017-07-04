/* eslint-disable no-var, max-statements */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
/* global document */
import {
  GL, AnimationLoop, loadTextures, addEvents, Matrix4,
  resetParameters, setParameters
} from 'luma.gl';
import {Star} from './star';

var zoom = -15;
var tilt = 90;

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addControls();
    addKeyboardHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      blendFunc: [gl.SRC_ALPHA, gl.ONE],
      blend: true
    });

    return loadTextures(gl, {
      urls: ['star.gif']
    })
    .then(textures => {
      var stars = [];
      var numStars = 50;
      for (var i = 0; i < numStars; i++) {
        stars.push(new Star({
          gl,
          startingDistance: ((i / numStars) * 5.0),
          rotationSpeed: (i / numStars),
          texture: textures[0]
        }));
      }
      return {stars};
    });
  },
  onRender: ({
    gl, tick, aspect, stars
  }) => {
    // Update Camera Position
    const radTilt = tilt / 180 * Math.PI;
    const cameraY = Math.cos(radTilt) * zoom;
    const cameraZ = Math.sin(radTilt) * zoom;

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    for (var i in stars) {
      var uMVMatrix = new Matrix4()
        .lookAt({eye: [0, cameraY, cameraZ]})
        .multiplyRight(stars[i].matrix);

      stars[i].render({
        uMVMatrix,
        uPMatrix: new Matrix4().perspective({aspect})
      });
      stars[i].animate();
    }
  }
});

function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1008" target="_blank">
      Improving the code structure with lots of moving objects
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

function addKeyboardHandler(canvas) {

  addEvents(canvas, {
    onKeyDown(e) {
      switch (e.key) {
      case 'up':
        tilt -= 1.5;
        break;
      case 'down':
        tilt += 1.5;
        break;
      // handle page up/down
      default:
        if (e.code === 33) {
          zoom -= 0.1;
        } else if (e.code === 34) {
          zoom += 0.1;
        }
      }
    }
  });
}

export default animationLoop;
