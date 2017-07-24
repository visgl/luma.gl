# Examples

luma.gl contains a suite of stand-alone examples that can be used to learn the various features of the framework. 

If you are just curious to see what can be achieved by luma.gl, you are welcome to check luma.gl's website at luma.gl. Examples are presented live there.

## Running Examples

If you'd like to poke around the example and see learn how to develop using luma.gl, you can build and run the examples yourself, following the instruction below:

To run the examples, go to their directories, install and start:

    cd examples/core/instancing
    yarn # or npm install
    npm start

## Copying Examples

The examples are designed to be stand-alone so that they can be copied out of this repository and used as the bases for your applications.

You may need to delete the last line in the webpack config file. That line handles the case of building against the local luma.gl source (see "Development Mode" below), which is not applicable once the examples have been copied out of the repository.

## Development Mode

Note that `npm start` will install a published version of luma.gl from npmjs.org and use that when bundling the code.

To run the examples against the local luma.gl source code (usually for development of luma.gl itself), use the `npm start-local` command in the examples.

    cd examples/core/instancing
    yarn # or npm install
    npm run start-local
