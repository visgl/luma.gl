/* eslint-disable */ // camelcase, max-params, max-statements
/* global Controls, Scene, luma, mathgl, $, dat, document, glState */
const {Matrix4} = mathgl;

const MODELS = [
  'MetalRoughSpheres',
  'AppleTree',
  'Avocado',
  'BarramundiFish',
  'BoomBox',
  'Corset',
  'DamagedHelmet',
  'FarmLandDiorama',
  'NormalTangentTest',
  'Telephone',
  'TextureSettingsTest',
  'Triangle',
  'WaterBottle',
  'InterpolatedNormalsTest',
  'NonUniformScalingTest'
];

const DEFAULT_MODEL_NAME = 'DamagedHelmet';

const BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-WebGL-PBR/master';

var controls;

function main() {
  const canvas = document.getElementById('canvas');
  const canvas2d = document.getElementById('canvas2d');
  const error = document.getElementById('error');
  if (!canvas) {
    error.innerHTML += 'Failed to retrieve the canvas element<br>';
    return;
  }
  canvas.hidden = true;

  const gl = canvas.getContext('webgl', {});
  if (!gl) {
    error.innerHTML += 'Failed to get the rendering context for WebGL<br>';
    return;
  }

  luma.trackContextState(gl, {copyState: false});

  glState = {
    attributes: {},
    scene: null,
    hasLODExtension: gl.getExtension('EXT_shader_texture_lod'),
    hasDerivativesExtension: gl.getExtension('OES_standard_derivatives'),
    hasSRGBExt: gl.getExtension('EXT_SRGB'),
    canvas,
    canvas2d,
    gl
  };

  glState.uniforms = {
    // Get location of mvp matrix uniform
    u_MVPMatrix: {funcName: 'uniformMatrix4fv'},
    // Get location of model matrix uniform
    u_ModelMatrix: {funcName: 'uniformMatrix4fv'},
    // Get location of normal matrix uniform
    u_NormalMatrix: {funcName: 'uniformMatrix4fv'},

    // Light
    u_LightDirection: {funcName: 'uniform3f', vals: [0.0, 0.5, 0.5]},
    u_LightColor: {funcName: 'uniform3f', vals: [1.0, 1.0, 1.0]},

    // Camera
    u_Camera: {funcName: 'uniform3f', vals: [0.0, 0.0, -4.0]},

    // get scaling stuff
    u_ScaleDiffBaseMR: {funcName: 'uniform4f', vals: [0.0, 0.0, 0.0, 0.0]},
    u_ScaleFGDSpec: {funcName: 'uniform4f', vals: [0.0, 0.0, 0.0, 0.0]},
    u_ScaleIBLAmbient: {funcName: 'uniform4f', vals: [1.0, 1.0, 1.0, 1.0]}
  };

  // Create cube maps
  const envMap = 'papermill';
  //loadCubeMap(gl, envMap, 'environment');
  loadCubeMap(gl, envMap, 'diffuse', glState);
  loadCubeMap(gl, envMap, 'specular', glState);

  // Model matrix
  var modelMatrix = new Matrix4();

  // View matrix
  var viewMatrix = new Matrix4().lookAt({
    eye: [0.0, 0.0, 4.0],
    at: [0.0, 0.0, 0.0],
    up: [0.0, 1.0, 0.0]
  });

  const ctx2d = canvas2d.getContext('2d');

  // Load scene
  updateModel(DEFAULT_MODEL_NAME, gl, glState, viewMatrix, projectionMatrix, canvas, ctx2d);

  // Set clear color
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  // Enable depth test
  gl.enable(gl.DEPTH_TEST);

  controls = new Controls(canvas2d, redraw);

  setupGUI(gl, viewMatrix, canvas, ctx2d);

  // Redraw the scene after window size changes.
  $(window).resize(redraw);

  function tick() {
    animate(controls.roll);
    redraw();
    requestAnimationFrame(tick);
  }

  // Uncomment for turntable
  // tick();
}

let redrawQueued = false;

function redraw() {
  if (!redrawQueued) {
    redrawQueued = true;
    window.requestAnimationFrame(() => {
      redrawQueued = false;
      resizeCanvasIfNeeded();
      const scene = glState.scene;
      if (scene) {
        scene.drawScene(glState.gl);
      }
    });
  }
}

let prev = Date.now();
function animate(angle) {
  const curr = Date.now();
  const elapsed = curr - prev;
  prev = curr;
  controls.roll = angle + ((Math.PI / 4.0) * elapsed) / 5000.0;
}

const projectionMatrix = new Matrix4();

let canvasWidth = -1;
let canvasHeight = -1;

function resizeCanvasIfNeeded() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  if (width !== canvasWidth || height !== canvasHeight) {
    const {gl, canvas, canvas2d} = glState;
    canvas.width = canvas2d.width = canvasWidth = width;
    canvas.height = canvas2d.height = canvasHeight = height;
    gl.viewport(0, 0, width, height);
    mat4.perspective(projectionMatrix, (45.0 * Math.PI) / 180.0, width / height, 0.01, 100.0);
  }
}

// Update model from dat.gui change
function updateModel(value, gl, glState, viewMatrix, projectionMatrix, backBuffer, frontBuffer) {
  const error = document.getElementById('error');
  glState.scene = null;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const canvas2d = document.getElementById('canvas2d');
  frontBuffer.clearRect(0, 0, canvas2d.width, canvas2d.height);
  document.getElementById('loadSpinner').style.display = 'block';
  if (controls) {
    controls.resetCamera();
  }

  // glTF-WebGL-PBR/master/models/DamagedHelmet/glTF/DamagedHelmet.gltf
  $.ajax({
    url: `${BASE_URL}/models/${value}/glTF/${value}.gltf`,
    dataType: 'json',
    crossDomain: true,
    async: true,
    error: (jqXhr, textStatus, errorThrown) => {
      error.innerHTML += `Failed to load model: ${errorThrown}<br>`;
    },
    success: (gltf) => {
      const scene = new Scene(gl, glState, `${BASE_URL}/models/${value}/glTF/`, gltf);
      scene.projectionMatrix = projectionMatrix;
      scene.viewMatrix = viewMatrix;
      scene.backBuffer = backBuffer;
      scene.frontBuffer = frontBuffer;
      glState.scene = scene;
    }
  });
}

const lightProps = {
  lightColor: [255, 255, 255],
  lightScale: 1.0,
  lightRotation: 75,
  lightPitch: 40
};

function updateLight(value) {
  const rot = (lightProps.lightRotation * Math.PI) / 180;
  const pitch = (lightProps.lightPitch * Math.PI) / 180;

  const uniforms = {
    u_LightColor: [
      (lightProps.lightScale * lightProps.lightColor[0]) / 255,
      (lightProps.lightScale * lightProps.lightColor[1]) / 255,
      (lightProps.lightScale * lightProps.lightColor[2]) / 255
    ],
    u_LightDirection: [
      Math.sin(rot) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(rot) * Math.cos(pitch)
    ]
  };

  glState.uniforms.u_LightColor.vals = uniforms.u_LightColor;
  glState.uniforms.u_LightDirection.vals = uniforms.u_LightDirection;

  redraw();
}

const scaleVals = {
  IBL: 1.0
};

function updateMathScales(v) {
  const el = scaleVals.pinnedElement ? scaleVals.pinnedElement : scaleVals.activeElement;
  const elId = el ? el.attr('id') : null;

  const uniforms = {
    u_ScaleDiffBaseMR: [
      elId === 'mathDiff' ? 1.0 : 0.0,
      elId === 'baseColor' ? 1.0 : 0.0,
      elId === 'metallic' ? 1.0 : 0.0,
      elId === 'roughness' ? 1.0 : 0.0
    ],
    u_ScaleFGDSpec: [
      elId === 'mathF' ? 1.0 : 0.0,
      elId === 'mathG' ? 1.0 : 0.0,
      elId === 'mathD' ? 1.0 : 0.0,
      elId === 'mathSpec' ? 1.0 : 0.0
    ],
    u_ScaleIBLAmbient: [scaleVals.IBL, scaleVals.IBL, 0.0, 0.0]
  };

  glState.uniforms.u_ScaleDiffBaseMR.vals = uniforms.u_ScaleDiffBaseMR;
  glState.uniforms.u_ScaleFGDSpec.vals = uniforms.u_ScaleFGDSpec;
  glState.uniforms.u_ScaleIBLAmbient.vals = uniforms.u_ScaleIBLAmbient;

  // Object.assign(glState.uniforms, uniforms);

  redraw();
}

function setupGUI(gl, viewMatrix, canvas, ctx2d) {
  // Initialize GUI
  const gui = new dat.GUI();
  const folder = gui.addFolder('Metallic-Roughness Material');

  const text = {Model: DEFAULT_MODEL_NAME};
  folder.add(text, 'Model', MODELS).onChange((value) => {
    updateModel(value, gl, glState, viewMatrix, projectionMatrix, canvas, ctx2d);
  });
  folder.open();

  const light = gui.addFolder('Directional Light');
  light.addColor(lightProps, 'lightColor').onChange(updateLight);
  light.add(lightProps, 'lightScale', 0, 10).onChange(updateLight);
  light.add(lightProps, 'lightRotation', 0, 360).onChange(updateLight);
  light.add(lightProps, 'lightPitch', -90, 90).onChange(updateLight);

  light.open();

  updateLight();

  // mouseover scaling

  // gui.add(scaleVals, 'IBL', 0, 4).onChange(updateMathScales);

  createMouseOverScale('#mathDiff', 'diff');
  createMouseOverScale('#mathSpec', 'spec');
  createMouseOverScale('#mathF', 'F');
  createMouseOverScale('#mathG', 'G');
  createMouseOverScale('#mathD', 'D');
  createMouseOverScale('#baseColor', 'baseColor');
  createMouseOverScale('#metallic', 'metallic');
  createMouseOverScale('#roughness', 'roughness');

  $('#pbrMath').click(function (ev) {
    if (scaleVals.pinned && scaleVals.pinnedElement) {
      $(scaleVals.pinnedElement).removeClass('pinnedComponent');
    }
    scaleVals.pinned = false;
  });

  updateMathScales();

  $(glState.canvas2d).mousemove((e) => pickPixel(e.pageX, e.pageY));
}

// picker
const pixelPickerPos = {x: 0, y: 0};
let pixelPickerScheduled = false;

function format255(p) {
  const str = p.toString();
  return ' '.repeat(3).substring(str.length) + str;
}

function pickPixel(x, y) {
  const pos = $(glState.canvas2d).position();
  pixelPickerPos.x = x - pos.left;
  pixelPickerPos.y = y - pos.top;
  if (!pixelPickerScheduled) {
    pixelPickerScheduled = true;
    window.requestAnimationFrame(sample2D);
  }
}

function sample2D() {
  const pixelPickerText = document.getElementById('pixelPickerText');
  const pixelPickerColor = document.getElementById('pixelPickerColor');

  pixelPickerScheduled = false;
  const x = pixelPickerPos.x;
  const y = pixelPickerPos.y;
  const {canvas2d} = glState;

  const ctx2d = canvas2d.getContext('2d');
  const p = ctx2d.getImageData(x, y, 1, 1).data;
  pixelPickerText.innerHTML = `\
r${format255(p[0])} g: ${format255(p[1])} b: ${format255(p[2])}<br>
r${(p[0] / 255).toFixed(2)} g: ${(p[1] / 255).toFixed(2)} b: ${(p[2] / 255).toFixed(2)}`;
  pixelPickerColor.style.backgroundColor = `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
}

function setActiveComponent(el) {
  if (scaleVals.activeElement) {
    scaleVals.activeElement.removeClass('activeComponent');
  }
  if (el && !scaleVals.pinnedElement) {
    el.addClass('activeComponent');
  }
  scaleVals.activeElement = el;

  if (!scaleVals.pinnedElement) {
    updateMathScales();
  }
}

function setPinnedComponent(el) {
  if (scaleVals.activeElement) {
    if (el) {
      scaleVals.activeElement.removeClass('activeComponent');
    } else {
      scaleVals.activeElement.addClass('activeComponent');
    }
  }

  if (scaleVals.pinnedElement) {
    scaleVals.pinnedElement.removeClass('pinnedComponent');
  }

  if (el) {
    el.addClass('pinnedComponent');
  }

  scaleVals.pinnedElement = el;

  updateMathScales();
}

function createMouseOverScale() {
  const localArgs = arguments;
  const el = $(localArgs[0]);
  el.hover(
    (ev) => setActiveComponent(el),
    (ev) => setActiveComponent(null)
  );

  el.click((ev) => {
    if (scaleVals.pinnedElement) {
      setPinnedComponent(null);
    } else {
      setPinnedComponent(el);
    }
    ev.stopPropagation();
  });
}
