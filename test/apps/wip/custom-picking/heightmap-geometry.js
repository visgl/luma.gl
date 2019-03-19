import {Geometry} from 'luma.gl';

const RESOLUTION = 128;

// const rowColToIndex = ([row, col]) => {
//   return row * RESOLUTION + col;
// };

// const indexToRowCol = (index) => {
//   return [Math.round(index / RESOLUTION), index % RESOLUTION];
// };

export default class HeightmapGeometry extends Geometry {
  constructor(opts) {
    super(opts);
    this._initialize();
  }

  /* eslint-disable max-statements */
  _initialize() {
    const positions = [];
    const normals = [];
    const colors = [];

    function height(x, z) {
      const d = Math.sqrt(x * x + z * z);
      return 0.5 + (Math.sin(d * 24) + Math.cos((x + 8) * 12) + Math.tanh(z * 6)) * 0.125;
    }

    const s = 1 / RESOLUTION;
    for (let i = 0; i < RESOLUTION; i++) {
      const x = s * (i - RESOLUTION / 2);
      for (let k = 0; k < RESOLUTION; k++) {
        const z = s * (k - RESOLUTION / 2);

        const h0 = height(x + 0, z + 0);
        const h1 = height(x + s, z + 0);
        const h2 = height(x + s, z + s);
        const h3 = height(x + 0, z + s);

        positions.push(x + 0, h0, z + 0);
        positions.push(x + s, h1, z + 0);
        positions.push(x + s, h2, z + s);
        positions.push(x + 0, h0, z + 0);
        positions.push(x + s, h2, z + s);
        positions.push(x + 0, h3, z + s);

        // quick-and-dirty forward difference normal approximation
        const n0 = [(h1 - h0) / s, 1.0, (h3 - h0) / s];
        const n1 = [(h0 - h1) / -s, 1.0, (h2 - h1) / s];
        const n2 = [(h1 - h2) / -s, 1.0, (h3 - h2) / -s];
        const n3 = [(h2 - h3) / s, 1.0, (h0 - h3) / -s];

        normals.push(...n0);
        normals.push(...n1);
        normals.push(...n2);
        normals.push(...n0);
        normals.push(...n2);
        normals.push(...n3);

        colors.push(h0, h0, h0, 1);
        colors.push(h1, h1, h1, 1);
        colors.push(h2, h2, h2, 1);
        colors.push(h0, h0, h0, 1);
        colors.push(h2, h2, h2, 1);
        colors.push(h3, h3, h3, 1);

        // const pickingColors(encodePickingColor);
      }
    }

    this.setAttributes({
      positions: {size: 3, value: new Float32Array(positions)},
      normals: {size: 3, value: new Float32Array(normals)},
      colors: {size: 4, value: new Float32Array(colors)},
      pickingColors: {size: 4, value: new Uint8Array(colors.map(c => c * 256))},
      // Dummy to silence shader attribute 0 warnings
      texCoords: {size: 2, value: new Float32Array(positions)}
    });
    this.setVertexCount(positions.length / 3);
  }
}
