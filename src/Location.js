(function () {
    "use strict";

    var EyesUtils = require('eyes.utils');
    var ArgumentGuard = EyesUtils.ArgumentGuard;

    /**
     * Creates a Location instance.
     *
     * @constructor
     * @param {int} x The X coordinate of this location.
     * @param {int} y The Y coordinate of this location.
     **/
    function Location(x, y) {
        this.setX(x);
        this.setY(y);
    }

    /**
     * Creates a location from another location instance.
     * @param {Location} other A location instance from which to create the location.
     */
    Location.fromLocation = function (other) {
        ArgumentGuard.isValidType(other, Location);

        return new this(other.getX(), other.getY());
    };

    Location.ZERO = function () {
        return new Location (0, 0);
    };

    /**
     * @param {Location} other A Location instance to be checked for equality with the current instance.
     * @return {boolean} true if and only if the input objects are equal by value, false otherwise.
     */
    Location.prototype.equals = function (other) {
        if (this == other) {
            return true;
        }

        if (!(other instanceof Location)) {
            return false;
        }

        return (this.getX() == other.getX()) && (this.getY() == other.getY());
    };

    /**
     * @return {int} hashCode of current instance
     */
    Location.prototype.hashCode = function () {
        return this.x + this.y;
    };

    /**
     * Translates this location by the specified amount (in place!).
     * <p>
     * @param {Location|Array} amount The amount the offset. If param is Array the structure is [x-coordinate, y-coordinate]
     */
    Location.prototype.offset = function (amount) {
        if (amount instanceof Location) {
            this.x += amount.getX();
            this.y += amount.getY();
        } else if (Array.isArray(amount) && amount.length == 2) {
            this.setX(amount[0]);
            this.setY(amount[1]);
        } else {
            throw new Error("IllegalArgument: amount have to be Location or Array instance");
        }
    };

    /**
     * @return {int} The X coordinate of this location.
     */
    Location.prototype.getX = function () {
        return this.x;
    };

    /**
     * @param {int} x x-coordinate value
     */
    Location.prototype.setX = function (x) {
        this.x = parseInt(x, 10);
    };

    /**
     * @return {int} The Y coordinate of this location.
     */
    Location.prototype.getY = function () {
        return this.y;
    };

    /**
     * @param {int} y y-coordinate value
     */
    Location.prototype.setY = function (y) {
        this.y = parseInt(y, 10);
    };

    /**
     * @return {string}
     */
    Location.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ")";
    };

    module.exports = Location;
}());