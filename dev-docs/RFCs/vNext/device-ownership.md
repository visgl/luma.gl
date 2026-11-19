# Device ownership and release

Status: Draft

## Motivation

WebGLDevice.destroy() currently skips cleanup when device reuse is enabled or the wrapper has been reused. Multiple acquisitions return the same Device, so a destroy call cannot identify which acquisition ended. WebGPUDevice.destroy() already distinguishes a GPUDevice created by luma.gl from one attached by the application.

## Exclusive destruction

An owner calls device.destroy() once it has finished using the device. Repeated calls are harmless. On return the wrapper is unusable, its internal resources and canvas observers are released, and future acquisitions cannot return the destroyed wrapper. Backend memory reclamation may finish asynchronously.

For a luma-owned GPUDevice, destroy the native device. For an exclusively owned WebGL context whose canvas the owner has permanently discarded, request context loss using WEBGL_lose_context when available. If the extension is unavailable, clean up luma-owned resources, detach the wrapper and allow browser reclamation. For an attached native handle, detach and clean up only the wrapper's resources. Attaching an application's context never grants authority to lose it. Creating a wrapper on a caller's canvas likewise does not establish permission to retire the canvas.

## Shared acquisition

Introduce an opt-in acquisition API that returns a distinct lease per successful acquisition. Its device property can refer to the same Device across acquisitions. Calling lease.release() is synchronous and idempotent per lease. It relinquishes one use. Calling destroy() on a managed shared Device should report a usage error without changing state. Existing raw-device acquisition and its reuse flag retain their existing behavior during migration. A lease around an existing raw device borrows it and cannot upgrade its ownership.

Track two independent facts in luma.gl: outstanding leases and whether the owner has requested permanent disposal. Reaching zero leases on a reusable canvas permits reacquisition. An explicit disposal request by its owner closes the acquisition path for that generation. Once the final lease is released, luma performs exclusive destruction exactly once. The disposal capability belongs to the owner and must remain usable after its own lease ends. Treat a pre-existing native context as borrowed unless the owner explicitly transfers authority. Arbitrary raw references cannot be counted, so callers sharing a managed device must hold a lease for their full use.

Reserve a use before asynchronous device creation starts. Concurrent acquisitions of the same backend context must share its initialization. On failure, clear the reservation and reject all waiters. A release or disposal during initialization must still take effect when initialization settles. Remove reuse records by identity so delayed cleanup cannot evict a later device.

## deck.gl integration

Deck.finalize() releases its acquisition, including when device creation is pending. Deck also requests disposal for a canvas it created and owns. Record ownership at creation. A Deck passed a raw device or gl releases its own resources and leaves disposal to the external owner.

When React creates the canvas, effect cleanup releases the Deck acquisition. The canvas owner requests disposal only after permanent discard. A StrictMode effect replay keeps the canvas available to the next acquisition. A detached canvas can be reattached, so DOM connectivity alone cannot grant disposal authority.

## Acceptance cases

- Exclusive destruction twice cleans up once on each backend. Attached handles still render after wrapper cleanup.
- Two consumers share one device. Releasing one lease twice leaves the other usable.
- Disposal before the final release and disposal after the final release each reclaim the owned device exactly once.
- A released reusable canvas can initialize another renderer. A disposed wrapper never reappears in a lookup.
- Pending initialization, failed initialization and missing WEBGL_lose_context all release their bookkeeping.
- Browser integration covers a StrictMode remount, a permanent React unmount, a supplied iframe canvas and a luma consumer that outlives Deck.
