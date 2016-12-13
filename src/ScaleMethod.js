(function () {
    "use strict";

    /**
     * @readonly
     * @enum {number}
     */
    var ScaleMethod = {
        SPEED: 'SPEED',
        QUALITY: 'QUALITY',
        ULTRA_QUALITY: 'ULTRA_QUALITY'
    };

    ScaleMethod.getDefault = function () {
        return this.QUALITY;
    };

    module.exports = ScaleMethod;
}());