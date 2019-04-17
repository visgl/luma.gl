# Examples

luma.gl's suite of examples are an excellent way to learn how to use the API. They're the same examples showcased on the [website](http://uber.github.io/luma.gl/#/examples/overview), but can be run and edited individually.

## Running Examples

To run the examples, go to their directories, install and start, e.g:

```
cd examples/core/instancing
yarn
yarn start
```

This will start a local development server and open the page in your browser. The example code will be in `app.js` in the example directly will automatically refresh the page.

## Using the Latest Release Branch

Note that luma.gl's `master` branch is its development branch and is often in flux. To ensure you're working with stable code, simply check out one of the release branches, e.g.

`git checkout 7.0-release`

To see all available release branches:

```
git branch | grep -release
```
