/* Type definitions for eyes.sdk 3.6.0 */
// Project: https://github.com/applitools/eyes.sdk.javascript
// Definitions by: Applitools Team <https://applitools.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4

/// <reference types="node"/>

import { EyesBase, MutableImage, Trigger, EyesSimpleScreenshot, CoordinatesType } from "eyes.sdk";

import { PromiseFactory, PropertyHandler, Location, Region, RectangleSize } from 'eyes.utils';

export { ArgumentGuard, GeneralUtils, GeometryUtils, ImageDeltaCompressor, ImageUtils, PromiseFactory, StreamUtils,
    PropertyHandler, SimplePropertyHandler, ReadOnlyPropertyHandler, Location, Region, RectangleSize } from 'eyes.utils';

export { ConsoleLogHandler, ContextBasedScaleProvider, ContextBasedScaleProviderFactory, CoordinatesType, CutProvider,
    EyesScreenshot, FileLogHandler, FixedCutProvider, FixedScaleProvider, FixedScaleProviderFactory, Logger, LogHandler,
    MatchSettings, MutableImage, NullCutProvider, NullLogHandler, NullScaleProvider, PositionProvider, RegionProvider,
    ScaleProvider, ScaleProviderFactory, ScaleProviderIdentityFactory, ServerConnector, TestResultsFormatter, Triggers } from 'eyes.sdk';

export declare abstract class ImageProvider {
    getScreenshot(): Promise<MutableImage>;
}

export declare abstract class Eyes extends EyesBase {
    /**
     * The main type - to be used by the users of the library to access all functionality.
     * Initializes an Eyes instance.
     *
     * @param serverUrl
     * @param isDisabled set to true to disable Applitools Eyes and use the web driver directly.
     * @param promiseFactory  If not specified will be created using system Promise
     **/
    protected constructor(serverUrl?: string, isDisabled?: boolean, promiseFactory?: PromiseFactory);
    /**
     * Starts a test.
     *
     * @param appName The application being tested.
     * @param testName The test's name.
     * @param imageSize Determines the resolution used for the baseline. {@code null} will automatically grab the resolution from the image.
     * @return {Promise<void>}
     */
    open(appName: string, testName: string, imageSize?: RectangleSize): Promise<void>;
    /**
     * Returns whether is open or not.
     *
     * @return {boolean} - Whether or not session is opened
     */
    isOpen(): boolean;
    /**
     * Perform visual validation for the current image.
     * @param image The image png bytes or ImageProvider.
     * @param tag An optional tag to be associated with the validation checkpoint.
     * @param ignoreMismatch True if the server should ignore a negative result for the visual validation.
     * @param retryTimeout optional timeout for performing the match (ms).
     */
    checkImage(image: Buffer|ImageProvider, tag: string, ignoreMismatch?: boolean, retryTimeout?: number): Promise<{asExpected: boolean}>;
    /**
     * Perform visual validation for the current image.
     *
     * @param region The region of the image which should be verified, or {undefined}/{null} if the entire image should be verified.
     *
     * @param image The image png bytes or ImageProvider.
     * @param tag An optional tag to be associated with the validation checkpoint.
     * @param ignoreMismatch True if the server should ignore a negative result for the visual validation.
     * @param retryTimeout optional timeout for performing the match (ms).
     */
    checkRegion(region: Region, image: Buffer|ImageProvider, tag: string, ignoreMismatch?: boolean, retryTimeout?: number): Promise<{asExpected: boolean}>;
    /**
     * Replaces the actual image in a running session.
     *
     * @param stepIndex - The zero based index of the step in which to replace the image.
     * @param image - The updated image png bytes.
     * @param tag A tag to be associated with the validation checkpoint.
     * @param title A title to be associated with the validation checkpoint.
     * @param userInputs An array of user inputs to which lead to the validation checkpoint.
     */
    replaceImage(stepIndex: number, image: Buffer, tag?: string, title?: string, userInputs?: Trigger[]): Promise<void>;
    /**
     * Takes a screenshot.
     *
     * @return An updated screenshot.
     */
    getScreenShot(): Promise<EyesSimpleScreenshot>;
    /**
     * Get the title.
     *
     * @return The current title of of the AUT.
     */
    getTitle(): Promise<string>;
    /**
     * Set the inferred environment string.
     *
     * @param inferredEnvironment The inferred environment string.
     */
    setInferredEnvironment(inferredEnvironment: string): void;
    /**
     * Get the inferred environment string.
     *
     * @return A promise which resolves to the inferred environment string.
     */
    getInferredEnvironment(): Promise<string>;
    /**
     * Get the viewport size.
     */
    getViewportSize(): Promise<RectangleSize>;
    /**
     * Set the viewport size.
     *
     * @param size The amount to set the viewport size.
     */
    setViewportSize(size: RectangleSize): Promise<void>;
    /**
     * Get the AUT session id.
     */
    getAUTSessionId(): Promise<undefined>;
}
