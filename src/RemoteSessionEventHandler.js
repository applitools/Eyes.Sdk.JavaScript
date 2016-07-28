(function () {
    'use strict';

    var request = require('request'),
        SessionEventHandler = require('./SessionEventHandler'),
        GeneralUtils = require('eyes.utils').GeneralUtils;

    // Constants
    var DEFAULT_CONNECTION_TIMEOUT_MS = 30 * 1000,
        SERVER_SUFFIX = '/applitools/sessions';

    module.exports.createSessionEventHandler = function (serverUrl, accessKey) {

        var sessionHandler = SessionEventHandler.createSessionEventHandler();

        sessionHandler._defaultHttpOptions = {
            strictSSL: false,
            baseUrl: GeneralUtils.urlConcat(serverUrl, SERVER_SUFFIX),
            json: true,
            qs: {}
        };

        // get/set timeout
		GeneralUtils.definePropertyWithDefaultConfig(sessionHandler, "timeout",
			function () { return this._defaultHttpOptions.timeout; },
			function (timeout) { this._defaultHttpOptions.timeout = timeout; }
		);

		// get/set serverUrl
		GeneralUtils.definePropertyWithDefaultConfig(sessionHandler, "serverUrl",
			function () { return this._serverUrl; },
			function (serverUrl) {
				this._serverUrl = serverUrl;
				this._defaultHttpOptions.baseUrl = GeneralUtils.urlConcat(serverUrl, SERVER_SUFFIX);
			}
		);

		// get/set accessKey
		GeneralUtils.definePropertyWithDefaultConfig(sessionHandler, "accessKey",
			function () { return this._defaultHttpOptions.qs.accessKey; },
			function (accessKey) { this._defaultHttpOptions.qs.accessKey = accessKey; }
		);

		// setting the properties' values.
		sessionHandler.timeout = DEFAULT_CONNECTION_TIMEOUT_MS;
		sessionHandler.serverUrl = serverUrl;
		sessionHandler.accessKey = accessKey;


        // *** Overriding callbacks
        sessionHandler.testStarted = function (sessionStartInfo) {
            return this._promiseFactory.makePromise(function (resolve, reject) {
                var options = Object.create(this._defaultHttpOptions);
                options.uri = "";
                options.body = {autSessionId: sessionStartInfo.autSessionId};
                options.method = "post";
                request(options, function (err, response) {
                    if (err) {
                        reject(new Error(err));
                        return;
                    }
                    resolve(response.statusCode);
                }.bind(this));
            }.bind(this));
        };

        sessionHandler.testEnded = function (autSessionId, testResults) {
            return this._promiseFactory.makePromise(function (resolve, reject) {
                var options = Object.create(this._defaultHttpOptions);
                options.uri = autSessionId;
                options.body = {action: "sessionEnd", testResults: testResults};
                options.method = 'put';
                request(options, function (err, response) {
                    if (err) {
                        reject(new Error(err));
                        return;
                    }
                    resolve(response.statusCode);
                }.bind(this));
            }.bind(this));
        };

        sessionHandler.validationWillStart = function (autSessionId, validationInfo) {
            return this._promiseFactory.makePromise(function (resolve, reject) {
                var options = Object.create(this._defaultHttpOptions);
                options.uri = autSessionId + "/validations";
                options.body = validationInfo.toObject();
                options.method = 'post';
                request(options, function (err, response) {
                    if (err) {
                        reject(new Error(err));
                        return;
                    }
                    resolve(response.statusCode);
                }.bind(this));
            }.bind(this));
        };

        sessionHandler.validationEnded = function (autSessionId, validationId, validationResult) {
            return this._promiseFactory.makePromise(function (resolve, reject) {
                var options = Object.create(this._defaultHttpOptions);
                options.uri = autSessionId + "/validations/" + validationId;
                options.body = {action: "validationEnd", asExpected: validationResult.asExpected};
                options.method = 'put';
                request(options, function (err, response) {
                    if (err) {
                        reject(new Error(err));
                        return;
                    }
                    resolve(response.statusCode);
                }.bind(this));
            }.bind(this));
        };

        return sessionHandler;
    };
}());
