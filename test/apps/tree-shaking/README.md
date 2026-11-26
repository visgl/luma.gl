# Legacy tree-shaking fixture

The repository's supported bundle-size check is `yarn bundle-size` from the
repository root. From this directory, run `yarn --cwd ../../.. bundle-size`.
The root command uses the current package entry points and the same WebGL
constant transform as the package build.

This directory retains the original instancing source as a historical fixture.
