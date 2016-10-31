// Export core modules for luma.gl
export * from './webgl';
export * from './webgl2';
export * from './math';
export * from './scenegraph';
export * from './core';

import * as webgl from './webgl';
import * as webgl2 from './webgl2';
import * as math from './math';
import * as scenegraph from './scenegraph';
import * as core from './core';

// Export all modules for luma.gl
export {default as Shaders} from '../shaderlib';
export * from './geometry';
export * from './models';

import {default as Shaders} from '../shaderlib';
import * as geometry from './geometry';
import * as models from './models';

// TODO - remove
export {default as Fx} from './addons/fx';
import {default as Fx} from './addons/fx';
export * from './deprecated';
import * as deprecated from './deprecated';

import luma from './globals';
Object.assign(luma,
  webgl,
  webgl2,
  math,
  scenegraph,
  core,

  Shaders,
  geometry,
  models,

  deprecated,
  {Fx}
);
