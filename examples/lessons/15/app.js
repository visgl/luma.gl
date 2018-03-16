import {
  GL, AnimationLoop, Model, Geometry, loadTextures, loadFiles, Vector3, setParameters, Program
} from 'luma.gl';

import {Matrix4, radians} from 'math.gl';

const FRAGMENT_LIGHTING_VERTEX_SHADER = `\
precision highp float;

attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

void main(void) {
  vPosition = uMMatrix * vec4(positions, 1.0);
  gl_Position = uPMatrix * uVMatrix * vPosition;
  vTextureCoord = texCoords;
  vTransformedNormal = uMMatrix * vec4(normals, 0.0);
}
`;

const FRAGMENT_LIGHTING_FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform bool uUseColorMap;
uniform bool uUserSpecularMap;
uniform bool uUseLighting;
uniform vec3 uAmbientColor;
uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingSpecularColor;
uniform vec3 uPointLightingDiffuseColor;

uniform sampler2D uSpecularMapSampler;
uniform smapler2D uColorMapSampler;

void main(void) {
    vec3 lightWeighting;
    if (!uUseLighting) {
        lightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
        vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
        vec3 normal = normalize(vTransformedNormal.xyz);
        float specularLightWeighting = 0.0;
        float shininess = 32.0;
        if (uUseSpecularMap) {
          shininess = texture2D(uSpecularMapSampler, vec2(vTextureCoord.s, vTextureCoord.t)).r * 255.0;
        }
        if (shininess < 255.0) {
            vec3 eyeDirection = normalize(-vPosition.xyz);
            vec3 reflectionDirection = reflect(-lightDirection, normal);
            specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);
        }
        float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);
        lightWeighting = uAmbientColor
            + uPointLightingSpecularColor * specularLightWeighting
            + uPointLightingDiffuseColor * diffuseLightWeighting;
    }
    vec4 fragmentColor;
    if (uUseTextures) {
        fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    } else {
        fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
`;

function getTeapotUniforms() {
  return {
    uMaterialShininess: 20.0,
    uShowSpecularHighlights: true,
    uUseLighting: true,
    uUseTextures: true
  };
}

function getLightUniforms() {
  return {
    uAmbientColor: [0.2, 0.2, 0.2],
    uPointLightingLocation: [-10.0, 4.0, -20.0],
    uPointLightingSpecularColor: [0.8, 0.8, 0.8],
    uPointLightingDiffuseColor: [0.8, 0.8, 0.8]
  };
}
const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      [GL.UNPACK_FLIP_Y_WEBGL]: true
    });

    return loadFiles({
      urls: ['Teapot.json']
    }).then(files => {
      return loadTextures(gl, {
        urls: ['arroway.de_metal+structure+06_d100_flat.jpg', 'earth.jpg'],
        parameters: [{
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
          [gl.TEXTURE_WRAP_S]: gl.REPEAT,
          [gl.TEXTURE_WRAP_T]: gl.REPEAT,
          mipmap: true
        }, {
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
          [gl.TEXTURE_WRAP_S]: gl.REPEAT,
          [gl.TEXTURE_WRAP_T]: gl.REPEAT,
          mipmap: true
        }]
      })
      .then(textures => {
        const galvanizedTexture = textures[0];
        const earthTexture = textures[1];
        const teapotJson = JSON.parse(files[0]);

        const fragmentLightingProgram = new Program(gl, {
          fs: FRAGMENT_LIGHTING_FRAGMENT_SHADER,
          vs: FRAGMENT_LIGHTING_VERTEX_SHADER,
        });

        const teapot = new Model(gl, {
          id: 'teapot-model',
          program: fragmentLightingProgram,
          geometry: new Geometry({
            id: 'teapot-geometry',
            attributes: {
              positions: new Float32Array(teapotJson.positions),
              normals: new Float32Array(teapotJson.normals),
              texCoords: new Float32Array(teapotJson.texCoords),
              indices: new Uint16Array(teapotJson.indices)
            },
            drawMode: GL.TRIANGLES
          }),
          uniforms: Object.assign(
            {uSampler: galvanizedTexture},
            getTeapotUniforms(),
            getLightUniforms()
          )
        });
        return {teapot, earthTexture, galvanizedTexture, fragmentLightingProgram}
      });
    });
  },
  onRender: ({
     gl, tick, aspect, teapot, earthTexture, galvanizedTexture
  }) => {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // set camera position
    const eyePos = new Matrix4()
      .rotateX(radians(-30))
      .transformVector3([0, 0, 5]);

    let uVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: [0, 0, 0], up:[0, 1, 0]});

    const {
      specular,
      lighting,
      texture,
      shininess,
      point,
      ambient
    } = getControls();
    const useLighting = lighting.checked;
    const useSpecular = specular.checked;
    const useTextures = (texture.value !== 'none');
    const materialShininess= shininess.value;

    teapot.setUniforms({
      uUseLighting: useLighting,
      uUseTextures: useTextures,
      uShowSpecularHighlights: useSpecular,
      uMaterialShininess: materialShininess
    });

    if (useLighting) {
      const ambientColor = parseRGB(ambient);
      const pointLightingLocation = parseXYZ(point.position);
      const pointLightSpecularColor = parseRGB(point.specular);
      const pointLightingDiffuseColor = parseRGB(point.diffuse);

      teapot.setUniforms({
        uAmbientColor: ambientColor,
        uPointLightingLocation: pointLightingLocation,
        uPointLightingSpecularColor: pointLightSpecularColor,
        uPointLightingDiffuseColor: pointLightingDiffuseColor
      });
    }

    if (useTextures) {
      const selectedTexture = texture.value;
      teapot.setUniforms({
        uSampler: selectedTexture === 'earth' ? earthTexture : galvanizedTexture
      });
    }

    const phi = tick * 0.01;
    teapot.render({
      uMMatrix: new Matrix4().translate([0, -35, -68]).rotateY(phi),
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });
  }
});

animationLoop.getInfo = () => {
  return `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1658" target="_blank">
    specular highlights and loading a JSON model
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
};

function parseValue(value) {
  let parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

function parseRGB({r, g, b}) {
  return [parseValue(r.value), parseValue(g.value), parseValue(b.value)];
}

function parseXYZ({x, y, z}) {
  return [parseValue(x.value), parseValue(y.value), parseValue(z.value)];
}

function getControls() {
  // Lighting form elements variables
  const $id = function (d) {
    return document.getElementById(d);
  };

  // Get lighting form elements
  const specular = $id('specular');
  const lighting = $id('lighting');
  const texture = $id('texture');
  const shininess =  $id('shininess');

  const point = {
    position: {
      x: $id('lightPositionX'),
      y: $id('lightPositionY'),
      z: $id('lightPositionZ')
    },
    specular: {
      r: $id('specularR'),
      g: $id('specularG'),
      b: $id('specularB')
    },
    diffuse: {
      r: $id('diffuseR'),
      g: $id('diffuseG'),
      b: $id('diffuseB')
    }
  };

  const ambient = {
    r: $id('ambientR'),
    g: $id('ambientG'),
    b: $id('ambientB')
  };

  return {
    specular,
    lighting,
    texture,
    shininess,
    point,
    ambient
  }
}

export default animationLoop;
// expose on Window for standalone example
window.animationLoop = animationLoop;