/*
 ---

 name: GeneralUtils

 description: collection of utility methods.

 provides: [GeneralUtils]

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
            if (!to[method] && typeof from[method] === 'function') {
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

    GeneralUtils.intersect = function (rect1, rect2) {
        var top = Math.max(rect1.top, rect2.top);
        var left = Math.max(rect1.left, rect2.left);
        var bottom = Math.min(rect1.top + rect1.height, rect2.top + rect2.height);
        var right = Math.min(rect1.left + rect1.width, rect2.left + rect2.width);
        var height = bottom - top;
        var width = right - left;
        if (height > 0 && width > 0) {
            return {
                top: top,
                left: left,
                width: width,
                height: height
            };
        }

        return {
            top: 0,
            left: 0,
            width: 0,
            height: 0
        };
    };

    GeneralUtils.contains = function (rect, point) {
        return (rect.left <= point.x
            && (rect.left + rect.width) > point.x
            && rect.top <= point.y
            && (rect.top + rect.height) > point.y);
    };

    module.exports = GeneralUtils;
}());