/*
 ---

 name: BrowserUtils

 description: Handles browser related functionality.

 ---
 */

(function () {
    "use strict";

    var util = require('util');

    /**
     * Gets the device pixel ratio.
     * @param {WebDriver} in which we'll execute the script to get the ratio
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
     * Get the entire page size.
     * @param {WebDriver} used to query the web page.
     * @return {Promise} A promise which resolves to an object containing the width/height of the page.
     */
    var getEntirePageSize = function (browser) {
        // IMPORTANT: Notice there's a major difference between scrollWidth
        // and scrollHeight. While scrollWidth is the maximum between an
        // element's width and its content width, scrollHeight might be
        // smaller (!) than the clientHeight, which is why we take the
        // maximum between them.
        return browser.executeScript('return [document.documentElement.scrollWidth, document.body.scrollWidth, ' +
        'document.documentElement.clientHeight, document.body.clientHeight, ' +
        'document.documentElement.scrollHeight, document.body.scrollHeight];')
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
     * @param {WebDriver} used to update the web page.
     * @param {string} overflowValue The values of the overflow to set.
     * @return {Promise|*} A promise which resolves to the original overflow of the document.
     */
    var setOverflow = function (browser, overflowValue) {
        return browser.executeScript(
            'var origOF = document.documentElement.style.overflow; document.documentElement.style.overflow = "'
            + overflowValue + '"; origOF');
    };

    /**
     * queries current page size and pixel ratio to figure out what is the normalization factor of the image.
     * Even if there's a pixel ration > 1 it doesn't necessarily means that the image requires rescaling
     * @param {WebDriver} used to update the web page.
     * @param {Object} image size - width and height.
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
    }

    var BrowserUtils = {};
    BrowserUtils.getDevicePixelRatio = getDevicePixelRatio;
    BrowserUtils.getEntirePageSize = getEntirePageSize;
    BrowserUtils.setOverflow = setOverflow;
    BrowserUtils.findImageNormalizationFactor = findImageNormalizationFactor;
    //noinspection JSUnresolvedVariable
    module.exports = BrowserUtils;
}());