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
     * Waits a specified amount of time before resolving the returned promise.
     * @param {int} ms The amount of time to sleep in milliseconds.
     * @return {Promise} A promise which is resolved when sleep is done.
     */
    var sleep = function (ms, promiseFactory) {
        return promiseFactory.makePromise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, ms);
        });
    };

    /**
     * Executes a script using the browser's executeScript function - and optionally waits a timeout.
     * @param {Object} browser - The driver using which to execute the script.
     * @param {string} script - The code to execute on the given driver.
     * @param {Object} - promiseFactory
     * @param {number|undefined} stabilizationTimeMs (optional) The amount of time to wait after script execution to
     *                            let the browser a chance to stabilize (e.g., finish rendering).
     *
     * @return {Promise} A promise which resolves to the result of the script's execution on the tab.
     */
    var executeScript = function (browser, script, promiseFactory, stabilizationTimeMs) {
        return browser.executeScript(script)
            .then(function(result) {
                if (stabilizationTimeMs) {
                    return sleep(stabilizationTimeMs, promiseFactory)
                        .then(function() {
                            return result;
                        });
                }

                return result;
            });
    };

    /**
     * Gets the device pixel ratio.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the ratio.
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves to the device pixel ratio (float type).
     */
    var getDevicePixelRatio = function (browser, promiseFactory) {
        //noinspection JSUnresolvedVariable
        return executeScript(browser, 'return window.devicePixelRatio', promiseFactory, undefined)
            .then(function (results) {
                return parseFloat(results);
            });
    };

    /**
     * Gets the current scroll position.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the scroll position.
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves to the current scroll position ({top: *, left: *}).
     */
    var getCurrentScrollPosition = function (browser, promiseFactory) {
        //noinspection JSUnresolvedVariable
        return executeScript(browser,
            'var doc = document.documentElement; ' +
                'var x = (window.scrollX || window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0); ' +
                'var y = (window.scrollY || window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0); ' +
                'return [x,y]', promiseFactory, undefined)
            .then(function (results) {
                // If we can't find the current scroll position, we use 0 as default.
                var x = parseInt(results[0], 10) || 0;
                var y = parseInt(results[1], 10) || 0;
                return {left: x, top: y};
            });
    };

    /**
     * Get the current transform of page.
     * @param {WebDriver} browser The driver which will execute the script to get the scroll position.
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves to the current transform value.
     */
    var getCurrentTransform = function (browser, promiseFactory) {
        return executeScript(browser, "return document.body.style.transform", promiseFactory);
    };

    /**
     * Set the current transform of the current page.
     * @param {WebDriver} browser The driver which will execute the script to set the transform.
     * @param {string} transformToSet The transform to set.
     * @param {Object} - promiseFactory
     *
     * @return {Promise} A promise which resolves to the previous transform once the updated transform is set.
     */
    var setTransform = function (browser, transformToSet, promiseFactory) {
        if (!transformToSet) {
            transformToSet = '';
        }
        return executeScript(browser,
            "var originalTransform = document.body.style.transform; " +
            "document.body.style.transform = '" + transformToSet + "'; " +
            "originalTransform",
            promiseFactory, 250);
    };

    /**
     * CSS translate the document to a given location.
     * @param {WebDriver} browser The driver which will execute the script to set the transform.
     * @param {Object} Point - left; top;.
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves to the previous transfrom when the scroll is executed.
     */
    var translateTo = function (browser, point, promiseFactory) {
        return setTransform(browser, 'translate(-' + point.left + 'px, -' + point.top + 'px)', promiseFactory);
    };

    /**
     * Scroll to the specified position.
     *
     * @param {WebDriver} browser - The driver which will execute the script to set the scroll position.
     * @param {Object} - point to scroll to
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves after the action is perfromed and timeout passed.
     */
    var scrollTo = function (browser, point, promiseFactory) {
        return executeScript(browser,
            'window.scrollTo(' + parseInt(point.left, 10) + ', ' + parseInt(point.top, 10) + ');',
            promiseFactory, 100);
    };

    /**
     * Get the entire page size.
     *
     * @param {WebDriver} browser The driver used to query the web page.
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves to an object containing the width/height of the page.
     */
    var getEntirePageSize = function (browser, promiseFactory) {
        // IMPORTANT: Notice there's a major difference between scrollWidth
        // and scrollHeight. While scrollWidth is the maximum between an
        // element's width and its content width, scrollHeight might be
        // smaller (!) than the clientHeight, which is why we take the
        // maximum between them.
        return executeScript(browser,
            'return [document.documentElement.scrollWidth, document.body.scrollWidth, '
            + 'document.documentElement.clientHeight, document.body.clientHeight, '
            + 'document.documentElement.scrollHeight, document.body.scrollHeight];',
            promiseFactory)
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
    var setOverflow = function (browser, overflowValue, promiseFactory) {
        return executeScript(browser,
            'var origOF = document.documentElement.style.overflow; document.documentElement.style.overflow = "'
                + overflowValue + '"; origOF', promiseFactory, 100);
    };

    /**
     * Queries the current page's size and pixel ratio to figure out what is the normalization factor of a screenshot
     * image. Even if there's a pixel ration > 1, it doesn't necessarily mean that the image requires rescaling
     * (e.g., when the screenshot is a full page screenshot).
     *
     * @param {WebDriver} browser The driver used to update the web page.
     * @param {Object} imageSize The width and height.
     * @param {Object} - promiseFactory
     * @return {Promise} A promise which resolves to the normalization factor (float).
     */
    var findImageNormalizationFactor = function (browser, imageSize, viewportSize, promiseFactory) {
        return getEntirePageSize(browser, promiseFactory)
            .then(function (entirePageSize) {
                if (imageSize.width === viewportSize.width || imageSize.width === entirePageSize.width) {
                    return 1;
                }

                return getDevicePixelRatio(browser, promiseFactory)
                    .then(function (ratio) {
                        return 1 / ratio;
                    });
            });
    };

    var _processPart = function (part, parts, imageObj, browser, promise, promiseFactory, sizeFactor, useCssTransition) {
        return promise.then(function () {
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
                var partCoords = {left: part.left, top: part.top};
                var partCoordsNormalized = {left: part.left / sizeFactor, top: part.top / sizeFactor};
                var promise = useCssTransition ?
                    translateTo(browser, partCoordsNormalized, promiseFactory).then(function () {
                        currentPosition = partCoords;
                    }) :
                    scrollTo(browser, partCoordsNormalized, promiseFactory).then(function () {
                        return getCurrentScrollPosition(browser, promiseFactory).then(function (position) {
                            currentPosition = {left: position.left * sizeFactor, top: position.top * sizeFactor};
                        });
                    });

                return promise.then(function () {
                    return browser.takeScreenshot().then(function (part64) {
                        partImage = new MutableImage(new Buffer(part64, 'base64'), promiseFactory);
                    });
                })
                .then(function () {
                    return partImage.asObject().then(function (partObj) {
                        parts.push({
                            image: partObj.imageBuffer,
                            size: {width: partObj.width, height: partObj.height},
                            position: {left: currentPosition.left, top: currentPosition.top}
                        });

                        resolve();
                    });
                });
            });
        });
    }

    var getFullPageScreenshot = function (browser, promiseFactory, viewportSize, hideScrollbars, useCssTransition) {
        var MIN_SCREENSHOT_PART_HEIGHT = 10;
        var maxScrollbarSize = useCssTransition ? 0 : 50; // This should cover all scroll bars (and some fixed position footer elements :).
        var sizeFactor = 1;
        var originalScrollPosition,
            originalOverflow,
            originalTransform,
            entirePageSize,
            imageObject,
            screenshot;

        return promiseFactory.makePromise(function (resolve) {
            return getCurrentScrollPosition(browser, promiseFactory).then(function(point) {
                    originalScrollPosition = point;
                    return scrollTo(browser, {left: 0, top: 0}, promiseFactory).then(function() {
                        return getCurrentScrollPosition(browser, promiseFactory).then(function(point) {
                            if (point.left != 0 || point.top != 0) {
                                throw new Error("Could not scroll to the top/left corner of the screen");
                            }
                        });
                    });
                })
                .then(function() {
                    if (useCssTransition) {
                        return getCurrentTransform(browser, promiseFactory).then(function(transform) {
                            originalTransform = transform;
                            // Translating to "top/left" of the page (notice this is different from Javascript scrolling).
                            return translateTo(browser, {left: 0, top: 0}, promiseFactory);
                        });
                    }
                })
                .then(function() {
                    if (hideScrollbars) {
                        setOverflow(browser, "hidden", promiseFactory).then(function(originalVal) {
                            originalOverflow = originalVal;
                        });
                    }
                })
                .then(function() {
                    return getEntirePageSize(browser, promiseFactory).then(function(pageSize) {
                        entirePageSize = pageSize;
                    });
                })
                .then(function() {
                    // Take screenshot of the 0,0 tile
                    return browser.takeScreenshot().then(function(screenshot64) {
                        screenshot = new MutableImage(new Buffer(screenshot64, 'base64'), promiseFactory);
                        return screenshot.asObject().then(function(imageObj) {
                            imageObject = imageObj;
                        });
                    });
                })
                .then(function() {
                    return findImageNormalizationFactor(browser, imageObject, viewportSize, promiseFactory)
                        .then(function(factor) {
                            if (factor === 0.5) {
                                sizeFactor = 2;
                                entirePageSize.width *= sizeFactor;
                                entirePageSize.height *= sizeFactor;
                                entirePageSize.width = Math.max(entirePageSize.width, imageObject.width);
                            }
                        });
                }).then(function() {
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
                            height: Math.max(imageObject.height - (maxScrollbarSize * sizeFactor),
                                MIN_SCREENSHOT_PART_HEIGHT * sizeFactor)
                        };

                        var screenshotParts = GeometryUtils.getSubRegions({
                            left: 0, top: 0, width: entirePageSize.width,
                            height: entirePageSize.height
                        }, screenshotPartSize);

                        var parts = [];
                        var promise = promiseFactory.makePromise(function (resolve) { resolve();});

                        screenshotParts.forEach(function (part) {
                            promise = _processPart(part, parts, imageObject, browser, promise,
                                promiseFactory, sizeFactor, useCssTransition);
                        });
                        promise.then(function () {
                            return ImageUtils.stitchImage(entirePageSize, parts, promiseFactory).then(function (stitchedBuffer) {
                                screenshot = new MutableImage(stitchedBuffer, promiseFactory);
                                resolve();
                            });
                        });
                    });
                })
                .then(function() {
                    if (hideScrollbars) {
                        return setOverflow(browser, originalOverflow, promiseFactory);
                    }
                })
                .then(function () {
                    if (useCssTransition) {
                        return setTransform(browser, originalTransform, promiseFactory).then(function() {
                            return scrollTo(browser, originalScrollPosition, promiseFactory);
                        });
                    } else {
                        return scrollTo(browser, originalScrollPosition, promiseFactory);
                    }

                })
                .then(function() {
                    return resolve(screenshot);
                });
        });
    };

    //noinspection JSLint
    var BrowserUtils = {};
    BrowserUtils.getDevicePixelRatio = getDevicePixelRatio;
    BrowserUtils.getCurrentScrollPosition = getCurrentScrollPosition;
    BrowserUtils.getCurrentTransform = getCurrentTransform;
    BrowserUtils.sleep = sleep;
    BrowserUtils.executeScript = executeScript;
    BrowserUtils.setTransform = setTransform;
    BrowserUtils.translateTo = translateTo;
    BrowserUtils.scrollTo = scrollTo;
    BrowserUtils.getEntirePageSize = getEntirePageSize;
    BrowserUtils.setOverflow = setOverflow;
    BrowserUtils.findImageNormalizationFactor = findImageNormalizationFactor;
    BrowserUtils.getFullPageScreenshot = getFullPageScreenshot;
    //noinspection JSUnresolvedVariable
    module.exports = BrowserUtils;
}());
