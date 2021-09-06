const {getOcularConfig} = require('ocular-dev-tools');
const {resolve} = require('path');
const webpack = require('webpack');

const ALIASES = getOcularConfig({
  aliasMode: 'src',
  root: resolve(__dirname, '..')
}).aliases;

const PACKAGE_ROOT = resolve('.');
const PACKAGE_INFO = require(resolve(PACKAGE_ROOT, 'package.json'));

/**
 * peerDependencies are excluded using `externals`
 * https://webpack.js.org/configuration/externals/
 * e.g. @deck.gl/core is not bundled with @deck.gl/geo-layers
 */
function getExternals(packageInfo) {
  const externals = {
    // Hard coded externals
  };

  const {peerDependencies = {}, browser} = packageInfo;

  Object.assign(externals, browser);

  for (const depName in peerDependencies) {
    if (depName.startsWith('@luma.gl')) {
      // Instead of bundling the dependency, import from the global `deck` object
      externals[depName] = 'luma';
    }
  }

  return externals;
}

const NODE = {
  Buffer: false,
  fs: 'empty',
  http: 'empty',
  https: 'empty',
  path: 'empty',
  crypto: 'empty'
};

const ES5_BABEL_CONFIG = {
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-env', {forceAllTransforms: true}]
  ],
  plugins: [
    // webpack 4 cannot parse the most recent JS syntax
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    // typescript supports class properties
    '@babel/plugin-proposal-class-properties',
    // inject __VERSION__ from package.json
    'version-inline',
    ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }],
    'inline-webgl-constants',
    ['remove-glsl-comments', {patterns: ['**/*.glsl.js']}]
  ]
};

const config = {
  mode: 'production',

  entry: {
    main: resolve('./src/bundle.ts')
  },

  output: {
    libraryTarget: 'umd',
    path: PACKAGE_ROOT,
    filename: 'dist/dist.min.js'
  },

  node: NODE,

  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'],
    alias: ALIASES
  },

  module: {
    rules: [
      {
        // Compile ES2015 using babel
        test: /\.(js|ts)$/,
        loader: 'babel-loader',
        include: [/src/, /esm/],
        options: ES5_BABEL_CONFIG
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto"
      }
    ]
  },

  externals: getExternals(PACKAGE_INFO),

  plugins: [
    // This is used to define the __VERSION__ constant in core/lib/init.js
    // babel-plugin-version-inline uses the package version from the working directory
    // Therefore we need to manually import the correct version from the core
    // This is called in prepublishOnly, after lerna bumps the package versions
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(PACKAGE_INFO.version)
    })
  ],

  devtool: false
};

module.exports = (env = {}) => {
  // console.log(JSON.stringify(env, null, 2));

  if (env.dev) {
    // Set development mode (no minification)
    config.mode = 'development';
    // Remove .min from the name
    config.output.filename = 'dist/dist.js';
    // Disable transpilation
    // config.module.rules = [];
  }

  // NOTE uncomment to display config
  // console.log('webpack config', JSON.stringify(config, null, 2));

  return config;
};
