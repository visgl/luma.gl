// luma.gl, MIT license

// @ts-ignore
import mapboxgl from 'mapbox-gl';
import {Model, AnimationLoop, AnimationProps} from '@luma.gl/engine';
import {Buffer} from '@luma.gl/core';
// import {Model, AnimationLoop} from '@luma.gl/engine';
import {WebGLDevice} from '@luma.gl/webgl';

const INFO_HTML = `
<p>A triangle connecting Times Square, Rockefeller Center, and Columbus Circle in Manhattan, NYC on a <a class="external-link" href="https://www.mapbox.com/">Mapbox</a> basemap using the
<a class="external-link" href="https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/">Mapbox GL JS custom layer API</a>.</p>
`;

const coordinates = [
  [-73.9819, 40.7681], // Columbus Circle
  [-73.98513, 40.758896], // Times Square
  [-73.9786, 40.7589] // Rockefeller Center
];

// Create a Mapbox custom layer
// https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/
class CustomLayer {
  id = 'lumagl-layer';
  type = 'custom';
  renderingMode = '3d';
  map: mapboxgl.Map;


  positionBuffer: Buffer;
  colorBuffer: Buffer;
  model: Model;
  
  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.map = map;

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

    const device = WebGLDevice.attach(gl);

    this.positionBuffer = device.createBuffer(new Float32Array(positions));
    this.colorBuffer = device.createBuffer(new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]));

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

  render(gl: WebGLRenderingContext, matrix) {
    // Mapbox passes us a projection matrix
    this.model
      .setUniforms({
        uPMatrix: matrix
      })
      .draw();
  }

  onRemove(): void {
    // Cleanup
    this.positionBuffer.destroy();
    this.colorBuffer.destroy();
    this.model.destroy();
  }
}

//
export default class AppAnimationLoop extends AnimationLoop {
  static info = INFO_HTML;

  map: mapboxgl.Map;

  override onInitialize(animationProps: AnimationProps) {
    let bearing = -10;
    let vb = 0.1;
    let pitch = 40;
    let vp = 0.01;

    this.map = new mapboxgl.Map({
      container: this._getContainer(animationProps),
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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

  override delete() {
    this.map.remove();
    this._removeContainer();
  }

  _getCanvas(props = {}) {
    /** @type {HTMLCanvasElement} */
    let canvas;
    // @ts-ignore
    if (props.canvas) {
      // @ts-ignore
      canvas = props.canvas; // document.getElementById(props.canvas);
      const dpr = window.devicePixelRatio || 1;
      canvas.height = canvas.clientHeight * dpr;
      canvas.width = canvas.clientWidth * dpr;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      document.body.appendChild(canvas);
    }
    
    return canvas;
  }
  
  container;
  parent;

  _getContainer(props = {}) {
    if (this.container) {
      return this.container;
    }
    
    let width;
    let height;
    
    this.container = document.createElement('div');
    
    // @ts-expect-error
    if (props.canvas) {
      // @ts-expect-error
      const canvas = props.canvas; // document.getElementById(props.canvas);
      this.parent = canvas.parentElement;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      this.container.style.position = 'relative';
      this.container.style.top = `-${height}px`;
    } else {
      this.parent = document.body;
      width = 800;
      height = 800;
    }
    
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
    this.parent.appendChild(this.container);
    
    return this.container;
  }

  _removeContainer(props = {}) {
    this.parent.removeChild(this.container);
  }
}
