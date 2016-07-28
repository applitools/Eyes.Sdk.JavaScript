(function () {
    'use strict';

    /**
     * Encapsulates the information for the validation about to execute.
     *
     * @constructor
     */
    function ValidationInfo() {
        this._validationId = null;
        this._tag = null;
    }

    ValidationInfo.prototype.getValidationId = function () {
        return this._validationId;
    };

    //noinspection JSUnusedGlobalSymbols
    ValidationInfo.prototype.setValidationId  = function (validationId){
        this._validationId = validationId;
    };

    ValidationInfo.prototype.getTag = function () {
        return this._tag;
    };

    //noinspection JSUnusedGlobalSymbols
    ValidationInfo.prototype.setTag = function (tag) {
        this._tag = tag;
    };

    //noinspection JSUnusedGlobalSymbols
    ValidationInfo.prototype.toObject  = function (){
        return {
            validationId: this.getValidationId(),
            tag: this.getTag()
        };
    };

    /**
     * Encapsulates the information for the validation about to execute.
     *
     * @constructor
     */
    function ValidationResult() {
        this._asExpected = null;
    }

    ValidationResult.prototype.isAsExpected = function () {
        return this._asExpected;
    };

    //noinspection JSUnusedGlobalSymbols
    ValidationResult.prototype.setAsExpected = function (asExpected) {
        this._asExpected = asExpected;
    };

    //noinspection JSUnusedGlobalSymbols
    ValidationResult.prototype.toObject  = function (){
        return {
            asExpected: this.isAsExpected()
        };
    };


    //noinspection JSLint
    /**
     * The base object for session event handler. Specific implementations should use this object as prototype (via
     * the factory method).
     *
     * @type {{testStarted: _baseSessionEventHandler.testStarted, testEnded: _baseSessionEventHandler.testEnded, validationWillStart: _baseSessionEventHandler.validationWillStart, validationEnded: _baseSessionEventHandler.validationEnded}}
     * @private
     */
    var _baseSessionEventHandler = {
        /**
         * Called after a session had started.
         *
         * @param sessionStartInfo {Object} The session parameters.
         */
        testStarted: function (sessionStartInfo) { },

        /**
         * Called after a session had ended.
         *
         * @param autSessionId {string} The AUT session ID.
         * @param testResults {Object} The test results.
         */
        testEnded: function (autSessionId, testResults) { },

        /**
         * Called before a new validation will be started.
         *
         * @param autSessionId {string} The AUT session ID.
         * @param validationInfo {ValidationInfo} The validation parameters.
         */
        validationWillStart: function (autSessionId, validationInfo) { },

        /**
         * Called when a validation had ended.
         *
         * @param autSessionId {string} The AUT session ID.
         * @param validationId {string} The ID of the validation which had ended.
         * @param validationResult {ValidationResult} The validation results.
         */
        validationEnded: function (autSessionId, validationId, validationResult) { }
    };

    // Factory
    var createSessionEventHandler = function () {
        return Object.create(_baseSessionEventHandler);
    };

    module.exports.ValidationInfo = ValidationInfo;
    module.exports.ValidationResult = ValidationResult;
    module.exports.createSessionEventHandler = createSessionEventHandler;
}());
