/* eslint-disable no-console */
/* global console */
// const GL = require('luma.gl/constants');
const GL = require('../../modules/core/src/constants.js');

const COLOR_RESET = '\x1b[0m';
const COLOR_YELLOW = '\x1b[33m';
const COLOR_RED = '\x1b[31m';

const DEBUG = false; // Set to true to force tracing

module.exports = function _(opts) {
  if (DEBUG) {
    console.log(
    `${COLOR_YELLOW}luma.gl: babel GL constant inlining plugin loaded: ${GL.LINES}${COLOR_RESET}`);
  }

  return {
    visitor: {
      ImportDeclaration(path, state) {
        // specifiers: [ ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier ];
        // source: Literal;
        const specifiers = path.get('specifiers');
        specifiers.forEach(specifier => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            const local = specifier.node.local;
            if (local.type === 'Identifier' && local.name === 'GL') {
              if (DEBUG || state.opts.verbose || state.opts.debug) {
                const filename = getFilename(state);
                const line = local.loc.start.line;
                console.error(
                  `${COLOR_YELLOW}${filename}:${line} Dropping GL import${COLOR_RESET}`);
              }
              path.remove();
            }
          }
        });
      },

      MemberExpression(path, state) {
        const object = path.get('object');
        const property = path.get('property');
        const value = GL[property.node.name];

        const isGLIdentifier =
          object.isIdentifier({name: 'GL'}) ||
          object.isIdentifier({name: 'gl'});

        if (isGLIdentifier) {
          const filename = getFilename(state);
          const constant = `${object.node.name}.${property.node.name}`;

          if (value === undefined) {
            if (property.node.name.toUpperCase() === property.node.name) {
              const ERR_MESSAGE = 'Unknown GL constant, inlining failed';
              console.error(
                `${COLOR_RED}${filename}: ${constant} ==> ??? ${ERR_MESSAGE} ${COLOR_RESET}`);
              path.buildCodeFrameError(`${constant} ${ERR_MESSAGE}`);
              throw new Error(constant);
            }
            return;
          }

          if (DEBUG || state.opts.verbose || state.opts.debug) {
            console.error(`${COLOR_YELLOW}${filename}: ${constant} ==> ${value}${COLOR_RESET}`);
          }
          path.replaceWith(opts.types.numericLiteral(value));
        }
      }
    }
  };
};

function getFilename(state) {
  const filename = state.file.opts.filename;
  return filename;
}
