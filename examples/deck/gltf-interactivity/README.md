# KHR_interactivity + deck.gl ScenegraphLayer

This private example renders the Khronos `flow/branch` GLB and executes its authored
42-node behavior graph with `GLTFInteractivity`.

Click **Run checks** or click the model to run the graph. Its branches update source-node
translations to bring the textured pass/fail icons forward. Four successful checks emit
`test/onSuccess`. Click the model again or **Reset** to restore the original scene. The
collapsible information panel displays graph diagnostics and the final custom event.

The loader preserves `KHR_texture_transform` for luma's PBR material renderer instead of
baking the atlas into UV sets beyond the renderer's two supported UV channels. The scene
retains its icon materials, alpha masks, atlas offsets, and atlas scales. Small atlas
glyphs are hidden and replaced by dark, pixel-sized billboard labels on lighter plates
so the conditions remain readable in a narrow window.

Run `yarn start` in this directory. The asset is served from Khronos GitHub and requires
internet access. This example exercises one authored graph; it is not a Khronos conformance
claim or an implementation of every interactivity operation.

Source: https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity/tree/main/Tests/Interactivity/flow/branch
