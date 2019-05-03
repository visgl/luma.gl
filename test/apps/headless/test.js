import {setContextDefaults, createGLContext} from '@luma.gl/core';
import {makeDebugContext} from 'luma.gl/debug';

import util from 'util';

setContextDefaults({width: 1, height: 1, debug: true, throwOnError: false});
export const gl = makeDebugContext(createGLContext());

const ext = gl.getExtension('EXT_disjoint_timer_query');
console.error(`EXT_disjoint_timer_query is ${Boolean(ext)} ${ext}`, ext); // eslint-disable-line
util.inspect(ext, {showHidden: true});
