# Contributing

luma.gl welcomes contributions from the community. Smaller fixes 

In order to contribute to luma.gl you need to be able to build and test luma.gl itself.

## Development Environment

To get started developing luma.gl, 
first you will want to clone the github repository (or your fork of the repository).

```
git clone git@github.com:visgl/luma.gl.git
```

Make sure to install all dependencies from the repository root:

`yarn bootstrap`

luma.gl's source code is in the `modules/` directory. Development is most easily done by running the examples in development mode, e.g.:

```
cd examples/core/instancing
yarn
yarn start-local
```

Any modifications made to the source or example code will cause the example to rebuild and the page to refresh, making quick iterations on code changes straightforward.

Testing against the full website can be done by running `yarn start` in the `website/`. This full website take longer to build but makes it easier to test against all examples. This can be helpful when making core changes to luma.gl. As with running the examples in development mode, a rebuild and page refresh will be triggered whenever source or website code is updated.

## Testing

Testing is performed on Travis CI and using a precommit hook. Local testing is supported on these environments:

- `yarn test` - runs tests under node using headless.gl and a headless Chrome instance (using [SwiftShader](https://github.com/google/swiftshader)).
- `yarn test browser` - Tests in your browser, may be helpful to quickly debug test case failures since it autoreloads on changes and gives you full access to your browser's debugger.

When adding new features, please add relevant unit tests to the `test/` directory in the relevant module.

### Helpful Hints

- To only run one test from the suite for debugging purposes, change a call to `test` in the relevant spec to `test.only`. Remember to change this back before committing!
