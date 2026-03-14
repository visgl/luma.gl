// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { assert } from '../utils/assert';
/** Minimal validators for number and array types */
const DEFAULT_PROP_VALIDATORS = {
    number: {
        type: 'number',
        validate(value, propType) {
            return (Number.isFinite(value) &&
                typeof propType === 'object' &&
                (propType.max === undefined || value <= propType.max) &&
                (propType.min === undefined || value >= propType.min));
        }
    },
    array: {
        type: 'array',
        validate(value, propType) {
            return Array.isArray(value) || ArrayBuffer.isView(value);
        }
    }
};
/**
 * Parse a list of property types into property definitions that can be used to validate
 * values passed in by applications.
 * @param propTypes
 * @returns
 */
export function makePropValidators(propTypes) {
    const propValidators = {};
    for (const [name, propType] of Object.entries(propTypes)) {
        propValidators[name] = makePropValidator(propType);
    }
    return propValidators;
}
/**
 * Validate a map of user supplied properties against a map of validators
 * Inject default values when user doesn't supply a property
 * @param properties
 * @param propValidators
 * @returns
 */
export function getValidatedProperties(properties, propValidators, errorMessage) {
    const validated = {};
    for (const [key, propsValidator] of Object.entries(propValidators)) {
        if (properties && key in properties && !propsValidator.private) {
            if (propsValidator.validate) {
                assert(propsValidator.validate(properties[key], propsValidator), `${errorMessage}: invalid ${key}`);
            }
            validated[key] = properties[key];
        }
        else {
            // property not supplied - use default value
            validated[key] = propsValidator.value;
        }
    }
    // TODO - warn for unused properties that don't match a validator?
    return validated;
}
/**
 * Creates a property validator for a prop type. Either contains:
 * - a valid prop type object ({type, ...})
 * - or just a default value, in which case type and name inference is used
 */
function makePropValidator(propType) {
    let type = getTypeOf(propType);
    if (type !== 'object') {
        return { value: propType, ...DEFAULT_PROP_VALIDATORS[type], type };
    }
    // Special handling for objects
    if (typeof propType === 'object') {
        if (!propType) {
            return { type: 'object', value: null };
        }
        if (propType.type !== undefined) {
            return { ...propType, ...DEFAULT_PROP_VALIDATORS[propType.type], type: propType.type };
        }
        // If no type and value this object is likely the value
        if (propType.value === undefined) {
            return { type: 'object', value: propType };
        }
        type = getTypeOf(propType.value);
        return { ...propType, ...DEFAULT_PROP_VALIDATORS[type], type };
    }
    throw new Error('props');
}
/**
 * "improved" version of javascript typeof that can distinguish arrays and null values
 */
function getTypeOf(value) {
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
        return 'array';
    }
    return typeof value;
}
