module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  all: 'true',
  sourceMap: false,
  instrument: true,
  extensions: ['.ts'],
  include: ['dev-modules', 'modules/**/src'],
  exclude: ['**/deprecated', '**/bundle.js', 'modules/test-utils/']
};
