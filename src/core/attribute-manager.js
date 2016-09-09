/* eslint-disable guard-for-in */
import {log} from '../utils';
import assert from 'assert';
function noop() {}

export default class AttributeManager {
  /**
   * @classdesc
   * Manages a list of attributes and an instance count
   * Auto allocates and updates "instanced" attributes as necessary
   *
   * - keeps track of valid state for each attribute
   * - auto reallocates attributes when needed
   * - auto updates attributes with registered updater functions
   * - allows overriding with application supplied buffers
   *
   * @class
   * @param {Object} [props]
   * @param {String} [props.id] - identifier (for debugging)
   */
  constructor({
    id = 'attribute-manager',
    ...otherProps
  } = {}) {
    this.id = id;
    this.attributes = {};
    this.allocedInstances = -1;
    this.needsRedraw = true;
    this.userData = {};

    this.onUpdateStart = noop;
    this.onUpdateEnd = noop;
    this.onLog = this._defaultLog;

    // For debugging sanity, prevent uninitialized members
    Object.seal(this);
  }

  /**
   * Returns all attribute descriptors
   * Format is suitable for use with luma.gl Model/Program
   * @return {Object} attributes - descriptors
   */
  getAttributes() {
    return this.attributes;
  }

  /**
   * Returns changed attribute descriptors
   * Format is suitable for use with luma.gl Model/Program
   * @return {Object} attributes - descriptors
   */
  getChangedAttributes({clearChangedFlags = false}) {
    const {attributes} = this;
    const changedAttributes = {};
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      if (attribute.changed) {
        attribute.changed = attribute.changed && !clearChangedFlags;
        changedAttributes[attributeName] = attribute;
      }
    }
    return changedAttributes;
  }

  /**
   * Returns the redraw flag, optionally clearing it.
   * Redraw flag will be set if any attributes attributes changed since
   * flag was last cleared.
   *
   * @param {Object} [opts]
   * @param {String} [opts.clearRedrawFlags=false] - whether to clear the flag
   * @return {Boolean} - whether a redraw is needed.
   */
  getNeedsRedraw({clearRedrawFlags = false} = {}) {
    let redraw = this.needsRedraw;
    redraw = redraw || this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
    return redraw;
  }

  /**
   * Sets the redraw flag.
   * @param {Boolean} redraw=true
   * @return {AttributeManager} - for chaining
   */
  setNeedsRedraw(redraw = true) {
    this.needsRedraw = true;
    return this;
  }

  /**
   * Adds attributes
   * Takes a map of attribute descriptor objects
   * - keys are attribute names
   * - values are objects with attribute fields
   *
   * attribute.size - number of elements per object
   * attribute.updater - number of elements
   * attribute.instanced=0 - is this is an instanced attribute (a.k.a. divisor)
   * attribute.noAlloc=false - if this attribute should not be allocated
   *
   * @example
   * attributeManager.add({
   *   positions: {size: 2, update: calculatePositions}
   *   colors: {size: 3, update: calculateColors}
   * });
   *
   * @param {Object} attributes - attribute map (see above)
   * @param {Object} updaters - separate map of update functions (deprecated)
   */
  add(attributes, updaters = {}) {
    this._add(attributes, updaters);
  }

  // Marks an attribute for update
  invalidate(attributeName) {
    const {attributes} = this;
    const attribute = attributes[attributeName];
    assert(attribute);
    attribute.needsUpdate = true;
    // For performance tuning
    this.onLog(1, `invalidated attribute ${attributeName} for ${this.id}`);
  }

  invalidateAll() {
    const {attributes} = this;
    for (const attributeName in attributes) {
      this.invalidate(attributeName);
    }
  }

  /**
   * Ensure all attribute buffers are updated from props or data.
   *
   * Note: Any preallocated buffers in "buffers" matching registered attribute
   * names will be used. No update will happen in this case.
   * Note: Calls onUpdateStart and onUpdateEnd log callbacks before and after.
   *
   * @param {Object} opts - options
   * @param {Object} opts.data - data (iterable object)
   * @param {Object} opts.numInstances - count of data
   * @param {Object} opts.buffers = {} - pre-allocated buffers
   * @param {Object} opts.props - passed to updaters
   * @param {Object} opts.context - Used as "this" context for updaters
   */
  update({
    data,
    numInstances,
    buffers = {},
    props = {},
    context = {},
    ...opts
  } = {}) {
    this.onUpdateStart(this.id);
    this._checkBuffers(buffers, opts);
    this._setBuffers(buffers);
    this._allocateBuffers({numInstances});
    this._updateBuffers({numInstances, data, props, context});
    this.onUpdateEnd(this.id);
  }

  /**
   * Sets log functions to help trace or time attribute updates.
   * Default logging uses luma logger.
   *
   * Note that the app may not be in control of when update is called,
   * so hooks are provided for update start and end.
   *
   * @param {Object} [opts]
   * @param {String} [opts.onLog=] - called to print
   * @param {String} [opts.onUpdateStart=] - called before update() starts
   * @param {String} [opts.onUpdateEnd=] - called after update() ends
   */
  setLogFunctions({
    onLog,
    onUpdateStart,
    onUpdateEnd
  } = {}) {
    this.onLog = onLog !== undefined ? onLog : this.onLog;
    this.onUpdateStart =
      onUpdateStart !== undefined ? onUpdateStart : this.onUpdateStart;;
    this.onUpdateEnd =
      onUpdateEnd !== undefined ? onUpdateEnd : this.onUpdateEnd;;
  }

  // DEPRECATED METHODS

  /**
   * @deprecated since version 2.5, use add() instead
   * Adds attributes
   * @param {Object} attributes - attribute map (see above)
   * @param {Object} updaters - separate map of update functions (deprecated)
   */
  addDynamic(attributes, updaters = {}) {
    this._add(attributes, updaters);
  }

  /**
   * @deprecated since version 2.5, use add() instead
   * Adds attributes
   * @param {Object} attributes - attribute map (see above)
   * @param {Object} updaters - separate map of update functions (deprecated)
   */
  addInstanced(attributes, updaters = {}) {
    this._add(attributes, updaters, {instanced: 1});
  }

  // PRIVATE METHODS

  // Default logger
  _defaultLog(level, message) {
    log.log(level, message);
  }

  // Set the buffers for the supplied attributes
  // Update attribute buffers from any attributes in props
  // Detach any previously set buffers, marking all
  // Attributes for auto allocation
  _setBuffers(bufferMap, opt) {
    const {attributes} = this;

    // Copy the refs of any supplied buffers in the props
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const buffer = bufferMap[attributeName];
      if (buffer) {
        attribute.isExternalBuffer = true;
        attribute.needsUpdate = false;
        if (attribute.value !== buffer) {
          attribute.value = buffer;
          attribute.changed = true;
          this.needsRedraw = true;
        }
      } else {
        attribute.isExternalBuffer = false;
      }
    }
  }

  // Auto allocates buffers for attributes
  // Note: To reduce allocations, only grows buffers
  // Note: Only allocates buffers not set by setBuffer
  _allocateBuffers({numInstances}) {
    const {allocedInstances, attributes} = this;
    assert(numInstances !== undefined);

    if (numInstances > allocedInstances) {
      // Allocate at least one element to ensure a valid buffer
      const allocCount = Math.max(numInstances, 1);
      for (const attributeName in attributes) {
        const attribute = attributes[attributeName];
        const {size, isExternalBuffer, update} = attribute;
        if (!isExternalBuffer && update) {
          const ArrayType = attribute.type || Float32Array;
          attribute.value = new ArrayType(size * allocCount);
          attribute.needsUpdate = true;
          this.onLog(
            2, `allocated ${allocCount} ${attributeName} for ${this.id}`);
        }
      }
      this.allocedInstances = allocCount;
    }
  }

  // Calls update on any buffers that need update
  _updateBuffers({numInstances, data, props, context}) {
    const {attributes} = this;

    // TODO? - If app supplied all attributes, no need to iterate over data

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const {needsUpdate, update} = attribute;
      if (needsUpdate) {
        if (update) {
          this.onLog(2, `autoupdating ${numInstances} ${attributeName}`);
          update.call(context, attribute, {data, props, numInstances});
        } else {
          this.onLog(2, `missing updater ${attributeName} for ${this.id}`);
        }
        attribute.needsUpdate = false;
        attribute.changed = true;
        this.needsRedraw = true;
      }
    }
  }

  // Checks that any attribute buffers in props are valid
  // Note: This is just to help app catch mistakes
  _checkBuffers(bufferMap = {}, opts = {}) {
    const {attributes, numInstances} = this;

    for (const attributeName in bufferMap) {
      const attribute = attributes[attributeName];
      const buffer = bufferMap[attributeName];
      if (!attribute && !opts.ignoreUnknownAttributes) {
        throw new Error(`Unknown attribute prop ${attributeName}`);
      }
      if (attribute) {
        if (!(buffer instanceof Float32Array)) {
          throw new Error('Attribute properties must be of type Float32Array');
        }
        if (attribute.auto && buffer.length <= numInstances * attribute.size) {
          throw new Error('Attribute prop array must match length and size');
        }
      }
    }
  }

  // Used to register an attribute
  _add(attributes, updaters = {}, _extraProps = {}) {

    const newAttributes = {};

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];

      // TODO - Deprecated: support for separate update function map
      if (attributeName in updaters) {
        attributes[attributeName] = {
          ...attribute,
          ...updaters[attributeName]
        };
      }

      // Check all fields and generate helpful error messages
      this._validate(attributeName, attribute);

      // Initialize the attribute descriptor, with WebGL and metadata fields
      const attributeData = {
        // Ensure that fields are present before Object.seal()
        target: undefined,
        isIndexed: false,

        // Reserved for application
        userData: {},

        // Metadata
        ...attribute,

        // State
        isExternalBuffer: false,
        needsUpdate: true,
        changed: true,

        // WebGL fields
        size: attribute.size,
        value: attribute.value || null,

        ..._extraProps
      };
      // Sanity - no app fields on our attributes. Use userData instead.
      Object.seal(attributeData);

      // Add to both attributes list (for registration with model)
      this.attributes[attributeName] = attributeData;
    }

    Object.assign(this.attributes, newAttributes);
  }

  _validate(attributeName, attribute) {
    assert(typeof attribute.size === 'number',
      `Attribute definition for ${attributeName} missing size`);

    // Check the updater
    assert(typeof attribute.update === 'function' || attribute.noAlloc,
      `Attribute updater for ${attributeName} missing update method`);
  }

}
