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

    /**
     * @return {ScaleMethod} The scale method used for the scaling.
     */
    ScaleProvider.prototype.getScaleMethod = function () {};

    module.exports = ScaleProvider;

}());