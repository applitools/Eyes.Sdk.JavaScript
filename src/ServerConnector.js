/*
 ---

 name: ServerConnector

 description: Provides an API for communication with the Applitools server.

 provides: [ServerConnector]
 requires: [GeneralUtils]

 ---
 */

(function () {
    "use strict";

    var GeneralUtils = require('eyes.utils').GeneralUtils,
        restler = require('restler'),
        fs = require('fs');


    // Constants
    var CONNECTION_TIMEOUT_MS = 5 * 60 * 1000,
        DEFAULT_HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'},
        SERVER_SUFFIX = '/api/sessions/running';

    /**
     *
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
     * @param {String} serverUri
     * @param {Object} logger
     * @constructor
     **/
    function ServerConnector(promiseFactory, serverUri, logger) {
        this._promiseFactory = promiseFactory;
        this._logger = logger;
        this._serverUri = GeneralUtils.urlConcat(serverUri, SERVER_SUFFIX);
        this._httpOptions = {
            rejectUnauthorized: false,
            headers: DEFAULT_HEADERS,
            timeout: CONNECTION_TIMEOUT_MS,
            query: {}
        };
    }

    /**
     * Sets the API key of your applitools Eyes account.
     *
     * @param apiKey {String} The api key to be used.
     */
    ServerConnector.prototype.setApiKey = function (apiKey) {
        this._httpOptions.query.apiKey = apiKey;
    };

    /**
     *
     * @return {String} The currently set API key.
     */
    ServerConnector.prototype.getApiKey = function () {
        return this._httpOptions.query.apiKey;
    };

    /**
     *
     * Starts a new running session in the server. Based on the given parameters,
     * this running session will either be linked to an existing session, or to
     * a completely new session.
     *
     * @method startSession
     * @param {Object} sessionStartInfo - The start parameters for the session.
     * @return {Object} Promise with a resolve result that represents the current running session.
     *
     **/
    ServerConnector.prototype.startSession = function (sessionStartInfo) {
        this._logger.verbose('ServerConnector.startSession called with:', sessionStartInfo);
        return this._promiseFactory.makePromise(function (resolve, reject) {
            this._logger.verbose('ServerConnector.startSession will now post call');
            restler.postJson(this._serverUri, {startInfo: sessionStartInfo}, this._httpOptions)
                .on('complete', function (data, response) {
                    if (!response) {
                        this._logger.verbose('ServerConnector.startSession - got empty response!');
                        reject(new Error(response));
                        return;
                    }

                    this._logger.verbose('ServerConnector.startSession - start session result', data,
                        'status code ', response.statusCode);
                    if (response.statusCode === 200 || response.statusCode === 201) {
                        this._logger.verbose('ServerConnector.startSession - post succeeded');
                        resolve({sessionId: data.id, sessionUrl: data.url,
                            isNewSession: response.statusCode === 201});
                    } else {
                        this._logger.log('ServerConnector.startSession - post failed');
                        reject(new Error(response));
                    }
                }.bind(this));
        }.bind(this));
    };

    /**
     *
     * Ends a running session in the server. Session results are received from the server.
     *
     * @method endSession
     * @param {Object} runningSession - The session to end.
     * @param {Object} isAborted.
     * @param {Object} save - Save the session.
     * @return {Object} Promise with a resolve result that represents the test results.
     *
     **/
    ServerConnector.prototype.endSession = function (runningSession, isAborted, save) {
        this._logger.verbose('ServerConnector.endSession called with isAborted:', isAborted,
            ', save:', save, 'for session:', runningSession);
        return this._promiseFactory.makePromise(function (resolve, reject) {
            var data = {aborted: isAborted, updateBaseline: save};
            var url = GeneralUtils.urlConcat(this._serverUri, runningSession.sessionId.toString());
            this._logger.verbose("ServerConnector.endSession will now post:", data, "to:", url);
            restler.json(url, data, this._httpOptions, 'DELETE')
                .on('complete', function (data, response) {
                    this._logger.verbose('ServerConnector.endSession result', data, 'status code', response.statusCode);
                    if (response.statusCode === 200 || response.statusCode === 201) {
                        resolve({
                            steps: data.steps,
                            matches: data.matches,
                            mismatches: data.mismatches,
                            missing: data.missing,
                            exactMatches: data.exactMatches,
                            strictMatches: data.strictMatches,
                            contentMatches: data.contentMatches,
                            layoutMatches: data.layoutMatches,
                            noneMatches: data.noneMatches
                        });
                    } else {
                        reject(new Error("error on server connector endSession"));
                    }
                }.bind(this));
        }.bind(this));
    };

    /**
     * Creates a bytes representation of the given JSON.
     * @param {object} jsonData The data from for which to create the bytes representation.
     * @return {Buffer} a buffer of bytes which represents the stringified JSON, prefixed with size.
     * @private
     */
    function _createDataBytes(jsonData) {
        var dataStr = JSON.stringify(jsonData);
        var dataLen = Buffer.byteLength(dataStr, 'utf8');
        // The result buffer will contain the length of the data + 4 bytes of size
        var result = new Buffer(dataLen + 4);
        result.writeUInt32BE(dataLen, 0);
        result.write(dataStr, 4, dataLen);
        return result;
    }

    ServerConnector.prototype.matchWindow = function (runningSession, matchWindowData, screenshot) {
        return this._promiseFactory.makePromise(function (resolve, reject) {
            var url = GeneralUtils.urlConcat(this._serverUri, runningSession.sessionId.toString());
            var options = Object.create(this._httpOptions);
            options.headers = Object.create(this._httpOptions.headers);
            // TODO Daniel - Use binary image instead of base64 (see line below)
            //options.headers['Content-Type'] = 'application/octet-stream';
            //options.data = Buffer.concat([_createDataBytes(matchWindowData), screenshot]).toString('binary');
            this._logger.verbose("ServerConnector.matchWindow will now post to:", url);
            restler.postJson(url, matchWindowData, options)
                .on('complete', function (data, response) {
                    this._logger.verbose('ServerConnector.matchWindow result', data,
                        'status code', response.statusCode);
                    if (response.statusCode === 200) {
                        resolve({asExpected: data.asExpected});
                    } else {
                        reject(new Error(response));
                    }
                }.bind(this));
        }.bind(this));
    };

    //noinspection JSValidateJSDoc
    /**
     * Replaces an actual image in the current running session.
     * @param {object} runningSession The currently running session.
     * @param {number} stepIndex The zero based index of the step in which to replace the actual image.
     * @param {object} replaceWindowData The updated window data (similar to matchWindowData only without ignoreMismatch).
     * @param {Buffer} screenshot The PNG bytes of the updated image.
     * @return {Promise} A promise which resolves when replacing is done, or rejects on error.
     */
    ServerConnector.prototype.replaceWindow = function (runningSession, stepIndex, replaceWindowData, screenshot) {
        return this._promiseFactory.makePromise(function (resolve, reject) {
            var url = GeneralUtils.urlConcat(this._serverUri, runningSession.sessionId.toString() + '/' + stepIndex);
            var options = Object.create(this._httpOptions);
            options.headers = Object.create(this._httpOptions.headers);
            // TODO Daniel - Use binary image instead of base64 (see line below)
            //options.headers['Content-Type'] = 'application/octet-stream';
            //options.data = Buffer.concat([_createDataBytes(matchWindowData), screenshot]).toString('binary');
            this._logger.verbose("ServerConnector.replaceWindow will now post to:", url);
            restler.putJson(url, replaceWindowData, options)
                .on('complete', function (data, response) {
                    this._logger.verbose('ServerConnector.replaceWindow result', data,
                        'status code', response.statusCode);
                    if (response.statusCode === 200) {
                        resolve();
                    } else {
                        reject(new Error(response));
                    }
                }.bind(this));
        }.bind(this));
    };

    module.exports = ServerConnector;
}());
