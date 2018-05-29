import {GL, AnimationLoop, Sphere, loadTextures, setParameters} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1778" target="_blank">
    Specular maps
  </a>

<div id="controls-elements">
  <input type="checkbox" id="color-map" checked/> Use color map<br/>
  <input type="checkbox" id="specular-map" checked/> Use specular map<br/>
  <input type="checkbox" id="lighting" checked/> Use lighting<br/>

  <br/>
  <h2>Point light:</h2>

  <div class="control-block">
    <div class="control-row">
      <div><b>Location:</b></div>
      <div>X: <input type="text" id="lightPositionX" value="-10.0"/></div>
      <div>Y: <input type="text" id="lightPositionY" value="4.0"/></div>
      <div>Z: <input type="text" id="lightPositionZ" value="-20.0"/></div>
    </div>
    <div class="control-row">
      <div><b>Specular colour:</b></div>
      <div>R:
        <input id="specularR" type="range" value="0.8" min="0.0" max="1.0" step="0.01"/>
      </div>
      <div>G:
        <input id="specularG" type="range" value="0.8" min="0.0" max="1.0" step="0.01"/>
      </div>
      <div>B:
        <input id="specularB" type="range" value="0.8" min="0.0" max="1.0" step="0.01"/>
      </div>
    </div>
    <div class="control-row">
      <div><b>Diffuse colour:</b></div>
      <div>R:
        <input id="diffuseR" type="range" value="0.8" min="0.0" max="1.0" step="0.01"/>
      </div>
      <div>G:
        <input id="diffuseG" type="range" value="0.8" min="0.0" max="1.0" step="0.01"/>
      </div>
      <div>B:
        <input id="diffuseB" type="range" value="0.8" min="0.0" max="1.0" step="0.01"/>
      </div>
    </div>
  </div>

  <h2>Ambient light:</h2>
  <div class="control-block">
    <div class="control-row">
      <div><b>Colour:</b></div>
        <div>R:
          <input id="ambientR" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
        </div>
        <div>G:
          <input id="ambientG" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
        </div>
        <div>B:
          <input id="ambientB" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
        </div>
      </div>
  </div>

  <br/>
  Earth texture courtesy of
  <a href="http://www.esa.int/esaEO/SEMGSY2IU7E_index_0.html">
    the European Space Agency/Envisat
  </a>.<br/>
  <br/>
</div>
<p>
  The classic WebGL Lessons in luma.gl
`;

function getControls() {
  // Lighting form elements variables\
  /* global document */
  const $id = d => document.getElementById(d);

  // Get lighting form elements
  const specularMap = $id('specular-map');
  const colorMap = $id('color-map');
  const lighting = $id('lighting');

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
    colorMap,
    specularMap,
    lighting,
    point,
    ambient
  };
}

const EARTH_UNIFORMS = {
  uUseColorMap: true,
  uUseSpecularMap: false,
  uShowSpecularHighlights: true,
  uUseLighting: true
};

const LIGHT_UNIFORMS = {
  uAmbientColor: [0.4, 0.4, 0.4],
  uPointLightingLocation: [-10.0, 4.0, -20.0],
  uPointLightingSpecularColor: [5.0, 5.0, 5.0],
  uPointLightingDiffuseColor: [0.8, 0.8, 0.8]
};

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
precision highp float;

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform bool uUseColorMap;
uniform bool uUseSpecularMap;
uniform bool uUseLighting;
uniform vec3 uAmbientColor;
uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingSpecularColor;
uniform vec3 uPointLightingDiffuseColor;

uniform sampler2D uSpecularMapSampler;
uniform sampler2D uColorMapSampler;

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
       specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);
    }
    float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);
    lightWeighting = uAmbientColor
        + uPointLightingSpecularColor * specularLightWeighting
        + uPointLightingDiffuseColor * diffuseLightWeighting;
  }
  vec4 fragmentColor;
  fragmentColor = uUseColorMap ?
    texture2D(uColorMapSampler, vec2(vTextureCoord.s, vTextureCoord.t)) : vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
`;

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      [GL.UNPACK_FLIP_Y_WEBGL]: true
    });

    return loadTextures(gl, {
      urls: ['earth-specular.gif', 'earth.jpg'],
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
      const specularTexture = textures[0];
      const colorTexture = textures[1];

      const earth = new Sphere(gl, {
        fs: FRAGMENT_LIGHTING_FRAGMENT_SHADER,
        vs: FRAGMENT_LIGHTING_VERTEX_SHADER,
        uniforms: Object.assign(
          {
            uColorMapSampler: colorTexture,
            uSpecularMapSampler: specularTexture
          },
          EARTH_UNIFORMS,
          LIGHT_UNIFORMS
        ),
        nlat: 30,
        nlong: 30,
        radius: 13
      });
      return {earth, specularTexture, colorTexture};
    });
  },
  onRender: ({
    gl, tick, aspect, earth
  }) => {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // set camera position
    const eyePos = new Matrix4()
      .rotateX(radians(-27))
      .transformVector3([0, 0, 5]);

    const uVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: [0, 0, 0], up: [0, -1, 0]});

    const {
      colorMap,
      specularMap,
      lighting,
      point,
      ambient
    } = getControls();
    const useLighting = lighting.checked;
    const useSpecularMap = specularMap.checked;
    const useColorMap = colorMap.checked;

    earth.setUniforms({
      uUseSpecularMap: useSpecularMap,
      uUseColorMap: useColorMap,
      uUseLighting: useLighting
    });

    if (useLighting) {
      const ambientColor = parseRGB(ambient);
      const pointLightingLocation = parseXYZ(point.position);
      const pointLightSpecularColor = parseRGB(point.specular);
      const pointLightingDiffuseColor = parseRGB(point.diffuse);

      earth.setUniforms({
        uAmbientColor: ambientColor,
        uPointLightingLocation: pointLightingLocation,
        uPointLightingSpecularColor: pointLightSpecularColor,
        uPointLightingDiffuseColor: pointLightingDiffuseColor
      });
    }

    const phi = tick * 0.01;
    earth.render({
      uMMatrix: new Matrix4()
        .translate([0, -20, -40])
        .rotateAxis(radians(23.4), [1, 0, -1])
        .rotateY(phi),
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

function parseValue(value) {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

function parseRGB({r, g, b}) {
  return [parseValue(r.value), parseValue(g.value), parseValue(b.value)];
}

function parseXYZ({x, y, z}) {
  return [parseValue(x.value), parseValue(y.value), parseValue(z.value)];
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
