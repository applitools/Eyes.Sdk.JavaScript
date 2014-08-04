/*
 ---

 name: ImageUtils

 description: Provide means of image manipulations.

 provides: [ImageUtils]
 requires: [pngjs]

 ---
 */

;(function() {
    "use strict";

    var temp = require('temp'),
        fs = require('fs'),
        util  = require('util'),
        PNG = require('pngjs').PNG,
        PromiseFactory = require('./EyesPromiseFactory');

    temp.track();

    var ImageUtils = {};

    ImageUtils.crop = function(base64png, region) {
        return PromiseFactory.makePromise(function (deferred) {

            if ((!region) || region.width == 0 || region.height == 0) {
                console.log('No need to crop - no region');
                deferred.fulfill(base64png);
                return;
            }

            // TODO: handle cases when region is not contained!

            console.log('cropping screenshot to:', region);

            // 1. create a buffer with the data
            var buf = new Buffer(base64png, 'base64');

            // 2. open a temp file
            temp.open('eyes-snap-', function (err1, info) {
                temp.open('eyes-crop-', function (err2, cropInfo) {
                    if (err1 || err2) {
                        console.log('Failed to open a temp file:', err1 || err2);
                        deferred.reject(err1 || err2);
                        return;
                    }

                    // 3. write the buffer to the temp file
                    fs.writeFile(info.path, buf, function (err) {
                        if (err) {
                            console.log('Failed to write to a temp file:', err);
                            deferred.reject(err);
                            return;
                        }

                        // 4. pass the file to PNG using read stream

                        fs.createReadStream(info.path)
                            .pipe(new PNG({
                                filterType: 4
                            }))
                            .on('parsed', function () {

                                if (region.top >= this.height || region.left >= this.width) {
                                    console.error('region is not contained in screenshot - aborting');
                                    deferred.reject('region is not contained in screenshot');
                                    return;
                                }

                                // 5. process the pixels - crop
                                var croppedArray = [];
                                var yStart = region.top,
                                    yEnd = Math.min(region.top + region.height, this.height),
                                    xStart = region.left,
                                    xEnd = Math.min(region.left + region.width, this.width);

                                for (var y = yStart; y < yEnd; y++) {
                                    for (var x = xStart; x < xEnd; x++) {
                                        var idx = (this.width * y + x) << 2;
                                        for (var i = 0; i < 4; i++) {
                                            croppedArray.push(this.data[idx + i]);
                                        }
                                    }
                                }

                                this.data = new Buffer(croppedArray);
                                this.width = xEnd - xStart;
                                this.height = yEnd - yStart;

                                // 6. Write back to a temp png file

                                this.pack().pipe(fs.createWriteStream(cropInfo.path))
                                    .on('finish', function () {
                                        // 7. Read the file into a buffer
                                        fs.readFile(cropInfo.path, function (err, data) {
                                            if (err) {
                                                console.log('Failed to read a temp file:', err);
                                                deferred.reject(err);
                                                return;
                                            }

                                            deferred.fulfill(data.toString('base64'));
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