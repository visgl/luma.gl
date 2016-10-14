// Export all symbols for LumaGL
export * from './webgl';
export * from './webgl2';
export * from './math';
export * from './scenegraph';
export * from './geometry';
export * from './core';
export {default as Shaders} from '../shaderlib';
// TODO - remove
export {default as Fx} from './addons/fx';

import * as webgl from './webgl';
import * as webgl2 from './webgl2';
import * as math from './math';
import * as scenegraph from './scenegraph';
import * as geometry from './geometry';
import * as core from './core';
import {default as Shaders} from '../shaderlib';

// TODO - remove
import {default as Fx} from './addons/fx';
import * as deprecated from './deprecated';

import luma from './globals';
Object.assign(luma,
  webgl,
  webgl2,
  math,
  scenegraph,
  geometry,
  core,
  Shaders,
  deprecated,
  {Fx}
);
