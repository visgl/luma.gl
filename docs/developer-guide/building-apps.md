# Building Apps

This article contains additional information on options for how to build luma.gl.


## Optimizing for Bundle Size

luma.gl and luma.gl provide a lot of functionality and the amount of code these libraries contain will of course impact the size of your application bundle and your startup load time.

There are multiple techniques used in JavaScript.


### Choosing a dist folder

When installed from npm, luma.gl and related libraries come with three separate `dist` sub folders.

| Folder     | `mainField` | Description   |
| ---        | ---         | --- |
| `dist/es6` | `esnext`    | The most compact distribution is with very few exceptions essentially untranspiled ES6/ES2015 code (via `babel-preset-env`). This is the smallest distribution, and is the best choice if you are only targeting modern "evergreen" browsers (e.g. not IE11 or older mobile devices). |
| `dist/esm` | `module`    | Same as `dist/es5`, except `export` and `import` statements are left untranspiled to enable tree shaking. The main reason to use this distribution is if your are targeting older browsers (e.g. IE11 or older mobile devices). |
| `dist/es5` | `main`      | All code is transpiled into ES5 and exports/imports are transpiled into `commonjs` requires. The main reason to use this distribution is if your bundler does not support tree-shaking using `import`/`export` syntax. |

You will have to check the documentation of your particular bundler to see what configuration options are available:

* Webpack 2 and later will pick the `esm` distribution by default (the `module` main field)
* Webpack 4 allows you to choose the `esnext` distribution by specifying a new `resolve.mainFields` array in your application's webpack config.
* For other bundlers, please refer to the respective documentation to see if you can control which distribution to use. If not, expect the `es5` distribution to be used.


### About Tree-Shaking

luma.gl is designed to fully leverage tree-shaking. Tree-shaking should be possible with any supporting browser but development has currentle focusing on enabling the webpack 4 + babel 7 combination which provides excellent results.

Some things to be aware of when working with tree-shaking:

* At least in Webpack, tree shaking is done by the uglifier, which is typically only run as the very last step on production builds. This means that it is typically not possible to assess the benefits of tree shaking during development.
* The lack of tree-shaking during development makes it hard to make statements about bundle size impact of a library just from looking at bundle sizes of development builds or the size of the library's npm module. Our recommendation is to always measure impact on your actual production builds.


### Pay for What you Use

Naturally, an application that uses all the functionality offered by a framework will benefit little from tree shaking, whereas a small app that only uses a few selected components should expect big savings.

When we modularize luma.gl, we are less focused on the size of the entire library, and more on making sure that applications only pay for the features they actually use. Also we try to make the core set of functionality small.


### Bundle Size Numbers

So, what kind of impact on bundle sizes should you expect when using luma.gl? When do you know if you have set up your bundler optimally. To help answer these questions, we provide some numbers you can compare against. luma.gl has scripts that measure the size of a minified bundle after each build, which allows us to provide comparison numbers between releases. This bundle imports the `Module` and `AnimationLoop` classes, which are the basic building blocks of most apps.

| es6-production  | 6.1 Bundle/Zip | 6.0 Bundle/Zip |
| ---             | ---            | ---            |
| es6-production  | 144KB  / 42KB  | 181KB  / 51KB  |
| esm-production  | 209KB  / 49KB  | 281KB  / 66KB  |
| es5-production  | 408KB  / 88KB  | 422KB  / 93KB  |
| es6-development | 787KB  / 123KB | 926KB  / 165KB |
| esm-development | 1048KB / 150KB | 1167KB / 192KB |
| es5-development | 961KB  / 142KB | 1052KB / 182KB |


* Numbers represent the minified bundle size of a minimal application, bundled with Webpack 4, which means that the `ES6` and ESM numbers benefit from tree shaking.
* The number in parenthesis are the compressed bundle sizes. This is an indication of the how much extra size will be added to your compressed app bundle if you import luma.gl.
* For the ES6 and ESM dists, apps that use more luma.gl classes and features will see an increase in bundle size.


### Future Work

This is not the final word on luma.gl bundle size. More work is being done to reduce the size of luma.gl and we are confident that even as fture releases will have more functionality, we will be able to keep the library code from growing and, more importantly, make luma.gl even more "tree shakeable", with the intention that apps should only "pay for what they use".


## Remarks

* **Optimizing for minified code** - Due to inclusion of sourcemaps etc, the bundle size impact of luma.gl tends to look more significant in development builds than in the final production builds. While reducing the size of the development libraries is also desirable, the current goal is to ensure the impact of adding luma.gl on the final, minified/uglified application bundle is as small as possible.
* Compressed bundle sizes are calculated using `gzip -9`. Consider using slower `brotli` compression for static assests, it typically provides an additional 20% reduction.
