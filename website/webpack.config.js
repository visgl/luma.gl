const {resolve, join} = require('path');
const webpack = require('webpack');

const rootDir = join(__dirname, '..');
const libSources = join(rootDir, 'src');

const ALIASES = require('../aliases');

// Otherwise modules imported from outside this directory does not compile
// Seems to be a Babel bug
// https://github.com/babel/babel-loader/issues/149#issuecomment-191991686
const BABEL_CONFIG = {
  presets: [
    'es2015',
    'react',
    'stage-2'
  ].map(name => require.resolve(`babel-preset-${name}`)),
  plugins: [
    // website uses decorators
    require.resolve('babel-plugin-transform-decorators-legacy'),
    resolve(__dirname, '../modules/babel-plugin-inline-gl-constants')
  ]
};

const COMMON_CONFIG = {
  mode: 'development',

  entry: ['./src/main'],

  output: {
    filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        // Compile ES2015 using babel
        test: /\.js$/,
        loader: 'babel-loader',
        options: BABEL_CONFIG,
        include: [resolve('..'), libSources],
        exclude: [/node_modules/]
      }, {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      }, {
        test: /\.(eot|svg|ttf|woff|woff2|gif|jpe?g|png)$/,
        loader: 'url-loader'
      }
    ]
  },

  resolve: {
    modules: [
      resolve(__dirname, './node_modules'),
      resolve(__dirname, '../node_modules')
    ],

    alias: Object.assign({}, ALIASES, {
    // TODO: need better way to expose math.gl to examples instead of this line
      'math.gl': join(__dirname, 'node_modules/math.gl')
    })
  },

  node: {
    fs: 'empty'
  },

  plugins: []

};

const addDevConfig = config => {

  config.module.rules.push({
    // Unfortunately, webpack doesn't import library sourcemaps on its own...
    test: /\.js$/,
    use: ['source-map-loader'],
    enforce: 'pre'
  });

  return Object.assign(config, {

    devtool: 'source-maps',

    plugins: config.plugins.concat([
      // new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ])

  });

};

const addProdConfig = config => {
  return Object.assign(config, {
    mode: 'production',

    output: {
      path: resolve(__dirname, './dist'),
      filename: 'bundle.js'
    }
  });
};

// Different versions of webpack supply objects or arrays
const getEnv = env => {
  if (Array.isArray(env)) {
    return env.reduce((key, obj) => {
      obj[key] = true;
    }, {});
  }

  if (typeof env === 'string') {
    return {[env]: true};
  }

  return env || {};
};

module.exports = env => {
  env = getEnv(env);

  let config = COMMON_CONFIG;

  if (env.local) {
    config = addDevConfig(config);
  }

  if (env.prod) {
    config = addProdConfig(config);
  }

  // Enable to debug config
  // console.warn(JSON.stringify(config, null, 2));

  return config;
};
