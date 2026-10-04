# Globe cloud cover

A deck.gl GlobeView scene with an animated, ray-marched spherical cloud shell on WebGPU and WebGL2.

`GlobeCloudLayer` uses the existing `clouds` density, noise and lighting functions. Positions and rays use planet-radius units; cloud altitude, thickness, scale and velocity remain in metres and seconds. The example accelerates drift so movement is visible at a global scale. These are procedural formations, not observed weather data.

The example-owned Earth surface reuses the texture from the existing globe showcase. Cloud coverage is continuous across the longitude seam and poles. The shell is depth tested, does not write depth or participate in picking, and is clipped at the planet surface. Sun direction uses globe-centered XYZ coordinates.

Run `yarn workspace luma.gl-examples-deck-globe-clouds start`. Select WebGPU or WebGL2 using Device. Drag to rotate and scroll to zoom; Center restores the initial view.
