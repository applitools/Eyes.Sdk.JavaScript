/*
 ---

 name: MatchWindowTask

 description: Handles matching of output with the expected output (including retry and 'ignore mismatch'
 when needed).

 provides: [MatchWindowTask]

 ---
 */

;(function() {
    "use strict";

    var PromiseFactory = require('./EyesPromiseFactory');

    /**
     *
     * C'tor = initializes the module settings
     *
     * @param {Object} serverConnector
     * @param {Object} runningSession
     * @param {Number} retryTimeout
     * @param {Object} appOutputProvider
     * @param {Function} waitTimeout - a call back that provides timeout
     * @param {Object} logger
     *
     **/
    function MatchWindowTask(serverConnector, runningSession, retryTimeout, appOutputProvider, waitTimeout, logger) {
        this._serverConnector = serverConnector;
        this._runningSession = runningSession;
        this._defaultRetryTimeout = retryTimeout;
        this._getAppOutput = appOutputProvider;
        this._matchResult = undefined;
        this._lastScreenshot = undefined;
        this._waitTimeout = waitTimeout;
        this._logger = logger;
    }

    // TODO: use
//    MatchWindowTask.prototype.getLastScreenshotBounds = function () {
//        return this._lastBounds;
//    };

    MatchWindowTask.prototype.matchWindow = function (userInputs, region, tag,
                                                      shouldRunOnceOnRetryTimeout, ignoreMismatch, retryTimeout) {

        this._logger.verbose("MatchWindowTask.matchWindow called with shouldRunOnceOnRetryTimeout: " +
            shouldRunOnceOnRetryTimeout + ", ignoreMismatch: " + ignoreMismatch + ", retryTimeout: " + retryTimeout);

        if (retryTimeout < 0)
        {
            retryTimeout = this._defaultRetryTimeout;
        }

        return PromiseFactory.makePromise(function (resolve, reject) {
            this._logger.verbose('MatchWindowTask.matchWindow starting to perform the match process');
            if (shouldRunOnceOnRetryTimeout || (retryTimeout == 0)) {
                if (retryTimeout > 0)
                {
                    this._logger.verbose('MatchWindowTask.matchWindow - running once but after going into timeout');
                    this._waitTimeout(retryTimeout).then(function () {
                        this._logger.verbose('MatchWindowTask.matchWindow - back from timeout - calling match');
                        _match.call(this, region, tag, ignoreMismatch, userInputs, resolve, reject);
                    }.bind(this));
                } else {
                    this._logger.verbose('MatchWindowTask.matchWindow - running once immediately');
                    _match.call(this, region, tag, ignoreMismatch, userInputs, resolve, reject);
                }
            } else {
                // Retry matching and ignore mismatches while the retry timeout does not expires.
                var start = new Date().getTime();
                this._logger.verbose('MatchWindowTask.matchWindow - starting retry sequence. start: ' + start);
                _retryMatch.call(this, start, retryTimeout, region, tag, userInputs, ignoreMismatch, undefined, resolve,
                    reject);
            }

        }.bind(this));
    };

    function _match(region, tag, ignoreMismatch, userInputs, resolve, reject) {
        this._logger.verbose('MatchWindowTask.matchWindow - _match calls for app output');
        this._getAppOutput(region, this._lastScreenshot).then(function (appOutput) {
            this._logger.verbose('MatchWindowTask.matchWindow - _match retrieved app output');
            var data = {
                userInputs: userInputs,
                appOutput: appOutput.appOutput,
                tag: tag,
                ignoreMismatch: ignoreMismatch};
            this._serverConnector.matchWindow(this._runningSession, data).then(function (matchResult) {
                this._logger.verbose('MatchWindowTask.matchWindow - _match received server connector result: '
                    + matchResult);
                this._matchResult = matchResult;
                _finalize.call(this, region, ignoreMismatch, appOutput.screenshot, resolve, reject);
            }.bind(this));
        }.bind(this), function (err) {
            reject(err);
        });
    }

    function _retryMatch(start, retryTimeout, region, tag, userInputs, ignoreMismatch, screenshot, resolve, reject) {

        if ((new Date().getTime() - start) < retryTimeout) {
            this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch will retry');
            this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch calls for app output');
            this._getAppOutput(region, this._lastScreenshot).then(function (appOutput) {
                this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch retrieved app output');
                screenshot = appOutput.screenshot;
                var data = {
                    userInputs: userInputs,
                    appOutput: appOutput.appOutput,
                    tag: tag,
                    ignoreMismatch: true};
                this._serverConnector.matchWindow(this._runningSession, data).then(function (result) {
                    this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch received server connector result: '
                        + result);
                    this._matchResult = result;

                    if (!this._matchResult.asExpected)
                    {
                        this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch received failed result - timeout and retry');
                        this._waitTimeout(500).then(function () {
                            this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch timeout passed -  retrying');
                            _retryMatch.call(this, start, retryTimeout, region, tag, userInputs, ignoreMismatch,
                                screenshot, resolve, reject);
                        }.bind(this));
                    } else {
                        this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch received success result - finalizing');
                        _finalize.call(this, region, ignoreMismatch, screenshot, resolve, reject);
                    }
                }.bind(this));
            }.bind(this), function (err) {
                reject(err);
            });
        } else {
            this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch exhausted the retry interval');
            if (!this._matchResult.asExpected) {
                // Try one last time...
                this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch last attempt because we got failure');
                _match.call(this, region, tag, ignoreMismatch, userInputs, resolve, reject);
            } else {
                this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch no need for last attempt because we got success');
                _finalize.call(this, region, ignoreMismatch, screenshot, resolve, reject);
            }
        }
    }


    function _finalize(region, ignoreMismatch, screenshot, resolve, reject) {
        this._logger.verbose('MatchWindowTask.matchWindow - _finalize called');
        if (ignoreMismatch)
        {
            this._logger.verbose('MatchWindowTask.matchWindow - _finalize is completed because ignoreMismatch is true');
            resolve(this._matchResult);
            return;
        }

        this._lastScreenshot = screenshot;

        if (!region)
        {
            if (!this._lastScreenshot)
            {
                this._logger.verbose('MatchWindowTask.matchWindow - _finalize sets infinite bounds - no region and no screenshot');
                // We set an "infinite" image size since we don't know what the screenshot
                // size is...
                    this._lastBounds = {
                    top: 0,
                    left: 0,
                    width: 1000000000,
                    height: 1000000000
                };
            }
            else
            {
                this._logger.verbose('MatchWindowTask.matchWindow - _finalize sets bounds - according to screenshot');

                this._lastBounds = {
                    top: 0,
                    left: 0,
                    width: this._lastScreenshot.width,
                    height: this._lastScreenshot.height
                };
            }
        }
        else
        {
            this._logger.verbose('MatchWindowTask.matchWindow - _finalize sets bounds - according to region');
            this._lastBounds = region;
        }

        resolve(this._matchResult);
    }

    module.exports = MatchWindowTask;
}());
