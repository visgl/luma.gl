# Inside a Transformer

An interactive, scroll-driven luma.gl showcase that illustrates a transformer language model as a
ten-stage visual story. The forward pass covers tokenization, embedding, multi-head attention,
feed-forward transformation, and next-token prediction. Learning then slows down across loss,
output derivatives, MLP backpropagation, attention backpropagation, and the optimizer update.

The diagram is explanatory rather than a trace from a particular model. A single full-screen
luma.gl `Model` renders the animated network, signal pulses, causal attention map, hidden units,
output distribution, and projected 3D gradient-descent surface. HTML overlays provide accessible
labels and controls. In the loss and backpropagation chapters, drag the canvas to orbit the surface
or use the wheel to zoom. Chapter-specific concept hotspots explain the math and architecture on
hover or keyboard focus.

Run from this directory with `yarn start`, or build with `yarn build`.
