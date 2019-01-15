/* Type definitions for eyes.utils 0.0.1 */
// Project: https://github.com/applitools/eyes.utils
// Definitions by: Oleh Astappiev <https://github.com/astappev>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4

/// <reference types="node"/>
/// <reference types="png-async"/>

import * as stream from 'stream';
import { Image } from 'png-async';


export interface Location {
    x: number;
    y: number;
}


export interface RectangleSize {
    width: number;
    height: number;
}


export interface Region {
    left: number;
    top: number;
    width: number;
    height: number;
}


export declare class ArgumentGuard {
    /**
     * Fails if the input parameter equals the input value.
     * @param param The input parameter.
     * @param value The input value.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static notEqual(param: any, value: any, paramName: string): void;
    /**
     * Fails if the input parameter is null.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static notNull(param: any, paramName: string): void;
    /**
     * Fails if the input parameter is not null.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static isNull(param: any, paramName: string): void;
    /**
     * Fails if the input parameter string is null or empty.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static notNullOrEmpty(param: any, paramName: string): void;
    /**
     * Fails if the input integer parameter is negative.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static greaterThanOrEqualToZero(param: any, paramName: string): void;
    /**
     * Fails if the input integer parameter is smaller than 1.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static greaterThanZero(param: any, paramName: string): void;
    /**
     * Fails if the input integer parameter is equal to 0.
     * @param param The input parameter.
     * @param paramName The input parameter name.
     * @throws {Error}
     */
    static notZero(param: any, paramName: string): void;
    /**
     * Fails if isValid is false.
     * @param isValid Whether the current state is valid.
     * @param errMsg The input parameter name.
     * @throws {Error}
     */
    static isValidState(isValid: boolean, errMsg: string): void;
    /**
     * Fails if isValid is false.
     * @param param The input parameter.
     * @param type The expected param type.
     * @throws {Error}
     */
    static isValidType(param: any, type: any): void;
}


export declare class GeneralUtils {
    /**
     * Concatenate the url to the suffix - making sure there are no double slashes
     * @param url The left side of the URL.
     * @param suffix The right side.
     **/
    static urlConcat(url: string, suffix: string): string;
    /**
     * Convert object into json string
     **/
    static toJson(o: any): string;
    /**
     * Mixin methods from one object into another. Follow the prototype chain and apply form root to current - but skip the top
     * @param to The object to which methods will be added
     * @param from The object from which methods will be copied
     */
    static mixin(to: any, from: any): void;
    /**
     * Generate GUID
     **/
    static guid(): string;
    /**
     * Clone object
     **/
    static clone<T>(obj: T): T;
    /**
     * Object.assign() polyfill
     **/
    static objectAssign(target: any, ...source: any[]): any;
    /**
     * Creates a property with default configuration (writable, enumerable, configurable).
     * @param obj The object to create the property on.
     * @param name The name of the property
     * @param getFunc The getter of the property
     * @param setFunc The setter of the property
     */
    static definePropertyWithDefaultConfig(obj: any, name: string, getFunc: () => any, setFunc: (val: any) => void): void;
    /**
     * Creates a property with default configuration (writable, enumerable, configurable) and default getter/setter.
     * @param obj The object to create the property on.
     * @param name The name of the property
     */
    static defineStandardProperty(obj: any, name: string): void;
    /**
     * Waits a specified amount of time before resolving the returned promise.
     * @param ms The amount of time to sleep in milliseconds.
     * @param promiseFactory
     * @return A promise which is resolved when sleep is done.
     */
    static sleep(ms: number, promiseFactory: PromiseFactory): Promise<void>;
    /**
     * @deprecated use GeneralUtils.toRfc1123DateTime() instead
     */
    static getRfc1123Date(date?: Date): string;
    /**
     * Convert a Date object to a RFC-1123 date string
     * @param [date=new Date()] Date which will be converted
     * @return String formatted as RFC-1123 (E, dd MMM yyyy HH:mm:ss 'GMT')
     */
    static toRfc1123DateTime(date?: Date): string;
    /**
     * Convert a Date object to a ISO-8601 date string
     * @param [date=new Date()] Date which will be converted
     * @return String formatted as ISO-8601 (yyyy-MM-dd'T'HH:mm:ss'Z')
     */
    static toISO8601DateTime(date?: Date): string;
}


export declare class GeometryUtils {
    /**
     * Crate new simple region object from values
     **/
    static createRegion(left: number, top: number, width: number, height: number): Region;
    /**
     * Check if the given object contains all region's attributes
     * @return True if the object has all region's attributes, false otherwise.
     **/
    static isRegion(object: any): boolean;
    /**
     * Crate new simple region object from location and size objects
     **/
    static createRegionFromLocationAndSize(location: Location, size: RectangleSize): Region;
    /**
     * Crate new simple region object from location and size objects
     * @return True if the region is empty, false otherwise.
     **/
    static isRegionEmpty(region: Region): boolean;
    /**
     * Crete new simple location object from values
     **/
    static createLocation(left: number, top: number): Location;
    /**
     * Check if the given object contains all location's attributes
     * @return true if the object has all location's attributes, false otherwise.
     **/
    static isLocation(object: any): boolean;
    /**
     * Crete new simple location object from region
     **/
    static createLocationFromRegion(region: Region): Location;
    /**
     * Crete new simple location object from region
     **/
    static createLocationFromLocation(location: Location): Location;
    /**
     * Crete new simple size object from values
     **/
    static createSize(width: number, height: number): RectangleSize;
    /**
     * Check if the given object contains all size's attributes
     * @return true if the object has all size's attributes, false otherwise.
     **/
    static isSize(object: object): boolean;
    /**
     * Get a scaled location.
     * @param location
     * @param scaleRatio The ratio by which to scale the results.
     * @returns A scaled copy of the current location.
     **/
    static scaleLocation(location: Location, scaleRatio: number): Location;
    /**
     * Get a scaled version of the current size.
     * @param size
     * @param scaleRatio The ratio by which to scale the results.
     * @returns A scaled version of the current size.
     **/
    static scaleSize(size: RectangleSize, scaleRatio: number): RectangleSize;
    /**
     * Get a region which is a scaled version of the current region.
     * IMPORTANT: This also scales the LOCATION(!!) of the region (not just its size).
     * @param region
     * @param scaleRatio The ratio by which to scale the results.
     * @returns A new region which is a scaled version of the current region.
     **/
    static scaleRegion(region: Region, scaleRatio: number): Region;
    /**
     * Crete new simple size object from region
     **/
    static createSizeFromRegion(region: Region): RectangleSize;
    /**
     * Check if a region is intersected with the current region.
     * @return True if the regions are intersected, false otherwise.
     **/
    static isRegionsIntersected(region1: Region, region2: Region): boolean;
    /**
     * Get the intersection of two regions
     **/
    static intersect(region1: Region, region2: Region): Region;
    /**
     * Check if a specified location is contained within this region.
     * @returns True if the location is contained within this region, false otherwise.
     **/
    static isRegionContainsLocation(region: Region, location: Location): boolean;
    /**
     * Check if a specified region is contained within the another region.
     * @returns True if the region is contained within the another region, false otherwise.
     **/
    static isRegionContainsRegion(region1: Region, region2: Region): boolean;
    /**
     * Returns a list of sub-regions which compose the current region.
     * @param region The region from which we want to extract the sub regions.
     * @param subRegionSize The default sub-region size to use.
     * @param isFixedSize If {@code false}, then sub-regions might have a size which is smaller then {@code subRegionSize}
     *  (thus there will be no overlap of regions). Otherwise, all sub-regions will have the same size, but sub-regions might overlap.
     * @return The sub-regions composing the current region. If {@code subRegionSize} is equal or greater than the
     *   current region, only a single region is returned.
     */
    static getSubRegions(region: Region, subRegionSize: RectangleSize, isFixedSize: boolean): Region[];
    /**
     * @param region The region to divide into sub-regions.
     * @param subRegionSize The maximum size of each sub-region.
     * @return The sub-regions composing the current region. If subRegionSize is equal or greater than the current
     *   region, only a single region is returned.
     */
    static getSubRegionsWithFixedSize(region: Region, subRegionSize: RectangleSize): Region[];
    /**
     * @param region The region to divide into sub-regions.
     * @param maxSubRegionSize The maximum size of each sub-region (some regions might be smaller).
     * @return The sub-regions composing the current region. If maxSubRegionSize is equal or greater than the current
     *   region, only a single region is returned.
     */
    static getSubRegionsWithVaryingSize(region: Region, maxSubRegionSize: RectangleSize): Region[];
    /**
     * Translates this location by the specified amount (in place!).
     * @param location The original location
     * @param offset The amount of the offset
     */
    static locationOffset(location: Location, offset: Location): Location;
    /**
     * Translates this region by the specified amount (in place!).
     * @param region The original region
     * @param offset The amount of the offset
     */
    static regionOffset(region: Region, offset: Location): Region;
    /**
     * @param region The region
     */
    static getMiddleOffsetOfRegion(region: Region): Location;
}


export declare class ImageDeltaCompressor {
    /**
     * Compresses a target image based on a difference from a source image.
     * @param targetData The image we want to compress.
     * @param targetBuffer
     * @param sourceData The baseline image by which a compression will be performed.
     * @param [blockSize=10] How many pixels per block.
     * @return The compression result.
     * @throws java.io.IOException If there was a problem reading/writing from/to the streams which are created during the process.
     */
    static compressByRawBlocks(targetData: Image, targetBuffer: Buffer, sourceData: Image, blockSize?: number): Buffer;
}


export declare class ImageUtils {
    /**
     * Processes a PNG buffer - returns it as parsed Image.
     * @param buffer Original image as PNG Buffer
     * @param promiseFactory
     * @returns Decoded png image with byte buffer
     **/
    static parseImage(buffer: Buffer, promiseFactory: PromiseFactory): Promise<Image>;
    /**
     * Repacks a parsed Image to a PNG buffer.
     * @param image Parsed image as returned from parseImage
     * @param promiseFactory
     * @returns PNG buffer which can be written to file or base64 string
     **/
    static packImage(image: Image, promiseFactory: PromiseFactory): Promise<Buffer>;
    /**
     * Scaled a parsed image by a given factor.
     * @param image Will be modified
     * @param scaleRatio factor to multiply the image dimensions by (lower than 1 for scale down)
     * @param promiseFactory
     **/
    static scaleRatio(image: Image, scaleRatio: number, promiseFactory: PromiseFactory): Promise<void|Image>;
    /**
     * Resize a parsed image by a given dimensions.
     * @param image Will be modified
     * @param targetWidth The width to resize the image to
     * @param targetHeight The height to resize the image to
     * @param promiseFactory
     **/
    static resizeImage(image: Image, targetWidth: number, targetHeight: number, promiseFactory: PromiseFactory): Promise<void|Image>;
    /**
     * Crops a parsed image - the image is changed
     * @param image Will be modified
     * @param region Region to crop
     * @param promiseFactory
     **/
    static cropImage(image: Image, region: Region, promiseFactory: PromiseFactory): Promise<void|Image>;
    /**
     * Rotates a parsed image - the image is changed
     * @param image Will be modified
     * @param deg how many degrees to rotate (in actuality it's only by multipliers of 90)
     * @param promiseFactory
     **/
    static rotateImage(image: Image, deg: number, promiseFactory: PromiseFactory): Promise<void|Image>;
    /**
     * Copies pixels from the source image to the destination image.
     * @param dstImage The destination image.
     * @param dstPosition The pixel which is the starting point to copy to.
     * @param srcImage The source image.
     * @param srcPosition The pixel from which to start copying.
     * @param size The region to be copied.
     **/
    static copyPixels(dstImage: Image, dstPosition: Location, srcImage: Image, srcPosition: Location, size: RectangleSize): void;
    /**
     * Stitches the given parts to a full image.
     * @param fullSize The size of the stitched image.
     * @param  parts The parts to stitch into an image.
     * @param promiseFactory
     * @return A promise which resolves to the stitched image.
     */
    static stitchImage(fullSize: RectangleSize, parts: {position: Location, size: RectangleSize, image: Buffer}[], promiseFactory: PromiseFactory): Promise<Image>;
    /**
     * Get png size from image buffer. Don't require parsing the image
     **/
    static getImageSizeFromBuffer(imageBuffer: Buffer): RectangleSize;
    static saveImage(imageBuffer: Buffer, filename: string, promiseFactory: PromiseFactory): Promise<void>;
}


/**
 * After initialization, provides factory methods for creating deferreds/promises.
 */
export declare class PromiseFactory {
    /**
     * @param promiseFactoryFunc A function which receives as a parameter the same function you would pass to a Promise constructor.
     * @param deferredFactoryFunc A function which returns a deferred.
     */
    constructor(promiseFactoryFunc: () => any, deferredFactoryFunc: () => any);
    /**
     * Sets the factory methods which will be used to create promises and deferred-s.
     * @param promiseFactoryFunc A function which receives as a parameter the same function you would pass to a Promise constructor.
     * @param deferredFactoryFunc A function which returns a deferred.
     */
    setFactoryMethods(promiseFactoryFunc: () => any, deferredFactoryFunc: () => any): void;
    makePromise(asyncAction: () => any): any;
    /**
     * @deprecated
     */
    makeDeferred(): any;
    resolve<T>(value?: T): Promise<T>;
    reject<T>(value?: T): Promise<T>;
    all(promises: Promise<any>[]): Promise<any[]>;
    promiseWhile(condition: () => boolean, action: () => Promise<any>): Promise<void>;
}


/**
 * Encapsulates getter/setter behavior. (e.g., set only once etc.).
 */
export declare class PropertyHandler<T> {
    /**
     * @param obj The object to set.
     * @return {@code true} if the object was set, {@code false} otherwise.
     */
    set(obj: T): boolean;
    /**
     * @return The object that was set. (Note that object might also be set in the constructor of an implementation class).
     */
    get(): T;
}


/**
 * A property handler for read-only properties (i.e., set always fails).
 */
export declare class ReadOnlyPropertyHandler<T> extends PropertyHandler<T> {
    /**
     * @param logger
     * @param obj The object to set.
     */
    constructor(logger: any, obj?: T);
}


/**
 * A simple implementation of {@link PropertyHandler}. Allows get/set.
 */
export declare class SimplePropertyHandler<T> extends PropertyHandler<T> {
    /**
     * @param obj The object to set.
     */
    constructor(obj?: T);
}


export declare namespace StreamUtils {
    export class ReadableBufferStream extends stream.Readable {
        /**
         * @param buffer The buffer to be used as the stream's source.
         * @param options An "options" object to be passed to the stream constructor.
         */
        constructor(buffer: Buffer, options?: object);
    }


    export class WritableBufferStream extends stream.Writable {
        /**
         * @param options An "options" object to be passed to the stream constructor.
         */
        constructor(options?: object);
        /**
         * @return The buffer which contains the chunks written up to this point.
         */
        writeInt(value: number): Buffer;
        /**
         * @return The buffer which contains the chunks written up to this point.
         */
        writeShort(value: number): Buffer;
        /**
         * @return The buffer which contains the chunks written up to this point.
         */
        writeByte(value: number): Buffer;
        /**
         * @return The buffer which contains the chunks written up to this point.
         */
        getBuffer(): Buffer;
        /**
         * Resets the buffer which contains the chunks written so far.
         * @return The buffer which contains the chunks written up to the reset.
         */
        resetBuffer(): Buffer;
    }
}

export enum BrowserNames {
    Edge = 'Edge',
    IE = 'IE',
    Firefox = 'Firefox',
    Chrome = 'Chrome',
    Safari = 'Safari',
    Chromium = 'Chromium'
}

export enum OSNames {
    Unknown = 'Unknown',
    Windows = 'Windows',
    IOS = 'IOS',
    Macintosh = 'Macintosh',
    ChromeOS = 'ChromeOS'
}

export class UserAgent {
    /**
     * @param userAgent User agent string to parse
     * @param unknowns Whether to treat unknown products as {@code UNKNOWN} or throw an exception.
     * @return A representation of the user agent string.
     */
    static parseUserAgentString(userAgent: string, unknowns: boolean) : UserAgent;

    getBrowser(): string;

    getBrowserMajorVersion(): string;

    getBrowserMinorVersion(): string;

    getOS(): string;

    getOSMajorVersion(): string;

    getOSMinorVersion(): string;
}
