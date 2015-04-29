/*
 ---

 name: BrowserUtils

 description: Handles browser related functionality.

 ---
 */

(function () {
    "use strict";

    var MutableImage = require('./MutableImage');
    var GeometryUtils = require('./GeometryUtils');
    var ImageUtils = require('./ImageUtils');

    /**
     * Gets the device pixel ratio.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the ratio.
     * @return {Promise} A promise which resolves to the device pixel ratio (float type).
     */
    var getDevicePixelRatio = function (browser) {
        //noinspection JSUnresolvedVariable
        return browser.executeScript('return window.devicePixelRatio')
            .then(function (results) {
                return parseFloat(results);
            });
    };

    /**
     * Gets the current scroll position.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the scroll position.
     * @return {Promise} A promise which resolves to the current scroll position ({top: *, left: *}).
     */
    var getCurrentScrollPosition = function (browser) {
        //noinspection JSUnresolvedVariable
        return browser.executeScript(
            'var doc = document.documentElement; ' +
                'var x = (window.scrollX || window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0); ' +
                'var y = (window.scrollY || window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0); ' +
                'return [x,y]'
        ).then(function (results) {
            // If we can't find the current scroll position, we use 0 as default.
            var x = parseInt(results[0], 10) || 0;
            var y = parseInt(results[1], 10) || 0;
            return {left: x, top: y};
        });
    };

    var scrollTo = function (browser, point) {
        return browser.executeScript(
            'window.scrollTo(' + parseInt(point.left, 10) + ', ' + parseInt(point.top, 10) + ');'
        );
    };

    /**
     * Get the entire page size.
     *
     * @param {WebDriver} browser The driver used to query the web page.
     * @return {Promise} A promise which resolves to an object containing the width/height of the page.
     */
    var getEntirePageSize = function (browser) {
        // IMPORTANT: Notice there's a major difference between scrollWidth
        // and scrollHeight. While scrollWidth is the maximum between an
        // element's width and its content width, scrollHeight might be
        // smaller (!) than the clientHeight, which is why we take the
        // maximum between them.
        return browser.executeScript('return [document.documentElement.scrollWidth, document.body.scrollWidth, '
            + 'document.documentElement.clientHeight, document.body.clientHeight, '
            + 'document.documentElement.scrollHeight, document.body.scrollHeight];')
            .then(function (results) {
                // Notice that each result is itself actually an array (since executeScript returns an Array).
                var scrollWidth = parseInt(results[0], 10);
                var bodyScrollWidth = parseInt(results[1], 10);
                var totalWidth = Math.max(scrollWidth, bodyScrollWidth);

                var clientHeight = parseInt(results[2], 10);
                var bodyClientHeight = parseInt(results[3], 10);
                var scrollHeight = parseInt(results[4], 10);
                var bodyScrollHeight = parseInt(results[5], 10);

                var maxDocumentElementHeight = Math.max(clientHeight, scrollHeight);
                var maxBodyHeight = Math.max(bodyClientHeight, bodyScrollHeight);
                var totalHeight = Math.max(maxDocumentElementHeight, maxBodyHeight);

                return {width: totalWidth, height: totalHeight};
            });
    };

    /**
     * Updates the document's documentElement "overflow" value (mainly used to remove/allow scrollbars).
     *
     * @param {WebDriver} browser The driver used to update the web page.
     * @param {string} overflowValue The values of the overflow to set.
     * @return {Promise|*} A promise which resolves to the original overflow of the document.
     */
    var setOverflow = function (browser, overflowValue) {
        return browser.executeScript(
            'var origOF = document.documentElement.style.overflow; document.documentElement.style.overflow = "'
                + overflowValue + '"; origOF');
    };

    /**
     * Queries the current page's size and pixel ratio to figure out what is the normalization factor of a screenshot
     * image. Even if there's a pixel ration > 1, it doesn't necessarily mean that the image requires rescaling
     * (e.g., when the screenshot is a full page screenshot).
     *
     * @param {WebDriver} browser The driver used to update the web page.
     * @param {Object} imageSize The width and height.
     * @return {Promise} A promise which resolves to the normalization factor (float).
     */
    var findImageNormalizationFactor = function (browser, imageSize, viewportSize) {
        return getEntirePageSize(browser)
            .then(function (entirePageSize) {
                if (imageSize.width === viewportSize.width || imageSize.width === entirePageSize.width) {
                    return 1;
                }

                return getDevicePixelRatio(browser)
                    .then(function (ratio) {
                        return 1 / ratio;
                    });
            });
    };

    var _processPart = function (part, parts, imageObj, browser, promise, promiseFactory, sizeFactor) {
        return promise.then(function() {
            return promiseFactory.makePromise(function (resolve) {
                // Skip 0,0 as we already got the screenshot
                if (part.left == 0 && part.top == 0) {
                    parts.push({
                        image: imageObj.imageBuffer,
                        size: {width: imageObj.width, height: imageObj.height},
                        position: {left: 0, top: 0}
                    });

                    resolve();
                    return;
                }

                var currentPosition;
                var partImage;

                scrollTo(browser, {left: part.left / sizeFactor, top: part.top / sizeFactor})
                    .then(function () {
                        return browser.controlFlow().timeout(100);
                    })
                    .then(function () {
                        return getCurrentScrollPosition(browser);
                    })
                    .then(function (position) {
                        currentPosition = {left: position.left * sizeFactor, top: position.top * sizeFactor};
                        return browser.takeScreenshot();
                    })
                    .then(function (part64) {
                        var partImage = new MutableImage(new Buffer(part64, 'base64'), promiseFactory);
                        return partImage.asObject();
                    })
                    .then(function (partObj) {
                        parts.push({
                            image: partObj.imageBuffer,
                            size: {width: partObj.width, height: partObj.height},
                            position: {left: currentPosition.left, top: currentPosition.top}
                        });

                        resolve();
                    });
            });
        });
    };

    var getFullPageScreenshot = function (browser, promiseFactory, viewportSize) {
        var MAX_SCROLL_BAR_SIZE = 50; // This should cover all scroll bars (and some fixed position footer elements :).
        var MIN_SCREENSHOT_PART_HEIGHT = 10;
        var sizeFactor = 1;
        var originalScrollPosition,
            entirePageSize,
            imageObject,
            screenshot;

        return promiseFactory.makePromise(function (resolve) {
            return getCurrentScrollPosition(browser)
                .then(function(point) {
                    originalScrollPosition = point;
                    return scrollTo(browser, {left: 0, top: 0});
                })
                .then(function () {
                    return getCurrentScrollPosition(browser);
                })
                .then(function(point) {
                    if (point.left != 0 || point.top != 0) {
                        throw new Error("Could not scroll to the top/left corner of the screen");
                    }
                    return getEntirePageSize(browser);
                })
                .then(function(pageSize) {
                    entirePageSize = pageSize;
                    // Take screenshot of the 0,0 tile
                    return browser.takeScreenshot();
                })
                .then(function(screenshot64) {
                    screenshot = new MutableImage(new Buffer(screenshot64, 'base64'), promiseFactory);
                    return screenshot.asObject();
                })
                .then(function(imageObj) {
                    imageObject = imageObj;
                    return findImageNormalizationFactor(browser, imageObj, viewportSize);
                }).then(function(factor) {
                    if (factor === 0.5) {
                        sizeFactor = 2;
                        entirePageSize.width *= sizeFactor;
                        entirePageSize.height *= sizeFactor;
                        entirePageSize.width = Math.max(entirePageSize.width, imageObject.width);
                    }

                    return promiseFactory.makePromise(function (resolve) {
                        // IMPORTANT This is required! Since when calculating the screenshot parts for full size,
                        // we use a screenshot size which is a bit smaller (see comment below).
                        if (imageObject.width >= entirePageSize.width && imageObject.height >= entirePageSize.height) {
                            resolve();
                            return;
                        }

                        // We use a smaller size than the actual screenshot size in order to eliminate duplication
                        // of bottom scroll bars, as well as footer-like elements with fixed position.
                        var screenshotPartSize = {
                            width: imageObject.width,
                            height: Math.max(imageObject.height - (MAX_SCROLL_BAR_SIZE * sizeFactor),
                                MIN_SCREENSHOT_PART_HEIGHT * sizeFactor)
                        };

                        var screenshotParts = GeometryUtils.getSubRegions({
                            left: 0, top: 0, width: entirePageSize.width,
                            height: entirePageSize.height
                        }, screenshotPartSize);

                        var parts = [];
                        var promise = promiseFactory.makePromise(function (resolve) { resolve();});

                        screenshotParts.forEach(function (part) {
                            promise = _processPart(part, parts, imageObject, browser, promise, promiseFactory, sizeFactor);
                        });
                        promise.then(function () {
                            return ImageUtils.stitchImage(entirePageSize, parts, promiseFactory);
                        }).then(function (stitchedBuffer) {
                            screenshot = new MutableImage(stitchedBuffer, promiseFactory);
                            resolve();
                        });
                    });
                })
                .then(function () {
                    return scrollTo(browser, originalScrollPosition);
                })
                .then(function() {
                    return screenshot.asObject();
                })
                .then(function (screenshotObj) {
                    return resolve(screenshotObj.imageBuffer.toString('base64'));
                });
        });
    };

    //noinspection JSLint
    var BrowserUtils = {};
    BrowserUtils.getDevicePixelRatio = getDevicePixelRatio;
    BrowserUtils.getCurrentScrollPosition = getCurrentScrollPosition;
    BrowserUtils.scrollTo = scrollTo;
    BrowserUtils.getEntirePageSize = getEntirePageSize;
    BrowserUtils.setOverflow = setOverflow;
    BrowserUtils.findImageNormalizationFactor = findImageNormalizationFactor;
    BrowserUtils.getFullPageScreenshot = getFullPageScreenshot;
    //noinspection JSUnresolvedVariable
    module.exports = BrowserUtils;
}());
