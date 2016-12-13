(function () {
    "use strict";

    var ScaleProviderFactory = require('./ScaleProviderFactory');

    /**
     * Factory implementation which simply returns the scale provider it is given as an argument.
     *
     * @constructor
     * @param {ScaleProvider} scaleProvider The {@link ScaleProvider}
     * @param {PropertyHandler} scaleProviderHandler A handler to update once a {@link ScaleProvider} instance is created.
     **/
    function ScaleProviderIdentityFactory(scaleProvider, scaleProviderHandler) {
        this._scaleProvider = scaleProvider;

        ScaleProviderFactory.call(this, scaleProviderHandler);
    }

    ScaleProviderIdentityFactory.prototype = Object.create(ScaleProviderFactory.prototype);
    ScaleProviderIdentityFactory.prototype.constructor = ScaleProviderIdentityFactory;

    /**
     * The implementation of getting/creating the scale provider, should be implemented by child classes.
     *
     * @param {int} imageToScaleWidth The width of the image to scale. This parameter CAN be by class implementing the factory, but this is not mandatory.
     * @return {ScaleProvider} The scale provider to be used.
     */
    ScaleProviderIdentityFactory.prototype.getScaleProviderImpl = function (imageToScaleWidth) {
        return this._scaleProvider;
    };

    module.exports = ScaleProviderIdentityFactory;

}());
