import {Program, Geometry, Model} from 'luma.gl';

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec2 texCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vTextureCoord = texCoords;
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec3 uColor;

void main(void) {
  vec4 textureColor = vec4(texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgb, 1.0);
  gl_FragColor = textureColor * vec4(uColor, 1.0);
}
`;

export class Star extends Model {
  constructor(opts = {}) {
    const program = new Program(opts.gl, {
      fs: FRAGMENT_SHADER,
      vs: VERTEX_SHADER
    });

    super({
      program,
      geometry: new Geometry({
        positions: new Float32Array([
          -1.0, -1.0, 0.0,
          1.0, -1.0, 0.0,
          -1.0, 1.0, 0.0,
          1.0, 1.0, 0.0
        ]),
        texCoords: new Float32Array([
          0.0, 0.0,
          1.0, 0.0,
          0.0, 1.0,
          1.0, 1.0
        ]),
        indices: new Uint16Array([0, 1, 3, 3, 2, 0])
      }),
      uniforms: {
        uSampler: opts.texture
      },
      onBeforeRender() {
        // TODO: Fix this so user can control this with a check-box
        const isTwinkle = false; // twinkle.checked;
        const r = isTwinkle ? Math.min(1, this.r + this.twinklerR) : this.r;
        const g = isTwinkle ? Math.min(1, this.g + this.twinklerG) : this.g;
        const b = isTwinkle ? Math.min(1, this.b + this.twinklerB) : this.b;
        this.setUniforms({uColor: [r, g, b]});
      }
    });

    this.angle = 0;
    this.dist = opts.startingDistance;
    this.rotationSpeed = opts.rotationSpeed;
    this.spin = 0;

    this.randomiseColors();
  }

  randomiseColors() {
    const rd = Math.random;

    this.r = rd();
    this.g = rd();
    this.b = rd();

    this.twinklerR = rd();
    this.twinklerG = rd();
    this.twinklerB = rd();
  }

  animate(elapsedTime, twinkle) {
    this.angle += this.rotationSpeed / 10;
    this.dist -= 0.001;

    if (this.dist < 0) {
      this.dist += 5;
      this.randomiseColors();
    }

    this.position.set(
      Math.cos(this.angle) * this.dist,
      Math.sin(this.angle) * this.dist,
      0
    );
    this.setRotation([0, 0, this.spin]);
    this.spin += 0.1;
    this.updateMatrix();
  }
}
