# ocular (gatsby version)

> Note: This documentation is for the newer gatsby-based version of ocular. In addition to the gatsbyjs-based generator, Ocular also support a "classic" variant for backwards compatibility. This version is not maintained and new sites should be built using the gatsbyjs-based generator. See documentation on [github]().


Ocular is a tool primarily designed for building documentation websites for github-based javascript frameworks, built using the gatsbyjs documentation generation system.

Using ocular in your framework requires:
* a directory with github markdown
* examples...


## Quick Setup

If you already have markdown documentation written for your framework, setting up an initial ocular based page is very quick:

* Create a `website` folder in your framework repository's root folder.
* Create a package.json and install `ocular` in the website folder.
* Create the file `website/gatsby-config.js`, copied from ...
* Create the file `website/gatsby-node.js`, copied from ...
* Create the file `website/site-config.js`, copied from and modified to fit your site.
* Create a `table-of-contents.json` at the root of your markdown documentation folder.


## Deep Configuration

Since your website contains the gatsbyjs entry point files (`gatsby-config.js` and `gatsby-node.js`) it is possible to take full control and override selected parts of ocular's documenation generation system.

The ocular package exports most internal components used by ocular so that you can reuse them in building customized functionality.


## Functions

### getGatsbyConfig(options : Object) : Object

This function takes your site configuration object and builds a complete gatsby configuration object, and populates it with a number of preinstalled plugins. This object is intended to be passed to gatsby as the exported value from your `website/gatsby-config.js` file.

`getGatsbyConfig` is intended to be called in your `website/gatsby-config.js` file as follows:

```
require('reify'); // Enables ES6 "import" in imported files

const {setSiteConfig, getGatsbyConfig} = require('./ocular/gatsby');

const config = require('./ocular-config');

setSiteConfig(config);

module.exports = getGatsbyConfig(config);
```

NOTE: You can forward the returned object directly to gatsby, or you can modify it first, e.g. to delete or add plugins before passing it on to gatsby. Consult [gatsby docs](https://www.gatsbyjs.org/) for more information on `gatsby-config.js` options.


### getGatsbyNodeCallbacks() : Object

Forward these callbacks to gatsby in your `website/gatsby-node.js` file to set up default ocular configuration.

```
require('reify'); // Enables ES6 "import" in imported files
const {getGatsbyNodeCallbacks} = require('./ocular/gatsby');

module.exports = getGatsbyNodeCallbacks();
```

NOTE: It is possible to override the ocular-provided callbacks and thus take full control of any aspect of gatsby's document generation process. Consult [gatsby docs](https://www.gatsbyjs.org/) for more information on `gatsby-node.js` callbacks.

```
require('reify'); // Enables ES6 "import" in imported files
const {getGatsbyNodeCallbacks} = require('./ocular/gatsby');

module.exports = getGatsbyNodeCallbacks();
module.exports.onCreateNode = ({ node, actions, getNode }) => {
  // Do other things
  ...
  /// Call ocular default handling (or not)
  getGatsbyNodeCallbacks.onCreateNode({ node, actions, getNode });
};
```


## Components

ocular provides a number of common React components that can be used to create custom pages.


### Layouts

Layout components are components that remain static between pages


#### Header


#### Footer


#### Table of Contents


### Common Components


#### SEO

Search engine optimization helper
