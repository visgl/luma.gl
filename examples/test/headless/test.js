import 'luma.gl/headless';
import {setContextDefaults} from '../../src/webgl/context';
import {createGLContext, makeDebugContext} from 'luma.gl';

import util from 'util';

setContextDefaults({width: 1, height: 1, debug: true, throwOnFailure: false, throwOnError: false});
export const gl = makeDebugContext(createGLContext());

const ext = gl.getExtension('EXT_disjoint_timer_query');
console.error(`EXT_disjoint_timer_query is ${Boolean(ext)} ${ext}`, ext);
util.inspect(ext, {showHidden: true});
