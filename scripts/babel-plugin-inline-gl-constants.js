const GL = require('../src/constants.js');

const COLOR_RESET = '\x1b[0m';
const COLOR_YELLOW = '\x1b[33m';

// Mark transpiled classes as __PURE__ so that UglifyJS can remove them
module.exports = function _(opts) {

  console.log(  // eslint-disable-line
    `${COLOR_YELLOW}luma.gl: babel GL.value replacement plugin loaded${COLOR_RESET}`);

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
              const filename = state.file.opts.filename;
              const line = local.loc.start.line;
              console.error( // eslint-disable-line
                `${COLOR_YELLOW}${filename}:${line} Dropping GL import${COLOR_RESET}`);
              path.remove();
            }
          }
        });
      },

      MemberExpression(path, state) {
        const object = path.get('object');
        const property = path.get('property');
        const value = GL[property];

        if (object.isIdentifier({name: 'GL'}) && value !== undefined) {
          if (state.opts.verbose || state.opts.debug) {
            console.error(`${COLOR_YELLOW}gl.${property.node.name} ==> ${value}${COLOR_RESET}`); // eslint-disable-line
          }
          path.replaceWith(opts.types.numericLiteral(value));
        }

        if (object.isIdentifier({name: 'gl'}) && value !== undefined) {
          if (state.opts.verbose || state.opts.debug) {
            console.error(`${COLOR_YELLOW}gl.${property.node.name} ==> ${value}${COLOR_RESET}`); // eslint-disable-line
          }
          path.replaceWith(opts.types.numericLiteral(value));
        }
      }
    }
  };
};
