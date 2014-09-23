/*
 ---

 name: EyesBase

 description: Core/Base class for Eyes - to allow code reuse for different SDKs (images, selenium, etc).

 provides: [EyesBase]
 requires: [ServerConnector, MatchWindowTask, GeneralUtils, EyesPromiseFactory, ImageUtils, Logger, Triggers]

 ---
 */

(function () {
    "use strict";

    var ServerConnector = require('./ServerConnector'),
        MatchWindowTask = require('./MatchWindowTask'),
        GeneralUtils = require('./GeneralUtils'),
        PromiseFactory = require('./EyesPromiseFactory'),
        ImageUtils = require('./ImageUtils'),
        Triggers = require('./Triggers'),
        Logger = require('./Logger');

    var _MatchLevel = {
        // Images do not necessarily match.
        None: 'None',

        // Images have the same layout.
        Layout: 'Layout',

        // Images have the same content.
        Content: 'Content',

        // Images are nearly identical.
        Strict: 'Strict',

        // Images are identical.
        Exact: 'Exact'
    };

    var _FailureReport = {
        // Failures are reported immediately when they are detected.
        Immediate: 'Immediate',
        // Failures are reported when tests are completed (i.e., when Eyes.close() is called).
        OnClose: 'OnClose'
    };

    /**
     *
     * C'tor = initializes the module settings
     *
     * @param {String} serverUrl
     * @param {Boolean} isDisabled
     *
     **/
    function EyesBase(serverUrl, isDisabled) {
        if (serverUrl) {
            this._logger = new Logger();
            this._serverUrl = serverUrl;
            this._matchLevel = EyesBase.MatchLevel.Strict;
            this._failureReport = EyesBase.FailureReport.OnClose;
            this._userInputs = [];
            this._saveNewTests = true;
            this._saveFailedTests = false;
            this._serverConnector = new ServerConnector(this._serverUrl, this._logger);
            this._isDisabled = isDisabled;
            this._defaultMatchTimeout = 2000;
            this._agentId = undefined;
        }
    }

    /**
     * Set the log handler
     *
     * @param {Object} logHandler
     */
    EyesBase.prototype.setLogHandler = function (logHandler) {
        this._logger.setLogHandler(logHandler);
    };

    /**
     * Sets the API key of your applitools Eyes account.
     *
     * @param apiKey {String} The api key to be used.
     */
    EyesBase.prototype.setApiKey = function (apiKey) {
        this._serverConnector.setApiKey(apiKey);
    };

    /**
     * @return {String} The currently set api key.
     */
    EyesBase.prototype.getApiKey = function () {
        return this._serverConnector.getApiKey();
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the user given agent id of the SDK.
     *
     * @param agentId {String} The agent ID to set.
     */
    EyesBase.prototype.setAgentId = function (agentId) {
        this._agentId = agentId;
    };

    /**
     * @return {String} The user given agent id of the SDK.
     */
    EyesBase.prototype.getAgentId = function () {
        return this._agentId;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The user given agent id of the SDK.
     */
    EyesBase.prototype._getFullAgentId = function () {
        //noinspection JSUnresolvedVariable
        if (!this._getBaseAgentId) {
            throw new Error("_getBaseAgentId not implemented!");
        }
        var agentId = this.getAgentId();
        if (!agentId) {
            //noinspection JSUnresolvedFunction
            return this._getBaseAgentId();
        }
        //noinspection JSUnresolvedFunction
        return agentId + " [" + this._getBaseAgentId() + "]";
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the host OS name - overrides the one in the agent string.
     *
     * @param hostOS {String} The host OS.
     */
    EyesBase.prototype.setHostOS = function (hostOS) {
        this._hostOS = hostOS;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The host OS as set by the user.
     */
    EyesBase.prototype.getHostOS = function () {
        return this._hostOS;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the test batch
     *
     * @param name {String} - the batch name
     *
     * @remarks:
     *   For advanced use cases - it is possible to pass ID and start date in that order - as 2nd and 3rd args
     */
    EyesBase.prototype.setBatch = function (name) {
        this._batch = {
            id: arguments[1] || GeneralUtils.guid(),
            name: name,
            startedAt: arguments[2] || new Date().toUTCString()
        };
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {Object} gets the test batch.
     */
    EyesBase.prototype.getBatch = function () {
        return this._batch;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Set whether or not new tests are saved by default.
     * @param {boolean} shouldSave True if new tests should be saved by default.
     *                     False otherwise.
     */
    EyesBase.prototype.setSaveNewTests = function (shouldSave) {
        this._saveNewTests = shouldSave;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @return {boolean} True if new tests are saved by default.
     */
    EyesBase.prototype.getSaveNewTests = function () {
        return this._saveNewTests;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Set whether or not failed tests are saved by default.
     * @param {boolean} shouldSave True if failed tests should be saved by
     *                        default, false otherwise.
     */
    EyesBase.prototype.setSaveFailedTests = function (shouldSave) {
        this._saveFailedTests = shouldSave;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {boolean} True if failed tests are saved by default.
     */
    EyesBase.prototype.getSaveFailedTests = function () {
        return this._saveFailedTests;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the maximal time a match operation tries to perform a match.
     * @param {number} timeout Timeout in milliseconds.
     */
    EyesBase.prototype.setDefaultMatchTimeout = function (timeout) {
        this._defaultMatchTimeout = timeout;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @return {number} The maximal time in milliseconds a match operation tries to perform a match.
     */
    EyesBase.prototype.getDefaultMatchTimeout = function () {
        return this._defaultMatchTimeout;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param mode Use one of the values in EyesBase.FailureReport.
     */
    EyesBase.prototype.setFailureReport = function (mode) {
        switch (mode) {
        case EyesBase.FailureReport.OnClose:
            this._failureReport = EyesBase.FailureReport.OnClose;
            break;
        case EyesBase.FailureReport.Immediate:
            this._failureReport = EyesBase.FailureReport.Immediate;
            break;
        default:
            this._failureReport = EyesBase.FailureReport.OnClose;
            break;
        }
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @return {EyesBase.FailureReport} The currently set FailureReport.
     */
    EyesBase.prototype.getFailureReport = function () {
        return this._failureReport;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * The test-wide match level to use when checking application screenShot with the expected output.
     * @param {EyesBase.MatchLevel} level The match level setting.
     */
    EyesBase.prototype.setMatchLevel = function (level) {
        switch (level) {
        case EyesBase.MatchLevel.None:
            this._matchLevel = EyesBase.MatchLevel.None;
            break;
        case EyesBase.MatchLevel.Content:
            this._matchLevel = EyesBase.MatchLevel.Content;
            break;
        case EyesBase.MatchLevel.Strict:
            this._matchLevel = EyesBase.MatchLevel.Strict;
            break;
        case EyesBase.MatchLevel.Layout:
            this._matchLevel = EyesBase.MatchLevel.Layout;
            break;
        case EyesBase.MatchLevel.Exact:
            this._matchLevel = EyesBase.MatchLevel.Exact;
            break;
        default:
            this._matchLevel = EyesBase.MatchLevel.Strict;
            break;
        }
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {EyesBase.MatchLevel} The test-wide match level.
     */
    EyesBase.prototype.getMatchLevel = function () {
        return this._matchLevel;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the branch name.
     *
     * @param branchName {String} The branch name.
     */
    EyesBase.prototype.setBranchName = function (branchName) {
        this._branchName = branchName;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The branch name.
     */
    EyesBase.prototype.getBranchName = function () {
        return this._branchName;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the parent branch name.
     *
     * @param parentBranchName {String} The parent branch name.
     */
    EyesBase.prototype.setParentBranchName = function (parentBranchName) {
        this._parentBranchName = parentBranchName;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The parent branch name.
     */
    EyesBase.prototype.getParentBranchName = function () {
        return this._parentBranchName;
    };

    EyesBase.prototype.open = function (appName, testName, viewportSize) {
        this._logger.getLogHandler().open();
        return PromiseFactory.makePromise(function (resolve, reject) {
            if (this._isDisabled) {
                this._logger.log("Eyes Open ignored - disabled");
                resolve();
                return;
            }

            var errMsg;
            if (!this._serverConnector.getApiKey()) {
                errMsg = 'API key is missing! Please set it via Eyes.setApiKey';
                this._logger.log(errMsg);
                this._logger.getLogHandler().close();
                reject(new Error(errMsg));
                return;
            }

            if (this._isOpen) {
                this.abortIfNotClosed();
                errMsg = "A test is already running";
                this._logger.log(errMsg);
                this._logger.getLogHandler().close();
                reject(new Error(errMsg));
                return;
            }

            this._isOpen = true;
            this._userInputs = [];
            this._viewportSize = viewportSize;
            this._testName = testName;
            this._appName = appName;
            resolve();
        }.bind(this));
    };

    EyesBase.buildTestError = function (results, scenarioIdOrName, appIdOrName) {
        var message;
        if (results.isNew) {
            var instructions = "Please approve the new baseline at " + results.url;
            message = "[EYES: NEW TEST ENDED]: '" + scenarioIdOrName + "' of '" + appIdOrName
                + "'. " + instructions;
            return new Error(message + " results: " + JSON.stringify(results));
        }

        if (!results.isPassed) {
            message = "[EYES: TEST FAILED]: '" + scenarioIdOrName + "' of '" + appIdOrName
                + "'. See details at " + results.url;
            return new Error(message + " results: " + JSON.stringify(results));
        }

        return null;
    };

    EyesBase.prototype.close = function (throwEx) {
        if (throwEx === undefined) {
            throwEx = true;
        }

        return PromiseFactory.makePromise(function (resolve, reject) {
            this._logger.verbose('EyesBase.close is running');
            if (this._isDisabled) {
                this._logger.log("Eyes Close ignored - disabled");
                this._logger.getLogHandler().close();
                resolve();
                return;
            }

            if (!this._isOpen) {
                var errMsg = "close called with Eyes not open";
                this._logger.log(errMsg);
                this._logger.getLogHandler().close();
                reject(new Error(errMsg));
                return;
            }

            this._isOpen = false;
            if (!this._runningSession) {
                this._logger.log("Close: Server session was not started");
                this._logger.getLogHandler().close();
                resolve();
                return;
            }

            this._logger.verbose('EyesBase.close - calling server connector to end the running session');
            var save = ((this._runningSession.isNewSession && this._saveNewTests) ||
                (!this._runningSession.isNewSession && this._saveFailedTests));
            return this._serverConnector.endSession(this._runningSession, false, save)
                .then(function (results) {
                    this._logger.log('=======================================');
                    this._logger.log('>> EyesBase.close - session ended');
                    results.isNew = this._runningSession.isNewSession;
                    results.url = this._runningSession.sessionUrl;
                    results.isPassed = ((!results.isNew) && results.mismatches === 0 && results.missing === 0);
                    this._runningSession = undefined;
                    this._logger.log('>> close:', results);

                    if (!results.isPassed) {
                        var error = EyesBase.buildTestError(results, this._sessionStartInfo.scenarioIdOrName,
                            this._sessionStartInfo.appIdOrName);

                        this._logger.log(error.message);

                        if (throwEx) {
                            this._logger.getLogHandler().close();
                            reject(error);
                            return;
                        }
                    } else {
                        this._logger.log(">> Test passed. See details at", results.url);
                    }
                    this._logger.getLogHandler().close();
                    resolve(results);
                }.bind(this));
        }.bind(this));
    };

    // lastScreenShot - notice it's an object with imageBuffer, width & height properties
    function _getAppData(region, lastScreenShot) {
        var that = this;
        return PromiseFactory.makePromise(function (resolve, reject) {
            that._logger.verbose('EyesBase.checkWindow - getAppOutput callback is running - getting screen shot');
            var data = {appOutput: {}};
            return that.getScreenShot()
                .then(function (image) {
                    that._logger.verbose('EyesBase.checkWindow - getAppOutput received the screen shot');
                    return ImageUtils.processImage(image, region);
                })
                .then(function (processedImage) {
                    that._logger.verbose('cropped image returned - continuing');
                    data.screenShot = processedImage;
                    data.appOutput.screenShot64 = processedImage.imageBuffer.toString('base64'); //TODO: compress deltas

                    that._logger.verbose('EyesBase.checkWindow - getAppOutput getting title');
                    return that.getTitle();
                })
                .then(function (title) {
                    that._logger.verbose('EyesBase.checkWindow - getAppOutput received the title');
                    data.appOutput.title = title;
                    resolve(data);
                }, function (err) {
                    reject(err);
                });
        });
    }

    //noinspection JSUnusedGlobalSymbols
    EyesBase.prototype.checkWindow = function (tag, ignoreMismatch, retryTimeout, region) {
        tag = tag || '';
        retryTimeout = retryTimeout || -1;

        return PromiseFactory.makePromise(function (resolve, reject) {
            this._logger.verbose('EyesBase.checkWindow - running');
            if (this._isDisabled) {
                this._logger.verbose("Eyes checkWindow ignored - disabled");
                resolve();
                return;
            }

            if (!this._isOpen) {
                var errMsg = "checkWindow called with Eyes not open";
                this._logger.log(errMsg);
                reject(new Error(errMsg));
                return;
            }

            return this.startSession().then(function () {
                this._logger.verbose('EyesBase.checkWindow - session started - creating match window task');
                this._matchWindowTask = new MatchWindowTask(this._serverConnector,
                    this._runningSession, this._defaultMatchTimeout, _getAppData.bind(this),
                    this._waitTimeout.bind(this), this._logger);

                this._logger.verbose("EyesBase.checkWindow - calling matchWindowTask.matchWindow");
                return this._matchWindowTask.matchWindow(this._userInputs, region, tag,
                    this._shouldMatchWindowRunOnceOnTimeout, ignoreMismatch, retryTimeout)
                    .then(function (result) {
                        this._logger.verbose("EyesBase.checkWindow - match window returned result:",
                            JSON.stringify(result));

                        if (!ignoreMismatch) {
                            this._userInputs = [];
                        }

                        if (!result.asExpected) {
                            this._logger.verbose("EyesBase.checkWindow - match window result was not success");
                            this._shouldMatchWindowRunOnceOnTimeout = true;

                            if (!this._runningSession.isNewSession) {
                                this._logger.log("Mismatch!", tag);
                            }

                            if (this._failureReport === EyesBase.FailureReport.Immediate) {
                                reject(new Error("[EYES: TEST FAILED]: Mismatch found in '" +
                                    this._sessionStartInfo.scenarioIdOrName + "' of '" +
                                    this._sessionStartInfo.appIdOrName + "'"));
                            }
                        }

                        resolve(result);
                    }.bind(this));
            }.bind(this));
        }.bind(this));
    };

    EyesBase.prototype.startSession = function () {
        return PromiseFactory.makePromise(function (resolve, reject) {

            if (this._runningSession) {
                resolve();
                return;
            }

            var promise;
            if (!this._viewportSize) {
                promise = this.getViewportSize();
            } else {
                promise = this.setViewportSize(this._viewportSize);
            }

            return promise.then(function (result) {
                this._viewportSize = this._viewportSize || result;
                var testBatch = this._batch;
                if (!testBatch) {
                    testBatch = {id: GeneralUtils.guid(), name: null, startedAt: new Date().toUTCString()};
                }

                testBatch.toString = function () {
                    return this.name + " [" + this.id + "]" + " - " + this.startedAt;
                };

                return this.getInferredEnvironment().then(function (userAgent) {
                    var appEnv = {
                        os: this._hostOS || null,
                        hostingApp: this._appName || null,
                        displaySize: this._viewportSize,
                        inferred: userAgent
                    };

                    this._sessionStartInfo = {
                        agentId: this._getFullAgentId(),
                        appIdOrName: this._appName,
                        scenarioIdOrName: this._testName,
                        batchInfo: testBatch,
                        environment: appEnv,
                        matchLevel: this._matchLevel,
                        branchName: this._branchName || null,
                        parentBranchName: this._parentBranchName || null
                    };

                    return this._serverConnector.startSession(this._sessionStartInfo)
                        .then(function (result) {
                            this._runningSession = result;
                            this._shouldMatchWindowRunOnceOnTimeout = result.isNewSession;
                            resolve();
                        }.bind(this), function (err) {
                            this._logger.log(err);
                            reject(err);
                        }.bind(this));
                }.bind(this), function (err) {
                    this._logger.log(err);
                    reject(err);
                }.bind(this));
            }.bind(this), function (err) {
                this._logger.log(err);
                reject(err);
            }.bind(this));
        }.bind(this));
    };

    EyesBase.prototype.abortIfNotClosed = function () {
        return PromiseFactory.makePromise(function (resolve) {
            if (this._isDisabled) {
                this._logger.log("Eyes abortIfNotClosed ignored - disabled");
                this._logger.getLogHandler().close();
                resolve();
                return;
            }

            this._isOpen = false;
            this._matchWindowTask = undefined;

            if (!this._runningSession) {
                resolve();
                this._logger.getLogHandler().close();
                return;
            }

            return this._serverConnector.endSession(this._runningSession, true, false).then(function () {
                this._runningSession = undefined;
                this._logger.getLogHandler().close();
                resolve();
            }.bind(this));
        }.bind(this));
    };

    EyesBase.prototype.addKeyboardTrigger = function (control, text) {
        this._logger.verbose("addKeyboardTrigger called with text:", text, "for control:", control);

        if (!this._matchWindowTask) {
            this._logger.verbose("addKeyboardTrigger: No screen shot - ignoring text:", text);
            return;
        }

        if (control.width > 0 && control.height > 0) {
            var sb = this._matchWindowTask.getLastScreenShotBounds();
            control = GeneralUtils.intersect(control, sb);
            if (control.width === 0 || control.height === 0) {
                this._logger.verbose("addKeyboardTrigger: out of bounds - ignoring text:", text);
                return;
            }

            // Even after we intersected the control, we need to make sure it's location
            // is based on the last screenShot location (remember it might be with offset).
            control.left -= sb.left;
            control.top -= sb.top;
        }

        var trigger = Triggers.createTextTrigger(control, text);
        this._userInputs.push(trigger);
        this._logger.verbose("AddKeyboardTrigger: Added", trigger);
    };

    EyesBase.prototype.addMouseTrigger = function (mouseAction, control, cursor) {
        if (!this._matchWindowTask) {
            this._logger.verbose("addMouseTrigger: No screen shot - ignoring event");
            return;
        }

        var sb = this._matchWindowTask.getLastScreenShotBounds();
        cursor.x += control.left;
        cursor.y += control.top;
        if (!GeneralUtils.contains(sb, cursor)) {
            this._logger.verbose("AddMouseTrigger: out of bounds - ignoring mouse event");
            return;
        }

        control = GeneralUtils.intersect(control, sb);
        if (control.width > 0 && control.height > 0) {
            cursor.x -= control.left;
            cursor.y -= control.top;
            control.left -= sb.left;
            control.top -= sb.top;
        } else {
            cursor.x -= sb.left;
            cursor.y -= sb.top;
        }

        var trigger = Triggers.createMouseTrigger(mouseAction, control, cursor);
        this._userInputs.push(trigger);

        this._logger.verbose("AddMouseTrigger: Added", trigger);
    };

    EyesBase.DEFAULT_EYES_SERVER = 'https://eyessdk.applitools.com';
    EyesBase.MatchLevel = Object.freeze(_MatchLevel);
    EyesBase.FailureReport = Object.freeze(_FailureReport);

    module.exports = EyesBase;
}());
