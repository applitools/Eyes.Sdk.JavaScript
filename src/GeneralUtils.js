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

    GeneralUtils.mixin = function (to, from) {
        var method;
        for (method in from) {
            //noinspection JSUnfilteredForInLoop
            if (!to[method] && typeof from[method] === 'function') {
                //noinspection JSUnfilteredForInLoop
                _mixin(to, from, method);
            }
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