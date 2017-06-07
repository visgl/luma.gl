/* eslint-disable max-statements, indent, no-multi-spaces */
import {GL, AnimationLoop, Cube, Sphere, Matrix4, Texture2D,
  loadTextures, Model, loadFiles, parseModel,
  Program, Renderbuffer, Framebuffer, Geometry} from 'luma.gl';

// TODO: Remaining issues
// 1. Specular highlights don not match with example:
//    verify light position relative to moon/cube
// 2. Fix positioning (translations) of moon and cube.
// 3. Match laptopScreen uniforms with the example.
// 4. Match zNear/zFar values with example on all cases.
// 5. Verify lookAt matrix used. (do we need it?)

// TODO: For Debugging only, remove once rendering issues fixed.
const FRAGMENT_SHADER_SQ = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;
const VERTEX_SHADER_SQ = `\
attribute vec3 positions;
attribute vec4 colors;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 vColor;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vColor = colors;
}
`;

const squareGeometry = new Geometry({
  drawMode: GL.TRIANGLE_STRIP,
  positions: new Float32Array([1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0]),
  colors: {
    size: 4,
    value: new Float32Array([
      1, 0, 0, 1,  0, 1, 0, 1,  0, 0, 1, 1,  1, 1, 0, 1
    ])
  }
});

const RENDER_SQUARE = false;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;


void main(void) {
    // Perform lighting in world space
    // we should use 'transpose(inverse(mat3(uMVMatrix)))', but
    // 'inverse' matrix operation not supported in GLSL 1.0, for now use
    // upper-left 3X3 matrix of model view matrix, it works since we are not
    // doing any non-uniform scaling transormations in this example.
    mat3 normalMatrix = mat3(uMVMatrix);
    vPosition = uMVMatrix * vec4(positions, 1.0);
    gl_Position = uPMatrix * vPosition;
    vTextureCoord = texCoords;
    vTransformedNormal = normalMatrix * normals;
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

uniform vec3 uMaterialAmbientColor;
uniform vec3 uMaterialDiffuseColor;
uniform vec3 uMaterialSpecularColor;
uniform float uMaterialShininess;
uniform vec3 uMaterialEmissiveColor;
uniform bool uShowSpecularHighlights;
uniform bool uUseTextures;
uniform vec3 uAmbientLightingColor;
uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingDiffuseColor;
uniform vec3 uPointLightingSpecularColor;
uniform sampler2D uSampler;

void main(void) {
    vec3 ambientLightWeighting = uAmbientLightingColor;

    vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
    vec3 normal = normalize(vTransformedNormal);

    vec3 specularLightWeighting = vec3(0.0, 0.0, 0.0);
    if (uShowSpecularHighlights) {
        vec3 eyeDirection = normalize(-vPosition.xyz);
        vec3 reflectionDirection = reflect(-lightDirection, normal);

        float specularLightBrightness = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);
        specularLightWeighting = uPointLightingSpecularColor * specularLightBrightness;
    }

    float diffuseLightBrightness = max(dot(normal, lightDirection), 0.0);
    vec3 diffuseLightWeighting = uPointLightingDiffuseColor * diffuseLightBrightness;

    vec3 materialAmbientColor = uMaterialAmbientColor;
    vec3 materialDiffuseColor = uMaterialDiffuseColor;
    vec3 materialSpecularColor = uMaterialSpecularColor;
    vec3 materialEmissiveColor = uMaterialEmissiveColor;
    float alpha = 1.0;
    if (uUseTextures) {
        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        materialAmbientColor = materialAmbientColor * textureColor.rgb;
        materialDiffuseColor = materialDiffuseColor * textureColor.rgb;
        materialEmissiveColor = materialEmissiveColor * textureColor.rgb;
        alpha = textureColor.a;
    }
    gl_FragColor = vec4(
        materialAmbientColor * ambientLightWeighting
        + materialDiffuseColor * diffuseLightWeighting
        + materialSpecularColor * specularLightWeighting
        + materialEmissiveColor,
        alpha
    );
}
`;

var rttFramebuffer;
var rttTexture;

const DISABLE_FB = false;
const FB_WIDTH = 512;
const FB_HEIGHT = 512;

var moonAngle = 0.0;
var cubeAngle = Math.PI;
var laptopAngle = 0.0;
var moonAngleDelta = 0.01; // * Math.PI / 180.0;
var cubeAngleDelta = 0.01; // * Math.PI / 180.0;
var laptopAngleDelta = -0.005; // * Math.PI / 180.0;
const moonCubeMaterial = {
  ambientColor: [1.0, 1.0, 1.0],
  diffuseColor: [1.0, 1.0, 1.0],
  specularColor: [0.0, 0.0, 0.0],
  shininess: 0.0,
  emissiveColor: [0.0, 0.0, 0.0],
  lightLocation: [0, 0, -5],
  showSpecularHighlights: false
};
const laptopMaterial = {
  ambientColor: [1.0, 1.0, 1.0],
  diffuseColor: [1.0, 1.0, 1.0],
  specularColor: [1.5, 1.5, 1.5],
  shininess: 5.0,
  emissiveColor: [0, 0, 0],
  lightLocation: [-1, 2, -1],
  showSpecularHighlights: true
};
const laptopScreenMaterial = {
  ambientColor: [1.0, 1.0, 1.0], // [0, 0, 0],
  diffuseColor: [1.0, 1.0, 1.0], // [0, 0, 0],
  specularColor: [0.5, 0.5, 0.5],
  shininess: 20.0,
  emissiveColor: [0, 0, 0],
  lightLocation: [1.5, 1.5, 1.5],
  showSpecularHighlights: true
};
const lightUniforms = {
  ambientColor: [0.2, 0.2, 0.2],
  diffuseColor: [0.8, 0.8, 0.8],
  specularColor: [0.8, 0.8, 0.8]
};

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addControls();

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    return Promise.all([
      loadFiles({
        urls: ['macbook.json']
      }),
      loadTextures(gl, {
        urls: ['moon.gif', 'crate.gif'],
        parameters: [{
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
          mipmap: true
        }, {
          [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
          [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
          mipmap: true
        }]
      })
    ])
    .then(function(results) {
      let resultIndex = 0;
      let macbookJSON = results[resultIndex][0];
      resultIndex++;
      const tMoon = results[resultIndex][0];
      const tCrate = results[resultIndex][1];

      // Fix attribute name to match with Shaders
      macbookJSON = macbookJSON.replace('vertices', 'positions');
      const program = new Program(gl, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER});
      const macbook = parseModel(gl, {
        id: 'macbook',
        file: macbookJSON,
        program,
        uniforms: {
          uMaterialAmbientColor: laptopMaterial.ambientColor,
          uMaterialDiffuseColor: laptopMaterial.diffuseColor,
          uMaterialSpecularColor: laptopMaterial.specularColor,
          uMaterialShininess: laptopMaterial.shininess,
          uMaterialEmissiveColor: laptopMaterial.emissiveColor,
          uShowSpecularHighlights: laptopMaterial.showSpecularHighlights,
          uAmbientLightingColor: lightUniforms.ambientColor,
          uPointLightingLocation: laptopMaterial.lightLocation,
          uPointLightingDiffuseColor: lightUniforms.diffuseColor,
          uPointLightingSpecularColor: lightUniforms.specularColor
        }
      });

      const moon = new Sphere({
        gl,
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        nlat: 30,
        nlong: 30,
        radius: 2,
        uniforms: {
          uMaterialAmbientColor: moonCubeMaterial.ambientColor,
          uMaterialDiffuseColor: moonCubeMaterial.diffuseColor,
          uMaterialSpecularColor: moonCubeMaterial.specularColor,
          uMaterialShininess: moonCubeMaterial.shininess,
          uMaterialEmissiveColor: moonCubeMaterial.emissiveColor,
          uShowSpecularHighlights: moonCubeMaterial.showSpecularHighlights,
          uUseTextures: true,
          uAmbientLightingColor: lightUniforms.ambientColor,
          uPointLightingLocation: moonCubeMaterial.lightLocation,
          uPointLightingDiffuseColor: lightUniforms.diffuseColor,
          uPointLightingSpecularColor: lightUniforms.specularColor,
          uSampler: tMoon
        }
      });

      const cube = new Cube({
        gl,
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {
          uMaterialAmbientColor: moonCubeMaterial.ambientColor,
          uMaterialDiffuseColor: moonCubeMaterial.diffuseColor,
          uMaterialSpecularColor: moonCubeMaterial.specularColor,
          uMaterialShininess: moonCubeMaterial.shininess,
          uMaterialEmissiveColor: moonCubeMaterial.emissiveColor,
          uShowSpecularHighlights: moonCubeMaterial.showSpecularHighlights,
          uUseTextures: true,
          uAmbientLightingColor: lightUniforms.ambientColor,
          uPointLightingLocation: moonCubeMaterial.lightLocation,
          uPointLightingDiffuseColor: lightUniforms.diffuseColor,
          uPointLightingSpecularColor: lightUniforms.specularColor,
          uSampler: tCrate
        }
      });
      setupFramebuffer(gl);
      const laptopScreenModel = generateLaptopScreenModel(gl);

      // TODO: Square program/model for debugging only, remove once all rendering issues resolved
      const programSQ = new Program(gl, {vs: VERTEX_SHADER_SQ, fs: FRAGMENT_SHADER_SQ});
      const tSquare = new Model({geometry: squareGeometry, program: programSQ});

      return {moon, macbook, cube, laptopScreenModel, tCrate, tSquare};
    });
  },

  onRender: ({
    gl, tick, aspect, moon, macbook, cube, laptopScreenModel, canvas, tCrate, tSquare
  }) => {
    generateTextureForLaptopScreen(gl, tick, aspect, moon, cube, tSquare);
    if (!DISABLE_FB) {
      drawOuterScene(gl, tick, aspect, macbook, laptopScreenModel, canvas, tCrate);
    }
  }
});

function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1786" target="_blank">
      Rendering to textures
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

function generateLaptopScreenModel(gl) {
  const POSITIONS = new Float32Array([
    0.580687, 0.659, 0.813106,
   -0.580687, 0.659, 0.813107,
    0.580687, 0.472, 0.113121,
   -0.580687, 0.472, 0.113121
  ]);
  const NORMALS = new Float32Array([
    0.000000, -0.965926, 0.258819,
    0.000000, -0.965926, 0.258819,
    0.000000, -0.965926, 0.258819,
    0.000000, -0.965926, 0.258819
  ]);
  const TEXCOORDS = new Float32Array([
    1.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    0.0, 0.0
  ]);

  var geometry = new Geometry({
    id: 'laptopscreen-geometry',
    attributes: {
      positions: POSITIONS,
      normals: NORMALS,
      texCoords: TEXCOORDS
    },
    drawMode: GL.TRIANGLE_STRIP
  });

  var model = new Model({
    gl,
    id: 'laptopscreen-model',
    geometry: geometry,
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER,
    uniforms: {
      uMaterialAmbientColor: laptopScreenMaterial.ambientColor,
      uMaterialDiffuseColor: laptopScreenMaterial.diffuseColor,
      uMaterialSpecularColor: laptopScreenMaterial.specularColor,
      uMaterialShininess: laptopScreenMaterial.shininess,
      uMaterialEmissiveColor: laptopScreenMaterial.emissiveColor,
      uShowSpecularHighlights: laptopScreenMaterial.showSpecularHighlights,
      uUseTextures: true,
      uAmbientLightingColor: lightUniforms.ambientColor,
      uPointLightingLocation: laptopScreenMaterial.lightLocation,
      uPointLightingDiffuseColor: lightUniforms.diffuseColor,
      uPointLightingSpecularColor: lightUniforms.specularColor
    }
  });

  return model;
}

function setupFramebuffer(gl) {
    rttTexture = new Texture2D(gl, {
      data: null,
      format: GL.RGBA,
      type: GL.UNSIGNED_BYTE,
      border: 0,
      mipmaps: true,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST, // GL.LINEAR,
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST // GL.LINEAR_MIPMAP_NEAREST
      },
      width: FB_WIDTH,
      height: FB_HEIGHT,
      dataFormat: GL.RGBA
    });

    const renderbuffer = new Renderbuffer(gl, {
      format: GL.DEPTH_COMPONENT16,
      width: FB_WIDTH,
      height: FB_HEIGHT
    });

    rttFramebuffer = new Framebuffer(gl, {
      width: FB_WIDTH,
      height: FB_HEIGHT,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: rttTexture,
        [GL.DEPTH_ATTACHMENT]: renderbuffer
      }
    });

    if (DISABLE_FB === true) {
      rttFramebuffer = null;
    }
}

function generateTextureForLaptopScreen(gl, tick, aspect, moon, cube, tSquare) {
  moonAngle += moonAngleDelta;
  cubeAngle += cubeAngleDelta;
  gl.viewport(0, 0, FB_WIDTH, FB_HEIGHT);

  if (!DISABLE_FB) {
    rttFramebuffer.bind();
  }

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  // Rendering square for dubgging only, remove once all issues are resolved.
  if (RENDER_SQUARE) {
    // Draw Square
    tSquare
      .setPosition([0, 0, -1])
      //.setRotation([tick * 0.1, 0, 0])
      .updateMatrix()
      .render({
        uMVMatrix: tSquare.matrix,
        uPMatrix: Matrix4.perspective({aspect})
      });
  } else {

  var uMVMatrix = Matrix4
    .lookAt({eye: [0, 0, 20]})
    .translate([2, 0, 0])
    .rotateY(moonAngle)
    .rotateX(30 * Math.PI / 180.0)
    .translate([0, 0, -5])
    .multiplyRight(moon.matrix);

  moon.draw({
    uniforms: {
      uMVMatrix,
      uPMatrix: Matrix4.perspective({aspect: FB_WIDTH / FB_HEIGHT, near: 0.1, far: 500})
    }
  });

  uMVMatrix = Matrix4
    .lookAt({eye: [0, 0, 20]})
    .translate([1, 0, 0])
    .rotateY(cubeAngle)
    .translate([0, 0, -5])
    .multiplyRight(cube.matrix);

    cube.draw({
      uniforms: {
        uMVMatrix,
        uPMatrix: Matrix4.perspective({aspect: FB_WIDTH / FB_HEIGHT})
      }
    });
  }

  if (!DISABLE_FB) {
    rttFramebuffer.unbind();
  }
}

function drawOuterScene(gl, tick, aspect, macbook, laptopScreenModel, canvas, tCrate) {
  laptopAngle -= laptopAngleDelta;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  const uMVMatrix = Matrix4
    .lookAt({eye: [0, 0, 0]})
    .translate([0, -0.5, -3])
    .rotateY(laptopAngle)
    .rotateX(-80.0 * Math.PI / 180.0)

  macbook.render({
    uMVMatrix,
    uPMatrix: Matrix4.perspective({aspect}),
    uUseTextures: false
  });

  laptopScreenModel.render({
      uMVMatrix,
      uPMatrix: Matrix4.perspective({aspect}),
      uUseTextures: true,
      uSampler: rttFramebuffer.texture
  });

}

export default animationLoop;
