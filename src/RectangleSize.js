(function () {
    "use strict";

    var EyesUtils = require('eyes.utils');
    var ArgumentGuard = EyesUtils.ArgumentGuard;

    /**
     * @constructor
     * Creates a new RectangleSize instance.
     * @param {int} width The width of the rectangle.
     * @param {int} height The height of the rectangle.
     */
    function RectangleSize(width, height) {
        ArgumentGuard.greaterThanOrEqualToZero(width, "width");
        ArgumentGuard.greaterThanOrEqualToZero(height, "height");

        this.setWidth(width);
        this.setHeight(height);
    }

    /**
     * Parses a string into a {link RectangleSize} instance.
     * @param {string} size A string representing width and height separated by "x".
     * @return {RectangleSize} An instance representing the input size.
     */
    RectangleSize.parse = function (size) {
        ArgumentGuard.notNull(size, "size");
        
        var parts = size.split("x");
        if (parts.length != 2) {
            throw new Error("IllegalArgument: Not a valid size string: " + size);
        }

        return new RectangleSize(parseInt(parts[0]), parseInt(parts[1]));
    };

    /**
     * @param {RectangleSize} other A RectangleSize instance to be checked for equality with the current instance.
     * @return {boolean} true if and only if the input objects are equal by value, false otherwise.
     */
    RectangleSize.prototype.equals = function (other) {
        if (this == other) {
            return true;
        }

        if (!(other instanceof RectangleSize)) {
            return false;
        }

        return this.getWidth() == other.getWidth() && this.getHeight() == other.getHeight();
    };

    /**
     * @return {int} hashCode of current instance
     */
    RectangleSize.prototype.hashCode = function () {
        return this.width ^ this.height;
    };

    /**
     * @return {int} The width of this region
     */
    RectangleSize.prototype.getWidth = function () {
        return this.width;
    };

    /**
     * @param {int} width value
     */
    RectangleSize.prototype.setWidth = function (width) {
        this.width = parseInt(width, 10);
    };

    /**
     * @return {int} The height of this region
     */
    RectangleSize.prototype.getHeight = function () {
        return this.height;
    };

    /**
     * @param {int} height value
     */
    RectangleSize.prototype.setHeight = function (height) {
        this.height = parseInt(height, 10);
    };

    /**
     * @return {string}
     */
    RectangleSize.prototype.toString = function () {
        return this.width + "x" + this.height;
    };

    module.exports = RectangleSize;
}());