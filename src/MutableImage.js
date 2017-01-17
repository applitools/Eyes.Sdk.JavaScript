/*
 ---

 name: MutableImage

 description: A wrapper for image buffer that parses it to BMP to allow editing and extracting its dimensions

 provides: [MutableImage]

 ---
 */

(function () {
    "use strict";


    var fs = require("fs"),
        ImageUtils = require('./ImageUtils');

    var disabled = !fs.open;

    /**
     * Parses the image if possible - meaning dimensions and BMP are extracted and available
     *
     * @private
     * @param {MutableImage} that The context of the current instance of MutableImage
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
     *
     * @private
     * @param {MutableImage} that The context of the current instance of MutableImage
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
     * @constructor
     * @param {Buffer} imageBuffer
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
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

    //noinspection JSUnusedGlobalSymbols
    /**
     * Coordinates represent the image's position in a larger context (if any).
     * E.g., A screenshot of the browser's viewport of a web page.
     *
     * @return {Promise.<{x: number, y: number}>} The coordinates of the image in the larger context (if any)
     */
    MutableImage.prototype.getCoordinates = function () {
        var that = this;
        return _parseImage(that).then(function () {
            return {
                x: that._left,
                y: that._top
            };
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Coordinates represent the image's position in a larger context (if any).
     * E.g., A screenshot of the browser's viewport of a web page.
     *
     * @param {{x: number, y: number}} coordinates
     * @return {Promise<void>}
     */
    MutableImage.prototype.setCoordinates = function (coordinates) {
        var that = this;
        return _parseImage(that).then(function () {
            that._left = coordinates.x;
            that._top = coordinates.y;
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Size of the image. Parses the image if necessary
     *
     * @return {Promise<{width: number, height: number}>}
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
     * Return the image as buffer and image width and height.
     *
     * @return {Promise<{imageBuffer: Buffer, width: number, height: number}>}
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
     * @param {number} scaleRatio
     * @return {Promise<MutableImage>}
     */
    MutableImage.prototype.scaleImage = function (scaleRatio) {
        var that = this;
        return _parseImage(that)
            .then(function () {
                if (that._isParsed) {
                    return ImageUtils.scaleImage(that._imageBmp, scaleRatio, that._promiseFactory)
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
     * Crops the image according to the given region.
     *
     * @param {{left: number, top: number, width: number, height: number, relative: boolean=}} region
     * @return {Promise<MutableImage>}
     */
    MutableImage.prototype.cropImage = function (region) {
        var that = this;
        return _parseImage(that)
            .then(function () {
                if (that._isParsed) {
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
     * Rotates the image according to the given degrees.
     *
     * @param {Number} degrees
     * @return {Promise<MutableImage>}
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

    //noinspection JSUnusedGlobalSymbols
    /**
     * Write image to local directory
     *
     * @param {string} filename
     * @return {Promise<void>}
     */
    MutableImage.prototype.saveImage = function (filename) {
        var that = this;
        return that.asObject().then(function (imageObject) {
            return ImageUtils.saveImage(imageObject.imageBuffer, filename, that._promiseFactory);
        });
    };

    module.exports = MutableImage;
}());
