import mapboxgl from 'mapbox-gl';
import { instrumentGLContext } from '@luma.gl/webgl';
import { Program, VertexArray, Buffer } from '@luma.gl/core';

const INFO_HTML = `
<style>
    body { margin: 0; overflow: hidden; }
    #map { position: absolute; left: 0; top: 0; bottom: 0; right: 0; }
</style>
MapBox Custom layer <a href="https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/">example</a>
<div id="map"></div>
`;

mapboxgl.accessToken = 'pk.eyJ1IjoiYnJhdmVjb3ciLCJhIjoiY2o1ODEwdWljMThwbTJ5bGk0a294ZmVybiJ9.kErON3w2kwEVxU5aNa-EqQ';

const polygonLngLat = [
  [25.004, 60.239], // helsinki
  [13.403, 52.562], // berlin
  [30.498, 50.541], // kyiv
];

const polygonCoordinates = [];

polygonLngLat.forEach((point) => {
  const coords = mapboxgl.MercatorCoordinate.fromLngLat(point);
  polygonCoordinates.push(coords.x);
  polygonCoordinates.push(coords.y);
});

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [7.5, 58],
  zoom: 3,
  antialias: true,
});

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

class CustomLayer {
  constructor() {
    this.id = 'custom-layer';
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(m, gl) {
    instrumentGLContext(gl);
    this.map = m;
    this.model = new Program(gl, {
      id: 'my-program',
      vs: vertexSource,
      fs: fragmentSource,
    });
  }

  render(gl, matrix) {
    const polygonVertexArray = new VertexArray(gl, {
      program: this.model,
      attributes: {
        positions: new Buffer(gl, new Float32Array(polygonCoordinates))
      }
    });

    this.model
      .setUniforms({
        uPMatrix: matrix,
      })
      .draw({
        vertexArray: polygonVertexArray,
        drawMode: gl.TRIANGLE_STRIP,
        vertexCount: polygonLngLat.length,
      });
  }
}

map.on('load', () => {
  map.addLayer(new CustomLayer());
});

// /* global window */
// if (typeof window !== 'undefined' && !window.website) {
//   const animationLoop = new AppAnimationLoop();
//   animationLoop.start();
// }
