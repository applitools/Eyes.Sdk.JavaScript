/*
 ---

 name: EyesBase

 description: Core/Base class for Eyes - to allow code reuse for different SDKs (images, selenium, etc).

 ---
 */

(function () {
    "use strict";

    var ServerConnector = require('./ServerConnector'),
        MatchWindowTask = require('./MatchWindowTask'),
        Triggers = require('./Triggers'),
        Logger = require('./Logger');

    var MatchSettings = require('./MatchSettings'),
        MatchLevel = MatchSettings.MatchLevel,
        ImageMatchSettings = MatchSettings.ImageMatchSettings,
        ExactMatchSettings = MatchSettings.ExactMatchSettings;

    var EyesUtils = require('eyes.utils'),
        GeneralUtils = EyesUtils.GeneralUtils,
        GeometryUtils = EyesUtils.GeometryUtils;

    var _FailureReport = {
        // Failures are reported immediately when they are detected.
        Immediate: 'Immediate',
        // Failures are reported when tests are completed (i.e., when Eyes.close() is called).
        OnClose: 'OnClose'
    };

    /**
     * @param {PromiseFactory} promiseFactory An object which will be used for creating deferreds/promises.
     * @param {String} serverUrl
     * @param {Boolean} isDisabled
     * @constructor
     **/
    function EyesBase(promiseFactory, serverUrl, isDisabled) {
        if (serverUrl) {
            this._promiseFactory = promiseFactory;
            this._logger = new Logger();
            this._serverUrl = serverUrl;
            this._defaultMatchSettings = new ImageMatchSettings(MatchLevel.Strict);
            this._failureReport = EyesBase.FailureReport.OnClose;
            this._userInputs = [];
            this._saveNewTests = true;
            this._saveFailedTests = false;
            this._serverConnector = new ServerConnector(promiseFactory, this._serverUrl, this._logger);
            this._isDisabled = isDisabled;
            this._defaultMatchTimeout = 2000;
            this._agentId = undefined;
            this._os = undefined;
            this._hostingApp = undefined;
            this._baselineName = undefined;
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
     * @param os {String} The host OS.
     */
    EyesBase.prototype.setHostOS = function (os) {
        this._os = os;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The host OS as set by the user.
     */
    EyesBase.prototype.getHostOS = function () {
        return this._os;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @deprecated
     * This function is deprecated, please use {@link setHostOS} instead.
     *
     * Sets the host OS name - overrides the one in the agent string.
     *
     * @param os {String} The host OS.
     */
    EyesBase.prototype.setOs = function (os) {
        this._os = os;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @deprecated
     * This function is deprecated, please use {@link getHostOS} instead.
     *
     * @return {String} The host OS as set by the user.
     */
    EyesBase.prototype.getOs = function () {
        return this._os;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the hosting application - overrides the one in the agent string.
     *
     * @param hostingApp {String} The hosting application.
     */
    EyesBase.prototype.setHostingApp = function (hostingApp) {
        this._hostingApp = hostingApp;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The hosting application as set by the user.
     */
    EyesBase.prototype.getHostingApp = function () {
        return this._hostingApp;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * If specified, determines the baseline to compare with and disables automatic baseline inference.
     *
     * @param baselineName {String} The hosting application.
     */
    EyesBase.prototype.setBaselineName = function (baselineName) {
        this._baselineName = baselineName;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {String} The baseline name, if it was specified.
     */
    EyesBase.prototype.getBaselineName = function () {
        return this._baselineName;
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
        //noinspection JSLint
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
     * @deprecated
     * This function is superseded by {@link setDefaultMatchSettings}.
     *
     * @param {MatchLevel} level The test-wide match level to use when checking application screenshot with the
     *                           expected output.
     */
    EyesBase.prototype.setMatchLevel = function (level) {
        this._defaultMatchSettings.setMatchLevel(level);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @deprecated
     * This function is superseded by {@link getDefaultMatchSettings}
     *
     * @return {MatchLevel} The test-wide match level.
     */
    EyesBase.prototype.getMatchLevel = function () {
        //noinspection JSValidateTypes
        return this._defaultMatchSettings.getMatchLevel();
    };

    /**
     *
     * @param {ImageMatchSettings} defaultMatchSettings The match settings for the session.
     */
    EyesBase.prototype.setDefaultMatchSettings = function (defaultMatchSettings) {
        this._defaultMatchSettings = defaultMatchSettings;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @return {ImageMatchSettings} The match settings for the session.
     */
    EyesBase.prototype.getDefaultMatchSettings = function () {
        return this._defaultMatchSettings;
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
        return this._promiseFactory.makePromise(function (resolve, reject) {
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
                throw new Error(errMsg);
            }

            if (this._isOpen) {
                errMsg = "A test is already running";
                this._logger.log(errMsg);
                this.abortIfNotClosed()
                    .then(function () {
                        this._logger.getLogHandler().close();
                        reject(new Error(errMsg));
                    }.bind(this));

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

        if ((!results.isPassed) || (!results.asExpected)) {
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

        return this._promiseFactory.makePromise(function (resolve, reject) {
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
                throw new Error(errMsg);
            }

            this._isOpen = false;
            if (!this._runningSession) {
                this._logger.log("Close: Server session was not started");
                this._logger.getLogHandler().close();
                resolve({
                    steps: 0,
                    matches: 0,
                    mismatches: 0,
                    missing: 0,
                    exactMatches: 0,
                    strictMatches: 0,
                    contentMatches: 0,
                    layoutMatches: 0,
                    noneMatches: 0,
                    isNew: false,
                    sessionId: null,
                    url: '',
                    isPassed: true,
                    asExpected: true
                });
                return;
            }

            this._logger.verbose('EyesBase.close - calling server connector to end the running session');
            var save = ((this._runningSession.isNewSession && this._saveNewTests) ||
                (!this._runningSession.isNewSession && this._saveFailedTests));
            //noinspection JSUnresolvedFunction
            return this._serverConnector.endSession(this._runningSession, false, save)
                .then(function (results) {
                    this._logger.log('=======================================');
                    this._logger.log('>> EyesBase.close - session ended');
                    results.isNew = this._runningSession.isNewSession;
                    results.sessionId = this._runningSession.sessionId.toString();
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
                }.bind(this), function (err) {
                    this._logger.log(err);
                    reject(err);
                }.bind(this));
        }.bind(this));
    };

    // lastScreenShot - notice it's an object with imageBuffer, width & height properties
    function _getAppData(region, lastScreenShot) {
        var that = this;
        return this._promiseFactory.makePromise(function (resolve, reject) {
            that._logger.verbose('EyesBase.checkWindow - getAppOutput callback is running - getting screen shot');
            var data = {appOutput: {}};
            var parsedImage;
            return that.getScreenShot()
                .then(function (image) {
                    that._logger.verbose('EyesBase.checkWindow - getAppOutput received the screen shot');
                    parsedImage = image;
                    return parsedImage.cropImage(region);
                })
                .then(function () {
                    that._logger.verbose('cropped image returned - packing');
                    return parsedImage.asObject();
                })
                .then(function (imageObj) {
                    that._logger.verbose('image is ready');
                    data.screenShot = imageObj; //TODO: compress deltas
                    data.appOutput.screenShot64 = imageObj.imageBuffer.toString('base64');
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
        ignoreMismatch = ignoreMismatch || false;
        tag = tag || '';
        retryTimeout = retryTimeout || -1;

        return this._promiseFactory.makePromise(function (resolve, reject) {
            this._logger.verbose('EyesBase.checkWindow - running');
            if (this._isDisabled) {
                this._logger.verbose("Eyes checkWindow ignored - disabled");
                resolve();
                return;
            }

            if (!this._isOpen) {
                var errMsg = "checkWindow called with Eyes not open";
                this._logger.log(errMsg);
                throw new Error(errMsg);
            }

            //noinspection JSUnresolvedFunction
            return this.startSession().then(function () {
                this._logger.verbose('EyesBase.checkWindow - session started - creating match window task');
                this._matchWindowTask = new MatchWindowTask(this._promiseFactory, this._serverConnector,
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
                                var error = EyesBase.buildTestError(result, this._sessionStartInfo.scenarioIdOrName,
                                    this._sessionStartInfo.appIdOrName);

                                this._logger.log(error.message);

                                reject(error);
                            }
                        }

                        resolve(result);
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

    //noinspection JSValidateJSDoc
    /**
     * Replaces an actual image in the current running session.
     * @param {number} stepIndex The zero based index of the step in which to replace the actual image.
     * @param {Buffer} screenshot The PNG bytes of the updated screenshot.
     * @param {string|undefined} tag The updated tag for the step.
     * @param {string|undefined} title The updated title for the step.
     * @param {Array|undefined} userInputs The updated userInputs for the step.
     * @return {Promise} A promise which resolves when replacing is done, or rejects on error.
     */
    EyesBase.prototype.replaceWindow = function (stepIndex, screenshot, tag, title, userInputs) {
        tag = tag || '';
        title = title || '';
        userInputs = userInputs || [];

        return this._promiseFactory.makePromise(function (resolve, reject) {
            this._logger.verbose('EyesBase.replaceWindow - running');
            if (this._isDisabled) {
                this._logger.verbose("Eyes replaceWindow ignored - disabled");
                resolve();
                return;
            }

            if (!this._isOpen) {
                var errMsg = "replaceWindow called with Eyes not open";
                this._logger.log(errMsg);
                throw new Error(errMsg);
            }

            this._logger.verbose("EyesBase.replaceWindow - calling serverConnector.replaceWindow");
            var screenshot64 = screenshot.toString('base64');
            var replaceWindowData = {
                userInputs: userInputs,
                tag: tag,
                appOutput: {
                    title: title,
                    screenshot64: screenshot64
                }
            };
            return this._serverConnector.replaceWindow(this._runningSession, stepIndex, replaceWindowData, screenshot)
                .then(function () {
                    this._logger.verbose("EyesBase.replaceWindow done");
                    resolve();
                }.bind(this), function (err) {
                    this._logger.log(err);
                    reject(err);
                }.bind(this));
        }.bind(this));
    };

    EyesBase.prototype.startSession = function () {
        return this._promiseFactory.makePromise(function (resolve, reject) {

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

                // getInferredEnvironment is implemented in the wrapping SDK.
                //noinspection JSUnresolvedFunction
                return this.getInferredEnvironment().then(function (userAgent) {
                    var appEnv = {
                        os: this._os || null,
                        hostingApp: this._hostingApp|| null,
                        displaySize: this._viewportSize,
                        inferred: userAgent
                    };

                    var exactObj = this._defaultMatchSettings.getExact();
                    var exact = null;
                    if (exactObj) {
                        exact = {
                            minDiffIntensity: exactObj.getMinDiffIntensity(),
                            minDiffWidth: exactObj.getMinDiffWidth(),
                            minDiffHeight: exactObj.getMinDiffHeight(),
                            matchThreshold: exactObj.getMatchThreshold()
                        };
                    }
                    var defaultMatchSettings = {
                        matchLevel: this._defaultMatchSettings.getMatchLevel(),
                        exact: exact
                    };
                    this._sessionStartInfo = {
                        agentId: this._getFullAgentId(),
                        appIdOrName: this._appName,
                        scenarioIdOrName: this._testName,
                        batchInfo: testBatch,
                        envName: this._baselineName,
                        environment: appEnv,
                        defaultMatchSettings: defaultMatchSettings,
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
        return this._promiseFactory.makePromise(function (resolve, reject) {
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

            //noinspection JSUnresolvedFunction
            return this._serverConnector.endSession(this._runningSession, true, false).then(function () {
                this._runningSession = undefined;
                this._logger.getLogHandler().close();
                resolve();
            }.bind(this))
                .thenCatch(function (err) {
                    this._logger.log(err);
                    reject();
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
            control = GeometryUtils.intersect(control, sb);
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
        if (!GeometryUtils.contains(sb, cursor)) {
            this._logger.verbose("AddMouseTrigger: out of bounds - ignoring mouse event");
            return;
        }

        control = GeometryUtils.intersect(control, sb);
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
    EyesBase.FailureReport = Object.freeze(_FailureReport);

    module.exports = EyesBase;
}());
