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

    var EyesUtils = require('eyes.utils'),
        request = require('request'),
        fs = require('fs');

    var GeneralUtils = EyesUtils.GeneralUtils;

    // Constants
    var CONNECTION_TIMEOUT_MS = 5 * 60 * 1000,
        MAX_DELAY = 10000,
        DEFAULT_HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'},
        SERVER_SUFFIX = '/api/sessions/running';

    /**
     *
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
     * @param {String} serverUrl
     * @param {Object} logger
     * @constructor
     **/
    function ServerConnector(promiseFactory, serverUrl, logger) {
        this.setServerUrl(serverUrl);
        this._promiseFactory = promiseFactory;
        this._logger = logger;
        this._runKey = undefined;
        this._httpOptions = {
            proxy: null,
            strictSSL: false,
            headers: DEFAULT_HEADERS,
            timeout: CONNECTION_TIMEOUT_MS,
            qs: {}
        };
    }

    /**
     * Activate/Deactivate HTTP client debugging.
     *
     * @param {boolean} isDebug Whether or not to activate debugging.
     */
    ServerConnector.prototype.setDebugMode = function (isDebug) {
        request.debug = isDebug;
    };

    /**
     * @return {boolean} Whether or not debug mode is active.
     */
    ServerConnector.prototype.getIsDebugMode = function () {
        return request.debug;
    };

    /**
     * Sets the current server URL used by the rest client.
     *
     * @param serverUrl {String} The URI of the rest server.
     */
    ServerConnector.prototype.setServerUrl = function (serverUrl) {
        this._serverUrl = serverUrl;
        this._endPoint = GeneralUtils.urlConcat(serverUrl, SERVER_SUFFIX);
    };

    /**
     *
     * @return {String} The URI of the eyes server.
     */
    ServerConnector.prototype.getServerUrl = function () {
        return this._serverUrl;
    };

    /**
     * Sets the API key of your applitools Eyes account.
     *
     * @param runKey {String} The run key to be used.
     * @param newAuthScheme {boolean} Whether or not the server uses the new authentication scheme.
     */
    ServerConnector.prototype.setApiKey = function (runKey, newAuthScheme) {
        if (newAuthScheme) {
            this._httpOptions.qs.accessKey = runKey;
        } else {
            this._httpOptions.qs.apiKey = runKey;
        }
        this._runKey = runKey;
    };

    /**
     *
     * @return {String} The current run key.
     */
    ServerConnector.prototype.getApiKey = function () {
        return this._runKey;
    };

    /**
     * Sets the proxy settings to be used by the request module.
     *
     * @param {String} url The proxy url to be used. If {@code null} then no proxy is set.
     * @param {String} [username]
     * @param {String} [password]
     */
    ServerConnector.prototype.setProxy = function (url, username, password) {
        var proxyString;
        if (username) {
            var i = url.indexOf('://');
            var protocol = i === -1 ? 'http' : url.slice(0, i);
            proxyString = protocol + '://' + username + ':' + password + '@' + url;
        } else {
            proxyString = url;
        }

        this._httpOptions.proxy = proxyString;
    };

    /**
     *
     * @return {String} The current proxy settings used by the rest client, or {@code null} if no proxy is set.
     */
    ServerConnector.prototype.getProxy = function () {
        return this._httpOptions.proxy;
    };

    /**
     * Whether sessions are removed immediately after they are finished.
     *
     * @param shouldRemove {boolean}
     */
    ServerConnector.prototype.setRemoveSession = function (shouldRemove) {
        this._httpOptions.qs.removeSession = shouldRemove;
    };

    /**
     *
     * @return {boolean} Whether sessions are removed immediately after they are finished.
     */
    ServerConnector.prototype.getRemoveSession = function () {
        return !!this._httpOptions.qs.removeSession;
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

            var options = GeneralUtils.clone(this._httpOptions);
            options.uri = this._endPoint;
            options.body = {startInfo: sessionStartInfo};
            options.json = true;
            options.method = "post";
            request(options, function (err, response, body) {
                if (err) {
                    this._logger.log('ServerConnector.startSession - post failed');
                    reject(new Error(err));
                    return;
                }

                this._logger.verbose('ServerConnector.startSession - start session result', body,
                    'status code ', response.statusCode);

                if (response.statusCode === 200 || response.statusCode === 201) {
                    this._logger.verbose('ServerConnector.startSession - post succeeded');
                    resolve({
                        sessionId: body.id,
                        legacySessionId: body.legacySessionId,
                        sessionUrl: body.url,
                        isNewSession: response.statusCode === 201
                    });
                    return;
                }

                reject(new Error('ServerConnector.startSession - unexpected status ' +
                    '(statusCode: '+ response.statusCode + ', statusMessage: ' + response.statusMessage + ')'));
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

        var data = {aborted: isAborted, updateBaseline: save};

        var options = GeneralUtils.clone(this._httpOptions);
        options.uri = GeneralUtils.urlConcat(this._endPoint, runningSession.sessionId.toString());
        options.qs.aborted = isAborted;
        options.qs.updateBaseline = save;
        options.headers["Eyes-Expect"] = "202-accepted";
        options.headers["Eyes-Date"] = GeneralUtils.getRfc1123Date(new Date());
        options.json = true;
        options.method = 'delete';

        this._logger.verbose("ServerConnector.endSession will now post:", data, "to:", options.uri);

        return sendLongRequest(options, 2000, this._logger, this._promiseFactory);
    };

    var sendLongRequest = function (options, delay, logger, promiseFactory) {
        return promiseFactory.makePromise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (err) {
                    logger.log('ServerConnector.endSession - delete failed');
                    reject(new Error(err));
                    return;
                }

                logger.verbose('ServerConnector.endSession result', body, 'status code', response.statusCode);
                if (response.statusCode !== 202) {
                    resolve(body);
                    return;
                }

                // Waiting a delay
                logger.verbose("endSession: Still running... Retrying in " + delay + " ms");

                return GeneralUtils.sleep(delay, promiseFactory).then(function () {
                    // increasing the delay
                    delay = Math.min(MAX_DELAY, Math.floor(delay * 1.5));
                    return sendLongRequest(options, delay, logger, promiseFactory);
                }, function (err) {
                    logger.log("Long request interrupted!");
                    reject(new Error(err));
                });
            });
        });
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
            var url = GeneralUtils.urlConcat(this._endPoint, runningSession.sessionId.toString());
            this._logger.verbose("ServerConnector.matchWindow will now post to:", url);

            var options = GeneralUtils.clone(this._httpOptions);
            options.headers['Content-Type'] = 'application/octet-stream';
            options.uri = url;
            options.body = Buffer.concat([_createDataBytes(matchWindowData), screenshot]);
            options.method = "post";
            request(options, function (err, response, body) {
                if (err) {
                    this._logger.log('ServerConnector.matchWindow - post failed');
                    reject(new Error(err));
                    return;
                }

                body = JSON.parse(body); // we need to do it manually, because our content-type is not json
                this._logger.verbose('ServerConnector.matchWindow result', body, 'status code', response.statusCode);
                if (response.statusCode === 200) {
                    resolve({asExpected: body.asExpected});
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
            var url = GeneralUtils.urlConcat(this._endPoint, runningSession.sessionId.toString() + '/' + stepIndex);
            this._logger.verbose("ServerConnector.replaceWindow will now post to:", url);

            var options = GeneralUtils.clone(this._httpOptions);
            options.headers['Content-Type'] = 'application/octet-stream';
            options.uri = url;
            options.body = Buffer.concat([_createDataBytes(replaceWindowData), screenshot]);
            options.method = "put";
            request(options, function (err, response, body) {
                if (err) {
                    this._logger.log('ServerConnector.replaceWindow - put failed');
                    reject(new Error(err));
                    return;
                }

                body = JSON.parse(body); // we need to do it manually, because our content-type is not json
                this._logger.verbose('ServerConnector.replaceWindow result', body, 'status code', response.statusCode);
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
