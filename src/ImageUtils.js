/*
 ---

 name: ImageUtils

 description: Provide means of image manipulations.

 ---
 */

(function () {
    "use strict";

    // for better compatibility with browserify
    global.setImmediate = require('timers').setImmediate;

    var fs = require('fs'),
        png = require('png-async'),
        StreamUtils = require('./StreamUtils');

    var ReadableBufferStream = StreamUtils.ReadableBufferStream,
        WritableBufferStream = StreamUtils.WritableBufferStream;

    var ImageUtils = {};

    /**
     * Processes a PNG buffer - returns it as parsed png.Image.
     *
     * @param {Buffer} buffer Original image as PNG Buffer
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise.<png.Image>} Decoded png image with byte buffer
     **/
    ImageUtils.parseImage = function parseImage(buffer, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            if (!fs.open) {
                return resolve(buffer);
            }

            // pass the file to PNG using read stream
            var imageReadableStream = new ReadableBufferStream(buffer, undefined);
            var image = png.createImage({filterType: 4});
            imageReadableStream.pipe(image).on('parsed', function () {
                resolve(image);
            });
        });
    };

    /**
     * Repacks a parsed png.Image to a PNG buffer.
     *
     * @param {png.Image} image Parsed image as returned from parseImage
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise.<Buffer>} PNG buffer which can be written to file or base64 string
     **/
    ImageUtils.packImage = function packImage(image, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            if (!fs.open) {
                return resolve(image);
            }

            // Write back to a temp png file
            var imageWritableStream = new WritableBufferStream();
            image.pack().pipe(imageWritableStream).on('finish', function () {
                resolve(imageWritableStream.getBuffer());
            });
        });
    };

    /**
     * Scaled a parsed image by a given factor.
     *
     * @param {png.Image} image - will be modified
     * @param {number} scaleRatio factor to multiply the image dimensions by (lower than 1 for scale down)
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise.<void>}
     **/
    ImageUtils.scaleImage = function scaleImage(image, scaleRatio, promiseFactory) {
        if (scaleRatio === 1) {
            return promiseFactory.makePromise(function (resolve) {
                resolve(image);
            });
        }

        var ratio = image.height / image.width;
        var scaledWidth = Math.ceil(image.width * scaleRatio);
        var scaledHeight = Math.ceil(scaledWidth * ratio);
        return ImageUtils.resizeImage(image, scaledWidth, scaledHeight, promiseFactory);
    };

    /**
     * Resize a parsed image by a given dimensions.
     *
     * @param {png.Image} image - will be modified
     * @param {int} targetWidth The width to resize the image to
     * @param {int} targetHeight The height to resize the image to
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise.<void>}
     **/
    ImageUtils.resizeImage = function resizeImage(image, targetWidth, targetHeight, promiseFactory) {

        function _interpolateCubic(x0, x1, x2, x3, t) {
            var a0 = x3 - x2 - x0 + x1;
            var a1 = x0 - x1 - a0;
            var a2 = x2 - x0;
            return Math.ceil(Math.max(0, Math.min(255, (a0 * (t * t * t)) + (a1 * (t * t)) + (a2 * t) + (x1))));
        }

        function _doBicubicInterpolation(src, dst) {
            var bufSrc = src.data;
            var bufDst = dst.data;

            var wSrc = src.width;
            var hSrc = src.height;

            var wDst = dst.width;
            var hDst = dst.height;

            // when dst smaller than src/2, interpolate first to a multiple between 0.5 and 1.0 src, then sum squares
            var wM = Math.max(1, Math.floor(wSrc / wDst));
            var wDst2 = wDst * wM;
            var hM = Math.max(1, Math.floor(hSrc / hDst));
            var hDst2 = hDst * hM;

            var i, j, x, y, k, t, xPos, yPos, kPos, buf1Pos, buf2Pos;

            // Pass 1 - interpolate rows
            // buf1 has width of dst2 and height of src
            var buf1 = new Buffer(wDst2 * hSrc * 4);
            for (i = 0; i < hSrc; i++) {
                for (j = 0; j < wDst2; j++) {
                    x = j * (wSrc - 1) / wDst2;
                    xPos = Math.floor(x);
                    t = x - xPos;
                    var srcPos = (i * wSrc + xPos) * 4;

                    buf1Pos = (i * wDst2 + j) * 4;
                    for (k = 0; k < 4; k++) {
                        kPos = srcPos + k;
                        var x0 = (xPos > 0) ? bufSrc[kPos - 4] : 2 * bufSrc[kPos] - bufSrc[kPos + 4];
                        var x1 = bufSrc[kPos];
                        var x2 = bufSrc[kPos + 4];
                        var x3 = (xPos < wSrc - 2) ? bufSrc[kPos + 8] : 2 * bufSrc[kPos + 4] - bufSrc[kPos];
                        buf1[buf1Pos + k] = _interpolateCubic(x0, x1, x2, x3, t);
                    }
                }
            }

            // Pass 2 - interpolate columns
            // buf2 has width and height of dst2
            var buf2 = new Buffer(wDst2 * hDst2 * 4);
            for (i = 0; i < hDst2; i++) {
                for (j = 0; j < wDst2; j++) {
                    y = i * (hSrc - 1) / hDst2;
                    yPos = Math.floor(y);
                    t = y - yPos;
                    buf1Pos = (yPos * wDst2 + j) * 4;
                    buf2Pos = (i * wDst2 + j) * 4;
                    for (k = 0; k < 4; k++) {
                        kPos = buf1Pos + k;
                        var y0 = (yPos > 0) ? buf1[kPos - wDst2 * 4] : 2 * buf1[kPos] - buf1[kPos + wDst2 * 4];
                        var y1 = buf1[kPos];
                        var y2 = buf1[kPos + wDst2 * 4];
                        var y3 = (yPos < hSrc - 2) ? buf1[kPos + wDst2 * 8] : 2 * buf1[kPos + wDst2 * 4] - buf1[kPos];
                        buf2[buf2Pos + k] = _interpolateCubic(y0, y1, y2, y3, t);
                    }
                }
            }

            // Pass 3 - scale to dst
            var m = wM * hM;
            if (m > 1) {
                for (i = 0; i < hDst; i++) {
                    for (j = 0; j < wDst; j++) {
                        var r = 0;
                        var g = 0;
                        var b = 0;
                        var a = 0;
                        for (y = 0; y < hM; y++) {
                            yPos = i * hM + y;
                            for (x = 0; x < wM; x++) {
                                xPos = j * wM + x;
                                var xyPos = (yPos * wDst2 + xPos) * 4;
                                r += buf2[xyPos];
                                g += buf2[xyPos + 1];
                                b += buf2[xyPos + 2];
                                a += buf2[xyPos + 3];
                            }
                        }

                        var pos = (i * wDst + j) * 4;
                        bufDst[pos] = Math.round(r / m);
                        bufDst[pos + 1] = Math.round(g / m);
                        bufDst[pos + 2] = Math.round(b / m);
                        bufDst[pos + 3] = Math.round(a / m);
                    }
                }
            } else {
                dst.data = buf2;
            }

            return dst;
        }

        function _scaleImageIncrementally(src, dst) {
            var incrementCount = 0;
            var currentWidth = src.width,
                currentHeight = src.height;
            var targetWidth = dst.width,
                targetHeight = dst.height;

            dst.data = src.data;
            dst.width = src.width;
            dst.height = src.height;

            // For ultra quality should use 7
            var fraction = 2;

            do {
                var prevCurrentWidth = currentWidth;
                var prevCurrentHeight = currentHeight;

                // If the current width is bigger than our target, cut it in half and sample again.
                if (currentWidth > targetWidth) {
                    currentWidth -= (currentWidth / fraction);

                    // If we cut the width too far it means we are on our last iteration. Just set it to the target width and finish up.
                    if (currentWidth < targetWidth)
                        currentWidth = targetWidth;
                }

                // If the current height is bigger than our target, cut it in half and sample again.
                if (currentHeight > targetHeight) {
                    currentHeight -= (currentHeight / fraction);

                    // If we cut the height too far it means we are on our last iteration. Just set it to the target height and finish up.
                    if (currentHeight < targetHeight)
                        currentHeight = targetHeight;
                }

                // Stop when we cannot incrementally step down anymore.
                if (prevCurrentWidth === currentWidth && prevCurrentHeight === currentHeight)
                    break;

                // Render the incremental scaled image.
                var incrementalImage = {
                    data: new Buffer(currentWidth * currentHeight * 4),
                    width: currentWidth,
                    height: currentHeight
                };
                _doBicubicInterpolation(dst, incrementalImage);

                // Now treat our incremental partially scaled image as the src image
                // and cycle through our loop again to do another incremental scaling of it (if necessary).
                dst.data = incrementalImage.data;
                dst.width = incrementalImage.width;
                dst.height = incrementalImage.height;

                // Track how many times we go through this cycle to scale the image.
                incrementCount++;
            } while (currentWidth !== targetWidth || currentHeight !== targetHeight);

            return dst;
        }

        return promiseFactory.makePromise(function (resolve) {
            var dst = {
                data: new Buffer(targetWidth * targetHeight * 4),
                width: targetWidth,
                height: targetHeight
            };

            if (dst.width > image.width || dst.height > image.height) {
                _doBicubicInterpolation(image, dst);
            } else {
                _scaleImageIncrementally(image, dst);
            }

            image.data = dst.data;
            image.width = dst.width;
            image.height = dst.height;
            resolve(image);
        });
    };

    /**
     * Crops a parsed image - the image is changed
     *
     * @param {png.Image} image
     * @param {{left: number, top: number, width: number, height: number}} region Region to crop
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise.<png.Image>}
     **/
    ImageUtils.cropImage = function cropImage(image, region, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            if (!region) {
                resolve(image);
                return;
            }

            if (region.top < 0 || region.top >= image.height || region.left < 0 || region.left >= image.width) {
                return reject(new Error('region is outside the image bounds!'));
            }

            // process the pixels - crop
            var croppedArray = [];
            var yStart = region.top,
                yEnd = Math.min(region.top + region.height, image.height),
                xStart = region.left,
                xEnd = Math.min(region.left + region.width, image.width);

            var y, x, idx, i;
            for (y = yStart; y < yEnd; y++) {
                for (x = xStart; x < xEnd; x++) {
                    idx = (image.width * y + x) << 2;
                    for (i = 0; i < 4; i++) {
                        croppedArray.push(image.data[idx + i]);
                    }
                }
            }

            image.data = new Buffer(croppedArray);
            image.width = xEnd - xStart;
            image.height = yEnd - yStart;

            resolve(image);
        });
    };

    /**
     * Rotates a parsed image - the image is changed
     *
     * @param {png.Image} image
     * @param {number} deg how many degrees to rotate (in actuality it's only by multipliers of 90)
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise.<png.Image>}
     **/
    ImageUtils.rotateImage = function rotateImage(image, deg, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            if (typeof deg !== "number") {
                return reject(new Error('deg must be a number!'));
            }

            var i = Math.round(deg / 90) % 4;
            if (i < 0) i += 4;

            while (i > 0) {
                var buffer = new Buffer(image.data.length);
                var offset = 0;
                for (var x = 0; x < image.width; x++) {
                    for (var y = image.height - 1; y >= 0; y--) {
                        var idx = (image.width * y + x) << 2;
                        var data = image.data.readUInt32BE(idx, true);
                        buffer.writeUInt32BE(data, offset, true);
                        offset += 4;
                    }
                }

                image.data = Buffer.from(buffer);
                var tmp = image.width;
                //noinspection JSSuspiciousNameCombination
                image.width = image.height;
                image.height = tmp;

                i--;
            }

            resolve(image);
        });
    };

    /**
     * Copies pixels from the source image to the destination image.
     *
     * @param {png.Image} dstImage The destination image.
     * @param {{x: number, y: number}} dstPosition The pixel which is the starting point to copy to.
     * @param {png.Image} srcImage The source image.
     * @param {{x: number, y: number}} srcPosition The pixel from which to start copying.
     * @param {{width: number, height: number}} size The region to be copied.
     * @returns {void}
     */
    ImageUtils.copyPixels = function copyPixels(dstImage, dstPosition, srcImage, srcPosition, size) {
        var y, dstY, srcY, x, dstX, srcX, dstIndex, srcIndex;

        // Fix the problem when src image was out of dst image and pixels was copied to wrong position in dst image.
        var maxHeight = dstPosition.y + size.height <= dstImage.height ? size.height : dstImage.height - dstPosition.y;
        var maxWidth = dstPosition.x + size.width <= dstImage.width ? size.width : dstImage.width - dstPosition.x;
        for (y = 0; y < maxHeight; ++y) {
            dstY = dstPosition.y + y;
            srcY = srcPosition.y + y;

            for (x = 0; x < maxWidth; ++x) {
                dstX = dstPosition.x + x;
                srcX = srcPosition.x + x;

                // Since each pixel is composed of 4 values (RGBA) we multiply each index by 4.
                dstIndex = (dstY * dstImage.width + dstX) << 2;
                srcIndex = (srcY * srcImage.width + srcX) << 2;

                dstImage.data[dstIndex] = srcImage.data[srcIndex];
                dstImage.data[dstIndex + 1] = srcImage.data[srcIndex + 1];
                dstImage.data[dstIndex + 2] = srcImage.data[srcIndex + 2];
                dstImage.data[dstIndex + 3] = srcImage.data[srcIndex + 3];
            }
        }
    };

    /**
     * Stitches a part into the image.
     *
     * @private
     * @param {Promise.<void>} stitchingPromise A promise which its "then" block will execute the stitching.
     * @param {png.Image} stitchedImage A PNG instance into which the part will be stitched.
     * @param {{position: {x: number, y: number}, size: {width: number, height: number}, image: Buffer}} part
     *         A "part" object given in the {@code parts} argument of {@link ImageUtils.stitchImage}.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise.<void>} A promise which is resolved when the stitching is done.
     */
    var _stitchPart = function (stitchingPromise, stitchedImage, part, promiseFactory) {
        //noinspection JSUnresolvedFunction
        return stitchingPromise.then(function () {
            return promiseFactory.makePromise(function(resolve) {
                //noinspection JSUnresolvedFunction
                ImageUtils.parseImage(part.image, promiseFactory).then(function (pngImage) {
                    ImageUtils.copyPixels(stitchedImage, part.position, pngImage, {x: 0, y: 0}, part.size);
                    resolve(stitchedImage);
                });
            });
        });
    };

    /**
     * Stitches the given parts to a full image.
     *
     * @param {{width: number, height: number}} fullSize The size of the stitched image.
     * @param {Array<{position: {x: number, y: number}, size: {width: number, height: number}, image: Buffer}>} parts
     *         The parts to stitch into an image.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise.<png.Image>} A promise which resolves to the stitched image.
     */
    ImageUtils.stitchImage = function stitchImage(fullSize, parts, promiseFactory) {
        return promiseFactory.makePromise(function(resolve) {
            var stitchedImage = png.createImage({filterType: 4, width: fullSize.width, height: fullSize.height});
            var stitchingPromise = promiseFactory.makePromise(function (resolve) { resolve(); });

            for (var i = 0; i < parts.length; ++i) {
                stitchingPromise = _stitchPart(stitchingPromise, stitchedImage, parts[i], promiseFactory);
            }

            var lastPart = parts[parts.length - 1];
            var actualImageWidth = lastPart.position.x + lastPart.size.width;
            var actualImageHeight = lastPart.position.y + lastPart.size.height;

            stitchingPromise.then(function () {
                // If the actual image size is smaller than the extracted size, we crop the image.
                if (actualImageWidth < stitchedImage.width || actualImageHeight < stitchedImage.height) {
                    var newWidth = stitchedImage.width > actualImageWidth ? actualImageWidth : stitchedImage.width;
                    var newHeight = stitchedImage.height > actualImageHeight ? actualImageHeight : stitchedImage.height;
                    return ImageUtils.cropImage(stitchedImage, {left: 0, top: 0, width: newWidth, height: newHeight}, promiseFactory);
                }
            }).then(function () {
                return ImageUtils.packImage(stitchedImage, promiseFactory);
            }).then(function (buffer) {
                resolve(buffer);
            });
        });
    };

    /**
     * Get png size from image buffer. Don't require parsing the image
     *
     * @param {Buffer} imageBuffer
     * @param {PromiseFactory} promiseFactory
     * @return {{width: number, height: number}}
     */
    ImageUtils.getImageSizeFromBuffer = function (imageBuffer, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            if (imageBuffer[12] === 0x49 && imageBuffer[13] === 0x48 && imageBuffer[14] === 0x44 && imageBuffer[15] === 0x52) {
                var width = (imageBuffer[16] * 256 * 256 * 256) + (imageBuffer[17] * 256 * 256) + (imageBuffer[18] * 256) + imageBuffer[19];
                var height = (imageBuffer[20] * 256 * 256 * 256) + (imageBuffer[21] * 256 * 256) + (imageBuffer[22] * 256) + imageBuffer[23];
                resolve({width: width, height: height});
                return;
            }

            reject("Buffer contains unsupported image type.");
        });
    };

    /**
     *
     * @param {Buffer} imageBuffer
     * @param {string} filename
     * @param {PromiseFactory} promiseFactory
     * @return {Promise.<void>}
     */
    ImageUtils.saveImage = function (imageBuffer, filename, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            fs.writeFile(filename, imageBuffer, function(err) {
                if(err) {
                    reject(err);
                }

                resolve();
            });
        });
    };

    module.exports = ImageUtils;
}());
