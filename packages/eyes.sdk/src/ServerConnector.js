(function () {
    'use strict';

    var request = require('request');
    var GeneralUtils = require('eyes.utils').GeneralUtils;

    // constants
    var TIMEOUT = 5 * 60 * 1000,
        API_PATH = '/api/sessions/running',
        DEFAULT_HEADERS = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

    var LONG_REQUEST_DELAY = 2000, // ms
        MAX_LONG_REQUEST_DELAY = 10000, // ms
        LONG_REQUEST_DELAY_MULTIPLICATIVE_INCREASE_FACTOR = 1.5;

    var HTTP_STATUS_CODES = {
        CREATED: 201,
        ACCEPTED: 202,
        OK: 200,
        GONE: 410
    };

    /**
     * Provides an API for communication with the Applitools server.
     *
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
     * @param {string} serverUrl
     * @param {Logger} logger
     * @constructor
     **/
    function ServerConnector(promiseFactory, serverUrl, logger) {
        this._promiseFactory = promiseFactory;
        this._logger = logger;
        this._runKey = undefined;
        this._httpOptions = {
            proxy: null,
            strictSSL: false,
            headers: DEFAULT_HEADERS,
            timeout: TIMEOUT,
            qs: {}
        };

        this.setServerUrl(serverUrl);
        this.setApiKey(undefined);
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
     * @param serverUrl {string} The URI of the rest server.
     */
    ServerConnector.prototype.setServerUrl = function (serverUrl) {
        this._serverUrl = serverUrl;
        this._endPoint = GeneralUtils.urlConcat(serverUrl, API_PATH);
    };

    /**
     *
     * @return {string} The URI of the eyes server.
     */
    ServerConnector.prototype.getServerUrl = function () {
        return this._serverUrl;
    };

    /**
     * Sets the API key of your applitools Eyes account.
     *
     * @param runKey {string} The run key to be used.
     * @param [newAuthScheme] {boolean} Whether or not the server uses the new authentication scheme.
     */
    ServerConnector.prototype.setApiKey = function (runKey, newAuthScheme) {
        this._runKey = runKey || process.env.APPLITOOLS_API_KEY;
        if (newAuthScheme) {
            this._httpOptions.qs.accessKey = this._runKey;
        } else {
            this._httpOptions.qs.apiKey = this._runKey;
        }
    };

    /**
     *
     * @return {string} The current run key.
     */
    ServerConnector.prototype.getApiKey = function () {
        return this._runKey;
    };

    /**
     * Sets the proxy settings to be used by the request module.
     *
     * @param {string} url The proxy url to be used. If {@code null} then no proxy is set.
     * @param {string} [username]
     * @param {string} [password]
     */
    ServerConnector.prototype.setProxy = function (url, username, password) {
        var proxyString;
        if (username) {
            var i = url.indexOf('://');
            var protocol = 'http';
            if (i !== -1) {
                protocol = url.slice(0, i);
                url = url.slice(i + 3);
            }
            proxyString = protocol + '://' + username + ':' + password + '@' + url;
        } else {
            proxyString = url;
        }

        this._httpOptions.proxy = proxyString;
    };

    /**
     *
     * @return {string} The current proxy settings used by the rest client, or {@code null} if no proxy is set.
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
     * Starts a new running session in the server. Based on the given parameters, this running session will either be
     * linked to an existing session, or to a completely new session.
     *
     * @param {SessionStartInfo} sessionStartInfo - The start parameters for the session.
     * @return {Promise<RunningSession>} Promise with a resolve result that represents the current running session.
     **/
    ServerConnector.prototype.startSession = function (sessionStartInfo) {
        this._logger.verbose('ServerConnector.startSession called with:', sessionStartInfo);

        var that = this;
        var uri = this._endPoint;
        var options = {
            body: JSON.stringify({startInfo: sessionStartInfo})
        };

        return _sendRequest(that, 'startSession', uri, 'post', options).then(function (results) {
            if (results.status === HTTP_STATUS_CODES.OK || results.status === HTTP_STATUS_CODES.CREATED) {
                that._logger.verbose('ServerConnector.startSession - post succeeded');

                return {
                    sessionId: results.body.id,
                    legacySessionId: results.body.legacySessionId,
                    sessionUrl: results.body.url,
                    isNewSession: results.status === HTTP_STATUS_CODES.CREATED
                };
            }

            throw new Error('ServerConnector.startSession - unexpected status ' + JSON.stringify(results.response));
        });
    };

    /**
     *
     * Ends a running session in the server. Session results are received from the server.
     *
     * @param {RunningSession} runningSession - The session to end.
     * @param {boolean} isAborted.
     * @param {boolean} save Save the session.
     * @return {Promise<TestResults>} Promise with a resolve result that represents the test results.
     **/
    ServerConnector.prototype.endSession = function (runningSession, isAborted, save) {
        this._logger.verbose('ServerConnector.endSession called with isAborted:', isAborted, ', save:', save, 'for session:', runningSession);

        var that = this;
        var uri = GeneralUtils.urlConcat(this._endPoint, runningSession.sessionId.toString());
        var options = {
            query: {
                aborted: isAborted,
                updateBaseline: save
            }
        };

        return _sendLongRequest(that, 'stopSession', uri, 'delete', options).then(function (results) {
            if (results.status === HTTP_STATUS_CODES.OK) {
                that._logger.verbose('ServerConnector.stopSession - post succeeded');
                return results.body;
            }

            throw new Error('ServerConnector.stopSession - unexpected status ' + JSON.stringify(results.response));
        });
    };

    /**
     * Matches the current window to the expected window.
     * @param {RunningSession} runningSession The current agent's running session.
     * @param {object} matchWindowData The window data.
     * @param {Buffer} screenshot The PNG bytes of the updated image.
     * @return {Promise<{asExpected: boolean}>} A promise which resolves when matching is done, or rejects on error.
     */
    ServerConnector.prototype.matchWindow = function (runningSession, matchWindowData, screenshot) {
        this._logger.verbose('ServerConnector.matchWindow called with ', matchWindowData, ' for session: ', runningSession);

        var that = this;
        var uri = GeneralUtils.urlConcat(this._endPoint, runningSession.sessionId.toString());
        var options = {
            contentType: 'application/octet-stream',
            body: Buffer.concat([_createDataBytes(matchWindowData), screenshot])
        };

        return _sendLongRequest(that, 'matchWindow', uri, 'post', options).then(function (results) {
            if (results.status === HTTP_STATUS_CODES.OK) {
                that._logger.verbose('ServerConnector.matchWindow - post succeeded');

                return {
                    asExpected: results.body.asExpected
                };
            }

            throw new Error('ServerConnector.matchWindow - unexpected status ' + JSON.stringify(results.response));
        });
    };

    //noinspection JSValidateJSDoc
    /**
     * Replaces an actual image in the current running session.
     * @param {RunningSession} runningSession The currently running session.
     * @param {number} stepIndex The zero based index of the step in which to replace the actual image.
     * @param {object} replaceWindowData The updated window data (similar to matchWindowData only without ignoreMismatch).
     * @param {Buffer} screenshot The PNG bytes of the updated image.
     * @return {Promise<{asExpected: boolean}>} A promise which resolves when replacing is done, or rejects on error.
     */
    ServerConnector.prototype.replaceWindow = function (runningSession, stepIndex, replaceWindowData, screenshot) {
        this._logger.verbose('ServerConnector.replaceWindow called with ', replaceWindowData, ' for session: ', runningSession);

        var that = this;
        var uri = GeneralUtils.urlConcat(this._endPoint, runningSession.sessionId.toString() + '/' + stepIndex);
        var options = {
            contentType: 'application/octet-stream',
            body: Buffer.concat([_createDataBytes(replaceWindowData), screenshot])
        };

        return _sendLongRequest(that, 'replaceWindow', uri, 'put', options).then(function (results) {
            if (results.status === HTTP_STATUS_CODES.OK) {
                that._logger.verbose('ServerConnector.replaceWindow - post succeeded');

                return {
                    asExpected: results.body.asExpected
                };
            }

            throw new Error('ServerConnector.replaceWindow - unexpected status ' + JSON.stringify(results.response));
        });
    };

    /**
     * @private
     * @param {ServerConnector} that
     * @param {string} name
     * @param {string} uri
     * @param {string} method
     * @param {object} options
     * @return {Promise<{status: int, body: object, response: {statusCode: int, statusMessage: string, headers: object}}>}
     */
    function _sendLongRequest(that, name, uri, method, options) {
        var headers = {
            'Eyes-Expect': '202+location',
            'Eyes-Date': GeneralUtils.getRfc1123Date()
        };

        options.headers = options.headers ? GeneralUtils.objectAssign(options.headers, headers) : headers;
        return _sendRequest(that, name, uri, method, options).then(function (results) {
            return _longRequestCheckStatus(that, name, uri, method, options, results, true);
        });
    }

    /**
     * @private
     * @param {ServerConnector} that
     * @param {string} name
     * @param {string} uri
     * @param {string} method
     * @param {object} options
     * @param {{status: int, body: object, response: {statusCode: int, statusMessage: string, headers: object}}} results
     * @param {boolean} retryIfGone
     * @return {Promise<{status: int, body: object, response: {statusCode: int, statusMessage: string, headers: object}}>}
     */
    function _longRequestCheckStatus(that, name, uri, method, options, results, retryIfGone) {
        switch (results.status) {
            case HTTP_STATUS_CODES.OK:
                return that._promiseFactory.resolve(results);
            case HTTP_STATUS_CODES.ACCEPTED:
                var loopUri = results.response.headers['location'];
                return _longRequestLoop(that, name, loopUri, LONG_REQUEST_DELAY).then(function (results) {
                    return _longRequestCheckStatus(that, name, uri, method, options, results, retryIfGone);
                });
            case HTTP_STATUS_CODES.CREATED:
                var deleteUri = results.response.headers['location'];
                var loopOptions = {headers: {'Eyes-Date': GeneralUtils.getRfc1123Date()}};
                return _sendRequest(that, name, deleteUri, 'delete', loopOptions);
            case HTTP_STATUS_CODES.GONE:
                if (retryIfGone) {
                    that._logger.log('ServerConnector.' + name + ' - long request gone, doing one more attempt');
                    return _sendRequest(that, name, uri, method, options).then(function (results) {
                        return _longRequestCheckStatus(that, name, uri, method, options, results, false);
                    });
                }

                that._logger.log('ServerConnector.' + name + ' - long request gone: ', results);
                return that._promiseFactory.reject(new Error('The server task has gone.'));
            default:
                that._logger.log('ServerConnector.' + name + ' - long request failed: ', results);
                return that._promiseFactory.reject(new Error('Unknown error processing long request'));
        }
    }

    /**
     * @private
     * @param {ServerConnector} that
     * @param {string} name
     * @param {string} uri
     * @param {number} delay
     * @return {Promise<{status: int, body: object, response: {statusCode: int, statusMessage: string, headers: object}}>}
     */
    function _longRequestLoop(that, name, uri, delay) {
        delay = Math.min(MAX_LONG_REQUEST_DELAY, Math.floor(delay * LONG_REQUEST_DELAY_MULTIPLICATIVE_INCREASE_FACTOR));
        that._logger.verbose(name + ': Still running... Retrying in ' + delay + ' ms');

        return GeneralUtils.sleep(delay, that._promiseFactory).then(function () {
            var options = {headers: {'Eyes-Date': GeneralUtils.getRfc1123Date()}};
            return _sendRequest(that, name, uri, 'get', options);
        }).then(function (result) {
            if (result.status !== HTTP_STATUS_CODES.OK) return result;
            return _longRequestLoop(that, name, uri, delay);
        });
    }

    /**
     * @private
     * @param {ServerConnector} that
     * @param {string} name
     * @param {string} uri
     * @param {string} method
     * @param {object} options
     * @return {Promise<{status: int, body: object, response: {statusCode: int, statusMessage: string, headers: object}}>}
     */
    function _sendRequest(that, name, uri, method, options) {
        options = options || {};

        var req = GeneralUtils.clone(that._httpOptions);
        req.uri = uri;
        req.method = method;
        if (options.query) req.qs = GeneralUtils.objectAssign(req.qs, options.query);
        if (options.headers) req.headers = GeneralUtils.objectAssign(req.headers, options.headers);
        if (options.body) req.body = options.body;
        if (options.contentType) req.headers['Content-Type'] = options.contentType;

        return that._promiseFactory.makePromise(function (resolve, reject) {
            that._logger.verbose('ServerConnector.' + name + ' will now post call to: ' + req.uri);
            request(req, function (err, response, body) {
                if (err) {
                    that._logger.log('ServerConnector.' + name + ' - request failed: ', err, response);
                    return reject(new Error(err));
                }

                var results = {
                    status: response.statusCode,
                    body: body ? JSON.parse(body) : null,
                    response: {
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                        headers: response.headers
                    }
                };

                that._logger.verbose('ServerConnector.' + name + ' - result ', results.body, ', status code ' + results.status);
                return resolve(results);
            });
        });
    }

    /**
     * Creates a bytes representation of the given JSON.
     *
     * @private
     * @param {object} jsonData The data from for which to create the bytes representation.
     * @return {Buffer} a buffer of bytes which represents the stringified JSON, prefixed with size.
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

    exports.ServerConnector = ServerConnector;
}());
