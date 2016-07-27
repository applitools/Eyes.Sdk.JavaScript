(function () {
    "use strict";

    var RectangleSize = require('./RectangleSize'),
        Location = require('./Location');

    /**
     * @constructor
     **/
    function PositionProvider() {}

    /**
     *
     * @return {Location} The current position, or {@code null} if position is not
     * available.
     */
    PositionProvider.prototype.getCurrentPosition = function () {};

    /**
     * Go to the specified location.
     * @param {Location} location The position to set.
     */
    PositionProvider.prototype.setPosition = function (location) {};

    /**
     * @return {RectangleSize} The entire size of the container which the position is relative to.
     */
    PositionProvider.prototype.getEntireSize = function () {};

    /**
     * Get the current state of the position provider. This is different from
     * {@link #getCurrentPosition()} in that the state of the position provider
     * might include other data than just the coordinates. For example a CSS
     * translation based position provider (in WebDriver based SDKs), might
     * save the entire "transform" style value as its state.
     *
     * @return {PositionMemento} The current state of the position provider, which can later be
     * restored by  passing it as a parameter to {@link #restoreState}.
     */
    PositionProvider.prototype.getState = function () {};

    /**
     * Restores the state of the position provider to the state provided as a
     * parameter.
     *
     * @param {PositionMemento} state The state to restore to.
     */
    PositionProvider.prototype.restoreState = function (state) {};

    module.exports = PositionProvider;

}());