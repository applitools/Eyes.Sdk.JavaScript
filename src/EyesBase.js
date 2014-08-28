/*
 ---

 name: EyesBase

 description: Core/Base class for Eyes - to allow code reuse for different SDKs (images, selenium, etc).

 provides: [EyesBase]
 requires: [ServerConnector, MatchWindowTask, GeneralUtils, EyesPromiseFactory]

 ---
 */

;(function() {
    "use strict";

    var ServerConnector = require('./ServerConnector'),
        MatchWindowTask = require('./MatchWindowTask'),
        GeneralUtils = require('./GeneralUtils'),
        PromiseFactory = require('./EyesPromiseFactory'),
        ImageUtils = require('./ImageUtils');

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

    var _FailureReports = {
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
            this._serverUrl = serverUrl;
            this._matchLevel = EyesBase.MatchLevel.Strict;
            this._failureReports = EyesBase.FailureReports.OnClose;
            this._userInputs = [];
            this._saveNewTests = true;
            this._saveFailedTests = false;
            this._serverConnector = new ServerConnector(this._serverUrl);
            this._isDisabled = isDisabled;
            this._defaultMatchTimeout = 2000;
            this._agentId = undefined;
        }
    }

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
            throw Error("_getBaseAgentId not implemented!");
        }
        var agentId = this.getAgentId();
        if (!agentId) {
            //noinspection JSUnresolvedFunction
            return this._getBaseAgentId();
        }
        //noinspection JSUnresolvedFunction
        return agentId + " [" + this._getBaseAgentId() + "]";
    };

    /**
     * Sets the host OS name - overrides the one in the agent string.
     *
     * @param hostOS {String} The host OS.
     */
    EyesBase.prototype.setHostOS = function (hostOS) {
        this._hostOS = hostOS;
    };

    /**
     * @return {String} The host OS as set by the user.
     */
    EyesBase.prototype.getHostOS = function () {
        return this._hostOS;
    };

    /**
     * Sets the test batch
     *
     * @param name {String}.
     * @param id {String}.
     * @param startedAt {String}.
     */
    EyesBase.prototype.setBatch = function (name, id, startedAt) {
        this._batch = {
            id: id || GeneralUtils.guid(),
            name: name,
            startedAt: startedAt || new Date().toUTCString()};
    };

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
        console.log('new test should be saved?', shouldSave);
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
    EyesBase.prototype.setSaveFailedTests = function(shouldSave) {
        console.log('failed test should be saved?', shouldSave);
        this._saveFailedTests = shouldSave;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {boolean} True if failed tests are saved by default.
     */
    EyesBase.prototype.getSaveFailedTests = function() {
        return this._saveFailedTests;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the maximal time a match operation tries to perform a match.
     * @param {number} timeout Timeout in milliseconds.
     */
    EyesBase.prototype.setDefaultMatchTimeout = function(timeout) {
        console.log('setting default match timeout to:', timeout);
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
     * @param mode Use one of the values in EyesBase.FailureReports.
     */
    EyesBase.prototype.setFailureReports = function(mode) {
        switch (mode) {
            case EyesBase.FailureReports.OnClose:
                this._failureReports = EyesBase.FailureReports.OnClose;
                break;
            case EyesBase.FailureReports.Immediate:
                this._failureReports = EyesBase.FailureReports.Immediate;
                break;
            default:
                console.warn('wrong parameter value for failure reports - defaulting to onClose', mode);
                this._failureReports = EyesBase.FailureReports.OnClose;
                break;
        }
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @return {EyesBase.FailureReports} The currently set FailureReports.
     */
    EyesBase.prototype.getFailureReports = function () {
        return this._failureReports;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * The test-wide match level to use when checking application screenshot with the expected output.
     * @param {EyesBase.MatchLevel} level The match level setting.
     */
    EyesBase.prototype.setMatchLevel = function(level) {
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
                console.warn('wrong parameter value for match level - defaulting to strict', level);
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

    EyesBase.prototype.open = function (appName, testName, viewportSize) {
        return PromiseFactory.makePromise(function (resolve, reject) {
            console.log('EyesBase.open is running');
            if (this._isDisabled) {
                console.log("Eyes Open ignored - disabled");
                resolve();
                return;
            }

            var errMsg;
            if (!this._serverConnector.getApiKey()) {
                errMsg = 'API key is missing! Please set it via Eyes.setApiKey';
                console.log(errMsg);
                reject(Error(errMsg));
                return;
            }

            if (this._isOpen) {
                this.abortIfNotClosed();
                errMsg = "A test is already running";
                console.log(errMsg);
                reject(Error(errMsg));
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

    EyesBase.prototype.close = function (throwEx) {
        //TODO: try catch + exception
        return PromiseFactory.makePromise(function (resolve, reject) {
            console.log('EyesBase.close is running');
            if (this._isDisabled) {
                console.log("Eyes Close ignored - disabled");
                resolve();
                return;
            }

            if (!this._isOpen) {
                var errMsg = "close called with Eyes not open";
                console.log(errMsg);
                reject(Error(errMsg));
                return;
            }

            this._isOpen = false;
            if (!this._runningSession) {
                console.log("Close: Server session was not started");
                resolve();
                return;
            }

            console.log('EyesBase.close - calling server connector to end the running session');
            var save = ((this._runningSession.isNewSession && this._saveNewTests) ||
                (!this._runningSession.isNewSession && this._saveFailedTests));
            this._serverConnector.endSession(this._runningSession, false, save)
                .then(function (results) {
                    console.log('EyesBase.close - session ended');
                    results.isNew = this._runningSession.isNewSession;
                    results.url = this._runningSession.sessionUrl;
                    this._runningSession = undefined;
                    console.log('close:', results);

                    var message;
                    if (results.isNew) {
                        var instructions = "Please approve the new baseline at " + results.url;
                        console.log('--- New test ended.', instructions);

                        if (throwEx) {
                            message = "'" + this._sessionStartInfo.scenarioIdOrName
                                + "' of '" + this._sessionStartInfo.appIdOrName
                                + "'. " + instructions;
                            throw {results: results, message: message};
                        }
                    } else if (results.mismatches > 0 || results.missing > 0) {
                        console.log("--- Failed test ended. See details at " + results.url);

                        if (throwEx) {
                            message = "'" + this._sessionStartInfo.scenarioIdOrName
                                + "' of '" + this._sessionStartInfo.appIdOrName
                                + "'. See details at " + results.url;

                            throw {results: results, message: message};
                        }
                    }
                    resolve(results);
                }.bind(this));
        }.bind(this));
    };

    EyesBase.prototype.checkWindow = function(tag, ignoreMismatch, retryTimeout, region) {
        tag = tag || '';
        retryTimeout = retryTimeout || -1;

        return PromiseFactory.makePromise(function (resolve, reject) {
            console.log('EyesBase.checkWindow - running');
            if (this._isDisabled) {
                console.log("Eyes checkWindow ignored - disabled");
                resolve();
                return;
            }

            if (!this._isOpen)
            {
                var errMsg = "checkWindow called with Eyes not open";
                console.log(errMsg);
                reject(Error(errMsg));
                return;
            }

            this.startSession().then(function() {
                console.log('EyesBase.checkWindow - session started - creating match window task');
                this._matchWindowTask = new MatchWindowTask(this._serverConnector,
                    this._runningSession, this._defaultMatchTimeout, _getAppData.bind(this), this._waitTimeout.bind(this));

                console.log("EyesBase.checkWindow - calling matchWindowTask.matchWindow");
                this._matchWindowTask.matchWindow(this._userInputs, region, tag, this._shouldMatchWindowRunOnceOnTimeout,
                    ignoreMismatch, retryTimeout).then(function(result) {
                        console.log("EyesBase.checkWindow - match window returned result:", result);
                        if (!ignoreMismatch)
                        {
                            this._userInputs = [];
                        }

                        if (!result.asExpected)
                        {
                            console.log("EyesBase.checkWindow - match window result was not success");
                            this._shouldMatchWindowRunOnceOnTimeout = true;

                            if (this._failureReports === EyesBase.FailureReports.Immediate)
                            {
                                reject(Error("Mismatch found in '" + this._sessionStartInfo.scenarioIdOrName + "' of '" +
                                    this._sessionStartInfo.appIdOrName + "'"));
                            }
                        }

                        resolve(result);
                    }.bind(this), function (err) {
                        console.error('Could not perform window check:', err);
                        reject(Error(err));
                    });
            }.bind(this));
        }.bind(this));
    };

    function _getAppData(region, lastScreenshot) {
        return PromiseFactory.makePromise(function (resolve, reject) {
            console.log('EyesBase.checkWindow - getAppOutput callback is running - getting screenshot');
            this.getScreenshot().then(function (image) {
                console.log('EyesBase.checkWindow - getAppOutput received the screenshot');
                ImageUtils.crop(image, region).then(function(croppedImage){
                    console.log('cropped image returned - continuing');
                    var data = {appOutput: {}};
                    data.screenShot = croppedImage;
                    data.appOutput.screenshot64 = croppedImage.toString('base64'); //TODO: compress deltas

                    console.log('EyesBase.checkWindow - getAppOutput getting title');
                    this.getTitle().then(function (title) {
                        console.log('EyesBase.checkWindow - getAppOutput received the title');
                        data.appOutput.title = title;
                        resolve(data);
                    }.bind(this));
                }.bind(this), function(err) {
                    reject(Error(err));
                });
            }.bind(this));
        }.bind(this));
    }

    EyesBase.prototype.startSession = function () {
        return PromiseFactory.makePromise(function (resolve, reject) {

            if (this._runningSession) {
                resolve();
                return;
            }

            var promise;
            if (!this._viewportSize)
            {
                promise = this.getViewportSize();
            }
            else
            {
                promise = this.setViewportSize(this._viewportSize);
            }

            promise.then(function (result) {
                this._viewportSize = this._viewportSize || result;
                var testBatch = this._batch; //TODO: allow to set batch somewhere
                if (!testBatch)
                {
                    testBatch = {id: GeneralUtils.guid(), name: null, startedAt: new Date().toUTCString()};
                }

                testBatch.toString = function () {
                    return this.name + " [" + this.id + "]" + " - " + this.startedAt;
                };

                this.getInferredEnvironment().then(function(userAgent) {
                    var appEnv = {
                        os: this._hostOS || null,
                        hostingApp: this._appName || null,
                        displaySize: this._viewportSize,
                        inferred: userAgent};

                    this._sessionStartInfo = {
                        agentId: this._getFullAgentId(),
                        appIdOrName: this._appName,
                        scenarioIdOrName: this._testName,
                        batchInfo: testBatch,
                        environment: appEnv,
                        matchLevel: this._matchLevel,
                        branchName: null, // TODO: this._branchName,
                        parentBranchName: null // TODO: this._parentBranchName
                    };

                    this._serverConnector.startSession(this._sessionStartInfo).then(function (result) {
                            this._runningSession = result;
                            this._shouldMatchWindowRunOnceOnTimeout = result.isNewSession;
                            resolve();
                        }.bind(this),
                        function(err) {
                            console.error(err);
                            reject(Error());
                        }.bind(this)
                    );
                }.bind(this), function(err) {
                    console.error(err);
                    reject(Error(err));
                });
            }.bind(this), function (err) {
                console.error(err);
                reject(Error(err));
            }.bind(this));

        }.bind(this));

    };

    EyesBase.prototype.abortIfNotClosed = function () {
        return PromiseFactory.makePromise(function (resolve, reject) {
            if (this._isDisabled) {
                console.log("Eyes abortIfNotClosed ignored - disabled");
                resolve();
                return;
            }

            this._isOpen = false;
            this._matchWindowTask = undefined;

            if (!this._runningSession) {
                resolve();
                return;
            }

            this._serverConnector.endSession(this._runningSession, true, false).then(function () {
                this._runningSession = undefined;
                resolve();
            }.bind(this));
        }.bind(this));
    };

    EyesBase.DEFAULT_EYES_SERVER = 'https://eyessdk.applitools.com';
    EyesBase.MatchLevel = Object.freeze(_MatchLevel);
    EyesBase.FailureReports = Object.freeze(_FailureReports);

    module.exports = EyesBase;
}());
