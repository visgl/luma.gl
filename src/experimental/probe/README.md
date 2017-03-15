# uber-probe

A debug library - Created to instrumenting applications to get timings in
browser console or in node. The name Probe relates to the concept of
instrumenting your application by injecting probes (intelligent information
collection checkpoints) into its source code. The probes then collect data
about your application when you run it.

In addition to instrumentation Probe also supports a number of other debug
related facilities, such as console log interception, global context in
debugger etc.


## Features

* **Configuration Support** - Probe persists its configuration via cookies and
  and makes any flags and values available to your app. You can add a new
  feature check to your code without having to do any additional plumbing.

* **Multiple high-resolution timers** - Your "probes" log both time
  since operation start and delta time since last probe.
  Timing metrics received e.g. from a server
  can be presented as part of client side timings.
    * **Samples** - measuring repeated calls, average times, log throttling.
    * **FPS** - Can trace FPS.
    * **Tabulation** - Can generate tables of samples.
    * **JSON log format** - Simplifies copy/paste of log probe output into other apps.
    * **High Resolution Timer** - traces at submillisecond level.

* **Off by Default** Probe also reads some predefined keys from the URL hash
  that control whether probe is active or not. So you have the option of leaving
  probe in production code. Built-in options include
  enabling probe, setting log level, help etc.

* **Supports Node and Browser** - Uses platform specific versions of
  facilities like high resolution timers.

## Installation

```
npm install uber-probe
```

## Usage

### Configure instrumentation level using URL parameters.

Probe can be enabled in code or in the Chrome console at runtime. Because Probe
stores its state in a cookie, enabling or disabling Probe or specific options
persists across browser sessions.

Enable Probe logging and features:
```
Probe.enable();
```

Set levels:
```
Probe.setLevel(2);
```

Most Probe config methods are chainable:
```
Probe.enable().setLevel(2).configure({isPrintEnabled: false});
```

### Read configuration to enable/disable features in development

In your code:
```
import Probe from `uber-probe`;

if (Probe.getOption('mySnazzyFeature')) {
  enableSnazzyFeature();
}
```

In the console, for development testing:
```
Probe.configure({mySnazzyFeature: true});
```

### Probe and production code

Probe is designed so that you have the option of keeping your instrumentation
in production code. Unless you enable Probe, all Probe methods effectively
become no-ops.

### Access to Probe in the debugger

Probe does not attach itself to the `window` context by default. You may want to
do this when your app is initialized:

```
import Probe from `uber-probe`;
window.Probe = Probe;
```

### Access to your own functions in the debugger

If you want to access your functions in the browser console, simply attach
them to the Probe scope and they will be available on the `Probe` global
variable.

```
import AppStore from './store';

Probe.getAppState() {
  console.log(JSON.stringify(AppStore.getState(), null, '  '));
}
```

### Profiling Support

Profiling is primary purpose of the probe library. It has a complement of
methods (i.e. "probes") that you can add to your application to log
timings. Each method comes in several variants, which correspond to three
different log levels, allowing you to control the amount of log detail
by setting the probe level.


#### Cross-Module Profiling

Probe uses global data to ensure that you are working
against the same clocks even if you happen to load multiple instances
or versions of the probe module in different modules.

### Warning and Error Handlers

Probe contains a number of optional console intercepts that can be
enabled to:
* Treat warnings as hard errors (i.e exceptions that can trigger breakpoints)
* Break on warnings and errors (Probe can trigger the debugger directly)
* Detect rejected promise errors - optionally
  calling window.onerror with the error or calling the proposed
  rejected promise handler.

## IDEAS/TODOs

* Read options from node command line
* Read options from URL query string (when hash is used by app router)
* Detect production builds
