# What's Next?

That concludes our luma.gl tutorial series. To dig deeper into luma.gl's API, we recommend playing around with the examples in the [examples directory](https://github.com/uber/luma.gl/tree/master/examples/core) of the repository, which demonstrate various parts of the API in more detail. They can also be browsed on the [website](https://luma.gl/examples).

To run the examples, clone the repo and run the examples from their directory:

```bash
git clone git@github.com:uber/luma.gl.git
cd luma.gl/examples/core/instancing
git checkout 8.0-release
yarn
yarn start
```

This will start a local development server and open the page in your browser. The main application code is in `app.js` and the page will automatically refresh whenever it's udpated.

Note that we checkout the latest release branch here (`8.0-release`), which is recommended as `master` the active developmentment branch.
