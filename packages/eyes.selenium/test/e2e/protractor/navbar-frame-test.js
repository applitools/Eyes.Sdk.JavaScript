var SeleniumSDK = require('../../../index');
var Eyes = SeleniumSDK.Eyes;
var ConsoleLogHandler = SeleniumSDK.ConsoleLogHandler;
var Target = SeleniumSDK.Target;

var eyes;

describe("Eyes.Selenium.JavaScript - Protractor", function() {

    beforeAll(function(){
        eyes = new Eyes();
        eyes.setApiKey(process.env.APPLITOOLS_API_KEY);
        eyes.setLogHandler(new ConsoleLogHandler(true));
        eyes.getLogHandler().setPrintSessionId(true);
    });

    beforeEach(function(done){
        eyes.open(browser, global.appName, global.testName, {width: 800, height: 560}).then(function () {
            done();
        });
    });

    it("test frame with navbar protractor", function(done) {
        browser.get("https://astappiev.github.io/test-html-pages/navbar-frame.html");

        browser.switchTo().frame(element(by.name('mainpage')).getWebElement());
        // do something here
        browser.switchTo().defaultContent();

        eyes.check("Entire window", Target.frame(by.name('mainpage')).fully());

        eyes.close().then(function () {
            done();
        });
    });

    afterEach(function(done) {
        eyes.abortIfNotClosed().then(function () {
            done();
        });
    });
});
