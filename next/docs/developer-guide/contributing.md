# Contributing

[Overview](https://luma.gl/next/docs/developer-guide.md)[Installing](https://luma.gl/next/docs/developer-guide/installing.md)[AI Agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)

luma.gl welcomes contributions from the community. Smaller fixes

In order to contribute to luma.gl you need to be able to build and test luma.gl itself.

## Development Environment[​](#development-environment "Direct link to Development Environment")

To get started developing luma.gl, first you will want to clone the github repository (or your fork of the repository).

```
git clone git@github.com:visgl/luma.gl.git
```

Make sure to install all dependencies from the repository root:

`yarn install`

luma.gl's source code is in the `modules/` directory. Development is most easily done by running the examples in development mode, e.g.:

```
cd examples/core/instancing

yarn

yarn start-local
```

Any modifications made to the source or example code will cause the example to rebuild and the page to refresh, making quick iterations on code changes straightforward.

Testing against the full website can be done after the root install by running `yarn website:start`. This full website take longer to build but makes it easier to test against all examples. This can be helpful when making core changes to luma.gl. As with running the examples in development mode, a rebuild and page refresh will be triggered whenever source or website code is updated.

## Testing[​](#testing "Direct link to Testing")

Testing is performed on Travis CI and using a precommit hook. Local testing is supported on these environments:

* `yarn test` - runs tests under node using headless.gl and a headless Chrome instance (using [SwiftShader](https://github.com/google/swiftshader)).
* `yarn test browser` - Tests in your browser, may be helpful to quickly debug test case failures since it autoreloads on changes and gives you full access to your browser's debugger.

When adding new features, please add relevant unit tests to the `test/` directory in the relevant module.

### Helpful Hints[​](#helpful-hints "Direct link to Helpful Hints")

* To only run one test from the suite for debugging purposes, change a call to `test` in the relevant spec to `test.only`. Remember to change this back before committing!
