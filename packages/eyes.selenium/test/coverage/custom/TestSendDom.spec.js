'use strict';
const assertImage = () => {
};
const {getDriver, getEyes, batch} = require('./util/TestSetup');
const {By} = require('selenium-webdriver');
const {Target} = require('../../../index');
const appName = 'Test Send Dom';

describe.skip(appName, () => {
    // There is no VG runner in the SDK...
    describe(`TestSendDom_VG`, () => {
        let driver;
        beforeEach(async () => {
            driver = await getDriver('CHROME')
        });

        afterEach(async () => {
            await driver.quit()
        });
        // Need to override method which capturing dom to be able to update the test
        it.skip('TestSendDOM_FullWindow', async () => {
            driver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/');
            let eyes = new Eyes(); // needs to be overridden
            eyes.setBatch(batch);
            eyes.setBranchName('master');
            await eyes.open(driver, 'Test Send DOM', 'Full Window', {
                width: 1024,
                height: 768,
            });
            try {
                await eyes.check('Window', Target.window().fully())
                // here need an assertions
            } finally {
                await eyes.abortIfNotClosed()
            }
        })
    });

    describe(`Test run_VG`, () => {
        let webDriver, eyes;
        beforeEach(async () => {
            webDriver = await getDriver('CHROME');
            eyes = await getEyes();
            eyes.setBatch(batch)
        });

        afterEach(async () => {
            await eyes.abortIfNotClosed();
            await webDriver.quit()
        });

        it(`TestSendDOM_Selector`, async () => {
            await webDriver.get('https://applitools.github.io/demo/TestPages/DomTest/dom_capture.html');
            await eyes.open(webDriver, 'Test Send Dom', `Test Send Dom${setup.title}`, {
                width: 1000,
                height: 700,
            });
            await eyes.check('region', Target.region(By.css('#scroll1')));
            let results = await eyes.close(false);
            await assertImage(results, {
                hasDom: true,
            })
        });
        it(`TestNotSendDOM`, async () => {
            await webDriver.get('https://applitools.com/helloworld');
            await eyes.open(webDriver, 'Test NOT SendDom', `Test NOT SendDom${setup.title}`, {
                width: 1000,
                height: 700,
            });
            await eyes.check('region', Target.window().sendDom(false));
            let results = await eyes.close(false);
            await assertImage(results, {
                hasDom: false,
            })
        });

        let domCases = [
            {
                url: `https://applitools.github.io/demo/TestPages/DomTest/dom_capture.html`,
                title: `TestSendDOM_1`,
            },
            {
                url: `https://applitools.github.io/demo/TestPages/DomTest/dom_capture_2.html`,
                title: `TestSendDOM_2`,
            },
        ];

        domCases.forEach(domCase => {
            it(`${domCase.title}`, async () => {
                await webDriver.get(domCase.url);
                await eyes.open(webDriver, 'Test Send DOM', `${domCase.title}${setup.title}`);
                await eyes.checkWindow();
                let results = await eyes.close(false);
                await assertImage(results, {hasDom: true})
            })
        })
    })
});