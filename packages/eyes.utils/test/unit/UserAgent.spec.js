'use strict';

const assert = require('assert');

const { UserAgent } = require('../../index');

describe('UserAgent', () => {
  describe('#parseUserAgentString()', () => {
    it('should return Chrome as browser, Windows as OS', () => {
      const uaString = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Windows');
      assert.strictEqual(userAgent.getOSMajorVersion(), '10');
      assert.strictEqual(userAgent.getOSMinorVersion(), '0');
      assert.strictEqual(userAgent.getBrowser(), 'Chrome');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '60');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '0');
    });

    it('should return Firefox as browser, Windows as OS', () => {
      const uaString = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Windows');
      assert.strictEqual(userAgent.getOSMajorVersion(), '10');
      assert.strictEqual(userAgent.getOSMinorVersion(), '0');
      assert.strictEqual(userAgent.getBrowser(), 'Firefox');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '54');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '0');
    });

    it('should return Chrome as browser, Android as OS', () => {
      const uaString = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Mobile Safari/537.36';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Android');
      assert.strictEqual(userAgent.getOSMajorVersion(), '6');
      assert.strictEqual(userAgent.getOSMinorVersion(), '0');
      assert.strictEqual(userAgent.getBrowser(), 'Chrome');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '60');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '0');
    });

    it('should return Safari as browser, IOS as OS', () => {
      const uaString = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'IOS');
      assert.strictEqual(userAgent.getOSMajorVersion(), '10');
      assert.strictEqual(userAgent.getOSMinorVersion(), '3');
      assert.strictEqual(userAgent.getBrowser(), 'Safari');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '602');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '1');
    });

    it('should return Chrome as browser, Linux as OS', () => {
      const uaString = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36 OPR/38.0.2220.41';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Linux');
      assert.strictEqual(userAgent.getOSMajorVersion(), undefined);
      assert.strictEqual(userAgent.getOSMinorVersion(), undefined);
      assert.strictEqual(userAgent.getBrowser(), 'Chrome');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '51');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '0');
    });

    it('should return Edge as browser, Windows as OS', () => {
      const uaString = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Windows');
      assert.strictEqual(userAgent.getOSMajorVersion(), '10');
      assert.strictEqual(userAgent.getOSMinorVersion(), '0');
      assert.strictEqual(userAgent.getBrowser(), 'Edge');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '12');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '10136');
    });

    it('should return IE as browser, Windows as OS', () => {
      const uaString = 'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Windows');
      assert.strictEqual(userAgent.getOSMajorVersion(), undefined);
      assert.strictEqual(userAgent.getOSMinorVersion(), undefined);
      assert.strictEqual(userAgent.getBrowser(), 'IE');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '9');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '0');
    });

    it('should return Unknown as browser, Unknown as OS', () => {
      const uaString = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Unknown');
      assert.strictEqual(userAgent.getOSMajorVersion(), undefined);
      assert.strictEqual(userAgent.getOSMinorVersion(), undefined);
      assert.strictEqual(userAgent.getBrowser(), 'Unknown');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), undefined);
      assert.strictEqual(userAgent.getBrowserMinorVersion(), undefined);
    });

    it('should return Safari as browser, Mac OS X as OS', () => {
      const uaString = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0.1 Safari/604.3.5';
      const userAgent = UserAgent.parseUserAgentString(uaString, true);
      assert.strictEqual(userAgent.getOS(), 'Macintosh');
      assert.strictEqual(userAgent.getOSMajorVersion(), '10');
      assert.strictEqual(userAgent.getOSMinorVersion(), '13');
      assert.strictEqual(userAgent.getBrowser(), 'Safari');
      assert.strictEqual(userAgent.getBrowserMajorVersion(), '11');
      assert.strictEqual(userAgent.getBrowserMinorVersion(), '0');
    });
  });
});
