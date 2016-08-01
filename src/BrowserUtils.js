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

    var BrowserUtils = {};

    /**
     * @private
     * @type {string}
     */
    var JS_GET_VIEWPORT_SIZE =
        "var height = undefined; " +
        "var width = undefined; " +
        "if (window.innerHeight) { height = window.innerHeight; } " +
        "else if (document.documentElement && document.documentElement.clientHeight) { height = document.documentElement.clientHeight; } " +
        "else { var b = document.getElementsByTagName('body')[0]; if (b.clientHeight) {height = b.clientHeight;} }; " +
        "if (window.innerWidth) { width = window.innerWidth; } " +
        "else if (document.documentElement && document.documentElement.clientWidth) { width = document.documentElement.clientWidth; } " +
        "else { var b = document.getElementsByTagName('body')[0]; if (b.clientWidth) { width = b.clientWidth;} }; " +
        "return [width, height];";

    /**
     * @private
     * @type {string}
     */
    var JS_GET_CURRENT_SCROLL_POSITION =
        "var doc = document.documentElement; " +
        "var x = window.scrollX || ((window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0)); " +
        "var y = window.scrollY || ((window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)); " +
        "return [x, y];";

    /**
     * @private
     * @type {string}
     */
    var JS_GET_CONTENT_ENTIRE_SIZE =
        "var scrollWidth = document.documentElement.scrollWidth; " +
        "var bodyScrollWidth = document.body.scrollWidth; " +
        "var totalWidth = Math.max(scrollWidth, bodyScrollWidth); " +
        "var clientHeight = document.documentElement.clientHeight; " +
        "var bodyClientHeight = document.body.clientHeight; " +
        "var scrollHeight = document.documentElement.scrollHeight; " +
        "var bodyScrollHeight = document.body.scrollHeight; " +
        "var maxDocElementHeight = Math.max(clientHeight, scrollHeight); " +
        "var maxBodyHeight = Math.max(bodyClientHeight, bodyScrollHeight); " +
        "var totalHeight = Math.max(maxDocElementHeight, maxBodyHeight); " +
        "return [totalWidth, totalHeight];";

    /**
     * @private
     * @type {string[]}
     */
    var JS_TRANSFORM_KEYS = ["transform", "-webkit-transform"];

    /**
     * Waits a specified amount of time before resolving the returned promise.
     *
     * @param {int} ms The amount of time to sleep in milliseconds.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which is resolved when sleep is done.
     */
    BrowserUtils.sleep = function sleep(ms, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, ms);
        });
    };

    /**
     * Executes a script using the browser's executeScript function - and optionally waits a timeout.
     *
     * @param {WebDriver} browser The driver using which to execute the script.
     * @param {string} script The code to execute on the given driver.
     * @param {PromiseFactory} promiseFactory
     * @param {number|undefined} stabilizationTimeMs (optional) The amount of time to wait after script execution to
     *                           let the browser a chance to stabilize (e.g., finish rendering).
     * @return {Promise<void>} A promise which resolves to the result of the script's execution on the tab.
     */
    BrowserUtils.executeScript = function executeScript(browser, script, promiseFactory, stabilizationTimeMs) {
        return browser.executeScript(script).then(function (result) {
            if (stabilizationTimeMs) {
                return BrowserUtils.sleep(stabilizationTimeMs, promiseFactory)
                    .then(function () {
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
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<number>} A promise which resolves to the device pixel ratio (float type).
     */
    BrowserUtils.getDevicePixelRatio = function getDevicePixelRatio(browser, promiseFactory) {
        return BrowserUtils.executeScript(browser, 'return window.devicePixelRatio', promiseFactory, undefined).then(function (results) {
            return parseFloat(results);
        });
    };

    /**
     * Gets the current scroll position.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the scroll position.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{left: int, top: int}>} A promise which resolves to the current scroll position ({top: *, left: *}).
     */
    BrowserUtils.getCurrentScrollPosition = function getCurrentScrollPosition(browser, promiseFactory) {
        return BrowserUtils.executeScript(browser, JS_GET_CURRENT_SCROLL_POSITION, promiseFactory, undefined).then(function (results) {
            // If we can't find the current scroll position, we use 0 as default.
            var x = parseInt(results[0], 10) || 0;
            var y = parseInt(results[1], 10) || 0;
            return {left: x, top: y};
        });
    };

    /**
     * Sets the scroll position of the current frame.
     *
     * @param {WebDriver} browser The browser to use.
     * @param {{left: int, top: int}} point The position to be set.
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<void>}
     */
    BrowserUtils.setCurrentScrollPosition = function (browser, point, promiseFactory) {
        return BrowserUtils.executeScript(browser, "window.scrollTo(" + point.left + "," + point.top + ")", promiseFactory, 250);
    };

    /**
     * Get the current transform of page.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the scroll position.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<object.<string, string>>} A promise which resolves to the current transform value.
     */
    BrowserUtils.getCurrentTransform = function getCurrentTransform(browser, promiseFactory) {
        var script = "return { ";
        for (var key in JS_TRANSFORM_KEYS) {
            script += "'" + key + "': document.documentElement.style['" + key + "'],";
        }
        script += " }";

        return BrowserUtils.executeScript(browser, script, promiseFactory, undefined);
    };

    /**
     * Sets transforms for document.documentElement according to the given map of style keys and values.
     *
     * @param {WebDriver} browser The browser to use.
     * @param {object.<string, string>} transforms The transforms to set. Keys are used as style keys and values are the values for those styles.
     * @param {PromiseFactory} promiseFactory
     * @returns {Promise<void>}
     */
    BrowserUtils.setTransforms = function (browser, transforms, promiseFactory) {
        var script = "";
        for (var key in transforms) {
            if (transforms.hasOwnProperty(key)) {
                script += "document.documentElement.style['" + key + "'] = '" + transforms[key] + "';";
            }
        }

        return BrowserUtils.executeScript(browser, script, promiseFactory, 250);
    };

    /**
     * Set the given transform to document.documentElement for all style keys defined in {@link JS_TRANSFORM_KEYS}
     *
     * @param {WebDriver} browser The driver which will execute the script to set the transform.
     * @param {string} transformToSet The transform to set.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which resolves to the previous transform once the updated transform is set.
     */
    BrowserUtils.setTransform = function setTransform(browser, transformToSet, promiseFactory) {
        var transforms = {};
        if (!transformToSet) {
            transformToSet = '';
        }

        for (var key in JS_TRANSFORM_KEYS) {
            transforms[key] = transformToSet;
        }

        return BrowserUtils.setTransform(browser, transforms, promiseFactory);
    };

    /**
     * CSS translate the document to a given location.
     *
     * @param {WebDriver} browser The driver which will execute the script to set the transform.
     * @param {{left: int, top: int}} point
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which resolves to the previous transform when the scroll is executed.
     */
    BrowserUtils.translateTo = function translateTo(browser, point, promiseFactory) {
        return BrowserUtils.setTransform(browser, 'translate(-' + point.left + 'px, -' + point.top + 'px)', promiseFactory);
    };

    /**
     * Scroll to the specified position.
     *
     * @param {WebDriver} browser - The driver which will execute the script to set the scroll position.
     * @param {{left: int, top: int}} point Point to scroll to
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which resolves after the action is perfromed and timeout passed.
     */
    BrowserUtils.scrollTo = function scrollTo(browser, point, promiseFactory) {
        return BrowserUtils.executeScript(browser,
            'window.scrollTo(' + parseInt(point.left, 10) + ', ' + parseInt(point.top, 10) + ');',
            promiseFactory, 250);
    };

    /**
     * Get the entire page size.
     *
     * @param {WebDriver} browser The driver used to query the web page.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{width: int, height: int}>} A promise which resolves to an object containing the width/height of the page.
     */
    BrowserUtils.getEntirePageSize = function getEntirePageSize(browser, promiseFactory) {
        // IMPORTANT: Notice there's a major difference between scrollWidth
        // and scrollHeight. While scrollWidth is the maximum between an
        // element's width and its content width, scrollHeight might be
        // smaller (!) than the clientHeight, which is why we take the
        // maximum between them.
        return BrowserUtils.executeScript(browser, JS_GET_CONTENT_ENTIRE_SIZE, promiseFactory).then(function (results) {
            var totalWidth = parseInt(results[0], 10) || 0;
            var totalHeight = parseInt(results[1], 10) || 0;
            return {width: totalWidth, height: totalHeight};
        });
    };

    /**
     * Updates the document's documentElement "overflow" value (mainly used to remove/allow scrollbars).
     *
     * @param {WebDriver} browser The driver used to update the web page.
     * @param {string} overflowValue The values of the overflow to set.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<string>} A promise which resolves to the original overflow of the document.
     */
    BrowserUtils.setOverflow = function setOverflow(browser, overflowValue, promiseFactory) {
        var script;
        if (overflowValue == null) {
            script =
                "var origOverflow = document.documentElement.style.overflow; " +
                "document.documentElement.style.overflow = undefined; " +
                "return origOverflow";
        } else {
            script =
                "var origOverflow = document.documentElement.style.overflow; " +
                "document.documentElement.style.overflow = \"" + overflowValue + "\"; " +
                "return origOverflow";
        }

        return BrowserUtils.executeScript(browser, script, promiseFactory, 100);
    };

    /**
     * Hides the scrollbars of the current context's document element.
     *
     * @param {WebDriver} browser The browser to use for hiding the scrollbars.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<string>} The previous value of the overflow property (could be {@code null}).
     */
    BrowserUtils.hideScrollbars = function (browser, promiseFactory) {
        return BrowserUtils.setOverflow(browser, "hidden", promiseFactory);
    };

    /**
     * @param {WebDriver} browser The browser to use.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{width: int, height: int}>} The viewport size.
     */
    BrowserUtils.executeViewportSizeExtraction = function (browser, promiseFactory) {
        return BrowserUtils.executeScript(browser, JS_GET_VIEWPORT_SIZE, promiseFactory, undefined).then(function (results) {
            var w = parseInt(results[0], 10) || 0;
            var h = parseInt(results[1], 10) || 0;
            return {width: w, height: h};
        });
    };

    /**
     * @param {Logger} logger The logger to use.
     * @param {WebDriver} browser The web driver to use.
     * @param {PromiseFactory} promiseFactory
     * @param {boolean} isLandscape
     * @return {Promise<{width: int, height: int}>} The viewport size of the current context.
     */
    BrowserUtils.extractViewportSize = function (logger, browser, promiseFactory, isLandscape) {
        var that = this;
        return promiseFactory.makePromise(function (resolve) {
            logger.verbose("extractViewportSize()");
            try {
                that.executeViewportSizeExtraction(browser, promiseFactory).then(function (viewportSize) {
                    resolve(viewportSize);
                });
            } catch (err) {
                logger.verbose("Failed to extract viewport size using Javascript: " + err);

                // If we failed to extract the viewport size using JS, will use the window size instead.
                logger.verbose("Using window size as viewport size.");
                return browser.manage().window().getSize().then(function (windowSize) {
                    var width = windowSize.width;
                    var height = windowSize.height;
                    try {
                        //BrowserUtils.isLandscapeOrientation(driver)
                        if (isLandscape && height > width) {
                            var temp = width;
                            width = height;
                            height = temp;
                        }
                    } catch (err) {
                        // Not every WebDriver supports querying for orientation.
                    }

                    logger.verbose("Done! Size " + width + " x %d" + height);
                    resolve({width: width, height: height});
                });
            }
        });
    };

    /**
     * Queries the current page's size and pixel ratio to figure out what is the normalization factor of a screenshot
     * image. Even if there's a pixel ration > 1, it doesn't necessarily mean that the image requires rescaling
     * (e.g., when the screenshot is a full page screenshot).
     *
     * @param {WebDriver} browser The driver used to update the web page.
     * @param {{width: int, height: int}} imageSize
     * @param {{width: int, height: int}} viewportSize
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<number>} A promise which resolves to the normalization factor (float).
     */
    BrowserUtils.findImageNormalizationFactor = function findImageNormalizationFactor(browser, imageSize, viewportSize, promiseFactory) {
        return BrowserUtils.getEntirePageSize(browser, promiseFactory).then(function (entirePageSize) {
            return BrowserUtils.getDevicePixelRatio(browser, promiseFactory).then(function (ratio) {
                return _calcImageNormalizationFactor(imageSize, viewportSize, entirePageSize, ratio);
            });
        });
    };

    var _calcImageNormalizationFactor = function (imageSize, viewportSize, entirePageSize, pixelRatio) {
        if (imageSize.width === viewportSize.width || imageSize.width === entirePageSize.width) {
            return 1;
        }

        return 1 / pixelRatio;
    };

    var _processPart = function (part, parts, imageObj, browser, promise, promiseFactory,
                                 useCssTransition, viewportSize, entirePageSize, pixelRatio, rotationDegrees,
                                 automaticRotation, automaticRotationDegrees, isLandscape, waitBeforeScreenshots, regionToCheck) {
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
                var partCoords = {left: part.left, top: part.top};
                var promise = useCssTransition ?
                    BrowserUtils.translateTo(browser, partCoords, promiseFactory).then(function () {
                        currentPosition = partCoords;
                    }) :
                    BrowserUtils.scrollTo(browser, partCoords, promiseFactory).then(function () {
                        return BrowserUtils.getCurrentScrollPosition(browser, promiseFactory).then(function (position) {
                            currentPosition = {left: position.left, top: position.top};
                        });
                    });

                return promise.then(function () {
                    return _captureViewport(browser, promiseFactory, viewportSize, entirePageSize,
                        pixelRatio, rotationDegrees, automaticRotation, automaticRotationDegrees, isLandscape,
                        waitBeforeScreenshots, regionToCheck);
                })
                    .then(function (partImage) {
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
    };

    var _captureViewport = function _captureViewport(browser,
                                                     promiseFactory,
                                                     viewportSize,
                                                     entirePageSize,
                                                     pixelRatio,
                                                     rotationDegrees,
                                                     automaticRotation,
                                                     automaticRotationDegrees,
                                                     isLandscape,
                                                     waitBeforeScreenshots,
                                                     regionToCheck) {
        var parsedImage;
        return BrowserUtils.sleep(waitBeforeScreenshots, promiseFactory).then(function () {
            return browser.takeScreenshot().then(function (screenshot64) {
                return new MutableImage(new Buffer(screenshot64, 'base64'), promiseFactory);
            })
                .then(function (screenshot) {
                    if (regionToCheck) {
                        return screenshot.cropImage(regionToCheck);
                    }

                    return screenshot;
                })
                .then(function (screenshot) {
                    parsedImage = screenshot;
                    return parsedImage.getSize();
                })
                .then(function (size) {
                    var sizeFactor;
                    if (isLandscape && automaticRotation && size.height > size.width) {
                        rotationDegrees = automaticRotationDegrees;
                    }
                    sizeFactor = _calcImageNormalizationFactor(size, viewportSize, entirePageSize, pixelRatio);
                    if (sizeFactor === 0.5) {
                        return parsedImage.scaleImage(sizeFactor);
                    }
                    return parsedImage;
                })
                .then(function (parsedImage) {
                    if (rotationDegrees !== 0) {
                        return parsedImage.rotateImage(rotationDegrees);
                    }
                })
                .then(function () {
                    return parsedImage.getSize();
                })
                .then(function (imageSize) {
                    // If the image is a viewport screenshot, we want to save the current scroll position (we'll need it
                    // for check region).
                    var isViewportScreenshot = imageSize.width <= viewportSize.width
                        && imageSize.height <= viewportSize.height;
                    if (isViewportScreenshot) {
                        return BrowserUtils.getCurrentScrollPosition(browser).then(function (scrollPosition) {
                            return parsedImage.setCoordinates(scrollPosition);
                        }, function () {
                            // Failed to get Scroll position, setting coordinates to default.
                            return parsedImage.setCoordinates({left: 0, top: 0});
                        });
                    }
                })
                .then(function () {
                    return parsedImage;
                });
        });
    };

    /**
     * Capture screenshot from given driver
     *
     * @param {WebDriver} browser
     * @param {PromiseFactory} promiseFactory
     * @param {{width: int, height: int}} viewportSize
     * @param {boolean} fullPage
     * @param {boolean} hideScrollbars
     * @param {boolean} useCssTransition
     * @param {number} rotationDegrees
     * @param {boolean} automaticRotation
     * @param {number} automaticRotationDegrees
     * @param {boolean} isLandscape
     * @param {int} waitBeforeScreenshots
     * @param {{left: int, top: int, width: int, height: int}} regionToCheck
     * @returns {Promise<MutableImage>}
     */
    BrowserUtils.getScreenshot = function getScreenshot(browser,
                                                        promiseFactory,
                                                        viewportSize,
                                                        fullPage,
                                                        hideScrollbars,
                                                        useCssTransition,
                                                        rotationDegrees,
                                                        automaticRotation,
                                                        automaticRotationDegrees,
                                                        isLandscape,
                                                        waitBeforeScreenshots,
                                                        regionToCheck) {
        var MIN_SCREENSHOT_PART_HEIGHT = 10;
        var maxScrollbarSize = useCssTransition ? 0 : 50; // This should cover all scroll bars (and some fixed position footer elements :).
        var originalScrollPosition,
            originalOverflow,
            originalTransform,
            entirePageSize,
            pixelRatio,
            imageObject,
            screenshot;

        // step #1 - get entire page size for future use (scaling and stitching)
        return BrowserUtils.getEntirePageSize(browser, promiseFactory).then(function (pageSize) {
            entirePageSize = pageSize;
        }, function () {
            // Couldn't get entire page size, using viewport size as default.
            entirePageSize = viewportSize;
        })
            .then(function () {
                // step #2 - get the device pixel ratio (scaling)
                return BrowserUtils.getDevicePixelRatio(browser, promiseFactory)
                    .then(function (ratio) {
                        pixelRatio = ratio;
                    }, function () {
                        // Couldn't get pixel ratio, using 1 as default.
                        pixelRatio = 1;
                    });
            })
            .then(function () {
                // step #3 - hide the scrollbars if instructed
                if (hideScrollbars) {
                    return BrowserUtils.setOverflow(browser, "hidden", promiseFactory).then(function (originalVal) {
                        originalOverflow = originalVal;
                    });
                }
            })
            .then(function () {
                // step #4 - if this is a full page screenshot we need to scroll to position 0,0 before taking the first
                if (fullPage) {
                    return BrowserUtils.getCurrentScrollPosition(browser, promiseFactory).then(function (point) {
                        originalScrollPosition = point;
                        return BrowserUtils.scrollTo(browser, {left: 0, top: 0}, promiseFactory).then(function () {
                            return BrowserUtils.getCurrentScrollPosition(browser, promiseFactory).then(function (point) {
                                if (point.left != 0 || point.top != 0) {
                                    throw new Error("Could not scroll to the top/left corner of the screen");
                                }
                            });
                        });
                    })
                        .then(function () {
                            if (useCssTransition) {
                                return BrowserUtils.getCurrentTransform(browser, promiseFactory).then(function (transform) {
                                    originalTransform = transform;
                                    // Translating to "top/left" of the page (notice this is different from Javascript scrolling).
                                    return BrowserUtils.translateTo(browser, {left: 0, top: 0}, promiseFactory);
                                });
                            }
                        })
                }
            })
            .then(function () {
                // step #5 - Take screenshot of the 0,0 tile / current viewport
                return _captureViewport(browser, promiseFactory, viewportSize, entirePageSize, pixelRatio, rotationDegrees,
                    automaticRotation, automaticRotationDegrees, isLandscape, waitBeforeScreenshots, regionToCheck)
                    .then(function (image) {
                        screenshot = image;
                        return screenshot.asObject().then(function (imageObj) {
                            imageObject = imageObj;
                        });
                    });
            })
            .then(function () {
                return promiseFactory.makePromise(function (resolve) {
                    if (!fullPage) {
                        resolve();
                        return;
                    }
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
                        height: Math.max(imageObject.height - maxScrollbarSize, MIN_SCREENSHOT_PART_HEIGHT)
                    };

                    var screenshotParts = GeometryUtils.getSubRegions({
                        left: 0, top: 0, width: entirePageSize.width,
                        height: entirePageSize.height
                    }, screenshotPartSize);

                    var parts = [];
                    var promise = promiseFactory.makePromise(function (resolve) {
                        resolve();
                    });

                    screenshotParts.forEach(function (part) {
                        promise = _processPart(part, parts, imageObject, browser, promise,
                            promiseFactory, useCssTransition, viewportSize, entirePageSize, pixelRatio, rotationDegrees,
                            automaticRotation, automaticRotationDegrees, isLandscape, waitBeforeScreenshots, regionToCheck);
                    });
                    promise.then(function () {
                        return ImageUtils.stitchImage(entirePageSize, parts, promiseFactory).then(function (stitchedBuffer) {
                            screenshot = new MutableImage(stitchedBuffer, promiseFactory);
                            resolve();
                        });
                    });
                });
            })
            .then(function () {
                if (hideScrollbars) {
                    return BrowserUtils.setOverflow(browser, originalOverflow, promiseFactory);
                }
            })
            .then(function () {
                if (fullPage) {
                    if (useCssTransition) {
                        return BrowserUtils.setTransform(browser, originalTransform, promiseFactory).then(function () {
                            return BrowserUtils.scrollTo(browser, originalScrollPosition, promiseFactory);
                        });
                    } else {
                        return BrowserUtils.scrollTo(browser, originalScrollPosition, promiseFactory);
                    }
                }
            })
            .then(function () {
                return screenshot;
            });
    };

    module.exports = BrowserUtils;
}());
