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
     * Creates a TAP representation of the tests results list.
     *
     * @param {boolean} markNewAsPassed If true, new tests will be treated as "passed". Default is false.
     * @return {string} A string which is the TAP representation of the results list.
     */
    TestResultsFormatter.prototype.asTAPString = function (markNewAsPassed) {
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

            name = "Test: '" + currentResult.testName + "', Application: '" + currentResult.appName + "'";

            if (!currentResult.isPassed) { // Test did not pass (might also be a new test).
                if (currentResult.isNew) { // New test
                    var newResult = markNewAsPassed ? OK : NOT_OK;
                    tapString += newResult + " " + tapIndex + " - " + name + " - New test.\n";
                } else { // Failed / Aborted test.
                    tapString += NOT_OK + " " + tapIndex + " - " + name;
                    if (currentResult.isAborted) {
                        tapString += " - Test aborted.\n";
                    } else {
                        tapString += " - Test failed.\n";
                    }
                    tapString += "\tMismatches: " + currentResult.mismatches + "\n";
                }
                if (currentResult.isSaved) {
                    tapString += "\tTest was automatically saved as a baseline.\n";
                }
            } else {
                tapString += OK + " " + tapIndex + " - " + name + " - Test passed.\n";
            }
            tapString += "\tTest url: " + currentResult.url +"\n";
        }

        return tapString;
    };

    module.exports = TestResultsFormatter;
}());
