/*
 ---

 name: GeometryUtils

 description: collection of utility methods for geometric shapes.

 ---
 */

(function () {
    "use strict";

    var ArgumentGuard = require('./ArgumentGuard');

    var GeometryUtils = {};

    /**
     * Crate new simple region object from values
     *
     * @param {number} left
     * @param {number} top
     * @param {number} width
     * @param {number} height
     * @returns {{left: number, top: number, width: number, height: number}} New region object
     */
    GeometryUtils.createRegion = function(left, top, width, height) {
        return {
            left: Math.ceil(left) || 0,
            top: Math.ceil(top) || 0,
            width: Math.ceil(width) || 0,
            height: Math.ceil(height) || 0
        };
    };

    /**
     * Check if the given object contains all region's attributes
     *
     * @param {Object} object
     * @return {boolean} true if the object has all region's attributes, false otherwise.
     */
    GeometryUtils.isRegion = function(object) {
        return object instanceof Object && "left" in object && "top" in object && "width" in object && "height" in object;
    };

    /**
     * Crate new simple region object from location and size objects
     *
     * @param {{x: number, y: number}} location
     * @param {{width: number, height: number}} size
     * @returns {{left: number, top: number, width: number, height: number}} New region object
     */
    GeometryUtils.createRegionFromLocationAndSize = function(location, size) {
        return GeometryUtils.createRegion(location.x, location.y, size.width, size.height);
    };

    /**
     * Crate new simple region object from location and size objects
     *
     * @param {{left: number, top: number, width: number, height: number}} region
     * @return {boolean} true if the region is empty, false otherwise.
     */
    GeometryUtils.isRegionEmpty = function(region) {
        return region.left === 0 && region.top === 0 && region.width === 0 && region.height === 0;
    };

    /**
     * Crete new simple location object from values
     *
     * @param {number} left (x)
     * @param {number} top (y)
     * @returns {{x: number, y: number}} New location object
     */
    GeometryUtils.createLocation = function(left, top) {
        return {
            x: Math.ceil(left) || 0,
            y: Math.ceil(top) || 0
        };
    };

    /**
     * Check if the given object contains all location's attributes
     *
     * @param {Object} object
     * @return {boolean} true if the object has all location's attributes, false otherwise.
     */
    GeometryUtils.isLocation = function(object) {
        return object instanceof Object && "x" in object && "y" in object;
    };

    /**
     * Crete new simple location object from region
     *
     * @param {{left: number, top: number, width: number, height: number}} region
     * @returns {{x: number, y: number}} New location object
     */
    GeometryUtils.createLocationFromRegion = function(region) {
        return GeometryUtils.createLocation(region.left, region.top);
    };

    /**
     * Crete new simple location object from location
     *
     * @param {{x: number, y: number}} location
     * @returns {{x: number, y: number}} New location object
     */
    GeometryUtils.createLocationFromLocation = function(location) {
        return GeometryUtils.createLocation(location.x, location.y);
    };

    /**
     * Crete new simple size object from values
     *
     * @param {number} width
     * @param {number} height
     * @returns {{width: number, height: number}} New size object
     */
    GeometryUtils.createSize = function(width, height) {
        return {
            width: Math.ceil(width) || 0,
            height: Math.ceil(height) || 0
        };
    };

    /**
     * Check if the given object contains all size's attributes
     *
     * @param {Object} object
     * @return {boolean} true if the object has all size's attributes, false otherwise.
     */
    GeometryUtils.isSize = function(object) {
        return object instanceof Object && "width" in object && "height" in object;
    };

    /**
     * Get a scaled location.
     *
     * @param {{x: number, y: number}} location
     * @param {number} scaleRatio The ratio by which to scale the results.
     * @returns {{x: number, y: number}} A scaled copy of the current location.
     */
    GeometryUtils.scaleLocation = function(location, scaleRatio) {
        return {
            x: Math.ceil(location.x * scaleRatio),
            y: Math.ceil(location.y * scaleRatio)
        };
    };

    /**
     * Get a scaled version of the current size.
     *
     * @param {{width: number, height: number}} size
     * @param {number} scaleRatio The ratio by which to scale the results.
     * @returns {{width: number, height: number}} A scaled version of the current size.
     */
    GeometryUtils.scaleSize = function(size, scaleRatio) {
        return {
            width: Math.ceil(size.width * scaleRatio),
            height: Math.ceil(size.height * scaleRatio)
        };
    };

    /**
     * Get a region which is a scaled version of the current region.
     * IMPORTANT: This also scales the LOCATION(!!) of the region (not just its size).
     *
     * @param {{left: number, top: number, width: number, height: number}} region
     * @param {number} scaleRatio The ratio by which to scale the results.
     * @returns {{left: number, top: number, width: number, height: number}} A new region which is a scaled version of the current region.
     */
    GeometryUtils.scaleRegion = function(region, scaleRatio) {
        return {
            width: Math.ceil(region.width * scaleRatio),
            height: Math.ceil(region.height * scaleRatio),
            top: Math.ceil(region.top * scaleRatio),
            left: Math.ceil(region.left * scaleRatio)
        };
    };

    /**
     * Crete new simple size object from region
     *
     * @param {{left: number, top: number, width: number, height: number}} region
     * @returns {{width: number, height: number}} New size object
     */
    GeometryUtils.createSizeFromRegion = function(region) {
        return GeometryUtils.createSize(region.width, region.height);
    };

    /**
     * Check if a region is intersected with the current region.
     *
     * @param {{left: number, top: number, width: number, height: number}} region1 First region
     * @param {{left: number, top: number, width: number, height: number}} region2 Second region
     * @return {boolean} True if the regions are intersected, false otherwise.
     */
    GeometryUtils.isRegionsIntersected = function (region1, region2) {
        var aRight = region1.left + region1.width;
        var aBottom = region1.top + region1.height;
        var bRight = region2.left + region2.width;
        var bBottom = region2.top + region2.height;

        return (((region1.left <= region2.left && region2.left <= aRight) || (region2.left <= region1.left && region1.left <= bRight))
            && ((region1.top <= region2.top && region2.top <= aBottom) || (region2.top <= region1.top && region1.top <= bBottom)));
    };

    /**
     * Get the intersection of two regions
     *
     * @param {{left: number, top: number, width: number, height: number}} region1 The first region object
     * @param {{left: number, top: number, width: number, height: number}} region2 The second region object
     * @returns {{left: number, top: number, width: number, height: number}}
     */
    GeometryUtils.intersect = function (region1, region2) {
        if (!GeometryUtils.isRegionsIntersected(region1, region2)) {
            return GeometryUtils.createRegion(0, 0, 0, 0);
        }

        var top = Math.max(region1.top, region2.top);
        var left = Math.max(region1.left, region2.left);
        var bottom = Math.min(region1.top + region1.height, region2.top + region2.height);
        var right = Math.min(region1.left + region1.width, region2.left + region2.width);
        return GeometryUtils.createRegion(left, top, right - left, bottom - top);
    };

    /**
     *Check if a specified location is contained within this region.
     *
     * @param {{left: number, top: number, width: number, height: number}} region
     * @param {{x: number, y: number}} location
     * @returns {boolean} rue if the location is contained within this region, false otherwise.
     */
    GeometryUtils.isRegionContainsLocation = function (region, location) {
        return (region.left <= location.x
            && (region.left + region.width) > location.x
            && region.top <= location.y
            && (region.top + region.height) > location.y);
    };

    /**
     * Check if a specified region is contained within the another region.
     *
     * @param {{left: number, top: number, width: number, height: number}} region1
     * @param {{left: number, top: number, width: number, height: number}} region2
     * @return {boolean} True if the region is contained within the another region, false otherwise.
     */
    GeometryUtils.isRegionContainsRegion = function (region1, region2) {
        var right = this.left + this.width;
        var otherRight = region2.left + region2.width;

        var bottom = this.top + this.height;
        var otherBottom = region2.top + region2.height;
        return this.top <= region2.top && this.left <= region2.left && bottom >= otherBottom && right >= otherRight;
    };

    /**
     * Returns a list of sub-regions which compose the current region.
     *
     * @param {{left: number, top: number, width: number, height: number}} region The region from which we want to extract the sub regions.
     * @param {{width: number, height: number}} subRegionSize The default sub-region size to use.
     * @param isFixedSize If {@code false}, then sub-regions might have a size which is smaller then {@code subRegionSize}
     *  (thus there will be no overlap of regions). Otherwise, all sub-regions will have the same size, but sub-regions might overlap.
     * @return {Array.<{left: number, top: number, width: number, height: number}>} The sub-regions composing the current region.
     * If {@code subRegionSize} is equal or greater than the current region, only a single region is returned.
     */
    GeometryUtils.getSubRegions = function (region, subRegionSize, isFixedSize) {
        if (isFixedSize) {
            return GeometryUtils.getSubRegionsWithFixedSize(region, subRegionSize);
        }

        return GeometryUtils.getSubRegionsWithVaryingSize(region, subRegionSize);
    };

    /**
     * @param {{left: number, top: number, width: number, height: number}} region The region to divide into sub-regions.
     * @param {{width: number, height: number}} subRegionSize The maximum size of each sub-region.
     * @return {Array.<{left: number, top: number, width: number, height: number}>} The sub-regions composing the current region.
     * If subRegionSize is equal or greater than the current region,  only a single region is returned.
     */
    GeometryUtils.getSubRegionsWithFixedSize = function (region, subRegionSize) {
        ArgumentGuard.notNull(region, "containerRegion");
        ArgumentGuard.notNull(subRegionSize, "subRegionSize");

        var subRegions = [];

        // Normalizing.
        var subRegionWidth = Math.min(region.width, subRegionSize.width);
        var subRegionHeight = Math.min(region.height, subRegionSize.height);

        // If the requested size is greater or equal to the entire region size, we return a copy of the region.
        if (subRegionWidth === region.width && subRegionHeight === region.height) {
            subRegions.push({left: region.left, top: region.top, width: region.width, height: region.height});
            return subRegions;
        }

        var currentTop = region.top;
        var bottom = region.top + region.height - 1;
        var right = region.left + region.width - 1;

        while (currentTop <= bottom) {

            if (currentTop + subRegionHeight > bottom) {
                currentTop = (bottom - subRegionHeight) + 1;
            }

            var currentLeft = region.left;
            while (currentLeft <= right) {
                if (currentLeft + subRegionWidth > right) {
                    currentLeft = (right - subRegionWidth) + 1;
                }

                subRegions.push({left: currentLeft, top: currentTop, width: subRegionWidth, height: subRegionHeight});
                currentLeft += subRegionWidth;
            }
            currentTop += subRegionHeight;
        }
        return subRegions;
    };

    /**
     * @param {{left: number, top: number, width: number, height: number}} region The region to divide into sub-regions.
     * @param {{width: number, height: number}} maxSubRegionSize The maximum size of each sub-region (some regions might be smaller).
     * @return {Array.<{left: number, top: number, width: number, height: number}>} The sub-regions composing the current region.
     * If maxSubRegionSize is equal or greater than the current region, only a single region is returned.
     */
    GeometryUtils.getSubRegionsWithVaryingSize = function (region, maxSubRegionSize) {
        ArgumentGuard.notNull(region, "containerRegion");
        ArgumentGuard.notNull(maxSubRegionSize, "maxSubRegionSize");
        ArgumentGuard.greaterThanZero(maxSubRegionSize.width, "maxSubRegionSize.width");
        ArgumentGuard.greaterThanZero(maxSubRegionSize.height, "maxSubRegionSize.height");

        var subRegions = [];

        var currentTop = region.top;
        var bottom = region.top + region.height;
        var right = region.left + region.width;

        while (currentTop < bottom) {

            var currentBottom = currentTop + maxSubRegionSize.height;
            if (currentBottom > bottom) { currentBottom = bottom; }

            var currentLeft = region.left;
            while (currentLeft < right) {
                var currentRight = currentLeft + maxSubRegionSize.width;
                if (currentRight > right) { currentRight = right; }

                var currentHeight = currentBottom - currentTop;
                var currentWidth = currentRight - currentLeft;

                subRegions.push({left: currentLeft, top: currentTop, width: currentWidth, height: currentHeight});
                currentLeft += maxSubRegionSize.width;
            }
            currentTop += maxSubRegionSize.height;
        }
        return subRegions;
    };

    /**
     * Translates this location by the specified amount (in place!).
     *
     * @param {{x: number, y: number}} location The original location
     * @param {{x: number, y: number}} offset The amount of the offset
     * @returns {{x: number, y: number}}
     */
    GeometryUtils.locationOffset = function (location, offset) {
        return {
            x: location.x + offset.x,
            y: location.y + offset.y
        };
    };

    /**
     * Translates this region by the specified amount (in place!).
     *
     * @param {{left: number, top: number, width: number, height: number}} region The original region
     * @param {{x: number, y: number}} offset The amount of the offset
     * @returns {{left: number, top: number, width: number, height: number}}
     */
    GeometryUtils.regionOffset = function (region, offset) {
        return {
            top: region.top + offset.x,
            left: region.left + offset.y,
            width: region.width,
            height: region.height
        };
    };

    /**
     * @param {{left: number, top: number, width: number, height: number}} region The region
     * @returns {{x: number, y: number}}
     */
    GeometryUtils.getMiddleOffsetOfRegion = function (region) {
        return {
            x: region.width / 2,
            y: region.height / 2
        };
    };

    module.exports = GeometryUtils;
}());
