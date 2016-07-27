(function () {
    "use strict";

    var EyesUtils = require('eyes.utils'),
        RectangleSize = require('./RectangleSize'),
        Location = require('./Location');
    var ArgumentGuard = EyesUtils.ArgumentGuard;

    /**
     * @constructor
     * @param {int} left Left offset value
     * @param {int} top Top offset value
     * @param {int} width Width value
     * @param {int} height Height value
     */
    function Region(left, top, width, height) {
        ArgumentGuard.greaterThanOrEqualToZero(width, "width");
        ArgumentGuard.greaterThanOrEqualToZero(height, "height");

        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    /**
     * Crete a new instance of Region from Location and RectangleSize objects
     *
     * @param {Location} location
     * @param {RectangleSize} size
     * @return {Region} new Region instance
     */
    Region.fromLocation = function (location, size) {
        ArgumentGuard.notNull(location, "location");
        ArgumentGuard.notNull(size, "size");

        return new this(location.getX(), location.getY(), size.getWidth(), size.getHeight());
    };

    /**
     * Create new instance of Region based on existing region
     *
     * @param {Region} other
     * @return {Region} new Region instance
     */
    Region.fromRegion = function (other) {
        ArgumentGuard.notNull(other, "other");

        return new this(other.getLeft(), other.getTop(), other.getWidth(), other.getHeight());
    };

    /**
     * @return {int} hashCode of current instance
     */
    Region.prototype.hashCode = function () {
        return this.left + this.top + this.width + this.height;
    };

    Region.EMPTY = function () {
        return new Region (0, 0, 0, 0);
    };

    var EMPTY = Region.EMPTY();

    /**
     * Reset instance to empty instance params
     */
    Region.prototype.makeEmpty = function () {
        this.left = EMPTY.getLeft();
        this.top = EMPTY.getTop();
        this.width = EMPTY.getWidth();
        this.height = EMPTY.getHeight();
    };

    /**
     * @return {boolean} true if the region is empty, false otherwise.
     */
    Region.prototype.isEmpty = function () {
        return this.getLeft() == EMPTY.getLeft()
            && this.getTop() == EMPTY.getTop()
            && this.getWidth() == EMPTY.getWidth()
            && this.getHeight() == EMPTY.getHeight();
    };

    /**
     * @param {Region} other A Region instance to be checked for equality with the current instance.
     * @return {boolean} true if and only if the input objects are equal by value, false otherwise.
     */
    Region.prototype.equals = function (other) {
        if (other == null) {
            return false;
        }

        if (!(other instanceof Region)) {
            return  false;
        }

        return (this.getLeft() == other.getLeft())
            && (this.getTop() == other.getTop())
            && (this.getWidth() == other.getWidth())
            && (this.getHeight() == other.getHeight());
    };

    /**
     * @return {Location} The (top,left) position of the current region.
     */
    Region.prototype.getLocation = function () {
        return new Location(this.left, this.top);
    };

    /**
     * Offsets the region's location (in place).
     *
     * @param dx The X axis offset.
     * @param dy The Y axis offset.
     */
    Region.prototype.offset = function (dx, dy) {
        this.left += dx;
        this.top += dy;
    };

    /**
     * @return {RectangleSize} The (top,left) position of the current region.
     */
    Region.prototype.getSize = function () {
        return new RectangleSize(this.width, this.height);
    };

    /**
     * Set the (top,left) position of the current region
     * @param {Location} location The (top,left) position to set.
     */
    Region.prototype.setLocation = function (location) {
        ArgumentGuard.notNull(location, "location");

        this.left = location.getX();
        this.top = location.getY();
    };

    /**
     * @param {Region} containerRegion The region to divide into sub-regions.
     * @param {RectangleSize} subRegionSize The maximum size of each sub-region.
     * @return {Array.<Region>} The sub-regions composing the current region. If subRegionSize
     * is equal or greater than the current region,  only a single region is
     * returned.
     */
    Region.prototype.getSubRegionsWithFixedSize = function (containerRegion, subRegionSize) {
        ArgumentGuard.notNull(containerRegion, "containerRegion");
        ArgumentGuard.notNull(subRegionSize, "subRegionSize");

        var subRegions = [];

        var subRegionWidth = subRegionSize.getWidth();
        var subRegionHeight = subRegionSize.getHeight();

        ArgumentGuard.greaterThanZero(subRegionWidth, "subRegionSize width");
        ArgumentGuard.greaterThanZero(subRegionHeight, "subRegionSize height");

        // Normalizing.
        if (subRegionWidth > containerRegion.getWidth()) {
            subRegionWidth = containerRegion.getWidth();
        }
        if (subRegionHeight > containerRegion.getHeight()) {
            subRegionHeight = containerRegion.getHeight();
        }

        // If the requested size is greater or equal to the entire region size,
        // we return a copy of the region.
        if (subRegionWidth == containerRegion.getWidth() &&
            subRegionHeight == containerRegion.getHeight()) {
            subRegions.push(Region.fromRegion(containerRegion));
            return subRegions;
        }

        var currentTop = containerRegion.getTop();
        var bottom = containerRegion.getTop() + containerRegion.getHeight() - 1;
        var right = containerRegion.getLeft() + containerRegion.getWidth() - 1;

        while (currentTop <= bottom) {

            if (currentTop + subRegionHeight > bottom) {
                currentTop = (bottom - subRegionHeight) + 1;
            }

            var currentLeft = containerRegion.getLeft();
            while (currentLeft <= right) {
                if (currentLeft + subRegionWidth > right) {
                    currentLeft = (right - subRegionWidth) + 1;
                }

                subRegions.push(new Region(currentLeft, currentTop, subRegionWidth, subRegionHeight));

                currentLeft += subRegionWidth;
            }
            currentTop += subRegionHeight;
        }
        return subRegions;
    };

    /**
     * @param {Region} containerRegion The region to divide into sub-regions.
     * @param {RectangleSize} maxSubRegionSize The maximum size of each sub-region (some
     *                         regions might be smaller).
     * @return {Array.<Region>} The sub-regions composing the current region. If
     * maxSubRegionSize is equal or greater than the current region,
     * only a single region is returned.
     */
    Region.prototype.getSubRegionsWithVaryingSize = function (containerRegion, maxSubRegionSize) {
        ArgumentGuard.notNull(containerRegion, "containerRegion");
        ArgumentGuard.notNull(maxSubRegionSize, "maxSubRegionSize");
        ArgumentGuard.greaterThanZero(maxSubRegionSize.getWidth(), "maxSubRegionSize.getWidth()");
        ArgumentGuard.greaterThanZero(maxSubRegionSize.getHeight(), "maxSubRegionSize.getHeight()");

        var subRegions = [];

        var currentTop = containerRegion.getTop();
        var bottom = containerRegion.getTop() + containerRegion.getHeight();
        var right = containerRegion.getLeft() + containerRegion.getWidth();

        while (currentTop < bottom) {

            var currentBottom = currentTop + maxSubRegionSize.getHeight();
            if (currentBottom > bottom) { currentBottom = bottom; }

            var currentLeft = containerRegion.getLeft();
            while (currentLeft < right) {
                var currentRight = currentLeft + maxSubRegionSize.getWidth();
                if (currentRight > right) { currentRight = right; }

                var currentHeight = currentBottom - currentTop;
                var currentWidth = currentRight - currentLeft;

                subRegions.push(new Region(currentLeft, currentTop, currentWidth, currentHeight));

                currentLeft += maxSubRegionSize.getWidth();
            }
            currentTop += maxSubRegionSize.getHeight();
        }
        return subRegions;
    };

    /**
     * Returns a list of sub-regions which compose the current region.
     * @param subRegionSize The default sub-region size to use.
     * @param isFixedSize If {@code false}, then sub-regions might have a
     *                      size which is smaller then {@code subRegionSize}
     *                      (thus there will be no overlap of regions).
     *                      Otherwise, all sub-regions will have the same
     *                      size, but sub-regions might overlap.
     * @return {Array.<Region>} The sub-regions composing the current region. If {@code
     * subRegionSize} is equal or greater than the current region,
     * only a single region is returned.
     */
    Region.prototype.getSubRegions = function (subRegionSize, isFixedSize) {
        if (isFixedSize) {
            return this.getSubRegionsWithFixedSize(this, subRegionSize);
        }

        return this.getSubRegionsWithVaryingSize(this, subRegionSize);
    };

    /**
     * Check if a specified location is contained within this region.
     * <p>
     * @param {Location|Region} obj The location or region to check if it is contained within the current region.
     * @return boolean True if the location is contained within this region,
     *          false otherwise.
     */
    Region.prototype.contains = function (obj) {
        if (obj instanceof Location) {
            return obj.getX() >= this.left
                && obj.getX() <= (this.left + this.width)
                && obj.getY() >= this.top
                && obj.getY() <= (this.top + this.height);
        } else if (obj instanceof Region) {
            var right = this.left + this.width;
            var otherRight = obj.getLeft() + obj.getWidth();

            var bottom = this.top + this.height;
            var otherBottom = obj.getTop() + obj.getHeight();

            return this.top <= obj.getTop() && this.left <= obj.getLeft()
                && bottom >= otherBottom && right >= otherRight;
        }
    };

    /**
     * Check if a region is intersected with the current region.
     * @param {Region} other The region to check intersection with.
     * @return boolean True if the regions are intersected, false otherwise.
     */
    Region.prototype.isIntersected = function (other) {
        ArgumentGuard.isValidType(other, Region);

        var right = this.left + this.width;
        var bottom = this.top + this.height;

        var otherLeft = other.getLeft();
        var otherTop = other.getTop();
        var otherRight = otherLeft + other.getWidth();
        var otherBottom = otherTop + other.getHeight();

        return (((this.left <= otherLeft && otherLeft <= right)
        ||  (otherLeft <= this.left && this.left <= otherRight))
        && ((this.top <= otherTop && otherTop <= bottom)
        ||  (otherTop <= this.top && this.top <= otherBottom)));
    };

    /**
     * Replaces this region with the intersection of itself and
     * {@code other}
     * @param {Region} other The region with which to intersect.
     */
    Region.prototype.intersect = function (other) {
        ArgumentGuard.isValidType(other, Region);

        // If there's no intersection set this as the Empty region.
        if (!this.isIntersected(other)) {
            this.makeEmpty();
            return;
        }

        // The regions intersect. So let's first find the left & top values
        var otherLeft = other.getLeft();
        var otherTop = other.getTop();

        var intersectionLeft = (this.left >= otherLeft) ? this.left : otherLeft;
        var intersectionTop = (this.top >= otherTop) ? this.top : otherTop;

        // Now the width and height of the intersect
        var right = this.left + this.width;
        var otherRight = otherLeft + other.getWidth();
        var intersectionRight = (right <= otherRight) ? right : otherRight;
        var intersectionWidth = intersectionRight - intersectionLeft;

        var bottom = this.top + this.height;
        var otherBottom = otherTop + other.getHeight();
        var intersectionBottom = (bottom <= otherBottom) ? bottom : otherBottom;
        var intersectionHeight = intersectionBottom - intersectionTop;

        this.left = intersectionLeft;
        this.top = intersectionTop;
        this.width = intersectionWidth;
        this.height = intersectionHeight;
    };

    /**
     * @return int The left offset of this region
     */
    Region.prototype.getLeft = function () {
        return this.left;
    };

    /**
     * @param {int} left offset value
     */
    Region.prototype.setLeft = function (left) {
        this.left = parseInt(left, 10);
    };

    /**
     * @return int The top offset of this region
     */
    Region.prototype.getTop = function () {
        return this.top;
    };

    /**
     * @param {int} top offset value
     */
    Region.prototype.setTop = function (top) {
        this.top = parseInt(top, 10);
    };

    /**
     * @return int The width of this region
     */
    Region.prototype.getWidth = function () {
        return this.width;
    };

    /**
     * @param {int} width value
     */
    Region.prototype.setWidth = function (width) {
        this.width = parseInt(width, 10);
    };

    /**
     * @return int The height of this region
     */
    Region.prototype.getHeight = function () {
        return this.height;
    };

    /**
     * @param {int} height value
     */
    Region.prototype.setHeight = function (height) {
        this.height = parseInt(height, 10);
    };

    /**
     * @return {Location}
     */
    Region.prototype.getMiddleOffset = function () {
        return new Location(this.width / 2, this.height / 2);
    };

    /**
     * @return {string}
     */
    Region.prototype.toString = function () {
        return "(" + this.left + ", " + this.top + ") " + this.width + "x" + this.height;
    };

    module.exports = Region;
}());