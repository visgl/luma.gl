# Development Environment

To get started developing luma.gl, first make sure to install all dependancies from the repository root:

`yarn bootstrap`

luma.gl's source code is in the `modules/` directory. Development is most easily done by running the examples in development mode, e.g.:

```
cd examples/core/instancing
yarn
yarn start-local
```

Any modifications made to the source or example code will cause the example to rebuild and the page to refresh, making quick iterations on code changes straightforward.

Testing against the full website can be done by running `yarn start` in the the `website/`. This full website take longer to build but makes it easier to test against all examples. This can be helpful when making core changes to luma.gl. As with running the examples in development mode, a rebuild and page refresh will be triggered whenever source or website code is updated.


## Testing

Testing is performed on Travis CI and using a precommit hook. Local testing is supported on these environments:

* `yarn test` - runs tests under node using headless.gl and a headless Chrome instance (using [SwiftShader](https://github.com/google/swiftshader)).
* `yarn test browser` - Tests in your browser, may be helpful to quickly debug test case failures since it autoreloads on changes and gives you full access to your browser's debugger.

When adding new features, please add relevant unit tests to the `test/` directory in the relevant module.

### Helpful Hints
- To only run one test from the suite for debugging purposes, change a call to `test` in the relevant spec to `test.only`. Remember to change this back before committing!
- If a test fails in `headless`, but not in the browser, it's likely due to a difference in the contexts created (WebGL 1 versus 2), or the extensions available. Running in a browser without WebGL 2 support (e.g. Safari), might help narrow the issue down.
