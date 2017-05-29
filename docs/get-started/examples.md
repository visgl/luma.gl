# Examples

luma.gl contains a suite of stand-alone examples that can be used to test various features of the library

## Viewing Examples

Note that many of the examples can be viewed live on the luma.gl documentation website. But you can also build and run the examples yourself, see below.

## Running Examples

To run the examples, just go to their directories, install and start:

    cd examples/core/instancing
    yarn # or npm install
    npm start

## Copying Examples

The examples are designed to be stand-alone so that they can be copied out of this repository and used as the bases for your applications.

You may need to delete the last line in the webpack config file. That line handles the case of building against the local luma.gl source (see "Development Mode" below), which is not applicable once the examples have been copied out of the repository.

## Development Mode

Note that `npm start` will install an official version of luma.gl from npmjs.org and use that when bundling the code.

To run the examples against the luma.gl source code in this repository (for testing changes in luma.gl itself), use the `npm start-local` command in the examples.

    cd examples/core/instancing
    yarn # or npm install
    npm run start-local
