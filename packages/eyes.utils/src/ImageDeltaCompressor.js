(function () {
    'use strict';

    var zlib = require('zlib'),
        WritableBufferStream = require('./StreamUtils').WritableBufferStream;

    var PREAMBLE = new Buffer("applitools", "utf8");
    var COMPRESS_BY_RAW_BLOCKS_FORMAT = 3;
    var DEFLATE_BUFFER_RATE = 0.6;

    /**
     * Provides image compression based on delta between consecutive images
     */
    var ImageDeltaCompressor = {};

    /**
     * Computes the width and height of the image data contained in the block at the input column and row.
     *
     * @private
     * @param {{width: number, height: number}} imageSize The image size in pixels.
     * @param {number} blockSize The block size for which we would like to compute the image data width and height.
     * @param {number} blockColumn The block column index
     * @param {number} blockRow The block row index
     * @return {{width: number, height: number}} The width and height of the image data contained in the block.
     */
    function _getActualBlockSize(imageSize, blockSize, blockColumn, blockRow) {
        var actualWidth = Math.min(imageSize.width - (blockColumn * blockSize), blockSize);
        var actualHeight = Math.min(imageSize.height - (blockRow * blockSize), blockSize);

        return {
            width: actualWidth,
            height: actualHeight
        };
    }

    /**
     *
     * @param {Buffer} sourcePixels
     * @param {Buffer} targetPixels
     * @param {{width: number, height: number}} imageSize
     * @param {number} pixelLength
     * @param {number} blockSize
     * @param {number} blockColumn
     * @param {number} blockRow
     * @param {number} channel
     * @return {{isIdentical: boolean, buffer: Buffer}}
     * @private
     */
    function _compareAndCopyBlocks(sourcePixels, targetPixels, imageSize, pixelLength, blockSize, blockColumn, blockRow, channel) {
        var isIdentical = true; // initial default

        // Getting the actual amount of data in the block we wish to copy
        var actualBlockSize = _getActualBlockSize(imageSize, blockSize, blockColumn, blockRow);

        var actualBlockHeight = actualBlockSize.height;
        var actualBlockWidth = actualBlockSize.width;

        var stride = imageSize.width * pixelLength;

        // The number of bytes actually contained in the block for the
        // current channel (might be less than blockSize*blockSize)
        var channelBytes = new Buffer(actualBlockHeight * actualBlockWidth);
        var channelBytesOffset = 0;

        // Actually comparing and copying the pixels
        var sourceByte, targetByte;
        for (var h = 0; h < actualBlockHeight; ++h) {
            var offset = (((blockSize * blockRow) + h) * stride) + (blockSize * blockColumn * pixelLength) + channel;
            for (var w = 0; w < actualBlockWidth; ++w) {
                sourceByte = sourcePixels[offset];
                targetByte = targetPixels[offset];
                if (sourceByte !== targetByte) {
                    isIdentical = false;
                }

                // noinspection IncrementDecrementResultUsedJS
                channelBytes[channelBytesOffset++] = targetByte;
                offset += pixelLength;
            }
        }

        return {
            isIdentical: isIdentical,
            buffer: channelBytes
        };
    }

    /**
     * @param {Buffer} pixels
     * @param {number} pixelLength
     * @return {Buffer}
     */
    function _rgbaToAbgrColors(pixels, pixelLength) {
        var r,g,b,a;
        for (var offset = 0, length = pixels.length; offset < length; offset += pixelLength) {
            r = pixels[offset];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];

            pixels[offset] = a;
            pixels[offset + 1] = b;
            pixels[offset + 2] = g;
            pixels[offset + 3] = r;
        }
        return pixels;
    }

    /**
     * Compresses a target image based on a difference from a source image.
     * {@code blockSize} defaults to 10.
     * @param {Image} targetData The image we want to compress.
     * @param {Buffer} targetBuffer
     * @param {Image} sourceData The baseline image by which a compression will be performed.
     * @param {number} [blockSize=10] How many pixels per block.
     * @return {Buffer} The compression result.
     * @throws java.io.IOException If there was a problem reading/writing from/to the streams which are created during the process.
     */
    ImageDeltaCompressor.compressByRawBlocks = function (targetData, targetBuffer, sourceData, blockSize) {
        if (!blockSize) {
            blockSize = 10;
        }

        // If there's no image to compare to, or the images are in different
        // sizes, we simply return the encoded target.
        if (!targetData || !sourceData || (sourceData.width !== targetData.width) || (sourceData.height !== targetData.height)) {
            return targetBuffer;
        }

        // The number of bytes comprising a pixel (depends if there's an Alpha channel).
        // target.data[25] & 4 equal 0 if there is no alpha channel but 4 if there is an alpha channel.
        // IMPORTANT: png-async always return data in following format RGBA.
        var pixelLength = 4;
        var imageSize = {width: targetData.width, height: targetData.height};

        // IMPORTANT: Notice that the pixel bytes are (A)RGB!
        var targetPixels = _rgbaToAbgrColors(targetData.data, pixelLength);
        var sourcePixels = _rgbaToAbgrColors(sourceData.data, pixelLength);

        // Calculating how many block columns and rows we've got.
        var blockColumnsCount = Math.floor((targetData.width / blockSize) + ((targetData.width % blockSize) === 0 ? 0 : 1));
        var blockRowsCount = Math.floor((targetData.height / blockSize) + ((targetData.height % blockSize) === 0 ? 0 : 1));

        // Writing the header
        var stream = new WritableBufferStream();
        var blocksStream = new WritableBufferStream();
        stream.write(PREAMBLE);
        stream.write(new Buffer([COMPRESS_BY_RAW_BLOCKS_FORMAT]));

        // since we don't have a source ID, we write 0 length (Big endian).
        stream.writeShort(0);
        // Writing the block size (Big endian)
        stream.writeShort(blockSize);

        var compareResult;
        for (var channel = 0; channel < 3; ++channel) {

            // The image is RGB, so all that's left is to skip the Alpha
            // channel if there is one.
            var actualChannelIndex = (pixelLength === 4) ? channel + 1 : channel;

            var blockNumber = 0;
            for (var blockRow = 0; blockRow < blockRowsCount; ++blockRow) {
                for (var blockColumn = 0; blockColumn < blockColumnsCount; ++blockColumn) {

                    compareResult = _compareAndCopyBlocks(sourcePixels, targetPixels, imageSize, pixelLength, blockSize, blockColumn, blockRow, actualChannelIndex);

                    if (!compareResult.isIdentical) {
                        blocksStream.writeByte(channel);
                        blocksStream.writeInt(blockNumber);
                        blocksStream.write(compareResult.buffer);

                        // If the number of bytes already written is greater then the number of bytes for the uncompressed target, we just return the uncompressed target.
                        if ((stream.getBuffer().length + blocksStream.getBuffer().length * DEFLATE_BUFFER_RATE) > targetBuffer.length) {
                            return targetBuffer;
                        }
                    }

                    ++blockNumber;
                }
            }
        }

        stream.write(zlib.deflateRawSync(blocksStream.getBuffer(), {
            level: zlib.Z_BEST_COMPRESSION
        }));

        if (stream.getBuffer().length > targetBuffer.length) {
            return targetBuffer;
        }

        return stream.getBuffer();
    };

    exports.ImageDeltaCompressor = ImageDeltaCompressor;
}());
