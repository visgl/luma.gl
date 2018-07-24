/* eslint-disable no-console */
/* global console */
// const GL = require('luma.gl/constants');
const GL = require('../../../src/constants.js');

const COLOR_RESET = '\x1b[0m';
const COLOR_YELLOW = '\x1b[33m';

module.exports = function _(opts) {
  // console.log(
  // `${COLOR_YELLOW}luma.gl: babel GL constant inlining plugin loaded: ${GL.LINES}${COLOR_RESET}`);

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
              if (state.opts.verbose || state.opts.debug) {
                const filename = state.file.opts.filename;
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

        if (isGLIdentifier && value !== undefined) {

          if (state.opts.verbose || state.opts.debug) {
            const filename = state.file.opts.filename;
            // const line = object.start.line;
            console.error(
              `${COLOR_YELLOW}${filename}: gl.${property.node.name} ==> ${value}${COLOR_RESET}`);
          }
          path.replaceWith(opts.types.numericLiteral(value));
        }
      }
    }
  };
};
