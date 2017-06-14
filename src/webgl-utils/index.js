
export {
  default as polyfillContext
} from './polyfill-context';

export {
  default as trackContext
} from './track-context-state';

export {
  default as formatGLSLCompilerError
} from './format-glsl-error';

export {
  default as getShaderName
} from './get-shader-name';

// TODO - avoid importing GL as it adds a lot to bundle size
import GL from './constants';
export {GL};
