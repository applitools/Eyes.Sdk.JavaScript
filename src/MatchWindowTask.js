/*
 ---

 name: MatchWindowTask

 description: Handles matching of output with the expected output (including retry and 'ignore mismatch'
 when needed).

 provides: [MatchWindowTask]

 ---
 */

(function () {
    "use strict";

    /**
     *
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
     * @param {Object} serverConnector
     * @param {Object} runningSession
     * @param {Number} retryTimeout
     * @param {Object} appOutputProvider
     * @param {Function} waitTimeout - a call back that provides timeout
     * @param {Object} logger
     * @constructor
     **/
    function MatchWindowTask(promiseFactory, serverConnector, runningSession, retryTimeout, appOutputProvider, waitTimeout, logger) {
        this._promiseFactory = promiseFactory;
        this._serverConnector = serverConnector;
        this._runningSession = runningSession;
        this._defaultRetryTimeout = retryTimeout;
        this._getAppOutput = appOutputProvider;
        this._matchResult = undefined;
        this._lastScreenShot = undefined;
        this._waitTimeout = waitTimeout;
        this._logger = logger;
    }

    MatchWindowTask.prototype.getLastScreenShotBounds = function () {
        return this._lastBounds;
    };

    function _finalize(region, ignoreMismatch, screenShot, resolve) {
        this._logger.verbose('MatchWindowTask.matchWindow - _finalize called');
        if (ignoreMismatch) {
            this._logger.verbose('MatchWindowTask.matchWindow - _finalize is completed because ignoreMismatch is true');
            resolve(this._matchResult);
            return;
        }

        this._lastScreenShot = screenShot;

        if (!region) {
            if (!this._lastScreenShot) {
                this._logger.verbose('MatchWindowTask.matchWindow - _finalize sets infinite bounds -',
                    'no region and no screen shot');
                // We set an "infinite" image size since we don't know what the screenShot
                // size is...
                this._lastBounds = {
                    top: 0,
                    left: 0,
                    width: 1000000000,
                    height: 1000000000
                };
            } else {
                this._logger.verbose('MatchWindowTask.matchWindow - _finalize sets bounds - according to screen shot');

                this._lastBounds = {
                    top: 0,
                    left: 0,
                    width: this._lastScreenShot.width,
                    height: this._lastScreenShot.height
                };
            }
        } else {
            this._logger.verbose('MatchWindowTask.matchWindow - _finalize sets bounds - according to region');
            this._lastBounds = region;
        }

        this._logger.verbose("last bounds:", this._lastBounds);

        resolve(this._matchResult);
    }

    function _match(region, tag, ignoreMismatch, userInputs, resolve) {
        this._logger.verbose('MatchWindowTask.matchWindow - _match calls for app output');
        return this._getAppOutput(region, this._lastScreenShot).then(function (appOutput) {
            this._logger.verbose('MatchWindowTask.matchWindow - _match retrieved app output');
            var data = {
                userInputs: userInputs,
                appOutput: appOutput.appOutput,
                tag: tag,
                ignoreMismatch: ignoreMismatch
            };
            return this._serverConnector.matchWindow(this._runningSession, data, appOutput.screenShot.imageBuffer)
                .then(function (matchResult) {
                    this._logger.verbose('MatchWindowTask.matchWindow - _match received server connector result:',
                        matchResult);
                    this._matchResult = matchResult;
                    return _finalize.call(this, region, ignoreMismatch, appOutput.screenShot, resolve);
                }.bind(this));
        }.bind(this));
    }

    function _retryMatch(start, retryTimeout, region, tag, userInputs, ignoreMismatch, screenShot, resolve) {

        if ((new Date().getTime() - start) < retryTimeout) {
            this._logger.verbose('MatchWindowTask._retryMatch will retry');
            this._logger.verbose('MatchWindowTask._retryMatch calls for app output');
            return this._getAppOutput(region, this._lastScreenShot).then(function (appOutput) {
                this._logger.verbose('MatchWindowTask._retryMatch retrieved app output');
                screenShot = appOutput.screenShot;
                var data = {
                    userInputs: userInputs,
                    appOutput: appOutput.appOutput,
                    tag: tag,
                    ignoreMismatch: true
                };
                this._logger.verbose('MatchWindowTask._retryMatch calls matchWindow');
                return this._serverConnector.matchWindow(this._runningSession, data, appOutput.screenShot.imageBuffer)
                    .then(function (result) {
                        this._logger.verbose(
                            'MatchWindowTask.matchWindow - _retryMatch received server connector result:',
                            result
                        );
                        this._matchResult = result;

                        if (!this._matchResult.asExpected) {
                            this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch received failed result -',
                                'timeout and retry');
                            return this._waitTimeout(500).then(function () {
                                this._logger.verbose('MatchWindowTask.matchWindow -',
                                    '_retryMatch timeout passed -  retrying');
                                return _retryMatch.call(this, start, retryTimeout, region, tag, userInputs,
                                    ignoreMismatch, screenShot, resolve);
                            }.bind(this));
                        }
                        this._logger.verbose('MatchWindowTask.matchWindow -',
                            '_retryMatch received success result - finalizing');
                        return _finalize.call(this, region, ignoreMismatch, screenShot, resolve);
                    }.bind(this));
            }.bind(this));
        }
        this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch exhausted the retry interval');
        if (!this._matchResult.asExpected) {
            // Try one last time...
            this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch last attempt because we got failure');
            return _match.call(this, region, tag, ignoreMismatch, userInputs, resolve);
        }

        this._logger.verbose('MatchWindowTask.matchWindow - _retryMatch no need for ',
            'last attempt because we got success');
        return _finalize.call(this, region, ignoreMismatch, screenShot, resolve);
    }

    MatchWindowTask.prototype.matchWindow = function (userInputs, region, tag,
                                                      shouldRunOnceOnRetryTimeout, ignoreMismatch, retryTimeout) {

        this._logger.verbose("MatchWindowTask.matchWindow called with shouldRunOnceOnRetryTimeout: ",
            shouldRunOnceOnRetryTimeout, ", ignoreMismatch:", ignoreMismatch, ", retryTimeout:", retryTimeout);

        if (retryTimeout < 0) {
            retryTimeout = this._defaultRetryTimeout;
        }

        return this._promiseFactory.makePromise(function (resolve) {
            this._logger.verbose('MatchWindowTask.matchWindow starting to perform the match process');
            if (shouldRunOnceOnRetryTimeout || (retryTimeout === 0)) {
                if (retryTimeout > 0) {
                    this._logger.verbose('MatchWindowTask.matchWindow - running once but after going into timeout');
                    return this._waitTimeout(retryTimeout).then(function () {
                        this._logger.verbose('MatchWindowTask.matchWindow - back from timeout - calling match');
                        return _match.call(this, region, tag, ignoreMismatch, userInputs, resolve);
                    }.bind(this));
                }
                this._logger.verbose('MatchWindowTask.matchWindow - running once immediately');
                return _match.call(this, region, tag, ignoreMismatch, userInputs, resolve);
            }
            // Retry matching and ignore mismatches while the retry timeout does not expires.
            var start = new Date().getTime();
            this._logger.verbose('MatchWindowTask.matchWindow - starting retry sequence. start:', start);
            return _retryMatch.call(this, start, retryTimeout, region, tag, userInputs, ignoreMismatch, undefined,
                resolve);
        }.bind(this));
    };

    module.exports = MatchWindowTask;
}());
