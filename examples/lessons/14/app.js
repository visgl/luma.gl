import GL from 'luma.gl/constants';
import {AnimationLoop, Model, Geometry, loadTextures, loadFiles, setParameters} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1658" target="_blank">
    Specular highlights and loading a JSON model
  </a>
<p>
  The classic WebGL Lessons in luma.gl

<div id="control-elements">
  <input type="checkbox" id="specular" checked/> Show specular highlight<br/>
  <input type="checkbox" id="lighting" checked/> Use lighting<br/>
  Texture:
  <select id="texture">
    <option value="none">None</option>
    <option selected value="galvanized">Galvanized</option>
    <option value="earth">Earth</option>
  </select>

  <br/>
  <h2>Material:</h2>
  <div class="control-block">
    <div class="control-row">
      <div><b>Shininess:</b></div>
      <input id="shininess" type="range" value="32.0" min="0.0" max="100.0" step="1"/>
    </div>
  </div>

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
  Galvanized texture courtesy of
  <a href="http://www.arroway-textures.com/">Arroway Textures</a>.<br/>
  Earth texture courtesy of
  <a href="http://www.esa.int/esaEO/SEMGSY2IU7E_index_0.html">
    the European Space Agency/Envisat
  </a>.<br/>

  <br/>
  The classic WebGL Lessons in luma.gl

 </div>
`;

// Read Lighting form elements variables
function getHTMLControls() {
  /* global document */
  const $id = id => document.getElementById(id);
  const $value = (id, defaultValue = 1) => $id(id) ? Number($id(id).value) : defaultValue;
  const $checked = id => $id(id) ? $id(id).checked : true;

  // Get lighting form elements
  // const useLighting = lighting.checked;
  // const useSpecular = specular.checked;
  // const materialShininess = shininess.value;

  // Get lighting form elements
  const useSpecular = $checked('specular');
  const useLighting = $checked('lighting');
  const useTextures = $id('texture').value !== 'none';

  const shininess = $value('shininess');

  const pointLightPosition = [
    $value('lightPositionX', -10),
    $value('lightPositionY', 4),
    $value('lightPositionZ', -20)
  ];
  const pointLightSpecularColor = [
    $value('specularR', 0.8),
    $value('specularG', 0.8),
    $value('specularB', 0.8)
  ];
  const pointLightDiffuseColor = [
    $value('diffuseR', 0.8),
    $value('diffuseG', 0.8),
    $value('diffuseB', 0.8)
  ];
  const ambientColor = [
    $value('ambientR', 0.2),
    $value('ambientG', 0.2),
    $value('ambientB', 0.2)
  ];

  return {
    useLighting,
    useSpecular,
    useTextures,

    shininess,
    texture: $id('texture').value,

    ambientColor,
    pointLightPosition,
    pointLightSpecularColor,
    pointLightDiffuseColor
  };
}

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

uniform float uMaterialShininess;
uniform bool uShowSpecularHighlights;
uniform bool uUseLighting;
uniform bool uUseTextures;
uniform vec3 uAmbientColor;
uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingSpecularColor;
uniform vec3 uPointLightingDiffuseColor;
uniform sampler2D uSampler;

void main(void) {
    vec3 lightWeighting;
    if (!uUseLighting) {
        lightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
        vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
        vec3 normal = normalize(vTransformedNormal.xyz);
        float specularLightWeighting = 0.0;
        if (uShowSpecularHighlights) {
            vec3 eyeDirection = normalize(-vPosition.xyz);
            vec3 reflectionDirection = reflect(-lightDirection, normal);
            specularLightWeighting =
              pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);
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

const TEAPOT_UNIFORMS = {
  uMaterialShininess: 20.0,
  uShowSpecularHighlights: true,
  uUseLighting: true,
  uUseTextures: true
};

const LIGHT_UNIFORMS = {
  uAmbientColor: [0.2, 0.2, 0.2],
  uPointLightingLocation: [-10.0, 4.0, -20.0],
  uPointLightingSpecularColor: [0.8, 0.8, 0.8],
  uPointLightingDiffuseColor: [0.8, 0.8, 0.8]
};

const animationLoop = new AnimationLoop({
  onInitialize({gl}) {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      [GL.UNPACK_FLIP_Y_WEBGL]: true
    });

    return Promise.all([
      loadFiles({urls: ['Teapot.json']}),
      loadTextures(gl, {
        urls: ['arroway.de_metal+structure+06_d100_flat.jpg', 'earth.jpg'],
        parameters: {
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
          [gl.TEXTURE_WRAP_S]: gl.REPEAT,
          [gl.TEXTURE_WRAP_T]: gl.REPEAT
        },
        mipmap: true
      })
    ])
    .then(([files, textures]) => {
      const galvanizedTexture = textures[0];
      const earthTexture = textures[1];
      const teapotJson = JSON.parse(files[0]);

      const teapot = new Model(gl, {
        id: 'teapot-model',
        fs: FRAGMENT_LIGHTING_FRAGMENT_SHADER,
        vs: FRAGMENT_LIGHTING_VERTEX_SHADER,
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
          TEAPOT_UNIFORMS,
          LIGHT_UNIFORMS
        )
      });
      return {teapot, earthTexture, galvanizedTexture};
    });
  },

  onRender({gl, tick, aspect, teapot, earthTexture, galvanizedTexture}) {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // set camera position
    const eyePos = new Matrix4()
      .rotateX(radians(-30))
      .transformVector3([0, 0, 5]);

    const uVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: [0, 0, 0], up: [0, 1, 0]});

    const {
      useLighting,
      useSpecular,
      useTextures,
      texture,
      shininess,
      ambientColor,
      pointLightPosition,
      pointLightSpecularColor,
      pointLightDiffuseColor

    } = getHTMLControls();

    teapot.setUniforms({
      uUseLighting: useLighting,
      uUseTextures: useTextures,
      uShowSpecularHighlights: useSpecular,
      uMaterialShininess: shininess
    });

    if (useLighting) {
      teapot.setUniforms({
        uAmbientColor: ambientColor,
        uPointLightingLocation: pointLightPosition,
        uPointLightingSpecularColor: pointLightSpecularColor,
        uPointLightingDiffuseColor: pointLightDiffuseColor
      });
    }

    if (useTextures) {
      const selectedTexture = texture;
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

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
