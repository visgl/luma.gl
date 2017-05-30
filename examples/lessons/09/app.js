/* eslint-disable no-var, max-statements */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
/* global document */
import {AnimationLoop, loadTextures, PerspectiveCamera, Group, addEvents} from 'luma.gl';
import {Star} from './star';

var tStar;
var twinkle = $id('twinkle');

var zoom = -15;
var tilt = 90;

const animationLoop = new AnimationLoop({
  // var canvas = document.getElementById('lesson09-canvas');
  // canvas.width = canvas.clientWidth;
  // canvas.height = canvas.clientHeight;
  // var gl = createGLContext({canvas});

  onInitialize: ({gl, canvas}) => {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    var scene = new Group(gl);

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

    loadTextures(gl, {
      urls: ['star.gif'],
      mipmap: true,
      parameters: [{
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }]
    })
    .then(textures => {
      tStar = textures[0];

      // Load all world objects
      var numStars = 50;
      for (var i = 0; i < numStars; i++) {
        scene.add(new Star(i / numStars * 5.0, i / numStars));
      }
    });
  },
  onRender() {
    var camera = new PerspectiveCamera({
      aspect: canvas.width / canvas.height
    });

    // Update Camera Position
    var radTilt = tilt / 180 * Math.PI;
    camera.position.set(0, Math.cos(radTilt) * zoom,
                           Math.sin(radTilt) * zoom);
    camera.update();
    // Render all elements in the Scene
    scene.render({camera});

    scene.children.forEach(function(star) {
      star.animate();
    });
  }
});

export default animationLoop;
