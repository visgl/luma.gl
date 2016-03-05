// Scene Object management and rendering
/* eslint-disable max-statements */

import {Vec3} from './math';
import {Program} from './webgl';
import assert from 'assert';
import {merge, uid} from './utils';
import {Framebuffer} from './webgl';

function noop() {}

const MAX_TEXTURES = 10;
const MAX_POINT_LIGHTS = 4;
const PICKING_RES = 4;

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
  },
  clearColor: true,
  clearDepth: true,
  backgroundColor: {r: 0, g: 0, b: 0, a: 1},
  backgroundDepth: 1
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

  add(...models) {
    for (const model of models) {
      // Generate unique id for model
      model.id = model.id || uid();
      this.models.push(model);
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
    if (obj && obj.program instanceof Program) {
      program = obj.program;
    } else if (obj && obj.program) {
      program = this.program[obj.program];
    }
    assert(program instanceof Program, 'Scene failed to find valid program');
    program.use();
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
    let {enable, ambient, directional, points} = this.config.lights;

    // Set light uniforms. Ambient and directional lights.
    program.setUniform('enableLights', enable);

    if (!enable) {
      return;
    }

    if (ambient) {
      this.setupAmbientLighting(program, ambient);
    }

    if (directional) {
      this.setupDirectionalLighting(program, directional);
    }

    // Set point lights
    if (points) {
      this.setupPointLighting(program, points);
    }
  }

  setupAmbientLighting(program, ambient) {
    program.setUniforms({
      'ambientColor': [ambient.r, ambient.g, ambient.b]
    });
  }

  setupDirectionalLighting(program, directional) {
    let {color, direction} = directional;

    // Normalize lighting direction vector
    const dir = new Vec3(direction.x, direction.y, direction.z)
      .$unit()
      .$scale(-1);

    program.setUniforms({
      'directionalColor': [color.r, color.g, color.b],
      'lightingDirection': [dir.x, dir.y, dir.z]
    });
  }

  setupPointLighting(program, points) {
    points = points instanceof Array ? points : [points];
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

    if (fog) {
      const {color = {r: 0.5, g: 0.5, b: 0.5}} = fog;
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

  clear() {
    const gl = this.gl;
    if (this.config.clearColor) {
      const bg = this.config.backgroundColor;
      gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    }
    if (this.config.clearDepth) {
      gl.clearDepth(this.config.backgroundDepth);
    }
    if (this.config.clearColor && this.config.clearDepth) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else if (this.config.clearColor) {
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else if (this.config.clearDepth) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }
  }

  // Renders all objects in the scene.
  render(opt = {}) {
    const camera = this.camera;
    const {renderProgram} = opt;
    const multiplePrograms = !renderProgram &&
      this.program &&
      this.program.constructor.name === 'Object';
    const options = {
      onBeforeRender: noop,
      onAfterRender: noop,
      ...opt
    };

    this.clear();

    // If we're just using one program then
    // execute the beforeRender method once.
    if (!multiplePrograms && (renderProgram || this.program)) {
      // this.beforeRender(renderProgram || this.program);
    }

    // Go through each model and render it.
    let i = 0;
    for (const model of this.models) {
      if (model.display) {
        const program = renderProgram || this.getProgram(model);
        // Setup the beforeRender method for each object
        // when there are multiple programs to be used.
        // if (multiplePrograms) {
        this.beforeRender(program);
        // }
        model.onBeforeRender(program, camera);
        options.onBeforeRender(model, i);
        this.renderObject(model, program);
        options.onAfterRender(model, i);
        model.onAfterRender(program, camera);
        i++;
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
    // TODO - use webgl/draw.js
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

  pick(x, y, opt = {}) {
    const gl = this.gl;

    if (this.pickingFBO === undefined) {
      this.pickingFBO = new Framebuffer(gl, {
        width: gl.canvas.width,
        height: gl.canvas.height
      });
    }

    if (this.pickingProgram === undefined) {
      this.pickingProgram =
        opt.pickingProgram || Program.fromDefaultShaders(gl);
    }

    let pickingProgram = this.pickingProgram;

    pickingProgram.use();
    pickingProgram.setUniform('enablePicking', true);
    pickingProgram.setUniform('hasPickingColors', false);

    this.pickingFBO.bind();

    let hash = {};

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, gl.canvas.height - y, 1, 1);

    const oldClearColor = this.clearColor;
    const oldBackgroundColor = this.backgroundColor;
    this.clearColor = true;
    this.backgroundColor = {r: 0, g: 0, b: 0, a: 0};

    this.render({
      renderProgram: pickingProgram,
      onBeforeRender: function(elem, i) {
        i++;
        let r = i % 256;
        let g = ((i / 256) >> 0) % 256;
        let b = ((i / (256 * 256)) >> 0) % 256;
        hash[[r, g, b]] = elem;
        pickingProgram.setUniform('pickColor', [r / 255, g / 255, b / 255]);
      }
    });

    gl.disable(gl.SCISSOR_TEST);

    const pixel = new Uint8Array(4);

    gl.readPixels(
      x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.clearColor = oldClearColor;
    this.backgroundColor = oldBackgroundColor;

    let r = pixel[0];
    let g = pixel[1];
    let b = pixel[2];

    return hash[[r, g, b]];
  }

  pickCustom(x, y, opt = {}) {
    const gl = this.gl;

    if (this.pickingFBO === undefined) {
      this.pickingFBO = new Framebuffer(gl, {
        width: gl.canvas.width,
        height: gl.canvas.height
      });
    }

    if (this.pickingProgram === undefined) {
      this.pickingProgram =
        opt.pickingProgram || Program.fromDefaultShaders(gl);
    }

    let pickingProgram = this.pickingProgram;

    pickingProgram.use();
    pickingProgram.setUniform('enablePicking', true);
    pickingProgram.setUniform('hasPickingColors', true);

    this.pickingFBO.bind();

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, gl.canvas.height - y, 1, 1);

    const oldClearColor = this.clearColor;
    const oldBackgroundColor = this.backgroundColor;
    this.clearColor = true;
    this.backgroundColor = {r: 255, g: 0, b: 0, a: 255};

    this.render({
      renderProgram: pickingProgram
    });

    gl.disable(gl.SCISSOR_TEST);

    const pixel = new Uint8Array(4);

    gl.readPixels(
      x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.clearColor = oldClearColor;
    this.backgroundColor = oldBackgroundColor;

    let r = pixel[0];
    let g = pixel[1];
    let b = pixel[2];
    let a = pixel[3];

    return [r, g, b, a];
  }

}

Scene.MAX_TEXTURES = MAX_TEXTURES;
Scene.MAX_POINT_LIGHTS = MAX_POINT_LIGHTS;
Scene.PICKING_RES = PICKING_RES;
