import {Program, Geometry, Model, Vec3} from 'luma.gl';

export default class Star extends Model {
  constructor(gl, {startingDistance, rotationSpeed}) {
    const program = new Program(gl, {fs: `\
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;

uniform bool hasTexture1;
uniform sampler2D sampler1;
uniform vec3 uColor;

void main(){
  if (hasTexture1) {
    gl_FragColor = vec4(texture2D(sampler1,
      vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0) *
      vec4(uColor, 1.0);
  }
}
`});

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
        hasTexture1: true,
        sampler1: tStar
      },
      onBeforeRender() {
        var min = Math.min;
        var isTwinkle = twinkle.checked;
        var r = isTwinkle ? min(1, this.r + this.twinklerR) : this.r;
        var g = isTwinkle ? min(1, this.g + this.twinklerG) : this.g;
        var b = isTwinkle ? min(1, this.b + this.twinklerB) : this.b;
        this.setUniforms({uColor: [r, g, b]});
      }
    });

    this.angle = 0;
    this.dist = startingDistance;
    this.rotationSpeed = rotationSpeed;
    this.spin = 0;

    this.randomiseColors();
  }

  randomiseColors() {
    var rd = Math.random;

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

    // update position
    this.position.set(
      Math.cos(this.angle) * this.dist,
      Math.sin(this.angle) * this.dist,
      0
    );
    this.setRotation(new Vec3(0, 0, this.spin));
    this.spin += 0.1;
    this.updateMatrix();
  }
}
