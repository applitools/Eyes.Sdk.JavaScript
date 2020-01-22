(function () {
  'use strict';

  /**
   * @param {string} serviceUrl
   * @param {string} accessToken
   * @param {string} resultsUrl
   */
  function RenderingInfo(serviceUrl, accessToken, resultsUrl) {
    this._serviceUrl = serviceUrl
    this._accessToken = accessToken
    this._resultsUrl = resultsUrl
  }

  RenderingInfo.prototype.getServiceUrl = function () {
    return this._serviceUrl;
  };

  RenderingInfo.prototype.setServiceUrl = function (value) {
    this._serviceUrl = value
  };

  RenderingInfo.prototype.getAccessToken = function () {
    return this._accessToken;
  };

  RenderingInfo.prototype.setAccessToken = function (value) {
    this._accessToken = value
  };

  RenderingInfo.prototype.getResultsUrl = function () {
    return this._resultsUrl;
  };

  RenderingInfo.prototype.setResultsUrl = function (value) {
    this._resultsUrl = value
  };

  exports.RenderingInfo = RenderingInfo;
}());
