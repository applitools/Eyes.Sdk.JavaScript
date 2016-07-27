(function () {
    "use strict";

    /**
     * @constructor
     **/
    function ScaleProvider() {}

    /**
     *
     * @return {Number} The ratio by which an image will be scaled.
     */
    ScaleProvider.prototype.getScaleRatio = function () {};

    /**
     * @param {object} image The image to scale.
     * @return {object} A new scaled image.
     */
    ScaleProvider.prototype.scaleImage = function (image) {};

    module.exports = ScaleProvider;

}());