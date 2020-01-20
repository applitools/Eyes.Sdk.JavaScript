'use strict';
const {By} = require('selenium-webdriver');
const {getDriver, getEyes, getSetups} = require('./util/TestSetup');
const {Target} = require('../../../index');
const appName = 'Eyes Selenium SDK - Fluent API';
describe(appName, () => {
    let setups = getSetups();
    // let batch = new BatchInfo('JS test')
    setups.forEach(setup => {
        describe(`Test run ${setup.title}`, () => {
            let webDriver, eyes;
            beforeEach(async () => {
                webDriver = await getDriver('CHROME');
                await webDriver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/');
                eyes = await getEyes(setup.stitchMode)
                // eyes.setBatch(batch)
            });

            afterEach(async () => {
                await eyes.abortIfNotClosed();
                await webDriver.quit()
            });

            it('TestCheckScrollableModal', async () => {
                let driver = await eyes.open(webDriver, appName, `TestCheckScrollableModal${setup.title}`, {
                    width: 700,
                    height: 460,
                });
                driver.findElement(By.id('centered')).click();
                // let scrollRootLocator = setup.stitchMode === 'CSS' ? 'modal-content' : 'modal1';
                // let scrollRootSelector = By.id(scrollRootLocator);
                await eyes.check(
                    'TestCheckScrollableModal',
                    Target.region(By.id('modal-content'))
                        .fully()
                        // .scrollRootElement(scrollRootSelector),
                );
                await eyes.close()
            });

            let longIframes = [
                {
                    clickableId: 'hidden_click',
                    IframeSelector: '#modal3 iframe',
                    title: 'TestCheckLongOutOfBoundsIFrameModal',
                },
                {
                    clickableId: 'stretched',
                    IframeSelector: '#modal2 iframe',
                    title: 'TestCheckLongIFrameModal',
                },
            ];
            longIframes.forEach(settings => {
                it.only(`${settings.title}`, async () => {
                    let driver = await eyes.open(webDriver, appName, `${settings.title}${setup.title}`, {
                        width: 700,
                        height: 460,
                    });
                    await driver.findElement(By.id(settings.clickableId)).click();
                    let frame = await driver.findElement(By.css(settings.IframeSelector));
                    await driver.switchTo().frame(frame);
                    let element = await driver.findElement(By.css('html'));
                    let rect = await element.getRect();
                    await performChecksOnLongRegion(rect);
                    await eyes.close();
                })
            });

            async function performChecksOnLongRegion(rect) {
                for (let currentY = rect.y, c = 1; currentY < rect.y + rect.height; currentY += 5000, c++) {
                    let region;
                    if (rect.height > currentY + 5000) {
                        region = {left:rect.x, top:currentY, width:rect.width, height:5000}
                    } else {
                        region = {left:rect.x, top:currentY, width:rect.width, height:rect.height - currentY}
                    }
                    await eyes.check('Check Long Out of bounds Iframe Modal', Target.region(region))
                }
            }
        })
    })
});