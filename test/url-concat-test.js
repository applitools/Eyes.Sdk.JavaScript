import test from 'ava';
import GeneralUtils from '../src/GeneralUtils';

test('GeneralUtils #urlConcat()', t => {
    const leftWithoutSlash = "http://www.applitools.com", rightWithSlash = "/subdomain/index.html",
        leftWithSlash = "http://www.applitools.com/", rightWithoutSlash = "subdomain/index.html";

    t.is(GeneralUtils.urlConcat('', ''), "/",
        'should return / when the values are empty');

    t.is(GeneralUtils.urlConcat(leftWithoutSlash, rightWithoutSlash), leftWithoutSlash + "/" + rightWithoutSlash,
        'should return the correct Url when both parts don\'t start/end with a "/"');

    t.is(GeneralUtils.urlConcat(leftWithSlash, rightWithoutSlash), leftWithSlash + rightWithoutSlash,
        'should return the correct Url when only left part ends with a "/"');

    t.is(GeneralUtils.urlConcat(leftWithoutSlash, rightWithSlash), leftWithoutSlash + rightWithSlash,
        'should return the correct Url when only right part starts with a "/"');

    t.is(GeneralUtils.urlConcat(leftWithoutSlash + "/", rightWithSlash), leftWithoutSlash + rightWithSlash,
        'should return the correct Url when both parts start/end with a "/"');
});
