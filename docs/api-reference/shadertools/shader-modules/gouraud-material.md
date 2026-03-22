# gouraudMaterial

The `gouraudMaterial` shader module provides functions to apply Gouraud shading
with a simple specular model per vertex. It is typically faster than
`phongMaterial`, but highlight quality is lower because lighting is evaluated
at vertices instead of fragments.
