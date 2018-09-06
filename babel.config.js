const TARGETS = {
  chrome: '60',
  edge: '15',
  firefox: '53',
  ios: '10.3',
  safari: '10.1',
  node: '8'
};

const CONFIG = {
  default: {
    presets: [
      ['@babel/env', {
        targets: TARGETS
      }]
    ],
    plugins: [
      'version-inline',
      './modules/babel-plugin-inline-gl-constants'
    ]
  }
};

CONFIG.es6 = Object.assign({}, CONFIG.default, {
  presets: [
    ['@babel/env', {
      targets: TARGETS,
      modules: false
    }]
  ]
});

CONFIG.esm = Object.assign({}, CONFIG.default, {
  presets: [
    ['@babel/env', {
      modules: false
    }]
  ]
});

CONFIG.es5 = Object.assign({}, CONFIG.default, {
  presets: [
    ['@babel/env', {
      forceAllTransforms: true,
      modules: 'commonjs'
    }]
  ]
});

CONFIG.cover = Object.assign({}, CONFIG.default);
// constant inlining seems to cause problems for nyc
CONFIG.cover.plugins = ['version-inline', 'istanbul'];

module.exports = function getConfig(api) {

  // eslint-disable-next-line
  var env = api.cache(() => process.env.BABEL_ENV || process.env.NODE_ENV);

  const config = CONFIG[env] || CONFIG.default;
  // Uncomment to debug
  // eslint-disable-next-line
  console.error(env, config.plugins);
  return config;
};

module.exports.config = CONFIG.es6;
