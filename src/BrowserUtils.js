/*
 ---

 name: BrowserUtils

 description: Handles browser related functionality.

 ---
 */

(function () {
    "use strict";

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

    //noinspection JSLint
    var BrowserUtils = {};
    BrowserUtils.getDevicePixelRatio = getDevicePixelRatio;
    BrowserUtils.getCurrentScrollPosition = getCurrentScrollPosition;
    BrowserUtils.getEntirePageSize = getEntirePageSize;
    BrowserUtils.setOverflow = setOverflow;
    BrowserUtils.findImageNormalizationFactor = findImageNormalizationFactor;
    //noinspection JSUnresolvedVariable
    module.exports = BrowserUtils;
}());
