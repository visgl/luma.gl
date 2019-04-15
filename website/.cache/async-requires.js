// prefer default export if available
const preferDefault = m => (m && m.default) || m;

exports.components = {
  'component---node-modules-ocular-gatsby-src-templates-index-jsx': () =>
    import('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/index.jsx' /* webpackChunkName: "component---node-modules-ocular-gatsby-src-templates-index-jsx" */),
  'component---node-modules-ocular-gatsby-src-templates-doc-n-jsx': () =>
    import('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/doc-n.jsx' /* webpackChunkName: "component---node-modules-ocular-gatsby-src-templates-doc-n-jsx" */),
  'component---node-modules-ocular-gatsby-src-templates-examples-jsx': () =>
    import('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/examples.jsx' /* webpackChunkName: "component---node-modules-ocular-gatsby-src-templates-examples-jsx" */),
  'component---node-modules-ocular-gatsby-src-templates-example-n-jsx': () =>
    import('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/example-n.jsx' /* webpackChunkName: "component---node-modules-ocular-gatsby-src-templates-example-n-jsx" */),
  'component---node-modules-ocular-gatsby-src-templates-search-jsx': () =>
    import('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/search.jsx' /* webpackChunkName: "component---node-modules-ocular-gatsby-src-templates-search-jsx" */),
  'component---cache-dev-404-page-js': () =>
    import('/Users/tsherif/code/luma.gl/website/.cache/dev-404-page.js' /* webpackChunkName: "component---cache-dev-404-page-js" */)
};

exports.data = () =>
  import(/* webpackChunkName: "pages-manifest" */ '/Users/tsherif/code/luma.gl/website/.cache/data.json');
