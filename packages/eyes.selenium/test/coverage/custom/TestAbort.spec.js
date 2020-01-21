'use strict';
const {getDriver, getEyes, getSetups} = require('./util/TestSetup');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const {
    Target,
    GeneralUtils
} = require('../../../index');
const appName = 'My application';
const testedUrl = 'https://applitools.com/docs/topics/overview.html';
const testName = `test URL : ${testedUrl}`;
const batch = {id: GeneralUtils.guid(), name: 'JS Selenium 3 SDK', startedAt: new Date().toUTCString()};
describe(appName, () => {
    let setups = getSetups();
    setups.forEach(setup => {
        describe(`TestAbort${setup.title}`, () => {
            let webDriver, eyes;

            beforeEach(async () => {
                eyes = await getEyes(setup.stitchMode);
                eyes.setBatch(batch);
                webDriver = await getDriver('CHROME');
            });

            afterEach(async () => {
                if (eyes.getIsOpen()) {
                    await eyes.close(false)
                } else {
                    await eyes.abort()
                }
                await webDriver.quit()
            });

            it(`Test_ThrowBeforeOpen`, async () => {
                expect(Test_ThrowBeforeOpen).to.throw('Before Open');

                function Test_ThrowBeforeOpen() {
                    throw new Error('Before Open')
                }
            });

            it(`Test_ThrowAfterOpen`, async () => {
                await expect(Test_ThrowAfterOpen()).to.be.rejectedWith(Error, 'After Open');

                async function Test_ThrowAfterOpen() {
                    await eyes.open(webDriver, appName, testName);
                    throw new Error('After Open')
                }
            });

            it(`Test_ThrowDuringCheck`, async () => {
                await expect(Test_ThrowDuringCheck()).to.be.rejectedWith(Error);

                async function Test_ThrowDuringCheck() {
                    let driver = await eyes.open(webDriver, appName, testName);
                    await driver.get(testedUrl);
                    await eyes.check(`Step 1 Content - ${testedUrl}`, Target.frame('non-existing frame'))
                }
            });

            it(`Test_ThrowAfterCheck`, async () => {
                await expect(Test_ThrowAfterCheck()).to.be.rejectedWith(Error, 'After Check');

                async function Test_ThrowAfterCheck() {
                    let driver = await eyes.open(webDriver, appName, testName);
                    await driver.get(testedUrl);
                    await eyes.check(`Step 1 Content - ${testedUrl}`, Target.window());
                    throw new Error('After Check')
                }
            })
        })
    })
});