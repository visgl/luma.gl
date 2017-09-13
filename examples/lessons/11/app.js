import {
  GL, AnimationLoop, loadTextures, addEvents, Vector3, setParameters, Sphere
} from 'luma.gl';

import {
  Matrix4
} from 'math.gl'

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

uniform bool uUseLighting;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(positions, 1.0);
    vTextureCoord = texCoords;

    if (!uUseLighting) {
        vLightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
        vec4 transformedNormal = uMMatrix * vec4(normals, 1.0);
        vec3 newNormal = transformedNormal.xyz / transformedNormal.w;
        float directionalLightWeighting = max(dot(newNormal, uLightingDirection), 0.0);
        vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
    }
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;

void main(void) {
  vec4 textureColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, 1.0 - vTextureCoord.t));
  gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
}
`;

const mouseMovement = {
  mouseDown: false,
  lastMouseX: null,
  lastMouseY: null
};

const moonRotation = {
  matrix: new Matrix4()
};

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addMouseHandler(canvas, mouseMovement, moonRotation);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    return loadTextures(gl, {
      urls: ['moon.gif']
    })
    .then(textures => {
      let moon = new Sphere(gl, {
        fs: FRAGMENT_SHADER,
        vs: VERTEX_SHADER,
        uniforms: {
          uSampler: textures[0]
        },
        nlat: 30,
        nlong: 30,
        radius: 2,
      });
      return {moon};
    });
  },
  onRender: ({
    gl, tick, aspect, moon
  }) => {
    // Update Camera Position
    const eyePos = [0, 0, 6];

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    let uMMatrix = new Matrix4()
      .multiplyRight(moonRotation.matrix);
    let uVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: [0, 0, 0], up:[0, 1, 0]});

    let lighting = document.getElementById("lighting").checked;

    moon.setUniforms({uUseLighting: lighting});

    if (lighting) {
      let ambientColor = new Vector3(
        parseFloat(document.getElementById("ambientR").value),
        parseFloat(document.getElementById("ambientG").value),
        parseFloat(document.getElementById("ambientB").value)
      );

      let lightingDirection = new Vector3(
        parseFloat(document.getElementById("lightDirectionX").value),
        parseFloat(document.getElementById("lightDirectionY").value),
        parseFloat(document.getElementById("lightDirectionZ").value)
      );
      lightingDirection.normalize();
      lightingDirection.scale(-1);

      let directionalColor = new Vector3(
        parseFloat(document.getElementById("directionalR").value),
        parseFloat(document.getElementById("directionalG").value),
        parseFloat(document.getElementById("directionalB").value)
      );

      moon.setUniforms({
        uAmbientColor: ambientColor,
        uLightingDirection: lightingDirection,
        uDirectionalColor: directionalColor
      });
    }

    moon.render({
      uMMatrix,
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });
  }
});

animationLoop.getInfo = () => {
  return `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1253" target="_blank">
    Spheres, rotation matrices, and mouse events
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
};

function degToRad(degree) {
  return degree / 180 * Math.PI;
}

function addMouseHandler(canvas, mouseMovement, moonRotation) {
  addEvents(canvas, {
    onDragStart(e) {
      mouseMovement.mouseDown = true;
      mouseMovement.lastMouseX = event.clientX;
      mouseMovement.lastMouseY = event.clientY;
    },
    onDragMove(e) {
      if (!mouseMovement.mouseDown) {
        return;
      }
      let newX = event.clientX;
      let newY = event.clientY;

      let deltaX = newX - mouseMovement.lastMouseX
      let deltaY = newY - mouseMovement.lastMouseY;

      let newMatrix = new Matrix4()
        .rotateX(degToRad(deltaY / 10))
        .rotateY(degToRad(deltaX / 10));

      moonRotation.matrix.multiplyLeft(newMatrix);

      mouseMovement.lastMouseX = newX
      mouseMovement.lastMouseY = newY;
    },
    onDragEnd(e) {
      mouseMovement.mouseDown = false;
    }
  });
}

export default animationLoop;

// expose on Window for standalone example
window.animationLoop = animationLoop;
