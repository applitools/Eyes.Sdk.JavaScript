(function () {
  'use strict';

  var winston = require('winston'),
    timeStringFn = require('./ConsoleLogHandler').getTimeString;

  /**
   * Write log massages to the browser/node console
   *
   * @param {boolean} [isVerbose]
   * @constructor
   **/
  function FileLogHandler(isVerbose) {
    this._isVerbose = !!isVerbose;
    //this._appendToFile = true;
    this._fileName = "eyes.log";
    this._fileDirectory = "./";
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * Whether to handle or ignore verbose log messages.
   *
   * @param {boolean} isVerbose
   */
  FileLogHandler.prototype.setIsVerbose = function (isVerbose) {
    this._isVerbose = !!isVerbose;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * Whether to handle or ignore verbose log messages.
   *
   * @return {boolean} isVerbose
   */
  FileLogHandler.prototype.getIsVerbose = function () {
    return this._isVerbose;
  };

  /**
   * Whether to append messages to the log file or to reset it on open.
   *
   * @param {boolean} shouldAppend
   */
//    FileLogHandler.prototype.setAppendToFile = function (shouldAppend) {
//        this._appendToFile = !!shouldAppend;
//    };

  /**
   * Whether to append messages to the log file or to reset it on open.
   *
   * @return {boolean}
   */
//    FileLogHandler.prototype.getAppendToFile = function () {
//        return this._appendToFile;
//    };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The name of the log file.
   *
   * @param {string} fileName
   */
  FileLogHandler.prototype.setFileName = function (fileName) {
    this._fileName = fileName;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The name of the log file.
   *
   * @return {string} the file name
   */
  FileLogHandler.prototype.getFileName = function () {
    return this._fileName;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The path of the log file folder.
   *
   * @param {string} fileDirectory
   */
  FileLogHandler.prototype.setFileDirectory = function (fileDirectory) {
    this._fileDirectory = fileDirectory;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The path of the log file folder.
   *
   * @return {string} the file Directory
   */
  FileLogHandler.prototype.getFileDirectory = function () {
    return this._fileDirectory;
  };

  FileLogHandler.prototype.open = function () {
    this.close();
    this._logger = new (winston.Logger)({
      exitOnError: false,
      transports: [
        new (winston.transports.File)({
          filename: this._fileName,
          dirname: this._fileDirectory,
          timestamp: timeStringFn,
          json: false
        })
      ]
    });

    return this._logger;
  };

  FileLogHandler.prototype.close = function () {
    if (this._logger) {
      this._logger.close();
      this._logger = undefined;
    }
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * Write a message
   * @param {boolean} verbose - is the message verbose
   * @param {string} message
   */
  FileLogHandler.prototype.onMessage = function (verbose, message) {
    var logger = this._logger || this.open();
    if (!verbose || this._isVerbose) {
      logger.info("Eyes: " + message);
    }
  };

  module.exports = FileLogHandler;
}());
