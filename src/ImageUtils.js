/*
 ---

 name: ImageUtils

 description: Provide means of image manipulations.

 provides: [ImageUtils]
 requires: [pngjs]

 ---
 */

(function () {
    "use strict";

    var temp = require('temp'),
        fs = require('fs'),
        PNG = require('pngjs').PNG,
        PromiseFactory = require('./EyesPromiseFactory');

    temp.track();

    var ImageUtils = {};

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
        return PromiseFactory.makePromise(function (resolve, reject) {

            var result = {
                imageBuffer: image,
                width: 0,
                height: 0
            };
            // 2. open a temp file
            temp.open('eyes-snap-', function (err1, info) {
                temp.open('eyes-crop-', function (err2, cropInfo) {
                    if (err1 || err2) {
                        reject(new Error('Failed to open a temp file:' + err1 || err2));
                        return;
                    }

                    // 3. write the buffer to the temp file
                    fs.writeFile(info.path, image, function (err) {
                        if (err) {
                            reject(new Error('Failed to write to a temp file:' + err));
                            return;
                        }

                        // 4. pass the file to PNG using read stream

                        fs.createReadStream(info.path)
                            .pipe(new PNG({
                                filterType: 4
                            }))
                            .on('parsed', function () {

                                if ((!region) || region.width === 0 || region.height === 0) {
                                    //No need to crop - no region
                                    result.imageBuffer = image;
                                    result.width = this.width;
                                    result.height = this.height;
                                    resolve(result);
                                    return;
                                }

                                if (region.top >= this.height || region.left >= this.width) {
                                    reject(new Error('region is not contained in screen shot'));
                                    return;
                                }

                                // 5. process the pixels - crop
                                var croppedArray = [];
                                var yStart = region.top,
                                    yEnd = Math.min(region.top + region.height, this.height),
                                    xStart = region.left,
                                    xEnd = Math.min(region.left + region.width, this.width);

                                var y, x, idx, i;
                                for (y = yStart; y < yEnd; y++) {
                                    for (x = xStart; x < xEnd; x++) {
                                        idx = (this.width * y + x) << 2;
                                        for (i = 0; i < 4; i++) {
                                            croppedArray.push(this.data[idx + i]);
                                        }
                                    }
                                }

                                this.data = new Buffer(croppedArray);
                                this.width = xEnd - xStart;
                                this.height = yEnd - yStart;
                                result.width = this.width;
                                result.height = this.height;

                                // 6. Write back to a temp png file

                                this.pack().pipe(fs.createWriteStream(cropInfo.path))
                                    .on('finish', function () {
                                        // 7. Read the file into a buffer
                                        fs.readFile(cropInfo.path, function (err, data) {
                                            if (err) {
                                                reject(new Error('Failed to read a temp file:' + err));
                                                return;
                                            }

                                            result.imageBuffer = data;
                                            resolve(result);
                                        });
                                    });
                            });
                    });
                });
            });
        });
    };

    module.exports = ImageUtils;
}());