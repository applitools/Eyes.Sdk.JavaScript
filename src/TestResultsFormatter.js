/*
 ---
Description: A utility class for aggregating and formatting test results.

 ---
 */

(function () {
    "use strict";

    //noinspection JSLint
    var OK = "ok";
    //noinspection JSLint
    var NOT_OK = "not ok";

    //noinspection JSLint
    function TestResultsFormatter() {
        this._resultsList = [];
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Adds an additional results object to the currently stored results list.
     *
     * @param {TestResults} results A test results object as returned by a call to  'eyes.close'
     *                      or 'eyes.abortIfNotClosed'.
     * @returns {TestResultsFormatter} The updated 'TestResultsFormatter' instance.
     */
    TestResultsFormatter.prototype.addResults = function (results) {
        // Ignore null/undefined.
        if (results) {
            this._resultsList.push(results);
        }

        return this;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Creates a TAP representation of the tests results list in hierarchic format.
     *
     * @param {boolean} [includeSubTests] If true, steps will be treated as "subtests". Default is true.
     * @param {boolean} [markNewAsPassed] If true, new tests will be treated as "passed". Default is false.
     * @return {string} A string which is the TAP representation of the results list.
     */
    TestResultsFormatter.prototype.asHierarchicTAׁPString = function (includeSubTests, markNewAsPassed) {
        includeSubTests = includeSubTests !== undefined ? includeSubTests: true;
        markNewAsPassed = markNewAsPassed || false;
        if (this._resultsList.length === 0) {
            return '';
        }

        var tapString = '1..' + this._resultsList.length + "\n";
        //noinspection JSLint
        var currentResult, name;
        //noinspection JSLint
        for (var i = 0; i < this._resultsList.length; ++i) {
            currentResult = this._resultsList[i];
            var tapIndex = i+1;

            if (i > 0) {
                tapString += "#\n";
            }

            name = "Test: '" + currentResult.name + "', Application: '" + currentResult.appName + "'";

            if (!currentResult.isPassed) { // Test did not pass (might also be a new test).
                if (currentResult.isNew) { // New test
                    var newResult = markNewAsPassed ? OK : NOT_OK;
                    tapString += newResult + " " + tapIndex + " - " + "[NEW TEST] " + name + "\n";
                } else { // Failed / Aborted test.
                    tapString += NOT_OK + " " + tapIndex + " - ";
                    if (currentResult.isAborted) {
                        tapString += "[ABORTED TEST] " + name + "\n";
                    } else {
                        tapString += "[FAILED TEST] " + name + "\n";
                    }
                    tapString += "#\tMismatches: " + currentResult.mismatches + "\n";
                }
                if (currentResult.isSaved) {
                    tapString += "#\tTest was automatically saved as a baseline.\n";
                }
            } else {
                tapString += OK + " " + tapIndex + " - [PASSED TEST] " + name + "\n";
            }
            var url = currentResult.appUrls && currentResult.appUrls.session ?
                currentResult.appUrls.session : 'No URL (session didn\'t start).';
            tapString += "#\tTest url: " + url +"\n";
            if (includeSubTests) {
                if (currentResult.stepsInfo.length > 0) {
                    tapString += "\t1.." + currentResult.stepsInfo.length + "\n";
                    for (var j = 0; j < currentResult.stepsInfo.length; ++j) {
                        var currentStep = currentResult.stepsInfo[j];
                        tapString += "\t";
                        tapString += currentStep.isDifferent ? NOT_OK : OK;
                        tapString += " '" + currentStep.name + "'" + ", URL: " + currentStep.appUrls.step + "\n";
                    }
                } else {
                    tapString += "\tNo steps exist for this test.\n";
                }
            }
        }

        return tapString;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Creates a TAP representation of the tests results list in which each steps are colored as success/fail.
     *
     * @param {boolean} [markNewAsPassed] If true, new tests will be treated as "passed". Default is false.
     * @return {string} A string which is the TAP representation of the results list.
     */
    TestResultsFormatter.prototype.asFlattenedTAׁPString = function (markNewAsPassed) {
        markNewAsPassed = markNewAsPassed || false;
        if (this._resultsList.length === 0) {
            return '';
        }

        var tapString = '';
        //noinspection JSLint
        var currentResult, name;
        var stepsCounter = 0;

        // We'll add the TAP plan at the beginning, after we calculate the total number of steps.

        //noinspection JSLint
        for (var i = 0; i < this._resultsList.length; ++i) {
            tapString += "#\n";

            currentResult = this._resultsList[i];
            var tapIndex = i+1;

            name = "Test: '" + currentResult.name + "', Application: '" + currentResult.appName + "'";

            if (!currentResult.isPassed) { // Test did not pass (might also be a new test).
                if (currentResult.isNew) { // New test
                    var newResult = markNewAsPassed ? OK : NOT_OK;
                    tapString += "# " + newResult + " " + tapIndex + " - [NEW TEST] " + name + "\n";
                } else { // Failed / Aborted test.
                    tapString += "# " + NOT_OK + " " + tapIndex + " - ";
                    if (currentResult.isAborted) {
                        tapString += "[ABORTED TEST] " + name + "\n";
                    } else {
                        tapString += "[FAILED TEST] " + name + "\n";
                    }
                    tapString += "#\tMismatches: " + currentResult.mismatches + "\n";
                }
                if (currentResult.isSaved) {
                    tapString += "#\tTest was automatically saved as a baseline.\n";
                }
            } else {
                tapString += "# " + OK + " " + tapIndex + " - [PASSED TEST] " + name + "\n";
            }
            var url = currentResult.appUrls && currentResult.appUrls.session ?
                currentResult.appUrls.session : 'No URL (session didn\'t start).';
            tapString += "#\tTest url: " + url +"\n";
            if (currentResult.stepsInfo.length > 0) {
                for (var j = 0; j < currentResult.stepsInfo.length; ++j) {
                    ++stepsCounter;
                    var currentStep = currentResult.stepsInfo[j];
                    tapString += currentStep.isDifferent ? NOT_OK : OK;
                    tapString += " " + stepsCounter + " '" + currentStep.name + "'" + ", URL: "
                        + currentStep.appUrls.step + "\n";
                }
            } else {
                tapString += "#\tNo steps exist for this test.\n";
            }
        }

        if (stepsCounter > 0) {
            tapString = "1.." + stepsCounter + "\n" + tapString;
        }

        return tapString;
    };

    module.exports = TestResultsFormatter;
}());
