(function () {
    "use strict";

    /**
     * @constructor
     **/
    function PositionProvider() {}

    /**
     *
     * @return {Promise<{x: number, y: number}>} The current position, or {@code null} if position is not available.
     */
    PositionProvider.prototype.getCurrentPosition = function () {};

    /**
     * Go to the specified location.
     * @param {{x: number, y: number}} location The position to set.
     */
    PositionProvider.prototype.setPosition = function (location) {};

    /**
     * @return {Promise<{width: number, height: number}>} The entire size of the container which the position is relative to.
     */
    PositionProvider.prototype.getEntireSize = function () {};

    /**
     * @returns {Promise<object>}
     */
    PositionProvider.prototype.getState = function () {};

    /**
     * @param {object} state The initial state of position
     * @returns {Promise<void>}
     */
    PositionProvider.prototype.restoreState = function (state) {};

    module.exports = PositionProvider;

}());