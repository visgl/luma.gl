# Installation

Use npm or yarn to install luma.gl
```sh
npm install --save luma.gl
yarn add luma.gl
```

## Developing

Use `npm start` to run the test server, it will open a web page from which you can access the examples and lessons, and automatically update when you save modified source files.


## Testing

Testing is performed on Travis CI and using a precommit hook. Local testing is supported on three environments
* `npm test` - runs `npm run test-headless`
* `npm run test-browser` - Tests in your browser, may be helpful to quickly debug test case failures since it autoreloads on changes and gives you full access to your browser's debugger.

When adding new features, or modifying existing ones, carefully consider if unit testing can be provided.
