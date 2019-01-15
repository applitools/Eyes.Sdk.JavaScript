var assert = require("assert");

var GeneralUtils = require("../index").GeneralUtils;

describe('GeneralUtils', function(){
    describe('#urlConcat()', function(){
        it('should return / when the values are empty', function() {
            assert.equal(GeneralUtils.urlConcat('', ''), "/");
        });
        it('should return the correct Url when both parts don\'t start/end with a "/"', function () {
            var left = "http://www.applitools.com",
                right = "subdomain/index.html";
            assert.equal(GeneralUtils.urlConcat(left, right), left + "/" + right);
        });
        it('should return the correct Url when only left part ends with a "/"', function () {
            var left = "http://www.applitools.com/",
                right = "subdomain/index.html";
            assert.equal(GeneralUtils.urlConcat(left, right), left + right);
        });
        it('should return the correct Url when only right part starts with a "/"', function () {
            var left = "http://www.applitools.com",
                right = "/subdomain/index.html";
            assert.equal(GeneralUtils.urlConcat(left, right), left + right);
        });
        it('should return the correct Url when both parts start/end with a "/"', function () {
            var left = "http://www.applitools.com",
                right = "/subdomain/index.html";
            assert.equal(GeneralUtils.urlConcat(left + "/", right), left + right);
        });
    });
});
