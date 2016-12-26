/*
 ---

 name: Eyes

 description: The main type - to be used by the users of the library to access all functionality.

 ---
 */

(function () {
    "use strict";

    //noinspection JSUnresolvedFunction
    var EyesSDK = require('eyes.sdk'),
        RSVP = require('rsvp'),
        EyesBase = EyesSDK.EyesBase,
        EyesUtils = require('eyes.utils'),
        MutableImage = EyesUtils.MutableImage,
        RegionProvider = EyesUtils.RegionProvider,
        CoordinatesType = EyesUtils.CoordinatesType,
        PromiseFactory = EyesUtils.PromiseFactory;

    /**
     * @constructor
     *
     * @param {String} serverUrl
     * @param {Boolean} isDisabled - set to true to disable Applitools Eyes and use the web driver directly.
     * @augments EyesBase
     **/
    function Eyes(serverUrl, isDisabled) {
        this._promiseFactory = new PromiseFactory(function (asyncAction) {
            return new RSVP.Promise(asyncAction);
        }, function () {
            return RSVP.defer();
        });
        EyesBase.call(this, this._promiseFactory, serverUrl || EyesBase.DEFAULT_EYES_SERVER, isDisabled);
        this._screenshot = undefined;
        this._title = undefined;
        this._inferredEnvironment = undefined;
    }

    Eyes.prototype = new EyesBase();
    Eyes.prototype.constructor = Eyes;

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._getBaseAgentId = function () {
        return 'eyes.images/0.0.39';
    };

    /**
     * Starts a test.
     * @param {string} appName      The application being tested.
     * @param {string} testName     The test's name.
     * @param {Object} imageSize    Determines the resolution used for the baseline. {@code null} will automatically
     *                              grab the resolution from the image.
     * @return {Promise}
     */
    Eyes.prototype.open = function (appName, testName, imageSize) {
        return EyesBase.prototype.open.call(this, appName, testName, imageSize);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {boolean} Whether or not session is opened
     */
    Eyes.prototype.isOpen = function () {
        return this._isOpen;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Perform visual validation for the current image.
     *
     * @param {Buffer} image The image png bytes.
     * @param {string} [tag] An optional tag to be associated with the validation checkpoint.
     * @param {boolean} [ignoreMismatch]  True if the server should ignore a negative result for the visual validation.
     * @param {number} [retryTimeout] optional timeout for performing the match (ms).
     *
     * @return {Promise}
     */
    Eyes.prototype.checkImage = function (image, tag, ignoreMismatch, retryTimeout) {
        this._logger.verbose('checkRegion(image, "', tag, '", ', ignoreMismatch, ',', retryTimeout, ')');
        //noinspection JSCheckFunctionSignatures
        return this._checkImage(image, tag, ignoreMismatch, retryTimeout);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Perform visual validation for the current image.
     * @param {Object} region The region of the image which should be verified, or {undefined}/{null} if
     *                          the entire image should be verified.
     * @param {Buffer} image The image png bytes.
     * @param {string} [tag] An optional tag to be associated with the validation checkpoint.
     * @param {boolean} [ignoreMismatch]  True if the server should ignore a negative result for the visual validation.
     * @param {number} [retryTimeout] optional timeout for performing the match (ms).
     *
     * @return {Promise}
     */
    Eyes.prototype.checkRegion = function (region, image, tag, ignoreMismatch, retryTimeout) {
        this._logger.verbose('checkRegion([', region, '], image, "', tag, '", ', ignoreMismatch, ',', retryTimeout, ')');
        var regionProvider = new RegionProvider(region, CoordinatesType.CONTEXT_AS_IS);
        return this._checkImage(image, tag, ignoreMismatch, retryTimeout, regionProvider);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Replaces the actual image in a running session.
     *
     * @param {number} stepIndex The zero based index of the step in which to replace the image.
     * @param {Buffer} image The updated image png bytes.
     * @param {string|undefined} tag A tag to be associated with the validation checkpoint.
     * @param {string|undefined} title A title to be associated with the validation checkpoint.
     * @param {Array|undefined} userInputs An array of user inputs to which lead to the validation checkpoint.
     *
     * @return {Promise}
     */
    Eyes.prototype.replaceImage = function (stepIndex, image, tag, title, userInputs) {
        this._logger.verbose('replaceImage(', stepIndex, 'image, "', tag, '", "', title, '", userInputs)');
        //noinspection JSCheckFunctionSignatures
        return EyesBase.prototype.replaceWindow.call(this, stepIndex, image, tag, title, userInputs);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {Promise} An updated screenshot.
     */
    Eyes.prototype.getScreenShot = function () {
        var parsedImage = new MutableImage(this._screenshot, this._promiseFactory);
        return this._promiseFactory.makePromise(function (resolve) {
            resolve(parsedImage);
        }.bind(this));
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {Promise} The current title of of the AUT.
     */
    Eyes.prototype.getTitle = function () {
        return this._promiseFactory.makePromise(function (resolve) {
            resolve(this._title);
        }.bind(this));
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Set the inferred environment string.
     * @param {string} inferredEnvironment The inferred environment string.
     */
    Eyes.prototype.setInferredEnvironment = function (inferredEnvironment) {
        this._inferredEnvironment = inferredEnvironment;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {Promise} A promise which resolves to the inferred environment string.
     */
    Eyes.prototype.getInferredEnvironment = function () {
        return this._promiseFactory.makePromise(function (resolve) {
            resolve(this._inferredEnvironment);
        }.bind(this));
    };

    /**
     * Internal function for performing an image verification for an image (or a region of an image).
     *
     * @param {Buffer} image The image png bytes.
     * @param {string} tag An optional tag to be associated with the validation checkpoint.
     * @param {boolean} ignoreMismatch True if the server should ignore a negative result for the visual validation.
     * @param {number} retryTimeout The amount of time to retry matching in milliseconds or a negative value to use the default retry timeout.
     * @param {RegionProvider} regionProvider The region of the image which should be verified, or {undefined}/{null} if the entire image should be verified.
     *
     * @return {Promise}
     * @private
     */
    Eyes.prototype._checkImage = function (image, tag, ignoreMismatch, retryTimeout, regionProvider) {
        this._screenshot = image;
        this._title = tag || '';
        return EyesBase.prototype.checkWindow.call(this, tag, ignoreMismatch, retryTimeout, regionProvider);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._waitTimeout = function (ms) {
        // Notice we have to use deferred here, since we want the setTimeout to call resolve..
        var deferred = this._promiseFactory.makeDeferred();
        var logger = this._logger;
        logger.log('waiting' + ms + 'ms');
        setTimeout(function () {
            logger.log('Finished waiting...');
            deferred.resolve();
        }, ms);
        return deferred.promise;
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getViewportSize = function () {
        // FIXME Replace this with getting the image size.
        //noinspection JSLint
        return this._promiseFactory.makePromise(function (resolve, reject) {
            reject(new Error("Automatic viewport size not implemented yet!"));
        }.bind(this));
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.setViewportSize = function (size) {
        return this._promiseFactory.makePromise(function (resolve) {
            //noinspection JSUnusedGlobalSymbols
            this._viewportSize = size;
            resolve();
        }.bind(this));
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getAUTSessionId = function () {
        return this._promiseFactory.makePromise(function (resolve) {
            resolve(undefined);
        });
    };

    //noinspection JSUnresolvedVariable
    module.exports = Eyes;
}());
