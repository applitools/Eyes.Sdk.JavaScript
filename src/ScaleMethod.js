(function () {
    "use strict";

    /**
     * @param method
     * @constructor
     */
    function ScaleMethod(method) {
        this._method = method;
    }

    ScaleMethod.SPEED = 'speed';
    ScaleMethod.QUALITY = 'quality';
    ScaleMethod.ULTRA_QUALITY = 'ultra_quality';

    ScaleMethod.getDefault = function () {
        return this.SPEED;
    };

    ScaleMethod.prototype.getMethod = function () {
        return this._method;
    };

    module.exports = ScaleMethod;
}());