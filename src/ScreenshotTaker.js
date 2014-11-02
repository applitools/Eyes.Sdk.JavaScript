/*
 ---

 name: ScreenShotTaker

 ---
 */

(function () {
    "use strict";

    var GeneralUtils = require('eyes.utils').GeneralUtils;

    /**
     *
     * C'tor = initializes the module settings
     *
     * @param {String} driverServerUri
     * @param {String} driverSessionId
     *
     *
     **/
    function ScreenShotTaker(driverServerUri, driverSessionId) {
        var cnct = GeneralUtils.urlConcat;
        this._driverServerUri = cnct(cnct(cnct(driverServerUri, "session"), driverSessionId), "screenShot");
    }

    // FIXME remove or implement?
    ScreenShotTaker.prototype.getScreenShotAsBase64 = function () {
        return true;
    };

    module.exports = ScreenShotTaker;
}());
