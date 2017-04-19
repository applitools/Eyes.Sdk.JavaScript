(function () {
    "use strict";

    /**
     * @constructor
     **/
    function ImageProvider() {}

    /**
     * @return {Promise.<MutableImage>}
     */
    ImageProvider.prototype.getScreenshot = function () {};

    module.exports = ImageProvider;

}());