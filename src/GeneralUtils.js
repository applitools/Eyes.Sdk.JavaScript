/*
 ---

 name: GeneralUtils

 description: collection of utility methods.

 ---
 */

(function () {
    "use strict";

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
     * @param {String} url - The left side of the URL.
     * @param {String} suffix - the right side.
     *
     * @return {String} the URL
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
     * @param {Object} o
     * @returns {String}
     */
    GeneralUtils.toJson = function (o) {
        return JSON.stringify(o);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Mixin methods from one object into another.
     * Follow the prototype chain and apply form root to current - but skip the top (Object)
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
            var r = Math.random() * 16 | 0;
            var v = (c === 'x') ? r : (r & 0x3 | 0x8);
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
     * @param {int} ms The amount of time to sleep in milliseconds.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which is resolved when sleep is done.
     */
    GeneralUtils.sleep = function sleep(ms, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, ms);
        });
    };

    //noinspection JSUnusedGlobalSymbols
	/**
	 * Convert a Date object to a RFC-1123 date string
	 *
	 * @param {Date} date Date which will be converted
     * @return {string} String formatted as RFC-1123 (ddd, dd MMM yyyy HH:mm:ss GMT)
	 */
	GeneralUtils.getRfc1123Date = function (date) {
        if (date.toUTCString) {
            return date.toUTCString()
        } else {
            return days[date.getUTCDay()] + ", "
                + _numpad(date.getUTCDate(), 2) + " "
                + months[date.getUTCMonth()] + " "
                + date.getUTCFullYear() + " "
                + _numpad(date.getUTCHours(), 2) + ":"
                + _numpad(date.getUTCMinutes(), 2) + ":"
                + _numpad(date.getUTCSeconds(), 2) + " "
                + "GMT";
        }
	};

    function _numpad(x, digits) {
        var result = x.toString();

        while (result.length < digits) {
            result = '0' + result;
        }

        return result;
    }

    module.exports = GeneralUtils;
}());
