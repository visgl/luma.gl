import {MODULE_INJECTORS_VS, MODULE_INJECTORS_FS} from '../modules/module-injectors';
import {VERTEX_SHADER, FRAGMENT_SHADER} from './constants';

const MODULE_INJECTORS = {
  [VERTEX_SHADER]: MODULE_INJECTORS_VS,
  [FRAGMENT_SHADER]: MODULE_INJECTORS_FS
};

// A minimal shader injection/templating system.
// RFC: https://github.com/uber/luma.gl/blob/master/dev-docs/RFCs/v6.0/shader-injection-rfc.md
export default function injectShader(source, type, inject, injectStandardStubs) {
  const INJECT_DECLARATIONS = /^/;
  const INJECT_CODE = /}[^{}]*$/;
  const isVertex = type === VERTEX_SHADER;

  for (const key in inject) {
    const fragment = inject[key];
    switch (key) {
    // declarations are injected at beginning of shader
    case 'decl-vs':
      if (isVertex) {
        source = source.replace(INJECT_DECLARATIONS, fragment);
      }
      break;
    case 'decl-fs':
      if (!isVertex) {
        source = source.replace(INJECT_DECLARATIONS, fragment);
      }
      break;
    // main code is injected at the end of main function
    case 'main-vs':
      if (isVertex) {
        source = source.replace(INJECT_CODE, fragment.concat('\n}\n'));
      }
      break;
    case 'main-fs':
      if (!isVertex) {
        source = source.replace(INJECT_CODE, fragment.concat('\n}\n'));
      }
      break;
    // inject code after key, leaving key in place
    default:
      source = source.replace(key, key.concat('\n').concat(fragment));
    }
  }

  // Finally, if requested, insert an automatic module injector chunk
  if (injectStandardStubs) {
    source = source.replace('}\s*$', MODULE_INJECTORS[type]);
  }

  return source;
}
