# RFC Directory (luma.gl)

Implementation of non-trivial new luma.gl features should typically be started off with the creation of an RFC (Request for Comments) to make sure we have a complete story. It also allow the bigger team (as well as the community) to comment and contribute insights.

| RFC Status       | Description |
| ---              | --- |
| **Proposed**     | Call for an RFC to be written |
| **Draft**        | Work-in-progress, not ready for formal review |
| **Pre-Approved** | No major initial objections, draft pre-approved for prototyping |
| **Review**       | Ready for formal review |
| **Approved**     | Approved, ready for implementation |
| **Experimental** | Approved and implemented as experimental API |
| **Implemented**  | Approved and implemented (as officially supported API) |
| **Deferred**     | Review uncovered reasons not to proceed at this time |
| **Rejected**     | Review uncovered reasons not to proceed |

## Reviews

The core developers will review RFCs (and of course, comments from the community are always welcome). Recommended review criteria are being documented in [RFC Review Guidelines](../common/RFC-REVIEW-GUIDELINES.md).

## Longer-Terms RFCs

These are early ideas not yet associated with any release

| RFC | Author | Status | Description |
| --- | --- | --- | --- |
| **WIP/Draft** | | | |

Possible other animation related RFCs:
- integration with event handling (enter leave triggers for animations)


## v6.x RFCs

Current direction for luma.gl v6.x is to focus on:

* **GPGPU compute** - rich library for building and testing, WebGL1 fallbacks for transform feedback/floating point
* **shader modules** - shader module system improvements for GPGPU
* **performance** - especially shader compilation/linking execution performance
* **improved WebGL2 support** - more examples
* **code size**


## v6.0 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**Off-Thread (aka Off-Screen) Rendering**](v6.0/offscreen-render-rfc.md) | @pessimistress | **Review** | Use the new Off-Screen API to enable WebGL to run in a separate thread. |
| [**Portable GLSL 3.00 Shader Modules**](v6.0/vertex-array-attributes-rfc.md) | @ibgreen | **Draft** | |
| [**Centralize Attribute Management in VertexArray**](v6.0/portable-glsl-300-rfc.md) | @ibgreen | **Draft** | |
| [**Shadertools Improvements**](v6.0/shadertools-improvement-rfc.md) | @ibgreen | **Draft** | |
| [**Shader Module Injection**](v6.0/shader-module-injection-rfc.md) | @ibgreen | **Draft** | |
| [**Dist Size Reduction**](v6.0/reduce-distribution-size-rfc.md) | @ibgreen | **Draft** | Reduce luma.gl impact on app bundle size |


## v5.2 RFCs

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**New Transform Class**](v5.2/enhanced-transform-feedback-api.md) | @1chandu | **Review / Prototyped** | Simpler API for TransformFeedback |


## v5.0 RFCs

Release Focus: Address any WebGL2 issues from 4.0.

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**Break out Math Module**](v5.0/break-out-math-module-rfc.md) | @ibgreen | **Implemented** | Break out luma.gl math module |


## v4.0 RFCs

Version 4.0 focused on:
* Exposing the complete WebGL2 API
* Adding WebGL state management
* Shader module support
* Completing documentation


## v3.0 RFCs

Version 3.0 focused on improving luma.gl documentation
