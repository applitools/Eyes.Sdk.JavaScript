/*
 ---

 name: ImageUtils

 description: Provide means of image manipulations.

 ---
 */

(function () {
    "use strict";

    var StreamUtils = require('./StreamUtils'),
        PNG = require('node-png').PNG,
        fs = require('fs');
    var ReadableBufferStream = StreamUtils.ReadableBufferStream;
    var WritableBufferStream = StreamUtils.WritableBufferStream;

    var ImageUtils = {};

    /**
     * Set the promise factory used for creating promises to be returned from methods.
     * @param PromiseFactory The promise factory to set.
     */
    ImageUtils.setPromiseFactory = function (PromiseFactory) {
        ImageUtils.PromiseFactory = PromiseFactory;
    };

    /**
     *
     * processImage - processes a PNG buffer - returns it along with the image dimensions and, if needed crops it.
     *
     * @param {Buffer} image
     * @param {Object} region (optional) - region to crop to
     *
     * @returns {Object} - Promise - when resolved contains an object with the buffer and the image dimensions
     *
     **/
    ImageUtils.processImage = function (image, region) {
        return ImageUtils.PromiseFactory.makePromise(function (resolve, reject) {

            var result = {
                imageBuffer: image,
                width: 0,
                height: 0
            };

            if (!fs.open) {
                resolve(result);
                return;
            }

            // 1. pass the file to PNG using read stream
            var origImageReadableStream = new ReadableBufferStream(image, undefined);
            var origImage = new PNG({filterType: 4});
            //noinspection JSUnresolvedFunction
            origImageReadableStream.pipe(origImage)
                .on('parsed', function () {
                    if ((!region) || region.width === 0 || region.height === 0) {
                        //No need to crop - no region
                        result.imageBuffer = image;
                        result.width = origImage.width;
                        result.height = origImage.height;
                        resolve(result);
                        return;
                    }

                    if (region.top >= origImage.height || region.left >= origImage.width) {
                        reject(new Error('region is not contained in screen shot'));
                        return;
                    }

                    // 2. process the pixels - crop
                    var croppedArray = [];
                    var yStart = region.top,
                        yEnd = Math.min(region.top + region.height, origImage.height),
                        xStart = region.left,
                        xEnd = Math.min(region.left + region.width, origImage.width);

                    var y, x, idx, i;
                    for (y = yStart; y < yEnd; y++) {
                        for (x = xStart; x < xEnd; x++) {
                            idx = (origImage.width * y + x) << 2;
                            for (i = 0; i < 4; i++) {
                                croppedArray.push(origImage.data[idx + i]);
                            }
                        }
                    }

                    origImage.data = new Buffer(croppedArray);
                    origImage.width = xEnd - xStart;
                    origImage.height = yEnd - yStart;
                    result.width = origImage.width;
                    result.height = origImage.height;

                    // 3. Write back to a temp png file
                    var croppedImageStream = new WritableBufferStream();
                    origImage.pack().pipe(croppedImageStream)
                        .on('finish', function () {
                            // 7. Read the file into a buffer
                            result.imageBuffer = croppedImageStream.getBuffer();
                            resolve(result);
                        });
                });
        });
    };

    /**
     * Copies pixels from the source image to the destination image.
     * @param {PNG} dst The destination image.
     * @param dstPosition An object containing the top/left values of the pixel which is the starting point to copy to.
     * @param {PNG} src The source image.
     * @param srcPosition An object containing the top/left values of the pixel from which to start copying.
     * @param size An object containing width/height of the region to be copied.
     */
    ImageUtils.copyPixels = function (dst, dstPosition, src, srcPosition, size) {
        var y, dstY, srcY, x, dstX, srcX, dstIndex, srcIndex;
        for (y = 0; y < size.height; ++y) {
            dstY = dstPosition.top + y;
            srcY = srcPosition.top + y;

            for (x = 0; x < size.width; ++x) {
                dstX = dstPosition.left + x;
                srcX = srcPosition.left + x;

                // Since each pixel is composed of 4 values (RGBA) we multiply each index by 4.
                dstIndex = (dstY * dst.width + dstX) << 2;
                srcIndex = (srcY * src.width + srcX) << 2;

                dst.data[dstIndex] = src.data[srcIndex];
                dst.data[dstIndex + 1] = src.data[srcIndex + 1];
                dst.data[dstIndex + 2] = src.data[srcIndex + 2];
                dst.data[dstIndex + 3] = src.data[srcIndex + 3];
            }
        }
    };

    //noinspection JSValidateJSDoc
    /**
     * Creates a PNG instance from the given buffer.
     * @param {Buffer} buffer A buffer containing PNG bytes.
     * @return {Promise} A promise which resolves to the PNG instance.
     */
    ImageUtils.createPngFromBuffer = function (buffer) {
        var deferred = ImageUtils.PromiseFactory.makeDeferred();

        // In order to create a PNG instance from part.image, we first need to create a stream from it.
        var pngImageStream = new ReadableBufferStream(buffer);
        // Create the PNG
        var pngImage = new PNG({filterType: 4});
        //noinspection JSUnresolvedFunction
        pngImageStream.pipe(pngImage);
        pngImage.on('parsed', function () {
            deferred.resolve(pngImage);
        });

        //noinspection JSUnresolvedVariable
        return deferred.promise;
    };

    //noinspection JSValidateJSDoc
    /**
     * Stitches a part into the image.
     * @param stitchingPromise A promise which its "then" block will execute the stitching. T
     * @param {PNG} stitchedImage A PNG instance into which the part will be stitched.
     * @param  {object} part A "part" object given in the {@code parts} argument of {@link ImageUtils.stitchImage}.
     * @return {Promise} A promise which is resolved when the stitching is done.
     * @private
     */
    ImageUtils._stitchPart = function (stitchingPromise, stitchedImage, part) {
        //noinspection JSUnresolvedFunction
        return stitchingPromise.then(function () {
            var deferred = ImageUtils.PromiseFactory.makeDeferred();

            //noinspection JSUnresolvedFunction
            ImageUtils.createPngFromBuffer(part.image).then(function (pngImage) {
                ImageUtils.copyPixels(stitchedImage, part.position, pngImage, {left: 0, top: 0}, part.size);
                deferred.resolve(stitchedImage);
            });

            //noinspection JSUnresolvedVariable
            return deferred.promise;
        });
    };

    //noinspection JSValidateJSDoc
    /**
     * Stitches the given parts to a full image.
     * @param fullSize The size of the stitched image. Should have 'width' and 'height' properties.
     * @param {Array} parts The parts to stitch into an image. Each part should have: 'position'
     *                      (which includes top/left), 'size' (which includes width/height) and image
     *                      (a buffer containing PNG bytes) properties.
     * @return {Promise} A promise which resolves to the stitched image.
     */
    ImageUtils.stitchImage = function (fullSize, parts) {
        var deferred = ImageUtils.PromiseFactory.makeDeferred();
        var stitchedImage = new PNG({filterType: 4, width: fullSize.width, height: fullSize.height});
        var stitchingPromise = ImageUtils.PromiseFactory.makePromise(function (resolve) { resolve(); });

        //noinspection JSLint
        for (var i = 0; i < parts.length; ++i) {
            //noinspection JSUnresolvedFunction
            stitchingPromise = ImageUtils._stitchPart(stitchingPromise, stitchedImage, parts[i]);
        }

        //noinspection JSUnresolvedFunction
        stitchingPromise.then(function () {
            var stitchedImageStream = new WritableBufferStream();
            //noinspection JSUnresolvedFunction
            stitchedImage.pack().pipe(stitchedImageStream)
                .on('finish', function () {
                    deferred.resolve(stitchedImageStream.getBuffer());
                });
        });
        //noinspection JSUnresolvedVariable
        return deferred.promise;
    };

    //noinspection JSUnresolvedVariable
    module.exports = ImageUtils;
}());