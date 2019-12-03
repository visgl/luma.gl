/* global document */
import mapboxgl from 'mapbox-gl';
import {instrumentGLContext} from '@luma.gl/gltools';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';
import {MiniAnimationLoop} from '../../utils';

const INFO_HTML = `
<style>
    body { margin: 0; overflow: hidden; }
    #map { position: absolute; left: 0; top: 0; bottom: 0; right: 0; }
</style>
MapBox Custom layer <a href="https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/">example</a>
<div id="map"></div>
`;

mapboxgl.accessToken =
  'pk.eyJ1IjoiYnJhdmVjb3ciLCJhIjoiY2o1ODEwdWljMThwbTJ5bGk0a294ZmVybiJ9.kErON3w2kwEVxU5aNa-EqQ';

const vertexSource = `
    attribute vec2 positions;
    uniform mat4 uPMatrix;
    void main() {
        gl_Position = uPMatrix * vec4(positions, 0, 1.0);
    }
`;

const fragmentSource = `
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
    }
`;

const polygonLngLat = [
  [25.004, 60.239], // helsinki
  [13.403, 52.562], // berlin
  [30.498, 50.541] // kyiv
];

const polygonCoordinates = [];

polygonLngLat.forEach(point => {
  const coords = mapboxgl.MercatorCoordinate.fromLngLat(point);
  polygonCoordinates.push(coords.x);
  polygonCoordinates.push(coords.y);
});

class CustomLayer {
  constructor() {
    this.id = 'custom-layer';
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(m, gl) {
    instrumentGLContext(gl);
    this.map = m;
    this.model = new Model(gl, {
      id: 'my-program',
      vs: vertexSource,
      fs: fragmentSource,
      attributes: {
        positions: new Buffer(gl, new Float32Array(polygonCoordinates))
      },
      vertexCount: 3
    });
  }

  render(gl, matrix) {
    this.model
      .setUniforms({
        uPMatrix: matrix
      })
      .draw();
  }

  onRemove() {
    this.model.delete();
  }
}

export default class AppAnimationLoop extends MiniAnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  start(props) {
    this.container = document.createElement('div');
    this.container.id = 'map';
    this.container.style.width = '800px';
    this.container.style.height = '600px';
    document.body.appendChild(this.container);

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [7.5, 58],
      zoom: 3,
      antialias: true
    });

    this.map.on('load', () => {
      this.map.addLayer(new CustomLayer());
    });
  }

  delete() {
    this.map.remove();
    document.body.removeChild(this.container);
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
