/*
 ---

 name: BrowserUtils

 description: Handles browser related functionality.

 ---
 */

(function () {
    "use strict";

    var MutableImage = require('./MutableImage'),
        GeometryUtils = require('./GeometryUtils'),
        ImageUtils = require('./ImageUtils');

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
        "return {width: width, height: height};";

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
     * @return {string}
     */
    var JS_GET_COMPUTED_STYLE_FORMATTED_STR = function (propStyle) {
        return "var elem = arguments[0]; var styleProp = '" + propStyle + "'; " +
            "if (window.getComputedStyle) { " +
            "return window.getComputedStyle(elem, null).getPropertyValue(styleProp);" +
            "} else if (elem.currentStyle) { " +
            "return elem.currentStyle[styleProp];" +
            "} else { " +
            "return null;" +
            "}";
    };

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
     * Returns the computed value of the style property for the current element.
     *
     * @param {WebDriver} browser The driver which will execute the script to get computed style.
     * @param {WebElement|EyesRemoteWebElement} element
     * @param {string} propStyle The style property which value we would like to extract.
     * @return {Promise<string>} The value of the style property of the element, or {@code null}.
     */
    BrowserUtils.getComputedStyle = function (browser, element, propStyle) {
        var scriptToExec = JS_GET_COMPUTED_STYLE_FORMATTED_STR(propStyle);
        return browser.executeScript(scriptToExec, element).then(function(computedStyle) {
            return computedStyle;
        });
    };

    /**
     * Returns a location based on the given location.
     *
     * @param {Object} logger The logger to use.
     * @param {WebElement|EyesRemoteWebElement} element The element for which we want to find the content's location.
     * @param {{x: number, y: number}} location The location of the element.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{x: number, y: number}>} The location of the content of the element.
     */
    BrowserUtils.getLocationWithBordersAddition = function (logger, element, location, promiseFactory) {
        logger.verbose("BordersAdditionFrameLocationProvider(logger, element, [" + location.x + "," + location.y + "])");
        var leftBorderWidth, topBorderWidth;
        return _getLeftBorderWidth(logger, promiseFactory, element).then(function (val) {
            leftBorderWidth = val;
            return _getTopBorderWidth(logger, promiseFactory, element);
        }).then(function (val) {
            topBorderWidth = val;
            logger.verbose("Done!");
            // Frame borders also have effect on the frame's location.
            return GeometryUtils.locationOffset(location, {x: leftBorderWidth, y: topBorderWidth});
        });
    };

    function _getLeftBorderWidth(logger, promiseFactory, element) {
        return promiseFactory.makePromise(function (resolve) {
            logger.verbose("Get element border left width...");

            try {
                return BrowserUtils.getComputedStyle(element.getDriver(), element, "border-left-width").then(function (styleValue) {
                    return styleValue;
                }, function (error) {
                    logger.verbose("Using getComputedStyle failed: " + error + ".");
                    logger.verbose("Using getCssValue...");
                    return element.getCssValue("border-left-width");
                }).then(function (propValue) {
                    logger.verbose("Done!");
                    var leftBorderWidth = Math.round(parseFloat(propValue.trim().replace("px", "")));
                    logger.verbose("border-left-width: " + leftBorderWidth);
                    resolve(leftBorderWidth);
                });
            } catch (err) {
                logger.verbose("Couldn't get the element's border-left-width: " + err + ". Falling back to default");
                resolve(0);
            }
        });
    }

    function _getTopBorderWidth(logger, promiseFactory, element) {
        return promiseFactory.makePromise(function (resolve) {
            logger.verbose("Get element's border top width...");

            try {
                return BrowserUtils.getComputedStyle(element.getDriver(), element, "border-top-width").then(function (styleValue) {
                    return styleValue;
                }, function (err) {
                    logger.verbose("Using getComputedStyle failed: " + err + ".");
                    logger.verbose("Using getCssValue...");
                    return element.getCssValue("border-top-width");
                }).then(function (propValue) {
                    logger.verbose("Done!");
                    var topBorderWidth = Math.round(parseFloat(propValue.trim().replace("px", "")));
                    logger.verbose("border-top-width: " + topBorderWidth);
                    resolve(topBorderWidth);
                });
            } catch (err) {
                logger.verbose("Couldn't get the element's border-top-width: " + err + ". Falling back to default");
                resolve(0);
            }
        });
    }

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
     * @param {{x: number, y: number}} point
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which resolves to the previous transform when the scroll is executed.
     */
    BrowserUtils.translateTo = function translateTo(browser, point, promiseFactory) {
        return BrowserUtils.setTransform(browser, 'translate(-' + point.x + 'px, -' + point.y + 'px)', promiseFactory);
    };

    /**
     * Scroll to the specified position.
     *
     * @param {WebDriver} browser - The driver which will execute the script to set the scroll position.
     * @param {{x: number, y: number}} point Point to scroll to
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<void>} A promise which resolves after the action is performed and timeout passed.
     */
    BrowserUtils.scrollTo = function scrollTo(browser, point, promiseFactory) {
        return BrowserUtils.executeScript(browser,
            'window.scrollTo(' + parseInt(point.x, 10) + ', ' + parseInt(point.y, 10) + ');',
            promiseFactory, 250);
    };

    /**
     * Gets the current scroll position.
     *
     * @param {WebDriver} browser The driver which will execute the script to get the scroll position.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{x: number, y: number}>} A promise which resolves to the current scroll position.
     */
    BrowserUtils.getCurrentScrollPosition = function getCurrentScrollPosition(browser, promiseFactory) {
        return BrowserUtils.executeScript(browser, JS_GET_CURRENT_SCROLL_POSITION, promiseFactory, undefined).then(function (results) {
            // If we can't find the current scroll position, we use 0 as default.
            var x = parseInt(results[0], 10) || 0;
            var y = parseInt(results[1], 10) || 0;
            return {x: x, y: y};
        });
    };

    /**
     * Get the entire page size.
     *
     * @param {WebDriver} browser The driver used to query the web page.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{width: number, height: number}>} A promise which resolves to an object containing the width/height of the page.
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
     * Tries to get the viewport size using Javascript. If fails, gets the entire browser window size!
     *
     * @param {WebDriver} browser The browser to use.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise<{width: number, height: number}>} The viewport size.
     */
    BrowserUtils.getViewportSize = function (browser, promiseFactory) {
        return promiseFactory.makePromise(function (resolve) {
            try {
                return BrowserUtils.executeScript(browser, JS_GET_VIEWPORT_SIZE, promiseFactory, undefined).then(function (size) {
                    resolve(size);
                }, function () {
                    browser.manage().window().getSize().then(function (size) {
                        resolve(size);
                    });
                });
            } catch (err) {
                browser.manage().window().getSize().then(function (size) {
                    resolve(size);
                });
            }
        }.bind(this));
    };

    /**
     * Tries to set the viewport
     *
     * @param {WebDriver} browser The browser to use.
     * @param {{width: number, height: number}} size The viewport size.
     * @param {PromiseFactory} promiseFactory
     * @param {Logger} logger
     * @param {boolean|undefined} lastRetry
     * @returns {Promise<void>}
     */
    BrowserUtils.setViewportSize = function (browser, size, promiseFactory, logger, lastRetry) {
        // First we will set the window size to the required size.
        // Then we'll check the viewport size and increase the window size accordingly.
        return promiseFactory.makePromise(function (resolve, reject) {
            try {
                BrowserUtils.getViewportSize(browser, promiseFactory).then(function (actualViewportSize) {
                    if (actualViewportSize.width === size.width && actualViewportSize.height === size.height) {
                        resolve();
                        return;
                    }

                    browser.manage().window().getSize().then(function (browserSize) {
                        // Edge case.
                        if (browserSize.height < actualViewportSize.height || browserSize.width < actualViewportSize.width) {
                            logger.log("Browser window size is smaller than the viewport! Using current viewport size as is.");
                            resolve();
                            return;
                        }

                        var requiredBrowserSize = {
                            height: browserSize.height + (size.height - actualViewportSize.height),
                            width: browserSize.width + (size.width - actualViewportSize.width)
                        };

                        logger.log("Trying to set browser size to: " + requiredBrowserSize.width + "x" + requiredBrowserSize.height);
                        _setWindowSize(browser, requiredBrowserSize, 3, promiseFactory, logger).then(function () {
                            BrowserUtils.getViewportSize(browser, promiseFactory).then(function (updatedViewportSize) {
                                if (updatedViewportSize.width === size.width &&
                                    updatedViewportSize.height === size.height) {
                                    resolve();
                                    return;
                                }

                                if (lastRetry) {
                                    reject(new Error("Failed to set viewport size! " +
                                        "(Got " + updatedViewportSize.width + "x" + updatedViewportSize.height + ") " +
                                        "Please try using a smaller viewport size."));
                                } else {
                                    BrowserUtils.setViewportSize(browser, size, promiseFactory, logger, true).then(function () {
                                        resolve();
                                    }, function (err) {
                                        reject(err);
                                    });
                                }
                            });
                        }, function () {
                            reject(new Error("Failed to set browser size! Please try using a smaller viewport size."));
                        });
                    });
                });
            } catch (err) {
                reject(new Error(err));
            }
        }.bind(this));
    };

    function _setWindowSize(driver, size, retries, promiseFactory, logger) {
        return promiseFactory.makePromise(function (resolve, reject) {
            return driver.manage().window().setSize(size.width, size.height).then(function () {
                return BrowserUtils.sleep(1000, promiseFactory);
            }).then(function () {
                return driver.manage().window().getSize();
            }).then(function (browserSize) {
                logger.log("Current browser size: " + browserSize.width + "x" + browserSize.height);
                if (browserSize.width === size.width && browserSize.height === size.height) {
                    resolve();
                    return;
                }

                if (retries === 0) {
                    reject();
                    return;
                }

                _setWindowSize(driver, size, retries - 1, promiseFactory, logger).then(function () {
                    resolve();
                }, function () {
                    reject();
                });
            });
        });
    }

    /**
     * Queries the current page's size and pixel ratio to figure out what is the normalization factor of a screenshot
     * image. Even if there's a pixel ration > 1, it doesn't necessarily mean that the image requires rescaling
     * (e.g., when the screenshot is a full page screenshot).
     *
     * @param {WebDriver} browser The driver used to update the web page.
     * @param {{width: number, height: number}} imageSize
     * @param {{width: number, height: number}} viewportSize
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
                        position: {x: 0, y: 0}
                    });

                    resolve();
                    return;
                }

                var currentPosition;
                var partCoords = {x: part.left, y: part.top};
                var promise = useCssTransition ?
                    BrowserUtils.translateTo(browser, partCoords, promiseFactory).then(function () {
                        currentPosition = partCoords;
                    }) :
                    BrowserUtils.scrollTo(browser, partCoords, promiseFactory).then(function () {
                        return BrowserUtils.getCurrentScrollPosition(browser, promiseFactory).then(function (position) {
                            currentPosition = {x: position.x, y: position.y};
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
                                position: {x: currentPosition.x, y: currentPosition.y}
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
                            return parsedImage.setCoordinates({x: 0, y: 0});
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
     * @param {{width: number, height: number}} viewportSize
     * @param {boolean} fullPage
     * @param {boolean} hideScrollbars
     * @param {boolean} useCssTransition
     * @param {number} rotationDegrees
     * @param {boolean} automaticRotation
     * @param {number} automaticRotationDegrees
     * @param {boolean} isLandscape
     * @param {int} waitBeforeScreenshots
     * @param {{left: number, top: number, width: number, height: number}} regionToCheck
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
                        return BrowserUtils.scrollTo(browser, {x: 0, y: 0}, promiseFactory).then(function () {
                            return BrowserUtils.getCurrentScrollPosition(browser, promiseFactory).then(function (point) {
                                if (point.x != 0 || point.y != 0) {
                                    throw new Error("Could not scroll to the x/y corner of the screen");
                                }
                            });
                        });
                    })
                        .then(function () {
                            if (useCssTransition) {
                                return BrowserUtils.getCurrentTransform(browser, promiseFactory).then(function (transform) {
                                    originalTransform = transform;
                                    // Translating to "x/y" of the page (notice this is different from Javascript scrolling).
                                    return BrowserUtils.translateTo(browser, {x: 0, y: 0}, promiseFactory);
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
                    }, screenshotPartSize, true);

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
