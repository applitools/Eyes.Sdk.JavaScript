(function () {
    'use strict';

    var dateformat = require('dateformat');

    var DATE_FORMAT_ISO8601_FOR_OUTPUT = "yyyy-mm-dd'T'HH:MM:ss'Z'";
    var DATE_FORMAT_RFC1123 = "ddd, dd mmm yyyy HH:MM:ss 'GMT'";

    /**
     * Collection of utility methods.
     */
    var GeneralUtils = {};

    /**
     * @private
     * @param {Object} to
     * @param {Object} from
     * @param {string} fnName
     */
    function _mixin(to, from, fnName) {
        to[fnName] = function () {
            return from[fnName].apply(from, arguments);
        };
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Concatenate the url to the suffix - making sure there are no double slashes
     *
     * @param {string} url - The left side of the URL.
     * @param {string} suffix - the right side.
     *
     * @return {string} the URL
     **/
    GeneralUtils.urlConcat = function (url, suffix) {
        var left = url;
        if (url.lastIndexOf("/") === (url.length - 1)) {
            left = url.slice(0, url.length - 1);
        }

        if (suffix.indexOf("/") === 0) {
            return left + suffix;
        }

        return left + "/" + suffix;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Convert object into json string
     *
     * @param {*} o
     * @return {string}
     */
    GeneralUtils.toJson = function (o) {
        return JSON.stringify(o);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Mixin methods from one object into another.
     * Follow the prototype chain and apply form root to current - but skip the top
     *
     * @param {Object} to The object to which methods will be added
     * @param {Object} from The object from which methods will be copied
     */
    GeneralUtils.mixin = function (to, from) {
        var index, protos = [], proto = from;
        while (!!proto) {
            protos.push(Object.getOwnPropertyNames(proto));
            proto = Object.getPrototypeOf(proto);
        }

        for (index = protos.length - 2; index >= 0; index--) {
            protos[index].forEach(function(method) {
                //noinspection JSUnfilteredForInLoop
                if (!to[method] && typeof from[method] === 'function' && method !== 'constructor') {
                    //noinspection JSUnfilteredForInLoop
                    _mixin(to, from, method);
                }
            });
        }
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Generate GUID
     *
     * @return {string}
     */
    GeneralUtils.guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            // noinspection MagicNumberJS, NonShortCircuitBooleanExpressionJS
            var r = (Math.random() * 16) | 0; // eslint-disable-line no-bitwise
            // noinspection MagicNumberJS, NonShortCircuitBooleanExpressionJS
            var v = (c === 'x') ? r : ((r & 0x3) | 0x8); // eslint-disable-line no-bitwise
            return v.toString(16);
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Clone object
     *
     * @param {Date|Array|Object} obj
     * @return {*}
     */
    GeneralUtils.clone = function (obj) {
        var copy;
        if (null == obj || "object" != typeof obj) {
            return obj;
        }

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = GeneralUtils.clone(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = obj.constructor();
            for (var attr in obj) {
                copy[attr] = GeneralUtils.clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    //noinspection JSUnusedGlobalSymbols
	/**
	 * Object.assign() polyfill
	 *
	 * @param {Object} target
	 * @param {Object...} source
     */
    GeneralUtils.objectAssign = function (target, source) {
        if (typeof Object.assign === 'function') {
            return Object.assign.apply(Object, [target].concat(Array.prototype.slice.call(arguments, 1)));
        }

        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert first argument to object');
        }

        var to = Object(target);
        for (var i = 1; i < arguments.length; i++) {
            var nextSource = arguments[i];
            if (nextSource === undefined || nextSource === null) {
                continue;
            }
            nextSource = Object(nextSource);

            var keysArray = Object.keys(Object(nextSource));
            for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                var nextKey = keysArray[nextIndex];
                var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                if (desc !== undefined && desc.enumerable) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
        return to;
	};

    //noinspection JSUnusedGlobalSymbols
	/**
	 * Creates a property with default configuration (writable, enumerable, configurable).
	 *
	 * @param {object} obj The object to create the property on.
	 * @param {string} name The name of the property
	 * @param {Function} getFunc The getter of the property
	 * @param {Function} setFunc The setter of the property
     */
    GeneralUtils.definePropertyWithDefaultConfig = function (obj, name, getFunc, setFunc) {
		Object.defineProperty(obj, name, {
			enumerable: true,
			configurable: true,
			get: getFunc,
			set: setFunc
		});
	};

    //noinspection JSUnusedGlobalSymbols
	/**
	 * Creates a property with default configuration (writable, enumerable, configurable) and default getter/setter.
	 *
	 * @param {object} obj The object to create the property on.
	 * @param {string} name The name of the property
	 */
	GeneralUtils.defineStandardProperty = function (obj, name) {

		var getFunc = function () { return this["_" + name]; };
		var setFunc = function (v) { this["_" + name] = v; };

		GeneralUtils.definePropertyWithDefaultConfig(obj, name, getFunc, setFunc);
	};

    //noinspection JSUnusedGlobalSymbols
    /**
     * Waits a specified amount of time before resolving the returned promise.
     *
     * @param {number} ms The amount of time to sleep in milliseconds.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which is resolved when sleep is done.
     */
    GeneralUtils.sleep = function (ms, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, ms);
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @deprecated use GeneralUtils.toRfc1123DateTime() instead
     */
    GeneralUtils.getRfc1123Date = function (date) {
        return GeneralUtils.toRfc1123DateTime(date);
    };

    //noinspection JSUnusedGlobalSymbols
	/**
	 * Convert a Date object to a RFC-1123 date string
	 *
	 * @param {Date} [date=new Date()] Date which will be converted
     * @return {string} string formatted as RFC-1123 (E, dd MMM yyyy HH:mm:ss 'GMT')
	 */
	GeneralUtils.toRfc1123DateTime = function (date) {
	    date = date || new Date();
        return dateformat(date, DATE_FORMAT_RFC1123, true);
	};

    //noinspection JSUnusedGlobalSymbols
    /**
     * Convert a Date object to a ISO-8601 date string
     *
     * @param {Date} [date] Date which will be converted
     * @return {String} String formatted as ISO-8601 (yyyy-MM-dd'T'HH:mm:ss'Z')
     */
	GeneralUtils.toISO8601DateTime = function (date) {
	    date = date || new Date();
        return dateformat(date, DATE_FORMAT_ISO8601_FOR_OUTPUT, true);
	};

    //noinspection JSUnusedGlobalSymbols
    /**
     * Cartesian product of arrays
     *
     * @param {...(Array|Object)} arrays Variable number of arrays of n elements
     * @return {Array<Array>} Product of arrays as an array of X arrays of N elements,
     *   where X is the product of the input arrays' lengths
     */
	GeneralUtils.cartesianProduct = function (...arrays) {
    const getArrayOf = a => (Array.isArray(a) ? a : [a]);
    const prod2 = (a, b) => getArrayOf(b).map(e1 => a.map(e2 => [e1, ...e2])).reduce((arr, e) => arr.concat(e), []);
    const prod = (a, ...rest) => (rest.length > 0 ? prod(prod2(a, rest.pop()), ...rest) : a);
    return prod([[]], ...arrays);
	};

    exports.GeneralUtils = GeneralUtils;
}());
