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
     *
     * parseImage - processes a PNG buffer - returns it as BMP.
     *
     * @param {Buffer} image
     * @param {Object} promiseFactory
     *
     * @returns {Object} - Promise
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
     *
     * packImage - repacks a parsed image to a PNG buffer.
     *
     * @param {Object} imageBmp - parsed image as returned from parseImage
     * @param {Object} promiseFactory
     *
     * @returns {Object} - Promise - when resolved contains a buffer
     *
     **/
    ImageUtils.packImage = function packImage(imageBmp, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {

            // Write back to a temp png file
            var croppedImageStream = new WritableBufferStream();
            imageBmp.pack().pipe(croppedImageStream)
                .on('finish', function () {
                    resolve(croppedImageStream.getBuffer());
                });
        });
    };

    /**
     *
     * scaleImage - scaled a parsed image by a given factor.
     *
     * @param {Object} imageBmp - will be modified
     * @param {Float} scale factor to multiply the image dimensions by (lower than 1 for scale down)
     * @param {Object} promiseFactory
     *
     * @returns {Object} - Promise - empty
     *
     **/
    ImageUtils.scaleImage = function scaleImage(imageBmp, scale, promiseFactory) {
        // two-dimensional array coordinates to a vector index
        function xytoi(ix, iy, w) {
            // byte array, r,g,b,a
            return((ix + w * iy) * 4);
        }

        function interpolate (t, a, b, c, d){
            return 0.5 * (c - a + (2.0*a - 5.0*b + 4.0*c - d + (3.0*(b - c) + d - a)*t)*t)*t + b;
        }

        function interpolateBicubic(x, y, values) {
            var i0, i1, i2, i3;

            i0 = interpolate(x, values[0][0], values[1][0], values[2][0], values[3][0]);
            i1 = interpolate(x, values[0][1], values[1][1], values[2][1], values[3][1]);
            i2 = interpolate(x, values[0][2], values[1][2], values[2][2], values[3][2]);
            i3 = interpolate(x, values[0][3], values[1][3], values[2][3], values[3][3]);
            return interpolate(y, i0, i1, i2, i3);
        }

        function doBicubicScale(srcImg, scale) {

            var destWidth = srcImg.width * scale;
            var destHeight = srcImg.height * scale;
            var destImageData = [];
            var i, j;
            var dx, dy;
            var iyv, iy0, ixv, ix0;
            var repeatX, repeatY;
            var idxD;
            var offset_row0, offset_row1, offset_row2, offset_row3;
            var offset_col0, offset_col1, offset_col2, offset_col3;
            var red_pixels, green_pixels, blue_pixels, alpha_pixels;
            for (i = 0; i < destHeight; ++i) {
                iyv = i / scale;
                iy0 = Math.floor(iyv);

                // We have to special-case the pixels along the border and repeat their values if neccessary
                repeatY = 0;
                if(iy0 < 1) repeatY = -1;
                else if(iy0 > srcImg.height - 3) repeatY = iy0 - (srcImg.height - 3);

                for (j = 0; j < destWidth; ++j) {
                    ixv = j / scale;
                    ix0 = Math.floor(ixv);

                    // We have to special-case the pixels along the border and repeat their values if neccessary
                    repeatX = 0;
                    if(ix0 < 1) repeatX = -1;
                    else if(ix0 > srcImg.width - 3) repeatX = ix0 - (srcImg.width - 3);

                    offset_row1 = ((iy0)   * srcImg.width + ix0) * 4;
                    offset_row0 = repeatY < 0 ? offset_row1 : ((iy0-1) * srcImg.width + ix0) * 4;
                    offset_row2 = repeatY > 1 ? offset_row1 : ((iy0+1) * srcImg.width + ix0) * 4;
                    offset_row3 = repeatY > 0 ? offset_row2 : ((iy0+2) * srcImg.width + ix0) * 4;

                    offset_col1 = 0;
                    offset_col0 = repeatX < 0 ? offset_col1 : -4;
                    offset_col2 = repeatX > 1 ? offset_col1 : 4;
                    offset_col3 = repeatX > 0 ? offset_col2 : 8;

                    //Each offset is for the start of a row's red pixels
                    red_pixels = [[srcImg.data[offset_row0+offset_col0], srcImg.data[offset_row1+offset_col0], srcImg.data[offset_row2+offset_col0], srcImg.data[offset_row3+offset_col0]],
                        [srcImg.data[offset_row0+offset_col1], srcImg.data[offset_row1+offset_col1], srcImg.data[offset_row2+offset_col1], srcImg.data[offset_row3+offset_col1]],
                        [srcImg.data[offset_row0+offset_col2], srcImg.data[offset_row1+offset_col2], srcImg.data[offset_row2+offset_col2], srcImg.data[offset_row3+offset_col2]],
                        [srcImg.data[offset_row0+offset_col3], srcImg.data[offset_row1+offset_col3], srcImg.data[offset_row2+offset_col3], srcImg.data[offset_row3+offset_col3]]];
                    offset_row0++;
                    offset_row1++;
                    offset_row2++;
                    offset_row3++;
                    //Each offset is for the start of a row's green pixels
                    green_pixels = [[srcImg.data[offset_row0+offset_col0], srcImg.data[offset_row1+offset_col0], srcImg.data[offset_row2+offset_col0], srcImg.data[offset_row3+offset_col0]],
                        [srcImg.data[offset_row0+offset_col1], srcImg.data[offset_row1+offset_col1], srcImg.data[offset_row2+offset_col1], srcImg.data[offset_row3+offset_col1]],
                        [srcImg.data[offset_row0+offset_col2], srcImg.data[offset_row1+offset_col2], srcImg.data[offset_row2+offset_col2], srcImg.data[offset_row3+offset_col2]],
                        [srcImg.data[offset_row0+offset_col3], srcImg.data[offset_row1+offset_col3], srcImg.data[offset_row2+offset_col3], srcImg.data[offset_row3+offset_col3]]];
                    offset_row0++;
                    offset_row1++;
                    offset_row2++;
                    offset_row3++;
                    //Each offset is for the start of a row's blue pixels
                    blue_pixels = [[srcImg.data[offset_row0+offset_col0], srcImg.data[offset_row1+offset_col0], srcImg.data[offset_row2+offset_col0], srcImg.data[offset_row3+offset_col0]],
                        [srcImg.data[offset_row0+offset_col1], srcImg.data[offset_row1+offset_col1], srcImg.data[offset_row2+offset_col1], srcImg.data[offset_row3+offset_col1]],
                        [srcImg.data[offset_row0+offset_col2], srcImg.data[offset_row1+offset_col2], srcImg.data[offset_row2+offset_col2], srcImg.data[offset_row3+offset_col2]],
                        [srcImg.data[offset_row0+offset_col3], srcImg.data[offset_row1+offset_col3], srcImg.data[offset_row2+offset_col3], srcImg.data[offset_row3+offset_col3]]];
                    offset_row0++;
                    offset_row1++;
                    offset_row2++;
                    offset_row3++;
                    //Each offset is for the start of a row's alpha pixels
                    alpha_pixels =[[srcImg.data[offset_row0+offset_col0], srcImg.data[offset_row1+offset_col0], srcImg.data[offset_row2+offset_col0], srcImg.data[offset_row3+offset_col0]],
                        [srcImg.data[offset_row0+offset_col1], srcImg.data[offset_row1+offset_col1], srcImg.data[offset_row2+offset_col1], srcImg.data[offset_row3+offset_col1]],
                        [srcImg.data[offset_row0+offset_col2], srcImg.data[offset_row1+offset_col2], srcImg.data[offset_row2+offset_col2], srcImg.data[offset_row3+offset_col2]],
                        [srcImg.data[offset_row0+offset_col3], srcImg.data[offset_row1+offset_col3], srcImg.data[offset_row2+offset_col3], srcImg.data[offset_row3+offset_col3]]];

                    // overall coordinates to unit square
                    dx = ixv - ix0; dy = iyv - iy0;

                    idxD = xytoi(j, i, destWidth);

                    destImageData[idxD] = interpolateBicubic(dx, dy, red_pixels);

                    destImageData[idxD+1] = interpolateBicubic(dx, dy, green_pixels);

                    destImageData[idxD+2] = interpolateBicubic(dx, dy, blue_pixels);

                    destImageData[idxD+3] = interpolateBicubic(dx, dy, alpha_pixels);
                }
            }

            return {
                data: destImageData,
                width: destWidth,
                height: destHeight
            };
        }

        //function doBilinearScale(srcImg, scale) {
        //    // c.f.: wikipedia english article on bilinear interpolation
        //    // taking the unit square, the inner loop looks like this
        //    // note: there's a function call inside the double loop to this one
        //    // maybe a performance killer, optimize this whole code as you need
        //    function inner(f00, f10, f01, f11, x, y) {
        //        var un_x = 1.0 - x; var un_y = 1.0 - y;
        //        return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
        //    }
        //    var destWidth = srcImg.width * scale;
        //    var destHeight = srcImg.height * scale;
        //    var destImageData = [];
        //    var i, j;
        //    var iyv, iy0, iy1, ixv, ix0, ix1;
        //    var idxD, idxS00, idxS10, idxS01, idxS11;
        //    var dx, dy;
        //    var r, g, b, a;
        //    for (i = 0; i < destHeight; ++i) {
        //        iyv = i / scale;
        //        iy0 = Math.floor(iyv);
        //        // Math.ceil can go over bounds
        //        iy1 = ( Math.ceil(iyv) > (srcImg.height-1) ? (srcImg.height-1) : Math.ceil(iyv) );
        //        for (j = 0; j < destWidth; ++j) {
        //            ixv = j / scale;
        //            ix0 = Math.floor(ixv);
        //
        //            // Math.ceil can go over bounds
        //            ix1 = ( Math.ceil(ixv) > (srcImg.width-1) ? (srcImg.width-1) : Math.ceil(ixv) );
        //            idxD = xytoi(j, i, destWidth);
        //
        //            // matrix to vector indices
        //            idxS00 = xytoi(ix0, iy0, srcImg.width);
        //            idxS10 = xytoi(ix1, iy0, srcImg.width);
        //            idxS01 = xytoi(ix0, iy1, srcImg.width);
        //            idxS11 = xytoi(ix1, iy1, srcImg.width);
        //
        //            // overall coordinates to unit square
        //            dx = ixv - ix0; dy = iyv - iy0;
        //
        //            // I let the r, g, b, a on purpose for debugging
        //            r = inner(srcImg.data[idxS00], srcImg.data[idxS10],
        //                srcImg.data[idxS01], srcImg.data[idxS11], dx, dy);
        //            destImageData[idxD] = r;
        //
        //            g = inner(srcImg.data[idxS00+1], srcImg.data[idxS10+1],
        //                srcImg.data[idxS01+1], srcImg.data[idxS11+1], dx, dy);
        //            destImageData[idxD+1] = g;
        //
        //            b = inner(srcImg.data[idxS00+2], srcImg.data[idxS10+2],
        //                srcImg.data[idxS01+2], srcImg.data[idxS11+2], dx, dy);
        //            destImageData[idxD+2] = b;
        //
        //            a = inner(srcImg.data[idxS00+3], srcImg.data[idxS10+3],
        //                srcImg.data[idxS01+3], srcImg.data[idxS11+3], dx, dy);
        //            destImageData[idxD+3] = a;
        //        }
        //    }
        //
        //    return {
        //        data: destImageData,
        //        width: destWidth,
        //        height: destHeight
        //    };
        //}

        //function doLanczosScale(srcImgData, width, height, scale) {
        //    function lanczosCreate(lobes) {
        //        return function(x) {
        //            if (x > lobes)
        //                return 0;
        //            x *= Math.PI;
        //            if (Math.abs(x) < 1e-16)
        //                return 1;
        //            var xx = x / lobes;
        //            return Math.sin(x) * Math.sin(xx) / x / xx;
        //        };
        //    }
        //
        //    function process1() {
        //        center.x = (u + 0.5) * ratio;
        //        icenter.x = Math.floor(center.x);
        //        for (var v = 0; v < destHeight; v++) {
        //            center.y = (v + 0.5) * ratio;
        //            icenter.y = Math.floor(center.y);
        //            var a, r, g, b;
        //            a = r = g = b = 0;
        //            for (var i = icenter.x - range2; i <= icenter.x + range2; i++) {
        //                if (i < 0 || i >= width)
        //                    continue;
        //                var f_x = Math.floor(1000 * Math.abs(i - center.x));
        //                if (!cacheLanc[f_x])
        //                    cacheLanc[f_x] = {};
        //                for (var j = icenter.y - range2; j <= icenter.y + range2; j++) {
        //                    if (j < 0 || j >= height)
        //                        continue;
        //                    var f_y = Math.floor(1000 * Math.abs(j - center.y));
        //                    if (cacheLanc[f_x][f_y] == undefined)
        //                        cacheLanc[f_x][f_y] = lanczos(Math.sqrt(Math.pow(f_x * rcp_ratio, 2)
        //                        + Math.pow(f_y * rcp_ratio, 2)) / 1000);
        //                    var weight = cacheLanc[f_x][f_y];
        //                    if (weight > 0) {
        //                        var idx = (j * width + i) * 4;
        //                        a += weight;
        //                        r += weight * srcImgData[idx];
        //                        g += weight * srcImgData[idx + 1];
        //                        b += weight * srcImgData[idx + 2];
        //                    }
        //                }
        //            }
        //            var idx = (v * destWidth + u) * 4;
        //            destImageData[idx] = r / a;
        //            destImageData[idx + 1] = g / a;
        //            destImageData[idx + 2] = b / a;
        //            destImageData[idx + 3] = 0.5;
        //        }
        //
        //        u++;
        //    }
        //
        //    var lobes = 1;
        //    var lanczos = lanczosCreate(lobes);
        //    var destWidth = width * scale;
        //    var destHeight = height * scale;
        //    var destImageData = [];
        //    var ratio = 1 / scale;
        //    var rcp_ratio = 2 * scale;
        //    var range2 = Math.ceil(ratio * lobes / 2);
        //    var cacheLanc = {};
        //    var center = {};
        //    var icenter = {};
        //    var u = 0;
        //    while (u < destWidth) {
        //        process1();
        //    }
        //
        //    return{
        //        data: destImageData,
        //        width: destWidth,
        //        height: destHeight
        //    };
        //}
        //
        //function resample_hermite(srcImg, scale){
        //    var destWidth = srcImg.width * scale;
        //    var destHeight = srcImg.height * scale;
        //    var destImageData = [];
        //    var ratioHalf = Math.ceil(2/scale);
        //
        //    for(var j = 0; j < destHeight; j++){
        //        for(var i = 0; i < destWidth; i++){
        //            var x2 = (i + j*destWidth) * 4;
        //            var weight = 0;
        //            var weights = 0;
        //            var weights_alpha = 0;
        //            var gx_r = 0, gx_g = 0, gx_b = 0, gx_a = 0;
        //            var center_y = (j + 0.5)/scale;
        //            for(var yy = Math.floor(j/scale); yy < (j + 1)/scale; yy++){
        //                var dy = Math.abs(center_y - (yy + 0.5))/ratioHalf;
        //                var center_x = (i + 0.5) * ratioHalf;
        //                var w0 = dy*dy //pre-calc part of w
        //                for(var xx = Math.floor(i / scale); xx < (i + 1)/scale; xx++){
        //                    var dx = Math.abs(center_x - (xx + 0.5))/ratioHalf;
        //                    var w = Math.sqrt(w0 + dx*dx);
        //                    if(w >= -1 && w <= 1){
        //                        //hermite filter
        //                        weight = 2 * w*w*w - 3*w*w + 1;
        //                        if(weight > 0) {
        //                            dx = 4*(xx + yy*srcImg.width);
        //                            //alpha
        //                            gx_a += weight * srcImg.data[dx + 3];
        //                            weights_alpha += weight;
        //                            //colors
        //                            if(srcImg.data[dx + 3] < 255)
        //                                weight = weight * srcImg.data[dx + 3] / 250;
        //                            gx_r += weight * srcImg.data[dx];
        //                            gx_g += weight * srcImg.data[dx + 1];
        //                            gx_b += weight * srcImg.data[dx + 2];
        //                            weights += weight;
        //                        }
        //                    }
        //                }
        //            }
        //            destImageData[x2]     = gx_r / weights;
        //            destImageData[x2 + 1] = gx_g / weights;
        //            destImageData[x2 + 2] = gx_b / weights;
        //            destImageData[x2 + 3] = gx_a / weights_alpha;
        //        }
        //    }
        //
        //    return {
        //        data: destImageData,
        //        width: destWidth,
        //        height: destHeight
        //    };
        //}

        return promiseFactory.makePromise(function (resolve, reject) {

            if (scale === 1) {
                resolve(imageBmp);
                return;
            }

            var scaledBmp = doBicubicScale(imageBmp, scale);
            imageBmp.data = new Buffer(scaledBmp.data);
            imageBmp.width = scaledBmp.width;
            imageBmp.height = scaledBmp.height;

            resolve(imageBmp);

        });
    };

    /**
     *
     * cropImage - crops a parsed image - the image is changed
     *
     * @param {Object} imageBmp BMP
     * @param {Object} region to crop (left,top,width,height)
     * @param {Object} promiseFactory
     *
     * @returns {Object} - Promise - empty, just indicating completion
     *
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
     *
     * rotateImage - rotates a parsed image - the image is changed
     *
     * @param {Object} imageBmp BMP
     * @param {Object} deg how many degrees to rotate (in actuallity it's only by multipliers of 90)
     * @param {Object} promiseFactory
     *
     * @returns {Object} - Promise - empty, just indicating completion
     *
     **/
    ImageUtils.rotateImage = function rotateImage(imageBmp, deg, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            if (typeof deg != "number") {
                return reject(new Error('deg must be a number!'));
            }

            var i = Math.round(deg / 90) % 4;
            if (i < 0) i += 4;

            while (i > 0) {
                var bitmap = new Buffer(imageBmp.data.length);
                var offset = 0;
                for (var x = 0; x < imageBmp.width; x++) {
                    for (var y = imageBmp.height - 1; y >= 0; y--) {
                        var idx = (imageBmp.width * y + x) << 2;
                        var data = imageBmp.data.readUInt32BE(idx, true);
                        bitmap.writeUInt32BE(data, offset, true);
                        offset += 4;
                    }
                }

                imageBmp.data = new Buffer(bitmap);
                var tmp = imageBmp.width;
                imageBmp.width = imageBmp.height;
                imageBmp.height = tmp;

                i--;
            }

            resolve(imageBmp);
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
    ImageUtils.copyPixels = function copyPixels(dst, dstPosition, src, srcPosition, size) {
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
     * @param {Object} promiseFactory
     *
     * @return {Promise} A promise which resolves to the PNG instance.
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

    //noinspection JSValidateJSDoc
    /**
     * Stitches a part into the image.
     * @param stitchingPromise A promise which its "then" block will execute the stitching. T
     * @param {PNG} stitchedImage A PNG instance into which the part will be stitched.
     * @param  {object} part A "part" object given in the {@code parts} argument of {@link ImageUtils.stitchImage}.
     * @param {Object} promiseFactory
     *
     * @return {Promise} A promise which is resolved when the stitching is done.
     * @private
     */
    var _stitchPart = function (stitchingPromise, stitchedImage, part, promiseFactory) {
        //noinspection JSUnresolvedFunction
        return stitchingPromise.then(function () {
            return promiseFactory.makePromise(function(resolve) {
                //noinspection JSUnresolvedFunction
                ImageUtils.createPngFromBuffer(part.image, promiseFactory).then(function (pngImage) {
                    ImageUtils.copyPixels(stitchedImage, part.position, pngImage, {left: 0, top: 0}, part.size);
                    resolve(stitchedImage);
                });
            });
        });
    };

    //noinspection JSValidateJSDoc
    /**
     * Stitches the given parts to a full image.
     * @param fullSize The size of the stitched image. Should have 'width' and 'height' properties.
     * @param {Array} parts The parts to stitch into an image. Each part should have: 'position'
     *                      (which includes top/left), 'size' (which includes width/height) and image
     *                      (a buffer containing PNG bytes) properties.
     * @param {Object} promiseFactory
     *
     * @return {Promise} A promise which resolves to the stitched image.
     */
    ImageUtils.stitchImage = function stitchImage(fullSize, parts, promiseFactory) {
        return promiseFactory.makePromise(function(resolve) {
            var stitchedImage = new PNG({filterType: 4, width: fullSize.width, height: fullSize.height});
            var stitchingPromise = promiseFactory.makePromise(function (resolve) { resolve(); });

            //noinspection JSLint
            for (var i = 0; i < parts.length; ++i) {
                //noinspection JSUnresolvedFunction
                stitchingPromise = _stitchPart(stitchingPromise, stitchedImage, parts[i], promiseFactory);
            }

            //noinspection JSUnresolvedFunction
            stitchingPromise.then(function () {
                var stitchedImageStream = new WritableBufferStream();
                //noinspection JSUnresolvedFunction
                stitchedImage.pack().pipe(stitchedImageStream)
                    .on('finish', function () {
                        resolve(stitchedImageStream.getBuffer());
                    });
            });
        });
    };

    module.exports = ImageUtils;
}());
