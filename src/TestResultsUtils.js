/*
 ---

 name: TestResultsUtils

 description: collection of utility methods for manipulating test results.

 ---
 */

(function () {
    "use strict";

    var TestResultsUtils = {};

    //noinspection JSLint
    var OK = "ok";
    //noinspection JSLint
    var NOT_OK = "not ok";

    /**
     * Creates a TAP representation of the tests results list.
     *
     * @param {Object[]} testResultsList A list of TestResults objects (returned by the 'eyes.close' method).
     * @param {boolean} markNewAsPassed If true, new tests will be treated as "passed". Default is false.
     * @return {string} A string which is the TAP representation of the results list.
     */
    TestResultsUtils.asTAPString = function (testResultsList, markNewAsPassed) {
        markNewAsPassed = markNewAsPassed || false;
        if (testResultsList.length === 0) {
            return '';
        }

        var tapString = '1..' + testResultsList.length + "\n";
        //noinspection JSLint
        var currentResult, name;
        for (var i = 0; i < testResultsList.length; ++i) {
            currentResult = testResultsList[i];
            var tapIndex = i+1;
            // If we got an object (and not "undefined"), we try to extract the test/app names.
            if (currentResult) {
                name = "Test: '" + currentResult.testName + "', Application: '" + currentResult.appName + "'";
            }
            // If this is not a valid test results object, we treat the test as aborted.
            if (!currentResult || currentResult.isPassed == undefined) {
                tapString += NOT_OK + " " + tapIndex + " - " + name + " - Test aborted.\n";
                continue;
            }
            if (!currentResult.isPassed) { // Test did not pass (might also be a new test).
                if (currentResult.isNew) { // New test
                    var newResult = markNewAsPassed ? OK : NOT_OK;
                    tapString += newResult + " " + tapIndex + " - " + name + " - New test.\n";
                } else { // Failed test.
                    tapString += NOT_OK + " " + tapIndex + " - " + name + " - Test failed.\n";
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

    module.exports = TestResultsUtils;
}());
