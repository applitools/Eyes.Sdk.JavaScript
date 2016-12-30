(function () {
    "use strict";

    /**
     * @constructor
     **/
    function ScaleProvider() {}

    /**
     * @return {number} The ratio by which an image will be scaled.
     */
    ScaleProvider.prototype.getScaleRatio = function () {};

    module.exports = ScaleProvider;

}());