/* eslint-disable no-console, import/no-unresolved */
import {GL} from '@luma.gl/constants';

const COLOR_RESET = '\x1b[0m';
const COLOR_YELLOW = '\x1b[33m';
const COLOR_RED = '\x1b[31m';

// When building `@luma.gl/constants`, skip MemberExpressions with
// these types so declarations are not overwritten.
const EXCLUDED_TYPES = ['AssignmentExpression', 'StringLiteral'];

export default function _(opts) {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        // specifiers: [ ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier ];
        // source: Literal;

        let modified = false;
        let specifiers = path.get('specifiers');

        specifiers.forEach((specifier) => {
          if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportSpecifier') {
            const local = specifier.node.local;
            if (local.type === 'Identifier' && local.name === 'GL') {
              if (state.opts.debug) {
                const filename = getFilename(state);
                const line = local.loc.start.line;
                console.error(
                  `${COLOR_YELLOW}${filename}:${line} Dropping GL import${COLOR_RESET}`
                );
              }
              specifier.remove();
              modified = true;
            }
          }
        });

        specifiers = path.get('specifiers');

        // If the last imported specifier was removed, remove the entire import.
        if (modified && specifiers.length === 0) {
          path.remove();
        }
      },

      MemberExpression(path, state) {
        const object = path.get('object');
        const property = path.get('property');
        const value = GL[property.node.name];

        const isGLIdentifier =
          object.isIdentifier({name: 'GL'}) || object.isIdentifier({name: 'gl'});

        if (isGLIdentifier && !EXCLUDED_TYPES.includes(property.node.type)) {
          const filename = getFilename(state);
          const constant = `${object.node.name}.${property.node.name}`;

          if (value === undefined) {
            if (property.node.name.toUpperCase() === property.node.name) {
              const ERR_MESSAGE = 'Unknown GL constant, inlining failed';
              console.error(
                `${COLOR_RED}${filename}: ${constant} ==> ??? ${ERR_MESSAGE} ${COLOR_RESET}`
              );
              path.buildCodeFrameError(`${constant} ${ERR_MESSAGE}`);
              throw new Error(constant);
            }
            return;
          }

          if (state.opts.debug) {
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
