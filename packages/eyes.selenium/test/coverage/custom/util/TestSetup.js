'use strict';
const {Builder} = require('selenium-webdriver');
const {Eyes, StitchMode} = require('../../../../index');
const defaultArgs = process.env.HEADLESS === 'true' ? ['headless'] : [];

const SAUCE_SERVER_URL = 'https://ondemand.saucelabs.com:443/wd/hub';

const Browsers = {
    CHROME: {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: defaultArgs,
        },
    },
    FIREFOX: {
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: defaultArgs,
        },
    },
};

const SETUPS = {
    default: {stitchMode: 'CSS', title: ''},
    scroll: {stitchMode: 'SCROLL', title: '_SCROLL'},
};

async function getDriver(browser) {
    let capabilities = Browsers[browser];
    return new Builder().withCapabilities(capabilities).build()
}

function getEyes(stitchMode) {
    let eyes = new Eyes();
    setStitchMode();
    eyes.setBranchName('master');
    return eyes;

    function setStitchMode() {
        stitchMode === 'CSS'
            ? eyes.setStitchMode(StitchMode.CSS)
            : eyes.setStitchMode(StitchMode.SCROLL)
    }
}

function getSetups(...args) {
    return args.length ? args.map(arg => SETUPS[arg]) : [SETUPS.default, SETUPS.scroll]
}

module.exports = {
    getDriver: getDriver,
    getEyes: getEyes,
    getSetups: getSetups,
    sauceUrl: SAUCE_SERVER_URL,
};
