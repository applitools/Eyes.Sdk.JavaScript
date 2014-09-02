/*
 ---

 name: Eyes

 description: The main type - to be used by the users of the library to access all functionality.

 provides: [Eyes]
 requires: [eyes.sdk]

 ---
 */

;(function() {
    "use strict";

    //noinspection JSUnresolvedFunction
    var EyesSDK = require('eyes.sdk');
    //noinspection JSUnresolvedFunction
    var RSVP  = require('rsvp');
    var EyesBase = EyesSDK.EyesBase,
        PromiseFactory = EyesSDK.EyesPromiseFactory;

    /**
     * @constructor
     *
     * @param {String} serverUrl
     * @param {Boolean} isDisabled - set to true to disable Applitools Eyes and use the webdriver directly.
     *
     **/
    function Eyes(serverUrl, isDisabled) {
        EyesBase.call(this, serverUrl || EyesBase.DEFAULT_EYES_SERVER, isDisabled);
        this._screenshot = undefined;
        this._title = undefined;
    }

    Eyes.prototype = new EyesBase();
    Eyes.prototype.constructor = Eyes;

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._getBaseAgentId = function () {
        return 'eyes.images/0.0.4';
    };

    /**
     * Starts a test.
     * @param {string} appName      The application being tested.
     * @param {string} testName     The test's name.
     * @param {Object} imageSize    Determines the resolution used for the baseline. {@code null} will automatically grab the
     *                              resolution from the image.
     * @return {Promise}
     */
    Eyes.prototype.open = function (appName, testName, imageSize) {
        PromiseFactory.setFactoryMethods(function (asyncAction) {
            return new RSVP.Promise(asyncAction);
        }, function () {
            return RSVP.defer();
        });
        return EyesBase.prototype.open.call(this, appName, testName, imageSize);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Perform visual validation for the current image.
     *
     * @param {Buffer} image The image png bytes.
     * @param {string} tag An optional tag to be associated with the validation checkpoint.
     * @param {boolean} ignoreMismatch  True if the server should ignore a negative result for the visual validation.
     * @param {number} retryTimeout optional timeout for performing the match (ms).
     *
     * @return {Promise}
     */
    Eyes.prototype.checkImage = function (image, tag, ignoreMismatch, retryTimeout) {
        this._logger.verbose("checkImage(image, '%s', %s, %d)");
        //noinspection JSCheckFunctionSignatures
        return this._checkImage(image, tag, ignoreMismatch, retryTimeout);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Perform visual validation for the current image.
     * @param {Object} region The region of the image which should be verified, or {undefined}/{null} if
     *                          the entire image should be verified.
     * @param {Buffer} image The image png bytes.
     * @param {string} tag An optional tag to be associated with the validation checkpoint.
     * @param {boolean} ignoreMismatch  True if the server should ignore a negative result for the visual validation.
     * @param {number} retryTimeout optional timeout for performing the match (ms).
     *
     * @return {Promise}
     */
    Eyes.prototype.checkRegion = function (region, image, tag, ignoreMismatch, retryTimeout) {
        this._logger.verbose("checkRegion([%o], image, '%s', %s, %d)");
        return this._checkImage(image, tag, ignoreMismatch, retryTimeout, region);
    };

    /**
     * @return {Promise} An updated screenshot.
     */
    Eyes.prototype.getScreenshot = function () {
        return PromiseFactory.makePromise(function (resolve) {
           resolve(this._screenshot);
        }.bind(this));
    };

    /**
     * @return {Promise} The current title of of the AUT.
     */
    Eyes.prototype.getTitle = function () {
        return PromiseFactory.makePromise(function (resolve) {
            resolve(this._title);
        }.bind(this));
    };

    Eyes.prototype.getInferredEnvironment = function () {
        return PromiseFactory.makePromise(function (resolve) {
            resolve('');
        });
    };

    /**
     * Internal function for performing an image verification for an image (or a region of an image).
     *
     * @param {Buffer} image            The image png bytes.
     * @param {string} tag              An optional tag to be associated with the validation checkpoint.
     * @param {boolean} ignoreMismatch  True if the server should ignore a negative result for the visual validation.
     * @param {number} retryTimeout     The amount of time to retry matching in milliseconds or a negative value to
     *                                  use the default retry timeout.
     * @param {Object} region           The region of the image which should be verified, or {undefined}/{null} if
     *                                  the entire image should be verified.
     *
     * @return {Promise}
     * @private
     */
    Eyes.prototype._checkImage = function (image, tag, ignoreMismatch, retryTimeout, region) {
        this._screenshot = image;
        this._title = tag ? tag : '';
        return EyesBase.prototype.checkWindow.call(this, tag, ignoreMismatch, retryTimeout, region);
    };

    Eyes.prototype._waitTimeout = function (ms) {
        // Notice we have to use deferred here, since we want the setTimeout to call resolve..
        var deferred = PromiseFactory.makeDeferred();
        var logger = this._logger;
        logger.log('waiting' + ms + 'ms');
        setTimeout(function () {
            logger.log('Finished waiting...');
            deferred.resolve();
        }, ms);
        return deferred.promise;
    };

    Eyes.prototype.getViewportSize = function () {
        // FIXME Replace this with getting the image size.
        return PromiseFactory.makePromise(function (resolve, reject) {
            reject(Error("Automatic viewport size not implemented yet!"));
        }.bind(this));
    };

    Eyes.prototype.setViewportSize = function (size) {
        return PromiseFactory.makePromise(function (resolve) {
            this._viewportSize = size;
            resolve();
        }.bind(this));
    };

    module.exports = Eyes;
}());
