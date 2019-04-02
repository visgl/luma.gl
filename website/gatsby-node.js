// NOTE: It is possible to override the ocular-provided callbacks
// and this take control any aspect of gatsby:

// exports.onCreateNode = ({ node, actions, getNode }) =>
//   ocular.onCreateNode({ node, actions, getNode });

// exports.setFieldsOnGraphQLNodeType = ({ type, actions }) =>
//   ocular.setFieldsOnGraphQLNodeType({ type, actions });

// // This is a main gatsby entry point
// // Here we get to programmatically create pages after all nodes are created
// // by gatsby.
// // We use graphgl to query for nodes and iterate
// exports.createPages = ({ graphql, actions }) =>
//   ocular.createPages({ graphql, actions });

const config = require('./ocular-config');
const getGatsbyNodeCallbacks = require('ocular-gatsby/gatsby-node');

const callbacks = getGatsbyNodeCallbacks(config);

module.exports = callbacks;

const onCreateWebpackConfig = callbacks.onCreateWebpackConfig;

callbacks.onCreateWebpackConfig = function onCreateWebpackConfigOverride(opts) {
  onCreateWebpackConfig(opts);

  const {ocularConfig} = global || {};

  const {
    stage,     // build stage: ‘develop’, ‘develop-html’, ‘build-javascript’, or ‘build-html’
    getConfig, // Function that returns the current webpack config
    rules,     // Object (map): set of preconfigured webpack config rules
    loaders,   // Object (map): set of preconfigured webpack config loaders
    plugins,    // Object (map): A set of preconfigured webpack config plugins
    actions
  } = opts;


  console.log(JSON.stringify(Object.keys(actions)));

  console.log(`App rewriting gatsby webpack config`);


  const config = getConfig();

  // Recreate it with custom exclude filter
  const newJSRule = Object.assign(loaders.js(), {
    // Called without any arguments, `loaders.js` will return an
    // object like:
    // {
    //   options: undefined,
    //   loader: '/path/to/node_modules/gatsby/dist/utils/babel-loader.js',
    // }
    // Unless you're replacing Babel with a different transpiler, you probably
    // want this so that Gatsby will apply its required Babel
    // presets/plugins.  This will also merge in your configuration from
    // `babel.config.js`.

    // JS and JSX
    test: /\.jsx?$/,

    // Exclude all node_modules from transpilation, except for ocular
    exclude: modulePath =>
      /node_modules/.test(modulePath) &&
      !/node_modules\/(ocular|ocular-gatsby|gatsby-plugin-ocular)/.test(modulePath),
  });

  const newConfig = {
    module: {
      rules: [
        ...config.module.rules,
        // Omit the default rule where test === '\.jsx?$'
        newJSRule
      ]
    },
    node: {
    	fs: 'empty'
    }
  };


  // Completely replace the webpack config for the current stage.
  // This can be dangerous and break Gatsby if certain configuration options are changed.
  // Generally only useful for cases where you need to handle config merging logic yourself,
  // in which case consider using webpack-merge.
  actions.setWebpackConfig(newConfig);

  /*
  log.log({color: COLOR.YELLOW, priority: 2}, `Webpack delta config ${JSON.stringify(newConfig, null, 2)}`)();

  // UNCOMMENT TO DEBUG THE CONFIG
  config = getConfig();
  const jsRules = config.module.rules.filter(rule => String(rule.test) === String(/\.jsx?$/))
  const oldJSRule = jsRules[0];

  log.log({color: COLOR.CYAN, priority: 1},
    `Webpack started with aliases ${JSON.stringify(config.resolve.alias, null, 2)}`)();

  log.log({color: COLOR.MAGENTA, priority: 3},
    `Webpack config
rules ${JSON.stringify(jsRules[0])} => ${JSON.stringify(newJSRule)}
test ${oldJSRule.test} => ${newJSRule.test}
include ${oldJSRule.include} => ${newJSRule.include}
exclude ${oldJSRule.exclude} => ${newJSRule.exclude}`
  )();
  */
}