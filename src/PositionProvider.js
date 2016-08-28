(function () {
    "use strict";

    /**
     * @constructor
     **/
    function PositionProvider() {}

    /**
     *
     * @return {{x: number, y: number}} The current position, or {@code null} if position is not
     * available.
     */
    PositionProvider.prototype.getCurrentPosition = function () {};

    /**
     * Go to the specified location.
     * @param {{x: number, y: number}} location The position to set.
     */
    PositionProvider.prototype.setPosition = function (location) {};

    /**
     * @return {{x: number, y: number}} The entire size of the container which the position is relative to.
     */
    PositionProvider.prototype.getEntireSize = function () {};

    module.exports = PositionProvider;

}());