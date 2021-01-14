import mapboxgl from 'mapbox-gl';
import {instrumentGLContext} from '@luma.gl/gltools';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';
import {MiniAnimationLoop} from '../../utils';

const INFO_HTML = `
<p>A triangle connecting Times Square, Rockafeller Center, and Columbus Circle in Manhattan, NYC on a <a class="external-link" href="https://www.mapbox.com/">Mapbox</a> basemap using the
<a class="external-link" href="https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/">Mapbox GL JS custom layer API</a>.</p>
`;

mapboxgl.accessToken = process.env.MapboxAccessToken; // eslint-disable-line

const coordinates = [
  [-73.9819, 40.7681], // Columbus Circle
  [-73.98513, 40.758896], // Times Square
  [-73.9786, 40.7589] // Rockafeller Center
];

// Create a Mapbox custom layer
// https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/
class CustomLayer {
  constructor() {
    this.id = 'lumagl-layer';
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(m, gl) {
    instrumentGLContext(gl);
    this.map = m;

    const vertexSource = `
        attribute vec2 positions;
        attribute vec3 colors;

        uniform mat4 uPMatrix;

        varying vec3 vColor;

        void main() {
            vColor = colors;
            gl_Position = uPMatrix * vec4(positions, 0, 1.0);
        }
    `;

    const fragmentSource = `
        varying vec3 vColor;

        void main() {
            gl_FragColor = vec4(vColor, 0.5);
        }
    `;

    const positions = new Float32Array(6);

    coordinates.forEach((point, i) => {
      const coords = mapboxgl.MercatorCoordinate.fromLngLat(point);
      positions[i * 2] = coords.x;
      positions[i * 2 + 1] = coords.y;
    });

    this.positionBuffer = new Buffer(gl, new Float32Array(positions));
    this.colorBuffer = new Buffer(
      gl,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0])
    );

    // Model to draw a triangle on the map
    this.model = new Model(gl, {
      id: 'my-program',
      vs: vertexSource,
      fs: fragmentSource,
      attributes: {
        positions: this.positionBuffer,
        colors: this.colorBuffer
      },
      vertexCount: 3
    });
  }

  render(gl, matrix) {
    // Mapbox passes us a projection matrix
    this.model
      .setUniforms({
        uPMatrix: matrix
      })
      .draw();
  }

  onRemove() {
    // Cleanup
    this.positionBuffer.delete();
    this.colorBuffer.delete();
    this.model.delete();
  }
}

//
export default class AppAnimationLoop extends MiniAnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  start(props) {
    let bearing = -10;
    let vb = 0.1;
    let pitch = 40;
    let vp = 0.01;

    this.map = new mapboxgl.Map({
      container: this._getContainer(props),
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [-73.98213, 40.762896],
      zoom: 14,
      pitch,
      bearing,
      antialias: true
    });

    this.map.on('load', () => {
      this.map.addLayer(new CustomLayer());
    });

    let loopHandle = null;

    const loop = () => {
      bearing += vb;
      pitch += vp;

      if (Math.abs(bearing) > 90) {
        vb *= -1;
      }

      if (pitch > 50 || pitch < 30) {
        vp *= -1;
      }

      this.map.setBearing(bearing);
      this.map.setPitch(pitch);
      loopHandle = window.requestAnimationFrame(loop);
    };

    loopHandle = window.requestAnimationFrame(loop);

    this.map.on('mousedown', () => {
      window.cancelAnimationFrame(loopHandle);
    });
  }

  delete() {
    this.map.remove();
    this._removeContainer();
  }
}

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
