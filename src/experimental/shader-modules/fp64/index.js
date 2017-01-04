import {readFileSync} from 'fs';
import {join} from 'path';

export const name = 'fp64';
export const vertexShader = readFileSync(join(__dirname, '/math-fp64.glsl'), 'utf8');

// JS Utilities
export * from './math-fp64';
