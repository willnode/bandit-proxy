
/**
 * Get object value
 * @param {{}} object - the source object
 * @param {string} key - the case-insensitive property name
 * @return {*}
 */
function get(object, key) {
    if (!key) throw 'key can\'t be empty';

    var keys = Object.keys(object);
    var keyup = (key + '').toUpperCase();
    for (let i = 0; i < keys.length; i++) {
        const el = keys[i];
        if (el.length === key.length && el.toUpperCase() === keyup)
            return object[el];
    }
}

/**
 * Get object value
 * @param {{}} object - the source object
 * @param {string} key - the case-insensitive property name
 * @param {*} value - value to be set (undefined === delete)
 * @param {boolean} [keepGoing] - don't quit after first match found
 * @param {boolean} [keepOriginalCasing] - preserve original casing (keepGoing should off too)
 * @return {Object} the source object
 */
function set(object, key, value, keepGoing, keepOriginalCasing) {
    if (!key) throw 'key can\'t be empty';

    var keys = Object.keys(object);
    var keyup = (key + '').toUpperCase();
    for (let i = 0; i < keys.length; i++) {
        const el = keys[i];
        if (el.length === key.length && el.toUpperCase() === keyup) {
            if (keepOriginalCasing || el === key) {
                if (value === undefined)
                    delete object[el];
                else
                    object[el] = value;
            }
            else {
                if (object[el] !== undefined)
                    delete object[el];
                if (value !== undefined)
                    object[key] = value;
            }
            if (!keepGoing)
                return object;
        }
    }

    if (!keepGoing)
        // looks like nothing mathing at all
        object[key] = value;

    return object;
}

/**
 * Set multiple values to target by source object
 * @param {{}} target - the mutable object to be modified or filled with
 * @param {{}} source - an object source
 * @returns {{}} the same modified target (for piping)
 */
function assign(target, source) {
    Object.keys(source).forEach((v) => set(target, v, source[v]));
    return target;
}

/**
 * Set multiple values to target by source object
 * @param {{}} target - the mutable object to be modified or filled with
 * @param {{}} modifier - an object source
 * @returns {{}} the same modified target (for piping)
 */
function distict(target, modifier) {
    var keys = Object.keys(target);
    if (modifier) {
        keys = keys.map(v => modifier(v));
    }
}

/**
 * Remove a property with
 * @param {{}} object - the mutable object to be modified or filled with
 * @param {string} key - the case-insensitive property name
 * @returns {{}} the same object
 */
function remove(object, key) {
    set(object, key, undefined, true, false);
    return object;
}

module.exports = { get, set, assign, distict, remove };
