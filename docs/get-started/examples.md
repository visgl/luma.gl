# Examples

luma.gl contains a suite of examples that showcase various features of the framework. If you are curious to see what can be achieved by luma.gl, you are welcome to check out the live demos at [luma.gl's website](http://uber.github.io/luma.gl/#/examples/overview).

If you'd like to poke around the example code and use the examples to learn how to develop using luma.gl, you can build and run the examples yourself using the instructions below.


## Running Examples

If you'd like to poke around the example code and use them to learn how to develop using luma.gl, you can build and run the examples yourself, following the instruction below:

To run the examples, go to their directories, install and start, e.g:

```
cd examples/core/instancing
yarn         # or npm install
yarn start   # or npm start
```

## Using the Latest Release Branch

Note that luma.gl development happens on the `master` branch. While the goal is to always keep examples on `master` in working condition, they can temporarly be broken due to the core code being refactored for the next release. If you run into issues, or just want to be sure that you are running the latest stable version of the examples, just check out the latest release branch (e.g. `6.0-release`), and re-install and run the examples.

To see available release branches:

```
git branch | grep -release
```

To check out a release branch:

```
git checkout 6.0-release
```

To go back to master:

```
git checkout master
```


## Copying Examples

The examples are designed to be stand-alone so that they can be copied out of this repository, enabling you to use the examples as a basis for your own applications.

Note: You can delete the last line in the webpack config file. That line handles the case of building the examples against the local luma.gl source (see "Development Mode" below), which is no longer applicable once the examples have been copied out of the repository.


## Development Mode

Note that the `npm start` script in the example folders will use a published version of the luma.gl library (installed from npmjs.org) when bundling the code.

To run the examples against the local luma.gl source code (useful for development and testing of luma.gl itself), use the `npm run start-local` command in the examples.

```
cd examples/core/instancing
yarn              # or npm install
yarn start-local  # or npm run start-local
```
