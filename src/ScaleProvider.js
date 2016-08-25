(function () {
    "use strict";

    /**
     * @constructor
     * @param {boolean} [isReadOnly=false]
     **/
    function ScaleProvider(isReadOnly) {
        this._readOnly = isReadOnly || false;
    }

    /**
     * @return {number} The ratio by which an image will be scaled.
     */
    ScaleProvider.prototype.getScaleRatio = function () {};

    /**
     * @param {MutableImage} image The image to scale.
     * @return {Promise<MutableImage>} A new scaled image.
     */
    ScaleProvider.prototype.scaleImage = function (image) {};

    /**
     * @return {boolean}
     */
    ScaleProvider.prototype.isReadOnly = function () {
        return this._readOnly;
    };

    module.exports = ScaleProvider;

}());