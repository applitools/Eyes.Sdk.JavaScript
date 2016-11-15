/*
 ---

 name: ImageUtils

 description: Provide means of image manipulations.

 ---
 */

(function () {
    "use strict";

    var StreamUtils = require('./StreamUtils'),
        fs = require('fs'),
        /** @type {PNG} */
        PNG = require('pngjs').PNG;

    var ReadableBufferStream = StreamUtils.ReadableBufferStream,
        WritableBufferStream = StreamUtils.WritableBufferStream;

    var ImageUtils = {};

    /**
     * Processes a PNG buffer - returns it as BMP.
     *
     * @param {Buffer} image
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<PNG>} imageBmp object
     *
     **/
    ImageUtils.parseImage = function parseImage(image, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            if (!fs.open) {
                return resolve(image);
            }

            // pass the file to PNG using read stream
            var origImageReadableStream = new ReadableBufferStream(image, undefined);
            var origImage = new PNG({filterType: 4});
            //noinspection JSUnresolvedFunction
            origImageReadableStream.pipe(origImage)
                .on('parsed', function () {
                    resolve(origImage);
                });
        });
    };

    /**
     * Repacks a parsed image to a PNG buffer.
     *
     * @param {PNG} imageBmp Parsed image as returned from parseImage
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<Buffer>} when resolved contains a buffer
     **/
    ImageUtils.packImage = function packImage(imageBmp, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {

            // Write back to a temp png file
            var croppedImageStream = new WritableBufferStream();
            imageBmp.pack().pipe(croppedImageStream)
                .on('finish', function () {
                    resolve(croppedImageStream.getBuffer());
                });
        });
    };

    /**
     * Scaled a parsed image by a given factor.
     *
     * @param {PNG} imageBmp - will be modified
     * @param {number} scale factor to multiply the image dimensions by (lower than 1 for scale down)
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<void>}
     **/
    ImageUtils.scaleImage = function scaleImage(imageBmp, scale, promiseFactory) {
        if (scale === 1) {
            return promiseFactory.makePromise(function (resolve) {
                resolve(imageBmp);
            });
        }

        var w = imageBmp.width * scale;
        var h = imageBmp.height * scale;
        return ImageUtils.resizeImage(imageBmp, w, h, promiseFactory);
    };

    /**
     * Resize a parsed image by a given dimensions.
     *
     * @param {PNG} imageBmp - will be modified
     * @param {number} width The width to resize the image to
     * @param {number} height The height to resize the image to
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<void>}
     **/
    ImageUtils.resizeImage = function scaleImage(imageBmp, width, height, promiseFactory) {

        //noinspection JSUnusedLocalSymbols
        function doBicubicInterpolation(src, dst) {
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

            var interpolateCubic = function (x0, x1, x2, x3, t) {
                var a0 = x3 - x2 - x0 + x1;
                var a1 = x0 - x1 - a0;
                var a2 = x2 - x0;
                return Math.max(0, Math.min(255, (a0 * (t * t * t)) + (a1 * (t * t)) + (a2 * t) + (x1)));
            };

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
                        buf1[buf1Pos + k] = interpolateCubic(x0, x1, x2, x3, t);
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

                        buf2[buf2Pos + k] = interpolateCubic(y0, y1, y2, y3, t);
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
        }

        //noinspection JSUnusedLocalSymbols
        function doBilinearInterpolation(src, dst) {
            var wSrc = src.width;
            var hSrc = src.height;

            var wDst = dst.width;
            var hDst = dst.height;

            var bufSrc = src.data;
            var bufDst = dst.data;

            var interpolate = function (k, kMin, vMin, kMax, vMax) {
                if (kMin === kMax) {
                    return vMin;
                }

                return Math.round((k - kMin) * vMax + (kMax - k) * vMin);
            };

            var assign = function (pos, offset, x, xMin, xMax, y, yMin, yMax) {
                var posMin = (yMin * wSrc + xMin) * 4 + offset;
                var posMax = (yMin * wSrc + xMax) * 4 + offset;
                var vMin = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);

                if (yMax === yMin) {
                    bufDst[pos + offset] = vMin;
                } else {
                    posMin = (yMax * wSrc + xMin) * 4 + offset;
                    posMax = (yMax * wSrc + xMax) * 4 + offset;
                    var vMax = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);

                    bufDst[pos + offset] = interpolate(y, yMin, vMin, yMax, vMax);
                }
            };

            for (var i = 0; i < hDst; i++) {
                for (var j = 0; j < wDst; j++) {
                    var posDst = (i * wDst + j) * 4;

                    var x = j * wSrc / wDst;
                    var xMin = Math.floor(x);
                    var xMax = Math.min(Math.ceil(x), wSrc - 1);

                    var y = i * hSrc / hDst;
                    var yMin = Math.floor(y);
                    var yMax = Math.min(Math.ceil(y), hSrc - 1);

                    assign(posDst, 0, x, xMin, xMax, y, yMin, yMax);
                    assign(posDst, 1, x, xMin, xMax, y, yMin, yMax);
                    assign(posDst, 2, x, xMin, xMax, y, yMin, yMax);
                    assign(posDst, 3, x, xMin, xMax, y, yMin, yMax);
                }
            }
        }

        //noinspection JSUnusedLocalSymbols
        function doNearestNeighbor(src, dst) {
            var wSrc = src.width;
            var hSrc = src.height;

            var wDst = dst.width;
            var hDst = dst.height;

            var bufSrc = src.data;
            var bufDst = dst.data;

            for (var i = 0; i < hDst; i++) {
                for (var j = 0; j < wDst; j++) {
                    var posDst = (i * wDst + j) * 4;

                    var iSrc = Math.round(i * hSrc / hDst);
                    var jSrc = Math.round(j * wSrc / wDst);
                    var posSrc = (iSrc * wSrc + jSrc) * 4;

                    bufDst[posDst++] = bufSrc[posSrc++];
                    bufDst[posDst++] = bufSrc[posSrc++];
                    bufDst[posDst++] = bufSrc[posSrc++];
                    bufDst[posDst++] = bufSrc[posSrc++];
                }
            }
        }

        return promiseFactory.makePromise(function (resolve) {
            // round inputs
            width = Math.round(width);
            height = Math.round(height);


            var dst = {
                data: new Buffer(width * height * 4),
                width: width,
                height: height
            };

            doNearestNeighbor(imageBmp, dst); // fast
            // doBilinearInterpolation(imageBmp, dst);
            // doBicubicInterpolation(imageBmp, dst); // good quality
            imageBmp.data = dst.data;
            imageBmp.width = dst.width;
            imageBmp.height = dst.height;
            resolve(imageBmp);
        });
    };

    /**
     * Crops a parsed image - the image is changed
     *
     * @param {PNG} imageBmp
     * @param {{left: number, top: number, width: number, height: number}} region Region to crop
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<void>}
     **/
    ImageUtils.cropImage = function cropImage(imageBmp, region, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            if (!region) {
                resolve(imageBmp);
                return;
            }

            if (region.top < 0 || region.top >= imageBmp.height || region.left < 0 || region.left >= imageBmp.width) {
                return reject(new Error('region is outside the image bounds!'));
            }

            // process the pixels - crop
            var croppedArray = [];
            var yStart = region.top,
                yEnd = Math.min(region.top + region.height, imageBmp.height),
                xStart = region.left,
                xEnd = Math.min(region.left + region.width, imageBmp.width);

            var y, x, idx, i;
            for (y = yStart; y < yEnd; y++) {
                for (x = xStart; x < xEnd; x++) {
                    idx = (imageBmp.width * y + x) << 2;
                    for (i = 0; i < 4; i++) {
                        croppedArray.push(imageBmp.data[idx + i]);
                    }
                }
            }

            imageBmp.data = new Buffer(croppedArray);
            imageBmp.width = xEnd - xStart;
            imageBmp.height = yEnd - yStart;

            resolve(imageBmp);
        });
    };

    /**
     * Rotates a parsed image - the image is changed
     *
     * @param {PNG} imageBmp
     * @param {number} deg how many degrees to rotate (in actuality it's only by multipliers of 90)
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<void>}
     **/
    ImageUtils.rotateImage = function rotateImage(imageBmp, deg, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            if (typeof deg != "number") {
                return reject(new Error('deg must be a number!'));
            }

            var i = Math.round(deg / 90) % 4;
            if (i < 0) i += 4;

            while (i > 0) {
                var buffer = new Buffer(imageBmp.data.length);
                var offset = 0;
                for (var x = 0; x < imageBmp.width; x++) {
                    for (var y = imageBmp.height - 1; y >= 0; y--) {
                        var idx = (imageBmp.width * y + x) << 2;
                        var data = imageBmp.data.readUInt32BE(idx, true);
                        buffer.writeUInt32BE(data, offset, true);
                        offset += 4;
                    }
                }

                imageBmp.data = Buffer.from(buffer);
                var tmp = imageBmp.width;
                //noinspection JSSuspiciousNameCombination
                imageBmp.width = imageBmp.height;
                imageBmp.height = tmp;

                i--;
            }

            resolve(imageBmp);
        });
    };

    /**
     * Copies pixels from the source image to the destination image.
     *
     * @param {PNG} dst The destination image.
     * @param {{x: number, y: number}} dstPosition The pixel which is the starting point to copy to.
     * @param {PNG} src The source image.
     * @param {{x: number, y: number}} srcPosition The pixel from which to start copying.
     * @param {{width: number, height: number}} size The region to be copied.
     */
    ImageUtils.copyPixels = function copyPixels(dst, dstPosition, src, srcPosition, size) {
        var y, dstY, srcY, x, dstX, srcX, dstIndex, srcIndex;
        for (y = 0; y < size.height; ++y) {
            dstY = dstPosition.y + y;
            srcY = srcPosition.y + y;

            for (x = 0; x < size.width; ++x) {
                dstX = dstPosition.x + x;
                srcX = srcPosition.x + x;

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

    /**
     * Creates a PNG instance from the given buffer.
     *
     * @param {Buffer} buffer A buffer containing PNG bytes.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<PNG>} A promise which resolves to the PNG instance.
     */
    ImageUtils.createPngFromBuffer = function createPngFromBuffer(buffer, promiseFactory) {
        return promiseFactory.makePromise(function(resolve) {
            // In order to create a PNG instance from part.image, we first need to create a stream from it.
            var pngImageStream = new ReadableBufferStream(buffer);
            // Create the PNG
            var pngImage = new PNG({filterType: 4});
            //noinspection JSUnresolvedFunction
            pngImageStream.pipe(pngImage);
            pngImage.on('parsed', function () {
                resolve(pngImage);
            });
        });
    };

    /**
     * Stitches a part into the image.
     *
     * @private
     * @param {Promise<void>} stitchingPromise A promise which its "then" block will execute the stitching.
     * @param {PNG} stitchedImage A PNG instance into which the part will be stitched.
     * @param {{position: {x: number, y: number}, size: {width: number, height: number}, image: Buffer}} part
     *         A "part" object given in the {@code parts} argument of {@link ImageUtils.stitchImage}.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which is resolved when the stitching is done.
     */
    var _stitchPart = function (stitchingPromise, stitchedImage, part, promiseFactory) {
        //noinspection JSUnresolvedFunction
        return stitchingPromise.then(function () {
            return promiseFactory.makePromise(function(resolve) {
                //noinspection JSUnresolvedFunction
                ImageUtils.createPngFromBuffer(part.image, promiseFactory).then(function (pngImage) {
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
     * @return {Promise<Buffer>} A promise which resolves to the stitched image.
     */
    ImageUtils.stitchImage = function stitchImage(fullSize, parts, promiseFactory) {
        return promiseFactory.makePromise(function(resolve) {
            var stitchedImage = new PNG({filterType: 4, width: fullSize.width, height: fullSize.height});
            var stitchingPromise = promiseFactory.makePromise(function (resolve) { resolve(); });

            for (var i = 0; i < parts.length; ++i) {
                stitchingPromise = _stitchPart(stitchingPromise, stitchedImage, parts[i], promiseFactory);
            }

            stitchingPromise.then(function () {
                return ImageUtils.packImage(stitchedImage, promiseFactory);
            }).then(function (buffer) {
                resolve(buffer);
            });
        });
    };

    module.exports = ImageUtils;
}());
