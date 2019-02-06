(function () {
    'use strict';

    /**
     * @constructor
     */
    function PositionProvider() {}

    /**
     *
     * @return {Promise<{x: number, y: number}>} - The current position, or {@code null} if position is not available.
     */
    PositionProvider.prototype.getCurrentPosition = function () {};

    /**
     * Go to the specified location.
     * @param {{x: number, y: number}} location - The position to set.
     * @return {Promise<void>}
     */
    PositionProvider.prototype.setPosition = function (location) {};

    /**
     * @return {Promise<{width: number, height: number}>} - The entire size of the container which the position is relative to.
     */
    PositionProvider.prototype.getEntireSize = function () {};

    /**
     * @return {Promise<Object>}
     */
    PositionProvider.prototype.getState = function () {};

    /**
     * @param {Object} state - The initial state of position
     * @return {Promise<void>}
     */
    PositionProvider.prototype.restoreState = function (state) {};

    exports.PositionProvider = PositionProvider;
}());
