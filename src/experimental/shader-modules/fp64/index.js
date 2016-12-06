import {readFileSync} from 'fs';
import {join} from 'path';

export const module = 'fp64';
export const vs = readFileSync(join(__dirname, '/math-fp64.glsl'), 'utf8');
