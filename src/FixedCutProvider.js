(function () {
    "use strict";

    var CutProvider = require('./CutProvider'),
        GeometryUtils = require('eyes.utils').GeometryUtils;

    /**
     * @constructor
     * @augments CutProvider
     * @param {number} header The header to cut in pixels.
     * @param {number} footer The footer to cut in pixels.
     * @param {number} left The left to cut in pixels.
     * @param {number} right The right to cut in pixels.
     */
    function FixedCutProvider(header, footer, left, right) {
        this._header = header;
        this._footer = footer;
        this._left = left;
        this._right = right;
    }

    FixedCutProvider.prototype = Object.create(CutProvider.prototype);
    FixedCutProvider.prototype.constructor = FixedCutProvider;

    /**
     *
     * @param {MutableImage} image The image to cut.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<MutableImage>} A new cut image.
     */
    FixedCutProvider.prototype.cut = function (image, promiseFactory) {
        var that = this;
        var promise = promiseFactory.makePromise(function (resolve) {
            resolve(image);
        });

        if (this._header > 0) {
            promise = promise.then(function () {
                return image.getSize();
            }).then(function (imageSize) {
                var region = GeometryUtils.createRegion(0, that._header, imageSize.width, imageSize.height - that._header);
                return image.cropImage(region);
            });
        }

        if (this._footer > 0) {
            promise = promise.then(function () {
                return image.getSize();
            }).then(function (imageSize) {
                var region = GeometryUtils.createRegion(0, 0, imageSize.width, imageSize.height - that._footer);
                return image.cropImage(region);
            });
        }

        if (this._left > 0) {
            promise = promise.then(function () {
                return image.getSize();
            }).then(function (imageSize) {
                var region = GeometryUtils.createRegion(that._left, 0, imageSize.width - that._left, imageSize.height);
                return image.cropImage(region);
            });
        }

        if (this._right > 0) {
            promise = promise.then(function () {
                return image.getSize();
            }).then(function (imageSize) {
                var region = GeometryUtils.createRegion(0, 0, imageSize.width - that._right, imageSize.height);
                return image.cropImage(region);
            });
        }

        return promise;
    };

    /**
     * Get a scaled version of the cut provider.
     *
     * @param {number} scaleRatio The ratio by which to scale the current cut parameters.
     * @return {CutProvider} A new scale cut provider instance.
     */
    FixedCutProvider.prototype.scale = function (scaleRatio) {
        var scaledHeader = Math.ceil(this._header * scaleRatio);
        var scaledFooter = Math.ceil(this._footer * scaleRatio);
        var scaledLeft = Math.ceil(this._left * scaleRatio);
        var scaledRight = Math.ceil(this._right * scaleRatio);

        return new FixedCutProvider(scaledHeader, scaledFooter, scaledLeft, scaledRight);
    };

    module.exports = FixedCutProvider;

}());