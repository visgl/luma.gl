# Using with other WebGL Libraries

luma.gl takes a number of steps to make it possible to use luma.gl with other WebGL libraries.

* Work with any `WebGLRendingContext` - To maximize interoperability with WebGL code that does not use luma.gl, the WebGLRendingContext type does not have a corresponding luma.gl wrapper class, but is instead used directly by the luma.gl API. A simple global function is provided to help in creating gl contexts. Making luma.gl classes take a gl context directly means that they can be used with contexts created by other frameworks.

* State Management - one of the biggest problems when sharing code between WebGL frameworks is the fact that so much global state, affecting rendering and even other WebGL operations, is stored on the `WebGLRendingContext`, which means that changes to parameters and settings made by one framework, or even the app itself, can break another framework. This is made even worse by the fact that querying context state is a very expensive operation in WebGL. This makes it impractical for apps that care about performance to try to reset the global context to its previous value after changing it. luma.gl provides an advanced solution for WebGL state management, efficiently tracking context state changes as they happen and restoring context to their state after operations requiring special parameters complete.
