# What's Next?

:::caution
The tutorial pages have not yet been updated for luma.gl v9. 
:::

That concludes our **luma.gl** tutorial series. If you went through the full set of tutorials, you've taken a deep dive into some of **luma.gl**'s more powerful features, including polyfilling the WebGL context, shader modules and composition, instanced drawing, and transform feedback. To dig deeper into **luma.gl**'s API, we recommend playing around with the examples in the [examples directory](https://github.com/visgl/luma.gl/tree/9.2-release/examples/core) of the repository, which demonstrate various parts of the API in more detail. They can also be browsed on the [website](https://luma.gl/examples).

To explore the examples, clone the **luma.gl** repo and run the following in a given example's directory:

```bash
git clone git@github.com:uber/luma.gl.git
cd luma.gl/examples/showcase/instancing
git checkout 8.1-release
yarn
yarn start
```

This will start a local development server and open the page in your browser. The main application code is in `app.js` and the page will automatically refresh whenever it's udpated.

Note that we checkout the latest release branch here (`8.1-release`), which is recommended as `master` is the active development branch.

Happy exploring!
