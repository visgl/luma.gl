const {hot} = require('react-hot-loader/root');

// prefer default export if available
const preferDefault = m => (m && m.default) || m;

exports.components = {
  'component---node-modules-ocular-gatsby-src-templates-index-jsx': hot(
    preferDefault(
      require('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/index.jsx')
    )
  ),
  'component---node-modules-ocular-gatsby-src-templates-doc-n-jsx': hot(
    preferDefault(
      require('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/doc-n.jsx')
    )
  ),
  'component---node-modules-ocular-gatsby-src-templates-examples-jsx': hot(
    preferDefault(
      require('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/examples.jsx')
    )
  ),
  'component---node-modules-ocular-gatsby-src-templates-example-n-jsx': hot(
    preferDefault(
      require('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/example-n.jsx')
    )
  ),
  'component---node-modules-ocular-gatsby-src-templates-search-jsx': hot(
    preferDefault(
      require('/Users/tsherif/code/luma.gl/website/node_modules/ocular-gatsby/src/templates/search.jsx')
    )
  ),
  'component---cache-dev-404-page-js': hot(
    preferDefault(require('/Users/tsherif/code/luma.gl/website/.cache/dev-404-page.js'))
  )
};
