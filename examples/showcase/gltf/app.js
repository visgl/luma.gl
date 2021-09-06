import {parse} from '@loaders.gl/core';
// eslint-disable-next-line import/no-unresolved
import {GLTFLoader} from '@loaders.gl/gltf';
import '@loaders.gl/polyfills'; // text-encoding polyfill for older MS browsers
import GL from '@luma.gl/constants';
import {AnimationLoop, Timeline} from '@luma.gl/engine';
import {clear, log, lumaStats} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {createGLTFObjects, GLTFEnvironment, VRDisplay} from '@luma.gl/experimental';
import {Matrix4, radians} from '@math.gl/core';

const CUBE_FACE_TO_DIRECTION = {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: 'right',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: 'left',
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: 'top',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: 'bottom',
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: 'front',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: 'back'
};

// Damaged helmet model used under creative commons: https://github.com/KhronosGroup/glTF-Sample-Models/tree/1ba47770292486e66ca1e1161857a6e5695c2631/2.0/DamagedHelmet
// Papermill textures used under Apache 2.0: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/e2d487693fa2e6148bd29d05bc82586f5a002a45/LICENSE.md

const GLTF_BASE_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/luma.gl/examples/gltf/';
const GLTF_DEFAULT_MODEL = 'DamagedHelmet.glb';

// URL for animated model
// 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/InterpolationTest/glTF-Binary/InterpolationTest.glb';

const INFO_HTML = `
<p><b>glTF Loader</b>.</p>
<p>Rendered using luma.gl.</p>
<div>
  Show
  <select id="showSelector">
    <option value="0 0 0 0 0 0 0 0">Final Result</option>

    <option value="0 1 0 0 0 0 0 0">Base Color</option>
    <option value="0 0 1 0 0 0 0 0">Metallic</option>
    <option value="0 0 0 1 0 0 0 0">Roughness</option>
    <option value="1 0 0 0 0 0 0 0">Diffuse</option>

    <option value="0 0 0 0 1 0 0 0">Specular Reflection</option>
    <option value="0 0 0 0 0 1 0 0">Geometric Occlusion</option>
    <option value="0 0 0 0 0 0 1 0">Microfacet Distribution</option>
    <option value="0 0 0 0 0 0 0 1">Specular</option>
  </select>
  <br>
</div>
<div>
  Regular Lights
  <select id="lightSelector">
    <option value="default">Default</option>
    <option value="ambient">Ambient Only</option>
    <option value="directional1">1x Directional (Red) + Ambient</option>
    <option value="directional3">3x Directional (RGB)</option>
    <option value="point1far">1x Point Light Far (Red) + Ambient</option>
    <option value="point1near">1x Point Light Near (Red) + Ambient</option>
  </select>
  <br>
</div>
<div>
  Image-Based Light
  <select id="iblSelector">
    <option value="exclusive">On (Exclusive)</option>
    <option value="addition">On (Addition to Regular)</option>
    <option value="off">Off (Only Regular)</option>
  </select>
  <br>
</div>
<p><img src="https://img.shields.io/badge/WebVR-Supported-orange.svg" /></p>
`;

const LIGHT_SOURCES = {
  default: {
    directionalLights: [
      {
        color: [255, 255, 255],
        direction: [0.0, 0.5, 0.5],
        intensity: 1.0
      }
    ]
  },
  ambient: {
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  },
  directional1: {
    directionalLights: [
      {
        color: [255, 0, 0],
        direction: [1.0, 0.0, 0.0],
        intensity: 1.0
      }
    ],
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  },
  directional3: {
    directionalLights: [
      {
        color: [255, 0.0, 0.0],
        direction: [1.0, 0.0, 0.0],
        intensity: 1.0
      },
      {
        color: [0.0, 0.0, 255],
        direction: [0.0, 0.0, 1.0],
        intensity: 1.0
      },
      {
        color: [0.0, 255, 0.0],
        direction: [0.0, 1.0, 0.0],
        intensity: 1.0
      }
    ]
  },
  point1far: {
    pointLights: [
      {
        color: [255, 0, 0],
        position: [200.0, 0.0, 0.0],
        attenuation: [0, 0, 0.01],
        intensity: 1.0
      }
    ],
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  },
  point1near: {
    pointLights: [
      {
        color: [255, 0, 0],
        position: [10.0, 0.0, 0.0],
        attenuation: [0, 0, 0.01],
        intensity: 1.0
      }
    ],
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  }
};

const DEFAULT_OPTIONS = {
  pbrDebug: true,
  imageBasedLightingEnvironment: null,
  lights: false
};

async function loadGLTF(urlOrPromise, gl, options) {
  const data = typeof urlOrPromise === 'string' ? window.fetch(urlOrPromise) : urlOrPromise;
  const gltf = await parse(data, GLTFLoader, {
    ...options,
    gl
  });
  const {scenes, animator} = createGLTFObjects(gl, gltf, options);

  scenes[0].traverse((node, {worldMatrix}) => log.info(4, 'Using model: ', node)());
  return {scenes, animator, gltf};
}

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }
  constructor(opts = {}) {
    super({
      ...opts,
      glOptions: {
        // Use to test gltf with webgl 1.0 and 2.0
        webgl1: true,
        webgl2: true,
        // alpha causes issues with some glTF demos
        alpha: false
      }
    });

    const {modelFile = null, initialZoom = 2} = opts;
    this.scenes = [];
    this.animator = null;
    this.gl = null;
    this.modelFile = modelFile;

    this.mouse = {
      lastX: 0,
      lastY: 0
    };

    this.translate = initialZoom;
    this.rotation = [0, 0];
    this.rotationStart = [0, 0];

    this.u_ScaleDiffBaseMR = [0, 0, 0, 0];
    this.u_ScaleFGDSpec = [0, 0, 0, 0];

    this.attachTimeline(new Timeline());
    this.timeline.play();
    this.timelineChannel = this.timeline.addChannel({
      rate: 0.5
    });
    this.animationHandle = null;

    this.onInitialize = this.onInitialize.bind(this);
    this.onRender = this.onRender.bind(this);

    this.gltf = null;

    // @ts-ignore
    this._setDisplay(new VRDisplay());
  }

  initalizeEventHandling(canvas) {
    let pointerIsDown = false;

    const pointerDown = (x, y) => {
      this.mouse.lastX = x;
      this.mouse.lastY = y;

      this.rotationStart[0] = this.rotation[0];
      this.rotationStart[1] = this.rotation[1];

      pointerIsDown = true;
    };

    const pointerMove = (x, y) => {
      if (!pointerIsDown) {
        return;
      }

      const dX = x - this.mouse.lastX;
      const dY = y - this.mouse.lastY;

      this.rotation[0] = this.rotationStart[0] + dY / 100;
      this.rotation[1] = this.rotationStart[1] + dX / 100;
    };

    canvas.addEventListener('wheel', (e) => {
      this.translate += e.deltaY / 10;
      if (this.translate < 0.5) {
        this.translate = 0.5;
      }
      e.preventDefault();
    });

    canvas.addEventListener('mousedown', (e) => {
      pointerDown(e.clientX, e.clientY);

      e.preventDefault();
    });

    canvas.addEventListener('mouseup', (e) => {
      pointerIsDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      pointerMove(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
      pointerDown(e.touches[0].clientX, e.touches[0].clientY);

      e.preventDefault();
    });

    canvas.addEventListener('touchmove', (e) => {
      pointerMove(e.touches[0].clientX, e.touches[0].clientY);
    });

    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        pointerIsDown = false;
      }
    });

    canvas.addEventListener('dragover', (e) => {
      e.dataTransfer.dropEffect = 'link';
      e.preventDefault();
    });

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {
        this._deleteScenes();
        const readPromise = new Promise((resolve) => {
          const reader = new window.FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsArrayBuffer(e.dataTransfer.files[0]);
        });

        loadGLTF(readPromise, this.gl, this.loadOptions).then((result) => this._fileLoaded(result));
      }
    });
  }

  _fileLoaded(loadResult) {
    if (this.animationHandle !== null) {
      this.timeline.detachAnimation(this.animationHandle);
      this.animationHandle = null;
    }
    this.animator = null;

    Object.assign(this, loadResult);
    if (this.animator) {
      this.animationHandle = this.timeline.attachAnimation(this.animator, this.timelineChannel);
    }
  }

  onInitialize({gl, canvas}) {
    setParameters(gl, {
      depthTest: true,
      blend: false
    });

    this.loadOptions = DEFAULT_OPTIONS;
    this.environment = new GLTFEnvironment(gl, {
      brdfLutUrl: `${GLTF_BASE_URL}/brdfLUT.png`,
      getTexUrl: (type, dir, mipLevel) =>
        `${GLTF_BASE_URL}/papermill/${type}/${type}_${CUBE_FACE_TO_DIRECTION[dir]}_${mipLevel}.jpg`
    });
    this.loadOptions.imageBasedLightingEnvironment = this.environment;

    this.gl = gl;
    if (this.modelFile) {
      // options for unit testing
      const options = {
        pbrDebug: false,
        imageBasedLightingEnvironment: null,
        lights: true
      };
      loadGLTF(this.modelFile, this.gl, options).then((result) => this._fileLoaded(result));
    } else {
      const modelUrl = GLTF_DEFAULT_MODEL;
      loadGLTF(GLTF_BASE_URL + modelUrl, this.gl, this.loadOptions).then((result) =>
        this._fileLoaded(result)
      );
    }

    const showSelector = document.getElementById('showSelector');
    if (showSelector) {
      showSelector.onchange = (event) => {
        // @ts-ignore
        const value = showSelector.value.split(' ').map((x) => parseFloat(x));
        this.u_ScaleDiffBaseMR = value.slice(0, 4);
        this.u_ScaleFGDSpec = value.slice(4);
      };
    }

    const lightSelector = document.getElementById('lightSelector');
    if (lightSelector) {
      lightSelector.onchange = (event) => {
        // @ts-ignore
        this.light = lightSelector.value;
      };
    }

    const iblSelector = document.getElementById('iblSelector');
    if (iblSelector) {
      iblSelector.onchange = (event) => {
        // @ts-ignore
        this._updateLightSettings(iblSelector.value);
        this._rebuildModel();
      };
    }

    this.initalizeEventHandling(canvas);
  }

  _updateLightSettings(value) {
    switch (value) {
      case 'exclusive':
        Object.assign(this.loadOptions, {
          imageBasedLightingEnvironment: this.environment,
          lights: false
        });
        break;

      case 'addition':
        Object.assign(this.loadOptions, {
          imageBasedLightingEnvironment: this.environment,
          lights: true
        });
        break;

      case 'off':
        Object.assign(this.loadOptions, {
          imageBasedLightingEnvironment: null,
          lights: true
        });
        break;

      default:
        break;
    }
  }

  _rebuildModel() {
    // Clean and regenerate model so we have new "#defines"
    // TODO: Find better way to do this
    (this.gltf.meshes || []).forEach((mesh) => delete mesh._mesh);
    (this.gltf.nodes || []).forEach((node) => delete node._node);
    (this.gltf.bufferViews || []).forEach((bufferView) => delete bufferView.lumaBuffers);

    this._deleteScenes();
    Object.assign(this, createGLTFObjects(this.gl, this.gltf, this.loadOptions));
  }

  _deleteScenes() {
    this.scenes.forEach((scene) => scene.delete());
    this.scenes = [];

    lumaStats.get('Resource Counts').forEach(({name, count}) => {
      log.info(3, `${name}: ${count}`)();
    });
  }

  applyLight(model) {
    // TODO: only do this when light changes
    model.updateModuleSettings({
      lightSources: LIGHT_SOURCES[this.light || 'default']
    });
  }

  onRender({gl, time, aspect, viewMatrix, projectionMatrix}) {
    clear(gl, {color: [0.2, 0.2, 0.2, 1.0], depth: true});

    const [pitch, roll] = this.rotation;
    const cameraPos = [
      -this.translate * Math.sin(roll) * Math.cos(-pitch),
      -this.translate * Math.sin(-pitch),
      this.translate * Math.cos(roll) * Math.cos(-pitch)
    ];

    // TODO: find how to avoid using Array.from() to convert TypedArray to regular array
    const uView = new Matrix4(viewMatrix ? Array.from(viewMatrix) : null)
      .translate([0, 0, -this.translate])
      .rotateX(pitch)
      .rotateY(roll);

    const uProjection = projectionMatrix
      ? new Matrix4(Array.from(projectionMatrix))
      : new Matrix4().perspective({fov: radians(40), aspect, near: 0.1, far: 9000});

    if (!this.scenes.length) return false;

    let success = true;

    this.scenes[0].traverse((model, {worldMatrix}) => {
      // In glTF, meshes and primitives do no have their own matrix.
      const u_MVPMatrix = new Matrix4(uProjection).multiplyRight(uView).multiplyRight(worldMatrix);
      this.applyLight(model);
      success =
        success &&
        model.draw({
          uniforms: {
            u_Camera: cameraPos,
            u_MVPMatrix,
            u_ModelMatrix: worldMatrix,
            u_NormalMatrix: new Matrix4(worldMatrix).invert().transpose(),

            u_ScaleDiffBaseMR: this.u_ScaleDiffBaseMR,
            u_ScaleFGDSpec: this.u_ScaleFGDSpec
          },
          parameters: model.props.parameters
        });
    });

    return success;
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = AppAnimationLoop.getInfo();
  document.body.appendChild(infoDiv);
}
