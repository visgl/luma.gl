// scene.js
// Scene Object management and rendering

import {Vec3} from './math';
import Program from './program';
import assert from 'assert';
import {merge, uid} from './utils';

function noop() {}

const DEFAULT_SCENE_OPTS = {
  lights: {
    enable: false,
    // ambient light
    ambient: {r: 0.2, g: 0.2, b: 0.2},
    // directional light
    directional: {
      direction: {x: 1, y: 1, z: 1},
      color: {r: 0, g: 0, b: 0}
    }
    // point light
    // points: []
  },
  effects: {
    fog: false
    // { near, far, color }
  }
};

// Scene class
export default class Scene {

  constructor(gl, program, camera, opt = {}) {
    assert(gl);
    assert(camera);

    this.gl = gl;

    opt = merge(DEFAULT_SCENE_OPTS, opt);

    this.program = opt.program ? program[opt.program] : program;
    this.camera = camera;
    this.models = [];
    this.config = opt;
  }

  add() {
    for (var i = 0, models = this.models, l = arguments.length; i < l; i++) {
      var model = arguments[i];
      // Generate unique id for model
      model.id = model.id || uid();
      models.push(model);
      // Create and load Buffers
      this.defineBuffers(model);
    }
  }

  remove(model) {
    const models = this.models;
    const indexOf = models.indexOf(model);
    if (indexOf > -1) {
      models.splice(indexOf, 1);
    }
  }

  removeAll() {
    this.models = [];
  }

  getProgram(obj) {
    let program = this.program;
    if (!(program instanceof Program) && obj && obj.program) {
      program = program[obj.program];
      program.use();
      return program;
    }
    return program;
  }

  defineBuffers(obj) {
    const program = this.getProgram(obj);
    const prevDynamic = obj.dynamic;
    obj.dynamic = true;
    obj.setState(program);
    obj.dynamic = prevDynamic;
    obj.unsetState(program);
  }

  // Setup lighting and scene effects like fog, etc.
  beforeRender(program) {
    this.setupLighting(program);
    this.setupEffects(program);
    if (this.camera) {
      this.camera.setStatus(program);
    }
  }

  // Setup the lighting system: ambient, directional, point lights.
  setupLighting(program) {
    // Setup Lighting
    let {
      enable, ambient, directional: {color, direction}, points = []
    } = this.config.lights;

    points = points instanceof Array ? points : [points];

    // Set light uniforms. Ambient and directional lights.
    program.setUniform('enableLights', enable);

    if (!enable) {
      return;
    }

    // Normalize lighting direction vector
    const dir = new Vec3(direction.x, direction.y, direction.z)
      .$unit()
      .$scale(-1);

    program.setUniforms({
      'ambientColor': [ambient.r, ambient.g, ambient.b],
      'directionalColor': [color.r, color.g, color.b],
      'lightingDirection': [dir.x, dir.y, dir.z]
    });

    // Set point lights
    const numberPoints = points.length;
    program.setUniform('numberPoints', numberPoints);

    const pointLocations = [];
    const pointColors = [];
    const enableSpecular = [];
    const pointSpecularColors = [];
    for (const point of points) {
      const {position, color, diffuse, specular} = point;
      const pointColor = color || diffuse;

      pointLocations.push(position.x, position.y, position.z);
      pointColors.push(pointColor.r, pointColor.g, pointColor.b);

      // Add specular color
      enableSpecular.push(Number(Boolean(specular)));
      if (specular) {
        pointSpecularColors.push(specular.r, specular.g, specular.b);
      } else {
        pointSpecularColors.push(0, 0, 0);
      }
    }

    if (pointLocations.length) {
      program.setUniforms({
        'pointLocation': pointLocations,
        'pointColor': pointColors
      });
      program.setUniforms({
        'enableSpecular': enableSpecular,
        'pointSpecularColor': pointSpecularColors
      });
    }

  }

  // Setup effects like fog, etc.
  setupEffects(program) {
    const {fog} = this.config.effects;
    const {color = {r: 0.5, g: 0.5, b: 0.5}} = fog;

    if (fog) {
      program.setUniforms({
        'hasFog': true,
        'fogNear': fog.near,
        'fogFar': fog.far,
        'fogColor': [color.r, color.g, color.b]
      });
    } else {
      program.setUniform('hasFog', false);
    }
  }

  // Renders all objects in the scene.
  render(opt = {}) {
    const camera = this.camera;
    const {renderProgram} = opt;
    const multiplePrograms = !renderProgram && this.program.constructor.name === 'Object';
    const options = {
      onBeforeRender: noop,
      onAfterRender: noop,
      ...opt
    };

    // If we're just using one program then
    // execute the beforeRender method once.
    if (!multiplePrograms) {
      this.beforeRender(renderProgram || this.program);
    }

    // Go through each model and render it.
    for (let i = 0, models = this.models, l = models.length; i < l; ++i) {
      const elem = models[i];
      if (elem.display) {
        const program = renderProgram || this.getProgram(elem);
        // Setup the beforeRender method for each object
        // when there are multiple programs to be used.
        if (multiplePrograms) {
          this.beforeRender(program);
        }
        elem.onBeforeRender(program, camera);
        options.onBeforeRender(elem, i);
        this.renderObject(elem, program);
        options.onAfterRender(elem, i);
        elem.onAfterRender(program, camera);
      }
    }
  }

  renderObject(object, program) {
    const gl = this.gl;

    const {view} = this.camera;
    const {matrix} = object;
    const worldMatrix = view.mulMat4(matrix);
    const worldInverse = worldMatrix.invert();
    const worldInverseTranspose = worldInverse.transpose();

    object.setState(program);

    // Now set view and normal matrices
    program.setUniforms({
      objectMatrix: matrix,
      worldMatrix: worldMatrix,
      worldInverseMatrix: worldInverse,
      worldInverseTransposeMatrix: worldInverseTranspose
      // worldViewProjection:
      //   view.mulMat4(object).$mulMat4(view.mulMat4(projection))
    });

    // Draw
    // TODO(nico): move this into O3D, but, somehow,
    // abstract the gl.draw* methods inside that object.
    if (object.render) {
      object.render(gl, program, this.camera);
    } else {
      const drawType = object.drawType !== undefined ?
        gl.get(object.drawType) : gl.TRIANGLES;
      if (object.$indicesLength) {
        gl.drawElements(
          drawType, object.$indicesLength, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(drawType, 0, object.$verticesLength / 3);
      }
    }

    object.unsetState(program);
  }

  unproject(pt, camera) {
    return camera.view.invert().mulMat4(camera.projection.invert()).mulVec3(pt);
  }

  // setup picking framebuffer
  setupPicking(opt) {
    // create picking program
    const program = Program.fromDefaultShaders();

    // create framebuffer
    // rye TODO: use the new FBO
    this.app.setFrameBuffer('$picking', {
      width: 5,
      height: 1,
      bindToTexture: {
        parameters: [{
          name: 'TEXTURE_MAG_FILTER',
          value: 'NEAREST'
        }, {
          name: 'TEXTURE_MIN_FILTER',
          value: 'NEAREST'
        }, {
          name: 'TEXTURE_WRAP_S',
          value: 'CLAMP_TO_EDGE'
        }, {
          name: 'TEXTURE_WRAP_T',
          value: 'CLAMP_TO_EDGE'
        }]
      },
      bindToRenderBuffer: true
    });

    // rye TODO; use the new FBO
    this.app.setFrameBuffer('$picking', false);
    this.pickingProgram = opt.pickingProgram || program;
  }

  pick(x, y, opt = {}) {
    const gl = this.gl;

    // setup the picking program if this is
    // the first time we enter the method.
    if (!this.pickingProgram) {
      this.setupPicking(opt);
    }

    const o3dHash = {};
    const o3dList = [];
    // rye TODO: figure out a non-global way to get the current program
    const program = this.app.usedProgram;
    const pickingProgram = this.pickingProgram;
    const camera = this.camera;
    const oldtarget = camera.target;
    const oldaspect = camera.aspect;
    const config = this.config;
    const memoLightEnable = config.lights.enable;
    const memoFog = config.effects.fog;
    const canvas = gl.canvas;
    const viewport = opt.viewport || {};
    const pixelRatio = opt.pixelRatio || 1;
    const width = (viewport.width || canvas.offsetWidth || canvas.width);
    const height = (viewport.height || canvas.offsetHeight || canvas.height);
    const resWidth = 5;
    const resHeight = 1;
    const xp = (x * pixelRatio - (viewport.x || 0));
    const yp = (y * pixelRatio - (viewport.y || 0));
    const ndcx = xp * 2 / width - 1;
    const ndcy = 1 - yp * 2 / height;
    const target = this.unproject([ndcx, ndcy, 1.0], camera);
    const hash = [];
    const pixel = new Uint8Array(1 * 1 * 4);
    let backgroundColor;
    let capture;

    this.camera.target = target;
    this.camera.update();
    // setup the scene for picking
    config.lights.enable = false;
    config.effects.fog = false;

    // enable picking and render to texture
    // rye TODO: use the new FBO
    this.app.setFrameBuffer('$picking', true);
    pickingProgram.use();
    pickingProgram.setUniform('enablePicking', true);

    // render the scene to a texture
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, resWidth, resHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // read the background color so we don't step on it
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    backgroundColor = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;

    // render picking scene
    this.renderPickingScene({
      background: backgroundColor,
      o3dHash: o3dHash,
      o3dList: o3dList,
      hash: hash
    });

    // the target point is in the center of the screen,
    // so it should be the center point.
    gl.readPixels(2, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    const stringColor = [pixel[0], pixel[1], pixel[2]].join();
    let elem = o3dHash[stringColor];
    let pick;

   // console.log('o3dHash', stringColor, x, y, width, height);

    if (!elem) {
      for (elem of o3dList) {
        pick = elem.pick(pixel);
        if (pick !== false) {
          elem.$pickingIndex = pick;
        } else {
          elem = false;
        }
      }
    }

    // restore all values and unbind buffers
    // rye TODO: use the new FBO
    this.app.setFrameBuffer('$picking', false);
    // rye TODO: use the new Texture2D class
    this.app.setTexture('$picking-texture', false);
    pickingProgram.setUniform('enablePicking', false);
    config.lights.enable = memoLightEnable;
    config.effects.fog = memoFog;

    // restore previous program
    if (program) {
      program.use();
    }

    // restore the viewport size to original size
    gl.viewport(
      viewport.x || 0,
      viewport.y || 0,
      width,
      height
    );
    // restore camera properties
    camera.target = oldtarget;
    camera.aspect = oldaspect;
    camera.update();

    // store model hash and pixel array
    this.o3dHash = o3dHash;
    this.o3dList = o3dList;
    this.pixel = pixel;
    this.capture = capture;

    return elem && elem.pickable && elem;
  }

  renderPickingScene(opt) {
    // if set through the config, render a custom scene.
    if (this.config.renderPickingScene) {
      this.config.renderPickingScene.call(this, opt);
      return;
    }

    const pickingProgram = this.pickingProgram;
    let o3dHash = opt.o3dHash;
    let o3dList = opt.o3dList;
    let background = opt.background;
    let hash = opt.hash;
    let index = 0;

    // render to texture
    this.renderToTexture('$picking', {
      renderProgram: pickingProgram,
      onBeforeRender(elem, i) {
        if (i === background) {
          index = 1;
        }
        const suc = i + index;
        const hasPickingColors = Boolean(elem.pickingColors);

        pickingProgram.setUniform('hasPickingColors', hasPickingColors);

        if (!hasPickingColors) {
          hash[0] = suc % 256;
          hash[1] = ((suc / 256) >> 0) % 256;
          hash[2] = ((suc / (256 * 256)) >> 0) % 256;
          pickingProgram.setUniform('pickColor',
            [hash[0] / 255, hash[1] / 255, hash[2] / 255]);
          o3dHash[hash.join()] = elem;
        } else {
          o3dList.push(elem);
        }
      }
    });
  }

  resetPicking() {
    // empty
  }
}

Scene.MAX_TEXTURES = 10;
Scene.MAX_POINT_LIGHTS = 4;
Scene.PICKING_RES = 4;
