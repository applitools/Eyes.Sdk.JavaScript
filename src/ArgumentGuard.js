/*
 ---

 name: ArgumentGuard

 description: Argument validation utilities.

 ---
 */

(function () {
    "use strict";

    var ArgumentGuard = {};

    /**
     * Fails if the input parameter equals the input value.
     *
     * @param {Object} param The input parameter.
     * @param {Object} value The input value.
     * @param {string} paramName The input parameter name.
     */
    ArgumentGuard.notEqual = function (param, value, paramName) {
        if (param === value) {
            throw new Error("IllegalArgument: " + paramName + " == " + value);
        }
    };

    /**
     * Fails if the input parameter is null.
     *
     * @param {Object} param The input parameter.
     * @param {string} paramName The input parameter name.
     */
    ArgumentGuard.notNull = function (param, paramName) {
        if (null === param || undefined === param) {
            throw new Error("IllegalArgument: " + paramName + " is null");
        }
    };

    /**
     * Fails if the input parameter is not null.
     *
     * @param {Object} param The input parameter.
     * @param {string} paramName The input parameter name.
     */
    ArgumentGuard.isNull = function (param, paramName) {
        if (null !== param && undefined !== param) {
            throw new Error("IllegalArgument: " + paramName + " is not null");
        }
    };

    /**
     * Fails if the input parameter string is null or empty.
     *
     * @param {Object} param The input parameter.
     * @param {string} paramName The input parameter name.
     */
    ArgumentGuard.notNullOrEmpty = function (param, paramName) {
        if (!param) {
            throw new Error("IllegalArgument: " + paramName + " is empty");
        }
    };

    /**
     * Fails if the input integer parameter is negative.
     *
     * @param {number} param The input parameter.
     * @param {string} paramName The input parameter name.
     */
    ArgumentGuard.greaterThanOrEqualToZero = function (param, paramName) {
        if (0 > param) {
            throw new Error("IllegalArgument: " + paramName + " < 0");
        }
    };

    /**
     * Fails if the input integer parameter is smaller than 1.
     *
     * @param {number} param The input parameter.
     * @param {string} paramName The input parameter name.
     */
    ArgumentGuard.greaterThanZero = function (param, paramName) {
        if (0 >= param) {
            throw new Error("IllegalArgument: " + paramName + " < 1");
        }
    };

    /**
     * Fails if the input integer parameter is equal to 0.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     */
    ArgumentGuard.notZero = function (param, paramName) {
        if (0 === param) {
            throw new Error("IllegalArgument: " + paramName + " == 0");
        }
    };

    /**
     * Fails if isValid is false.
     *
     * @param {boolean} isValid Whether the current state is valid.
     * @param {string} errMsg A description of the error.
     */
    ArgumentGuard.isValidState = function (isValid, errMsg) {
        if (!isValid) {
            throw new Error("IllegalState: " + errMsg);
        }
    };

    /**
     * Fails if isValid is false.
     *
     * @param {Object} param The input parameter.
     * @param {Object} type The expected param type
     */
    ArgumentGuard.isValidType = function (param, type) {
        if (!(param instanceof type)) {
            throw new Error("IllegalType: " + param + " is not instance of " + type);
        }
    };

    module.exports = ArgumentGuard;
}());