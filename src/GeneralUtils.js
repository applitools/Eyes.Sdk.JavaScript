/*
 ---

 name: GeneralUtils

 description: collection of utility methods.

 ---
 */

(function () {
    "use strict";

    var GeneralUtils = {};

    function _mixin(to, from, fnName) {
        to[fnName] = function () {
            return from[fnName].apply(from, arguments);
        };
    }

    /**
     *
     * concatenate the url to the suffix - making sure there are no double slashes
     *
     * @method urlConcat
     * @param {String} url - The left side of the URL.
     * @param {String} suffix - the right side.
     *
     * @return {String} the URL
     *
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

    GeneralUtils.toJson = function (o) {
        return JSON.stringify(o);
    };

    // follow the prototype chain and apply form root to current - but skip the top (Object)
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

    GeneralUtils.guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    module.exports = GeneralUtils;
}());