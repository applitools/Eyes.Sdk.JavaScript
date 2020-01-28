'use strict';
const {Eyes, Target} = require('../../../index');
const {Builder} = require('selenium-webdriver');
const {sauceUrl, batch} = require('./util/TestSetup');
const appiumUrl = 'http://localhost:4723/wd/hub';
const sauceCaps = {
  browserName: '',
  platformName: 'Android',
  platformVersion: '8.1',
  deviceName: 'Samsung Galaxy S9 WQHD GoogleAPI Emulator',
  deviceOrientation: 'portrait',
  username: process.env.SAUCE_USERNAME,
  accessKey: process.env.SAUCE_ACCESS_KEY,
  app: 'http://appium.s3.amazonaws.com/ContactManager.apk',
};

const caps = {
  browserName: '',
  deviceName: 'Nexus 5',
  platformName: 'Android',
  platformVersion: '8.0',
  app: 'http://appium.s3.amazonaws.com/ContactManager.apk',
};

describe('TestAppiumNative', () => {
  let driver, eyes;

  afterEach(async () => {
    await driver.quit();
    await eyes.abortIfNotClosed()
  });

  it(`Native app on sauce lab`, async () => {
    driver = await new Builder()
      .withCapabilities(sauceCaps)
      .usingServer(sauceUrl)
      .build();
    eyes = new Eyes();
    eyes.setBatch(batch);
    await eyes.open(driver, 'JS test', 'Checking eyes settings in appium tests');
    await eyes.check(
      'Check',
      Target.window()
        .ignore({left:900, top:0, width:540, height:100})
        .fully(),
    );
    await eyes.close()
  });

  it(`Native app on local appium`, async () => {
    driver = await new Builder()
      .withCapabilities(caps)
      .usingServer(appiumUrl)
      .build();
    eyes = new Eyes();
    eyes.setBatch(batch);
    await eyes.open(driver, 'JS test', 'Checking eyes settings in appium tests_local');
    await eyes.check(
      'Check',
      Target.window()
        .ignore({left:900, top:0, width:180, height:100})
        .fully(),
    );
    await eyes.close()
  })
});
