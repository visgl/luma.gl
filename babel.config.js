const getBabelConfig = require('ocular-dev-tools/config/babel.config');

module.exports = api => {
  return getBabelConfig(api, {
    plugins: [
      'version-inline',
      // NOTE: To debug our babel plugins, just reference the local modules
      // './dev-modules/babel-plugin-inline-gl-constants',
      'babel-plugin-inline-webgl-constants',
      // ['./dev-modules/babel-plugin-remove-glsl-comments', {
      [
        'babel-plugin-remove-glsl-comments',
        {
          patterns: ['**/shadertools/src/modules/**/*.js']
        }
      ]
    ]
  });
};
