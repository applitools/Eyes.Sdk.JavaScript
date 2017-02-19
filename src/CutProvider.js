(function () {
    "use strict";

    /**
     * @constructor
     **/
    function CutProvider() {}

    /**
     *
     * @param {MutableImage} image The image to cut.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<MutableImage>} A new cut image.
     */
    CutProvider.prototype.cut = function (image, promiseFactory) {};

    /**
     * Get a scaled version of the cut provider.
     *
     * @param {number} scaleRatio The ratio by which to scale the current cut parameters.
     * @return {CutProvider} A new scale cut provider instance.
     */
    CutProvider.prototype.scale = function (scaleRatio) {};

    module.exports = CutProvider;

}());