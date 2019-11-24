var { Builder } = require('selenium-webdriver');
var { Eyes, ConsoleLogHandler } = require('../../../index');

var driver = null, eyes = null;
describe('Eyes.Selenium.JavaScript - Android Native Appium', function () {
  this.timeout(5 * 60 * 1000);

  before(function () {
    driver = new Builder()
      .withCapabilities({
        'app': 'bs://828136042405247c5bd09fad8f8002763dee98ab',
        'os_version': '6.0',
        'device': 'Google Nexus 6',
        'real_mobile': 'true',
        'browserstack.local': 'false',
        'browserName': 'Android',
        'clearSystemFiles': 'true',
        'noReset': 'true',

        'browserstack.user': process.env.BROWSERSTACK_USERNAME,
        'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY
      })
      .usingServer('https://hub-cloud.browserstack.com/wd/hub')
      .build();

    eyes = new Eyes();
    eyes.setApiKey(process.env.APPLITOOLS_API_KEY);
    eyes.setLogHandler(new ConsoleLogHandler(true));
  });

  beforeEach(function () {
    var appName = this.test.parent.title;
    var testName = this.currentTest.title;

    return eyes.open(driver, appName, testName).then(function (browser) {
      driver = browser;
    });
  });

  it('check window base', function () {
    eyes.checkWindow("Entire window");

    return eyes.close();
  });

  afterEach(function () {
    return driver.quit().then(function () {
      return eyes.abort();
    });
  });
});
