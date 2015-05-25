/*
 ---

 name: MutableImage

 description: A wrapper for image buffer that parses it to BMP to allow editing and extracting its dimensions

 provides: [MutableImage]

 ---
 */

(function () {
    "use strict";


    var ImageUtils = require('./ImageUtils');
    var disabled = !require('fs').open;

    /**
     * Parses the image if possible - meaning dimensions and BMP are extracted and available
     * @param that - the context of the current instance of MutableImage
     * @private
     */
    function _parseImage(that) {
        return that._promiseFactory.makePromise(function (resolve) {
            if (that._isParsed || disabled) {
                return resolve();
            }

            return ImageUtils.parseImage(that._imageBuffer, that._promiseFactory)
                .then(function(bmp) {
                    that._imageBmp = bmp;
                    that._width = bmp.width;
                    that._height = bmp.height;
                    that._isParsed = true;
                    resolve();
                });
        });
    }

    /**
     * Packs the image if possible - meaning the buffer is updated according to the edited BMP
     * @param that - the context of the current instance of MutableImage
     * @private
     */
    function _packImage(that) {
        return that._promiseFactory.makePromise(function (resolve) {

            if (!that._isParsed || disabled) {
                return resolve();
            }

            return ImageUtils.packImage(that._imageBmp, that._promiseFactory)
                .then(function(buffer) {
                    that._imageBuffer = buffer;
                    resolve();
                });
        });
    }

    /**
     * C'tor = initializes the module settings
     *
     * @param {Buffer} imageBuffer
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
     *
     **/
    function MutableImage(imageBuffer, promiseFactory) {
        this._imageBuffer = imageBuffer;
        this._promiseFactory = promiseFactory;
        this._isParsed = false;
        this._imageBmp = undefined;
        this._width = 0;
        this._height = 0;
        this._top = 0;
        this._left = 0;
    }

    /**
     * Coordinates represent the image's position in a larger context (if any). E.g., A screenshot of the browser's
     * viewport of a web page.
     *
     * @return {Promise} A promise which resolves to the coordinates of the image in the larger
     *                  context (if any): {top: *, left: *}
     */
    MutableImage.prototype.getCoordinates = function () {
        var that = this;
        return _parseImage(that).then(function () {
            return {
                left: that._left,
                top: that._top
            };
        });
    };

    /**
     * Coordinates represent the image's position in a larger context (if any). E.g., A screenshot of the browser's
     * viewport of a web page.
     *
     * @return {Promise} A promise which resolves once the set is done.
     */
    MutableImage.prototype.setCoordinates = function (coordinates) {
        var that = this;
        return _parseImage(that).then(function () {
            that._left = coordinates.left;
            that._top = coordinates.top;
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Parses the image if necessary
     * @returns {Object} - the image size
     */
    MutableImage.prototype.getSize = function () {
        var that = this;
        return _parseImage(that)
            .then(function () {
                return {
                    width: that._width,
                    height: that._height
                };
            });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * return the image as buffer and image width and height.
     *
     * {Object} Promise of an object with buffer and image dimensions
     */
    MutableImage.prototype.asObject = function () {
        var that = this;
        return _parseImage(that)
            .then(function () {
                return _packImage(that);
            })
            .then(function () {
                return {
                    imageBuffer: that._imageBuffer,
                    width: that._width,
                    height: that._height
                };
            });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Scales the image in place (used to downsize by 2 for retina display chrome bug - and tested accordingly).
     *
     * @param {Float} scale
     * @return {Object} promise - resolves without any value.
     */
    MutableImage.prototype.scaleImage = function (scale) {
        var that = this;
        return _parseImage(that)
            .then(function () {
                if (that._isParsed) {
                    return ImageUtils.scaleImage(that._imageBmp, scale, that._promiseFactory)
                        .then(function () {
                            that._width = that._imageBmp.width;
                            that._height = that._imageBmp.height;
                            return that;
                        });
                }
            });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * crops the image according to the given region.
     *
     * @param {Object} region
     * @return {Object} promise - resolves without any value
     */
    MutableImage.prototype.cropImage = function (region) {
        var that = this;
        return _parseImage(that)
            .then(function () {
                if (that._isParsed) {
                    // If the region's coordinates are relative to the image, we convert them to absolute coordinates.
                    if (region && region.relative) {
                        region = {
                            left: region.left - that._left,
                            top: region.top - that._top,
                            width: region.width,
                            height: region.height
                        };
                    }
                    return ImageUtils.cropImage(that._imageBmp, region, that._promiseFactory)
                        .then(function () {
                            that._width = that._imageBmp.width;
                            that._height = that._imageBmp.height;
                            return that;
                        });
                }
            });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * rotates the image according to the given degrees.
     *
     * @param {Number} degrees
     * @return {Object} promise - resolves without any value
     */
    MutableImage.prototype.rotateImage = function (degrees) {
        var that = this;
        return _parseImage(that)
            .then(function () {
                if (that._isParsed) {
                    // If the region's coordinates are relative to the image, we convert them to absolute coordinates.
                    return ImageUtils.rotateImage(that._imageBmp, degrees, that._promiseFactory)
                        .then(function () {
                            that._width = that._imageBmp.width;
                            that._height = that._imageBmp.height;
                            return that;
                        });
                }
            });
    };

    module.exports = MutableImage;
}());
